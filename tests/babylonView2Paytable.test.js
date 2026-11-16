import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildStandardPaytableViewModel } from "../src/viewModels/paytableViewModel.js";
import { formatPayoutValue, getCombinationGroups } from "../src/utils/payoutTable.js";

test("Babylon View 2 desktop and mobile info use the terminal's single line multiplier", async () => {
  const server = await createServer({
    configFile: false, esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] }, cacheDir: "tmp/vite-babylon-payout-tests",
    server: { middlewareMode: true, watch: null, hmr: false }, appType: "custom",
  });
  try {
    const { LanguageProvider } = await server.ssrLoadModule("/src/i18n.jsx");
    const { default: View2Paytable } = await server.ssrLoadModule("/src/components/view2Paytable/View2Paytable.jsx");
    for (const stake of [0.1, 1, 2, 25]) for (const lines of [1, 3, 5, 7, 9]) {
      const combination = { id: lines, groups: getCombinationGroups(null, lines) };
      const view = buildStandardPaytableViewModel({ stake, selectedCombination: combination, selectedCombinationId: lines, gameId: "babylon" });
      const html = renderToStaticMarkup(React.createElement(LanguageProvider, null,
        React.createElement(View2Paytable, { language: "ru", gameId: "babylon", selectedCombinationId: lines,
          payoutMultiplier: view.payoutMultiplier, zeroPayoutMultiplier: view.zeroPayoutMultiplier })));
      const cards = html.split('<div class="view2-info-coeff-card__payout">').slice(1);
      assert.equal(cards.length, 2, "check desktop and mobile variants");
      // Terminal Babylon schedule: 5x = 50, 4x = 15, 3x = 2 per stake and line.
      const expected = [50, 15, 2].map(value => formatPayoutValue(value, stake * lines));
      for (const card of cards) {
        const values = [...card.matchAll(/class="view2-info-payout-row"><span>[^<]*<\/span><span[^>]*>([^<]*)<\/span>/g)]
          .slice(0, 3).map(match => match[1]);
        assert.deepEqual(values, expected, `stake=${stake}, lines=${lines}`);
      }
    }
  } finally { await server.close(); }
});
