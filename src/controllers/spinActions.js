import { requestBalance } from "../api/balanceApiClient.js";
import { useSoapBackend } from "../api/runtimeConfig.js";
import { flushSync } from "react-dom";
import { frameApi } from "../api/frameApi.js";
import {
  LOTTERY_REVEAL_SETTLE_MS,
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


const VALID_FRAME_LINE_COUNTS = new Set([1, 3, 5, 7, 9]);
const UNKNOWN_SPIN_RESULT_CODES = new Set([
  "TIMEOUT",
  "NETWORK_ERROR",
  "NETWORK_UNREACHABLE",
  "BACKEND_UNAVAILABLE",
  "BACKEND_RESPONSE_ERROR",
  "SERVER_ERROR",
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
  setGrid,
  setGridAnimation,
  setGridRevealKey,
  setHasRecoveredGrid,
  setLastKnownState,
  setPlayer,
  setShowFreeSpinPrompt,
  setSpinHistory,
  setSpinResult,
  setStatus,
  showFreeSpinPrompt,
  t,
  onRecoveryRequired,
}) => {
  // Refresh the wallet only: this must never resolve or retry an uncertain round.
  const refreshBalance = async ({ duringOperation = false } = {}) => {
    const snapshot = liveSpinStateRef.current;
    const { context, player } = snapshot;
    if (!useSoapBackend() || !player || !context?.token ||
        (!duringOperation && snapshot.status === "processing")) return null;
    const request = (snapshot.balanceRefreshId ?? 0) + 1;
    liveSpinStateRef.current = { ...snapshot, balanceRefreshId: request };
    const wallet = await requestBalance({
      token: context.token,
      playerId: context.playerId ?? context.userId ?? context.idUser,
    });
    const current = liveSpinStateRef.current;
    if (current.balanceRefreshId !== request || current.balanceVersion !== snapshot.balanceVersion ||
        current.context !== context || current.player !== player) return null;
    const nextPlayer = { ...player, balance: wallet.balance, currency: wallet.currency };
    liveSpinStateRef.current = { ...current, player: nextPlayer };
    setPlayer(nextPlayer);
    postEvent("UPDATE_BALANCE", { balance: wallet.balance, currency: wallet.currency });
    return wallet;
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
      liveSpinStateRef.current.roundRecoveryBlocked ||
      !selectedCombination ||
      status !== "ready" ||
      doubleState.loading ||
      doublingState.loading ||
      (freeSpinRunRef.current && !freeSpinAuto)
    ) {
      return null;
    }
    const backendManagedWallet = useSoapBackend();
    const previousResult = liveSpinStateRef.current.spinResult;
    if (previousResult?.backendManagedWallet && !previousResult.creditedToBalance && getTicketWinAmount(previousResult, doublingState) > 0) {
      setError("Collect the current win before starting another spin.");
      return null;
    }
    const isFreeSpin = freeSpinsLeft > 0;
    const creditWinOnReveal =
      isFreeSpin || freeSpinAuto || autoExpressSpin || autoPlayOnRef.current;
    const effectiveDemo = context.demoMode === true;
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
    liveSpinStateRef.current = { ...liveSpinStateRef.current, balanceVersion: (liveSpinStateRef.current.balanceVersion ?? 0) + 1 };
    const requestId = buildRequestId("spin");
    const spinStartBalance = Number(player?.balance ?? 0);
    let stakeDeducted = false;
    let partnerRoundId = null;
    let authoritativePartnerBalance = null;

    try {
      if (!backendManagedWallet && !isFreeSpin && spinStartBalance < totalStake) {
        setError(t("insufficientBalance"));
        setLastKnownState("insufficient-balance");
        setStatus("ready");
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          status: "ready",
        };
        return null;
      }

      const betRegistration = backendManagedWallet ? null : await partnerApi.registerBet({
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
      if (!visualMode) setGridAnimation("spinning");
      setDoublingState(createEmptyDoublingState());
      setLastKnownState("spin-submitted");
      setError("");
      setSpinResult(null);
      stakeDeducted = !backendManagedWallet && !isFreeSpin;
      setPlayer((current) =>
        (backendManagedWallet || isFreeSpin)
          ? current
          : {
              ...current,
              balance:
                betRegistration?.balance == null
                  ? Number((spinStartBalance - totalStake).toFixed(2))
                  : Number(betRegistration.balance),
            },
      );
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
      );
      const result = {
        ...apiResult,
        WinSum: asNumber(apiResult.WinSum),
        BaseWinSum: asNumber(apiResult.BaseWinSum, asNumber(apiResult.WinSum)),
        BackendWinSum: asNumber(apiResult.BackendWinSum, asNumber(apiResult.WinSum)),
      };
      if (backendManagedWallet && result.balance != null) {
        authoritativePartnerBalance = result.balance;
        setPlayer((current) => {
          const next = current ? { ...current, balance: result.balance } : current;
          liveSpinStateRef.current = { ...liveSpinStateRef.current, player: next };
          return next;
        });
      }
      if (backendManagedWallet && result.balance == null) {
        const wallet = await refreshBalance({ duringOperation: true }).catch(() => null);
        if (wallet) authoritativePartnerBalance = wallet.balance;
      }
      if (visualMode) {
        setGridAnimation("spinning");
        emitSound("carpet");
        if (carpetCloseMs > 0) await wait(carpetCloseMs);
      }
      const hasBackendWin = result.hasBackendWin ?? result.WinSum > 0;
      const awardedFreeSpins = getAwardedFreeSpinCount(result);
      const ticketWinAmount = getTicketWinAmount(result);
      const isDigitWin = ticketWinAmount > 0;
      const shouldCreditWin =
        !backendManagedWallet && result.WinSum > 0 && (creditWinOnReveal || awardedFreeSpins > 0);
      if (visualMode) {
        setGrid(result.grid);
        liveSpinStateRef.current = { ...liveSpinStateRef.current, grid: result.grid };
        setGridRevealKey((key) => key + 1);
        setGridAnimation("revealing");
        emitLotteryRevealSounds();
      } else {
        flushSync(() => {
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
        creditedToBalance: shouldCreditWin,
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
          creditedToBalance: shouldCreditWin,
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
        setFreeSpinsLeft(nextFreeSpinsLeft);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: nextFreeSpinsLeft,
          freeSpinsTotal: nextFreeSpinsTotal,
        };
      } else if (awardedFreeSpins > 0) {
        setFreeSpinRoundStarted(false);
        setFreeSpinsTotal(awardedFreeSpins);
        setFreeSpinsLeft(awardedFreeSpins);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: awardedFreeSpins,
          freeSpinsTotal: awardedFreeSpins,
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
        stateRecoveryService.saveRound({ idCard: result.idCard, roundId: result.idCard, requestId, operationType: "FREE_SPIN", operationStatus: (persistedFreeSpinsLeft > 0 || (backendManagedWallet && isDigitWin)) ? ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION : ROUND_OPERATION_STATUS.ROUND_COMPLETED, currentWinSum: getTicketWinAmount(nextSpinResult, nextDoublingState), WasDouble: 0, doubleAvailable: false, freeSpinsActive: persistedFreeSpinsLeft > 0, freeSpinsTotal: persistedFreeSpinsTotal, freeSpinsLeft: persistedFreeSpinsLeft, freeSpinsPlayed: Math.max(0, persistedFreeSpinsTotal - persistedFreeSpinsLeft), spinResult: nextSpinResult, lastConfirmedSpinResult: nextSpinResult, lastConfirmedGrid: liveSpinStateRef.current.grid ?? result.grid, grid: result.grid, doublingState: nextDoublingState }, context);
        if (persistedFreeSpinsLeft <= 0 && !(backendManagedWallet && isDigitWin)) stateRecoveryService.completeRound(context);
      }

      await wait(revealSettleMs);
      if (shouldCreditWin && authoritativePartnerBalance == null) {

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
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      setLastKnownState(hasBackendWin ? "win" : "lose");
      const hasAudibleWin = hasBackendWin || (visualMode && isDigitWin);
      if (hasAudibleWin) emitSound("win", { ...result, visualMode });
      if (visualMode && !hasAudibleWin) emitSound("lose", result);
      if (shouldShowFreeSpinPrompt) setShowFreeSpinPrompt(true);
      postEvent("LOADED", { requestId, state: "spin-complete" });
      if (!backendManagedWallet || authoritativePartnerBalance != null) postEvent("UPDATE_BALANCE", {
        balance: authoritativePartnerBalance ?? Number(
          (
            spinStartBalance -
            (isFreeSpin ? 0 : totalStake) +
            (shouldCreditWin ? result.WinSum : 0)
          ).toFixed(2),
        ),
      });
      // Free Spins are already settled by their Spin response. Sending the
      // legacy zero-win Pay request here can close the saved bonus round.
      if (!backendManagedWallet && !hasBackendWin && !isFreeSpin && awardedFreeSpins === 0) {
        frameApi
          .pay({ idCard: result.idCard, idPartnerCard: result.idPartnerCard, requestId: buildRequestId("pay") })
          .catch(() => {});
      }
      return result;
    } catch (spinError) {
      setGridAnimation("settled");
      const resultUnknown = UNKNOWN_SPIN_RESULT_CODES.has(spinError?.code);

      if (resultUnknown) {
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
      } else if (partnerRoundId || stakeDeducted) {
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
      if (!resultUnknown) {
        stateRecoveryService.completePendingRequest(requestId, context);
        if (backendManagedWallet) {
          if (isFreeSpin) {
            stateRecoveryService.saveRound({ operationStatus: ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION, freeSpinsActive: true, freeSpinsLeft, freeSpinsTotal }, context);
          } else stateRecoveryService.completeRound(context);
        }
      }
      if (backendManagedWallet) await refreshBalance({ duringOperation: true }).catch(() => null);
      reportOperationError(spinError, t("spinUnknown"));
      return null;
    }
  };

  const collectWin = async () => {
    const { doublingState, player, spinResult, status, context } = liveSpinStateRef.current;
    if (!spinResult?.idCard || getTicketWinAmount(spinResult, doublingState) <= 0 || status !== "ready") return false;
    if (liveSpinStateRef.current.roundRecoveryBlocked || stateRecoveryService.getPendingRequest(context)) {
      setError("Resolve the pending operation before collecting the win.");
      return false;
    }
    liveSpinStateRef.current = { ...liveSpinStateRef.current, balanceVersion: (liveSpinStateRef.current.balanceVersion ?? 0) + 1 };
    const requestId = buildRequestId("pay");
    const payout = getTicketWinAmount(spinResult, doublingState);
    const backendManagedWallet = useSoapBackend();
    try {
      setStatus("processing");
      liveSpinStateRef.current = {...liveSpinStateRef.current, status:"processing"};
      stateRecoveryService.saveRound({idCard:spinResult.idCard, requestId, operationType:"COLLECT", operationStatus:ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT, currentWinSum:payout, WasDouble:doublingState?.step ?? 0, doubleAvailable:false, spinResult, doublingState}, context);
      setLastKnownState("pay-submitted");
      const params = {idCard:spinResult.idCard, idPartnerCard:spinResult.idPartnerCard, requestId};
      const payResult = backendManagedWallet ? await frameApi.pay(params) : await withTimeout(frameApi.pay(params), "Pay");
      const settlement = !backendManagedWallet && spinResult.partnerRoundId && !spinResult.partnerSettled
        ? await partnerApi.settleRound({requestId:buildRequestId("partner-settle"), partnerRoundId:spinResult.partnerRoundId, gameRoundId:spinResult.idCard, finalWin:payout, doubleSteps:doublingState?.step ?? 0}) : null;
      const balance = backendManagedWallet ? payResult.balance
        : settlement?.balance != null ? Number(settlement.balance)
        : Number((Number(player?.balance ?? 0) + (spinResult.creditedToBalance ? 0 : payout)).toFixed(2));
      const nextPlayer = player ? {...player,balance} : null;
      setPlayer(nextPlayer);
      const nextDoubleState = createDoubleState();
      const nextDoublingState = createEmptyDoublingState();
      setDoubleState(nextDoubleState);
      setDoublingState(nextDoublingState);
      setSpinResult(null);
      setGridAnimation("idle");
      setStatus("ready");
      liveSpinStateRef.current = {...liveSpinStateRef.current, player:nextPlayer, doubleState:nextDoubleState, doublingState:nextDoublingState, spinResult:null, status:"ready"};
      if (liveSpinStateRef.current.freeSpinsLeft > 0) {
        const paidResult = {...spinResult, creditedToBalance:true};
        stateRecoveryService.saveRound({operationType:"FREE_SPIN", operationStatus:ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION, currentWinSum:0, WasDouble:0, doubleAvailable:false, freeSpinsActive:true, freeSpinsLeft:liveSpinStateRef.current.freeSpinsLeft, freeSpinsTotal:liveSpinStateRef.current.freeSpinsTotal, spinResult:paidResult, lastConfirmedSpinResult:paidResult, doublingState:nextDoublingState},context);
      } else stateRecoveryService.completeRound(context);
      setLastKnownState("paid");
      emitSound("cashout");
      postEvent("SPIN_RESULT", {idCard:spinResult.idCard, WinSum:payout, Double:doublingState?.step ?? 0});
      postEvent("UPDATE_BALANCE", {balance, currency:player?.currency});
      return true;
    } catch(error) {
      if (UNKNOWN_SPIN_RESULT_CODES.has(error.code) || error.code === "RECOVERY_REQUIRED") {
        stateRecoveryService.markRoundRecoveryRequired(error, {operationType:"COLLECT"},context);
        liveSpinStateRef.current = {...liveSpinStateRef.current, roundRecoveryBlocked:true};
        onRecoveryRequired?.(error);
        postEvent("RECOVERY_REQUIRED", {requestId, message:"Payment result is unknown; blind retry is disabled."});
      }
      if (backendManagedWallet) await refreshBalance({ duringOperation: true }).catch(() => null);
      reportOperationError(error, "Unable to collect the win");
      setStatus("ready");
      liveSpinStateRef.current = {...liveSpinStateRef.current,status:"ready"};
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

        // Free Spin winnings are credited by the Spin response itself. Calling
        // Collect here would incorrectly finish the whole active Free Spin round.
        if (getTicketWinAmount(result) > 0 && result.creditedToBalance !== true) {
          if (!(await collectWin())) return;
        }
      }
      completed = liveSpinStateRef.current.freeSpinsLeft <= 0;
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

    if (getAwardedFreeSpinCount(result) > 0) {
      // The award pauses autoplay for the prompt, but its cash win still needs Pay.
      const pending = liveSpinStateRef.current.spinResult;
      if (pending && !pending.creditedToBalance && getTicketWinAmount(pending) > 0) {
        await collectWin();
      }
      return;
    }

    // Drain every awarded Free Spin before another paid request. The loop
    // reads the live counter, so new awards extend the same free-spin run.
    if (liveSpinStateRef.current.freeSpinsLeft > 0) {
      await startFreeSpinRun();
      return;
    }

    await wait(
      getNextSpinDelayMs(result, {
        visualMode: liveSpinStateRef.current.visualMode,
      }),
    );
    if (!autoPlayOnRef.current) return;
    await collectWin();
  };

  return {
    refreshBalance,
    collectWin,
    handleSpin,
    onAutoPlay,
    startFreeSpinRun,
  };
};



