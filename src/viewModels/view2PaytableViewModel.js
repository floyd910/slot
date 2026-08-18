import { getPayoutRows, formatPayoutValue } from "../utils/payoutTable.js";

export function getView2MatchPayout(symbol, matchCount, payoutMultiplier, gameId) {
  const row = getPayoutRows(gameId).find((item) => item.symbol === symbol);
  return formatPayoutValue(row?.values[matchCount - 2], payoutMultiplier);
}

// Symbol 0 is a special line-dependent payout, not a symbol-match payout.
export function getView2ZeroPayout(column, payoutMultiplier, gameId) {
  const row = getPayoutRows(gameId).find((item) => item.symbol === 0);
  return formatPayoutValue(row?.values[column - 2], payoutMultiplier);
}