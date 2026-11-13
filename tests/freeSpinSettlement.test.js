import test from "node:test";
import assert from "node:assert/strict";
import {freeSpinSeries} from "../src/services/freeSpinSeries.js";
import {settleFreeSpinSeries} from "../src/services/freeSpinSettlementService.js";
test("payment batch deduplicates cards, preserves counters, and excludes later wins", async()=>{
 const context={playerId:"exit-settlement",gameId:"fruits"};
 freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
 freeSpinSeries.reconcile(context,100);
 freeSpinSeries.recordResult(context,{idCard:"one",WinSum:1.2},true);
 freeSpinSeries.recordResult(context,{idCard:"two",WinSum:2.3},true);
 freeSpinSeries.reconcile(context,102);
 let calls=[];
 const pay=async({idCard})=>{calls.push(idCard);return {idCard,paidAt:"confirmed",balance:103.5};};
 const options={context,pay,requestId:()=>"pay"};
 await Promise.all([settleFreeSpinSeries(options),settleFreeSpinSeries(options)]);
 assert.deepEqual(calls,["one","two"]);
 assert.equal(freeSpinSeries.getPaidTotal(context),3.5);
 assert.equal(freeSpinSeries.read(context).freeSpinsLeft,13);
 freeSpinSeries.recordResult(context,{idCard:"three",WinSum:4},true);
 await settleFreeSpinSeries(options);
 assert.deepEqual(calls,["one","two","three"]);
 assert.equal(freeSpinSeries.getPaidTotal(context),7.5);
});
test("partial payment is persisted and failed card is not marked paid",async()=>{
 const context={playerId:"partial-settlement",gameId:"fruits"};
 freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
 for(const id of ["one","two"])freeSpinSeries.recordResult(context,{idCard:id,WinSum:1},true);
 const calls=[];
 await assert.rejects(settleFreeSpinSeries({context,requestId:()=>"pay",pay:async({idCard})=>{
  calls.push(idCard);if(idCard==="two")throw new Error("offline");return {idCard,paidAt:"confirmed",balance:101};
 }}));
 assert.equal(freeSpinSeries.getPaidTotal(context),1);
 await settleFreeSpinSeries({context,requestId:()=>"retry",pay:async({idCard})=>{calls.push(idCard);return {idCard,paidAt:"confirmed",balance:102};}});
 assert.deepEqual(calls,["one","two","two"]);
 assert.equal(freeSpinSeries.getPaidTotal(context),2);
});

test("winning cards close once and retain their payment identity across retries",async()=>{
 const context={playerId:"zero-card-reload",gameId:"egypt"};
 freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
 freeSpinSeries.recordResult(context,{idCard:"zero",WinSum:1},true);
 const calls=[];
 await assert.rejects(settleFreeSpinSeries({context,requestId:()=>"original",pay:async params=>{
  calls.push(params);throw new Error("lost response");
 }}));
 assert.equal(freeSpinSeries.getPayments(context)[0].paymentRequestId,"original");
 await settleFreeSpinSeries({context,requestId:()=>"replacement",pay:async params=>{
  calls.push(params);return {idCard:params.idCard,paidAt:"confirmed",balance:0};
 }});
 assert.deepEqual(calls.map(call=>call.requestId),["original","original"]);
 assert.equal(freeSpinSeries.getPaidTotal(context),1);
 assert.equal(freeSpinSeries.getPayments(context)[0].paid,true);
 await settleFreeSpinSeries({context,requestId:()=>"unused",pay:()=>{throw new Error("must not repay");}});
});

test("missing confirmation, mismatched cards and explicitly unpaid responses remain unpaid",async()=>{
 for(const response of [{balance:100},{idCard:"other",paidAt:"confirmed"},{idCard:"card",paidAt:"confirmed",paid:false}]) {
  const context={playerId:"bad-confirmation-"+JSON.stringify(response),gameId:"egypt"};
  freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
  freeSpinSeries.recordResult(context,{idCard:"card",WinSum:1},true);
  await assert.rejects(settleFreeSpinSeries({context,requestId:()=>"pay",pay:async()=>response}),{code:"BACKEND_RESPONSE_ERROR"});
  assert.equal(freeSpinSeries.getPayments(context)[0].paid,false);
  assert.equal(freeSpinSeries.getPaidTotal(context),0);
 }
});
