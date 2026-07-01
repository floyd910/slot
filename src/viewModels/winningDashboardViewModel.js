import {
  PAYOUT_COLUMNS,
  PAYOUT_ROWS,
  formatPayoutValue,
  getPayoutMultiplier,
} from "../utils/payoutTable.js";

export const WINNING_DASHBOARD_COLUMNS = PAYOUT_COLUMNS.map((label, index) => ({
  className: `--x${index + 1}`,
  label,
}));

export function buildWinningDashboardRows(stake, selectedCombination) {
  const payoutMultiplier = getPayoutMultiplier(stake, selectedCombination);

  return PAYOUT_ROWS.map((row) => ({
    id: row.symbol,
    values: row.values.map((value) =>
      formatPayoutValue(value, payoutMultiplier),
    ),
  }));
}