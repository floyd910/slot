import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {webcrypto} from 'node:crypto';
import {buildSpinForm} from '../src/api/spinApiClient.js';
test('all games and views count 15 per catch, restore, retrigger and finish using lifetime played counts',async()=>{
 const originalFetch=globalThis.fetch,store=new Map();
 const storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 globalThis.window={crypto:webcrypto,addEventListener(){},dispatchEvent(){},localStorage:storage,sessionStorage:storage,setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms>=9000?ms:0);id.unref();return id;},clearTimeout};
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
 try {
  const {createSpinActions}=await server.ssrLoadModule('/src/controllers/spinActions.js');
  const {frameApi}=await server.ssrLoadModule('/src/api/frameApi.js');
  const {freeSpinSeries}=await server.ssrLoadModule('/src/services/freeSpinSeries.js');
  const {mergeRuntimeConfig}=await server.ssrLoadModule('/src/api/runtimeConfig.js');
  mergeRuntimeConfig({backendMode:'soap'});
  for(const gameId of ['ganchina-sokrovishch','marvorid-djemchug','khiradmandi-makor','egypt','kadima-drevnii','khocha-afandi','babylon','fruits'])for(const visualMode of [false,true]) {
   const context={token:'fixture',playerId:'player-'+visualMode,gameId,sessionId:gameId+'-'+visualMode};
   const live={current:{context,visualMode,carpetCloseMs:0,carpetOpenMs:0,status:'ready',player:{balance:100},doubleState:{},doublingState:{},freeSpinsLeft:0,freeSpinsTotal:0,selectedCombination:{groups:[{}],id:1},stake:1}};
   let played=100,calls=0,failCount=false,payCalls=0,expectedMinor=0,paidMinor=0;const cardWins=new Map();const errors=[];
   const options={liveSpinStateRef:live,autoPlayOnRef:{current:false},freeSpinRunRef:{current:false},t:k=>k,reportOperationError:e=>errors.push(e)};
   for(const name of ['emitLotteryRevealSounds','emitSound','playSpinFeedback','setError','setHasRecoveredGrid','setHasSessionSpin','setLastKnownState','onRecoveryRequired','postEvent','setAutoPlayOn'])options[name]=()=>{};
   for(const name of ['DoubleState','DoublingState','Player','FreeSpinsLeft','FreeSpinsTotal','FreeSpinsWinTotal','FreeSpinRoundStarted','ShowFreeSpinPrompt','Grid','GridAnimation','GridRevealKey','SpinHistory','SpinResult','Status']){
    const key=name[0].toLowerCase()+name.slice(1);options['set'+name]=v=>{live.current[key]=typeof v==='function'?v(live.current[key]??(name==='SpinHistory'?[]:0)):v;};
   }
   const setTotal=options.setFreeSpinsWinTotal;
   options.setFreeSpinsWinTotal=value=>{assert.equal(live.current.gridAnimation,'settled','total must wait for the reveal to finish');assert.equal(value,expectedMinor === null ? null : expectedMinor/100);setTotal(value);};
   globalThis.fetch=async url=>{assert.ok(url.endsWith('/freespins'));if(failCount)throw new TypeError('offline');return new Response(JSON.stringify({CountFreeSpin:String(played)}));};
   frameApi.pay=async params=>{
    payCalls++;
    assert.ok(params.idCard);
    paidMinor+=cardWins.get(params.idCard);
    return {balance:100+paidMinor/100};
   };
   frameApi.spin=async params=>{
    calls++;assert.equal(buildSpinForm(params,context).get('freeSpin'),calls===1?'0':'1');
    const winMinor=params.isFreeSpin?[56350,0,1235][(calls-2)%3]:0;
    expectedMinor+=winMinor;cardWins.set(context.sessionId+'-'+calls,winMinor);
    if(params.isFreeSpin)played++;
    return {backendManagedWallet:true,balance:100,idCard:context.sessionId+'-'+calls,WinSum:String(winMinor/100),BackendWinSum:params.isFreeSpin?0.01:0,FreeSpin:calls===1||calls===4?1:0,grid:{A:[1,1,1,1,1],B:[1,1,1,1,1],C:[1,1,1,1,1]}};
   };
   const actions=createSpinActions(options);
   await actions.handleSpin();assert.equal(live.current.freeSpinsLeft,15);assert.equal(live.current.freeSpinsTotal,15);
   await actions.handleSpin();await actions.handleSpin();assert.equal(live.current.freeSpinsLeft,13);
   // Third free spin catches another award, then the count request fails.
   failCount=true;assert.equal(await actions.handleSpin(),null);assert.equal(live.current.freeSpinCountUnknown,true);
   assert.equal(freeSpinSeries.read(context).freeSpinsTotal,30);assert.equal(live.current.freeSpinsWinTotal,575.85);assert.equal(payCalls,0);assert.equal(live.current.player.balance,100);
   failCount=false;await actions.handleSpin();assert.equal(calls,4);assert.equal(live.current.freeSpinsLeft,27);
   assert.equal(await actions.settleFreeSpinWins({keepalive:true}),false);assert.equal(payCalls,0);assert.equal(live.current.player.balance,100);assert.equal(freeSpinSeries.getPaidTotal(context),0);
   const restored=freeSpinSeries.reconcile({...context,sessionId:'reopened'},played);
   assert.deepEqual(restored,{freeSpinsWinTotal:575.85,freeSpinsTotal:30,freeSpinsPlayed:3,freeSpinsLeft:27});
   Object.assign(live.current,restored,{visualMode:!visualMode});
   await actions.startFreeSpinRun();assert.equal(calls,31);assert.equal(played,130);assert.equal(live.current.freeSpinsLeft,0);assert.equal(live.current.freeSpinRoundStarted,false);
   assert.equal(errors.length,1);assert.equal(payCalls,20);assert.equal(live.current.player.balance,5858.5);assert.equal(freeSpinSeries.getPaidTotal(context),5758.5);
   assert.equal(live.current.freeSpinsWinTotal,5758.5);
   assert.equal(freeSpinSeries.read(context).freeSpinsWinTotal,5758.5);
   // A successful normal spin may return a counter below the completed series.
   // The supplied losing payload must remain playable; the later win must collect its own card.
   expectedMinor=null;
   played=0;
   const {mapJsonSpinPayload}=await server.ssrLoadModule('/src/api/slotPayloadMappers.js');
   const payload={
    ...Object.fromEntries([[5,2,4,4,7],[5,6,5,4,0],[4,1,2,5,1]].map((row,i)=>['Line'+(i+1),Object.fromEntries(row.map((v,j)=>['Slot'+(j+1),String(v)]))])),
    ...Object.fromEntries(Array.from({length:10},(_,i)=>['LineWinKoff'+(i+1),{Koff:'0'}])),
    WinSum:'0',FreeSpin:'0',Gold:'0',idCard:'67163663',Number:'62753371',ballance:1503,
   };
   globalThis.fetch=async url=>{
    if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:1503,currency:'USD',playerId:context.playerId}));
    assert.ok(url.endsWith('/freespins'));return new Response(JSON.stringify({CountFreeSpin:String(played)}));
   };
   frameApi.spin=async params=>({...mapJsonSpinPayload(payload,params),backendManagedWallet:true});
   const normalLoss=await actions.handleSpin();
   assert.ok(normalLoss,'a confirmed losing spin must not fail on the old bonus counter');
   assert.equal(normalLoss.idCard,'67163663');
   assert.equal(live.current.freeSpinCountUnknown,false);
   assert.equal(live.current.freeSpinsLeft,0);
   assert.equal(live.current.freeSpinsWinTotal,null);
   assert.equal(errors.length,1);
   assert.equal(payCalls,20);
   // The next ordinary win must collect its own card, without replaying bonus payments.
   expectedMinor=null;
   const paidCards=freeSpinSeries.getPayments(context).map(card=>({...card}));
   const nextCard=context.sessionId+'-post-bonus';
   frameApi.spin=async params=>{
    assert.equal(buildSpinForm(params,context).get('freeSpin'),'0');
    return {backendManagedWallet:true,balance:5857.5,idCard:nextCard,WinSum:5,FreeSpin:0,grid:live.current.grid};
   };
   const {mapPayResponse}=await server.ssrLoadModule('/src/api/payApiClient.js');
   frameApi.pay=async params=>{
    payCalls++;
    assert.equal(params.idCard,nextCard);
    return mapPayResponse({idCard:nextCard,PayDate:'2026-09-24T10:00:00Z',ballance:5862.5},params);
   };
   await actions.handleSpin();
   assert.equal(live.current.spinResult.idCard,nextCard);
   assert.equal(live.current.spinResult.freeSpinDeferred,false);
   assert.equal(await actions.collectWin(),true);
   assert.equal(payCalls,21);
   assert.equal(live.current.player.balance,5862.5);
   assert.equal(live.current.spinResult,null);
   assert.equal(errors.length,1);
   assert.deepEqual(freeSpinSeries.getPayments(context),paidCards);
   // Starting a second award must not subtract the prior 30 spins again.
   freeSpinSeries.recordResult(context,{idCard:'new-award',FreeSpin:1},false);
   assert.equal(freeSpinSeries.reconcile(context,played).freeSpinsLeft,15);
  }
 } finally {globalThis.fetch=originalFetch;await server.close();delete globalThis.window;}
});
