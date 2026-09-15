import { getSessionApiBaseUrl } from "./runtimeConfig.js";

export async function requestBalance({ token, playerId }) {
  const response = await fetch(getSessionApiBaseUrl().replace(/\/$/, "") + "/balance", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ token, playerId }),
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) {
    throw Object.assign(new Error("Balance API returned HTTP " + response.status), { status: response.status });
  }
  const payload = await response.json();
  const value = payload?.balance;
  if ((typeof value !== "number" && typeof value !== "string") ||
      String(value).trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0 ||
      typeof payload.currency !== "string" || !payload.currency.trim() ||
      String(payload.playerId) !== String(playerId)) {
    throw Object.assign(new Error("Balance API returned invalid player balance data"), { code: "BACKEND_RESPONSE_ERROR" });
  }
  return { balance: Number(value), currency: payload.currency, playerId: String(payload.playerId) };
}
