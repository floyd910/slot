import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { webcrypto } from 'node:crypto';

test('remote spins avoid partner mutations and retain unpaid wins',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>new Response(JSON.stringify({error_code:400,error:"fixture rejected"}),{status:400});
  const store=new Map();
  globalThis.window={ crypto:webcrypto, addEventListener(){},dispatchEvent(){},
    sessionStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
    setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms);id.unref();return id;},clearTimeout,
  };
  const server=await createServer({configFile:false,cacheDir:'tmp/vite-tests',server:{middlewareMode:true,watch:null},appType:'custom'});
  try {
    const {createSpinActions}=await server.ssrLoadModule('/src/controllers/spinActions.js');
    const {frameApi}=await server.ssrLoadModule('/src/api/frameApi.js');
    const {partnerApi}=await server.ssrLoadModule('/src/services/partnerApi.js');
    const {mergeRuntimeConfig}=await server.ssrLoadModule('/src/api/runtimeConfig.js');
    const {stateRecoveryService}=await server.ssrLoadModule('/src/services/stateRecoveryService.js');
    mergeRuntimeConfig({backendMode:'soap'});
    partnerApi.registerBet=async()=>{throw new Error('Duplicate partner registration');};
    partnerApi.settleRound=async()=>{throw new Error('Duplicate partner settlement');};
    partnerApi.cancelBet=async()=>{throw new Error('Duplicate partner cancellation');};
    for(const balance of [undefined,0,95]) {
      for(const free of [false,true]) {
        const context={token:'fixture',gameId:'khiradmandi-makor',sessionId:'test-'+balance+'-'+free,userId:7};
        mergeRuntimeConfig({...context,playerId:7});
        const live={current:{context,carpetCloseMs:0,carpetOpenMs:0,doubleState:{},doublingState:{},freeSpinsLeft:free?1:0,freeSpinsTotal:free?1:0,player:{balance:100},selectedCombination:{groups:[{}],id:'one'},stake:1,status:'ready',visualMode:true}};
        let calls=0;const events=[];const errors=[];
        frameApi.spin=async()=>{calls++;return {backendManagedWallet:true,balance,idCard:'round',idPartnerCard:'partner-0001',WinSum:5,FreeSpin:0,Gold:0,grid:{A:[0,0,0,0,0],B:[1,1,1,1,1],C:[2,2,2,2,2]}};};
        const options={liveSpinStateRef:live,autoPlayOnRef:{current:false},freeSpinRunRef:{current:false},t:k=>k,postEvent:(type,payload)=>events.push({type,payload}),reportOperationError:e=>errors.push(e)};
        for(const name of ['emitLotteryRevealSounds','emitSound','playSpinFeedback','setError','setHasRecoveredGrid','setShowFreeSpinPrompt','setLastKnownState','onRecoveryRequired']) options[name]=()=>{};
        for(const key of ['DoubleState','DoublingState','Player','FreeSpinsLeft','FreeSpinsTotal','FreeSpinRoundStarted','Grid','GridAnimation','GridRevealKey','SpinHistory','SpinResult','Status']) {
          const prop=key[0].toLowerCase()+key.slice(1);
          options['set'+key]=value=>{live.current[prop]=typeof value==='function'?value(live.current[prop]??(key==='SpinHistory'?[]:0)):value;};
        }
        const actions=createSpinActions(options);
        const result=await actions.handleSpin();
        assert.ok(result);assert.equal(result.creditedToBalance,undefined); // returned raw result; saved result carries credit status
        assert.equal(live.current.spinResult.creditedToBalance,false);
        assert.equal(live.current.player.balance,balance??100);
        assert.equal(events.filter(e=>e.type==='UPDATE_BALANCE').length,balance==null?0:1);
        globalThis.fetch=async(url)=>url.endsWith('/balance')
          ? new Response(JSON.stringify({balance:73,currency:'GEL',playerId:'7'}))
          : new Response(JSON.stringify({error_code:400,error:'fixture rejected'}),{status:400});
        const originalPay=frameApi.pay;
        frameApi.pay=params=>{assert.equal(params.idPartnerCard,'partner-0001');return originalPay(params);};
        assert.equal(await actions.collectWin(),false);
        frameApi.pay=originalPay;
        assert.equal(errors.at(-1).code,'BAD_REQUEST');
        assert.equal(live.current.player.balance,73);
        assert.equal(live.current.spinResult.idCard,'round');
        assert.ok(stateRecoveryService.getLocalState(context));
        assert.equal(await actions.handleSpin(),null);assert.equal(calls,1);
        if(free){live.current.freeSpinsLeft=2;live.current.freeSpinsTotal=3;}
        globalThis.fetch=async()=>new Response(JSON.stringify({idCard:'round',PayDate:'9/15/2026 5:44:20 PM',ballance:1820}));
        assert.equal(await actions.collectWin(),true);
        const paidSnapshot=stateRecoveryService.getLastSpin(context);
        assert.equal(paidSnapshot.spinResult.creditedToBalance,true);
        assert.equal(paidSnapshot.spinResult.WinSum,0);
        assert.deepEqual(paidSnapshot.spinResult.winningCells,[]);
        assert.deepEqual(paidSnapshot.spinResult.lineWins,[]);
        assert.deepEqual(paidSnapshot.spinResult.scatterCells,[]);
        assert.equal(live.current.player.balance,1820);
        assert.equal(live.current.spinResult,null);
        assert.equal(events.filter(e=>e.type==='UPDATE_BALANCE').at(-1).payload.balance,1820);
        globalThis.fetch=async()=>new Response(JSON.stringify({balance:0,currency:'GEL',playerId:'7'}));
        await actions.refreshBalance();
        assert.equal(live.current.player.balance,0);
        assert.equal(events.at(-1).payload.balance,0);
        let resolveBalance;
        globalThis.fetch=()=>new Promise(resolve=>{resolveBalance=resolve;});
        const staleRefresh=actions.refreshBalance();
        live.current={...live.current,balanceVersion:(live.current.balanceVersion??0)+1,player:{...live.current.player,balance:500}};
        resolveBalance(new Response(JSON.stringify({balance:10,currency:'GEL',playerId:'7'})));
        assert.equal(await staleRefresh,null);
        assert.equal(live.current.player.balance,500);
        if(free)assert.equal(stateRecoveryService.getLocalState(context).freeSpinsLeft,2);
        else assert.equal(stateRecoveryService.getLocalState(context),null);
        globalThis.fetch=async()=>new Response(JSON.stringify({error_code:400,error:'fixture rejected'}),{status:400});
      }
    }
    const {gameApiService}=await server.ssrLoadModule('/src/services/gameApiService.js');
    const unknownContext={token:'fixture',sessionId:'unknown-pay',gameId:'fruits',playerId:7,backendMode:'soap',sessionApiBaseUrl:'https://example.invalid'};
    mergeRuntimeConfig(unknownContext);
    let attempts=0;globalThis.fetch=async()=>{attempts++;throw new TypeError('network lost');};
    await assert.rejects(gameApiService.pay({idCard:'unknown',idPartnerCard:'partner',requestId:'same-pay'}),{code:'NETWORK_ERROR'});
    assert.equal(stateRecoveryService.getPendingRequest(unknownContext).requestId,'same-pay');
    assert.equal(stateRecoveryService.getPendingRequest(unknownContext).status,'recovery-required');
    await assert.rejects(gameApiService.pay({idCard:'unknown',idPartnerCard:'partner',requestId:'another-pay'}),{code:'RECOVERY_REQUIRED'});
    assert.equal(attempts,1);
    const {createDoubleActions}=await server.ssrLoadModule('/src/controllers/doubleActions.js');
    const {DOUBLE_MAX_STEPS,createEmptyDoublingState}=await server.ssrLoadModule('/src/config/gameSettings.js');
    const context={gameId:'khiradmandi-makor',sessionId:'double-limit',userId:7};
    const live={current:{context,status:'ready',player:{balance:100},spinResult:{idCard:'max',WinSum:10,backendManagedWallet:true},doublingState:{...createEmptyDoublingState(),step:DOUBLE_MAX_STEPS-1,currentAmount:10}}};
    const options={liveSpinStateRef:live,emitSound(){},postEvent(){},reportError:e=>{throw e;},t:k=>k};
    for(const key of ['DoubleState','DoublingState','GridAnimation','LastKnownState','Player','SpinResult','Status']) {
      const prop=key[0].toLowerCase()+key.slice(1);
      options['set'+key]=v=>{live.current[prop]=typeof v==='function'?v(live.current[prop]):v;};
    }
    let paid=0;frameApi.pay=async()=>{paid++;};
    frameApi.double=async()=>({idCard:'max',WinSum:20});
    window.setTimeout=(fn,ms)=>{const id=setTimeout(fn,ms===9000?ms:0);id.unref();return id;};
    await createDoubleActions(options).playFooterDouble();
    await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(paid,0);assert.equal(live.current.player.balance,100);
    assert.equal(live.current.doublingState.loading,false);
    assert.equal(live.current.spinResult.WinSum,20);
    assert.equal(stateRecoveryService.getLocalState(context).currentWinSum,20);
  } finally {globalThis.fetch=originalFetch;await server.close();delete globalThis.window;}
});
