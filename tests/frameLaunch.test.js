import {freeSpinSeries} from '../src/services/freeSpinSeries.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveParentOrigin, readHostMessage, normalizeHostInit } from '../src/api/frameLaunch.js';
import { SessionApiService, isRollbackEligibleSpin } from '../src/services/sessionApiService.js';
import { stateRecoveryService } from '../src/services/stateRecoveryService.js';
import { mergeRuntimeConfig } from '../src/api/runtimeConfig.js';

test('transport failures never unlock a financial Spin without an explicit status contract',()=>{
  const now=Date.parse('2026-10-01T12:00:00.000Z');
  for (const pending of [
    {methodName:'/spin',errorCode:'NETWORK_ERROR',createdAt:new Date(now).toISOString()},
    {methodName:'/spin',createdAt:new Date(now-31000).toISOString()},
    {methodName:'/spin',errorCode:'UNKNOWN',createdAt:new Date(now-31000).toISOString()},
    {methodName:'/pay',createdAt:new Date(now-31000).toISOString()},
  ]) assert.equal(isRollbackEligibleSpin(pending,now),false);
});

test('trusted parent requires configured origin, parent window, and contract version',()=>{
  const parent={},other={};const origin='https://partner.example';
  const event={source:parent,origin,data:{source:'hiranmandi-host',contractVersion:'1.0',type:'INIT_CONTEXT'}};
  assert.equal(resolveParentOrigin([origin],origin+'/games',true),origin);
  assert.equal(resolveParentOrigin([origin],'https://evil.example',true),'');
  assert.equal(resolveParentOrigin([],origin,true),'');
  assert.equal(resolveParentOrigin([origin],origin,false),'');
  assert.equal(readHostMessage(event,parent,origin,true),event.data);
  assert.equal(readHostMessage({...event,source:other},parent,origin,true),null);
  assert.equal(readHostMessage({...event,origin:'https://evil.example'},parent,origin,true),null);
  assert.equal(readHostMessage(event,parent,origin,false),null);
  assert.equal(readHostMessage({...event,data:{...event.data,contractVersion:'9'}},parent,origin,true),null);
});
test('documented partner event/data envelope and playerID are supported only for trusted parent',()=>{
  const parent={};const origin='https://partner.example';
  const message=readHostMessage({source:parent,origin,data:{event:'INIT_CONTEXT',data:{token:'fixture',playerID:'partner-42',language:'rus'}}},parent,origin,true);
  assert.equal(message.type,'INIT_CONTEXT');
  assert.deepEqual(message.payload,{token:'fixture',playerID:'partner-42',language:'rus'});
  assert.equal(readHostMessage({source:{},origin,data:{event:'INIT_CONTEXT',data:{}}},parent,origin,true),null);
  const init=normalizeHostInit(message.payload,'khiradmandi-makor');
  assert.equal(init.playerId,'partner-42');
  assert.equal(init.locale,'ru');
});
test('host init accepts only launch fields, never fake session or endpoint overrides',()=>{
  const init=normalizeHostInit({token:"fixture",playerId:7,sessionId:'fake',password:'secret',sessionApiBaseUrl:'https://evil.example',allowedOrigins:['*'],backendMode:'mock',demoMode:true},'khiradmandi-makor');
  assert.equal(init.sessionId,null);assert.equal(init.playerId,'7');assert.equal(init.demoMode,true);
  assert.equal(init.password,undefined);assert.equal(init.sessionApiBaseUrl,undefined);assert.equal(init.allowedOrigins,undefined);assert.equal(init.backendMode,'soap');
  assert.equal(normalizeHostInit({playerId:7},'game'),null);
});
test('real init is required even with supplied session; zero balance is retained',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;let calls=0;
  const service=new SessionApiService();
  const params={token:"fixture",playerId:7,gameId:'khiradmandi-makor',initSource:'postMessage',sessionId:'fake'};
  try {
    globalThis.fetch=async(url,options)=>{calls++;assert.ok(options.signal instanceof AbortSignal);assert.equal(options.headers.Authorization,"Bearer fixture");if(url.endsWith('/freespins')){assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'7'});return new Response(JSON.stringify({CountFreeSpin:'9'}));}if(url.endsWith('/balance')){assert.deepEqual(Object.fromEntries(options.body),{playerId:'7'});return new Response(JSON.stringify({balance:0,currency:'USD',playerId:'7'}));}assert.equal(url,'https://example.invalid/init');assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'7'});return new Response(JSON.stringify({sessionId:'real',balance:999,currency:'USD',playerId:7}));};
    const result=await service.initSession(params);assert.equal(calls,2);assert.equal(result.sessionId,'real');assert.equal(result.player.balance,0);assert.equal(result.freeSpinsLeft,0);
    for(const initSource of ['query','dev-test','missing']) await assert.rejects(service.initSession({...params,initSource}),{code:'ACCESS_DENIED'});assert.equal(calls,2);
    globalThis.fetch=async()=>new Response(JSON.stringify({sessionId:'real',currency:'USD'}));
    await assert.rejects(service.initSession(params),{code:'BACKEND_RESPONSE_ERROR'});
  } finally {globalThis.fetch=original;}
});

test('standalone uses a fresh 1000 USD page wallet without requesting backend balance',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const originalFetch=globalThis.fetch;
  const originalWindow=globalThis.window;
  const runtime={location:{origin:'https://raxshloto.online',hash:'#/games/khiradmandi-makor',search:''}};
  runtime.parent=runtime;
  globalThis.window=runtime;
  const calls=[];
  try {
    globalThis.fetch=async(url)=>{
      calls.push(new URL(url).pathname);
      assert.ok(url.endsWith('/init'));
      return new Response(JSON.stringify({sessionId:'standalone-session',gameState:null}));
    };
    const result=await new SessionApiService().initSession({token:'fixture',playerId:7,gameId:'khiradmandi-makor',initSource:'demo-stand',mode:'standalone'});
    assert.deepEqual(calls,['/init']);
    assert.deepEqual(result.player,{id:7,balance:1000,currency:'USD'});
  } finally {
    globalThis.fetch=originalFetch;
    if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
  }
});
test('startup skips freespins before the first spin and refreshes returning players',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:7,gameId:'khiradmandi-makor',initSource:'postMessage'};
  const previousSpin={
    SpinResult:{idCard:'123',LineSum:'1',Lines:'5',WasDouble:'0',Number:'63455094'},
    ...Object.fromEntries([[9,9,9,10,11],[5,9,12,12,7],[12,9,3,1,6]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),
    idCard:'123',CardSum:'5',SumPay:'0',PayDate:'paid',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'8',
  };
  try {
    for(const gameState of [null,undefined,previousSpin]) {
      for(const count of [0,3]) {
        const calls=[];
        globalThis.fetch=async(url)=>{
          const path=new URL(url).pathname;
          calls.push(path);
          if(path==='/init')return new Response(JSON.stringify({sessionId:'real',gameState}));
          if(path==='/balance')return new Response(JSON.stringify({balance:100,currency:'USD',playerId:7}));
          assert.equal(path,'/freespins');
          assert.ok(gameState,'must not request freespins before the first spin');
          return new Response(JSON.stringify({CountFreeSpin:String(count)}));
        };
        const result=await service.initSession(params);
        assert.deepEqual(calls,gameState ? ['/init','/balance','/freespins'] : ['/init','/balance']);
        assert.equal(result.freeSpinsLeft,0);
        if(gameState)assert.equal(result.gameState.freeSpinsLeft,0);
      }
    }

    freeSpinSeries.recordResult(params,{idCard:'first-award',FreeSpin:1},false);
    freeSpinSeries.reconcile(params,100);
    freeSpinSeries.recordResult(params,{idCard:'retrigger',FreeSpin:1},true);
    globalThis.fetch=async(url)=>{
      if(url.endsWith('/init'))return new Response(JSON.stringify({sessionId:'reopened',gameState:previousSpin}));
      if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:100,currency:'USD',playerId:7}));
      return new Response(JSON.stringify({CountFreeSpin:'103'}));
    };
    const restored=await service.initSession({...params,sessionId:'different-session'});
    assert.equal(restored.freeSpinsLeft,27);
    assert.equal(restored.freeSpinsTotal,30);
    assert.equal(restored.gameState.freeSpinsLeft,27);
    assert.equal(restored.gameState.spinResult.idCard,'123');
    // Historical free spins without the new browser ledger must not reject /init.
    for (const count of [0,3,100]) {
      globalThis.fetch=async(url)=>{
        if(url.endsWith('/init'))return new Response(JSON.stringify({sessionId:'history',gameState:{...previousSpin,SlotFreeSpin:'True',CountFreeSpin:String(count)}}));
        if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:100,currency:'USD',playerId:'history-player'}));
        return new Response(JSON.stringify({CountFreeSpin:String(count)}));
      };
      const history=await service.initSession({...params,playerId:'history-player'});
      assert.equal(history.sessionId,'history');
      assert.equal(history.player.balance,100);
      assert.equal(history.freeSpinHistoryMissing,true);
      assert.equal(history.freeSpinsLeft,null,'Unknown remaining spins must not be presented as zero');
      assert.equal(history.gameState.spinResult.idCard,'123');
    }
  } finally {globalThis.fetch=original;}
});

test('init restores the complete unpaid result of a confirmed interrupted spin',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:'recovery-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  const oldResult={idCard:'old-card',WinSum:0,grid:{A:[1],B:[2],C:[3]}};
  const recovered={
    SpinResult:{idCard:'new-card',LineSum:'45',Lines:'5',WasDouble:'0',Number:'7'},
    ...Object.fromEntries([[1,2,3,4,5],[3,3,3,9,10],[11,12,8,1,2]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),i===0?'9':'0'])),
    idCard:'new-card',CardSum:'5',SumPay:'45',PayDate:'',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'0',
  };
  try {
    stateRecoveryService.saveRound({idCard:'old-card',spinResult:oldResult,lastConfirmedSpinResult:oldResult,grid:oldResult.grid,lastConfirmedGrid:oldResult.grid,operationStatus:'SPIN_PROCESSING'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'lost-spin',methodName:'/spin'},params);
    globalThis.fetch=async(url)=>{
      if(url.endsWith('/init'))return new Response(JSON.stringify({sessionId:'recovered-session',gameState:recovered}));
      if(url.endsWith('/balance'))return new Response(JSON.stringify({balance:100,currency:'USD',playerId:'recovery-player'}));
      return new Response(JSON.stringify({CountFreeSpin:'0'}));
    };
    const result=await service.initSession(params);
    assert.equal(result.spinRecovered,true);
    assert.equal(result.gameState.spinResult.idCard,'new-card');
    assert.equal(result.gameState.spinResult.WinSum,45);
    assert.equal(result.gameState.spinResult.creditedToBalance,false);
    assert.equal(result.gameState.spinResult.LineWinKoff[0],9);
    assert.equal(result.gameState.spinResult.lineWins[0].coefficient,9);
    assert.equal(stateRecoveryService.getPendingRequest(params),null);
  } finally {
    stateRecoveryService.completePendingRequest('lost-spin',params);
    stateRecoveryService.clearLocalState(params);
    globalThis.fetch=original;
  }
});

test('init restores an interrupted first spin when no earlier card exists',async()=>{
  const params={token:'fixture',playerId:'first-spin-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  stateRecoveryService.rememberPendingRequest({requestId:'first-lost-spin',methodName:'/spin'},params);
  assert.deepEqual(stateRecoveryService.getPendingRequest(params).recoveryState,{});
  stateRecoveryService.completePendingRequest('first-lost-spin',params);
});

test('init keeps interrupted spin blocked when server returns the old card',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:'unchanged-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  const oldCard={
    SpinResult:{idCard:'same-card',LineSum:'0',Lines:'5',WasDouble:'0',Number:'7'},
    ...Object.fromEntries([[1,2,3,4,5],[6,7,8,9,10],[11,12,8,1,2]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),
    idCard:'same-card',CardSum:'5',SumPay:'0',PayDate:'paid',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'0',
  };
  try {
    const oldResult={idCard:'same-card',WinSum:0,grid:{A:[1],B:[2],C:[3]}};
    stateRecoveryService.saveRound({idCard:'same-card',spinResult:oldResult,lastConfirmedSpinResult:oldResult,operationStatus:'SPIN_PROCESSING'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'unknown-spin',methodName:'/spin'},params);
    globalThis.fetch=async(url)=>url.endsWith('/init')
      ? new Response(JSON.stringify({sessionId:'same-session',gameState:oldCard}))
      : url.endsWith('/balance')
        ? new Response(JSON.stringify({balance:100,currency:'USD',playerId:'unchanged-player'}))
        : new Response(JSON.stringify({CountFreeSpin:'0'}));
    const result=await service.initSession(params);
    assert.equal(result.spinRecovered,false);
    assert.equal(stateRecoveryService.getPendingRequest(params).requestId,'unknown-spin');
  } finally {
    stateRecoveryService.completePendingRequest('unknown-spin',params);
    stateRecoveryService.clearLocalState(params);
    globalThis.fetch=original;
  }
});

test('init restores an unpaid win instead of replaying a transport-failed payment',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:'unpaid-pay-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  const raw={
    SpinResult:{idCard:'unpaid-card',LineSum:'45',Lines:'5',WasDouble:'0',Number:'7'},
    ...Object.fromEntries([[3,3,3,4,5],[6,7,8,9,10],[11,12,8,1,2]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),i===0?'9':'0'])),
    idCard:'unpaid-card',CardSum:'5',SumPay:'45',PayDate:'',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'0',
  };
  try {
    stateRecoveryService.saveRound({idCard:'unpaid-card',spinResult:{idCard:'unpaid-card',WinSum:45},operationStatus:'WAITING_FOR_COLLECT'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'lost-pay',methodName:'/pay',idCard:'unpaid-card'},params);
    globalThis.fetch=async(url)=>url.endsWith('/init')
      ? new Response(JSON.stringify({sessionId:'unpaid-session',gameState:raw}))
      : url.endsWith('/balance')
        ? new Response(JSON.stringify({balance:100,currency:'USD',playerId:'unpaid-pay-player'}))
        : new Response(JSON.stringify({CountFreeSpin:'0'}));
    const result=await service.initSession(params);
    assert.equal(result.paymentRecovered,false);
    assert.equal(result.gameState.spinResult.WinSum,45);
    assert.equal(result.gameState.spinResult.creditedToBalance,false);
    assert.equal(stateRecoveryService.getPendingRequest(params),null);
    assert.equal(stateRecoveryService.getLocalState(params).operationStatus,'WAITING_FOR_COLLECT');
    assert.equal(stateRecoveryService.getLocalState(params).spinResult.WinSum,45);
  } finally {
    stateRecoveryService.completePendingRequest('lost-pay',params);
    stateRecoveryService.clearLocalState(params);
    globalThis.fetch=original;
  }
});
test('network-failed spin stays blocked when init still returns the previous card',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:'rollback-spin-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  const grid={A:[1,2,3,4,5],B:[6,7,8,9,10],C:[11,12,8,1,2]};
  const previousResult={idCard:'previous-card',WinSum:20,creditedToBalance:false,winningCells:[{row:'A',col:0}],lineWins:[{line:1}],grid};
  const raw={
    SpinResult:{idCard:'previous-card',LineSum:'20',Lines:'5',WasDouble:'0',Number:'7'},
    ...Object.fromEntries(Object.values(grid).map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),
    LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),i===0?'4':'0'])),
    idCard:'previous-card',CardSum:'5',SumPay:'20',PayDate:'',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'0',
  };
  try {
    stateRecoveryService.saveRound({spinResult:previousResult,lastConfirmedSpinResult:previousResult,grid,lastConfirmedGrid:grid,operationStatus:'SPIN_PROCESSING'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'network-spin',methodName:'/spin'},params);
    stateRecoveryService.markRecoveryRequired({code:'NETWORK_ERROR'}, {}, params);
    globalThis.fetch=async(url)=>url.endsWith('/init')
      ? new Response(JSON.stringify({sessionId:'rollback-session',gameState:raw}))
      : url.endsWith('/balance')
        ? new Response(JSON.stringify({balance:100,currency:'USD',playerId:'rollback-spin-player'}))
        : new Response(JSON.stringify({CountFreeSpin:'0'}));
    const result=await service.initSession(params);
    assert.equal(result.spinRecovered,false);
    assert.equal(result.spinRolledBack,false);
    assert.equal(stateRecoveryService.getPendingRequest(params).requestId,'network-spin');
    const restored=stateRecoveryService.getLocalState(params);
    assert.equal(restored.operationStatus,'SPIN_PROCESSING');
    assert.equal(restored.spinResult.WinSum,20);
    assert.deepEqual(restored.spinResult.winningCells,[{row:'A',col:0}]);
  } finally {
    stateRecoveryService.completePendingRequest('network-spin',params);
    stateRecoveryService.clearLocalState(params);
    globalThis.fetch=original;
  }
});

test('network-failed first spin stays blocked when init has no operation status',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch;
  const service=new SessionApiService();
  const params={token:'fixture',playerId:'first-rollback-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  try {
    stateRecoveryService.saveRound({operationStatus:'SPIN_PROCESSING'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'first-network-spin',methodName:'/spin'},params);
    stateRecoveryService.markRecoveryRequired({code:'NETWORK_ERROR'}, {}, params);
    globalThis.fetch=async(url)=>url.endsWith('/init')
      ? new Response(JSON.stringify({sessionId:'first-rollback-session',gameState:null}))
      : url.endsWith('/balance')
        ? new Response(JSON.stringify({balance:100,currency:'USD',playerId:'first-rollback-player'}))
        : new Response(JSON.stringify({CountFreeSpin:'0'}));
    const result=await service.initSession(params);
    assert.equal(result.spinRecovered,false);
    assert.equal(result.spinRolledBack,false);
    assert.equal(stateRecoveryService.getPendingRequest(params).requestId,'first-network-spin');
    assert.ok(stateRecoveryService.getLocalState(params));
  } finally {
    stateRecoveryService.completePendingRequest('first-network-spin',params);
    stateRecoveryService.clearLocalState(params);
    globalThis.fetch=original;
  }
});
test('auto-express free-spin count survives ordinary leave and reopen',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch,service=new SessionApiService();
  const params={token:'fixture',playerId:'auto-exit-player',gameId:'khiradmandi-makor',initSource:'postMessage'};
  const raw={SpinResult:{idCard:'free-2',LineSum:'0',Lines:'5',WasDouble:'0',Number:'7'},...Object.fromEntries([[1,2,3,4,5],[6,7,8,9,10],[11,12,8,1,2]].map((row,r)=>['Line'+(r+1),Object.fromEntries(row.map((v,c)=>['Slot'+(r+1)+(c+1),String(v)]))])),LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),idCard:'free-2',CardSum:'5',SumPay:'0',PayDate:'',idGameType:'36',SlotFreeSpin:'True',SlotDemoSpin:'False',CountFreeSpin:'502'};
  try {
    freeSpinSeries.recordResult(params,{idCard:'auto-award',FreeSpin:1,WinSum:0},false);
    freeSpinSeries.reconcile(params,500);
    freeSpinSeries.recordResult(params,{idCard:'free-1',FreeSpin:0,WinSum:0},true);
    freeSpinSeries.recordResult(params,{idCard:'free-2',FreeSpin:0,WinSum:0},true);
    globalThis.fetch=async(url)=>url.endsWith('/init')?new Response(JSON.stringify({sessionId:'auto-reopened',gameState:raw})):url.endsWith('/balance')?new Response(JSON.stringify({balance:100,currency:'USD',playerId:params.playerId})):new Response(JSON.stringify({CountFreeSpin:'502'}));
    const result=await service.initSession(params);
    assert.deepEqual({total:result.freeSpinsTotal,played:result.freeSpinsPlayed,left:result.freeSpinsLeft},{total:15,played:2,left:13});
  } finally {stateRecoveryService.clearLocalState(params);globalThis.fetch=original;}
});

test('interrupted auto-express trigger rebuilds its missed 15-spin award',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
  const original=globalThis.fetch,service=new SessionApiService();
  try {for(const interruption of ['leave','network']) {
    const params={token:'fixture',playerId:'auto-trigger-'+interruption,gameId:'khiradmandi-makor',initSource:'postMessage'};
    const raw={SpinResult:{idCard:'award-'+interruption,LineSum:'0',Lines:'5',WasDouble:'0',Number:'7'},Line1:{Slot11:'0',Slot12:'0',Slot13:'0',Slot14:'4',Slot15:'5'},Line2:{Slot21:'6',Slot22:'7',Slot23:'8',Slot24:'9',Slot25:'10'},Line3:{Slot31:'11',Slot32:'12',Slot33:'8',Slot34:'1',Slot35:'2'},LinesKoff:Object.fromEntries(Array.from({length:10},(_,i)=>['Koff'+(i+1),'0'])),idCard:'award-'+interruption,CardSum:'5',SumPay:'0',PayDate:'',idGameType:'36',SlotFreeSpin:'False',SlotDemoSpin:'False',CountFreeSpin:'700'};
    stateRecoveryService.saveRound({operationStatus:'SPIN_PROCESSING'},params);
    stateRecoveryService.rememberPendingRequest({requestId:'lost-award-'+interruption,methodName:'/spin',isFreeSpin:false},params);
    if(interruption==='network')stateRecoveryService.markRecoveryRequired({code:'NETWORK_ERROR'}, {}, params);
    globalThis.fetch=async(url)=>url.endsWith('/init')?new Response(JSON.stringify({sessionId:'recovered-'+interruption,gameState:raw})):url.endsWith('/balance')?new Response(JSON.stringify({balance:100,currency:'USD',playerId:params.playerId})):new Response(JSON.stringify({CountFreeSpin:'700'}));
    const result=await service.initSession(params);
    assert.equal(result.spinRecovered,true);
    assert.equal(result.gameState.spinResult.FreeSpin,1);
    assert.deepEqual({total:result.freeSpinsTotal,played:result.freeSpinsPlayed,left:result.freeSpinsLeft},{total:15,played:0,left:15});
    assert.equal(stateRecoveryService.getPendingRequest(params),null);
    stateRecoveryService.clearLocalState(params);
  }} finally {globalThis.fetch=original;}
});
