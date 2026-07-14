import { useEffect, useMemo, useState } from "react";
import { VIEW2_SYMBOL_GROUP_CYCLE_MS } from "../components/view2Symbols/index.jsx";
import { VIEW1_WIN_LINE_HIGHLIGHT_MS } from "../config/gameSettings.js";
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
  autoSequence = false,
  winningCells,
  winningGroups,
}) {
  const groupedWins = useMemo(
    () => getGroupedWins(winningGroups, winningCells),
    [winningGroups, winningCells],
  );
  const [activeWinGroup, setActiveWinGroup] = useState(null);

  useEffect(() => {
    setActiveWinGroup(visualMode ? 0 : null);
    if (groupedWins.length === 0 || animationState !== "settled") return;

    setActiveWinGroup(0);
    const cycleMs = visualMode
      ? VIEW2_SYMBOL_GROUP_CYCLE_MS
      : VIEW1_WIN_LINE_HIGHLIGHT_MS;
    let timeoutId;

    if (visualMode && autoSequence) {
      let nextIndex = 1;
      const scheduleNext = () => {
        timeoutId = window.setTimeout(() => {
          if (nextIndex >= groupedWins.length) {
            setActiveWinGroup(null);
            return;
          }

          setActiveWinGroup(nextIndex);
          nextIndex += 1;
          scheduleNext();
        }, cycleMs);
      };

      scheduleNext();
      return () => window.clearTimeout(timeoutId);
    }

    if (groupedWins.length === 1) return;

    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        setActiveWinGroup((index) => ((index ?? 0) + 1) % groupedWins.length);
        scheduleNext();
      }, cycleMs);
    };

    scheduleNext();
    return () => window.clearTimeout(timeoutId);
  }, [animationState, autoSequence, groupedWins.length, revealKey, visualMode]);

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
        autoSequence,
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
      autoSequence,
      winningCells,
    ],
  );
}