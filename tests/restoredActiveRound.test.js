import test from 'node:test';
import assert from 'node:assert/strict';
const storage=new Map();
globalThis.window={dispatchEvent(){},sessionStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),get length(){return storage.size;},key:i=>[...storage.keys()][i]}};
const {stateRecoveryService:recovery}=await import('../src/services/stateRecoveryService.js');
const grid={A:[1,1,1,1,1],B:[2,2,2,2,2],C:[3,3,3,3,3]};
const state={spinResult:{idCard:'win',WinSum:15,creditedToBalance:false,grid},grid,stake:1,freeSpinsLeft:0};
test('restored unpaid win triggers the active-round checks used by exit and chooser',()=>{
 const context={gameId:'restored-game',sessionId:'server-session'};
 recovery.registerRestoredUnpaidWin(state,context);
 assert.equal(recovery.hasActiveRound(context.gameId),true);
 assert.equal(recovery.getActiveRounds().find(r=>r.gameId===context.gameId).currentWinSum,15);
 assert.equal(recovery.getLocalState(context).spinResult.idCard,'win');
 recovery.completeRound(context);assert.equal(recovery.hasActiveRound(context.gameId),false);
});
test('paid and zero-win history do not register as active unpaid rounds',()=>{
 for(const result of [{...state.spinResult,creditedToBalance:true},{...state.spinResult,WinSum:0}]){
 const context={gameId:'inactive',sessionId:'server-session'};
 assert.equal(recovery.registerRestoredUnpaidWin({...state,spinResult:result},context),null);
 assert.equal(recovery.hasActiveRound(context.gameId),false);
 }
});
test('restoration cannot overwrite a pending payment',()=>{
 const context={gameId:'pending-game',sessionId:'server-session'};
 recovery.rememberPendingRequest({requestId:'pay-pending',methodName:'/pay'},context);
 assert.equal(recovery.registerRestoredUnpaidWin(state,context),null);
 assert.equal(recovery.getPendingRequest(context).requestId,'pay-pending');
});
