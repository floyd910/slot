import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
test('restored free-spin controls show the remaining count and stay usable in either view',async()=>{
 const server=await createServer({configFile:false,esbuild:{jsx:'automatic'},optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
 try {
  const {LanguageProvider}=await server.ssrLoadModule('/src/i18n.jsx');
  const {default:BottomBar}=await server.ssrLoadModule('/src/components/bottomBar/BottomBar.jsx');
  const {default:Prompt}=await server.ssrLoadModule('/src/components/freeSpinsPrompt/FreeSpinsPrompt.jsx');
  for(const visualMode of [false,true]) {
   const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(BottomBar,{visualMode,freeSpinsLeft:7,freeSpinRoundStarted:false,player:{balance:0},spinResult:{WinSum:10,creditedToBalance:false},selectedCombination:{groups:[[]]},doublingState:{},revealComplete:true})));
   assert.match(html,/footer-free-spins__content/);
   assert.doesNotMatch(html,/УДВОИТЬ/);
   const buttons=[...html.matchAll(/<div[^>]*class="[^"]*spin-draw-button[^"]*"[^>]*>/g)].map(match=>match[0]);
   assert.equal(buttons.length,3);
   for(const button of buttons) { assert.doesNotMatch(button,/--disabled|aria-disabled="true"/); assert.match(button,/tabindex="0"/); }
  }
  const prompt=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(Prompt,{count:7})));
  assert.match(prompt,/7/);
  assert.doesNotMatch(prompt,/15/);
 } finally {await server.close();}
});
