import fs from 'node:fs';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const tabs=await(await fetch('http://localhost:9337/json/list')).json();
const ws=new WebSocket(tabs.find(t=>t.url.startsWith('http://localhost:5175')).webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let next=0;const pending=new Map(),contexts=new Map(),requests=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')console.log('Browser error:',m.params.exceptionDetails.exception?.description?.slice(0,500) ?? m.params.exceptionDetails.text);if(m.method==='Runtime.executionContextCreated')contexts.set(m.params.context.id,m.params.context);if(m.method==='Runtime.executionContextsCleared')contexts.clear();if(m.method==='Network.requestWillBeSent'&&/api\/test-partner-launch|api\.raxshloto\.online\/(init|spin)/.test(m.params.request.url))requests.push({id:m.params.requestId,url:m.params.request.url,body:m.params.request.postData});});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async(expression,contextId)=>{const r=await send('Runtime.evaluate',{expression,contextId,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;};
try {
await send('Page.bringToFront');await send('Runtime.enable');await send('Network.enable');await send('Page.enable');
await send('Page.navigate',{url:'http://localhost:5175'});await wait(2000);
console.log('Parent loaded');
await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Login').click()`);
for(let i=0;i<30;i++){if(await evaluate(`document.body.innerText.includes('Logged in')`))break;await wait(300);}
console.log('Login successful:',await evaluate(`document.body.innerText.includes('Logged in')`));
await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='Slots').click()`);
for(let i=0;i<90;i++){if(requests.some(r=>r.url.endsWith('/init')))break;await wait(1000);}
console.log('Iframe URL:',await evaluate(`document.querySelector('iframe')?.src`));
console.log('Contexts:',[...contexts.values()].filter(c=>c.auxData?.isDefault).map(c=>({id:c.id,origin:c.origin})));console.log('Real init calls:',requests.filter(r=>r.url.endsWith('/init')).length);
const frameContexts=[...contexts.values()].filter(c=>c.auxData?.isDefault&&c.origin==='http://localhost:5174');
for(const c of frameContexts)console.log('Frame UI:',(await evaluate('document.body.innerText',c.id)).slice(0,550));
console.log('Init form keys:',requests.filter(r=>r.url.endsWith('/init')).map(r=>[...new URLSearchParams(r.body).keys()]));
fs.writeFileSync('tmp/postmessage-browser-result.json',JSON.stringify({initCalls:requests.filter(r=>r.url.endsWith('/init')).length,iframeUrl:await evaluate(`document.querySelector('iframe')?.src`)}));
} finally {ws.close();}
