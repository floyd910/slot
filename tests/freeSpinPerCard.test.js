import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { webcrypto } from "node:crypto";

test("free-spin cards pay sequentially at zero balance and recover before continuing", async (t) => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  const store = new Map();
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: key => store.delete(key),
  };
  globalThis.window = {
    crypto: webcrypto, localStorage: storage, sessionStorage: storage,
    addEventListener() {}, dispatchEvent() {},
    setTimeout: (fn, ms) => {
      const timer = setTimeout(fn, ms >= 9000 ? ms : 0);
      timer.unref();
      return timer;
    }, clearTimeout,
  };
  const server = await createServer({
    configFile: false, optimizeDeps: { noDiscovery: true, include: [] },
    cacheDir: "tmp/vite-per-card-tests",
    server: { middlewareMode: true, watch: null, hmr: false }, appType: "custom",
  });
  try {
    const { createSpinActions } = await server.ssrLoadModule("/src/controllers/spinActions.js");
    const { frameApi } = await server.ssrLoadModule("/src/api/frameApi.js");
    const { freeSpinSeries } = await server.ssrLoadModule("/src/services/freeSpinSeries.js");
    const { stateRecoveryService: recovery } = await server.ssrLoadModule("/src/services/stateRecoveryService.js");
    const { reconcileConfirmedPayment } = await server.ssrLoadModule("/src/services/paymentRecoveryService.js");
    const { resolveApiGameId } = await server.ssrLoadModule("/src/api/gameApiIds.js");
    const { mergeRuntimeConfig } = await server.ssrLoadModule("/src/api/runtimeConfig.js");
    const { SessionApiService } = await server.ssrLoadModule("/src/services/sessionApiService.js");
    mergeRuntimeConfig({ backendMode: "soap" });

    const fixture = (id, standalone = false, zeroWins = false) => {
      const context = {
        token: "fixture", playerId: id, gameId: "egypt", sessionId: id,
        mode: standalone ? "standalone" : "embedded", initSource: "postMessage",
      };
      freeSpinSeries.recordResult(context, { idCard: id + "-award", FreeSpin: 1 }, false);
      freeSpinSeries.reconcile(context, 13);
      const live = { current: {
        context, status: "ready", player: { balance: 0, currency: "USD" },
        visualMode: false, carpetCloseMs: 0, carpetOpenMs: 0,
        doubleState: {}, doublingState: {}, freeSpinsLeft: 2, freeSpinsTotal: 15,
        selectedCombination: { id: 1, groups: [{}] }, stake: 25,
      } };
      const events = [], errors = [], summaries = [];
      let spins = 0, played = 13;
      const options = {
        liveSpinStateRef: live, autoPlayOnRef: { current: false },
        freeSpinRunRef: { current: false }, t: key => key,
        reportOperationError: error => errors.push(error),
      };
      for (const name of ["emitLotteryRevealSounds", "emitSound", "playSpinFeedback", "setError",
        "setHasRecoveredGrid", "setHasSessionSpin", "setLastKnownState", "onRecoveryRequired", "postEvent", "setAutoPlayOn"])
        options[name] = () => {};
      for (const name of ["DoubleState", "DoublingState", "Player", "FreeSpinsLeft", "FreeSpinsTotal",
        "FreeSpinsWinTotal", "FreeSpinsPaidTotal", "FreeSpinRoundStarted", "ShowFreeSpinPrompt",
        "Grid", "GridAnimation", "GridRevealKey", "SpinHistory", "SpinResult", "Status", "FreeSpinSummary"]) {
        const key = name[0].toLowerCase() + name.slice(1);
        options["set" + name] = value => {
          live.current[key] = typeof value === "function"
            ? value(live.current[key] ?? (name === "SpinHistory" ? [] : 0)) : value;
          if (name === "FreeSpinSummary" && value) summaries.push(value);
        };
      }
      globalThis.fetch = async url => {
        assert.ok(url.endsWith("/freespins"));
        return new Response(JSON.stringify({ CountFreeSpin: played }));
      };
      frameApi.spin = async params => {
        assert.equal(params.isFreeSpin, true);
        assert.equal(live.current.player.balance, 0, 'paid cards must not increase the displayed balance mid-series');
        assert.ok(freeSpinSeries.getPayments(context).every(card => card.paid));
        spins++; played++;
        events.push("spin" + spins);
        return {
          idCard: id + "-" + spins, WinSum: zeroWins ? 0 : 1.25, FreeSpin: 0,
          grid: { A: [1, 1, 1, 1, 1], B: [1, 1, 1, 1, 1], C: [1, 1, 1, 1, 1] },
        };
      };
      const paid = params => ({
        idCard: params.idCard, paidAt: "2026-11-13T10:00:00Z", balance: zeroWins ? 0 : spins * 1.25,
      });
      return { context, live, events, errors, summaries, paid, actions: createSpinActions(options), get spins() { return spins; } };
    };

    for (const standalone of [false, true]) for (const zeroWins of [false, true]) {
      await t.test(`pays only winning cards; standalone=${standalone}, zeroWins=${zeroWins}`, async () => {
        const f = fixture("sequential-" + standalone + "-" + zeroWins, standalone, zeroWins);
        let release;
        frameApi.pay = async params => {
          f.events.push("pay" + f.spins);
          if (f.spins === 1) await new Promise(resolve => { release = resolve; });
          return f.paid(params);
        };
        if (zeroWins) {
          frameApi.pay = async () => { throw new Error("losing Free Spins must not call /pay"); };
          await f.actions.startFreeSpinRun();
          assert.deepEqual(f.events, ["spin1", "spin2"]);
          assert.equal(freeSpinSeries.getPayments(f.context).length, 0);
          assert.equal(f.errors.length, 0);
          assert.equal(f.live.current.player.balance, 0);
          assert.equal(f.live.current.freeSpinsWinTotal, 0);
          assert.equal(f.summaries.length, 1);
          assert.equal(f.summaries[0].totalWin, "0.00");
          return;
        }
        const run = f.actions.startFreeSpinRun();
        for (let attempts = 0; !release && attempts < 100; attempts++)
          await new Promise(resolve => setTimeout(resolve, 1));
        assert.ok(release, "first payment must start automatically");
        assert.equal(f.spins, 1);
        assert.deepEqual(f.events, ["spin1", "pay1"]);
        assert.equal(f.summaries.length, 0);
        assert.equal(f.live.current.freeSpinsWinTotal, zeroWins ? 0 : 1.25);
        // Concurrent spin attempts cannot advance while /pay is pending.
        assert.equal(await f.actions.handleSpin(), null);
        release();
        await run;
        assert.deepEqual(f.events, ["spin1", "pay1", "spin2", "pay2"]);
        assert.equal(f.errors.length, 0);
        assert.equal(freeSpinSeries.getPayments(f.context).length, 2);
        assert.ok(freeSpinSeries.getPayments(f.context).every(card => card.paid));
        assert.equal(f.live.current.player.balance, zeroWins ? 0 : 2.5);
        assert.equal(f.live.current.freeSpinsWinTotal, zeroWins ? 0 : 2.5);
        assert.equal(f.live.current.spinResult.WinSum, zeroWins ? 0 : 1.25, "payment must preserve the visible spin result");
        assert.equal(f.summaries.length, 1);
        assert.equal(f.summaries[0].totalWin, zeroWins ? "0.00" : "2.50");
        const payments = [...f.events];
        await f.actions.settleFreeSpinWins();
        await f.actions.continueAfterFreeSpins();
        assert.deepEqual(f.events, payments, "summary must not pay the series a second time");
      });
    }

    for (const failure of ["TIMEOUT", "PAY_REJECTED", "malformed"]) {
      const zeroWins = false;
      await t.test(`blocks after ${failure}, zeroWins=${zeroWins}, then resumes only after card-state confirmation`, async () => {
        const f = fixture("recovery-" + failure + "-" + zeroWins, false, zeroWins);
        let pays = 0;
        frameApi.pay = async params => {
          pays++;
          if (pays === 1) {
            if (failure === "malformed") return { status: "unknown", balance: 1.25 };
            throw Object.assign(new Error(failure), { code: failure });
          }
          return f.paid(params);
        };
        await f.actions.startFreeSpinRun();
        assert.equal(f.spins, 1);
        assert.equal(pays, 1);
        assert.equal(f.live.current.roundRecoveryBlocked, true);
        assert.equal(f.summaries.length, 0);
        const pending = recovery.getPendingRequest(f.context);
        assert.equal(pending.idCard, f.context.playerId + "-1");
        const { freeSpinSeries: reloaded } = await server.ssrLoadModule(
          "/src/services/freeSpinSeries.js?reload=" + failure + zeroWins,
        );
        assert.equal(reloaded.getPayments(f.context)[0].paymentRequestId, pending.requestId);
        await f.actions.startFreeSpinRun();
        assert.equal(f.spins, 1);
        assert.equal(pays, 1, "uncertain payments must not be blindly replayed");
        const result = { ...f.live.current.spinResult, creditedToBalance: true };
        assert.equal(reconcileConfirmedPayment(f.context, {
          playerId: f.context.playerId,
          gameState: { idGameType: resolveApiGameId(f.context), idCard: pending.idCard, PayDate: "confirmed" },
        }, { spinResult: result, grid: f.live.current.grid }, { balance: zeroWins ? 0 : 1.25 }, pending), true);
        assert.equal(recovery.getPendingRequest(f.context), null);
        Object.assign(f.live.current, {
          roundRecoveryBlocked: false, player: { balance: 0, currency: "USD" }, spinResult: result,
        });
        await f.actions.startFreeSpinRun();
        assert.equal(f.spins, 2);
        assert.equal(pays, 2, "only the next card needs a payment after confirmed recovery");
        assert.equal(f.summaries.length, 1);
        assert.equal(f.summaries[0].totalWin, zeroWins ? "0.00" : "2.50");
        assert.equal(f.live.current.player.balance, zeroWins ? 0 : 2.5);
      });
    }

    await t.test("balance refresh preserves the hold until completion", async () => {
      const f=fixture("held-refresh");
      freeSpinSeries.holdDisplayBalance(f.context,0);
      freeSpinSeries.recordResult(f.context,{idCard:"refresh-win",WinSum:1.25},true);
      freeSpinSeries.markPaid(f.context,"refresh-win",1.25);
      freeSpinSeries.reconcile(f.context,15);
      f.live.current.freeSpinsLeft=0;
      globalThis.fetch=async url=>{
        assert.ok(url.endsWith("/balance"));
        return new Response(JSON.stringify({balance:1.25,currency:"USD",playerId:f.context.playerId}));
      };
      const wallet=await f.actions.refreshBalance();
      assert.equal(wallet.balance,1.25);
      assert.equal(f.live.current.player.balance,0);
      await f.actions.settleFreeSpinWins();
      assert.equal(f.live.current.player.balance,1.25);
      assert.equal(f.summaries[0].totalWin,"1.25");
    });

    await t.test("paid /init card repairs the ledger even without a pending /pay", async () => {
      const f = fixture("paid-init-gap");
      frameApi.pay = async () => { throw Object.assign(new Error("lost payment"), { code: "TIMEOUT" }); };
      await f.actions.handleSpin();
      const pending = recovery.getPendingRequest(f.context);
      assert.ok(pending);
      // Simulate the reload window after transport confirmation but before
      // markPaid: no pending request remains, yet the ledger still says unpaid.
      recovery.completePendingRequest(pending.requestId, f.context);
      const card = {
        idCard: pending.idCard, idGameType: resolveApiGameId(f.context),
        CardSum: "0", SumPay: "1.25", PayDate: "2026-11-13T10:00:00Z",
        SlotFreeSpin: "True", SlotDemoSpin: "False", CountFreeSpin: "14",
        SpinResult: { idCard: pending.idCard, Number: "1", WasDouble: "0", LineSum: "25", Lines: "1" },
        LinesKoff: Object.fromEntries(Array.from({ length: 10 }, (_, i) => ["Koff" + (i + 1), "0"])),
        ...Object.fromEntries([1, 2, 3].map(row => ["Line" + row,
          Object.fromEntries([1, 2, 3, 4, 5].map(column => ["Slot" + row + column, "1"]))])),
      };
      globalThis.fetch = async url => {
        if (url.endsWith("/init")) return new Response(JSON.stringify({ sessionId: "reopened", gameState: card }));
        if (url.endsWith("/balance")) return new Response(JSON.stringify({ balance: 1.25, currency: "USD", playerId: f.context.playerId }));
        assert.ok(url.endsWith("/freespins"));
        return new Response(JSON.stringify({ CountFreeSpin: "14" }));
      };
      const session = await new SessionApiService().initSession(f.context);
      assert.equal(session.freeSpinsLeft, 1);
      assert.equal(session.player.balance, 1.25, 'server wallet stays authoritative');
      assert.equal(session.freeSpinDisplayBalance, 0, 'reopening restores the held display balance');
      assert.equal(session.freeSpinsWinTotal, 1.25);
      assert.equal(session.freeSpinsPaidTotal, 1.25);
      assert.equal(session.gameState.spinResult.creditedToBalance, true);
      assert.equal(freeSpinSeries.getPayments(f.context)[0].paid, true);
      assert.equal(recovery.getPendingRequest(f.context), null);
      Object.assign(f.live.current, {
        roundRecoveryBlocked:false, player:{...session.player,balance:session.freeSpinDisplayBalance},
        spinResult:session.gameState.spinResult,freeSpinsLeft:session.freeSpinsLeft,
        freeSpinsWinTotal:session.freeSpinsWinTotal,
      });
      frameApi.pay=async params=>f.paid(params);
      await f.actions.startFreeSpinRun();
      assert.equal(f.live.current.player.balance,2.5);
      assert.equal(f.live.current.freeSpinsWinTotal,2.5);
      assert.equal(f.summaries.length,1);
    });
  } finally {
    await server.close();
    globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  }
});
