import { symbolMap } from "../data/mockData.js";
import { getScatterCells } from "../gameLogic/coordinateLottery.js";
import { asNumber } from "../utils/number.js";
import { findNode, readAttributes } from "./soapClient.js";

const DEFAULT_BALANCE = 10000;

export const initialBalance = (value) => {
  const balance = asNumber(value, DEFAULT_BALANCE);
  return balance > 0 ? balance : DEFAULT_BALANCE;
};

const parseLine = (value) => {
  if (value == null || value === "") return [];
  const text = String(value).trim();
  const parts = text.includes(",") ? text.split(",") : text.split("");
  return parts.slice(0, 5).map((item) => {
    const clean = String(item).trim();
    return clean === "" ? "" : asNumber(clean, clean);
  });
};

const readLineValues = (document, gameAttrs, lineName) => {
  if (gameAttrs[lineName]) return parseLine(gameAttrs[lineName]);
  const lineAttrs = readAttributes(document, lineName);
  return Array.from({ length: 5 }, (_, index) =>
    asNumber(lineAttrs[`Slot${index + 1}`], ""),
  );
};

const readKoffValues = (document, gameAttrs) =>
  Array.from({ length: 10 }, (_, index) => {
    const lineAttrs = readAttributes(document, `LineWinKoff${index + 1}`);
    return asNumber(
      lineAttrs.Koff ??
        gameAttrs[`LineWinKoff${index + 1}`] ??
        gameAttrs.LineWinKoff?.split?.(",")?.[index],
    );
  });

// The SOAP payload identifies a winning path only by its one-based
// LineWinKoff index. The provider has not supplied coordinates for line 10,
// so that line is deliberately left unhighlighted instead of guessed.
const BACKEND_LINE_COORDINATES = [
  ["B1", "B2", "B3", "B4", "B5"],
  ["A1", "A2", "A3", "A4", "A5"],
  ["C1", "C2", "C3", "C4", "C5"],
  ["A1", "B2", "C3", "B4", "A5"],
  ["C1", "B2", "A3", "B4", "C5"],
  ["B1", "A2", "A3", "A4", "B5"],
  ["B1", "C2", "C3", "C4", "B5"],
  ["A1", "A2", "B3", "C4", "C5"],
  ["C1", "C2", "B3", "A4", "A5"],
  [],
];

const getCoordinateValue = (grid, coordinate) => {
  const row = coordinate?.[0];
  const column = Number(coordinate?.slice(1)) - 1;
  return asNumber(grid?.[row]?.[column], null);
};

const getWinningSymbolsForBackendLine = (grid, coordinates) => {
  const cells = coordinates.map((coordinate) => ({
    coordinate,
    value: getCoordinateValue(grid, coordinate),
  }));
  const targetSymbol = cells.find(
    (cell) => cell.value > 0 && cell.value !== 12,
  )?.value;

  if (targetSymbol == null) {
    const wildOnlyCells = cells
      .filter((cell) => cell.value === 12)
      .map((cell) => cell.coordinate);
    return wildOnlyCells.length >= 2 ? wildOnlyCells : [];
  }

  const winningCells = [];
  for (const cell of cells) {
    if (cell.value !== targetSymbol && cell.value !== 12) break;
    winningCells.push(cell.coordinate);
  }

  return winningCells.length >= 2 ? winningCells : [];
};

const getSelectedLineCount = (params) => {
  const explicitLines = asNumber(params?.lines, 0);
  if (explicitLines > 0) return explicitLines;

  const selectedLines = params?.selectedCombination?.groups?.length;
  return Number.isFinite(selectedLines) && selectedLines > 0 ? selectedLines : 1;
};

const toMoney = (value) => Number(asNumber(value, 0).toFixed(2));

const getBackendLineWinAmount = (coefficient, params) =>
  toMoney(asNumber(params?.stake, 0) * coefficient * getSelectedLineCount(params));

const getLineWinSymbol = (grid, winningCells) => {
  const symbol = winningCells
    .map((coordinate) => getCoordinateValue(grid, coordinate))
    .find((value) => value > 0 && value !== 12);
  return symbol ?? null;
};

const mapBackendLineWins = (koffs, grid, params) =>
  koffs.flatMap((value, index) => {
    const coefficient = asNumber(value, 0);
    if (coefficient <= 0) return [];

    const lineId = index + 1;
    const lineCoordinates = BACKEND_LINE_COORDINATES[index] ?? [];
    const winningCells = getWinningSymbolsForBackendLine(grid, lineCoordinates);
    const baseWin = getBackendLineWinAmount(coefficient, params);

    return [
      {
        lineId,
        groupIndex: index,
        group: lineCoordinates,
        symbol: getLineWinSymbol(grid, winningCells),
        count: winningCells.length,
        backendValue: coefficient,
        coefficient,
        multiplier: coefficient,
        groupCount: getSelectedLineCount(params),
        baseWin,
        score: baseWin,
        totalWin: baseWin,
        winningCells,
      },
    ];
  });

const getLineWinTotal = (lineWins) =>
  Number(
    lineWins
      .reduce((sum, lineWin) => sum + asNumber(lineWin.totalWin), 0)
      .toFixed(2),
  );

export const buildBonusRow = (gold) => {
  const count = Math.min(5, Math.max(asNumber(gold), asNumber(gold) > 0 ? 2 : 0));
  const row = Array.from({ length: 5 }, () => "");
  const centerOrder = [2, 1, 3, 0, 4];
  centerOrder.slice(0, count).forEach((index) => {
    row[index] = "SCATTER";
  });
  return row;
};

const readPrizeValue = (attrs) =>
  asNumber(attrs.PrizeValue ?? attrs.Prize ?? attrs.Wild ?? attrs.GoldValue, 12);

const isLotteryCell = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 12;
};

const normalizeLotteryCell = (value) => Math.trunc(Number(value));

const assertBackendRow = (row, lineName) => {
  if (!Array.isArray(row) || row.length !== 5 || row.some((value) => !isLotteryCell(value))) {
    const error = new Error(`Backend spin response is missing valid ${lineName} values`);
    error.code = "BACKEND_RESPONSE_ERROR";
    throw error;
  }
  return row.map(normalizeLotteryCell);
};

const normalizeBackendGrid = (grid) => ({
  A: assertBackendRow(grid.A, "Line1"),
  B: assertBackendRow(grid.B, "Line2"),
  C: assertBackendRow(grid.C, "Line3"),
  D: Array.isArray(grid.D)
    ? grid.D.slice(0, 5)
    : Array.from({ length: 5 }, () => ""),
});

export const mapSpinPayload = (document, params) => {
  const gameResultNode = findNode(document, "GameResult");
  if (!gameResultNode) {
    const errorText =
      document.documentElement?.textContent?.trim() ||
      "Backend spin response did not include GameResult";
    const error = new Error(errorText);
    error.code = "BACKEND_RESPONSE_ERROR";
    throw error;
  }
  const attrs = readAttributes(document, "GameResult");
  const grid = normalizeBackendGrid({
    A: readLineValues(document, attrs, "Line1"),
    B: readLineValues(document, attrs, "Line2"),
    C: readLineValues(document, attrs, "Line3"),
    D: buildBonusRow(attrs.Gold),
  });
  const backendKoffs = readKoffValues(document, attrs);
  const backendLineWins = mapBackendLineWins(backendKoffs, grid, params);
  const calculatedLineWinSum = getLineWinTotal(backendLineWins);
  const rawBackendWinSum = asNumber(attrs.WinSum, calculatedLineWinSum);
  const backendWinSum = rawBackendWinSum > 0 ? rawBackendWinSum : calculatedLineWinSum;
  const freeSpin = asNumber(attrs.FreeSpin);
  const gold = asNumber(attrs.Gold);
  const scatterCells = freeSpin > 0 ? getScatterCells(grid) : [];
  const scatterCount = scatterCells.length;
  const winningCells = [
    ...new Set(backendLineWins.flatMap((line) => line.winningCells)),
  ];

  return {
    idCard: attrs.idCard ?? attrs.IdCard ?? attrs.IDCard,
    requestId: params.requestId,
    WinSum: backendWinSum,
    BaseWinSum: backendWinSum,
    BackendWinSum: rawBackendWinSum,
    CalculatedLineWinSum: calculatedLineWinSum,
    hasBackendWin:
      backendWinSum > 0 || backendLineWins.length > 0 || freeSpin > 0,
    FreeSpin: freeSpin,
    Gold: gold,
    Line1: grid.A.join(","),
    Line2: grid.B.join(","),
    Line3: grid.C.join(","),
    LineWinKoff: backendKoffs,
    BackendLineWinKoff: backendKoffs,
    grid,
    scatterCount,
    scatterCells,
    scatterWin: null,
    winningCells,
    lineWins: backendLineWins,
    isDemo: params.isDemo,
    isFreeSpin: params.isFreeSpin,
    multiplier: asNumber(attrs.Multiplier ?? attrs.WinMultiplier, 1),
    prizeValue: readPrizeValue(attrs),
    symbols: symbolMap,
  };
};
