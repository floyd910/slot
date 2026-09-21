import test from 'node:test';
import assert from 'node:assert/strict';
import {getPrimaryGameAction} from '../src/viewModels/primaryGameAction.js';
import {hasTicketWin} from '../src/utils/gameResult.js';
import {buildBottomBarControls} from '../src/viewModels/bottomBarControls.js';
test('restored unpaid wins display collection before pending free spins in both views',()=>{
 for(const visualMode of [false,true])for(const free of [false,true]){
 const action=getPrimaryGameAction({hasRecoveredGrid:true,pendingTicketWin:hasTicketWin({idCard:'card',WinSum:200,creditedToBalance:false}),showFreeSpinPrompt:free,hasFreeSpinsPending:free});
 assert.equal(action,'collect');
 assert.equal(buildBottomBarControls({visualMode,primaryActionCollectsWin:action==='collect'}).at(-1).type,'takeWin');
 }
});
test('paid history never offers collection and new free-spin awards keep their prompt',()=>{
 assert.equal(getPrimaryGameAction({hasRecoveredGrid:true,pendingTicketWin:hasTicketWin({WinSum:200,creditedToBalance:true})}),'spin');
 assert.equal(getPrimaryGameAction({hasRecoveredGrid:false,pendingTicketWin:true,showFreeSpinPrompt:true,hasFreeSpinsPending:true}),'free-spins');
});
