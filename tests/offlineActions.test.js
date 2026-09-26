import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('definitely-offline spin, double and pay never create pending operations', async () => {
  const originalNavigator=globalThis.navigator;
  const originalWindow=globalThis.window;
  const originalFetch=globalThis.fetch;
  const local=new Map(), session=new Map();
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key),get length(){return map.size;},key:index=>[...map.keys()][index]});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
  globalThis.window={dispatchEvent(){},localStorage:storage(local),sessionStorage:storage(session)};
  let requests=0;
  globalThis.fetch=async()=>{requests++;throw new Error('fetch must not be called while offline');};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-offline-actions-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {mergeRuntimeConfig}=await server.ssrLoadModule('/src/api/runtimeConfig.js');
    const context={backendMode:'soap',sessionApiBaseUrl:'https://example.invalid',token:'fixture',playerId:'offline-player',gameId:'fruits',sessionId:'offline-session'};
    mergeRuntimeConfig(context);
    const {gameApiService}=await server.ssrLoadModule('/src/services/gameApiService.js');
    const {stateRecoveryService}=await server.ssrLoadModule('/src/services/stateRecoveryService.js');
    for (const invoke of [
      ()=>gameApiService.spin({requestId:'offline-spin',stake:1,lines:1,isDemo:false,isFreeSpin:false}),
      ()=>gameApiService.double({requestId:'offline-double',idCard:'card',wasDouble:1,sum:10}),
      ()=>gameApiService.pay({requestId:'offline-pay',idCard:'card'}),
    ]) {
      await assert.rejects(invoke,{code:'OFFLINE',definitelyNotSent:true});
      assert.equal(stateRecoveryService.getPendingRequest(context),null);
    }
    assert.equal(requests,0);
  } finally {
    await server.close();
    globalThis.fetch=originalFetch;
    globalThis.window=originalWindow;
    if(originalNavigator===undefined)delete globalThis.navigator;
    else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});
  }
});

test('successful startup can remove only the legacy definitely-offline lock', async () => {
  const originalNavigator=globalThis.navigator, originalWindow=globalThis.window;
  const local=new Map(), session=new Map();
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key),get length(){return map.size;},key:index=>[...map.keys()][index]});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  globalThis.window={dispatchEvent(){},localStorage:storage(local),sessionStorage:storage(session)};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-legacy-offline-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {stateRecoveryService}=await server.ssrLoadModule('/src/services/stateRecoveryService.js');
    const context={playerId:'legacy-player',gameId:'fruits',sessionId:'legacy-session'};
    stateRecoveryService.rememberPendingRequest({requestId:'legacy',methodName:'/spin'},context);
    const key=[...local.keys()].find(value=>value.includes('pending-operation'));
    const legacy={...JSON.parse(local.get(key)),recoveryVersion:undefined,startedOnline:undefined,status:'recovery-required',errorCode:'NETWORK_UNREACHABLE'};
    local.set(key,JSON.stringify(legacy));
    assert.equal(stateRecoveryService.clearLegacyOfflinePending(context),true);
    assert.equal(stateRecoveryService.getPendingRequest(context),null);
    stateRecoveryService.rememberPendingRequest({requestId:'versioned',methodName:'/spin'},context);
    stateRecoveryService.markRecoveryRequired({code:'NETWORK_UNREACHABLE'}, {}, context);
    assert.equal(stateRecoveryService.clearLegacyOfflinePending(context),false);
    assert.equal(stateRecoveryService.getPendingRequest(context).requestId,'versioned');
  } finally {
    await server.close();globalThis.window=originalWindow;
    if(originalNavigator===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});
  }
});

test('reconnection clears connectivity recovery and restores the last confirmed round', async () => {
  const originalNavigator=globalThis.navigator, originalWindow=globalThis.window;
  const local=new Map(), session=new Map();
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key),get length(){return map.size;},key:index=>[...map.keys()][index]});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  globalThis.window={dispatchEvent(){},localStorage:storage(local),sessionStorage:storage(session)};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-connectivity-recovery-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {stateRecoveryService,ROUND_OPERATION_STATUS}=await server.ssrLoadModule('/src/services/stateRecoveryService.js');
    const context={playerId:'reconnect-player',gameId:'fruits',sessionId:'reconnect-session'};
    const confirmed={idCard:'confirmed',WinSum:10,creditedToBalance:false,grid:{A:[1],B:[2],C:[3]}};
    stateRecoveryService.saveRound({operationStatus:ROUND_OPERATION_STATUS.RECOVERY_REQUIRED,lastConfirmedSpinResult:confirmed,lastConfirmedGrid:confirmed.grid},context);
    stateRecoveryService.rememberPendingRequest({requestId:'lost-network',methodName:'/spin'},context);
    stateRecoveryService.markRecoveryRequired({code:'NETWORK_ERROR'}, {}, context);
    assert.equal(stateRecoveryService.clearConnectivityRecovery(context),true);
    assert.equal(stateRecoveryService.getPendingRequest(context),null);
    const restored=stateRecoveryService.getLocalState(context);
    assert.equal(restored.operationStatus,ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION);
    assert.equal(restored.spinResult.idCard,'confirmed');
  } finally {
    await server.close();globalThis.window=originalWindow;
    if(originalNavigator===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});
  }
});

test('an offline event makes a pending timeout safe to unlock on reconnect', async () => {
  const originalNavigator=globalThis.navigator, originalWindow=globalThis.window;
  const local=new Map(), session=new Map();
  const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key),get length(){return map.size;},key:index=>[...map.keys()][index]});
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:true}});
  globalThis.window={dispatchEvent(){},localStorage:storage(local),sessionStorage:storage(session)};
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-interrupted-timeout-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {stateRecoveryService}=await server.ssrLoadModule('/src/services/stateRecoveryService.js');
    const context={playerId:'timeout-player',gameId:'fruits',sessionId:'timeout-session'};
    stateRecoveryService.rememberPendingRequest({requestId:'timeout-request',methodName:'/spin'},context);
    stateRecoveryService.markConnectivityInterrupted(context);
    stateRecoveryService.markRecoveryRequired({code:'TIMEOUT'}, {}, context);
    assert.equal(stateRecoveryService.getPendingRequest(context).connectivityInterrupted,true);
    assert.equal(stateRecoveryService.clearConnectivityRecovery(context),true);
    assert.equal(stateRecoveryService.getPendingRequest(context),null);
  } finally {
    await server.close();globalThis.window=originalWindow;
    if(originalNavigator===undefined)delete globalThis.navigator;else Object.defineProperty(globalThis,'navigator',{configurable:true,value:originalNavigator});
  }
});
