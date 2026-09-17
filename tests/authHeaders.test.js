import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAuthHeaders} from '../src/api/authHeaders.js';
import {sendSpinRequest} from '../src/api/spinApiClient.js';
import {sendPayRequest} from '../src/api/payApiClient.js';
test('Bearer header keeps the token exact and rejects missing or injected credentials',()=>{assert.equal(buildAuthHeaders('fixture.a_b-c').Authorization,'Bearer fixture.a_b-c');for(const value of [undefined,null,'','  ',123,'abc\r\nX-Evil: yes'])assert.throws(()=>buildAuthHeaders(value),{code:'CONFIGURATION_ERROR'});});
test('missing authentication fails before sending monetary requests',async()=>{const original=globalThis.fetch;let calls=0;globalThis.fetch=()=>{calls++;throw Error('unexpected network');};try{for(const request of [sendSpinRequest,sendPayRequest])await assert.rejects(request(new URLSearchParams()),{code:'CONFIGURATION_ERROR'});assert.equal(calls,0);}finally{globalThis.fetch=original;}});
