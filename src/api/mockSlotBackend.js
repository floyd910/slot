import {
  combinations,
  games,
  initialGrid,
  paytable,
  symbolMap,
} from "../data/mockData.js";
import {
  evaluateCoordinateLottery,
  getScatterCells,
} from "../gameLogic/coordinateLottery.js";
import { wait } from "../utils/async.js";
import { asNumber } from "../utils/number.js";
import { isEnabled } from "../utils/featureFlags.js";
import { buildBonusRow, initialBalance } from "./slotPayloadMappers.js";

const CURRENT_ROUND_MULTIPLIER = 3;
const MOCK_FREE_SPIN_AWARD_COUNT = 15;

export const clone = (value) => JSON.parse(JSON.stringify(value));

const randomCell = () => Math.floor(Math.random() * 13);

const buildGrid = () => ({
  A: Array.from({ length: 5 }, randomCell),
  B: Array.from({ length: 5 }, randomCell),
  C: Array.from({ length: 5 }, randomCell),
  D: Array.from({ length: 5 }, () => ""),
});

export const createSession = async (params) => {
  await wait(450);
  const testMode = isEnabled(params.testMode ?? params.demoMode);

  return {
    player: {
      id: params.userId ?? "demo-player",
      name: "Demo Player",
      balance: testMode
        ? initialBalance(params.testBalance)
        : initialBalance(params.balance),
      currency: params.currency ?? "GEL",
    },
    partner: {
      idPartner: params.idPartner ?? params.partnerId ?? "1",
      idKassi: params.idKassi ?? "70",
      idValute: params.idValute ?? "1",
    },
    games: clone(games),
    combinations: clone(combinations),
    grid: clone(initialGrid),
  };
};

export const getGames = async () => {
  await wait(260);
  return clone(games);
};

export const getPaytable = async () => {
  await wait(260);
  return clone(paytable);
};

export const spin = async ({
  stake,
  isDemo,
  isFreeSpin,
  selectedCombination,
  requestId,
}) => {
  await wait(850);
  const grid = buildGrid();
  const scatterCells = getScatterCells(grid);
  const scatterCount = scatterCells.length;
  const lotteryResult = evaluateCoordinateLottery({
    grid,
    selectedCombination,
    paytable,
    stake,
    roundMultiplier: isFreeSpin ? CURRENT_ROUND_MULTIPLIER : 1,
    prizeValue: 12,
  });
  const bonusRow = buildBonusRow(scatterCount);

  return {
    idCard: Math.floor(65000000 + Math.random() * 99999),
    requestId,
    WinSum: lotteryResult.WinSum,
    BaseWinSum: lotteryResult.BaseWinSum,
    FreeSpin: scatterCount >= 3 ? MOCK_FREE_SPIN_AWARD_COUNT : 0,
    Gold: scatterCount >= 2 ? scatterCount : 0,
    Line1: grid.A.join(","),
    Line2: grid.B.join(","),
    Line3: grid.C.join(","),
    LineWinKoff: lotteryResult.LineWinKoff,
    grid: { ...grid, D: bonusRow },
    scatterCount,
    scatterCells: scatterCount >= 2 ? scatterCells : [],
    scatterWin: lotteryResult.ScatterWin,
    winningCells: lotteryResult.winningCells,
    lineWins: lotteryResult.lineWins,
    isDemo,
    isFreeSpin,
    multiplier: lotteryResult.multiplier,
    prizeValue: lotteryResult.prizeValue,
    symbols: symbolMap,
  };
};

export const double = async ({ idCard, wasDouble, sum, side }) => {
  await wait(650);
  const won = Math.random() > 0.48;
  return {
    idCard,
    WinSum: won ? Number((asNumber(sum) * 2).toFixed(2)) : 0,
    WasDouble: wasDouble,
    side,
    status: won ? "win" : "lose",
  };
};

export const pay = async ({ idCard }) => {
  await wait(300);
  return {
    idCard,
    PayDate: new Date().toISOString(),
  };
};
