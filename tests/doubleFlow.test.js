import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {webcrypto} from 'node:crypto';

test('both Double paths send the last confirmed win at steps 1–5 and block step 6',async()=>{
 const storage=new Map(),timers=[];
 globalThis.window={crypto:webcrypto,addEventListener(){},dispatchEvent(){},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:(fn,ms)=>{if(ms<9000)timers.push(fn);return 0;}};
 const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-double-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
 try {
  const {createDoubleActions}=await server.ssrLoadModule('/src/controllers/doubleActions.js');
  const {frameApi}=await server.ssrLoadModule('/src/api/frameApi.js');
  const {buildDoubleForm}=await server.ssrLoadModule('/src/api/doubleApiClient.js');
  const {partnerApi}=await server.ssrLoadModule('/src/services/partnerApi.js');
  const {createWinningDoublingState,createDoubleState}=await server.ssrLoadModule('/src/config/gameSettings.js');
  partnerApi.getBalance=async()=>null;
  for(const visualMode of [true,false]) {
   const context={token:'fixture',gameId:'babylon',sessionId:'double-'+visualMode};
   const live={current:{context,visualMode,status:'ready',player:{balance:100},spinResult:{idCard:'card',WinSum:1.5,BaseWinSum:1.5,backendManagedWallet:true},doublingState:{...createWinningDoublingState(1.5),initialAmount:1.5},doubleState:createDoubleState()}};
   const requests=[],errors=[];
   frameApi.double=async params=>{
    requests.push(Object.fromEntries(buildDoubleForm(params,context)));
    return {idCard:'card',WinSum:params.sum*2,status:'win',side:'left'};
   };
   const options={liveSpinStateRef:live,emitSound(){},postEvent(){},reportError:e=>errors.push(e),setGridAnimation(){},setLastKnownState(){},t:k=>k};
   for(const key of ['DoubleState','DoublingState','Player','SpinResult','Status']) {
    const prop=key[0].toLowerCase()+key.slice(1);
    options['set'+key]=value=>{live.current[prop]=typeof value==='function'?value(live.current[prop]):value;};
   }
   const actions=createDoubleActions(options);
   actions.enterDoubleScene();
   for(let i=0;i<6;i++) {
    if(visualMode)await actions.playFooterDouble('left');else await actions.pickDouble('left');
    while(timers.length)await timers.shift()();
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(requests.map(r=>r.sum),['1.5','3','6','12','24']);
   assert.deepEqual(requests.map(r=>r.wasDouble),['1','2','3','4','5']);
   assert.equal(new Set(requests.map(r=>r.requestId)).size,5);
   assert.equal(live.current.spinResult.WinSum,48);
   assert.equal(live.current.spinResult.creditedToBalance,false);
   assert.equal(visualMode?live.current.doublingState.active:live.current.doubleState.active,false);
  }
 } finally {await server.close();delete globalThis.window;}
});
