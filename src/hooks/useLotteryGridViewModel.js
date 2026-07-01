import { useEffect, useMemo, useState } from "react";
import { VIEW2_SYMBOL_GROUP_CYCLE_MS } from "../components/view2Symbols/index.jsx";
import {
  buildLotteryGridViewModel,
  getGroupedWins,
} from "../viewModels/lotteryGridViewModel.js";

export function useLotteryGridViewModel({
  animationState,
  carpetCloseMs,
  carpetOpenMs,
  doublingState,
  grid,
  revealKey,
  scatterCells,
  visualMode,
  winningCells,
  winningGroups,
}) {
  const groupedWins = useMemo(
    () => getGroupedWins(winningGroups, winningCells),
    [winningGroups, winningCells],
  );
  const [activeWinGroup, setActiveWinGroup] = useState(0);

  useEffect(() => {
    setActiveWinGroup(0);
    if (groupedWins.length <= 1 || animationState !== "settled") return;

    const interval = window.setInterval(() => {
      setActiveWinGroup((index) => (index + 1) % groupedWins.length);
    }, VIEW2_SYMBOL_GROUP_CYCLE_MS);

    return () => window.clearInterval(interval);
  }, [animationState, groupedWins.length]);

  return useMemo(
    () =>
      buildLotteryGridViewModel({
        activeWinGroup,
        animationState,
        carpetCloseMs,
        carpetOpenMs,
        doublingState,
        grid,
        groupedWins,
        revealKey,
        scatterCells,
        visualMode,
        winningCells,
      }),
    [
      activeWinGroup,
      animationState,
      carpetCloseMs,
      carpetOpenMs,
      doublingState,
      grid,
      groupedWins,
      revealKey,
      scatterCells,
      visualMode,
      winningCells,
    ],
  );
}