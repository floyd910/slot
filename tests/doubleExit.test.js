import {createWinningDoublingState,createDoubleState} from "../src/config/gameSettings.js";
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDoubleExitHandler} from '../src/services/doubleExitService.js';
function setup({pending=null,blocked=false,double=true,payResult,doublingState,doubleState}={}) {
 const events=[];const state={context:{gameId:'babylon'},spinResult:{idCard:'card',WinSum:200,grid:{A:[1],B:[1],C:[1]}},doublingState:doublingState??{entered:double,step:double?1:0},doubleState:doubleState??createDoubleState(),roundRecoveryBlocked:blocked};
 const recovery={getPendingRequest:()=>pending,getLocalState:()=>null,saveRound:r=>events.push(['save',r]),completeRound:()=>events.push(['complete']),saveLastSpin:r=>events.push(['last',r])};
 const exit=createDoubleExitHandler({getState:()=>state,recovery,pay:params=>{events.push(['pay',params]);return payResult??Promise.resolve({balance:1200});},onPaid:r=>events.push(['paid',r]),onError:e=>events.push(['error',e]),requestId:()=> 'pay-once'});return {exit,events};
}
test('confirmed 200 win is collected and Double restoration data removed',async()=>{const {exit,events}=setup();assert.equal((await exit()).allowExit,true);assert.equal(events[0][1].currentWinSum,200);assert.equal(events[0][1].doubleState,null);assert.equal(events[0][1].doublingState,null);assert.equal(events.filter(([type])=>type==='pay').length,1);assert.equal(events.find(([type])=>type==='last')[1].spinResult.creditedToBalance,true);assert.equal(events.at(-1)[1].balance,1200);});
test('pending or unknown Double never triggers a payout',async()=>{for(const args of [{pending:{methodName:'/double'}},{blocked:true}]){const {exit,events}=setup(args);assert.equal((await exit()).pending,true);assert.equal(events.length,0);}});
test('simultaneous navigation and pagehide share one payment request',async()=>{let resolve;const promise=new Promise(r=>resolve=r);const {exit,events}=setup({payResult:promise});const a=exit({keepalive:true}),b=exit();assert.equal(a,b);assert.equal(events.find(([type])=>type==='pay')[1].keepalive,true);resolve({balance:1200});await a;assert.equal(events.filter(([type])=>type==='pay').length,1);});
test('failed payout does not clear recovery data or allow in-app exit',async()=>{const {exit,events}=setup({payResult:Promise.reject(Object.assign(new Error('timeout'),{code:'TIMEOUT'}))});assert.equal((await exit()).allowExit,false);assert.equal(events.some(([type])=>type==='complete'),false);assert.equal(events.some(([type])=>type==='paid'),false);});
test('inactive state does not use exit collection',async()=>{const {exit,events}=setup({double:false});assert.equal((await exit()).handled,false);assert.equal(events.length,0);});

test('ordinary winning state collects on navigation or pagehide',async()=>{
 for(const keepalive of [false,true]){
 const {exit,events}=setup({doublingState:createWinningDoublingState(200)});
 assert.deepEqual(await exit({keepalive}),{handled:true,allowExit:true});
 assert.equal(events.filter(([type])=>type==='pay').length,1);
 assert.equal(events.some(([type])=>type==='complete'),true);
 }
});
test('explicit Double entry still pays before the first choice in either view',async()=>{
 for(const state of [{doublingState:{...createWinningDoublingState(200),entered:true}},{doublingState:createWinningDoublingState(200),doubleState:{...createDoubleState(),active:true}}]){
 const {exit,events}=setup(state);assert.equal((await exit()).handled,true);
 assert.equal(events.filter(([type])=>type==='pay').length,1);
 }
});
