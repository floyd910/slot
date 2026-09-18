import test from 'node:test';
import assert from 'node:assert/strict';
import {getStartupPresentation} from '../src/viewModels/startupPresentation.js';
const waiting={status:'guest',loaderExitComplete:false,checkingSession:false,hasPlayer:false,startupLoaderVisible:true,startupLoaderLeaving:true,layoutReady:false,backgroundPaintReady:false,isLanguageChanging:false};
test('guest renders the game even when startup measurements are pending',()=>{assert.deepEqual(getStartupPresentation(waiting),{guest:true,showStartupLoader:false});});
test('authenticated startup still waits for assets and geometry',()=>{assert.equal(getStartupPresentation({...waiting,status:'bootstrap-loading',checkingSession:true}).showStartupLoader,true);assert.equal(getStartupPresentation({...waiting,status:'ready',loaderExitComplete:true}).showStartupLoader,false);});
