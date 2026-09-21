import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGameContentViewModel} from '../src/viewModels/gameContentViewModel.js';
const result={idCard:'paid-card',creditedToBalance:true,winningCells:['B1','B2','B3'],lineWins:[{winningCells:['B1','B2','B3']}],scatterCells:['A1','A2','A3']};
const view=(spinResult,hasRecoveredGrid)=>buildGameContentViewModel({derived:{},state:{currentGame:'babylon',grid:{A:[1],B:[1],C:[1]},spinResult,hasRecoveredGrid}});
test('paid restored spin keeps its data without symbol, line or scatter effects',()=>{
 assert.equal(view(result,true).highlightResult,null);
 assert.equal(result.winningCells.length,3);
 assert.equal(view(result,true).showStandardGame,true);
});
test('unpaid restored win keeps its highlights',()=>{
 const unpaid={...result,creditedToBalance:false};assert.equal(view(unpaid,true).highlightResult,unpaid);
});
test('fresh spins keep win effects even when automatically credited',()=>{
 assert.equal(view(result,false).highlightResult,result);
});
