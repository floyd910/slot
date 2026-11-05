import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("restored free spins bypass the paid-spin balance gate", async () => {
  const { isSpinBlockedByFunds } = await import("../src/viewModels/primaryGameAction.js");

  assert.equal(isSpinBlockedByFunds({
    canAffordSpin: false,
    freeSpinsLeft: 10,
    pendingTicketWin: false,
    showFreeSpinPrompt: true,
  }), false);
  assert.equal(isSpinBlockedByFunds({
    canAffordSpin: false,
    freeSpinsLeft: 0,
    pendingTicketWin: false,
    showFreeSpinPrompt: false,
  }), true);
});

test("free-spin SOAP requests use zero Sum while paid spins keep their stake", async () => {
  globalThis.window = {
    location: { origin: "http://localhost" },
    HIRANMANDI_FRAME_CONFIG: {},
  };
  const server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    cacheDir: "tmp/vite-tests",
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });
  try {
    const { mergeRuntimeConfig } = await server.ssrLoadModule("/src/api/runtimeConfig.js");
    const { buildSpinRequest } = await server.ssrLoadModule("/src/api/soapRequestBuilder.js");
    mergeRuntimeConfig({
      backendMode: "soap",
      idPartner: "1",
      idKassi: "70",
      idValute: "1",
      idUser: "7",
      login: "player",
      password: "secret",
      backendGameId: "3",
    });

    const free = buildSpinRequest({ stake: 1, lines: 5, isFreeSpin: true });
    const paid = buildSpinRequest({ stake: 1, lines: 5, isFreeSpin: false });

    assert.match(free.xml, /Sum="0"/);
    assert.match(free.xml, /FreeSpin="1"/);
    assert.match(paid.xml, /Sum="1"/);
    assert.match(paid.xml, /FreeSpin="0"/);
  } finally {
    await server.close();
    delete globalThis.window;
  }
});
