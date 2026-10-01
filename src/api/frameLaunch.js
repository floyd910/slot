const hasText = value => typeof value === "string" && value.trim().length > 0;

const normalizePartnerLanguage = (value) => {
  const language = String(value ?? "").trim().toLowerCase();
  return ({ eng: "en", rus: "ru", geo: "ka", tur: "tr", cz: "cs" })[language] ?? language;
};

export const resolveParentOrigin = (allowedOrigins, referrer, isFramed) => {
  if (!isFramed) return "";
  const allowed = allowedOrigins.filter(origin => {
    try { const url = new URL(origin); return url.origin === origin && ["https:", "http:"].includes(url.protocol); } catch { return false; }
  });
  if (referrer) {
    try { const origin = new URL(referrer).origin; return allowed.includes(origin) ? origin : ""; } catch { return ""; }
  }
  return allowed.length === 1 ? allowed[0] : "";
};

export const readHostMessage = (event, parentWindow, parentOrigin, isFramed) => {
  if (!isFramed || !parentOrigin || event.source !== parentWindow || event.origin !== parentOrigin) return null;
  const data = event.data;
  if (!data || typeof data !== "object") return null;

  const versioned =
    ["partner-site", "hiranmandi-host"].includes(data.source) &&
    data.contractVersion === "1.0";
  if (versioned) return data;

  // Compatibility with the public partner document's { event, data } format.
  // Trust is still established by the configured origin and parent window above.
  if (!hasText(data.event) || (data.data != null && typeof data.data !== "object")) return null;
  return {
    source: "partner-site",
    contractVersion: "1.0",
    type: data.event,
    payload: data.data ?? {},
  };
};

export const normalizeHostInit = (payload, gameId) => {
  const playerId = payload?.playerID ?? payload?.playerId ?? payload?.userId ?? payload?.idUser;
  if (!hasText(payload?.token) || playerId == null || String(playerId).trim() === "" || !gameId) return null;
  const locale = normalizePartnerLanguage(payload.locale ?? payload.language ?? payload.lang);
  // Only launch data is accepted. The host cannot replace endpoints, trust configuration or a server session.
  return {
    token: payload.token,
    playerId: String(playerId),
    userId: String(playerId),
    idUser: String(playerId),
    gameId,
    sessionId: null,
    initSource: "postMessage",
    mode: "embedded",
    backendMode: "soap",
    demoMode: payload.demoMode === true || payload.demoMode === 1 || payload.demoMode === "1" || payload.demoMode === "true",
    ...(hasText(locale) ? { locale } : {}),
  };
};
