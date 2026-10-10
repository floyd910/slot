import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("View 2 paints a predecoded win animation immediately above the static symbol", async () => {
  const server = await createServer({
    configFile: false,
    cacheDir: "tmp/vite-view2-handoff-tests",
    esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });
  try {
    const { View2SymbolBase } = await server.ssrLoadModule(
      "/src/components/view2SymbolBase/View2SymbolBase.jsx",
    );
    const html = renderToStaticMarkup(
      React.createElement(View2SymbolBase, {
        symbol: 4,
        staticImage: "/static-symbol.webp",
        animatedImage: "/winning-symbol.webp",
        animated: true,
        animationKey: "result-1",
      }),
    );
    const staticIndex = html.indexOf("/static-symbol.webp");
    const animationIndex = html.indexOf("/winning-symbol.webp");
    assert.ok(staticIndex >= 0, "static symbol must remain rendered during handoff");
    assert.ok(animationIndex > staticIndex, "animation must be layered above the static symbol");
    assert.match(html, /winning-symbol\.webp[^>]*opacity:1/);
  } finally {
    await server.close();
  }
});