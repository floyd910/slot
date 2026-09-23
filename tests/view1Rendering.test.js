import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {buildGameContentViewModel} from '../src/viewModels/gameContentViewModel.js';
import {getInitialGrid} from '../src/data/mockData.js';

test('View 1 rendered cells are empty before a current-session spin in every game',async()=>{
 const server=await createServer({configFile:false,esbuild:{jsx:'automatic'},optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
 try {
  const {default:LotteryGrid}=await server.ssrLoadModule('/src/components/lotteryGrid/LotteryGrid.jsx');
  for(const currentGame of ['ganchina-sokrovishch','marvorid-djemchug','khiradmandi-makor','egypt','kadima-drevnii','khocha-afandi','babylon','fruits']) {
   for(const hasRecoveredGrid of [false,true]) {
    const grid=getInitialGrid(currentGame);
    const state={currentGame,grid,hasRecoveredGrid,hasSessionSpin:false,spinResult:{WinSum:100,creditedToBalance:false}};
    const render=state=>{
     const view=buildGameContentViewModel({state,derived:{}});
     return renderToStaticMarkup(React.createElement(LotteryGrid,{grid:view.view1Grid,visualMode:false,animationState:'settled',doublingState:view.hideView1Symbols?undefined:{marks:['x2','','','','']}}));
    };
    const html=render(state);
    const values=[...html.matchAll(/class="lottery-grid-view1-cell__value[^"]*">(.*?)<\/div>/g)].map(match=>match[1]);
    assert.equal(values.length,20,currentGame);
    assert.ok(values.every(value=>value===''),currentGame+' must have no old symbols');
    assert.match(render({...state,hasSessionSpin:true}),/lottery-grid-view1-cell--value-visible/);
   }
  }
 } finally {await server.close();}
});
