import { combinations, games, initialGrid, paytable, symbolMap } from "../data/mockData.js";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));

const randomCell = () => Math.floor(Math.random() * 10);

const buildGrid = () => ({
  A: Array.from({ length: 5 }, randomCell),
  B: Array.from({ length: 5 }, randomCell),
  C: Array.from({ length: 5 }, randomCell),
  D: Array.from({ length: 5 }, () => ""),
});

const buildBonusRow = (scatterCount) => {
  const count = Math.min(5, Math.max(scatterCount, scatterCount >= 3 ? 3 : 0));
  const row = Array.from({ length: 5 }, () => "");
  const centerOrder = [2, 1, 3, 0, 4];
  centerOrder.slice(0, count).forEach((index) => {
    row[index] = "SCATTER";
  });
  return row;
};

const getPayout = (symbol, count) => {
  const row = paytable.find((item) => item.symbol === symbol);
  return row?.[`x${count}`] ?? 0;
};

const evaluateLines = (grid, selectedCombination) => {
  const groups = selectedCombination?.groups ?? [];
  const winningCells = [];
  const lineWins = [];

  groups.forEach((group) => {
    const values = group.map((coord) => {
      const [row, column] = coord.split("");
      return grid[row][Number(column) - 1];
    });
    const candidates = [...new Set(values.filter((value) => value >= 0 && value <= 9))];
    const best = candidates.reduce(
      (current, symbol) => {
        const count = values.filter((value) => value === symbol || value === 12).length;
        const multiplier = getPayout(symbol, count);
        const score = multiplier * count;
        return multiplier > 0 && score > current.score ? { symbol, count, multiplier, score } : current;
      },
      { symbol: null, count: 0, multiplier: 0, score: 0 },
    );

    if (best.multiplier > 0) {
      lineWins.push({ group, ...best });
      group.forEach((coord, index) => {
        if (values[index] === best.symbol || values[index] === 12) winningCells.push(coord);
      });
    }
  });

  return {
    winningCells: Array.from(new Set(winningCells)),
    lineWins,
  };
};

export const frameApi = {
  async initSession(params) {
    await delay();
    if (params.maintenance) {
      const error = new Error("Maintenance mode");
      error.code = "MAINTENANCE";
      throw error;
    }
    if (!params.token) {
      const error = new Error("Missing token parameter");
      error.code = "ACCESS_DENIED";
      throw error;
    }
    if (!params.sessionId) {
      const error = new Error("Missing sessionId parameter");
      error.code = "INVALID_SESSION";
      throw error;
    }
    if (!params.gameId) {
      const error = new Error("Missing gameId parameter");
      error.code = "CONFIGURATION_ERROR";
      throw error;
    }

    return {
      player: {
        id: params.userId ?? "demo-player",
        name: "Demo Player",
        balance: 1250,
        currency: params.currency ?? "GEL",
      },
      partner: {
        idPartner: params.partnerId ?? "1",
        idKassi: "70",
        idValute: "4",
      },
      games: clone(games),
      combinations: clone(combinations),
      grid: clone(initialGrid),
    };
  },

  async getGames() {
    await delay(260);
    return clone(games);
  },

  async getPaytable() {
    await delay(260);
    return clone(paytable);
  },

  async spin({ stake, lines, isDemo, isFreeSpin, selectedCombination, requestId }) {
    await delay(850);
    const grid = buildGrid();
    const { winningCells, lineWins } = evaluateLines(grid, selectedCombination);
    const baseLineWin = Number(lineWins.reduce((sum, line) => sum + stake * line.multiplier, 0).toFixed(2));
    const scatterCount = lineWins.filter((line) => line.symbol === 0).reduce((sum, line) => Math.max(sum, line.count), 0);
    const freeSpinMultiplier = isFreeSpin ? 3 : 1;
    const winBeforeMultiplier = baseLineWin;
    const winSum = Number((winBeforeMultiplier * freeSpinMultiplier).toFixed(2));

    const bonusRow = buildBonusRow(scatterCount);

    return {
      idCard: Math.floor(65000000 + Math.random() * 99999),
      requestId,
      WinSum: winSum,
      BaseWinSum: winBeforeMultiplier,
      FreeSpin: scatterCount >= 3 || lineWins.some((line) => line.symbol === 0 && line.count >= 3) ? 1 : 0,
      Gold: scatterCount >= 2 ? scatterCount : 0,
      Line1: grid.A.join(","),
      Line2: grid.B.join(","),
      Line3: grid.C.join(","),
      LineWinKoff: Array.from({ length: 10 }, (_, index) => lineWins[index]?.multiplier ?? 0),
      grid: { ...grid, D: bonusRow },
      scatterCount,
      scatterCells: ["A", "B", "C"].flatMap((row) =>
        grid[row].map((value, index) => (value === 0 ? `${row}${index + 1}` : null)).filter(Boolean),
      ),
      winningCells,
      lineWins,
      isDemo,
      isFreeSpin,
      multiplier: freeSpinMultiplier,
      symbols: symbolMap,
    };
  },

  async double({ idCard, wasDouble, sum, side }) {
    await delay(650);
    const won = Math.random() > 0.48;
    return {
      idCard,
      WinSum: won ? Number((sum * 2).toFixed(2)) : 0,
      WasDouble: wasDouble,
      side,
      status: won ? "win" : "lose",
    };
  },

  async pay({ idCard }) {
    await delay(300);
    return {
      idCard,
      PayDate: new Date().toISOString(),
    };
  },
};
