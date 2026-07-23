import { asNumber } from "./number.js";

export const FREE_SPINS_PER_AWARD = 15;

export const normalizeFreeSpinFlag = (value) =>
  Math.trunc(asNumber(value, 0)) === 1 ? 1 : 0;

export const getAwardedFreeSpinCount = (result) =>
  normalizeFreeSpinFlag(result?.FreeSpin) === 1 ? FREE_SPINS_PER_AWARD : 0;
