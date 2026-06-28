export const BASE_PAYOUT_STAKE = 0.1;
export const PAYOUT_COLUMNS = ["x", "x2", "x3", "x4", "x5"];

export const PAYOUT_ROWS = [
  { symbol: 0, values: [null, 0.2, 0.5, 2, 50] },
  { symbol: 1, values: [null, 0.2, 0.5, 2.5, 10] },
  { symbol: 2, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 3, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 4, values: [null, null, 0.5, 2.5, 10] },
  { symbol: 5, values: [null, null, 1, 5, 12.5] },
  { symbol: 6, values: [null, null, 1, 5, 12.5] },
  { symbol: 7, values: [null, null, 1.5, 7.5, 25] },
  { symbol: 8, values: [null, null, 1.5, 7.5, 25] },
  { symbol: 9, values: [null, null, 2, 10, 40] },
  { symbol: 10, values: [null, 0.2, 2.5, 12.5, 75] },
  { symbol: 11, values: [null, 0.2, 2.5, 12.5, 75] },
  { symbol: 12, values: [null, 1, 25, 250, 900] },
];

const FALLBACK_GROUPS = {
  1: [["B1", "B2", "B3", "B4", "B5"]],
  3: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
  ],
  5: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
  ],
  7: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
    ["B1", "A2", "A3", "A4", "B5"],
    ["B1", "C2", "C3", "C4", "B5"],
  ],
  9: [
    ["A1", "A2", "A3", "A4", "A5"],
    ["B1", "B2", "B3", "B4", "B5"],
    ["C1", "C2", "C3", "C4", "C5"],
    ["A1", "B2", "C3", "B4", "A5"],
    ["C1", "B2", "A3", "B4", "C5"],
    ["B1", "A2", "A3", "A4", "B5"],
    ["B1", "C2", "C3", "C4", "B5"],
    ["A1", "A2", "B3", "C4", "C5"],
    ["C1", "C2", "B3", "A4", "A5"],
  ],
};

export const toPayoutNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const getCombinationNumber = (selectedCombination) => {
  const groupCount = selectedCombination?.groups?.length;
  if (Number.isFinite(groupCount) && groupCount > 0) return groupCount;

  const title = Number(selectedCombination?.title);
  if (Number.isFinite(title) && title > 0) return title;

  const id = Number(selectedCombination?.id);
  return Number.isFinite(id) && id > 0 ? id : 1;
};

export const getCombinationGroups = (selectedCombination, combinationNumber) => {
  if (Array.isArray(selectedCombination?.groups) && selectedCombination.groups.length > 0) {
    return selectedCombination.groups;
  }

  return FALLBACK_GROUPS[combinationNumber] ?? FALLBACK_GROUPS[1];
};

export const getPayoutMultiplier = (stake, selectedCombination) =>
  (toPayoutNumber(stake, BASE_PAYOUT_STAKE) / BASE_PAYOUT_STAKE) *
  getCombinationNumber(selectedCombination);

export const formatPayoutValue = (baseValue, multiplier) => {
  if (baseValue == null) return "";
  return (baseValue * multiplier).toFixed(2);
};

export const formatPayoutStake = (stake) =>
  toPayoutNumber(stake, BASE_PAYOUT_STAKE).toFixed(2);

export const formatPayoutGroup = (group) => group.join("-");
