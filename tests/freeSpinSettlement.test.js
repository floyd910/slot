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
 const pay=async({idCard})=>{calls.push(idCard);return {balance:103.5};};
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
  calls.push(idCard);if(idCard==="two")throw new Error("offline");return {balance:101};
 }}));
 assert.equal(freeSpinSeries.getPaidTotal(context),1);
 await settleFreeSpinSeries({context,requestId:()=>"retry",pay:async({idCard})=>{calls.push(idCard);return {balance:102};}});
 assert.deepEqual(calls,["one","two","two"]);
 assert.equal(freeSpinSeries.getPaidTotal(context),2);
});
