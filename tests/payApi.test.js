import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPayForm,mapPayResponse,sendPayRequest} from '../src/api/payApiClient.js';
import {mergeRuntimeConfig} from '../src/api/runtimeConfig.js';
const params={idCard:'67036619',idPartnerCard:'partner-0001',requestId:'pay-1'};
const context={token:'test & token',gameId:'khiradmandi-makor',playerId:7};
test('pay sends the four-field body contract without partner card ID',()=>{
 assert.deepEqual(Object.fromEntries(buildPayForm(params,context)),{gameId:'36',playerId:'7',requestId:'pay-1',cardId:'67036619'});
 assert.equal(buildPayForm({...params,idPartnerCard:null},context).has('idPartnerCard'),false);
});
test('pay validates card correlation and authoritative ballance including zero',()=>{
 for(const ballance of [0,'0',1820,'1820'])assert.equal(mapPayResponse({idCard:params.idCard,PayDate:'9/15/2026 5:44:20 PM',ballance},params).balance,Number(ballance));
 for(const ballance of [undefined,null,'',true,-1,'NaN'])assert.throws(()=>mapPayResponse({idCard:params.idCard,PayDate:'date',ballance},params),{code:'BACKEND_RESPONSE_ERROR'});
 assert.throws(()=>mapPayResponse({idCard:'other',PayDate:'date',ballance:1820},params),{code:'BACKEND_RESPONSE_ERROR'});
});
test('pay transport posts once and reports uncertain or rejected responses',async()=>{
 const original=globalThis.fetch;let calls=0;mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
 try{
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://example.invalid/pay');assert.equal(options.headers.Authorization,'Bearer '+context.token);assert.equal(options.body.has('token'),false);assert.equal(options.method,'POST');assert.match(options.headers['Content-Type'],/x-www-form-urlencoded/);return new Response(JSON.stringify({idCard:params.idCard,PayDate:'date',ballance:1820}));};
 const body=buildPayForm(params,context);assert.equal((await sendPayRequest(body,{token:context.token})).ballance,1820);assert.equal(calls,1);
 globalThis.fetch=async()=>new Response('{broken');await assert.rejects(sendPayRequest(body,{token:context.token}),{code:'BACKEND_RESPONSE_ERROR'});
 globalThis.fetch=async()=>new Response(JSON.stringify({error_code:401,error:'Invalid token'}),{status:401});await assert.rejects(sendPayRequest(body,{token:context.token}),{code:'ACCESS_DENIED'});
 globalThis.fetch=async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('abort'),{name:'AbortError'}))));await assert.rejects(sendPayRequest(body,{token:context.token,timeoutMs:5}),{code:'TIMEOUT'});
 }finally{globalThis.fetch=original;}
});
