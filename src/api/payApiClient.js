import { REQUEST_TIMEOUT_MS } from "../config/gameSettings.js";
import { resolveApiGameId } from "./gameApiIds.js";
import { getSessionApiBaseUrl } from "./runtimeConfig.js";
import { getSpinErrorCode } from "./spinApiClient.js";
const error = (message, code, extra = {}) => Object.assign(new Error(message), {code, ...extra});
export const buildPayForm = (params, context) => {
 const fields = {token:context.token, gameId:resolveApiGameId(context), playerId:context.playerId ?? context.userId ?? context.idUser,
 requestId:params.requestId, cardId:params.idCard, idPartnerCard:params.idPartnerCard};
 for(const [key,value] of Object.entries(fields)) {
  if(!['string','number'].includes(typeof value) || String(value).trim()==='' || (typeof value==='number' && !Number.isFinite(value))) throw error('Missing or invalid pay field: '+key,'CONFIGURATION_ERROR');
 }
 return new URLSearchParams(fields);
};
export const mapPayResponse = (payload, params) => {
 const value=payload?.ballance;
 if(payload?.idCard==null || String(payload.idCard)!==String(params.idCard) || typeof payload.PayDate!=='string' || !payload.PayDate.trim() || !['number','string'].includes(typeof value) || String(value).trim()==='' || !Number.isFinite(Number(value)) || Number(value)<0) throw error('Invalid pay response','BACKEND_RESPONSE_ERROR');
 return {idCard:payload.idCard, idPartnerCard:params.idPartnerCard, requestId:params.requestId, paidAt:payload.PayDate, balance:Number(value), backendManagedWallet:true};
};
export const sendPayRequest = async (body, { requestId, timeoutMs = REQUEST_TIMEOUT_MS } = {}) => {
  const endpoint = getSessionApiBaseUrl().replace(/\/$/, "") + "/pay";
  if (import.meta.env?.PROD && new URL(endpoint, window.location.origin).protocol !== "https:") {
    throw error("Production pay endpoint must use HTTPS", "CONFIGURATION_ERROR", { requestId });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
      signal: controller.signal,
    });
    let payload;
    try { payload = await response.json(); } catch (cause) {
      if (cause.name === "AbortError") throw cause;
      throw error("Pay response is not JSON", response.ok ? "BACKEND_RESPONSE_ERROR" : getSpinErrorCode(response.status), { status: response.status });
    }
    if (!response.ok || payload?.error || Number(payload?.error_code) >= 400 || payload?.success === false) {
      const code = getSpinErrorCode(response.status, payload);
      throw error("Pay request failed", code, { status: response.status, backendErrorCode: payload?.error_code });
    }
    return payload;
  } catch (cause) {
    if (cause.name === "AbortError") throw error("Pay request timed out", "TIMEOUT", { requestId });
    if (cause.code) { cause.requestId = requestId; throw cause; }
    throw error("Pay network request failed", "NETWORK_ERROR", { requestId });
  } finally { clearTimeout(timer); }
};
