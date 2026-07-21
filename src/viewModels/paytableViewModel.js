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
  const zeroPayoutMultiplier = getPayoutMultiplier(
    stake,
    selectedCombination,
    0,
  );

  return {
    columns: PAYOUT_COLUMNS.slice(1, 5),
    combinationNumber,
    groupLabels: combinationGroups.map(formatPayoutGroup),
    payoutMultiplier,
    rowSpan: PAYOUT_ROWS.length,
    rows: PAYOUT_ROWS.map((row) => ({
      symbol: row.symbol,
      values: row.values.map((value) =>
        formatPayoutValue(
          value,
          getPayoutMultiplier(stake, selectedCombination, row.symbol),
        ),
      ),
    })),
    stakeLabel: formatPayoutStake(stake),
  };
}