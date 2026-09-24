import test from 'node:test';
import assert from 'node:assert/strict';
const store=new Map();
globalThis.window={localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)}};
const {freeSpinSeries:series}=await import('../src/services/freeSpinSeries.js');
const context={playerId:'ledger-test',gameId:'fruits'};
test('15 per award, lifetime baseline, retriggers, deduplication and new series',()=>{
 assert.equal(series.reconcile(context,100).freeSpinsLeft,0);
 series.recordResult(context,{idCard:'award-1',FreeSpin:1},false);
 assert.deepEqual(series.reconcile(context,100),{freeSpinsWinTotal:0,freeSpinsTotal:15,freeSpinsPlayed:0,freeSpinsLeft:15});
 assert.equal(series.reconcile(context,103).freeSpinsLeft,12);
 series.recordResult(context,{idCard:'award-2',FreeSpin:1},true);
 series.recordResult(context,{idCard:'award-2',FreeSpin:1},true);
 assert.equal(series.reconcile(context,103).freeSpinsLeft,27);
 assert.equal(series.reconcile({...context,sessionId:'new-session'},104).freeSpinsLeft,26);
 assert.equal(series.reconcile(context,130).freeSpinsLeft,0);
 series.recordResult(context,{idCard:'award-3',FreeSpin:1},false);
 assert.equal(series.reconcile(context,130).freeSpinsLeft,15);
 assert.equal(series.reconcile(context,131).freeSpinsLeft,14);
 assert.throws(()=>series.reconcile(context,130),{code:'BACKEND_RESPONSE_ERROR'});
});
test('awards survive module reload before count refresh and do not cross players/games',async()=>{
 const c={playerId:'reload-player',gameId:'fruits'};
 series.recordResult(c,{idCard:'award',FreeSpin:1},false);
 const {freeSpinSeries:reloaded}=await import('../src/services/freeSpinSeries.js?reload');
 assert.equal(reloaded.reconcile(c,250).freeSpinsLeft,15);
 assert.equal(reloaded.reconcile(c,253).freeSpinsLeft,12);
 assert.equal(reloaded.reconcile({...c,playerId:'other'},253).freeSpinsLeft,0);
 assert.equal(reloaded.reconcile({...c,gameId:'babylon'},253).freeSpinsLeft,0);
 assert.throws(()=>reloaded.reconcile({playerId:'unknown',gameId:'fruits'},253,{isFreeSpin:true}),{code:'FREE_SPIN_HISTORY_MISSING'});
});
test('winnings sum only free spins, deduplicate, survive reload and reset for a new award',async()=>{
 const c={playerId:'money-player',gameId:'fruits'};
 series.recordResult(c,{idCard:'paid',FreeSpin:1,WinSum:10},false);
 series.reconcile(c,500);
 series.recordResult(c,{idCard:'free1',WinSum:0.1},true);
 series.recordResult(c,{idCard:'free2',WinSum:0.2,FreeSpin:1},true);
 series.recordResult(c,{idCard:'free2',WinSum:0.2,FreeSpin:1},true);
 assert.equal(series.read(c).freeSpinsWinTotal,0.3);
 assert.equal(series.read(c).freeSpinsTotal,30);
 const {freeSpinSeries:restored}=await import('../src/services/freeSpinSeries.js?money');
 assert.equal(restored.reconcile(c,502).freeSpinsWinTotal,0.3);
 restored.recordResult(c,{idCard:'free3',WinSum:2.5},true);
 assert.equal(restored.read(c).freeSpinsWinTotal,2.8);
 restored.recordResult(c,{idCard:'next-paid',FreeSpin:1,WinSum:50},false);
 assert.equal(restored.read(c).freeSpinsWinTotal,0);
 assert.equal(restored.read(c).freeSpinsTotal,15);
});

test('round total uses every server win including losses and retriggers, and survives payment',()=>{
 const c={playerId:'server-total',gameId:'fruits'};
 series.recordResult(c,{idCard:'trigger',FreeSpin:1,WinSum:99},false);
 const results=[{idCard:'s1',WinSum:'12.35',BackendWinSum:0.01},{idCard:'s2',WinSum:0,BackendWinSum:999},{idCard:'s3',WinSum:'4.20',FreeSpin:1},{idCard:'s4',WinSum:'0.10'}];
 for(const result of results){series.recordResult(c,result,true);series.recordResult(c,result,true);}
 assert.equal(series.read(c).freeSpinsWinTotal,16.65);
 assert.equal(series.read(c).freeSpinsTotal,30);
 for(const card of series.getPayments(c))series.markPaid(c,card.idCard,100);
 assert.equal(series.read(c).freeSpinsWinTotal,16.65);
 assert.equal(series.getPaidTotal(c),16.65);
});
