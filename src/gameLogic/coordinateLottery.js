const BOARD_ROWS = ["A", "B", "C"];
const DEFAULT_PRIZE_VALUE = 12;
const ZERO_SYMBOL = 0;
const WILD_SYMBOL = 12;

const asNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getCellValue = (grid, coordinate) => {
  const row = coordinate?.[0];
  const column = Number(coordinate?.slice(1)) - 1;
  return grid?.[row]?.[column];
};

const getPayout = (paytable, symbol, count) => {
  const safeCount = Math.min(5, Math.max(1, Number(count) || 0));
  const row = paytable.find((item) => Number(item.symbol) === Number(symbol));
  return asNumber(row?.[`x${safeCount}`]);
};

const getSelectedGroupCount = (selectedCombination) => {
  const groupsLength = selectedCombination?.groups?.length;
  if (Number.isFinite(groupsLength) && groupsLength > 0) return groupsLength;

  const titleCount = Number(selectedCombination?.title ?? selectedCombination?.id);
  return Number.isFinite(titleCount) && titleCount > 0 ? titleCount : 1;
};

const getBoardCells = (grid) =>
  BOARD_ROWS.flatMap((row) =>
    (grid?.[row] ?? []).map((value, index) => ({
      coordinate: `${row}${index + 1}`,
      value: asNumber(value, value),
    })),
  );

const unique = (items) => Array.from(new Set(items));

function evaluateRegularGroup({ group, groupIndex, grid, paytable, stake, groupCount, prizeValue }) {
  const values = group.map((coordinate) => getCellValue(grid, coordinate));
  const wildValue = WILD_SYMBOL;
  const candidates = unique(
    values.filter((value) => {
      const numeric = Number(value);
      return numeric > ZERO_SYMBOL && numeric !== wildValue;
    }),
  );

  const best = candidates.reduce(
    (current, symbol) => {
      const count = values.filter(
        (value) =>
          Number(value) === Number(symbol) || Number(value) === wildValue,
      ).length;
      const coefficient = getPayout(paytable, symbol, count);
      const amount = Number((stake * coefficient * groupCount).toFixed(2));
      return coefficient > 0 && amount > current.amount
        ? { symbol, count, coefficient, amount }
        : current;
    },
    { symbol: null, count: 0, coefficient: 0, amount: 0 },
  );

  if (best.amount <= 0) return null;

  return {
    group,
    groupIndex,
    symbol: best.symbol,
    count: best.count,
    multiplier: best.coefficient,
    coefficient: best.coefficient,
    groupCount,
    baseWin: best.amount,
    score: best.amount,
    winningCells: group.filter((coordinate, index) => {
      const value = Number(values[index]);
      return value === Number(best.symbol) || value === wildValue;
    }),
  };
}

function evaluateScatterWin({ grid, paytable, stake, groupCount }) {
  const winningCells = getScatterCells(grid);
  const count = Math.min(5, winningCells.length);
  if (count < 2) return null;

  const coefficient = getPayout(paytable, ZERO_SYMBOL, count);
  const amount = Number((stake * coefficient * groupCount).toFixed(2));

  if (amount <= 0) return null;

  return {
    group: winningCells,
    groupIndex: -1,
    symbol: ZERO_SYMBOL,
    count,
    multiplier: coefficient,
    coefficient,
    groupCount,
    baseWin: amount,
    score: amount,
    winningCells,
    scatter: true,
  };
}

export function evaluateCoordinateLottery({
  grid,
  selectedCombination,
  paytable,
  stake,
  roundMultiplier = 1,
  prizeValue = DEFAULT_PRIZE_VALUE,
}) {
  const groups = selectedCombination?.groups ?? [];
  const groupCount = getSelectedGroupCount(selectedCombination);
  const normalizedStake = asNumber(stake);
  const normalizedRoundMultiplier = asNumber(roundMultiplier, 1) || 1;

  const lineWins = groups
    .map((group, groupIndex) =>
      evaluateRegularGroup({
        group,
        groupIndex,
        grid,
        paytable,
        stake: normalizedStake,
        groupCount,
        prizeValue,
      }),
    )
    .filter(Boolean);
  const scatterWin = evaluateScatterWin({
    grid,
    paytable,
    stake: normalizedStake,
    groupCount,
  });
  const allWins = scatterWin ? [...lineWins, scatterWin] : lineWins;
  const baseWinSum = Number(allWins.reduce((sum, line) => sum + line.baseWin, 0).toFixed(2));
  const winSum = Number((baseWinSum * normalizedRoundMultiplier).toFixed(2));
  const winningCells = unique(allWins.flatMap((line) => line.winningCells));

  return {
    WinSum: winSum,
    BaseWinSum: baseWinSum,
    ScatterWin: scatterWin,
    ScatterCount: getScatterCells(grid).length,
    LineWinKoff: Array.from({ length: 10 }, (_, index) => lineWins.find((line) => line.groupIndex === index)?.coefficient ?? 0),
    lineWins: allWins.map((line) => ({
      ...line,
      roundMultiplier: normalizedRoundMultiplier,
      totalWin: Number((line.baseWin * normalizedRoundMultiplier).toFixed(2)),
    })),
    winningCells,
    prizeValue: asNumber(prizeValue, DEFAULT_PRIZE_VALUE),
    multiplier: normalizedRoundMultiplier,
  };
}

export function getScatterCells(grid) {
  return getBoardCells(grid)
    .filter((cell) => Number(cell.value) === ZERO_SYMBOL)
    .map((cell) => cell.coordinate);
}
