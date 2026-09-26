import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('offline UI actions do not call Spin, Free Spin, Double, or Pay transports', async () => {
  const originalNavigator=globalThis.navigator;
  const originalWindow=globalThis.window;
  const memory=new Map();
  const storage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key),get length(){return memory.size;},key:index=>[...memory.keys()][index]};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
  globalThis.window={dispatchEvent(){},addEventListener(){},removeEventListener(){},localStorage:storage,sessionStorage:storage};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-offline-controller-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {frameApi}=await server.ssrLoadModule('/src/api/frameApi.js');
    const {createSpinActions}=await server.ssrLoadModule('/src/controllers/spinActions.js');
    const {createDoubleActions}=await server.ssrLoadModule('/src/controllers/doubleActions.js');
    let spinCalls=0,doubleCalls=0,payCalls=0;
    frameApi.spin=async()=>{spinCalls++;};
    frameApi.double=async()=>{doubleCalls++;};
    frameApi.pay=async()=>{payCalls++;};
    const errors=[];
    const context={gameId:'fruits',sessionId:'offline-ui',playerId:'player'};
    const live={current:{
      context,status:'ready',player:{balance:100},selectedCombination:{id:1,groups:[{}]},stake:1,
      freeSpinsLeft:0,freeSpinsTotal:0,doubleState:{active:true,loading:false,step:1},
      doublingState:{active:true,entered:true,loading:false,step:0,currentAmount:10},
      spinResult:{idCard:'card',WinSum:10,creditedToBalance:false},
    }};
    const noop=()=>{};
    const spinActions=createSpinActions({
      liveSpinStateRef:live,autoPlayOnRef:{current:false},freeSpinRunRef:{current:false},t:key=>key,
      setError:value=>errors.push(value),setStatus:noop,setGridAnimation:noop,setDoublingState:noop,
      setLastKnownState:noop,setPlayer:noop,setSpinResult:noop,playSpinFeedback:noop,
    });
    assert.equal(await spinActions.handleSpin(),null);
    live.current.freeSpinsLeft=1;
    assert.equal(await spinActions.handleSpin({freeSpinAuto:true}),null);
    live.current.freeSpinsLeft=0;
    assert.equal(await spinActions.collectWin(),false);

    const doubleActions=createDoubleActions({
      liveSpinStateRef:live,t:key=>key,reportError:error=>errors.push(error.code),emitSound:noop,
      setStatus:noop,setPlayer:noop,setSpinResult:noop,setDoubleState:noop,setDoublingState:noop,
      setGridAnimation:noop,setLastKnownState:noop,
    });
    await doubleActions.playFooterDouble();
    await doubleActions.pickDouble('left');
    assert.deepEqual({spinCalls,doubleCalls,payCalls},{spinCalls:0,doubleCalls:0,payCalls:0});
    assert.equal(errors.filter(value=>value==='OFFLINE').length,2);
  } finally {
    await server.close();
    globalThis.window=originalWindow;
    if(originalNavigator===undefined)delete globalThis.navigator;
    else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});
  }
});
