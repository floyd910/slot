import { asNumber } from "../utils/number.js";

export const normalizeDoubleResult = (result = {}) => {
  const winSum = asNumber(result.WinSum, 0);

  return {
    ...result,
    idCard: result.idCard ?? result.IdCard ?? result.IDCard ?? null,
    requestId: result.requestId ?? null,
    roundId: result.roundId ?? result.idCard ?? null,
    WinSum: winSum,
    WasDouble: asNumber(result.WasDouble, 0),
    status: result.status ?? (winSum > 0 ? "win" : "lose"),
  };
};