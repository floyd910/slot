import { PAYOUT_ROWS, formatPayoutValue } from "../utils/payoutTable.js";

const symbolRows = new Map(PAYOUT_ROWS.map((row) => [row.symbol, row]));

export function getView2MatchPayout(symbol, matchCount, payoutMultiplier) {
  return formatPayoutValue(
    symbolRows.get(symbol)?.values[matchCount - 1],
    payoutMultiplier,
  );
}