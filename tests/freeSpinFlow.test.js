import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { webcrypto } from 'node:crypto';

test('all eight games show autoplay awards and extend an active free-spin series',async()=>{
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
    for(const gameId of ['ganchina-sokrovishch','marvorid-djemchug','khiradmandi-makor','egypt','kadima-drevnii','khocha-afandi','babylon','fruits']) {
      const balance=100;
      for(const free of [false,true]) {
        const context={gameId,recoveryGameId:gameId,sessionId:'award-'+gameId+'-'+free,userId:7};
        const live={current:{context,carpetCloseMs:0,carpetOpenMs:0,doubleState:{},doublingState:{},freeSpinsLeft:free?1:0,freeSpinsTotal:free?1:0,player:{balance:100},selectedCombination:{groups:[{}],id:'one'},stake:1,status:'ready',visualMode:true}};
        let calls=0,paid=0,prompt=false,autoplay=true;const events=[];const errors=[];
        frameApi.spin=async()=>{calls++;return {backendManagedWallet:true,balance,idCard:'round',WinSum:free?0:5,FreeSpin:1,Gold:0,grid:{A:[0,0,0,0,0],B:[],C:[]}};};
        frameApi.pay=async()=>{paid++;return {balance:105};};
        const options={liveSpinStateRef:live,autoPlayOnRef:{current:!free},setAutoPlayOn:v=>autoplay=v,freeSpinRunRef:{current:false},t:k=>k,postEvent:(type,payload)=>events.push({type,payload}),reportOperationError:e=>errors.push(e)};
        for(const name of ['emitLotteryRevealSounds','emitSound','playSpinFeedback','setError','setHasRecoveredGrid','setShowFreeSpinPrompt','setLastKnownState','onRecoveryRequired']) options[name]=()=>{};
        for(const key of ['DoubleState','DoublingState','Player','FreeSpinsLeft','FreeSpinsTotal','FreeSpinRoundStarted','Grid','GridAnimation','GridRevealKey','SpinHistory','SpinResult','Status']) {
          const prop=key[0].toLowerCase()+key.slice(1);
          options['set'+key]=value=>{live.current[prop]=typeof value==='function'?value(live.current[prop]??(key==='SpinHistory'?[]:0)):value;};
        }
        options.setShowFreeSpinPrompt=v=>prompt=v;
        const actions=createSpinActions(options);
        if(free) await actions.handleSpin({freeSpinAuto:true});
        else await actions.onAutoPlay();
        assert.equal(calls,1,gameId+' should make one request');
        assert.equal(live.current.freeSpinsLeft,15,gameId+' remaining');
        assert.equal(live.current.freeSpinsTotal,free?16:15,gameId+' total');
        assert.equal(prompt,!free,gameId+' award prompt');
        assert.equal(paid,free?0:1,'Award cash win is collected automatically');
        if(!free){assert.equal(live.current.player.balance,105);assert.equal(live.current.spinResult,null);assert.equal(autoplay,false);assert.equal(options.autoPlayOnRef.current,false);}
        assert.equal(errors.length,0,gameId+' errors');
        if (!free) {
          live.current.spinResult={idCard:'modal-win',idPartnerCard:'partner',WinSum:5,backendManagedWallet:true,creditedToBalance:false};
          live.current.doublingState={currentAmount:5};
          live.current.freeSpinsLeft=1;
          const order=[];
          frameApi.pay=async()=>{order.push('pay');return {balance:110};};
          frameApi.spin=async()=>{order.push('spin');return {backendManagedWallet:true,balance:110,idCard:'bonus',WinSum:0,FreeSpin:0,Gold:0,grid:{A:[0,0,0,0,0],B:[],C:[]}};};
          await actions.startFreeSpinRun();
          assert.deepEqual(order,['pay','spin'],'Modal must collect before the first free spin');
          assert.equal(live.current.freeSpinsLeft,0);
          assert.equal(autoplay,true,gameId+" resumes Auto Express after bonus");
          assert.equal(options.autoPlayOnRef.current,true);
          assert.equal(errors.length,0);
        }
      }
    }
  } finally {await server.close();delete globalThis.window;}
});
