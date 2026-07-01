import { asNumber } from "../utils/number.js";
import { normalizeDoubleResult } from "../models/doubleResult.js";
import { normalizePayResult } from "../models/payResult.js";
import { normalizeSpinResult } from "../models/spinResult.js";
import { mapSpinPayload } from "./slotPayloadMappers.js";
import { readAttributes } from "./soapClient.js";
import { parseSoapError } from "./soapFaultParser.js";

export { parseSoapError };

export const parseSpinResponse = (document, params = {}) =>
  normalizeSpinResult(mapSpinPayload(document, params));

export const parseDoubleResponse = (document, params = {}) => {
  const attrs = readAttributes(document, "GameResult");
  const winSum = asNumber(attrs.WinSum, 0);

  return normalizeDoubleResult({
    idCard: attrs.idCard ?? attrs.IdCard ?? attrs.IDCard ?? params.idCard,
    requestId: params.requestId,
    roundId: params.roundId ?? attrs.idCard ?? params.idCard,
    WinSum: winSum,
    WasDouble: params.wasDouble,
    side: params.side,
    status: winSum > 0 ? "win" : "lose",
  });
};

export const parsePayResponse = (document, params = {}) => {
  const attrs = readAttributes(document, "GameResult");
  return normalizePayResult({
    ...attrs,
    idCard: attrs.idCard ?? attrs.IdCard ?? attrs.IDCard ?? params.idCard,
    requestId: params.requestId,
  });
};