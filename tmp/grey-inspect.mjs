import fs from 'node:fs';
const tabs=await(await fetch('http://localhost:9338/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.url.startsWith('http://localhost:5175')).webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map(),contexts=new Map();
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m.result);pending.delete(m.id)}if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context)};
const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});
const ev=async(expression,contextId)=> (await send('Runtime.evaluate',{expression,contextId,returnByValue:true,awaitPromise:true})).result?.value;
await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:728,height:522,deviceScaleFactor:1,mobile:false});
console.log(await ev('document.body.innerText.slice(0,400)'));
await ev(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Slots')?.click()`);
await new Promise(r=>setTimeout(r,12000));
for(const c of contexts.values()){if(!c.auxData?.isDefault)continue;console.log('context',c.id,c.origin,await ev('document.body.innerText.slice(0,500)',c.id));}
fs.writeFileSync('tmp/grey-contexts.json',JSON.stringify([...contexts.values()]));
ws.close();

