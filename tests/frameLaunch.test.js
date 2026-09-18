import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveParentOrigin, readHostMessage, normalizeHostInit } from '../src/api/frameLaunch.js';
import { SessionApiService } from '../src/services/sessionApiService.js';
import { mergeRuntimeConfig } from '../src/api/runtimeConfig.js';

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
    globalThis.fetch=async(url,options)=>{calls++;assert.equal(options.headers.Authorization,"Bearer fixture");if(url.endsWith('/balance')){assert.deepEqual(Object.fromEntries(options.body),{playerId:'7'});return new Response(JSON.stringify({balance:0,currency:'GEL',playerId:'7'}));}assert.equal(url,'https://example.invalid/init');assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'7'});return new Response(JSON.stringify({sessionId:'real',balance:999,currency:'USD',playerId:7}));};
    const result=await service.initSession(params);assert.equal(calls,2);assert.equal(result.sessionId,'real');assert.equal(result.player.balance,0);
    for(const initSource of ['query','dev-test','missing']) await assert.rejects(service.initSession({...params,initSource}),{code:'ACCESS_DENIED'});assert.equal(calls,2);
    globalThis.fetch=async()=>new Response(JSON.stringify({sessionId:'real',currency:'GEL'}));
    await assert.rejects(service.initSession(params),{code:'BACKEND_RESPONSE_ERROR'});
  } finally {globalThis.fetch=original;}
});
