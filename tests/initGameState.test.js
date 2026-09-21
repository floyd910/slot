import test from 'node:test';
import assert from 'node:assert/strict';
import {mapInitGameState} from '../src/api/initGameState.js';
const context={gameId:'khiradmandi-makor'};
const fixture=()=>({SpinResult:{idCard:'67051815',LineSum:'0',Lines:'5',WasDouble:'0',Number:'63455094'},
 ...Object.fromEntries([[9,9,9,10,11],[5,9,12,12,7],[12,9,3,1,6]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
 LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),idCard:'67051815',CardSum:'0',SumPay:'0',PayDate:'',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'True',CountFreeSpin:'0'});
test('new init structure restores exact grid and parses string flags',()=>{const state=mapInitGameState(fixture(),context);assert.deepEqual(state.grid.A,[9,9,9,10,11]);assert.deepEqual(state.grid.B,[5,9,12,12,7]);assert.equal(state.spinResult.isDemo,true);assert.equal(state.spinResult.isFreeSpin,false);assert.equal(state.requiresReconciliation,false);assert.equal(mapInitGameState(null,context),null);});
test('bet totals are not treated as unpaid winnings',()=>{for(const change of [{CardSum:'20'},{CardSum:'20',CountFreeSpin:'5'}]){const state=mapInitGameState({...fixture(),...change},context);assert.equal(state.requiresReconciliation,false);assert.equal(state.spinResult.WinSum,0);}assert.equal(mapInitGameState({...fixture(),CardSum:'20',PayDate:'paid'},context).spinResult.creditedToBalance,true);});
test('wrong game, card, and missing row data are rejected',()=>{for(const change of [{idGameType:'43'},{idCard:'other'},{Line2:{}},{CountFreeSpin:'bad'}])assert.throws(()=>mapInitGameState({...fixture(),...change},context),{code:'BACKEND_RESPONSE_ERROR'});});

test('CountFreeSpin is the exact remaining count, not a new award or recovery error',()=>{for(const count of [0,1,7,20]){const mapped=mapInitGameState({...fixture(),CountFreeSpin:String(count)},context);assert.equal(mapped.freeSpinsLeft,count);assert.equal(mapped.requiresReconciliation,false);assert.equal(mapped.spinResult.FreeSpin,0);}assert.equal(mapInitGameState({...fixture(),CountFreeSpin:'7',CardSum:'20'},context).requiresReconciliation,false);});

test('restores total bet, per-line stake and selected line count independently',()=>{const raw=fixture();raw.CardSum='2.5';raw.SpinResult.LineSum='0.5';raw.SpinResult.Lines='5';const state=mapInitGameState(raw,context);assert.equal(state.totalStake,2.5);assert.equal(state.stake,0.5);assert.equal(state.lines,5);assert.equal(state.spinResult.WinSum,0);assert.equal(state.requiresReconciliation,false);raw.LinesKoff.Koff1='10';assert.equal(mapInitGameState(raw,context).requiresReconciliation,false);raw.PayDate='paid';assert.equal(mapInitGameState(raw,context).requiresReconciliation,false);});

test('SumPay restores unpaid winnings including after Double without changing wallet',()=>{for(const wasDouble of ['0','1']){const raw={...fixture(),SumPay:'200',CardSum:'5',SpinResult:{...fixture().SpinResult,WasDouble:wasDouble}};const mapped=mapInitGameState(raw,context);assert.equal(mapped.spinResult.WinSum,200);assert.equal(mapped.spinResult.creditedToBalance,false);assert.equal(mapped.requiresReconciliation,false);const paid=mapInitGameState({...raw,PayDate:'paid'},context);assert.equal(paid.spinResult.WinSum,0);assert.equal(paid.spinResult.creditedToBalance,true);}assert.throws(()=>mapInitGameState({...fixture(),SumPay:'bad'},context),{code:'BACKEND_RESPONSE_ERROR'});});

test('restored win retains backend line coefficients and highlight cells',()=>{const raw=fixture();raw.SumPay='20';raw.Line2={Slot21:'3',Slot22:'3',Slot23:'3',Slot24:'6',Slot25:'7'};raw.LinesKoff.Koff1='10';const result=mapInitGameState(raw,context).spinResult;assert.equal(result.LineWinKoff[0],10);assert.equal(result.lineWins[0].lineId,1);assert.deepEqual(result.winningCells,["B1","B2","B3"]);assert.deepEqual(result.winningCells,result.lineWins[0].winningCells);});

test('paid server snapshot preserves symbols but clears historical win effects',()=>{
 const raw=fixture();raw.SumPay='20';raw.PayDate='2026-09-21';raw.Line2={Slot21:'3',Slot22:'3',Slot23:'3',Slot24:'6',Slot25:'7'};raw.LinesKoff.Koff1='10';
 const result=mapInitGameState(raw,context).spinResult;
 assert.deepEqual(result.grid.B,[3,3,3,6,7]);
 assert.equal(result.creditedToBalance,true);
 for(const key of ['winningCells','lineWins','scatterCells'])assert.deepEqual(result[key],[]);
});
