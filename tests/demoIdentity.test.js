import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { getDemoPlayerId } from '../src/api/demoIdentity.js';
import { buildDemoLaunch } from '../src/api/demoLaunch.js';
import { buildSpinForm } from '../src/api/spinApiClient.js';
import { buildPayForm } from '../src/api/payApiClient.js';
const browser=()=>{const values=new Map();return {crypto:webcrypto,localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)}};};
test('different computers get independent IDs that survive refresh',async()=>{
 const chrome=browser(),bossChrome=browser(),id=await getDemoPlayerId(chrome);
 assert.match(id,/^\d{40}$/);
 assert.notEqual(await getDemoPlayerId(bossChrome),id);
 assert.equal(await getDemoPlayerId({...chrome}),id);
});
test('simultaneous tabs reuse one identity under the browser lock',async()=>{
 const runtime=browser();let queue=Promise.resolve();
 runtime.navigator={locks:{request:(_name,callback)=>{queue=queue.then(callback);return queue;}}};
 const ids=await Promise.all(Array.from({length:8},()=>getDemoPlayerId({...runtime})));
 assert.equal(new Set(ids).size,1);
});
test('storage failure or corruption never falls back to player 7',async()=>{
 const runtime=browser();runtime.localStorage.setItem=()=>{throw Error('blocked');};
 await assert.rejects(getDemoPlayerId(runtime),{code:'CONFIGURATION_ERROR'});
 runtime.localStorage.getItem=()=>'7';
 await assert.rejects(getDemoPlayerId(runtime),{code:'CONFIGURATION_ERROR'});
});
test('launch, spin, free spin and pay preserve the complete ID across games',async()=>{
 const id=await getDemoPlayerId(browser()),launch=buildDemoLaunch('fixture',id);
 for(const key of ['playerId','userId','idUser'])assert.equal(launch[key],id);
 for(const gameId of ['36','37']){
 const context={...launch,gameId};
 for(const isFreeSpin of [false,true])assert.equal(buildSpinForm({requestId:'spin',stake:1,lines:1,isFreeSpin},context).get('playerId'),id);
 assert.equal(buildPayForm({requestId:'pay',idCard:'card'},context).get('playerId'),id);
 }
});
