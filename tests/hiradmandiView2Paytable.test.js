import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { buildStandardPaytableViewModel } from "../src/viewModels/paytableViewModel.js";
import {
  formatPayoutValue,
  getCombinationGroups,
} from "../src/utils/payoutTable.js";

test("all standard View 2 games apply the symbol 0 line multiplier once", async () => {
  const server = await createServer({
    configFile: false,
    esbuild: { jsx: "automatic" },
    optimizeDeps: { noDiscovery: true, include: [] },
    cacheDir: "tmp/vite-hiradmandi-payout-tests",
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: "custom",
  });

  try {
    const { LanguageProvider } = await server.ssrLoadModule("/src/i18n.jsx");
    const { default: View2Paytable } = await server.ssrLoadModule(
      "/src/components/view2Paytable/View2Paytable.jsx",
    );

    const gameIds = [
      "ganchina-sokrovishch",
      "marvorid-djemchug",
      "khiradmandi-makor",
      "egypt",
      "kadima-drevnii",
      "khocha-afandi",
    ];
    for (const gameId of gameIds) {
      for (const stake of [0.1, 1, 2]) {
        for (const lines of [1, 3, 5, 7, 9]) {
        const combination = {
          id: lines,
          groups: getCombinationGroups(null, lines),
        };
        const view = buildStandardPaytableViewModel({
          stake,
          selectedCombination: combination,
          selectedCombinationId: lines,
          gameId,
        });
        const html = renderToStaticMarkup(
          React.createElement(
            LanguageProvider,
            null,
            React.createElement(View2Paytable, {
              language: "ru",
              gameId,
              selectedCombinationId: lines,
              payoutMultiplier: view.payoutMultiplier,
            }),
          ),
        );
        const cards = html
          .split('<div class="view2-info-coeff-card__payout">')
          .slice(1);
        assert.equal(cards.length, 2, "check desktop and mobile variants");

        const expected = [4500, 180, 45, 18].map((value) =>
          formatPayoutValue(value, stake * (lines / 9)),
        );
        for (const card of cards) {
          const values = [
            ...card.matchAll(
              /class="view2-info-payout-row"><span>[^<]*<\/span><span[^>]*>([^<]*)<\/span>/g,
            ),
          ]
            .slice(0, 4)
            .map((match) => match[1]);
          assert.deepEqual(
            values,
            expected,
            `game=${gameId}, stake=${stake}, lines=${lines}`,
          );
        }
      }
    }
    }
  } finally {
    await server.close();
  }
});
