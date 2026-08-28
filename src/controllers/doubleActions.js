import { frameApi } from "../api/frameApi.js";
import {
  DOUBLE_LOSS_RESET_MS,
  DOUBLE_MAX_STEPS,
  DOUBLE_RESULT_REVEAL_MS,
  createEmptyDoublingState,
} from "../config/gameSettings.js";
import { buildRequestId } from "../hooks/useFrameBridge.js";
import { withTimeout } from "../utils/async.js";
import { getTicketWinAmount } from "../utils/gameResult.js";
import { ROUND_OPERATION_STATUS, stateRecoveryService } from "../services/stateRecoveryService.js";
import { partnerApi } from "../services/partnerApi.js";

const CHEST_SIDES = new Set(["left", "right"]);

const getChestPick = (side) => (CHEST_SIDES.has(side) ? side : "");

const withMoney = (value) => Number(Number(value ?? 0).toFixed(2));

const getOriginalCardWin = (spinResult, doublingState) =>
  withMoney(
    spinResult?.BaseWinSum ||
      doublingState?.initialAmount ||
      spinResult?.WinSum ||
      0,
  );

export const createDoubleActions = ({
  emitSound,
  liveSpinStateRef,
  postEvent,
  reportError,
  setDoubleState,
  setDoublingState,
  setGridAnimation,
  setLastKnownState,
  setPlayer,
  setSpinResult,
  setStatus,
  t,
}) => {
  const syncLiveState = (patch) => {
    if (!liveSpinStateRef?.current) return;
    liveSpinStateRef.current = {
      ...liveSpinStateRef.current,
      ...patch,
    };
  };

  const setReadyStatus = () => {
    setStatus("ready");
    syncLiveState({ status: "ready" });
  };

  const clearCompletedTicket = () => {
    const nextDoublingState = createEmptyDoublingState();
    setSpinResult(null);
    setGridAnimation("idle");
    setDoublingState(nextDoublingState);
    syncLiveState({
      doublingState: nextDoublingState,
      spinResult: null,
    });
  };

  const creditPayout = (payout, authoritativeBalance = null) => {
    if (payout <= 0 && authoritativeBalance == null) return;

    setPlayer((current) => {
      if (!current) return current;

      const nextPlayer = {
        ...current,
        balance:
          authoritativeBalance == null
            ? withMoney(Number(current.balance ?? 0) + payout)
            : withMoney(authoritativeBalance),
      };
      syncLiveState({ player: nextPlayer });
      postEvent?.("UPDATE_BALANCE", { balance: nextPlayer.balance });
      return nextPlayer;
    });
  };

  const reportFinalResult = ({ idCard, winSum, doubleSteps }) => {
    postEvent?.("SPIN_RESULT", {
      idCard,
      WinSum: withMoney(winSum),
      Double: doubleSteps,
    });
  };

  const settlePartnerRound = async ({ spinResult, finalWin, doubleSteps }) => {
    if (!spinResult?.partnerRoundId || spinResult.partnerSettled) return null;

    return partnerApi.settleRound({
      requestId: buildRequestId("partner-settle"),
      partnerRoundId: spinResult.partnerRoundId,
      gameRoundId: spinResult.idCard,
      finalWin,
      doubleSteps,
    });
  };

  const finishLostDouble = (idCard, revealKey, doubleSteps) => {
    const currentSpinResult = liveSpinStateRef.current?.spinResult;
    settlePartnerRound({ spinResult: currentSpinResult, finalWin: 0, doubleSteps })
      .then((settlement) => {
        if (settlement?.balance != null) creditPayout(0, settlement.balance);
      })
      .catch(() => {});
    reportFinalResult({ idCard, winSum: 0, doubleSteps });
    frameApi
      .pay({ idCard, requestId: buildRequestId("pay") })
      .catch(() => {});

    window.setTimeout(() => {
      if (liveSpinStateRef.current?.doublingState?.revealKey !== revealKey)
        return;

      clearCompletedTicket();
      setReadyStatus();
      stateRecoveryService.completeRound(liveSpinStateRef.current.context);
    }, DOUBLE_LOSS_RESET_MS);
  };

  const finishMaxDoubleWin = ({ idCard, payout, revealKey, doubleSteps }) => {
    window.setTimeout(async () => {
      if (liveSpinStateRef.current?.doublingState?.revealKey !== revealKey)
        return;

      frameApi
        .pay({ idCard, requestId: buildRequestId("pay") })
        .catch(() => {});
      reportFinalResult({ idCard, winSum: payout, doubleSteps });
      const settlement = await settlePartnerRound({
        spinResult: liveSpinStateRef.current?.spinResult,
        finalWin: payout,
        doubleSteps,
      }).catch(() => null);
      creditPayout(payout, settlement?.balance);
      clearCompletedTicket();
      setReadyStatus();
      setLastKnownState("paid");
      emitSound("cashout");
      stateRecoveryService.completeRound(liveSpinStateRef.current.context);
    }, DOUBLE_RESULT_REVEAL_MS);
  };

  const enterVisualDouble = () => {
    const { doublingState, spinResult, status } = liveSpinStateRef.current;
    const currentAmount = getTicketWinAmount(spinResult, doublingState);

    if (
      currentAmount <= 0 ||
      doublingState.loading ||
      status === "processing"
    )
      return;

    const nextDoublingState = {
      ...createEmptyDoublingState(),
      ...doublingState,
      active: true,
      entered: true,
      loading: false,
      currentAmount,
      initialAmount: doublingState.initialAmount || currentAmount,
      lastPick: "",
      lastStatus: "",
    };

    setDoublingState(nextDoublingState);
    syncLiveState({ doublingState: nextDoublingState });
    setLastKnownState("double");
  };

  const enterDoubleScene = () => {
    const { doubleState, doublingState, spinResult, status, visualMode } =
      liveSpinStateRef.current;
    const currentAmount = getTicketWinAmount(spinResult, doublingState);

    if (
      !spinResult?.idCard ||
      currentAmount <= 0 ||
      doublingState.loading ||
      doubleState.loading ||
      status === "processing"
    )
      return;

    if (visualMode) {
      enterVisualDouble();
      return;
    }

    const nextDoubleState = {
      ...doubleState,
      active: true,
      loading: false,
      step: doubleState.step || 1,
      status: doubleState.status || "Choose left or right",
    };
    setDoubleState(nextDoubleState);
    syncLiveState({ doubleState: nextDoubleState });
  };
  const playFooterDouble = async (side = "x2") => {
    const { doublingState, spinResult, status } = liveSpinStateRef.current;
    if (!spinResult?.idCard || liveSpinStateRef.current.roundRecoveryBlocked || doublingState.loading || status === "processing")
      return;

    const step = doublingState.step || 0;
    const currentAmount = getTicketWinAmount(spinResult, doublingState);
    const originalCardWin = getOriginalCardWin(spinResult, doublingState);
    if (step >= DOUBLE_MAX_STEPS || currentAmount <= 0) return;

    try {
      const lastPick = getChestPick(side);
      const nextRevealKey = (doublingState.revealKey || 0) + 1;
      const loadingState = {
        ...createEmptyDoublingState(),
        ...doublingState,
        active: true,
        entered: true,
        loading: true,
        currentAmount,
        changedIndex: step,
        lastPick,
        lastStatus: "",
      };

      emitSound("double");
      if (step === 0 && spinResult.creditedToBalance) {
        setPlayer((current) => {
          if (!current) return current;

          const nextPlayer = {
            ...current,
            balance: withMoney(Number(current.balance ?? 0) - currentAmount),
          };
          syncLiveState({ player: nextPlayer });
          return nextPlayer;
        });
        setSpinResult((current) =>
          current ? { ...current, creditedToBalance: false } : current,
        );
      }

      const requestId = buildRequestId("double");
      stateRecoveryService.saveRound({ idCard: spinResult.idCard, roundId: spinResult.idCard, requestId, operationType: "DOUBLE", operationStatus: ROUND_OPERATION_STATUS.DOUBLE_PROCESSING, currentWinSum: currentAmount, WasDouble: step, doubleAvailable: false, spinResult, doublingState: loadingState }, liveSpinStateRef.current.context);
      setStatus("processing");
      setDoublingState(loadingState);
      syncLiveState({
        doublingState: loadingState,
        status: "processing",
      });

      const result = await withTimeout(
        frameApi.double({
          idCard: spinResult.idCard,
          wasDouble: step + 1,
          sum: originalCardWin,
          side,
          requestId,
        }),
        "Double",
      );
      const nextAmount = withMoney(result.WinSum);
      const won = nextAmount > 0;
      const nextStep = won ? step + 1 : step;
      const nextSpinResult = {
        ...spinResult,
        idCard: result.idCard ?? spinResult.idCard,
        WinSum: nextAmount,
        creditedToBalance: false,
      };

      setSpinResult(nextSpinResult);
      syncLiveState({ spinResult: nextSpinResult });

      const marks = [...loadingState.marks];
      marks[step] = won ? "x2" : "x0";
      const revealState = {
        ...loadingState,
        active: won && nextStep < DOUBLE_MAX_STEPS && nextAmount > 0,
        loading: true,
        step: nextStep,
        marks,
        currentAmount: nextAmount,
        revealKey: nextRevealKey,
        changedIndex: step,
        lastPick,
        lastStatus: won ? "win" : "lose",
      };

      setDoublingState(revealState);
      syncLiveState({ doublingState: revealState });
      if (won && nextStep < DOUBLE_MAX_STEPS) {
        stateRecoveryService.saveRound({ idCard: nextSpinResult.idCard, roundId: nextSpinResult.idCard, requestId, operationType: "DOUBLE", operationStatus: ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION, currentWinSum: nextAmount, WasDouble: nextStep, doubleAvailable: true, spinResult: nextSpinResult, doublingState: revealState }, liveSpinStateRef.current.context);
      }
      setLastKnownState(won ? "double-win" : "double-lose");
      emitSound(won ? "win" : "lose", { WinSum: nextAmount });

      if (!won) {
        finishLostDouble(spinResult.idCard, nextRevealKey, step + 1);
        return;
      }

      if (nextStep >= DOUBLE_MAX_STEPS) {
        finishMaxDoubleWin({
          idCard: nextSpinResult.idCard,
          payout: nextAmount,
          revealKey: nextRevealKey,
          doubleSteps: nextStep,
        });
        return;
      }

      window.setTimeout(() => {
        const currentDoublingState = liveSpinStateRef.current?.doublingState;
        if (
          currentDoublingState?.revealKey !== nextRevealKey ||
          currentDoublingState?.lastStatus !== "win"
        )
          return;

        const readyDoublingState = {
          ...currentDoublingState,
          active: true,
          entered: true,
          loading: false,
          lastPick: "",
          lastStatus: "",
        };

        setDoublingState(readyDoublingState);
        setReadyStatus();
        syncLiveState({ doublingState: readyDoublingState });
      }, DOUBLE_RESULT_REVEAL_MS);
    } catch (doubleError) {
      setDoublingState((current) => ({ ...current, loading: false }));
      setReadyStatus();
      reportError(doubleError, t("doubleUnknown"));
    }
  };

  const pickDouble = async (side) => {
    const { doubleState, doublingState, spinResult, status } =
      liveSpinStateRef.current;
    if (!spinResult?.idCard || liveSpinStateRef.current.roundRecoveryBlocked || doubleState.loading || status === "processing")
      return;

    try {
      emitSound("double");
      const requestId = buildRequestId("double");
      stateRecoveryService.saveRound({ idCard: spinResult.idCard, roundId: spinResult.idCard, requestId, operationType: "DOUBLE", operationStatus: ROUND_OPERATION_STATUS.DOUBLE_PROCESSING, currentWinSum: getTicketWinAmount(spinResult, doublingState), WasDouble: doubleState.step ?? 0, doubleAvailable: false, spinResult, doubleState }, liveSpinStateRef.current.context);
      setStatus("processing");
      const loadingDoubleState = {
        ...doubleState,
        loading: true,
        status: `${t("opening")} ${t(side)}...`,
      };
      setDoubleState(loadingDoubleState);
      syncLiveState({ doubleState: loadingDoubleState, status: "processing" });

      const result = await withTimeout(
        frameApi.double({
          idCard: spinResult.idCard,
          wasDouble: doubleState.step,
          sum: getOriginalCardWin(spinResult, doublingState),
          side,
          requestId,
        }),
        "Double",
      );
      const nextSpinResult = {
        ...spinResult,
        WinSum: result.WinSum,
        creditedToBalance: false,
      };
      const nextDoubleState = {
        active: result.WinSum > 0,
        loading: false,
        step: doubleState.step + 1,
        status:
          result.status === "win"
            ? `${t(result.side)} ${t("doubleWon")}`
            : `${t(result.side)} ${t("doubleLost")}`,
      };

      setSpinResult(nextSpinResult);
      setDoubleState(nextDoubleState);
      setReadyStatus();
      syncLiveState({
        doubleState: nextDoubleState,
        spinResult: nextSpinResult,
      });
      setLastKnownState(result.status === "win" ? "double-win" : "double-lose");
      emitSound(result.status === "win" ? "win" : "lose");
      if (result.WinSum <= 0) {
        const settlement = await settlePartnerRound({
          spinResult: nextSpinResult,
          finalWin: 0,
          doubleSteps: nextDoubleState.step,
        }).catch(() => null);
        if (settlement?.balance != null) creditPayout(0, settlement.balance);
        reportFinalResult({
          idCard: nextSpinResult.idCard,
          winSum: 0,
          doubleSteps: nextDoubleState.step,
        });
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
        stateRecoveryService.completeRound(liveSpinStateRef.current.context);
      } else {
        const balance = await partnerApi.getBalance().catch(() => null);
        if (balance?.balance != null) creditPayout(0, balance.balance);
      }
    } catch (doubleError) {
      const retryDoubleState = {
        ...liveSpinStateRef.current.doubleState,
        loading: false,
        status: t("retryDouble"),
      };
      setDoubleState(retryDoubleState);
      syncLiveState({ doubleState: retryDoubleState });
      reportError(doubleError, t("doubleUnknown"));
    }
  };

  return {
    enterDoubleScene,
    enterVisualDouble,
    pickDouble,
    playFooterDouble,
  };
};
