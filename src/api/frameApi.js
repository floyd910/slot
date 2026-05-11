import { combinations, games, initialGrid, paytable, symbolMap } from "../data/mockData.js";

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = (value) => JSON.parse(JSON.stringify(value));

const randomCell = () => Math.floor(Math.random() * 13);

const buildGrid = () => ({
  A: Array.from({ length: 5 }, randomCell),
  B: Array.from({ length: 5 }, randomCell),
  C: Array.from({ length: 5 }, randomCell),
  D: ["X2", "", "X0", "", "X2"].sort(() => Math.random() - 0.5),
});

const countScatter = (grid) => ["A", "B", "C"].flatMap((row) => grid[row]).filter((value) => value === 0).length;

const findWinningCells = (grid, selectedCombination) => {
  const groups = selectedCombination?.groups ?? [];
  const wins = [];

  groups.forEach((group) => {
    const values = group.map((coord) => {
      const [row, column] = coord.split("");
      return grid[row][Number(column) - 1];
    });
    const regulars = values.filter((value) => value !== 12 && value !== 0);
    const target = regulars[0];
    const isWin = target !== undefined && values.every((value) => value === target || value === 12);
    if (isWin) wins.push(...group);
  });

  return Array.from(new Set(wins));
};

export const frameApi = {
  async initSession(params) {
    await delay();
    if (!params.token && !params.session) {
      throw new Error("Missing token or session parameter");
    }

    return {
      player: {
        id: params.playerId ?? "demo-player",
        name: "Demo Player",
        balance: 1250,
        currency: params.currency ?? "GEL",
      },
      partner: {
        idPartner: "1",
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

  async spin({ stake, lines, isDemo, isFreeSpin, selectedCombination }) {
    await delay(850);
    const grid = buildGrid();
    const scatterCount = countScatter(grid);
    const winningCells = findWinningCells(grid, selectedCombination);
    const baseLineWin = winningCells.length ? Number((stake * selectedCombination.groups.length * 2).toFixed(2)) : 0;
    const scatterWin = scatterCount >= 2 ? Number((stake * lines * scatterCount * 2).toFixed(2)) : 0;
    const freeSpinMultiplier = isFreeSpin ? 3 : 1;
    const winBeforeMultiplier = baseLineWin + scatterWin;
    const winSum = Number((winBeforeMultiplier * freeSpinMultiplier).toFixed(2));

    return {
      idCard: Math.floor(65000000 + Math.random() * 99999),
      WinSum: winSum,
      BaseWinSum: winBeforeMultiplier,
      FreeSpin: scatterCount >= 3 ? 1 : 0,
      Gold: scatterCount >= 2 ? scatterCount : 0,
      Line1: grid.A.join(","),
      Line2: grid.B.join(","),
      Line3: grid.C.join(","),
      LineWinKoff: Array.from({ length: 10 }, (_, index) => (winningCells.length > index ? 2 : 0)),
      grid,
      scatterCount,
      scatterCells: ["A", "B", "C"].flatMap((row) =>
        grid[row].map((value, index) => (value === 0 ? `${row}${index + 1}` : null)).filter(Boolean),
      ),
      winningCells,
      isDemo,
      isFreeSpin,
      multiplier: freeSpinMultiplier,
      symbols: symbolMap,
    };
  },

  async double({ idCard, wasDouble, sum }) {
    await delay(650);
    const won = Math.random() > 0.48;
    return {
      idCard,
      WinSum: won ? Number((sum * 2).toFixed(2)) : 0,
      WasDouble: wasDouble,
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
