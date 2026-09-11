import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSpinForm, sendSpinRequest } from '../src/api/spinApiClient.js';
import { mapJsonSpinPayload } from '../src/api/slotPayloadMappers.js';
import { mergeRuntimeConfig } from '../src/api/runtimeConfig.js';
import { resolveApiGameId } from '../src/api/gameApiIds.js';

const context = { token: 'test & token', gameId: 'khiradmandi-makor', playerId: 7 };
const params = { requestId: 'qwerthy-123456-asdf-7890', stake: 56.35, totalStake: 281.75, lines: 5, isDemo: true, isFreeSpin: false };
const fixture = () => ({
  ...Object.fromEntries([[0,2,11,12,9],[9,2,7,1,3],[4,0,2,8,8]].map((row,i) => ['Line'+(i+1), Object.fromEntries(row.map((v,j) => ['Slot'+(j+1),String(v)]))])),
  ...Object.fromEntries(Array.from({length:10},(_,i) => ['LineWinKoff'+(i+1),{Koff:'0'}])),
  WinSum:'563.5', FreeSpin:'0', Gold:'1', idCard:'66982076', Number:'37417586'
});

test('exact form fields, bet amount, token escaping and free-spin flags', () => {
  const form=buildSpinForm(params,context);
  assert.deepEqual(Object.fromEntries(form), {token:context.token,gameId:'3',playerId:'7',requestId:params.requestId,sum:'56.35',lines:'5',demoSpin:'1',freeSpin:'0'});
  assert.equal(new URLSearchParams(form.toString()).get('token'),context.token);
  const free=buildSpinForm({...params,isFreeSpin:true},context);
  assert.equal(free.get('freeSpin'),'1'); assert.equal(free.get('demoSpin'),'0');
  assert.equal(buildSpinForm({...params,isDemo:false},context).get('demoSpin'),'0');
  assert.throws(()=>buildSpinForm(params,{...context,token:null}),{code:'CONFIGURATION_ERROR'});
  assert.throws(()=>buildSpinForm({...params,stake:NaN},context),{code:'CONFIGURATION_ERROR'});
  assert.equal(resolveApiGameId({gameId:'fruits'}),'8');
});
test('provided response preserves backend win even with zero coefficients',()=>{
  const result=mapJsonSpinPayload(fixture(),params);
  assert.deepEqual(result.grid.A,[0,2,11,12,9]);
  assert.deepEqual(result.grid.B,[9,2,7,1,3]);
  assert.deepEqual(result.grid.C,[4,0,2,8,8]);
  assert.equal(result.WinSum,563.5); assert.equal(result.Gold,1);
  assert.equal(result.idCard,'66982076'); assert.equal(result.Number,'37417586');
  assert.equal(result.requestId,params.requestId); assert.deepEqual(result.lineWins,[]);
});
test('malformed money, symbols and missing result data are rejected',()=>{
  for(const mutate of [p=>delete p.Line2.Slot3,p=>p.Line1.Slot1=null,p=>p.Line1.Slot1='1.5',p=>p.WinSum='oops',p=>delete p.idCard,p=>delete p.LineWinKoff10]) {
    const payload=fixture();mutate(payload);
    assert.throws(()=>mapJsonSpinPayload(payload,params),{code:'BACKEND_RESPONSE_ERROR'});
  }
});
test('transport posts once, handles JSON, HTTP errors and aborts without retries',async()=>{
  mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid/api/'});
  const original=globalThis.fetch;let calls=0;
  try {
    globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://example.invalid/api/spin');assert.equal(options.method,'POST');assert.match(options.headers['Content-Type'],/application\/x-www-form-urlencoded/);return new Response(JSON.stringify(fixture()));};
    assert.equal((await sendSpinRequest(buildSpinForm(params,context))).idCard,'66982076');assert.equal(calls,1);
    globalThis.fetch=async()=>new Response('{}',{status:401});
    await assert.rejects(sendSpinRequest(buildSpinForm(params,context)),{code:'ACCESS_DENIED'});
    globalThis.fetch=async()=>new Response('not json');
    await assert.rejects(sendSpinRequest(buildSpinForm(params,context)),{code:'BACKEND_RESPONSE_ERROR'});
    calls=0;globalThis.fetch=async(_,options)=>{calls++;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));};
    await assert.rejects(sendSpinRequest(buildSpinForm(params,context),{requestId:params.requestId,timeoutMs:10}),{code:'TIMEOUT',requestId:params.requestId}); assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});

test('updatedBallance maps to the displayed balance, including zero',()=>{
  assert.equal(mapJsonSpinPayload({...fixture(),updatedBallance:'0'},params).balance,0);
  assert.equal(mapJsonSpinPayload({...fixture(),updatedBallance:'123.45'},params).balance,123.45);
  assert.equal(mapJsonSpinPayload({...fixture(),updatedBallance:1723},params).balance,1723);
  assert.equal(mapJsonSpinPayload(fixture(),params).balance,undefined);
  assert.throws(()=>mapJsonSpinPayload({...fixture(),updatedBallance:'bad'},params),{code:'BACKEND_RESPONSE_ERROR'});
});
test('documented error_code/error responses are definitive client errors',async()=>{
  const original=globalThis.fetch;
  try {
    for(const [status,code,message] of [[400,'BAD_REQUEST','Some fields are empty: idRequest, idUser, Sum'],[401,'ACCESS_DENIED','Invalid token'],[404,'GAME_NOT_FOUND','Game not found']]) {
      for(const httpStatus of [status,200]) {
        globalThis.fetch=async()=>new Response(JSON.stringify({error_code:status,error:message}),{status:httpStatus});
        await assert.rejects(sendSpinRequest(buildSpinForm(params,context)),{code});
      }
    }
  } finally {globalThis.fetch=original;}
});
