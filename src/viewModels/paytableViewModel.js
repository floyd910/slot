import {
  PAYOUT_COLUMNS,
  PAYOUT_ROWS,
  formatPayoutGroup,
  formatPayoutStake,
  formatPayoutValue,
  getCombinationGroups,
  getCombinationNumber,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";

export function buildStandardPaytableViewModel({ stake, selectedCombination }) {
  const combinationNumber = getCombinationNumber(selectedCombination);
  const combinationGroups = getCombinationGroups(
    selectedCombination,
    combinationNumber,
  );
  const payoutMultiplier = getPayoutMultiplier(stake, selectedCombination);

  return {
    columns: PAYOUT_COLUMNS.slice(1, 5),
    combinationNumber,
    groupLabels: combinationGroups.map(formatPayoutGroup),
    payoutMultiplier,
    rowSpan: PAYOUT_ROWS.length,
    rows: PAYOUT_ROWS.map((row) => ({
      symbol: row.symbol,
      values: row.values.map((value) =>
        formatPayoutValue(value, payoutMultiplier),
      ),
    })),
    stakeLabel: formatPayoutStake(stake),
  };
}