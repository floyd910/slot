import { useCallback, useEffect, useMemo, useRef } from "react";

export const CONTRACT_VERSION = "1.0";
export const MODULE_VERSION = "0.1.0";
const RECOVERY_KEY = "hiranmandi-frame:init-context:v1";

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

const readStoredContext = () => {
  try {
    return safeJson(window.sessionStorage.getItem(RECOVERY_KEY)) ?? {};
  } catch {
    return {};
  }
};

export const persistInitContext = (context) => {
  try {
    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({
        ...context,
        initSource: context.initSource ?? "recovered",
        recoveredAt: new Date().toISOString(),
      }),
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

export function readFrameParams() {
  const search = new URLSearchParams(window.location.search);
  const globalConfig = window.HIRANMANDI_FRAME_CONFIG ?? {};
  const stored = readStoredContext();
  const queryContext = {
    mode: search.get("mode"),
    sessionId: search.get("sessionId") ?? search.get("session"),
    userId: search.get("userId") ?? search.get("playerId"),
    locale: search.get("locale") ?? search.get("language") ?? search.get("lang"),
    currency: search.get("currency"),
    theme: search.get("theme"),
    partnerId: search.get("partnerId"),
    idPartner: search.get("idPartner") ?? search.get("partnerId"),
    idKassi: search.get("idKassi"),
    idValute: search.get("idValute"),
    gameId: search.get("gameId") ?? search.get("game"),
    token: search.get("token"),
    balance: search.get("balance"),
    testMode: search.get("testMode") ?? search.get("demoMode"),
    testBalance: search.get("testBalance"),
    soapEndpoint: search.get("soapEndpoint"),
    backendMode: search.get("backendMode"),
    backendLines: search.get("backendLines"),
    backendTestParams: search.get("backendTestParams"),
    partnerSettleUrl: search.get("partnerSettleUrl"),
    returnUrl: search.get("returnUrl"),
    bootstrapUrl: search.get("bootstrapUrl"),
    allowedOrigins: parseAllowedOrigins(search.get("allowedOrigins")),
    featureFlags: parseFeatureFlags(search.get("featureFlags")),
  };

  const isFramed = window.parent !== window;
  const mode = queryContext.mode ?? globalConfig.mode ?? stored.mode ?? (isFramed ? "embedded" : "standalone");
  const allowedOrigins = [
    ...(queryContext.allowedOrigins ?? []),
    ...(globalConfig.allowedOrigins ?? []),
    ...(stored.allowedOrigins ?? []),
    referrerOrigin(),
  ].filter(Boolean);

  return {
    ...stored,
    ...globalConfig,
    ...queryContext,
    mode: mode === "embedded" ? "embedded" : "standalone",
    locale: queryContext.locale ?? globalConfig.locale ?? stored.locale ?? "en",
    currency: queryContext.currency ?? globalConfig.currency ?? stored.currency ?? "GEL",
    theme: queryContext.theme ?? globalConfig.theme ?? stored.theme ?? "dark",
    allowedOrigins: Array.from(new Set(allowedOrigins)),
    featureFlags: {
      ...(stored.featureFlags ?? {}),
      ...(globalConfig.featureFlags ?? {}),
      ...(queryContext.featureFlags ?? {}),
    },
    initSource: search.toString() ? "query" : globalConfig.token || globalConfig.sessionId ? "global-config" : stored.sessionId ? "recovered" : "missing",
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
      const targetOrigin = allowedOrigins[0] ?? "*";
      const message = {
        source: "hiranmandi-iframe",
        contractVersion: CONTRACT_VERSION,
        type,
        payload,
        meta: {
          requestId: buildRequestId("evt"),
          sessionId: activeContext.sessionId ?? null,
          moduleVersion: MODULE_VERSION,
          mode: activeContext.mode,
          gameId: activeContext.gameId ?? null,
          timestamp: new Date().toISOString(),
          initSource: activeContext.initSource,
          ...diagnosticsRef.current,
        },
      };

      window.parent?.postMessage(message, targetOrigin);
    },
    [allowedOrigins],
  );

  useEffect(() => {
    const handleMessage = (message) => {
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
