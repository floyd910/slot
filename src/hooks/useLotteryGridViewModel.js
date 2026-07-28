import { useEffect, useMemo, useState } from "react";
import {
  VIEW1_WIN_LINE_HIGHLIGHT_MS,
  WIN_LINE_START_DELAY_MS,
} from "../config/gameSettings.js";
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
  const lineWinningGroups = useMemo(
    () => getGroupedWins(winningGroups, winningCells),
    [winningGroups, winningCells],
  );
  const hasQueuedScatterWin = Array.isArray(scatterCells) && scatterCells.length >= 2;
  const groupedWins = useMemo(
    () =>
      hasQueuedScatterWin
        ? [...lineWinningGroups, scatterCells]
        : lineWinningGroups,
    [hasQueuedScatterWin, lineWinningGroups, scatterCells],
  );
  const [activeWinGroup, setActiveWinGroup] = useState(null);
  const winningLineIds = useMemo(
    () =>
      winningGroups
        .filter((group) =>
          Array.isArray(group?.winningCells)
            ? group.winningCells.length > 0
            : Array.isArray(group) && group.length > 0,
        )
        .map((group, index) => group?.lineId ?? index + 1),
    [winningGroups],
  );
  const activeWinIsScatter =
    hasQueuedScatterWin && activeWinGroup === lineWinningGroups.length;
  const activeWinLineId =
    activeWinGroup == null || activeWinIsScatter
      ? null
      : (winningLineIds[activeWinGroup] ?? activeWinGroup + 1);
  const winningLinePaths = useMemo(
    () =>
      winningGroups
        .filter((group) =>
          Array.isArray(group?.winningCells)
            ? group.winningCells.length > 0
            : Array.isArray(group) && group.length > 0,
        )
        .map((group) =>
          Array.isArray(group?.group) && group.group.length > 0
            ? group.group
            : (group?.winningCells ?? group),
        ),
    [winningGroups],
  );
  const activeWinLinePath =
    activeWinGroup == null || activeWinIsScatter
      ? []
      : (winningLinePaths[activeWinGroup] ?? []);

  useEffect(() => {
    setActiveWinGroup(null);
    if (groupedWins.length === 0 || animationState !== "settled") return undefined;

    const cycleMs = VIEW1_WIN_LINE_HIGHLIGHT_MS;
    let cycleTimeoutId;
    const startTimeoutId = window.setTimeout(() => {
      setActiveWinGroup(0);

      if (autoSequence) {
        let nextIndex = 1;
        const scheduleNext = () => {
          cycleTimeoutId = window.setTimeout(() => {
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
        return;
      }

      if (groupedWins.length === 1) return;
      const scheduleNext = () => {
        cycleTimeoutId = window.setTimeout(() => {
          setActiveWinGroup((index) => ((index ?? 0) + 1) % groupedWins.length);
          scheduleNext();
        }, cycleMs);
      };
      scheduleNext();
    }, WIN_LINE_START_DELAY_MS);

    return () => {
      window.clearTimeout(startTimeoutId);
      window.clearTimeout(cycleTimeoutId);
    };
  }, [animationState, autoSequence, groupedWins.length, revealKey, visualMode]);

  return useMemo(
    () =>
      buildLotteryGridViewModel({
        activeWinGroup,
        activeWinLineId,
        activeWinLinePath,
        activeWinIsScatter,
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
      activeWinLineId,
      activeWinLinePath,
      activeWinIsScatter,
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