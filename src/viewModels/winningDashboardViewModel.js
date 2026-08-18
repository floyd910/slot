import {
  PAYOUT_COLUMNS,
  getPayoutRows,
  formatPayoutValue,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";

export const WINNING_DASHBOARD_COLUMNS = PAYOUT_COLUMNS.map((label, index) => ({
  className: `--x${index + 1}`,
  label,
}));

export function buildWinningDashboardRows(stake, selectedCombination, gameId, selectedCombinationId) {
  const payoutRows = getPayoutRows(gameId);

  return payoutRows.map((row) => {
    const values = row.values.map((value) =>
      formatPayoutValue(
        value,
        getPayoutMultiplier(stake, selectedCombination, row.symbol, gameId, selectedCombinationId),
      ),
    );

    return {
      id: row.symbol,
      values,
    };
  });
}