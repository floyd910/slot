export const GAME_ID = "hiranmandi";

export const games = [
  {
    id: GAME_ID,
    name: "Hiranmandi Hushhol",
    subtitle: "Coordinate lottery",
    accent: "#f2c14e",
    status: "ready",
  },
  {
    id: "virtual-sport",
    name: "Virtual Sport",
    subtitle: "Iframe integration placeholder",
    accent: "#58d5c9",
    status: "coming",
  },
  {
    id: "keno",
    name: "Keno",
    subtitle: "Future game shell",
    accent: "#ff7a59",
    status: "coming",
  },
  {
    id: "double-bonus",
    name: "Double Bonus",
    subtitle: "Win doubling scene",
    accent: "#9bd66f",
    status: "ready",
  },
];

export const combinations = [
  { id: 1, title: "1", label: "B1-B2-B3-B4-B5", displayGroups: ["В1-В2-В3-В4-В5"], groups: [["B1", "B2", "B3", "B4", "B5"]] },
  {
    id: 3,
    title: "3",
    label: "A1-A5 / B1-B5 / C1-C5",
    displayGroups: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5"],
    groups: [
      ["A1", "A2", "A3", "A4", "A5"],
      ["B1", "B2", "B3", "B4", "B5"],
      ["C1", "C2", "C3", "C4", "C5"],
    ],
  },
  {
    id: 5,
    title: "5",
    label: "Horizontal and diagonal groups",
    displayGroups: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5", "А1-В2-С3-В4-А5", "С1-В2-А3-В4-С5"],
    groups: [
      ["A1", "A2", "A3", "A4", "A5"],
      ["B1", "B2", "B3", "B4", "B5"],
      ["C1", "C2", "C3", "C4", "C5"],
      ["A1", "B2", "C3", "B4", "A5"],
      ["C1", "B2", "A3", "B4", "C5"],
    ],
  },
  {
    id: 7,
    title: "7",
    label: "Expanded coordinate groups",
    displayGroups: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5", "А1-В2-С3-В4-А5", "С1-В2-А3-В4-С5", "В1-А2-А3-А4-В5", "В1-С2-С3-С4-В5"],
    groups: [
      ["A1", "A2", "A3", "A4", "A5"],
      ["B1", "B2", "B3", "B4", "B5"],
      ["C1", "C2", "C3", "C4", "C5"],
      ["A1", "B2", "C3", "B4", "A5"],
      ["C1", "B2", "A3", "B4", "C5"],
      ["A1", "B1", "C1", "B2", "A3"],
      ["A5", "B5", "C5", "B4", "A3"],
    ],
  },
  {
    id: 9,
    title: "9",
    label: "Full express coordinate set",
    displayGroups: ["А1-А2-А3-А4-А5", "В1-В2-В3-В4-В5", "С1-С2-С3-С4-С5", "А1-В2-С3-В4-А5", "С1-В2-А3-В4-С5", "В1-А2-А3-А4-В5", "В1-С2-С3-С4-В5", "А1-А2-В3-С4-С5", "С1-С2-В3-А4-А5"],
    groups: [
      ["A1", "A2", "A3", "A4", "A5"],
      ["B1", "B2", "B3", "B4", "B5"],
      ["C1", "C2", "C3", "C4", "C5"],
      ["A1", "B2", "C3", "B4", "A5"],
      ["C1", "B2", "A3", "B4", "C5"],
      ["A1", "B1", "C1", "B2", "A3"],
      ["A5", "B5", "C5", "B4", "A3"],
      ["A2", "B3", "C4", "B5", "C5"],
      ["C2", "B3", "A4", "B5", "A5"],
    ],
  },
];

export const stakeOptions = [0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 3, 5, 10, 15, 20, 25];

export const paytable = [
  { symbol: 0, x1: null, x2: null, x3: 0.2, x4: 1.5, x5: 5 },
  { symbol: 1, x1: null, x2: null, x3: 0.5, x4: 2, x5: 10 },
  { symbol: 2, x1: null, x2: null, x3: 0.5, x4: 2, x5: 10 },
  { symbol: 3, x1: null, x2: null, x3: 0.5, x4: 2, x5: 10 },
  { symbol: 4, x1: null, x2: null, x3: 1, x4: 4, x5: 20 },
  { symbol: 5, x1: null, x2: null, x3: 1, x4: 4, x5: 20 },
  { symbol: 6, x1: null, x2: 0.5, x3: 1.5, x4: 6.5, x5: 25 },
  { symbol: 7, x1: null, x2: 0.5, x3: 2.5, x4: 10, x5: 50 },
  { symbol: 8, x1: null, x2: 0.5, x3: 3, x4: 20, x5: 100 },
  { symbol: 9, x1: null, x2: 1, x3: 8, x4: 100, x5: 500 },
  { symbol: 10, x1: null, x2: 0.2, x3: 2.5, x4: 12.5, x5: 75 },
  { symbol: 11, x1: null, x2: 0.2, x3: 2.5, x4: 12.5, x5: 75 },
  { symbol: 12, x1: null, x2: 1, x3: 25, x4: 250, x5: 5000 },
];

export const symbolMap = {
  0: { label: "Bag", role: "scatter", color: "#f5b642" },
  1: { label: "Cup", role: "regular", color: "#7cd6ff" },
  2: { label: "Drum", role: "regular", color: "#c690ff" },
  3: { label: "Dice", role: "regular", color: "#ff8a7a" },
  4: { label: "Coin", role: "regular", color: "#ffe06c" },
  5: { label: "Crown", role: "regular", color: "#ffb36b" },
  6: { label: "Gem", role: "regular", color: "#6ee7b7" },
  7: { label: "Flute", role: "regular", color: "#9fb7ff" },
  8: { label: "Lamp", role: "regular", color: "#ff9fb7" },
  9: { label: "Scroll", role: "regular", color: "#c6f68d" },
  10: { label: "Key", role: "regular", color: "#9ee8e0" },
  11: { label: "Star", role: "regular", color: "#f4a3ff" },
  12: { label: "Wild", role: "wild", color: "#ffffff" },
};

export const initialGrid = {
  A: [4, 12, 4, 0, 4],
  B: [1, 0, 5, 8, 6],
  C: [2, 1, 1, 1, 6],
  D: ["", "", "SCATTER", "", ""],
};
