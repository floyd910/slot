import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { parseFreeSpinSession } from '../src/api/freeSpinsApiClient.js';
import { claimFreeSpinCompletion } from '../src/services/freeSpinCompletionService.js';

const finalSession = {id:'series-30', status:'completed', remaining:0, totalWin:'24.60', currency:'USD', creditedToBalance:true};

test('only a final, credited server total can produce a summary, including zero', () => {
  assert.deepEqual(parseFreeSpinSession(finalSession), {id:'series-30', totalWin:'24.60', currency:'USD'});
  assert.equal(parseFreeSpinSession({...finalSession,totalWin:0}).totalWin,'0.00');
  for (const value of [undefined, null, {...finalSession,status:'active',remaining:15}, {...finalSession,remaining:15}, {...finalSession,creditedToBalance:false}]) {
    assert.equal(parseFreeSpinSession(value), null);
  }
  for (const totalWin of [undefined,null,'',true,-1,'NaN','Infinity','1.001',{},9007199254740992]) {
    assert.throws(() => parseFreeSpinSession({...finalSession,totalWin}), {code:'BACKEND_RESPONSE_ERROR'});
  }
  for (const value of [{...finalSession,id:''}, {...finalSession,currency:''}, {...finalSession,remaining:'0'}, {...finalSession,creditedToBalance:'true'}]) {
    assert.throws(() => parseFreeSpinSession(value), {code:'BACKEND_RESPONSE_ERROR'});
  }
});

test('completion is deduplicated across reconnects and persisted storage', () => {
  const store = new Map();
  const original = globalThis.window;
  globalThis.window = {localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};
  try {
    const context = {playerId:'dedup',gameId:'khiradmandi-makor',sessionId:'login-1'};
    assert.equal(claimFreeSpinCompletion(context,'one'),true);
    assert.equal(claimFreeSpinCompletion({...context,sessionId:'login-2'},'one'),false);
    assert.equal(claimFreeSpinCompletion(context,'two'),true);
    const storedKey = [...store.keys()][0].replace('"one"','"persisted"');
    store.set(storedKey,'shown');
    assert.equal(claimFreeSpinCompletion(context,'persisted'),false);
    assert.equal(claimFreeSpinCompletion({...context,playerId:'another'},'one'),true);
  } finally {globalThis.window=original;}
});

test('settlement displays the server series total once, stops autoplay, and waits for Continue', async () => {
  const originalFetch=globalThis.fetch, originalWindow=globalThis.window;
  const store=new Map();
  globalThis.window={dispatchEvent(){},addEventListener(){},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},sessionStorage:{getItem:()=>null}};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-completion-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {createSpinActions}=await server.ssrLoadModule('/src/controllers/spinActions.js');
    const {mergeRuntimeConfig}=await server.ssrLoadModule('/src/api/runtimeConfig.js');
    mergeRuntimeConfig({backendMode:'soap'});
    for (const totalWin of ['24.60','0.00',null]) {
      const context={playerId:'completion-'+totalWin,gameId:'khiradmandi-makor',token:'fixture'};
      const live={current:{context,status:'ready',freeSpinsLeft:15,freeSpinsTotal:30,freeSpinsWinTotal:9999,spinResult:{WinSum:1.23}}};
      const autoPlayOnRef={current:true}, resumeAutoPlayAfterFreeSpinsRef={current:true};
      const summaries=[], errors=[];
      let requests=0;
      globalThis.fetch=async () => {
        requests++;
        return new Response(JSON.stringify({CountFreeSpin:130, ...(totalWin === null ? {} : {FreeSpinSession:{...finalSession,totalWin}})}));
      };
      const actions=createSpinActions({liveSpinStateRef:live,autoPlayOnRef,resumeAutoPlayAfterFreeSpinsRef,
        setAutoPlayOn:()=>{},setFreeSpinSummary:v=>summaries.push(v),reportOperationError:e=>errors.push(e)});
      // Retriggered spins are still pending: neither a request nor a summary is allowed.
      assert.equal(await actions.settleFreeSpinWins(),false);
      assert.equal(requests,0);
      live.current.freeSpinsLeft=0;
      live.current.freeSpinCountUnknown=true;
      assert.equal(await actions.settleFreeSpinWins(),false);
      live.current.freeSpinCountUnknown=false;
      assert.equal(await actions.settleFreeSpinWins(),true);
      if (totalWin === null) {assert.deepEqual(summaries,[]);continue;}
      assert.equal(summaries.length,1);
      assert.equal(summaries[0].totalWin,totalWin);
      assert.equal(autoPlayOnRef.current,false);
      assert.equal(resumeAutoPlayAfterFreeSpinsRef.current,false);
      assert.equal(await actions.handleSpin(),null);
      await actions.settleFreeSpinWins();
      assert.equal(summaries.length,1);
      actions.continueAfterFreeSpins();
      assert.equal(live.current.freeSpinSummary,null);
      await actions.settleFreeSpinWins();
      assert.equal(summaries.length,2); // One dialog and its explicit close; no repeated dialog.
      assert.equal(summaries[1],null);
      assert.equal(errors.length,0);
    }
  } finally {globalThis.fetch=originalFetch;globalThis.window=originalWindow;await server.close();}
});

test('summary renders the requested Russian text and explicit zero result', async () => {
  const server=await createServer({configFile:false,esbuild:{jsx:'automatic'},optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-summary-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {LanguageProvider}=await server.ssrLoadModule('/src/i18n.jsx');
    const {default:Summary}=await server.ssrLoadModule('/src/components/freeSpinsPrompt/FreeSpinsSummary.jsx');
    for (const totalWin of ['24.60','0.00']) {
      const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Summary,{result:{totalWin,currency:'USD'},onContinue(){}})));
      assert.match(html,/ФРИСПИНЫ ЗАВЕРШЕНЫ!/);
      assert.match(html,/ПРОДОЛЖИТЬ/);
      assert.ok(html.includes(totalWin));
      assert.match(html,/USD/);
      assert.match(html,/role="dialog"/);
      if (totalWin==='24.60') {
        assert.match(html,/Вы выиграли за Free Spins/);
        assert.match(html,/Выигрыш зачислен на баланс/);
      } else assert.match(html,/Выигрыш:/);
    }
  } finally {await server.close();}
});
