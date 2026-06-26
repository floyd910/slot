import { flushSync } from "react-dom";
import { frameApi } from "../api/frameApi.js";
import {
  FREE_SPIN_AUTOPLAY_DELAY_MS,
  FREE_SPIN_COUNT,
  LOTTERY_REVEAL_SETTLE_MS,
  createDoubleState,
  createEmptyDoublingState,
  createWinningDoublingState,
} from "../config/gameSettings.js";
import { buildRequestId } from "../hooks/useFrameBridge.js";
import { wait, withTimeout } from "../utils/async.js";
import { isEnabled } from "../utils/featureFlags.js";

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
  const handleSpin = async ({ demo = false, freeSpinAuto = false } = {}) => {
    const {
      carpetCloseMs,
      context,
      doubleState,
      doublingState,
      freeSpinsLeft,
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
    const testMode = isEnabled(context.testMode ?? context.demoMode);
    const effectiveDemo = isFreeSpin ? false : demo || testMode;
    const totalStake = stake * selectedCombination.groups.length;
    if (
      !effectiveDemo &&
      !isFreeSpin &&
      Number(player?.balance ?? 0) < totalStake
    ) {
      setError(t("insufficientBalance"));
      setLastKnownState("insufficient-balance");
      setStatus("ready");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "ready",
      };
      return null;
    }
    const requestId = buildRequestId("spin");

    try {
      playSpinFeedback();
      setStatus("processing");
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        status: "processing",
      };
      if (!visualMode) setGridAnimation("spinning");
      setDoublingState(createEmptyDoublingState());
      setLastKnownState("spin-submitted");
      setError("");
      setSpinResult(null);
      setPlayer((current) =>
        effectiveDemo || isFreeSpin
          ? current
          : {
              ...current,
              balance: Number((current.balance - totalStake).toFixed(2)),
            },
      );
      const result = await withTimeout(
        frameApi.spin({
          stake,
          lines: selectedCombination.groups.length,
          isDemo: effectiveDemo,
          isFreeSpin,
          selectedCombination,
          requestId,
        }),
        "Spin",
      );
      if (visualMode) {
        setGridAnimation("spinning");
        emitSound("carpet");
        if (carpetCloseMs > 0) await wait(carpetCloseMs);
      }
      const hasBackendWin = result.hasBackendWin ?? result.WinSum > 0;
      const isDigitWin = result.WinSum > 0;
      const shouldCreditWin =
        !effectiveDemo && result.WinSum > 0 && !isDigitWin;
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
        ? createWinningDoublingState(result.WinSum)
        : createEmptyDoublingState();
      setSpinResult(nextSpinResult);
      setDoublingState(nextDoublingState);
      liveSpinStateRef.current = {
        ...liveSpinStateRef.current,
        spinResult: nextSpinResult,
        doublingState: nextDoublingState,
      };
      if (shouldCreditWin) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance + result.WinSum).toFixed(2)),
        }));
      }
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
        const nextFreeSpinsLeft = Math.max(0, freeSpinsLeft - 1);
        setFreeSpinsLeft(nextFreeSpinsLeft);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: nextFreeSpinsLeft,
        };
      } else if (result.FreeSpin) {
        setFreeSpinsTotal(FREE_SPIN_COUNT);
        setFreeSpinsLeft(FREE_SPIN_COUNT);
        liveSpinStateRef.current = {
          ...liveSpinStateRef.current,
          freeSpinsLeft: FREE_SPIN_COUNT,
        };
        autoPlayOnRef.current = false;
        setAutoPlayOn(false);
        shouldShowFreeSpinPrompt = true;
        if (visualMode) emitSound("freeTickets");
      }

      await wait(LOTTERY_REVEAL_SETTLE_MS);
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
            player.balance -
            (effectiveDemo || isFreeSpin ? 0 : totalStake) +
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
      if (!effectiveDemo && !isFreeSpin) {
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
    const { player, spinResult, status } = liveSpinStateRef.current;
    if (
      !spinResult?.idCard ||
      Number(spinResult.WinSum ?? 0) <= 0 ||
      status === "processing"
    )
      return false;
    const requestId = buildRequestId("pay");
    const payout = Number(spinResult.WinSum ?? 0);
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
        const result = await handleSpin({ demo: true, freeSpinAuto: true });
        if (!result) break;
        if (liveSpinStateRef.current.freeSpinsLeft > 0)
          await wait(FREE_SPIN_AUTOPLAY_DELAY_MS);
      }
    } finally {
      freeSpinRunRef.current = false;
    }
  };

  const onAutoPlay = async () => {
    if (freeSpinRunRef.current || showFreeSpinPrompt) return;
    const result = await handleSpin({ demo: true });
    if (!result) return;
    await wait(1000);
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
