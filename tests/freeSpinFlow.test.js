import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { webcrypto } from 'node:crypto';
import { buildSpinForm } from '../src/api/spinApiClient.js';

test('all eight games show autoplay awards and extend an active free-spin series',async()=>{
  const originalFetch=globalThis.fetch;
  const store=new Map();
  globalThis.window={ crypto:webcrypto, addEventListener(){},dispatchEvent(){},
    sessionStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},
    setTimeout:(fn,ms)=>{const id=setTimeout(fn,ms >= 9000 ? ms : 0);id.unref();return id;},clearTimeout,
  };
  const server=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'tmp/vite-tests',server:{middlewareMode:true,watch:null,hmr:false},appType:'custom'});
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
        const context={token:'fixture',gameId,recoveryGameId:gameId,sessionId:'award-'+gameId+'-'+free,userId:7};
        const live={current:{context,carpetCloseMs:0,carpetOpenMs:0,doubleState:{},doublingState:{},freeSpinsLeft:free?1:0,freeSpinsTotal:free?1:0,player:{balance:100},selectedCombination:{groups:[{}],id:'one'},stake:1,status:'ready',visualMode:true}};
        let calls=0,paid=0,prompt=false,autoplay=true;const events=[];const errors=[];
        frameApi.spin=async(params)=>{calls++;const form=buildSpinForm(params,context);assert.equal(form.get('freeSpin'),live.current.freeSpinsLeft > 0 ? '1' : '0');assert.equal(form.get('freeSpin'),free || calls > 1 ? '1' : '0');if(free || calls > 1)assert.equal(form.get('demoSpin'),'0');return {backendManagedWallet:true,balance,idCard:'round',WinSum:free || params.isFreeSpin ? 0 : 5,FreeSpin:free || !params.isFreeSpin ? 1 : 0,Gold:0,grid:{A:[0,0,0,0,0],B:[],C:[]}};};
        frameApi.pay=async()=>{paid++;return {balance:105};};
        const options={liveSpinStateRef:live,autoPlayOnRef:{current:!free},setAutoPlayOn:v=>autoplay=v,freeSpinRunRef:{current:false},t:k=>k,postEvent:(type,payload)=>events.push({type,payload}),reportOperationError:e=>errors.push(e)};
        for(const name of ['emitLotteryRevealSounds','emitSound','playSpinFeedback','setError','setHasRecoveredGrid','setShowFreeSpinPrompt','setLastKnownState','onRecoveryRequired']) options[name]=()=>{};
        for(const key of ['DoubleState','DoublingState','Player','FreeSpinsLeft','FreeSpinsTotal','FreeSpinRoundStarted','Grid','GridAnimation','GridRevealKey','SpinHistory','SpinResult','Status']) {
          const prop=key[0].toLowerCase()+key.slice(1);
          options['set'+key]=value=>{live.current[prop]=typeof value==='function'?value(live.current[prop]??(key==='SpinHistory'?[]:0)):value;};
        }
        options.setShowFreeSpinPrompt=v=>prompt=v;
        globalThis.fetch=async(url)=>{assert.ok(url.endsWith('/freespins'));return new Response(JSON.stringify({CountFreeSpin:String(free?21:Math.max(0,4-calls))}));};
        const actions=createSpinActions(options);
        if(free) await actions.handleSpin({freeSpinAuto:true});
        else await actions.onAutoPlay();
        assert.equal(calls,free?1:4,gameId+' automatic bonus requests');
        assert.equal(live.current.freeSpinsLeft,free?21:0,gameId+' remaining');
        assert.equal(live.current.freeSpinsTotal,0,gameId+' total');
        assert.equal(prompt,false,gameId+' no modal click required');
        assert.equal(paid,free?0:1,'Award cash win is collected automatically');
        if(!free){assert.equal(live.current.player.balance,100);assert.equal(live.current.spinResult.WinSum,0);assert.equal(autoplay,true);assert.equal(options.autoPlayOnRef.current,true);}
        assert.equal(errors.length,0,gameId+' errors');
        if (!free) {
          live.current.spinResult={idCard:'modal-win',idPartnerCard:'partner',WinSum:5,backendManagedWallet:true,creditedToBalance:false};
          live.current.doublingState={currentAmount:5};
          live.current.freeSpinsLeft=1;
          const order=[];
          frameApi.pay=async()=>{order.push('pay');return {balance:110};};
          frameApi.spin=async(params)=>{assert.equal(buildSpinForm(params,context).get('freeSpin'),'1');order.push('spin');return {backendManagedWallet:true,balance:110,idCard:'bonus',WinSum:0,FreeSpin:0,Gold:0,grid:{A:[0,0,0,0,0],B:[],C:[]}};};
          globalThis.fetch=async()=>new Response(JSON.stringify({CountFreeSpin:'0'}));
          await actions.startFreeSpinRun();
          assert.deepEqual(order,['pay','spin'],'Modal must collect before the first free spin');
          assert.equal(live.current.freeSpinsLeft,0);
          assert.equal(autoplay,true,gameId+" resumes Auto Express after bonus");
          assert.equal(options.autoPlayOnRef.current,true);
          options.autoPlayOnRef.current=false;
          live.current.spinResult=null;
          live.current.doublingState={};
          let manualCalls=0;
          frameApi.spin=async()=>{manualCalls++;return {backendManagedWallet:true,balance:110,idCard:'manual',WinSum:0,FreeSpin:1,Gold:0,grid:{A:[0,0,0,0,0],B:[],C:[]}};};
          globalThis.fetch=async()=>new Response(JSON.stringify({CountFreeSpin:'8'}));
          await actions.handleSpin();
          assert.equal(manualCalls,1);
          assert.equal(prompt,true,'Manual play still waits for the modal button');
          assert.equal(live.current.freeSpinsLeft,8);
          assert.equal(errors.length,0);
          globalThis.fetch=async()=>{throw new TypeError('count unavailable');};
          const beforeFailure=manualCalls;
          assert.equal(await actions.handleSpin(),null);
          assert.equal(manualCalls,beforeFailure+1);
          assert.equal(live.current.freeSpinsLeft,8,'Failed lookup must not decrement or assume zero');
          assert.equal(live.current.freeSpinCountUnknown,true);
          assert.equal(live.current.spinResult.idCard,'manual','Completed result is preserved');
          assert.equal(errors.length,1);
          globalThis.fetch=async()=>new Response(JSON.stringify({CountFreeSpin:'5'}));
          assert.equal(await actions.handleSpin(),null,'Retry only reads the count');
          assert.equal(manualCalls,beforeFailure+1,'No duplicate spin during counter recovery');
          assert.equal(live.current.freeSpinsLeft,5);
          assert.equal(live.current.freeSpinCountUnknown,false);
          // Re-enter with the server's remaining count, switch views, and resume.
          for(const visualMode of [false,true]) {
            live.current={...live.current,visualMode,freeSpinsLeft:2,freeSpinCountUnknown:false,freeSpinRoundStarted:false,spinResult:null,doublingState:{},status:'ready'};
            let resumed=0;
            frameApi.spin=async(params)=>{
              assert.equal(params.isFreeSpin,true);
              assert.equal(params.isDemo,false);
              resumed++;
              return {backendManagedWallet:true,balance:110,idCard:'resumed-'+resumed,WinSum:0,FreeSpin:0,grid:{A:[1,1,1,1,1],B:[1,1,1,1,1],C:[1,1,1,1,1]}};
            };
            globalThis.fetch=async()=>new Response(JSON.stringify({CountFreeSpin:String(2-resumed)}));
            await actions.startFreeSpinRun();
            assert.equal(resumed,2);
            assert.equal(live.current.freeSpinsLeft,0);
            assert.equal(live.current.freeSpinRoundStarted,false);
            // A failed request must release the running flag, keeping the remaining count.
            live.current.freeSpinsLeft=2;
            frameApi.spin=async()=>{throw Object.assign(new Error('rejected'),{code:'BAD_REQUEST'});};
            globalThis.fetch=async(url)=>new Response(JSON.stringify(url.endsWith('/balance')?{balance:110,currency:'GEL',playerId:7}:{CountFreeSpin:'2'}));
            await actions.startFreeSpinRun();
            assert.equal(live.current.freeSpinsLeft,2);
            assert.equal(live.current.freeSpinRoundStarted,false);
            assert.equal(options.freeSpinRunRef.current,false);
          }

        }
      }
    }
  } finally {globalThis.fetch=originalFetch;await server.close();delete globalThis.window;}
});
