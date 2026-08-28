const CONTRACT_VERSION = "1.0";
const REQUEST_TIMEOUT_MS = 8000;
const pendingRequests = new Map();
let partnerConfig = {
  enabled: false,
  targetOrigin: "",
  playerId: null,
  gameId: null,
};

const getEmbeddingOrigin = () => {
  try {
    return document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    return "";
  }
};

const makeRequestId = (prefix) => {
  const id = window.crypto?.randomUUID?.() ?? String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  return prefix + "-" + id;
};

const handlePartnerMessage = (event) => {
  if (event.source !== window.parent) return;
  if (!partnerConfig.targetOrigin || event.origin !== partnerConfig.targetOrigin) return;
  const message = event.data;
  if (
    !message ||
    message.source !== "partner-site" ||
    message.type !== "PARTNER_RESPONSE" ||
    message.contractVersion !== CONTRACT_VERSION
  ) return;

  const pending = pendingRequests.get(message.requestId);
  if (!pending) return;
  pendingRequests.delete(message.requestId);
  window.clearTimeout(pending.timeoutId);
  if (message.ok) pending.resolve(message.data ?? {});
  else pending.reject(Object.assign(new Error(message.error?.message ?? "Partner request failed"), {
    code: message.error?.code ?? "PARTNER_ERROR",
  }));
};

if (typeof window !== "undefined") window.addEventListener("message", handlePartnerMessage);

const request = (type, payload = {}, requestId = makeRequestId("partner")) => {
  if (!partnerConfig.enabled) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(Object.assign(new Error("Partner request timed out"), { code: "PARTNER_TIMEOUT" }));
    }, REQUEST_TIMEOUT_MS);
    pendingRequests.set(requestId, { reject, resolve, timeoutId });
    window.parent.postMessage({
      source: "hiranmandi-iframe",
      contractVersion: CONTRACT_VERSION,
      type,
      requestId,
      payload: {
        ...payload,
        playerId: payload.playerId ?? partnerConfig.playerId,
        gameId: payload.gameId ?? partnerConfig.gameId,
      },
    }, partnerConfig.targetOrigin);
  });
};

export const partnerApi = {
  configure(context = {}) {
    const targetOrigin =
      getEmbeddingOrigin() || context.allowedOrigins?.[0] || "";
    partnerConfig = {
      enabled: context.mode === "embedded" && Boolean(targetOrigin),
      targetOrigin,
      playerId: context.userId ?? context.idUser ?? null,
      gameId: context.recoveryGameId ?? context.gameId ?? null,
    };
  },
  isEnabled: () => partnerConfig.enabled,
  getBalance: () => request("PARTNER_GET_BALANCE"),
  registerBet: (payload) => request("PARTNER_REGISTER_BET", payload, payload.requestId),
  settleRound: (payload) => request("PARTNER_SETTLE_ROUND", payload, payload.requestId),
  cancelBet: (payload) => request("PARTNER_CANCEL_BET", payload, payload.requestId),
  recoverSession: (payload = {}) => request("PARTNER_RECOVER_SESSION", payload, payload.requestId),
};