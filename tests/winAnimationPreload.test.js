import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("winning WebP sequences preload once per symbol and are reused by later Spins", async () => {
  const oldImage = globalThis.Image;
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  let created = 0;
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.Image = class {
    constructor() {
      created += 1;
      this.naturalWidth = 100;
    }
    set src(value) {
      this.currentSrc = value;
      queueMicrotask(() => this.onload?.());
    }
    decode() {
      return Promise.resolve();
    }
  };

  const server = await createServer({
    configFile: false,
    cacheDir: "tmp/vite-win-animation-tests",
    server: { middlewareMode: true, watch: null },
    appType: "custom",
  });
  try {
    const {
      getResultWinAnimationSources,
      preloadResultWinAnimations,
    } = await server.ssrLoadModule("/src/utils/mediaPreload.js");
    const game = {
      id: "fruits-test",
      assets: {
        view2Symbols: {
          1: { winFrames: ["/frame-1.webp", "/frame-2.webp", "/frame-3.webp"] },
          2: { winFrames: ["/frame-a.webp", "/frame-b.webp"] },
        },
      },
    };
    const firstWin = {
      grid: { A: [1, 1, 2, 0, 0], B: [], C: [] },
      winningCells: ["A1", "A2"],
      scatterCells: [],
    };
    assert.deepEqual(getResultWinAnimationSources(game, firstWin), [
      "/frame-1.webp",
      "/frame-2.webp",
      "/frame-3.webp",
    ]);
    await Promise.all([
      preloadResultWinAnimations(game, firstWin),
      preloadResultWinAnimations(game, firstWin),
    ]);
    assert.equal(created, 3, "simultaneous preload calls must share one request per frame");
    await preloadResultWinAnimations(game, firstWin);
    assert.equal(created, 3, "a later Spin with the same symbol must reuse the loaded sequence");

    await preloadResultWinAnimations(game, {
      ...firstWin,
      winningCells: ["A3"],
    });
    assert.equal(created, 5, "only the newly winning symbol sequence should be loaded");
  } finally {
    await server.close();
    globalThis.Image = oldImage;
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
test("a win-animation preload failure never rejects the confirmed Spin flow", async () => {
  const oldImage = globalThis.Image;
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  globalThis.window = { setTimeout, clearTimeout };
  globalThis.document = { baseURI: "https://example.test/" };
  globalThis.Image = class {
    constructor() {
      throw new Error("image subsystem unavailable");
    }
  };

  const server = await createServer({
    configFile: false,
    cacheDir: "tmp/vite-win-animation-failure-tests",
    server: { middlewareMode: true, watch: null },
    appType: "custom",
  });
  try {
    const { preloadResultWinAnimations } = await server.ssrLoadModule(
      "/src/utils/mediaPreload.js",
    );
    const game = {
      id: "broken-animation-test",
      assets: {
        view2Symbols: {
          1: { winFrames: ["/broken-frame.webp"] },
        },
      },
    };
    const result = {
      grid: { A: [1], B: [], C: [] },
      winningCells: ["A1"],
      scatterCells: [],
    };

    await assert.doesNotReject(preloadResultWinAnimations(game, result));
  } finally {
    await server.close();
    globalThis.Image = oldImage;
    globalThis.window = oldWindow;
    globalThis.document = oldDocument;
  }
});
