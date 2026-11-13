import test from "node:test";
import assert from "node:assert/strict";
import { freeSpinSeries } from "../src/services/freeSpinSeries.js";

test("paid winnings and the held display survive reload and release once after a losing final spin", async () => {
  const previousWindow=globalThis.window;
  const store=new Map();
  globalThis.window={localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}};
  try {
    const context={playerId:"held-reload",gameId:"egypt"};
    freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
    freeSpinSeries.holdDisplayBalance(context,100);
    freeSpinSeries.recordResult(context,{idCard:"winning-free",WinSum:2,backendManagedWallet:true},true);
    freeSpinSeries.markPaid(context,"winning-free",102);
    assert.equal(freeSpinSeries.getHeldDisplayBalance(context),100);
    assert.equal(freeSpinSeries.getPaidTotal(context),2);
    assert.equal(freeSpinSeries.releaseDisplayBalance(context,{backendManagedWallet:true}),null);
    const {freeSpinSeries:restored}=await import("../src/services/freeSpinSeries.js?held-balance-reload");
    assert.equal(restored.getHeldDisplayBalance(context),100);
    assert.equal(restored.read(context).freeSpinsWinTotal,2);
    restored.holdDisplayBalance(context,102,{subtractPaid:true});
    assert.equal(restored.getHeldDisplayBalance(context),100,"reopening must not replace the held balance with server credits");
    restored.recordResult(context,{idCard:"last-loss",WinSum:0,backendManagedWallet:true},true);
    restored.reconcile(context,15);
    assert.equal(restored.releaseDisplayBalance(context,{backendManagedWallet:true}),102);
    assert.equal(restored.getHeldDisplayBalance(context),null);
    assert.equal(restored.releaseDisplayBalance(context,{backendManagedWallet:true}),null,"never credit the total twice");
    assert.equal(restored.read(context).freeSpinsWinTotal,2);
  } finally {globalThis.window=previousWindow;}
});

test("a final unconfirmed winning payment keeps the balance held", () => {
  const context={playerId:"held-last-payment",gameId:"egypt"};
  freeSpinSeries.recordResult(context,{idCard:"award",FreeSpin:1},false);
  freeSpinSeries.holdDisplayBalance(context,0);
  freeSpinSeries.recordResult(context,{idCard:"last-win",WinSum:3},true);
  freeSpinSeries.reconcile(context,15);
  assert.equal(freeSpinSeries.releaseDisplayBalance(context,{backendManagedWallet:true,fallbackBalance:3}),null);
  assert.equal(freeSpinSeries.getHeldDisplayBalance(context),0);
  freeSpinSeries.markPaid(context,"last-win",3);
  assert.equal(freeSpinSeries.releaseDisplayBalance(context,{backendManagedWallet:true}),3);
});

test("frontend wallet adds the series once and legacy backend series subtract already-paid winnings on restore", () => {
  const local={playerId:"held-local",gameId:"egypt"};
  freeSpinSeries.recordResult(local,{idCard:"award",FreeSpin:1},false);
  freeSpinSeries.holdDisplayBalance(local,100);
  freeSpinSeries.recordResult(local,{idCard:"win",WinSum:2},true);
  freeSpinSeries.markPaid(local,"win",9000);
  freeSpinSeries.reconcile(local,15);
  assert.equal(freeSpinSeries.releaseDisplayBalance(local),102,"standalone display wallet ignores the backend wallet");
  assert.equal(freeSpinSeries.releaseDisplayBalance(local),null);

  const legacy={playerId:"held-legacy",gameId:"egypt"};
  freeSpinSeries.recordResult(legacy,{idCard:"award",FreeSpin:1},false);
  freeSpinSeries.recordResult(legacy,{idCard:"win",WinSum:2,creditedToBalance:true},true);
  freeSpinSeries.holdDisplayBalance(legacy,102,{subtractPaid:true});
  assert.equal(freeSpinSeries.getHeldDisplayBalance(legacy),100);
  assert.equal(freeSpinSeries.read(legacy).freeSpinsWinTotal,2);
});
