import { useCallback, useEffect, useMemo, useRef } from "react";
import { getFrontendEnvConfig } from "../api/runtimeConfig.js";

export const CONTRACT_VERSION = "1.0";
export const MODULE_VERSION = "0.1.0";
const RECOVERY_KEY = "hiranmandi-frame:init-context:v2";
const LEGACY_RECOVERY_KEY = "hiranmandi-frame:init-context:v1";
const SENSITIVE_CONTEXT_KEYS = new Set([
  "token", "password", "login", "userId", "idUser", "sessionId",
]);
const SENSITIVE_QUERY_KEYS = [
  "token", "password", "Password", "login", "Login", "slotLogin",
  "sessionId", "session", "userId", "playerId", "idUser",
];

const DEV_SOAP_CONTEXT = {
  token: "partner-token",
  sessionId: "partner-session",
  gameId: "hiranmandi",
  idPartner: "1",
  idKassi: "70",
  idValute: "1",
  idUser: "1",
  userId: "1",
  login: "testslot",
  password: "1",
};
const HOSTED_STANDALONE_HOSTS = new Set([
  "raxshloto.online",
  "www.raxshloto.online",
  "localhost",
  "127.0.0.1",
  "::1",
]);
const HOSTED_STANDALONE_QUERY = {
  mode: "standalone",
  token: "partner-token",
  sessionId: "partner-session",
  userId: "partner-user",
  gameId: "hiranmandi",
  currency: "GEL",
  locale: "en",
  backendMode: "soap",
  testMode: "false",
  demoMode: "false",
  backendTestParams: "false",
};
const HOSTED_SOAP_CONTEXT = {
  idPartner: "1",
  idKassi: "70",
  idValute: "1",
  idUser: "1",
  userId: "1",
  login: "testslot",
  password: "1",
  backendMode: "soap",
};
export const HOST_COMMANDS = new Set([
  "INIT_CONTEXT",
  "UPDATE_THEME",
  "UPDATE_LOCALE",
  "UPDATE_BALANCE",
  "FORCE_RELOAD",
  "OPEN_MODAL",
  "CLOSE_MODULE",
]);

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseFeatureFlags = (value) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return value.split(",").reduce((flags, item) => {
      const flag = item.trim();
      if (flag) flags[flag] = true;
      return flags;
    }, {});
  }
};

const safeJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const withoutSensitiveValues = (values = {}) =>
  Object.fromEntries(
    Object.entries(values).filter(([key]) => !SENSITIVE_CONTEXT_KEYS.has(key)),
  );

const removeSensitiveQueryParams = (search) => {
  if (!SENSITIVE_QUERY_KEYS.some((key) => search.has(key))) return;
  const clean = new URLSearchParams(search);
  SENSITIVE_QUERY_KEYS.forEach((key) => clean.delete(key));
  const query = clean.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
};
const withoutEmptyValues = (values) =>
  Object.fromEntries(
    Object.entries(values ?? {}).filter(
      ([, value]) => value != null && value !== "",
    ),
  );

const readStoredContext = () => {
  try {
    window.sessionStorage.removeItem(LEGACY_RECOVERY_KEY);
    return withoutSensitiveValues(safeJson(window.sessionStorage.getItem(RECOVERY_KEY)) ?? {});
  } catch {
    return {};
  }
};

export const persistInitContext = (context) => {
  try {
    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify(withoutSensitiveValues({
        ...context,
        initSource: context.initSource ?? "recovered",
        recoveredAt: new Date().toISOString(),
      })),
    );
  } catch {
    // sessionStorage may be blocked in third-party iframe contexts.
  }
};

const referrerOrigin = () => {
  try {
    return document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    return "";
  }
};

const redirectHostedStandalone = () => {
  if (
    window.parent !== window ||
    !HOSTED_STANDALONE_HOSTS.has(window.location.hostname)
  ) {
    return false;
  }

  const search = new URLSearchParams(window.location.search);
  if (Object.keys(HOSTED_STANDALONE_QUERY).every((key) => search.has(key))) {
    return false;
  }

  Object.entries(HOSTED_STANDALONE_QUERY).forEach(([key, value]) => {
    if (!search.has(key)) search.set(key, value);
  });

  window.location.replace(
    `${window.location.pathname}?${search.toString()}${window.location.hash}`,
  );
  return true;
};

export function readFrameParams() {
  redirectHostedStandalone();
  const search = new URLSearchParams(window.location.search);
  const globalConfig = window.HIRANMANDI_FRAME_CONFIG ?? {};
  const envConfig = getFrontendEnvConfig();
  const stored = readStoredContext();
  const queryDemoMode = search.get("demoMode");
  const queryTestMode = search.get("testMode");
  const queryContext = {
    mode: search.get("mode"),
    sessionId: search.get("sessionId") ?? search.get("session"),
    userId: search.get("idUser") ?? search.get("userId") ?? search.get("playerId"),
    idUser: search.get("idUser") ?? search.get("userId") ?? search.get("playerId"),
    login: search.get("login") ?? search.get("Login") ?? search.get("slotLogin"),
    password: search.get("password") ?? search.get("Password") ?? search.get("slotPassword"),
    locale: search.get("locale") ?? search.get("language") ?? search.get("lang"),
    currency: search.get("currency"),
    theme: search.get("theme"),
    partnerId: search.get("partnerId"),
    idPartner: search.get("idPartner") ?? search.get("partnerId"),
    idKassi: search.get("idKassi"),
    idValute: search.get("idValute"),
    gameId: search.get("gameId") ?? search.get("game"),
    backendGameId: search.get("backendGameId") ?? search.get("idGame"),
    token: search.get("token"),
    balance: search.get("balance"),
    testMode: queryTestMode ?? queryDemoMode,
    demoMode: queryDemoMode,
    testBalance: search.get("testBalance"),
    soapEndpoint: undefined,
    backendMode: search.get("backendMode"),
    backendTestParams: search.get("backendTestParams"),
    partnerSettleUrl: search.get("partnerSettleUrl"),
    returnUrl: search.get("returnUrl"),
    bootstrapUrl: search.get("bootstrapUrl"),
    allowedOrigins: parseAllowedOrigins(search.get("allowedOrigins")),
    featureFlags: parseFeatureFlags(search.get("featureFlags")),
  };

  removeSensitiveQueryParams(search);

  const isFramed = window.parent !== window;
  const hostedStandaloneDefaults =
    !isFramed && HOSTED_STANDALONE_HOSTS.has(window.location.hostname)
      ? HOSTED_SOAP_CONTEXT
      : {};
  const mode = queryContext.mode ?? globalConfig.mode ?? envConfig.mode ?? stored.mode ?? (isFramed ? "embedded" : "standalone");
  const allowedOrigins = [
    ...(queryContext.allowedOrigins ?? []),
    ...(globalConfig.allowedOrigins ?? []),
    ...(stored.allowedOrigins ?? []),
    referrerOrigin(),
  ].filter(Boolean);

  return {
    ...withoutEmptyValues(stored),
    ...withoutEmptyValues(envConfig),
    ...(import.meta.env.DEV ? DEV_SOAP_CONTEXT : {}),
    ...hostedStandaloneDefaults,
    ...withoutEmptyValues(globalConfig),
    ...withoutEmptyValues(queryContext),
    mode: mode === "embedded" ? "embedded" : "standalone",
    demoMode: queryContext.demoMode ?? globalConfig.demoMode ?? envConfig.demoMode ?? "false",
    testMode:
      queryContext.testMode ??
      globalConfig.testMode ??
      envConfig.testMode ??
      queryContext.demoMode ??
      globalConfig.demoMode ??
      envConfig.demoMode ??
      "false",
    locale: queryContext.locale ?? globalConfig.locale ?? envConfig.locale ?? stored.locale ?? "en",
    currency: queryContext.currency ?? globalConfig.currency ?? envConfig.currency ?? stored.currency ?? "GEL",
    theme: queryContext.theme ?? globalConfig.theme ?? stored.theme ?? "dark",
    allowedOrigins: Array.from(new Set(allowedOrigins)),
    featureFlags: {
      ...(stored.featureFlags ?? {}),
      ...(globalConfig.featureFlags ?? {}),
      ...(queryContext.featureFlags ?? {}),
    },
    initSource: search.toString() ? "query" : globalConfig.token || globalConfig.sessionId ? "global-config" : envConfig.token || envConfig.sessionId ? "env" : stored.sessionId ? "recovered" : "missing",
    isFramed,
  };
}

export function getMissingRequiredContext(context) {
  const missing = [];
  if (!context.token) missing.push("token");
  if (!context.sessionId) missing.push("sessionId");
  if (!context.gameId) missing.push("gameId");
  return missing;
}

export function buildRequestId(prefix = "req") {
  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

export function useFrameBridge({ context, diagnostics, onCommand, onInitContext }) {
  const contextRef = useRef(context);
  const diagnosticsRef = useRef(diagnostics);
  const allowedOrigins = useMemo(() => context.allowedOrigins ?? [], [context.allowedOrigins]);

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    diagnosticsRef.current = diagnostics;
  }, [diagnostics]);

  const isAllowedOrigin = useCallback(
    (origin) => {
      if (!origin) return contextRef.current.mode === "standalone";
      if (allowedOrigins.length) return allowedOrigins.includes(origin);
      return origin === window.location.origin;
    },
    [allowedOrigins],
  );

  const postEvent = useCallback(
    (type, payload = {}) => {
      const activeContext = contextRef.current;
      const targetOrigin = allowedOrigins[0] ?? (activeContext.mode === "standalone" ? window.location.origin : "");
      if (!targetOrigin) return false;
      const message = {
        source: "hiranmandi-iframe",
        contractVersion: CONTRACT_VERSION,
        type,
        payload,
        meta: {
          requestId: buildRequestId("evt"),

          moduleVersion: MODULE_VERSION,
          mode: activeContext.mode,
          gameId: activeContext.gameId ?? null,
          timestamp: new Date().toISOString(),
          initSource: activeContext.initSource,
          ...diagnosticsRef.current,
        },
      };

      window.parent?.postMessage(message, targetOrigin);
      return true;
    },
    [allowedOrigins],
  );

  useEffect(() => {
    const handleMessage = (message) => {
      if (message.source !== window.parent) return;
      if (!isAllowedOrigin(message.origin)) return;
      const payload = message.data;
      if (!payload || typeof payload !== "object") return;
      if (!["partner-site", "hiranmandi-host"].includes(payload.source)) return;
      if (payload.contractVersion && payload.contractVersion !== CONTRACT_VERSION) return;

      const command = payload.type ?? payload.event;
      if (!HOST_COMMANDS.has(command)) return;
      if (command === "INIT_CONTEXT") {
        onInitContext?.({ ...(payload.payload ?? payload.data ?? {}), initSource: "postMessage" });
        return;
      }
      onCommand?.(command, payload.payload ?? payload.data ?? {});
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAllowedOrigin, onCommand, onInitContext]);

  useEffect(() => {
    postEvent("READY", { canReceiveInitContext: true });
  }, [postEvent]);

  useEffect(() => {
    const notifySize = () => {
      postEvent("RESIZE", {
        height: document.documentElement.scrollHeight,
        width: document.documentElement.scrollWidth,
      });
    };

    notifySize();
    const observer = new ResizeObserver(notifySize);
    observer.observe(document.documentElement);
    window.addEventListener("resize", notifySize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", notifySize);
    };
  }, [postEvent]);

  return { postEvent };
}
