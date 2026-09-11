import fs from 'node:fs';
const tabs=await(await fetch('http://localhost:9338/json/list')).json();const ws=new WebSocket(tabs.find(t=>t.url.startsWith('http://localhost:5175')).webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),contexts=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m.result);pending.delete(m.id)}if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context)};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});const ev=async(expression,contextId)=> (await send('Runtime.evaluate',{expression,contextId,returnByValue:true,awaitPromise:true}))?.result?.value;await send('Runtime.enable');await send('Page.enable');

const c=[...contexts.values()].find(c=>c.origin==='http://localhost:5174'&&c.auxData?.isDefault);if(!c)throw Error('No test frame');
await ev("document.querySelector('iframe').style.cssText='position:fixed;inset:0;width:100vw;height:100vh;border:0;max-width:none;z-index:9999'");
for(const width of [375,639,640,651,652])for(const height of [320,900]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
 await new Promise(r=>setTimeout(r,100));
 console.log(await ev("JSON.stringify({width:innerWidth,height:innerHeight,footers:[...document.querySelectorAll('.bottom-bar > .footer-block')].map(e=>({class:e.className,display:getComputedStyle(e).display}))})",c.id));
}ws.close();
