import { chromium } from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const out={startedAt:new Date().toISOString(),spins:0,trigger:null,beforeRetry:null,afterRetry:null,api:[],errors:[]};
const context=await chromium.launchPersistentContext('tmp/prod-trigger-recovery-profile',{headless:true,executablePath:'C:/Users/user/AppData/Local/Google/Chrome/Application/chrome.exe',viewport:{width:1440,height:900}});
const page=context.pages()[0]??await context.newPage();
page.on('console',m=>{if(m.type()==='error')out.errors.push(m.text())});
page.on('pageerror',e=>out.errors.push(e.message));
page.on('response',async r=>{if(!/api\.raxshloto\.online\/(init|balance|pay|double|CountFreeSpin)/i.test(r.url()))return;let body='';try{body=await r.text()}catch{}out.api.push({at:new Date().toISOString(),url:r.url(),status:r.status(),body:body.slice(0,5000)});});
let resolveTrigger;
const triggerPromise=new Promise(resolve=>{resolveTrigger=resolve});
await page.route('**/spin',async route=>{
  const response=await route.fetch();
  const body=await response.text();
  out.spins+=1;
  let payload=null;try{payload=JSON.parse(body)}catch{}
  if(Number(payload?.FreeSpin)===1&&!out.trigger){
    out.trigger={at:new Date().toISOString(),status:response.status(),payload};
    await route.abort('failed');
    resolveTrigger(true);
    return;
  }
  await route.fulfill({response,body});
});
await page.goto('https://raxshloto.online/#/games/khiradmandi-makor',{waitUntil:'domcontentloaded',timeout:60000});
const auto=page.getByRole('button',{name:/АВТО ЭКСПРЕСС/i});
await auto.waitFor({state:'visible',timeout:180000});
await auto.click();
const triggered=await Promise.race([triggerPromise,new Promise(resolve=>setTimeout(()=>resolve(false),720000))]);
if(triggered){
  await page.waitForTimeout(2500);
  out.beforeRetry={body:(await page.locator('body').innerText()).slice(-5000),buttons:await page.getByRole('button').allTextContents(),storage:await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))};
  await page.unroute('**/spin');
  const retry=page.getByRole('button',{name:/Повторить|Retry/i});
  await retry.waitFor({state:'visible',timeout:30000});
  await retry.click();
  await page.waitForTimeout(20000);
  out.afterRetry={url:page.url(),body:(await page.locator('body').innerText()).slice(-8000),buttons:await page.getByRole('button').allTextContents(),storage:await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))};
}
out.finishedAt=new Date().toISOString();
out.triggered=triggered;
writeFileSync('tmp/production-trigger-recovery.json',JSON.stringify(out,null,2));
await page.screenshot({path:'tmp/production-trigger-recovery.png',fullPage:true});
await context.close();