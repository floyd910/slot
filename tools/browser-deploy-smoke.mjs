import { chromium } from 'file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser=await chromium.launch({headless:true,executablePath:'C:/Users/user/AppData/Local/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const consoleErrors=[];
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
page.on('pageerror',error=>consoleErrors.push(error.message));
await page.goto('http://127.0.0.1:5174/#/games/khiradmandi-makor',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(10000);
const result={url:page.url(),title:await page.title(),body:(await page.locator('body').innerText()).slice(0,4000),buttons:await page.getByRole('button').allTextContents(),consoleErrors,storage:await page.evaluate(()=>({local:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),session:Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)]))}))};
await page.screenshot({path:'tmp/browser-deploy-smoke.png',fullPage:true});
console.log(JSON.stringify(result,null,2));
await browser.close();
