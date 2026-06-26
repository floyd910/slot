import { asNumber } from "./number.js";

export const normalizeFreeSpinCount = (value) =>
  Math.max(0, Math.trunc(asNumber(value, 0)));

export const getAwardedFreeSpinCount = (result) =>
  normalizeFreeSpinCount(result?.FreeSpin);
