import { chromium } from "file:///C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Users/user/AppData/Local/Google/Chrome/Application/chrome.exe",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
const failed = [];
const frameRequests = [];
const spinSnapshots = [];
let spinCount = 0;
let maxHighlighted = 0;
let payCount = 0;

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("requestfailed", (request) => failed.push({ url: request.url(), error: request.failure()?.errorText }));
page.on("request", (request) => {
  if (request.url().includes("/assets/img/animations/game8/1/frame_")) {
    frameRequests.push(request.url());
  }
});

const winningPayload = () => ({
  Line1: Object.fromEntries([2, 3, 4, 5, 6].map((value, index) => ["Slot" + (index + 1), String(value)])),
  Line2: Object.fromEntries([1, 1, 1, 4, 5].map((value, index) => ["Slot" + (index + 1), String(value)])),
  Line3: Object.fromEntries([6, 7, 2, 3, 4].map((value, index) => ["Slot" + (index + 1), String(value)])),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => [
    "LineWinKoff" + (index + 1),
    { Koff: index === 0 ? "10" : "0" },
  ])),
  WinSum: "5",
  FreeSpin: "0",
  Gold: "0",
  idCard: "local-win-" + spinCount,
  Number: String(90000000 + spinCount),
});

await page.route("https://api.raxshloto.online/spin", async (route) => {
  spinCount += 1;
  const body = Object.fromEntries(new URLSearchParams(route.request().postData() ?? ""));
  spinSnapshots.push({
    spin: spinCount,
    frameRequestsBeforeSpin: frameRequests.length,
    uniqueFramesBeforeSpin: new Set(frameRequests).size,
    demoSpin: body.demoSpin,
    gameId: body.gameId,
  });
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(winningPayload()),
  });
});

await page.route("https://api.raxshloto.online/pay", async (route) => {
  payCount += 1;
  const body = Object.fromEntries(new URLSearchParams(route.request().postData() ?? ""));
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      idCard: body.cardId,
      PayDate: new Date().toISOString(),
      ballance: "1000",
    }),
  });
});

await page.goto("http://127.0.0.1:5174/#/games/fruits", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});
const auto = page.getByRole("button", { name: /АВТО ЭКСПРЕСС/i });
await auto.waitFor({ state: "visible", timeout: 120000 });
await page.getByRole("button", { name: "Визуализация" }).click();
await page.waitForTimeout(250);
const framesBeforeAuto = frameRequests.length;
await auto.click();

const deadline = Date.now() + 60000;
while (Date.now() < deadline && spinCount < 3) {
  maxHighlighted = Math.max(
    maxHighlighted,
    await page.locator(".lottery-grid-view2-cell--highlighted").count(),
  );
  await page.waitForTimeout(50);
}
if (spinCount >= 3) await auto.click();
await page.waitForTimeout(1000);
maxHighlighted = Math.max(
  maxHighlighted,
  await page.locator(".lottery-grid-view2-cell--highlighted").count(),
);

const view2TransitionDurations = await page.locator(".lottery-grid-view2-cell__container").evaluateAll((nodes) => [...new Set(nodes.map((node) => getComputedStyle(node).transitionDuration))]);

const result = {
  url: page.url(),
  view2TransitionDurations,
  spinCount,
  framesBeforeAuto,
  totalFrameRequests: frameRequests.length,
  uniqueFrameRequests: new Set(frameRequests).size,
  duplicateFrameRequests: frameRequests.length - new Set(frameRequests).size,
  maxHighlighted,
  spinSnapshots,
  errors,
  failed,
  bodyTail: (await page.locator("body").innerText()).slice(-1500),
};
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (
  spinCount < 3 ||
  // One hidden first frame is intentionally mounted before the first win so
  // animation entry never creates an image node on the highlight boundary.
  framesBeforeAuto > 1 ||
  new Set(frameRequests).size !== 144 ||
  frameRequests.length !== 144 ||
  maxHighlighted < 3 ||
  view2TransitionDurations.some((duration) => duration !== "0s") ||
  spinSnapshots.some((item) => item.demoSpin !== "0" || item.gameId !== "42") ||
  errors.length ||
  failed.length
) {
  process.exitCode = 1;
}
