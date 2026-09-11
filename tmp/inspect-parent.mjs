const tabs=await(await fetch('http://localhost:9337/json/list')).json();console.log(tabs.map(t=>({id:t.id,url:t.url})));
const tab=tabs.find(t=>t.url.startsWith('http://localhost:5175'));
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const p=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){p.get(m.id)(m.result);p.delete(m.id);}if(m.method==='Runtime.executionContextCreated') console.log('context',m.params.context.id,m.params.context.origin,m.params.context.auxData);});
const send=(method,params={})=>new Promise(r=>{p.set(++id,r);ws.send(JSON.stringify({id,method,params}));});
await send('Runtime.enable');await send('Page.enable');console.log(JSON.stringify(await send('Page.getFrameTree')));
console.log(JSON.stringify(await send('Runtime.evaluate',{expression:'document.body.innerText.slice(0,600)',returnByValue:true})));
ws.close();
