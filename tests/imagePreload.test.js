import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
test('required images reject decode/load failures and can retry the same URL', async () => {
  const oldImage=globalThis.Image,oldWindow=globalThis.window;
  let outcome='decode-error',created=0;
  globalThis.window={setTimeout,clearTimeout};
  globalThis.Image=class {
    constructor(){created++;this.naturalWidth=100;}
    set src(value){queueMicrotask(()=>outcome==='load-error'?this.onerror?.():this.onload?.());}
    decode(){return outcome==='decode-error'?Promise.reject(new Error('decode failed')):Promise.resolve();}
  };
  const server=await createServer({configFile:false,cacheDir:'tmp/vite-image-tests',server:{middlewareMode:true,watch:null},appType:'custom'});
  try {
    const {preloadRequiredImages}=await server.ssrLoadModule('/src/utils/mediaPreload.js');
    await assert.rejects(preloadRequiredImages(['/decode-retry.png']),/decode failed/);
    outcome='ok';await preloadRequiredImages(['/decode-retry.png']);assert.equal(created,2);
    outcome='load-error';await assert.rejects(preloadRequiredImages(['/load-retry.png']),/Failed to preload/);
    outcome='ok';await preloadRequiredImages(['/load-retry.png']);assert.equal(created,4);
  } finally {await server.close();globalThis.Image=oldImage;globalThis.window=oldWindow;}
});
