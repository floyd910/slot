import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createServer } from "vite";

test("every game defers View 2 and optional Spin assets behind the usage gate", async () => {
  const oldDocument = globalThis.document;
  globalThis.document = { baseURI: "https://example.test/" };
  const server = await createServer({
    configFile: false,
    cacheDir: "tmp/vite-all-game-preload-policy-tests",
    esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });
  try {
    const {
      getGameView2GridAssets,
      getRequiredGameMainScreenAssets,
      shouldBlockSpinOnOptionalAssets,
    } = await server.ssrLoadModule("/src/utils/mediaPreload.js");
    const { GAME_DEFINITIONS } = await server.ssrLoadModule(
      "/src/config/gameDefinitions.js",
    );

    for (const game of GAME_DEFINITIONS) {
      const critical = new Set(getRequiredGameMainScreenAssets(game));
      const view2 = getGameView2GridAssets(game);
      assert.ok(view2.length > 0);
      const deferredView2 = view2.filter((url) => !critical.has(url));
      assert.ok(
        deferredView2.length >= view2.length - 2,
        `${game.id} View 1 startup may share shell assets but must defer its View 2 grid`,
      );
      assert.equal(shouldBlockSpinOnOptionalAssets(game), false);
    }
  } finally {
    await server.close();
    globalThis.document = oldDocument;
  }
});

test("all games use one View 2 gate and no per-symbol loading UI", () => {
  const controller = fs.readFileSync(
    new URL("../src/hooks/useGameController.js", import.meta.url),
    "utf8",
  );
  const symbol = fs.readFileSync(
    new URL("../src/components/view2SymbolBase/View2SymbolBase.jsx", import.meta.url),
    "utf8",
  );
  assert.match(controller, /preloadGameView2GridAssets\(gameDefinition\)/);
  assert.match(controller, /if \(!visualMode \|\| view2AssetsReady\)/);
  assert.match(controller, /if \(nextValue && !view2AssetsReady\)/);
  assert.doesNotMatch(controller, /isEgyptLoadingPilot/);
  assert.match(controller, /view2AssetsLoading/);
  assert.doesNotMatch(symbol, /fallback--loading|loading symbol|view2-symbol-loading/);
});