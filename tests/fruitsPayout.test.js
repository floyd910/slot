import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {buildSpinForm} from '../src/api/spinApiClient.js';
import {mapJsonSpinPayload} from '../src/api/slotPayloadMappers.js';
import {normalizeSpinResult} from '../src/models/spinResult.js';
import {getTicketWinAmount} from '../src/utils/gameResult.js';
import {buildStandardPaytableViewModel} from '../src/viewModels/paytableViewModel.js';
import {getView2MatchPayout} from '../src/viewModels/view2PaytableViewModel.js';
import {getCombinationGroups} from '../src/utils/payoutTable.js';

const combination={id:5,title:'5',groups:getCombinationGroups(null,5)};
const params={gameId:'fruits',stake:0.1,lines:5,selectedCombination:combination,requestId:'fruits-zero-regression'};
const fixture=()=>({
  ...Object.fromEntries([[0,2,3,4,5],[1,0,4,5,6],[2,3,0,6,7]].map((row,i)=>['Line'+(i+1),Object.fromEntries(row.map((symbol,j)=>['Slot'+(j+1),String(symbol)]))])),
  ...Object.fromEntries(Array.from({length:10},(_,i)=>['LineWinKoff'+(i+1),{Koff:'0'}])),
  WinSum:'1.00',FreeSpin:'0',Gold:'0',idCard:'fruits-three-zeros',Number:'1',
});

test('Fruits rules pay 1.00 for three zeros at stake 0.10, without multiplying by five lines',()=>{
  const view=buildStandardPaytableViewModel({...params,selectedCombinationId:5});
  assert.equal(view.rows.find(row=>row.symbol===0).values[1],'1');
  assert.equal(getView2MatchPayout(0,3,view.payoutMultiplier,'fruits'),'1');
  const form=buildSpinForm(params,{gameId:'fruits',token:'fixture',playerId:'player'});
  assert.equal(form.get('gameId'),'42');
  assert.equal(form.get('sum'),'0.1');
  assert.equal(form.get('lines'),'5');
});

test('Fruits server total is preserved through mapping and both displayed views',async()=>{
  const result=normalizeSpinResult({...mapJsonSpinPayload(fixture(),params),backendManagedWallet:true});
  assert.equal(result.WinSum,1);
  assert.equal(result.BaseWinSum,1);
  assert.equal(result.BackendWinSum,1);
  assert.equal(getTicketWinAmount(result),1);
  assert.equal(result.scatterCells.length,3);
  const server=await createServer({configFile:false,esbuild:{jsx:'automatic'},optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-fruits-payout-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
  try {
    const {LanguageProvider}=await server.ssrLoadModule('/src/i18n.jsx');
    const {default:BottomBar}=await server.ssrLoadModule('/src/components/bottomBar/BottomBar.jsx');
    for(const visualMode of [false,true]) {
      const html=renderToStaticMarkup(React.createElement(LanguageProvider,null,React.createElement(BottomBar,{
        visualMode,stake:0.1,totalPurchase:0.5,selectedCombination:combination,
        player:{balance:100},spinResult:result,doublingState:{},revealComplete:true,
      })));
      assert.match(html,/1\.00/);
      assert.doesNotMatch(html,/5\.00/);
    }
  } finally {await server.close();}
});
