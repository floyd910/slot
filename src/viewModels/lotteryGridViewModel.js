import { LOTTERY_REVEAL_STEP_MS } from "../config/gameSettings.js";
import { COMBO_BORDERS } from "../config/view2Assets.js";

const ROWS = ["A", "B", "C"];

export function getGroupedWins(winningGroups = [], winningCells = []) {
  const groups = winningGroups
    .map((group) =>
      Array.isArray(group?.winningCells) ? group.winningCells : group,
    )
    .filter((group) => Array.isArray(group) && group.length > 0);

  if (groups.length > 0) return groups;
  return winningCells.length > 0 ? [winningCells] : [];
}

export function hasGridMissing(grid) {
  return Boolean(
    !grid ||
      !grid.A?.length ||
      !grid.B?.length ||
      !grid.C?.length,
  );
}

export function buildTopCells(grid) {
  return ROWS.flatMap((row) =>
    grid[row].map((value, index) => ({
      value,
      coord: `${row}${index + 1}`,
    })),
  );
}

export function buildLotteryGridViewModel({
  activeWinGroup,
  animationState,
  carpetCloseMs,
  carpetOpenMs,
  doublingState,
  grid,
  groupedWins,
  revealKey,
  scatterCells = [],
  visualMode,
  winningCells = [],
}) {
  if (hasGridMissing(grid)) return { isGridMissing: true };

  const isRevealing = animationState === "revealing";
  const isSettled = animationState === "settled";
  const hideDigitsBeforeReveal = !isRevealing && !isSettled;
  const topCells = buildTopCells(grid);
  const activeWinningCells =
    isSettled && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : winningCells;

  if (!visualMode) {
    const marked = new Set([...activeWinningCells, ...scatterCells]);
    const doublingMarks = doublingState?.marks ?? [];
    const hasDoublingMarks =
      animationState !== "spinning" &&
      (doublingMarks.some(Boolean) ||
        doublingState?.active ||
        doublingState?.loading);
    const bottomValues = hasDoublingMarks ? doublingMarks : (grid.D ?? []);

    return {
      isGridMissing: false,
      mode: "view1",
      topCells: topCells.map((cell, index) => ({
        key: `${cell.coord}-${revealKey}`,
        digit: cell.value,
        idxNumber: index,
        idxString: getIndexLabel(index),
        highlighted: marked.has(cell.coord),
        eraser: isRevealing,
        concealed: hideDigitsBeforeReveal,
      })),
      bottomCells: bottomValues.map((value, index) => ({
        key: `D${index}-${hasDoublingMarks ? doublingState?.revealKey : revealKey}-${value}`,
        digit: value,
        idxNumber: hasDoublingMarks ? index : topCells.length + index,
        idxString: index === 0 ? "D" : "",
        size: "small",
        highlighted: hasDoublingMarks
          ? value === "x2" && index === (doublingState?.step ?? 0) - 1
          : value === "SCATTER",
        eraser: hasDoublingMarks
          ? doublingState?.changedIndex === index && Boolean(value)
          : isRevealing,
        concealed: !hasDoublingMarks && hideDigitsBeforeReveal,
      })),
    };
  }

  const view2WinningCells = new Set(winningCells);
  const activeComboBorderCells = new Set(
    isSettled && groupedWins.length > 0
      ? (groupedWins[activeWinGroup] ?? groupedWins[0])
      : [],
  );
  const showScatterOnly = scatterCells.length >= 2;
  const activeComboBorder =
    isSettled && (groupedWins.length > 0 || showScatterOnly)
      ? COMBO_BORDERS[activeWinGroup % COMBO_BORDERS.length]
      : null;
  const visibleComboBorderCells = new Set([
    ...activeComboBorderCells,
    ...(showScatterOnly ? scatterCells : []),
  ]);

  return {
    cover: {
      animationState,
      closeMs: carpetCloseMs,
      openMs: carpetOpenMs,
    },
    isGridMissing: false,
    mode: "view2",
    cells: topCells.map((cell) => ({
      key: `${cell.coord}-${revealKey}`,
      digit: cell.value,
      highlighted:
        isSettled &&
        (showScatterOnly
          ? scatterCells.includes(cell.coord)
          : view2WinningCells.has(cell.coord)),
      comboBorder:
        isSettled && visibleComboBorderCells.has(cell.coord)
          ? activeComboBorder
          : null,
      animationKey: `${revealKey}-${cell.coord}-${cell.value}`,
    })),
  };
}

export function getIndexLabel(index) {
  if (index === 0) return "A";
  if (index === 5) return "B";
  if (index === 10) return "C";
  return "";
}

export function getRevealDelayMs(index, size) {
  if (size === "small" && index < 5) return 0;
  return (index % 5) * LOTTERY_REVEAL_STEP_MS;
}

export function normalizeView2Digit(value) {
  if (value === "SCATTER") return 10;
  const digit = Number(value);
  return Number.isFinite(digit) && digit >= 0 && digit <= 12 ? digit : 0;
}