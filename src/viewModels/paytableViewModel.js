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

export function buildStandardPaytableViewModel({ stake, selectedCombination, gameId }) {
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
  const payoutRows =
    gameId === "babylon"
      ? PAYOUT_ROWS.filter(({ symbol }) => symbol <= 9)
      : PAYOUT_ROWS;

  return {
    columns: PAYOUT_COLUMNS.slice(1, 5),
    combinationNumber,
    groupLabels: combinationGroups.map(formatPayoutGroup),
    payoutMultiplier,
    rowSpan: payoutRows.length,
    rows: payoutRows.map((row) => ({
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