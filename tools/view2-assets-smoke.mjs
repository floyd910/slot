import { chromium } from "file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const games = [
  "ganchina-sokrovishch",
  "marvorid-djemchug",
  "khiradmandi-makor",
  "egypt",
  "kadima-drevnii",
  "khocha-afandi",
  "babylon",
  "fruits",
];
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Users/user/AppData/Local/Google/Chrome/Application/chrome.exe",
});
const results = [];
try {
  for (const game of games) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    const failed = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("requestfailed", (request) => failed.push({ url: request.url(), error: request.failure()?.errorText }));
    await page.goto(`http://127.0.0.1:5174/#/games/${game}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    const toggle = page.getByRole("button", { name: "Визуализация" });
    await toggle.waitFor({ state: "visible", timeout: 120000 });
    if ((await page.locator(".frame-app.view-2").count()) === 0) await toggle.click();
    await page.locator(".frame-app.view-2 .lottery-grid-view2").waitFor({ state: "visible", timeout: 120000 });
    await page.waitForFunction(() => [...document.querySelectorAll(".frame-app.view-2 .lottery-grid-view2-cell img")].every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 120000 });
    const images = await page.locator(".frame-app.view-2 .lottery-grid-view2-cell img").evaluateAll((nodes) => nodes.map((image) => ({ src: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight })));
    const fallbackCount = await page.locator(".frame-app.view-2 .lottery-grid-view2-cell__fallback").count();
    results.push({ game, fallbackCount, imageCount: images.length, maxWidth: Math.max(0, ...images.map((image) => image.width)), maxHeight: Math.max(0, ...images.map((image) => image.height)), errors, failed });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
if (results.length !== games.length || results.some((result) => result.fallbackCount !== 0 || result.imageCount === 0 || result.maxWidth > 512 || result.maxHeight > 512 || result.errors.length || result.failed.length)) process.exitCode = 1;