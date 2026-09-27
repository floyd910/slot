import test from 'node:test';
import assert from 'node:assert/strict';
import {getOperationErrorStatus,getRuntimeStateStatus,shouldShowRuntimeState} from '../src/utils/runtimeStatus.js';

test('operation errors use full-screen retry only when no result grid is visible',()=>{
  const original=globalThis.navigator;
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:false}});
  try {
    assert.equal(getOperationErrorStatus({code:'NETWORK_ERROR'},false),'network-error');
    assert.equal(getOperationErrorStatus({code:'NETWORK_ERROR'},true),'ready');
  } finally {
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:original});
  }
});

test('uncertain operations use one stable full-screen Retry state even over a restored grid',()=>{
  assert.equal(shouldShowRuntimeState('ready',true),true);
  assert.equal(getRuntimeStateStatus('ready',true),'network-error');
  assert.equal(shouldShowRuntimeState('ready',false),false);
  assert.equal(getRuntimeStateStatus('ready',false),'ready');
});
