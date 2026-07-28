import {
  NEXT_SPIN_DELAY_MS,
  WIN_LINE_HIGHLIGHT_MS,
  WIN_LINE_START_DELAY_MS,
} from "../config/gameSettings.js";

const getWinningGroups = (result) => {
  const lineWins = Array.isArray(result?.lineWins) ? result.lineWins : [];
  const groups = lineWins
    .map((line) =>
      Array.isArray(line?.winningCells) ? line.winningCells : line,
    )
    .filter((group) => Array.isArray(group) && group.length > 0);

  if (groups.length > 0) return groups;
  return Array.isArray(result?.winningCells) && result.winningCells.length > 0
    ? [result.winningCells]
    : [];
};

const getGridCellValue = (grid, coordinate) => {
  const match = /^([ABC])(\d+)$/.exec(String(coordinate ?? ""));
  if (!match) return undefined;
  return grid?.[match[1]]?.[Number(match[2]) - 1];
};

const isZeroOnlyGroup = (result, group) =>
  group.length > 0 &&
  group.every(
    (coordinate) => Number(getGridCellValue(result?.grid, coordinate)) === 0,
  );

export const getNextSpinDelayMs = (result, { visualMode = false } = {}) => {
  const winningGroupCount = getWinningGroups(result).filter(
    (group) => !isZeroOnlyGroup(result, group),
  ).length;
  const scatterWinCount =
    Array.isArray(result?.scatterCells) && result.scatterCells.length >= 2 ? 1 : 0;
  const queuedWinCount = winningGroupCount + scatterWinCount;
  if (queuedWinCount <= 0) return NEXT_SPIN_DELAY_MS;
  return WIN_LINE_START_DELAY_MS + queuedWinCount * WIN_LINE_HIGHLIGHT_MS;
};
