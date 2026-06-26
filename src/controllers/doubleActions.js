import { frameApi } from "../api/frameApi.js";
import { createEmptyDoublingState } from "../config/gameSettings.js";
import { buildRequestId } from "../hooks/useFrameBridge.js";
import { withTimeout } from "../utils/async.js";

export const createDoubleActions = ({
  doubleState,
  doublingState,
  emitSound,
  reportError,
  setDoubleState,
  setDoublingState,
  setGridAnimation,
  setLastKnownState,
  setPlayer,
  setSpinResult,
  setStatus,
  spinResult,
  status,
  t,
  visualMode,
}) => {
  const enterVisualDouble = () => {
    if (
      !visualMode ||
      !spinResult?.idCard ||
      Number(spinResult?.WinSum ?? 0) <= 0 ||
      doublingState.loading ||
      status === "processing"
    )
      return;

    setDoublingState((current) => ({
      ...createEmptyDoublingState(),
      ...current,
      active: true,
      entered: true,
      loading: false,
      currentAmount: Number(spinResult.WinSum),
      initialAmount: Number(spinResult.WinSum),
      lastPick: "",
      lastStatus: "",
    }));
    setLastKnownState("double");
  };

  const playFooterDouble = async (side = "x2") => {
    if (!spinResult?.idCard || doublingState.loading || status === "processing")
      return;
    const step = doublingState.step || 0;
    const currentAmount = Number(
      doublingState.currentAmount || spinResult.WinSum || 0,
    );
    if (step >= 5 || currentAmount <= 0) return;
    try {
      emitSound("double");
      if (step === 0 && spinResult.creditedToBalance) {
        setPlayer((current) => ({
          ...current,
          balance: Number((current.balance - spinResult.WinSum).toFixed(2)),
        }));
        setSpinResult((current) =>
          current ? { ...current, creditedToBalance: false } : current,
        );
      }
      setStatus("processing");
      setDoublingState((current) => ({
        ...createEmptyDoublingState(),
        ...current,
        active: true,
        entered: true,
        loading: true,
        currentAmount,
        changedIndex: step,
        lastPick: side === "left" || side === "right" ? side : "",
        lastStatus: "",
      }));
      // Temporary local double-mode outcome: each choice is an even 50/50 chance.
      const won = Math.random() < 0.5;
      const result = { WinSum: won ? Number((currentAmount * 2).toFixed(2)) : 0 };
      if (won) {
        setSpinResult((current) =>
          current
            ? { ...current, WinSum: result.WinSum, creditedToBalance: false }
            : current,
        );
      }
      setDoublingState((current) => {
        const marks = [...current.marks];
        marks[step] = won ? "x2" : "x0";
        return {
          ...current,
          active: won && step + 1 < 5 && result.WinSum > 0,
          loading: true,
          step: won ? step + 1 : step,
          marks,
          currentAmount: won ? result.WinSum : 0,
          revealKey: current.revealKey + 1,
          changedIndex: step,
          lastPick: side === "left" || side === "right" ? side : "",
          lastStatus: won ? "win" : "lose",
        };
      });
      setLastKnownState(won ? "double-win" : "double-lose");
      emitSound(won ? "win" : "lose", result);
      if (won) {
        window.setTimeout(() => {
          setDoublingState((current) =>
            current.lastStatus === "win"
              ? { ...current, loading: false, lastPick: "", lastStatus: "" }
              : current,
          );
          setStatus("ready");
        }, 1500);
      } else {
        setStatus("ready");
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
        window.setTimeout(() => {
          setSpinResult((current) =>
            current
              ? {
                  ...current,
                  WinSum: 0,
                  winningCells: [],
                  lineWins: [],
                  scatterCells: [],
                  creditedToBalance: false,
                }
              : current,
          );
          setGridAnimation("idle");
          setDoublingState(createEmptyDoublingState());
        }, 2700);
      }
    } catch (doubleError) {
      setDoublingState((current) => ({ ...current, loading: false }));
      reportError(doubleError, t("doubleUnknown"));
    }
  };

  const pickDouble = async (side) => {
    if (!spinResult?.idCard || doubleState.loading || status === "processing")
      return;
    try {
      emitSound("double");
      setStatus("processing");
      setDoubleState((current) => ({
        ...current,
        loading: true,
        status: `${t("opening")} ${t(side)}...`,
      }));
      const result = await withTimeout(
        frameApi.double({
          idCard: spinResult.idCard,
          wasDouble: doubleState.step,
          sum: spinResult.WinSum,
          side,
          requestId: buildRequestId("double"),
        }),
        "Double",
      );
      setSpinResult((current) => ({
        ...current,
        WinSum: result.WinSum,
        creditedToBalance: false,
      }));
      setDoubleState((current) => ({
        active: result.WinSum > 0,
        loading: false,
        step: current.step + 1,
        status:
          result.status === "win"
            ? `${t(result.side)} ${t("doubleWon")}`
            : `${t(result.side)} ${t("doubleLost")}`,
      }));
      setStatus("ready");
      setLastKnownState(result.status === "win" ? "double-win" : "double-lose");
      emitSound(result.status === "win" ? "win" : "lose");
      if (result.WinSum <= 0) {
        frameApi
          .pay({ idCard: spinResult.idCard, requestId: buildRequestId("pay") })
          .catch(() => {});
      }
    } catch (doubleError) {
      setDoubleState((current) => ({
        ...current,
        loading: false,
        status: t("retryDouble"),
      }));
      reportError(doubleError, t("doubleUnknown"));
    }
  };

  return {
    enterVisualDouble,
    pickDouble,
    playFooterDouble,
  };
};
