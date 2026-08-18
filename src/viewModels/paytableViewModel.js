import {
  PAYOUT_COLUMNS,
  getPayoutRows,
  formatPayoutGroup,
  formatPayoutStake,
  formatPayoutValue,
  getCombinationGroups,
  getCombinationNumber,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";

export function buildStandardPaytableViewModel({ stake, selectedCombination, selectedCombinationId, gameId }) {
  const combinationNumber = getCombinationNumber(selectedCombination);
  const combinationGroups = getCombinationGroups(
    selectedCombination,
    combinationNumber,
  );
  const payoutMultiplier = getPayoutMultiplier(stake, selectedCombination, undefined, gameId, selectedCombinationId);
  const zeroPayoutMultiplier = getPayoutMultiplier(
    stake,
    selectedCombination,
    0,
    gameId,
    selectedCombinationId,
  );
  const payoutRows = getPayoutRows(gameId);

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
          getPayoutMultiplier(stake, selectedCombination, row.symbol, gameId, selectedCombinationId),
        ),
      ),
    })),
    stakeLabel: formatPayoutStake(stake),
  };
}