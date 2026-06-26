import { asNumber } from "./number.js";

const WIN_AMOUNT_KEYS = [
  "WinSum",
  "winSum",
  "BaseWinSum",
  "baseWinSum",
  "BackendWinSum",
  "backendWinSum",
  "WinAmount",
  "winAmount",
  "TotalWin",
  "totalWin",
  "TotalWinSum",
  "totalWinSum",
  "Amount",
  "amount",
  "Payout",
  "payout",
  "PaySum",
  "paySum",
  "Prize",
  "prize",
  "Winning",
  "winning",
];

const LINE_WIN_AMOUNT_KEYS = [
  "totalWin",
  "TotalWin",
  "baseWin",
  "BaseWin",
  "score",
  "amount",
  "Amount",
  "payout",
  "Payout",
  "WinSum",
  "winSum",
];

const hasDoublingResult = (doublingState) =>
  Boolean(
    doublingState?.entered ||
      doublingState?.active ||
      doublingState?.loading ||
      doublingState?.step > 0 ||
      doublingState?.lastStatus,
  );

const getFirstPositiveAmount = (values) => {
  for (const value of values) {
    const amount = asNumber(value, 0);
    if (amount > 0) return amount;
  }

  return 0;
};

const getLineWinAmount = (lineWin) => {
  if (!lineWin || typeof lineWin !== "object") return 0;
  return getFirstPositiveAmount(
    LINE_WIN_AMOUNT_KEYS.map((key) => lineWin[key]),
  );
};

const getLineWinTotal = (lineWins) => {
  if (!Array.isArray(lineWins)) return 0;

  const total = lineWins.reduce(
    (sum, lineWin) => sum + getLineWinAmount(lineWin),
    0,
  );
  return Number(total.toFixed(2));
};

export const getTicketWinAmount = (spinResult, doublingState) => {
  if (hasDoublingResult(doublingState)) {
    return Math.max(0, asNumber(doublingState?.currentAmount, 0));
  }

  const resultAmount = getFirstPositiveAmount(
    WIN_AMOUNT_KEYS.map((key) => spinResult?.[key]),
  );
  if (resultAmount > 0) return resultAmount;

  return getLineWinTotal(spinResult?.lineWins);
};

export const hasTicketWin = (spinResult, doublingState) =>
  getTicketWinAmount(spinResult, doublingState) > 0;

export const shouldOfferDouble = ({
  autoPlayOn = false,
  doublingState,
  freeSpinsLeft = 0,
  freeSpinRunActive = false,
  showFreeSpinPrompt = false,
  spinResult,
} = {}) => {
  if (autoPlayOn || freeSpinRunActive || showFreeSpinPrompt) return false;
  if (asNumber(freeSpinsLeft, 0) > 0) return false;
  if (spinResult?.isFreeSpin === true) return false;
  if (asNumber(spinResult?.FreeSpin, 0) > 0) return false;

  return getTicketWinAmount(spinResult, doublingState) > 0;
};
