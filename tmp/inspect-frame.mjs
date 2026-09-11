const tabs=await(await fetch('http://localhost:9337/json/list')).json();
const tab=tabs.find(t=>t.url.startsWith('http://localhost:5175'));
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const p=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){p.get(m.id)(m.result);p.delete(m.id);}if(m.method==='Runtime.executionContextCreated') void 0;});
const send=(method,params={})=>new Promise(r=>{p.set(++id,r);ws.send(JSON.stringify({id,method,params}));});
await send('Runtime.enable');await send('Page.enable');
console.log(JSON.stringify(await send('Runtime.evaluate',{expression:'document.body.innerText.slice(0,1000)',contextId:6,returnByValue:true})));
console.log(JSON.stringify(await send('Runtime.evaluate',{expression:`performance.getEntriesByType('resource').filter(e=>e.name.includes('/init')).map(e=>({url:e.name,duration:e.duration}))`,contextId:6,returnByValue:true})));ws.close();
