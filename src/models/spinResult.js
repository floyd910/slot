import { asNumber } from "../utils/number.js";

export const normalizeSpinResult = (result = {}) => {
  const winSum = asNumber(result.WinSum, 0);
  const baseWinSum = asNumber(result.BaseWinSum, winSum);

  return {
    ...result,
    idCard: result.idCard ?? result.IdCard ?? result.IDCard ?? null,
    Number: result.Number ?? result.number ?? null,
    requestId: result.requestId ?? null,
    roundId: result.roundId ?? result.idCard ?? null,
    WinSum: winSum,
    BaseWinSum: baseWinSum,
    BackendWinSum: asNumber(result.BackendWinSum, winSum),
    FreeSpin: asNumber(result.FreeSpin, 0),
    Gold: asNumber(result.Gold, 0),
    LineWinKoff: Array.isArray(result.LineWinKoff) ? result.LineWinKoff : [],
    grid: result.grid ?? { A: [], B: [], C: [], D: [] },
    scatterCells: result.scatterCells ?? [],
    winningCells: result.winningCells ?? [],
    lineWins: result.lineWins ?? [],
  };
};