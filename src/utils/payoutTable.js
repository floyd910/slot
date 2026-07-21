export const BASE_PAYOUT_STAKE = 1;
export const BASE_ZERO_PAYOUT_COMBINATION = 9;
export const PAYOUT_COLUMNS = ["x1", "x2", "x3", "x4", "x5"];

export const PAYOUT_ROWS = [
  { symbol: 0, values: [18, 45, 180, 4500] },
  { symbol: 1, values: [2, 5, 25, 100] },
  { symbol: 2, values: [null, 5, 25, 100] },
  { symbol: 3, values: [null, 5, 25, 100] },
  { symbol: 4, values: [null, 5, 25, 100] },
  { symbol: 5, values: [null, 10, 50, 125] },
  { symbol: 6, values: [null, 10, 50, 125] },
  { symbol: 7, values: [null, 15, 75, 250] },
  { symbol: 8, values: [null, 15, 75, 250] },
  { symbol: 9, values: [null, 20, 100, 400] },
  { symbol: 10, values: [2, 25, 125, 750] },
  { symbol: 11, values: [2, 25, 125, 750] },
  { symbol: 12, values: [10, 250, 2500, 9000] },
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

export const getCombinationGroups = (
  selectedCombination,
  combinationNumber,
) => {
  if (
    Array.isArray(selectedCombination?.groups) &&
    selectedCombination.groups.length > 0
  ) {
    return selectedCombination.groups;
  }

  return FALLBACK_GROUPS[combinationNumber] ?? FALLBACK_GROUPS[1];
};

export const getPayoutMultiplier = (stake, selectedCombination, symbol) => {
  const betMultiplier =
    toPayoutNumber(stake, BASE_PAYOUT_STAKE) / BASE_PAYOUT_STAKE;
  if (Number(symbol) !== 0) return betMultiplier;
  return (
    betMultiplier *
    (getCombinationNumber(selectedCombination) / BASE_ZERO_PAYOUT_COMBINATION)
  );
};

export const formatPayoutValue = (baseValue, multiplier) => {
  if (baseValue == null) return "";
  return Number((baseValue * multiplier).toFixed(2)).toString();
};

export const formatPayoutStake = (stake) =>
  toPayoutNumber(stake, BASE_PAYOUT_STAKE).toFixed(2);

export const formatPayoutGroup = (group) => group.join("-");
