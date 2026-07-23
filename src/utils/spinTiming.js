import { VIEW2_SYMBOL_GROUP_CYCLE_MS } from "../components/view2Symbols/index.jsx";
import {
  NEXT_SPIN_DELAY_MS,
  WIN_LINE_HIGHLIGHT_MS,
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
  if (winningGroupCount <= 0) return NEXT_SPIN_DELAY_MS;
  if (visualMode) return winningGroupCount * VIEW2_SYMBOL_GROUP_CYCLE_MS;
  return winningGroupCount * WIN_LINE_HIGHLIGHT_MS + NEXT_SPIN_DELAY_MS;
};
