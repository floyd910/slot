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

export const getTicketWinAmount = (spinResult, doublingState) => {
  if (hasDoublingResult(doublingState)) {
    return Math.max(0, asNumber(doublingState?.currentAmount, 0));
  }

  return getFirstPositiveAmount(
    WIN_AMOUNT_KEYS.map((key) => spinResult?.[key]),
  );
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
