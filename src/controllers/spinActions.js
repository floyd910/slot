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
import { getNextSpinDelayMs } from "../utils/spinTiming.js";
import { asNumber } from "../utils/number.js";

const FORCE_DEMO_SPINS = true;
const VALID_FRAME_LINE_COUNTS = new Set([1, 3, 5, 7, 9]);
const UNKNOWN_SPIN_RESULT_CODES = new Set([
  "TIMEOUT",
  "NETWORK_ERROR",
  "NETWORK_UNREACHABLE",
  "BACKEND_UNAVAILABLE",
]);

export const createSpinActions = ({
  autoPlayOnRef,
  emitLotteryRevealSounds,
  emitSound,
  freeSpinRunRef,
  liveSpinStateRef,
  playSpinFeedback,
  postEvent,
  reportOperationError,
  setAutoPlayOn,
  setDoubleState,
  setDoublingState,
  setError,
  setFreeSpinsLeft,
  setFreeSpinsTotal,
  setGrid,
  setGridAnimation,
  setGridRevealKey,
  setLastKnownState,
  setPlayer,
  setShowFreeSpinPrompt,
  setSpinHistory,
  setSpinResult,
  setStatus,
  showFreeSpinPrompt,
  t,
}) => {
  const handleSpin = async ({ freeSpinAuto = false } = {}) => {
    const {
      carpetCloseMs,
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
      isFreeSpin || freeSpinAuto || autoPlayOnRef.current;
    const effectiveDemo = FORCE_DEMO_SPINS;
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
    const spinStartBalance = Number(player?.balance ?? 0);
    let stakeDeducted = false;

    try {
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

      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };

      playSpinFeedback();
      if (!visualMode) setGridAnimation("spinning");
      setDoublingState(createEmptyDoublingState());
      setLastKnownState("spin-submitted");
      setError("");
      setSpinResult(null);
      stakeDeducted = !isFreeSpin;
      setPlayer((current) =>
        isFreeSpin
          ? current
          : {
              ...current,
              balance: Number((spinStartBalance - totalStake).toFixed(2)),
            },
      );
      const apiResult = await withTimeout(
        frameApi.spin({
          stake,
          totalStake,
          lines: selectedCombination.groups.length,
          isDemo: effectiveDemo,
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
        result.WinSum > 0 && (creditWinOnReveal || awardedFreeSpins > 0);
      if (visualMode) {
        setGrid(result.grid);
        setGridRevealKey((key) => key + 1);
        setGridAnimation("revealing");
        emitLotteryRevealSounds();
      } else {
        flushSync(() => {
          setGrid(result.grid);
          setGridRevealKey((key) => key + 1);
          setGridAnimation("revealing");
        });
        emitLotteryRevealSounds();
      }
      window.setTimeout(
        () => setGridAnimation("settled"),
        LOTTERY_REVEAL_SETTLE_MS,
      );
      const nextSpinResult = { ...result, creditedToBalance: shouldCreditWin };
      const nextDoublingState = isDigitWin
        ? createWinningDoublingState(ticketWinAmount)
        : createEmptyDoublingState();
      setSpinResult(nextSpinResult);
      setDoublingState(nextDoublingState);
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
        const nextFreeSpinsLeft = Math.max(
          0,
          freeSpinsLeft - 1 + awardedFreeSpins,
        );
        const nextFreeSpinsTotal = freeSpinsTotal + awardedFreeSpins;
        if (awardedFreeSpins > 0) setFreeSpinsTotal(nextFreeSpinsTotal);
        setFreeSpinsLeft(nextFreeSpinsLeft);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: nextFreeSpinsLeft,
          freeSpinsTotal: nextFreeSpinsTotal,
        };
      } else if (awardedFreeSpins > 0) {
        setFreeSpinsTotal(awardedFreeSpins);
        setFreeSpinsLeft(awardedFreeSpins);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: awardedFreeSpins,
          freeSpinsTotal: awardedFreeSpins,
        };
        autoPlayOnRef.current = false;
        setAutoPlayOn(false);
        shouldShowFreeSpinPrompt = true;
        if (visualMode) emitSound("freeTickets");
      }

      await wait(LOTTERY_REVEAL_SETTLE_MS);
      if (shouldCreditWin) {

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
      if (hasBackendWin) emitSound("win", result);
      if (visualMode && !hasBackendWin) emitSound("lose", result);
      if (shouldShowFreeSpinPrompt) setShowFreeSpinPrompt(true);
      postEvent("LOADED", { requestId, state: "spin-complete" });
      postEvent("UPDATE_BALANCE", {
        balance: Number(
          (
            spinStartBalance -
            (isFreeSpin ? 0 : totalStake) +
            (shouldCreditWin ? result.WinSum : 0)
          ).toFixed(2),
        ),
      });
      if (!hasBackendWin) {
        frameApi
          .pay({ idCard: result.idCard, requestId: buildRequestId("pay") })
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
        postEvent("RECOVERY_REQUIRED", {
          requestId,
          message: "Spin result is unknown; blind retry is disabled.",
        });
      } else if (stakeDeducted) {
        setPlayer((current) =>
          current
            ? {
                ...current,
                balance: Number((current.balance + totalStake).toFixed(2)),
              }
            : current,
        );
      }
      reportOperationError(spinError, t("spinUnknown"));
      return null;
    }
  };

  const collectWin = async () => {
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
    try {
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };
      setLastKnownState("pay-submitted");
      await withTimeout(
        frameApi.pay({ idCard: spinResult.idCard, requestId }),
        "Pay",
      ).catch(() => null);
      if (!alreadyCredited) {
        setPlayer((current) => {
          if (!current) return current;
          const nextPlayer = {
            ...current,
            balance: Number((Number(current.balance ?? 0) + payout).toFixed(2)),
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
      setLastKnownState("paid");
      emitSound("cashout");
      if (!alreadyCredited)
        postEvent("UPDATE_BALANCE", {
          balance: Number((Number(player?.balance ?? 0) + payout).toFixed(2)),
        });
      return true;
    } catch {
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      return false;
    }
  };

  const startFreeSpinRun = async () => {
    setShowFreeSpinPrompt(false);

    if (freeSpinRunRef.current || liveSpinStateRef.current.freeSpinsLeft <= 0)
      return;

    freeSpinRunRef.current = true;
    try {
      while (liveSpinStateRef.current.freeSpinsLeft > 0) {
        const result = await handleSpin({ freeSpinAuto: true });
        if (!result) break;
        if (liveSpinStateRef.current.freeSpinsLeft > 0) {
          await wait(
            getNextSpinDelayMs(result, {
              visualMode: liveSpinStateRef.current.visualMode,
            }),
          );
        }
      }
    } finally {
      freeSpinRunRef.current = false;
    }
  };

  const onAutoPlay = async () => {
    if (freeSpinRunRef.current || showFreeSpinPrompt) return;
    const result = await handleSpin();
    if (!result) return;
    await wait(
      getNextSpinDelayMs(result, {
        visualMode: liveSpinStateRef.current.visualMode,
      }),
    );
    if (!autoPlayOnRef.current) return;
    await collectWin();
  };

  return {
    collectWin,
    handleSpin,
    onAutoPlay,
    startFreeSpinRun,
  };
};



