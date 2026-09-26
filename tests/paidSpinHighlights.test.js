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

test('paid restored View 1 has empty cells while source symbols remain intact',()=>{
 const grid={A:[1,2,3,4,5],B:[2,3,4,5,6],C:[3,4,5,6,7],D:['x2','','','','']};
 const state={currentGame:'babylon',grid,spinResult:result,hasRecoveredGrid:true};
 const mapped=buildGameContentViewModel({derived:{},state});
 for(const row of ['A','B','C','D'])assert.deepEqual(mapped.view1Grid[row],['','','','','']);
 assert.deepEqual(state.grid.A,[1,2,3,4,5]);
 assert.equal(buildGameContentViewModel({derived:{},state:{...state,hasRecoveredGrid:false,hasSessionSpin:true}}).view1Grid,grid);
 assert.deepEqual(buildGameContentViewModel({derived:{},state:{...state,spinResult:{...result,WinSum:10,creditedToBalance:false}}}).view1Grid.A,grid.A);
});

test('Fruits View 1 clears restored zero-win and grid-only history',()=>{
 const grid={A:[1,2,3,4,5],B:[2,3,4,5,6],C:[3,4,5,6,7],D:['','','','','']};
 for(const spinResult of [null,{WinSum:0,creditedToBalance:false},{WinSum:'0',creditedToBalance:false}]) {
  const state={currentGame:'fruits',grid,spinResult,hasRecoveredGrid:true,freeSpinsLeft:0};
  const mapped=buildGameContentViewModel({derived:{},state});
  for(const cells of Object.values(mapped.view1Grid))assert.deepEqual(cells,['','','','','']);
  assert.equal(mapped.highlightResult,null);
  assert.equal(state.grid,grid);
  assert.equal(buildGameContentViewModel({derived:{},state:{...state,hasRecoveredGrid:false,hasSessionSpin:true}}).view1Grid,grid);
  assert.deepEqual(buildGameContentViewModel({derived:{isRoundRecoveryBlocked:true},state}).view1Grid.A,['','','','','']);
 }
 for(const patch of [{spinResult:{idCard:'unpaid',WinSum:10,creditedToBalance:false}},{spinResult:{WinSum:0,creditedToBalance:false},freeSpinsLeft:3}]) {
  const state={currentGame:'fruits',grid,hasRecoveredGrid:true,...patch};
  assert.deepEqual(buildGameContentViewModel({derived:{},state}).view1Grid.A,patch.spinResult.idCard ? grid.A : ['','','','','']);
 }
});
test('all games start View 1 empty even when initial symbols are not marked recovered',()=>{
 const grid={A:[1,2,3,4,5],B:[2,3,4,5,6],C:[3,4,5,6,7],D:['SCATTER','','','','']};
 for(const currentGame of ['ganchina-sokrovishch','marvorid-djemchug','khiradmandi-makor','egypt','kadima-drevnii','khocha-afandi','babylon','fruits']) {
  const state={currentGame,grid,hasSessionSpin:false,hasRecoveredGrid:false};
  const before=buildGameContentViewModel({derived:{},state});
  assert.equal(before.hideView1Symbols,true);
  for(const cells of Object.values(before.view1Grid))assert.deepEqual(cells,['','','','','']);
  assert.equal(buildGameContentViewModel({derived:{},state:{...state,hasSessionSpin:true}}).view1Grid,grid);
 }
});
