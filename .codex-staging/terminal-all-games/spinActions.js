import { flushSync } from "react-dom";
import { frameApi } from "../api/frameApi.js";
import {
  LOTTERY_REVEAL_SETTLE_MS,
  TERMINAL_SPIN_FLOW_TIMEOUT_MS,
  createDoubleState,
  createEmptyDoublingState,
  createWinningDoublingState,
} from "../config/gameSettings.js";
import { buildRequestId } from "../hooks/useFrameBridge.js";
import { wait, withTimeout } from "../utils/async.js";
import { getAwardedFreeSpinCount } from "../utils/freeSpins.js";
import { getTicketWinAmount } from "../utils/gameResult.js";
import { ROUND_OPERATION_STATUS, stateRecoveryService } from "../services/stateRecoveryService.js";
import { partnerApi } from "../services/partnerApi.js";
import { getNextSpinDelayMs } from "../utils/spinTiming.js";
import { asNumber } from "../utils/number.js";
import { isHiranmandiTerminal } from "../api/terminalApi.js";
import { refreshTerminalBalance } from "../utils/terminalBalance.js";


const VALID_FRAME_LINE_COUNTS = new Set([1, 3, 5, 7, 9]);
const UNKNOWN_SPIN_RESULT_CODES = new Set([
  "TIMEOUT",
  "NETWORK_ERROR",
  "NETWORK_UNREACHABLE",
  "BACKEND_UNAVAILABLE",
]);

export const createSpinActions = ({
  autoPlayOnRef,
  setAutoPlayOn,
  emitLotteryRevealSounds,
  emitSound,
  freeSpinRunRef,
  resumeAutoPlayAfterFreeSpinsRef = { current: false },
  liveSpinStateRef,
  playSpinFeedback,
  postEvent,
  reportOperationError,
  setDoubleState,
  setDoublingState,
  setError,
  setFreeSpinsLeft,
  setFreeSpinRoundStarted,
  setFreeSpinsTotal,
  setFreeSpinsWinTotal = () => {},
  setFreeSpinsPaidTotal = () => {},
  setFreeSpinSummary = () => {},
  setGrid,
  setGridAnimation,
  setGridRevealKey,
  setHasRecoveredGrid,
  setHasSessionSpin,
  setLastKnownState,
  setPlayer,
  setShowFreeSpinPrompt,
  setFreeSpinPromptRecovered,
  setSpinHistory,
  setSpinResult,
  setStatus,
  showFreeSpinPrompt,
  t,
  onRecoveryRequired,
}) => {
  const refreshBalance = async () => {
    const state = liveSpinStateRef.current;
    if (!isHiranmandiTerminal(state.context) || !state.player) return null;
    return refreshTerminalBalance({
      context: state.context,
      liveSpinStateRef,
      setPlayer,
      postEvent,
    });
  };

  const showFreeSpinCompletion = async () => {
    const state = liveSpinStateRef.current;
    if (state.freeSpinsLeft !== 0 || !(state.freeSpinsTotal > 0) ||
        state.freeSpinHistoryMissing || state.roundRecoveryBlocked ||
        state.freeSpinSummary || state.freeSpinSummaryChecking ||
        (freeSpinRunRef.current && !state.freeSpinSettlementPromise) ||
        stateRecoveryService.getPendingRequest(state.context)) return false;

    liveSpinStateRef.current.freeSpinSummaryChecking = true;
    try {
      const current = liveSpinStateRef.current;
      const summary = {
        id: `free-spins-${current.spinResult?.idCard ?? Date.now()}`,
        totalWin: Number(Number(current.freeSpinsWinTotal ?? 0).toFixed(2)),
        currency: current.player?.currency ?? current.context?.currency,
        resumeAutoExpress: Boolean(resumeAutoPlayAfterFreeSpinsRef.current),
      };
      autoPlayOnRef.current = false;
      resumeAutoPlayAfterFreeSpinsRef.current = false;
      setAutoPlayOn?.(false);
      liveSpinStateRef.current.freeSpinSummary = summary;
      setFreeSpinSummary(summary);
      return true;
    } finally {
      liveSpinStateRef.current.freeSpinSummaryChecking = false;
    }
  };

  let freeSpinContinuePromise = null;
  const continueAfterFreeSpins = () => {
    const summary = liveSpinStateRef.current.freeSpinSummary;
    if (!summary) return Promise.resolve(false);
    if (freeSpinContinuePromise) return freeSpinContinuePromise;
    freeSpinContinuePromise = Promise.resolve().then(() => {
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        freeSpinSummary: null,
        freeSpinsTotal: 0,
        // null means the bonus display mode is fully closed. Zero is a valid
        // TOTAL WIN value and must only be used while a Free Spins series exists.
        freeSpinsWinTotal: null,
        freeSpinsPaidTotal: 0,
      };
      setFreeSpinSummary(null);
      setFreeSpinsTotal(0);
      setFreeSpinsWinTotal(null);
      setFreeSpinsPaidTotal(0);
      stateRecoveryService.completeRound(liveSpinStateRef.current.context);
      if (summary.resumeAutoExpress && !liveSpinStateRef.current.roundRecoveryBlocked) {
        autoPlayOnRef.current = true;
        setAutoPlayOn?.(true);
      }
      return true;
    }).finally(() => { freeSpinContinuePromise = null; });
    return freeSpinContinuePromise;
  };

  const settleFreeSpinWins = ({ keepalive = false } = {}) => {
    if (liveSpinStateRef.current.freeSpinSettlementPromise)
      return liveSpinStateRef.current.freeSpinSettlementPromise;
    const state = liveSpinStateRef.current;
    if (state.freeSpinsLeft !== 0 || state.freeSpinHistoryMissing ||
        state.roundRecoveryBlocked || stateRecoveryService.getPendingRequest(state.context))
      return Promise.resolve(false);

    const task = (async () => {
      try {
        // Terminal Free Spins are accounted for by the server. Read Deposit only
        // once after the complete series; never add individual ticket wins here.
        await refreshBalance();
        const paidTotal = Number(state.freeSpinsWinTotal ?? 0);
        setFreeSpinsPaidTotal(paidTotal);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsPaidTotal: paidTotal,
        };
        stateRecoveryService.completeRound(state.context);
        if (!keepalive) await showFreeSpinCompletion();
        return true;
      } catch (error) {
        reportOperationError(error, "Unable to finish free spins");
        return false;
      } finally {
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinSettlementPromise: null,
        };
      }
    })();
    liveSpinStateRef.current = {
      ...liveSpinStateRef.current,
      freeSpinSettlementPromise: task,
    };
    return task;
  };

  const handleSpin = async ({
    autoExpressSpin = false,
    freeSpinAuto = false,
  } = {}) => {
    const {
      carpetCloseMs,
      carpetOpenMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
      freeSpinsTotal,
      player,
      selectedCombination,
      stake,
      status,
      visualMode,
    } = liveSpinStateRef.current;
    if (
      liveSpinStateRef.current.freeSpinSummary ||
      liveSpinStateRef.current.freeSpinSummaryChecking ||
      liveSpinStateRef.current.roundRecoveryBlocked ||
      !selectedCombination ||
      status === "processing" ||
      doubleState.loading ||
      doublingState.loading ||
      (freeSpinRunRef.current && !freeSpinAuto)
    ) {
      return null;
    }
    const isFreeSpin = freeSpinsLeft > 0;
    const creditWinOnReveal =
      isFreeSpin || freeSpinAuto || autoExpressSpin || autoPlayOnRef.current;
    const effectiveDemo = context.demoMode === true || context.demoMode === 1 || context.demoMode === "true";
    const lineCount = selectedCombination.groups.length;
    const totalStake = Number((stake * lineCount).toFixed(2));
    if (!VALID_FRAME_LINE_COUNTS.has(lineCount)) {
      setError("Invalid line count");
      setLastKnownState("invalid-lines");

      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      return null;
    }
    const requestId = buildRequestId("spin");
    const terminalWallet = isHiranmandiTerminal(context);
    let spinStartBalance = Number(player?.balance ?? 0);
    let authoritativeTerminalBalance = null;
    let stakeDeducted = false;
    let partnerRoundId = null;
    let authoritativePartnerBalance = null;
    let visualSpinStartedAt = null;
    let spinSubmitted = false;
    let spinResultReceived = false;

    try {
      // Use the last confirmed terminal deposit for the optimistic display.
      // Only refresh before Spin when that cached value says the bet is not
      // affordable; this avoids rejecting a deposit changed outside the page.
      if (terminalWallet && !isFreeSpin && spinStartBalance < totalStake) {
        authoritativeTerminalBalance = await refreshTerminalBalance({
          context,
          liveSpinStateRef,
          setPlayer,
          postEvent,
        });
        spinStartBalance = authoritativeTerminalBalance;
      }
      if (!isFreeSpin && spinStartBalance < totalStake) {
        setError(t("insufficientBalance"));
        setLastKnownState("insufficient-balance");
        setStatus("ready");
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          status: "ready",
        };
        return null;
      }

      const betRegistration = await partnerApi.registerBet({
        requestId,
        playerId: context.userId ?? context.idUser,
        gameId: context.recoveryGameId ?? context.gameId,
        stake,
        lines: lineCount,
        totalBet: isFreeSpin ? 0 : totalStake,
        isFreeSpin,
      });
      if (betRegistration && betRegistration.allowed !== true) {
        setError(
          betRegistration.code === "INSUFFICIENT_FUNDS"
            ? t("insufficientBalance")
            : t("betRejected"),
        );
        setLastKnownState("bet-rejected");
        setStatus("ready");
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          status: "ready",
        };
        if (betRegistration.balance != null) {
          setPlayer((current) =>
            current
              ? { ...current, balance: Number(betRegistration.balance) }
              : current,
          );
        }
        return null;
      }
      partnerRoundId = betRegistration?.partnerRoundId ?? null;

      stateRecoveryService.saveRound({
        requestId, partnerRoundId, operationType: "SPIN", operationStatus: ROUND_OPERATION_STATUS.SPIN_PROCESSING,
        WasDouble: 0, currentWinSum: 0, doubleAvailable: false,
        freeSpinsActive: isFreeSpin || freeSpinsLeft > 0,
        freeSpinsTotal,
        freeSpinsLeft,
        freeSpinsPlayed: Math.max(0, freeSpinsTotal - freeSpinsLeft),
        lastConfirmedSpinResult: liveSpinStateRef.current.spinResult ?? null,
        lastConfirmedGrid: liveSpinStateRef.current.grid ?? null,
      }, context);
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };

      playSpinFeedback();
      setHasRecoveredGrid?.(false);
      if (visualMode) {
        visualSpinStartedAt = Date.now();
        setGridAnimation("spinning");
        emitSound("carpet");
      } else setGridAnimation("spinning");
      setDoublingState(createEmptyDoublingState());
      setLastKnownState("spin-submitted");
      setError("");
      setSpinResult(null);
      stakeDeducted = !isFreeSpin;
      if (!isFreeSpin) {
        const displayedBalance = terminalWallet
          ? Number((spinStartBalance - totalStake).toFixed(2))
          : betRegistration?.balance == null
            ? Number((spinStartBalance - totalStake).toFixed(2))
            : Number(betRegistration.balance);
        const showOptimisticBalance = () => {
          setPlayer((current) => {
            if (!current) return current;
            const nextPlayer = { ...current, balance: displayedBalance };
            if (liveSpinStateRef?.current) {
              liveSpinStateRef.current = {
                ...liveSpinStateRef.current,
                player: nextPlayer,
              };
            }
            return nextPlayer;
          });
        };
        // Auto Express runs inside an async scheduler. Commit the visual bet
        // immediately with the spinning state instead of leaving it in React's
        // pending batch until the SOAP result or reveal animation completes.
        if (autoExpressSpin) flushSync(showOptimisticBalance);
        else showOptimisticBalance();
        postEvent("UPDATE_BALANCE", {
          balance: displayedBalance,
          currency: player?.currency,
        });
      }
      spinSubmitted = true;
      const apiResult = await withTimeout(
        frameApi.spin({
          stake,
          totalStake,
          lines: selectedCombination.groups.length,
          isDemo: isFreeSpin ? false : effectiveDemo,
          isFreeSpin,
          selectedCombination,
          requestId,
        }),
        "Spin",
        isHiranmandiTerminal(liveSpinStateRef.current.context) ? TERMINAL_SPIN_FLOW_TIMEOUT_MS : undefined,
      );
      const result = {
        ...apiResult,
        WinSum: asNumber(apiResult.WinSum),
        BaseWinSum: asNumber(apiResult.BaseWinSum, asNumber(apiResult.WinSum)),
        BackendWinSum: asNumber(apiResult.BackendWinSum, asNumber(apiResult.WinSum)),
      };
      spinResultReceived = true;
      const backendManagedWallet = result.backendManagedWallet === true;
      const terminalManagedWallet = result.terminalManagedWallet === true;
      // During terminal Free Spins the SOAP server may credit each card internally,
      // but the UI must keep the pre-series Deposit until the whole bonus round ends.
      // startFreeSpinRun performs one authoritative GetDepozitTerminal refresh after
      // the final Free Spin, so only the total series result becomes visible.
      if (backendManagedWallet && !terminalWallet && Number.isFinite(Number(result.balance))) {
        authoritativePartnerBalance = Number(result.balance);
        setPlayer((current) => current ? { ...current, balance: authoritativePartnerBalance } : current);
      }
      if (visualMode) {
        const elapsedCloseMs = visualSpinStartedAt == null ? 0 : Date.now() - visualSpinStartedAt;
        const remainingCloseMs = Math.max(0, carpetCloseMs - elapsedCloseMs);
        if (remainingCloseMs > 0) await wait(remainingCloseMs);
      }
      const hasBackendWin = result.hasBackendWin ?? result.WinSum > 0;
      const awardedFreeSpins = getAwardedFreeSpinCount(result);
      const zeroWinPayRequestId = !terminalWallet && !hasBackendWin && !isFreeSpin && awardedFreeSpins === 0
        ? buildRequestId("pay")
        : null;
      let zeroWinPayError = null;
      const zeroWinPayPromise = zeroWinPayRequestId
        ? frameApi
            .pay({ idCard: result.idCard, requestId: zeroWinPayRequestId })
            .catch((error) => {
              zeroWinPayError = error;
              return null;
            })
        : null;
      const ticketWinAmount = getTicketWinAmount(result);
      const isDigitWin = ticketWinAmount > 0;
      const shouldCreditWin =
        !terminalWallet && result.WinSum > 0 && (creditWinOnReveal || awardedFreeSpins > 0);
      if (visualMode) {
        setHasSessionSpin?.(true);
        setGrid(result.grid);
        liveSpinStateRef.current = { ...liveSpinStateRef.current, grid: result.grid };
        setGridRevealKey((key) => key + 1);
        setGridAnimation("revealing");
        emitLotteryRevealSounds();
      } else {
        flushSync(() => {
          setHasSessionSpin?.(true);
          setGrid(result.grid);
          liveSpinStateRef.current = { ...liveSpinStateRef.current, grid: result.grid };
          setGridRevealKey((key) => key + 1);
          setGridAnimation("revealing");
        });
        emitLotteryRevealSounds();
      }
      const revealSettleMs = visualMode
        ? carpetOpenMs
        : LOTTERY_REVEAL_SETTLE_MS;
      window.setTimeout(
        () => setGridAnimation("settled"),
        revealSettleMs,
      );
      let nextSpinResult = {
        ...result,
        creditedToBalance: shouldCreditWin || (terminalWallet && isFreeSpin),
        partnerRoundId,
      };
      if (
        partnerRoundId &&
        (!isDigitWin || shouldCreditWin)
      ) {
        const settlement = await partnerApi.settleRound({
          requestId: buildRequestId("partner-settle"),
          partnerRoundId,
          gameRoundId: result.idCard,
          finalWin: shouldCreditWin ? result.WinSum : 0,
          doubleSteps: 0,
        });
        if (settlement?.balance != null) {
          authoritativePartnerBalance = Number(settlement.balance);
          setPlayer((current) =>
            current
              ? { ...current, balance: authoritativePartnerBalance }
              : current,
          );
        }
        nextSpinResult = {
          ...nextSpinResult,
          creditedToBalance: shouldCreditWin || (terminalWallet && isFreeSpin),
          partnerSettled: true,
        };
      }
      const nextDoublingState = isDigitWin && !shouldCreditWin
        ? createWinningDoublingState(ticketWinAmount)
        : createEmptyDoublingState();
      setSpinResult(nextSpinResult);
      setDoublingState(nextDoublingState);
      // Keep the last completed board separately from an active round.
      // It is used only to repopulate the otherwise empty View 1 on return.
      stateRecoveryService.saveLastSpin({ grid: result.grid, spinResult: nextSpinResult }, context);
      if (isDigitWin && !shouldCreditWin) {
        stateRecoveryService.saveRound({
          requestId, partnerRoundId, idCard: result.idCard, roundId: result.idCard, operationType: "SPIN",
          operationStatus: ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION,
          currentWinSum: ticketWinAmount, WasDouble: 0, doubleAvailable: true,
          autoExpressActive: autoExpressSpin || autoPlayOnRef.current,
          stake, selectedCombinationId: selectedCombination.id,
          spinResult: nextSpinResult, grid: result.grid, doublingState: nextDoublingState, doubleState: createDoubleState(),
        }, context);
      } else {
        stateRecoveryService.completeRound(context);
      }
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        spinResult: nextSpinResult,
        doublingState: nextDoublingState,
      };
      setSpinHistory((current) =>
        [
          {
            id: result.idCard,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            combination: selectedCombination.title,
            stake: totalStake,
            win: result.WinSum,
          },
          ...current,
        ].slice(0, 10),
      );

      let shouldShowFreeSpinPrompt = false;
      if (isFreeSpin) {
        const nextFreeSpinsWinTotal = Number((
          Number(liveSpinStateRef.current.freeSpinsWinTotal ?? 0) + ticketWinAmount
        ).toFixed(2));
        const currentFreeSpinsLeft = Number(
          liveSpinStateRef.current.freeSpinsLeft ?? freeSpinsLeft,
        );
        const currentFreeSpinsTotal = Number(
          liveSpinStateRef.current.freeSpinsTotal ?? freeSpinsTotal,
        );
        const nextFreeSpinsLeft = Math.max(
          0,
          currentFreeSpinsLeft - 1 + awardedFreeSpins,
        );
        const nextFreeSpinsTotal = currentFreeSpinsTotal + awardedFreeSpins;
        if (awardedFreeSpins > 0) setFreeSpinsTotal(nextFreeSpinsTotal);
        setFreeSpinsWinTotal(nextFreeSpinsWinTotal);
        setFreeSpinsLeft(nextFreeSpinsLeft);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: nextFreeSpinsLeft,
          freeSpinsTotal: nextFreeSpinsTotal,
          freeSpinsWinTotal: nextFreeSpinsWinTotal,
        };
      } else if (awardedFreeSpins > 0) {
        setFreeSpinRoundStarted(false);
        setFreeSpinsTotal(awardedFreeSpins);
        setFreeSpinsLeft(awardedFreeSpins);
        setFreeSpinsWinTotal(0);
        setFreeSpinsPaidTotal(0);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: awardedFreeSpins,
          freeSpinsTotal: awardedFreeSpins,
          freeSpinsWinTotal: 0,
          freeSpinsPaidTotal: 0,
        };
        // Remember autoplay across the award prompt and the complete bonus series.
        resumeAutoPlayAfterFreeSpinsRef.current = autoExpressSpin || autoPlayOnRef.current;
        // Pause paid autoplay until the player acknowledges the awarded series.
        shouldShowFreeSpinPrompt = true;
        autoPlayOnRef.current = false;
        setAutoPlayOn?.(false);

        if (visualMode) emitSound("freeTickets");
      }

      if (isFreeSpin || awardedFreeSpins > 0) {
        const persistedFreeSpinsLeft = Number(liveSpinStateRef.current.freeSpinsLeft ?? 0);
        const persistedFreeSpinsTotal = Number(liveSpinStateRef.current.freeSpinsTotal ?? 0);
        stateRecoveryService.saveRound({ idCard: result.idCard, roundId: result.idCard, requestId, operationType: "FREE_SPIN", operationStatus: persistedFreeSpinsLeft > 0 ? ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION : ROUND_OPERATION_STATUS.ROUND_COMPLETED, currentWinSum: getTicketWinAmount(nextSpinResult, nextDoublingState), WasDouble: 0, doubleAvailable: false, freeSpinsActive: persistedFreeSpinsLeft > 0, freeSpinsTotal: persistedFreeSpinsTotal, freeSpinsLeft: persistedFreeSpinsLeft, freeSpinsWinTotal: Number(liveSpinStateRef.current.freeSpinsWinTotal ?? 0), freeSpinsPlayed: Math.max(0, persistedFreeSpinsTotal - persistedFreeSpinsLeft), spinResult: nextSpinResult, lastConfirmedSpinResult: nextSpinResult, lastConfirmedGrid: liveSpinStateRef.current.grid ?? result.grid, grid: result.grid, doublingState: nextDoublingState }, context);
        if (persistedFreeSpinsLeft <= 0) stateRecoveryService.completeRound(context);
      }

      await wait(revealSettleMs);

      // Losing paid Spins reconcile after the result animation. A winning
      // terminal Spin keeps the post-bet balance visible and does not read
      // Deposit until the player explicitly takes the win. Free Spins keep the
      // pre-series display and reconcile once when the complete series settles.
      if (terminalWallet && !isFreeSpin && !isDigitWin) {
        authoritativeTerminalBalance = await refreshTerminalBalance({
          context,
          liveSpinStateRef,
          setPlayer,
          postEvent,
        });
        nextSpinResult = { ...nextSpinResult, terminalBalanceRefreshed: true };
        setSpinResult(nextSpinResult);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          spinResult: nextSpinResult,
        };
      }

      if (!terminalWallet && shouldCreditWin && authoritativePartnerBalance == null) {

        setPlayer((current) => {
          if (!current) return current;

          const nextPlayer = {
            ...current,
            balance: Number((current.balance + result.WinSum).toFixed(2)),
          };
          liveSpinStateRef.current = {
            ...liveSpinStateRef.current,
            player: nextPlayer,
          };
          return nextPlayer;
        });
      }
      // Start zero-win Pay as soon as the confirmed result arrives, so the
      // server closes the card while the reveal animation is playing.
      if (zeroWinPayPromise) await zeroWinPayPromise;
      if (zeroWinPayError) {
        stateRecoveryService.markRoundRecoveryRequired(
          zeroWinPayError,
          { requestId: zeroWinPayRequestId, operationType: "COLLECT", idCard: result.idCard },
          context,
        );
        onRecoveryRequired?.();
        reportOperationError(zeroWinPayError, t("paymentUnknown"));
        return null;
      }

      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      setLastKnownState(hasBackendWin ? "win" : "lose");
      const hasAudibleWin = hasBackendWin || (visualMode && isDigitWin);
      if (hasAudibleWin) emitSound("win", { ...result, visualMode });
      if (visualMode && !hasAudibleWin) emitSound("lose", result);
      if (shouldShowFreeSpinPrompt) {
        setFreeSpinPromptRecovered?.(false);
        setShowFreeSpinPrompt(true);
      }
      postEvent("LOADED", { requestId, state: "spin-complete" });
      if (!terminalWallet) {
        postEvent("UPDATE_BALANCE", {
          balance: Number(
            (
              spinStartBalance -
              (isFreeSpin ? 0 : totalStake) +
              (shouldCreditWin ? result.WinSum : 0)
            ).toFixed(2),
          ),
        });
      }
      return result;
    } catch (spinError) {
      setGridAnimation("settled");
      // A failed Auto Express request must stop the scheduler. Otherwise it
      // retries the same unavailable balance endpoint every 100 ms and can
      // replace the playable screen with a stream of identical errors.
      if (autoExpressSpin) {
        autoPlayOnRef.current = false;
        setAutoPlayOn?.(false);
      }
      const resultUnknown = spinSubmitted && !spinResultReceived &&
        UNKNOWN_SPIN_RESULT_CODES.has(spinError?.code);

      const authoritativeRejectedBalance = Number(spinError?.balance);
      if (terminalWallet && !isFreeSpin && !Number.isFinite(authoritativeRejectedBalance)) {
        await refreshTerminalBalance({
          context,
          liveSpinStateRef,
          setPlayer,
          postEvent,
        }).catch(() => null);
      }
      if (
        spinError?.code === "INSUFFICIENT_FUNDS" &&
        Number.isFinite(authoritativeRejectedBalance)
      ) {
        const nextPlayer = {
          ...liveSpinStateRef.current.player,
          balance: authoritativeRejectedBalance,
        };
        setPlayer(nextPlayer);
        setStatus("ready");
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          player: nextPlayer,
          status: "ready",
        };
        stateRecoveryService.completeRound(context);
        setLastKnownState("insufficient-balance");
      } else if (resultUnknown) {
        await frameApi
          .recoverAfterTimeout({
            request: {
              requestId,
              sessionId: context.sessionId,
              gameId: context.gameId,
            },
          })
          .catch(() => null);
        stateRecoveryService.markRoundRecoveryRequired(spinError, { requestId, operationType: "SPIN" }, context);
        onRecoveryRequired?.();
        postEvent("RECOVERY_REQUIRED", {
          requestId,
          message: "Spin result is unknown; blind retry is disabled.",
        });
      } else if (!terminalWallet && (partnerRoundId || stakeDeducted)) {
        const cancellation = partnerRoundId
          ? await partnerApi
              .cancelBet({
                requestId: buildRequestId("partner-cancel"),
                partnerRoundId,
              })
              .catch(() => null)
          : null;
        setPlayer((current) =>
          current
            ? {
                ...current,
                balance:
                  cancellation?.balance == null
                    ? Number((current.balance + totalStake).toFixed(2))
                    : Number(cancellation.balance),
              }
            : current,
        );
      }
      reportOperationError(spinError, t("spinUnknown"));
      return null;
    }
  };

  const collectWin = async ({ prefetchedTerminalBalance = null } = {}) => {
    const { doublingState, player, spinResult, status } = liveSpinStateRef.current;
    if (
      !spinResult?.idCard ||
      getTicketWinAmount(spinResult, doublingState) <= 0 ||
      status === "processing"
    )
      return false;
    const requestId = buildRequestId("pay");
    const payout = getTicketWinAmount(spinResult, doublingState);
    const alreadyCredited = spinResult.creditedToBalance;
    if (isHiranmandiTerminal(liveSpinStateRef.current.context)) {
      setStatus("processing");
      liveSpinStateRef.current = { ...liveSpinStateRef.current, status: "processing" };
      // Winning terminal Spins intentionally defer their only Deposit read
      // until the player explicitly takes the win. Losing Spins have no Take
      // Win action and reconcile after their result animation instead.
      if (spinResult.terminalBalanceRefreshed !== true) {
        await refreshTerminalBalance({
          context: liveSpinStateRef.current.context,
          liveSpinStateRef,
          setPlayer,
          postEvent,
          balance: prefetchedTerminalBalance,
        });
      }
      postEvent("SPIN_RESULT", {
        idCard: spinResult.idCard,
        WinSum: payout,
        Double: doublingState?.step ?? 0,
      });
      const nextDoubleState = createDoubleState();
      const nextDoublingState = createEmptyDoublingState();
      setDoubleState(nextDoubleState);
      setDoublingState(nextDoublingState);
      setSpinResult(null);
      setGridAnimation("idle");
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        doubleState: nextDoubleState,
        doublingState: nextDoublingState,
        spinResult: null,
        status: "ready",
      };
      stateRecoveryService.completeRound(liveSpinStateRef.current.context);
      setLastKnownState("paid");
      emitSound("cashout");
      return true;
    }
    try {
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };
      stateRecoveryService.saveRound({ idCard: spinResult.idCard, roundId: spinResult.idCard, requestId, operationType: "COLLECT", operationStatus: ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT, currentWinSum: payout, WasDouble: doublingState?.step ?? 0, doubleAvailable: false, spinResult, doublingState }, liveSpinStateRef.current.context);
      setLastKnownState("pay-submitted");
      const payResult = await withTimeout(
        frameApi.pay({ idCard: spinResult.idCard, requestId }),
        "Pay",
        isHiranmandiTerminal(liveSpinStateRef.current.context) ? TERMINAL_SPIN_FLOW_TIMEOUT_MS : undefined,
      );
      const partnerSettlement =
        spinResult.partnerRoundId && !spinResult.partnerSettled
          ? await partnerApi.settleRound({
              requestId: buildRequestId("partner-settle"),
              partnerRoundId: spinResult.partnerRoundId,
              gameRoundId: spinResult.idCard,
              finalWin: payout,
              doubleSteps: doublingState?.step ?? 0,
            })
          : null;
      postEvent("SPIN_RESULT", {
        idCard: spinResult.idCard,
        WinSum: payout,
        Double: doublingState?.step ?? 0,
      });
      const terminalPayBalance = isHiranmandiTerminal(liveSpinStateRef.current.context)
        ? await refreshTerminalBalance({
            context: liveSpinStateRef.current.context,
            liveSpinStateRef,
            setPlayer,
            postEvent,
          }).catch(() => null)
        : null;
      const authoritativePayBalance = terminalPayBalance ?? payResult?.balance ?? partnerSettlement?.balance;
      if (!alreadyCredited || authoritativePayBalance != null) {
        setPlayer((current) => {
          if (!current) return current;
          const nextPlayer = {
            ...current,
            balance:
              authoritativePayBalance == null
                ? Number((Number(current.balance ?? 0) + payout).toFixed(2))
                : Number(authoritativePayBalance),
          };
          liveSpinStateRef.current = {
            ...liveSpinStateRef.current,
            player: nextPlayer,
          };
          return nextPlayer;
        });
      }
      const nextDoubleState = createDoubleState();
      const nextDoublingState = createEmptyDoublingState();
      setDoubleState(nextDoubleState);
      setDoublingState(nextDoublingState);
      setSpinResult(null);
      setGridAnimation("idle");
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        doubleState: nextDoubleState,
        doublingState: nextDoublingState,
        spinResult: null,
        status: "ready",
      };
      stateRecoveryService.completeRound(liveSpinStateRef.current.context);
      setLastKnownState("paid");
      emitSound("cashout");
      if (!alreadyCredited || authoritativePayBalance != null)
        postEvent("UPDATE_BALANCE", {
          balance: authoritativePayBalance == null
            ? Number((Number(player?.balance ?? 0) + payout).toFixed(2))
            : Number(authoritativePayBalance),
        });
      return true;
    } catch (payError) {
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      if (stateRecoveryService.getPendingRequest(liveSpinStateRef.current.context)) {
        stateRecoveryService.markRoundRecoveryRequired(
          payError,
          { requestId, operationType: "COLLECT", idCard: spinResult.idCard },
          liveSpinStateRef.current.context,
        );
        onRecoveryRequired?.();
      }
      reportOperationError(payError, t("paymentUnknown"));
      return false;
    }
  };

  const startFreeSpinRun = async () => {
    if (freeSpinRunRef.current || liveSpinStateRef.current.freeSpinsLeft <= 0 ||
        liveSpinStateRef.current.status === "processing") return;
    const pending = liveSpinStateRef.current.spinResult;
    if (pending && !pending.creditedToBalance &&
        getTicketWinAmount(pending, liveSpinStateRef.current.doublingState) > 0) {
      if (!(await collectWin())) return;
    }
    setShowFreeSpinPrompt(false);
    setFreeSpinPromptRecovered?.(false);

    setFreeSpinRoundStarted(true);
    freeSpinRunRef.current = true;
    let completed = false;
    try {
      while (
        freeSpinRunRef.current &&
        liveSpinStateRef.current.freeSpinsLeft > 0
      ) {
        const result = await handleSpin({ freeSpinAuto: true });
        if (!result) return;

        await wait(
          getNextSpinDelayMs(result, {
            visualMode: liveSpinStateRef.current.visualMode,
          }),
        );

        // Never collect or reconcile an individual Free Spin. SOAP owns the
        // wallet operation; the UI only accumulates freeSpinsWinTotal. After
        // the final Free Spin, settleFreeSpinWins performs one Deposit read for
        // the entire bonus series.
      }
      completed = liveSpinStateRef.current.freeSpinsLeft <= 0;
      if (completed && !(await settleFreeSpinWins())) completed = false;
    } finally {
      freeSpinRunRef.current = false;
      if (liveSpinStateRef.current.freeSpinsLeft <= 0) {
        setFreeSpinRoundStarted(false);
      }
      const resume = completed && resumeAutoPlayAfterFreeSpinsRef.current;
      resumeAutoPlayAfterFreeSpinsRef.current = false;
      if (resume) {
        autoPlayOnRef.current = true;
        setAutoPlayOn?.(true);
      }
    }
  };

  const onAutoPlay = async () => {
    if (freeSpinRunRef.current || showFreeSpinPrompt) return;
    const result = await handleSpin({ autoExpressSpin: true });
    if (!result) return;

    const awardedFreeSpins = getAwardedFreeSpinCount(result);
    const shouldPrefetchTerminalWin =
      awardedFreeSpins === 0 &&
      isHiranmandiTerminal(liveSpinStateRef.current.context) &&
      getTicketWinAmount(result) > 0;
    // Auto Express has no manual Take Win click. Fetch during the winning
    // animation, but do not expose the server balance until that animation is
    // finished. Resolve errors into data so the in-flight prefetch cannot cause
    // an unhandled rejection while the animation timer is running.
    const terminalBalancePrefetch = shouldPrefetchTerminalWin
      ? frameApi.getTerminalDeposit(liveSpinStateRef.current.context).then(
          (balance) => ({ balance, error: null }),
          (error) => ({ balance: null, error }),
        )
      : null;

    // Keep the stake-only balance visible until the final winning-symbol animation ends.
    await wait(
      getNextSpinDelayMs(result, {
        visualMode: liveSpinStateRef.current.visualMode,
      }),
    );
    if (awardedFreeSpins > 0) {
      // Auto Express acknowledges the award and runs the bonus automatically.
      // startFreeSpinRun collects any pending win before its first spin.
      await startFreeSpinRun();
      return;
    }

    // Drain every awarded Free Spin before another paid request. The loop
    // reads the live counter, so new awards extend the same free-spin run.
    if (liveSpinStateRef.current.freeSpinsLeft > 0) {
      await startFreeSpinRun();
      return;
    }

    if (!autoPlayOnRef.current) return;

    const prefetched = terminalBalancePrefetch
      ? await terminalBalancePrefetch
      : null;
    if (prefetched?.error) {
      reportOperationError(prefetched.error, t("paymentUnknown"));
      autoPlayOnRef.current = false;
      setAutoPlayOn?.(false);
      return;
    }
    await collectWin({ prefetchedTerminalBalance: prefetched?.balance ?? null });
  };

  return {
    collectWin,
    continueAfterFreeSpins,
    handleSpin,
    onAutoPlay,
    refreshBalance,
    settleFreeSpinWins,
    showFreeSpinCompletion,
    startFreeSpinRun,
  };
};








