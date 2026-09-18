import test from 'node:test';
import assert from 'node:assert/strict';
import {isStandaloneDemo,isDemoContext,requestDemoLaunch,buildDemoLaunch} from '../src/api/demoLaunch.js';
const standalone=(origin='https://raxshloto.online',hash='#/slots')=>{const runtime={location:{origin,hash}};runtime.parent=runtime;return runtime;};
test('demo is restricted to standalone stand routes',()=>{
 assert.equal(isStandaloneDemo(standalone()),true);
 assert.equal(isStandaloneDemo(standalone(undefined,'#/games/babylon')),true);
 assert.equal(isStandaloneDemo(standalone('https://casino.example')),false);
 assert.equal(isStandaloneDemo(standalone(undefined,'#/other')),false);
 for(const origin of ['https://raxshloto.online','https://casino.example']){const framed=standalone(origin);framed.parent={};assert.equal(isStandaloneDemo(framed),false);}
});
test('embedded sessions cannot use standalone credentials',async()=>{
 const previous=globalThis.window;
 try{globalThis.window=standalone();globalThis.window.parent={};
 for(const context of [{initSource:'missing'},{initSource:'postMessage',token:'expired',playerId:7},{initSource:'demo-stand',token:'fixture',playerId:7}]){
 assert.equal(isDemoContext(context),false);await assert.rejects(requestDemoLaunch(),{code:'ACCESS_DENIED'});
 }}finally{globalThis.window=previous;}
});
test('provided demo credentials preserve real backend gameplay',()=>{
 assert.deepEqual(buildDemoLaunch('real-demo-fixture',7),{token:'real-demo-fixture',playerId:'7',userId:'7',idUser:'7',demoMode:false,initSource:'demo-stand'});
 for(const [token,id] of [['',7],[undefined,7],['fixture','']])assert.throws(()=>buildDemoLaunch(token,id),{code:'CONFIGURATION_ERROR'});
});
test('standalone initialization never calls a demo server endpoint',async()=>{
 const previous=globalThis.window,original=globalThis.fetch;let calls=0;
 try{globalThis.window=standalone();globalThis.fetch=()=>{calls++;throw Error('unexpected network');};
 // Node has no Vite build configuration; missing credentials must fail locally.
 await assert.rejects(requestDemoLaunch(),{code:'CONFIGURATION_ERROR'});assert.equal(calls,0);
 }finally{globalThis.window=previous;globalThis.fetch=original;}
});
