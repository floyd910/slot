import { REQUEST_TIMEOUT_MS } from "../config/gameSettings.js";
import { resolveApiGameId } from "./gameApiIds.js";
import { getSessionApiBaseUrl } from "./runtimeConfig.js";

const error = (message, code, extra = {}) => Object.assign(new Error(message), { code, ...extra });

export const getSpinErrorCode = (status, payload) => {
  const backendStatus = Number(payload?.error_code);
  const effectiveStatus = status >= 400 ? status : backendStatus;
  if (effectiveStatus === 400) return "BAD_REQUEST";
  if (effectiveStatus === 401) return "ACCESS_DENIED";
  if (effectiveStatus === 403) return "ACCESS_DENIED";
  if (effectiveStatus === 404) return "GAME_NOT_FOUND";
  if (effectiveStatus === 408) return "TIMEOUT";
  if (effectiveStatus >= 500) return "SERVER_ERROR";
  if (effectiveStatus >= 400) return "BET_REJECTED";
  const code = payload?.error?.code ?? payload?.code;
  return typeof code === "string" ? code : "BACKEND_RESPONSE_ERROR";
};

export const buildSpinForm = (params, context) => {
  const fields = {
    token: context.token,
    gameId: resolveApiGameId(context),
    playerId: context.playerId ?? context.userId ?? context.idUser,
    requestId: params.requestId,
    sum: params.stake,
    lines: params.lines,
    demoSpin: params.isFreeSpin ? 0 : params.isDemo ? 1 : 0,
    freeSpin: params.isFreeSpin ? 1 : 0,
  };
  for (const key of ["token", "gameId", "playerId", "requestId", "sum", "lines"]) {
    if (fields[key] == null || String(fields[key]).trim() === "") throw error("Missing spin field: " + key, "CONFIGURATION_ERROR");
  }
  if (!Number.isFinite(Number(fields.sum)) || Number(fields.sum) < 0 || !Number.isInteger(Number(fields.lines)) || Number(fields.lines) <= 0) {
    throw error("Invalid spin stake or lines", "CONFIGURATION_ERROR");
  }
  return new URLSearchParams(fields);
};

export const sendSpinRequest = async (body, { requestId, timeoutMs = REQUEST_TIMEOUT_MS } = {}) => {
  const endpoint = getSessionApiBaseUrl().replace(/\/$/, "") + "/spin";
  if (import.meta.env?.PROD && new URL(endpoint, window.location.origin).protocol !== "https:") {
    throw error("Production spin endpoint must use HTTPS", "CONFIGURATION_ERROR", { requestId });
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
      throw error("Spin response is not JSON", response.ok ? "BACKEND_RESPONSE_ERROR" : getSpinErrorCode(response.status), { status: response.status });
    }
    if (!response.ok || payload?.error || Number(payload?.error_code) >= 400 || payload?.success === false) {
      const code = getSpinErrorCode(response.status, payload);
      throw error("Spin request failed", code, { status: response.status, backendErrorCode: payload?.error_code });
    }
    return payload;
  } catch (cause) {
    if (cause.name === "AbortError") throw error("Spin request timed out", "TIMEOUT", { requestId });
    if (cause.code) { cause.requestId = requestId; throw cause; }
    throw error("Spin network request failed", "NETWORK_ERROR", { requestId });
  } finally { clearTimeout(timer); }
};
