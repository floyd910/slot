import {freeSpinSeries} from '../src/services/freeSpinSeries.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveParentOrigin, readHostMessage, normalizeHostInit } from '../src/api/frameLaunch.js';
import { SessionApiService } from '../src/services/sessionApiService.js';
import { mergeRuntimeConfig } from '../src/api/runtimeConfig.js';

test('trusted parent requires configured origin, parent window, and contract version',()=>{
  const parent={},other={};const origin='https://partner.example';
  const event={source:parent,origin,data:{source:'hiranmandi-host',contractVersion:'1.0',type:'INIT_CONTEXT'}};
  assert.equal(resolveParentOrigin([origin],origin+'/games',true),origin);
  assert.equal(resolveParentOrigin([origin],'https://evil.example',true),'');
  assert.equal(resolveParentOrigin([],origin,true),'');
  assert.equal(resolveParentOrigin([origin],origin,false),'');
  assert.equal(readHostMessage(event,parent,origin,true),event.data);
  assert.equal(readHostMessage({...event,source:other},parent,origin,true),null);
  assert.equal(readHostMessage({...event,origin:'https://evil.example'},parent,origin,true),null);
  assert.equal(readHostMessage(event,parent,origin,false),null);
  assert.equal(readHostMessage({...event,data:{...event.data,contractVersion:'9'}},parent,origin,true),null);
});
test('host init accepts only launch fields, never fake session or endpoint overrides',()=>{
  const init=normalizeHostInit({token:"fixture",playerId:7,sessionId:'fake',password:'secret',sessionApiBaseUrl:'https://evil.example',allowedOrigins:['*'],backendMode:'mock',demoMode:true},'khiradmandi-makor');
  assert.equal(init.sessionId,null);assert.equal(init.playerId,'7');assert.equal(init.demoMode,true);
  assert.equal(init.password,undefined);assert.equal(init.sessionApiBaseUrl,undefined);assert.equal(init.allowedOrigins,undefined);assert.equal(init.backendMode,'soap');
  assert.equal(normalizeHostInit({playerId:7},'game'),null);
});
test('real init is required even with supplied session; zero balance is retained',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;let calls=0;
  const service=new SessionApiService();
  const params={token:"fixture",playerId:7,gameId:'khiradmandi-makor',initSource:'postMessage',sessionId:'fake'};
  try {
    globalThis.fetch=async(url,options)=>{calls++;assert.ok(options.signal instanceof AbortSignal);assert.equal(options.headers.Authorization,"Bearer fixture");if(url.endsWith('/freespins')){assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'7'});return new Response(JSON.stringify({CountFreeSpin:'9'}));}if(url.endsWith('/balance')){assert.deepEqual(Object.fromEntries(options.body),{playerId:'7'});return new Response(JSON.stringify({balance:0,currency:'GEL',playerId:'7'}));}assert.equal(url,'https://example.invalid/init');assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'7'});return new Response(JSON.stringify({sessionId:'real',balance:999,currency:'USD',playerId:7}));};
    const result=await service.initSession(params);assert.equal(calls,2);assert.equal(result.sessionId,'real');assert.equal(result.player.balance,0);assert.equal(result.freeSpinsLeft,0);
    for(const initSource of ['query','dev-test','missing']) await assert.rejects(service.initSession({...params,initSource}),{code:'ACCESS_DENIED'});assert.equal(calls,2);
    globalThis.fetch=async()=>new Response(JSON.stringify({sessionId:'real',currency:'GEL'}));
    await assert.rejects(service.initSession(params),{code:'BACKEND_RESPONSE_ERROR'});
  } finally {globalThis.fetch=original;}
});

test('startup skips freespins before the first spin and refreshes returning players',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:7,gameId:'khiradmandi-makor',initSource:'postMessage'};
  const previousSpin={
    SpinResult:{idCard:'123',LineSum:'1',Lines:'5',WasDouble:'0',Number:'63455094'},
    ...Object.fromEntries([[9,9,9,10,11],[5,9,12,12,7],[12,9,3,1,6]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),
    idCard:'123',CardSum:'5',SumPay:'0',PayDate:'paid',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'8',
  };
  try {
    for(const gameState of [null,undefined,previousSpin]) {
      for(const count of [0,3]) {
        const calls=[];
        globalThis.fetch=async(url)=>{
          const path=new URL(url).pathname;
          calls.push(path);
          if(path==='/init')return new Response(JSON.stringify({sessionId:'real',gameState}));
          if(path==='/balance')return new Response(JSON.stringify({balance:100,currency:'GEL',playerId:7}));
          assert.equal(path,'/freespins');
          assert.ok(gameState,'must not request freespins before the first spin');
          return new Response(JSON.stringify({CountFreeSpin:String(count)}));
        };
        const result=await service.initSession(params);
        assert.deepEqual(calls,gameState ? ['/init','/balance','/freespins'] : ['/init','/balance']);
        assert.equal(result.freeSpinsLeft,0);
        if(gameState)assert.equal(result.gameState.freeSpinsLeft,0);
      }
    }
    freeSpinSeries.recordResult(params,{idCard:'first-award',FreeSpin:1},false);
    freeSpinSeries.reconcile(params,100);
    freeSpinSeries.recordResult(params,{idCard:'retrigger',FreeSpin:1},true);
    globalThis.fetch=async(url)=>{
      if(url.endsWith('/init'))return new Response(JSON.stringify({sessionId:'reopened',gameState:previousSpin}));
      if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:100,currency:'GEL',playerId:7}));
      return new Response(JSON.stringify({CountFreeSpin:'103'}));
    };
    const restored=await service.initSession({...params,sessionId:'different-session'});
    assert.equal(restored.freeSpinsLeft,27);
    assert.equal(restored.freeSpinsTotal,30);
    assert.equal(restored.gameState.freeSpinsLeft,27);
    assert.equal(restored.gameState.spinResult.idCard,'123');
    // Historical free spins without the new browser ledger must not reject /init.
    for (const count of [0,3,100]) {
      globalThis.fetch=async(url)=>{
        if(url.endsWith('/init'))return new Response(JSON.stringify({sessionId:'history',gameState:{...previousSpin,SlotFreeSpin:'True',CountFreeSpin:String(count)}}));
        if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:100,currency:'GEL',playerId:'history-player'}));
        return new Response(JSON.stringify({CountFreeSpin:String(count)}));
      };
      const history=await service.initSession({...params,playerId:'history-player'});
      assert.equal(history.sessionId,'history');
      assert.equal(history.player.balance,100);
      assert.equal(history.freeSpinHistoryMissing,true);
      assert.equal(history.freeSpinsLeft,null,'Unknown remaining spins must not be presented as zero');
      assert.equal(history.gameState.spinResult.idCard,'123');
    }
  } finally {globalThis.fetch=original;}
});