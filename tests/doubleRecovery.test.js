import test from 'node:test';
import assert from 'node:assert/strict';
const storage=new Map();
globalThis.window={dispatchEvent(){},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
const {stateRecoveryService:recovery}=await import('../src/services/stateRecoveryService.js');
const {recoverPendingDouble}=await import('../src/services/doubleRecoveryService.js');
const {mergeRuntimeConfig}=await import('../src/api/runtimeConfig.js');
mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
function seed(playerId,methodName='/double') {
 const context={playerId,gameId:'fruits',sessionId:'old',token:'fixture'};
 const formData={gameId:'42',cardId:'card',requestId:'original-id',wasDouble:'2',sum:'3'};
 recovery.saveRound({spinResult:{idCard:'card',WinSum:3,BaseWinSum:1.5,grid:{A:[1],B:[1],C:[1]}},operationStatus:'DOUBLE_PROCESSING'},context);
 recovery.rememberPendingRequest({methodName,requestId:'original-id',idCard:'card',wasDouble:2,sum:3,formData},context);
 return {context:{...context,sessionId:'new'},formData};
}
test('recovery replays exact original form after session renewal and restores confirmed win or loss without pay',async()=>{
 const original=globalThis.fetch;
 try {for(const WinSum of [6,0]) {
  const {context,formData}=seed('result-'+WinSum);let calls=0;
  globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://example.invalid/double');assert.deepEqual(Object.fromEntries(options.body),formData);return new Response(JSON.stringify({idCard:'card',WinSum}));};
  const result=await recoverPendingDouble(context);
  assert.equal(calls,1);assert.equal(result.spinResult.WinSum,WinSum);assert.equal(result.spinResult.BaseWinSum,WinSum);
  assert.equal(result.doubleState.active,false);assert.equal(result.doublingState.entered,false);
  assert.equal(recovery.getPendingRequest(context),null);
  assert.equal(recovery.getLocalState(context).operationStatus,WinSum > 0 ? 'WAITING_FOR_COLLECT' : 'ROUND_COMPLETED');
 }} finally {globalThis.fetch=original;}
});
test('in-progress, invalid and lost responses retain the same pending operation',async()=>{
 const original=globalThis.fetch;
 try {for(const response of [()=>new Response(JSON.stringify({idCard:'card',WinSum:99}),{status:202}),()=>new Response('{}'),()=>{throw new TypeError('offline');}]) {
  const {context,formData}=seed('failure');
  globalThis.fetch=async()=>response();
  await assert.rejects(recoverPendingDouble(context));
  assert.deepEqual(recovery.getPendingRequest(context).formData,formData);
  assert.equal(recovery.getPendingRequest(context).requestId,'original-id');
 }} finally {globalThis.fetch=original;}
});
test('payment and other-player pending operations are never replayed',async()=>{
 const original=globalThis.fetch;
 try {
  const {context}=seed('pay','/pay');
  globalThis.fetch=async()=>{assert.fail('must not send a payment');};
  await assert.rejects(recoverPendingDouble(context),{code:'RECOVERY_REQUIRED'});
  assert.equal(recovery.getPendingRequest({...context,playerId:'other'}),null);
  assert.equal(recovery.getPendingRequest(context).methodName,'/pay');
 } finally {globalThis.fetch=original;}
});

test('pending operation and original snapshot survive a fresh module with a new session',async()=>{
 const local=new Map();
 window.localStorage={getItem:k=>local.get(k)??null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)};
 const {context}=seed('browser-reopen');
 const {stateRecoveryService:reloaded}=await import('../src/services/stateRecoveryService.js?new-browser');
 const pending=reloaded.getPendingRequest(context);
 assert.equal(pending.requestId,'original-id');
 assert.equal(pending.recoveryState.spinResult.WinSum,3);
 assert.equal(pending.formData.sum,'3');
 assert.equal(JSON.stringify([...local.values()]).includes('fixture'),false,'do not persist tokens');
 delete window.localStorage;
});