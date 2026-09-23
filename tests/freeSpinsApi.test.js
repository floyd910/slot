import test from 'node:test';
import assert from 'node:assert/strict';
import { requestFreeSpins } from '../src/api/freeSpinsApiClient.js';
import { mergeRuntimeConfig } from '../src/api/runtimeConfig.js';

test('free-spin counter uses exact contract and rejects invalid counts', async () => {
 mergeRuntimeConfig({sessionApiBaseUrl:'https://example.invalid'});
 const original=globalThis.fetch;
 try {
  for(const count of ['0','7',21]) {
   globalThis.fetch=async(url,options)=>{
    assert.equal(url,'https://example.invalid/freespins');
    assert.equal(options.method,'POST');
    assert.equal(options.headers.Authorization,'Bearer fixture');
    assert.deepEqual(Object.fromEntries(options.body),{gameId:'36',playerId:'1234567890123456789012345678901234567890'});
    return new Response(JSON.stringify({CountFreeSpin:count}));
   };
   assert.equal(await requestFreeSpins({token:'fixture',gameId:'khiradmandi-makor',playerId:'1234567890123456789012345678901234567890'}),Number(count));
  }
  for(const count of [null,undefined,'',-1,'1.5',true,'bad','9007199254740992']) {
   globalThis.fetch=async()=>new Response(JSON.stringify({CountFreeSpin:count}));
   await assert.rejects(requestFreeSpins({token:'fixture',gameId:'36',playerId:7}),{code:'BACKEND_RESPONSE_ERROR'});
  }
  globalThis.fetch=async()=>new Response('{}',{status:401});
  await assert.rejects(requestFreeSpins({token:'fixture',gameId:'36',playerId:7}),{status:401});
  globalThis.fetch=async()=>{throw new TypeError('network lost');};
  await assert.rejects(requestFreeSpins({token:'fixture',gameId:'36',playerId:7}));
 } finally {globalThis.fetch=original;}
});
