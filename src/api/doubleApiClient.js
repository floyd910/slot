import { buildAuthHeaders } from './authHeaders.js';
import { DOUBLE_MAX_STEPS, REQUEST_TIMEOUT_MS } from '../config/gameSettings.js';
import { resolveApiGameId } from './gameApiIds.js';
import { getSessionApiBaseUrl } from './runtimeConfig.js';
import { getSpinErrorCode } from './spinApiClient.js';
import { normalizeDoubleResult } from '../models/doubleResult.js';
const error = (message, code, extra = {}) => Object.assign(new Error(message), {code, ...extra});
export function buildDoubleForm(params, context) {
  buildAuthHeaders(context.token);
  const fields = {gameId:resolveApiGameId(context),requestId:params.requestId,cardId:params.idCard,wasDouble:params.wasDouble,sum:params.sum};
  for (const value of Object.values(fields)) if (!['string','number'].includes(typeof value) || !String(value).trim()) throw error('Missing double field','CONFIGURATION_ERROR');
  if (!Number.isInteger(Number(fields.wasDouble)) || Number(fields.wasDouble)<1 || Number(fields.wasDouble)>DOUBLE_MAX_STEPS || !Number.isFinite(Number(fields.sum)) || Number(fields.sum)<=0) throw error('Invalid double amount or step','CONFIGURATION_ERROR');
  return new URLSearchParams(fields);
}
export function mapDoubleResponse(payload, params) {
  const amount=payload?.WinSum;
  if (payload?.idCard == null || String(payload.idCard)!==String(params.idCard) || !['number','string'].includes(typeof amount) || !String(amount).trim() || !Number.isFinite(Number(amount)) || Number(amount)<0) throw error('Invalid double response','BACKEND_RESPONSE_ERROR');
  return normalizeDoubleResult({idCard:payload.idCard,roundId:payload.idCard,requestId:params.requestId,WinSum:Number(amount),WasDouble:params.wasDouble,side:params.side,backendManagedWallet:true});
}
export const sendDoubleRequest = async (body, { token, requestId, timeoutMs = REQUEST_TIMEOUT_MS } = {}) => {
  const headers = buildAuthHeaders(token);
  const endpoint = getSessionApiBaseUrl().replace(/\/$/, "") + "/double";
  if (import.meta.env?.PROD && new URL(endpoint, window.location.origin).protocol !== "https:") {
    throw error("Production double endpoint must use HTTPS", "CONFIGURATION_ERROR", { requestId });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    if (response.status === 202) throw error("Double is still processing", "REQUEST_IN_PROGRESS", {requestId});
    let payload;
    try { payload = await response.json(); } catch (cause) {
      if (cause.name === "AbortError") throw cause;
      throw error("Double response is not JSON", response.ok ? "BACKEND_RESPONSE_ERROR" : getSpinErrorCode(response.status), { status: response.status });
    }
    if (!response.ok || payload?.error || Number(payload?.error_code) >= 400 || payload?.success === false) {
      const code = getSpinErrorCode(response.status, payload);
      throw error("Double request failed", code, { status: response.status, backendErrorCode: payload?.error_code });
    }
    return payload;
  } catch (cause) {
    if (cause.name === "AbortError") throw error("Double request timed out", "TIMEOUT", { requestId });
    if (cause.code) { cause.requestId = requestId; throw cause; }
    throw error("Double network request failed", "NETWORK_ERROR", { requestId });
  } finally { clearTimeout(timer); }
};
