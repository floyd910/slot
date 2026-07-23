import { useEffect, useMemo, useState } from "react";
import { buildView2DoubleSceneViewModel } from "../viewModels/view2DoubleSceneViewModel.js";

const OTHER_CHEST_REVEAL_DELAY_MS = 1000;

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

    const timer = window.setTimeout(
      () => setShowOtherWinningChest(true),
      OTHER_CHEST_REVEAL_DELAY_MS,
    );
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