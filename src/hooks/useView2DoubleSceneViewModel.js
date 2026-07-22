import { useEffect, useMemo, useState } from "react";
import { buildView2DoubleSceneViewModel } from "../viewModels/view2DoubleSceneViewModel.js";

export function useView2DoubleSceneViewModel({
  amount,
  ladderAmount,
  lastPick,
  lastStatus,
  step,
}) {
  const [showOtherWinningChest, setShowOtherWinningChest] = useState(false);

  useEffect(() => {
    setShowOtherWinningChest(false);
    if (lastStatus !== "lose" || !lastPick) return undefined;

    const timer = window.setTimeout(() => setShowOtherWinningChest(true), 1000);
    return () => window.clearTimeout(timer);
  }, [lastPick, lastStatus]);

  return useMemo(
    () =>
      buildView2DoubleSceneViewModel({
        amount,
        ladderAmount,
        lastPick,
        lastStatus,
        showOtherWinningChest,
        step,
      }),
    [amount, ladderAmount, lastPick, lastStatus, showOtherWinningChest, step],
  );
}