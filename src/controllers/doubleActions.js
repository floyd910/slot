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

const CHEST_SIDES = new Set(["left", "right"]);

const getChestPick = (side) => (CHEST_SIDES.has(side) ? side : "");

const withMoney = (value) => Number(Number(value ?? 0).toFixed(2));

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

  const creditPayout = (payout) => {
    if (payout <= 0) return;

    setPlayer((current) => {
      if (!current) return current;

      const nextPlayer = {
        ...current,
        balance: withMoney(Number(current.balance ?? 0) + payout),
      };
      syncLiveState({ player: nextPlayer });
      postEvent?.("UPDATE_BALANCE", { balance: nextPlayer.balance });
      return nextPlayer;
    });
  };

  const finishLostDouble = (idCard, revealKey) => {
    frameApi
      .pay({ idCard, requestId: buildRequestId("pay") })
      .catch(() => {});

    window.setTimeout(() => {
      if (liveSpinStateRef.current?.doublingState?.revealKey !== revealKey)
        return;

      clearCompletedTicket();
      setReadyStatus();
    }, DOUBLE_LOSS_RESET_MS);
  };

  const finishMaxDoubleWin = ({ idCard, payout, revealKey }) => {
    window.setTimeout(() => {
      if (liveSpinStateRef.current?.doublingState?.revealKey !== revealKey)
        return;

      frameApi
        .pay({ idCard, requestId: buildRequestId("pay") })
        .catch(() => {});
      creditPayout(payout);
      clearCompletedTicket();
      setReadyStatus();
      setLastKnownState("paid");
      emitSound("cashout");
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
    if (!spinResult?.idCard || doublingState.loading || status === "processing")
      return;

    const step = doublingState.step || 0;
    const currentAmount = getTicketWinAmount(spinResult, doublingState);
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
          sum: currentAmount,
          side,
          requestId: buildRequestId("double"),
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
      setLastKnownState(won ? "double-win" : "double-lose");
      emitSound(won ? "win" : "lose", { WinSum: nextAmount });

      if (!won) {
        finishLostDouble(spinResult.idCard, nextRevealKey);
        return;
      }

      if (nextStep >= DOUBLE_MAX_STEPS) {
        finishMaxDoubleWin({
          idCard: nextSpinResult.idCard,
          payout: nextAmount,
          revealKey: nextRevealKey,
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
    if (!spinResult?.idCard || doubleState.loading || status === "processing")
      return;

    try {
      emitSound("double");
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
          wasDouble: doubleState.step + 1,
          sum: getTicketWinAmount(spinResult, doublingState),
          side,
          requestId: buildRequestId("double"),
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
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
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
