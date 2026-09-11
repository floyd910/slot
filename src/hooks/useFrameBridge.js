import { useCallback, useEffect, useRef } from "react";
import { getFrontendEnvConfig } from "../api/runtimeConfig.js";
import { normalizeHostInit, readHostMessage, resolveParentOrigin } from "../api/frameLaunch.js";
export const CONTRACT_VERSION = "1.0";
export const MODULE_VERSION = "1.0.0";
const RECOVERY_KEY = "hiranmandi-frame:init-context:v2";
export const HOST_COMMANDS = new Set(["INIT_CONTEXT", "UPDATE_THEME", "UPDATE_LOCALE", "UPDATE_BALANCE", "FORCE_RELOAD", "OPEN_MODAL", "CLOSE_MODULE"]);
export const persistInitContext = context => {
  try {
    window.sessionStorage.removeItem("hiranmandi-frame:init-context:v1");
    window.sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({ locale: context.locale, theme: context.theme }));
  } catch { /* Third-party storage can be unavailable. */ }
};
export function readFrameParams() {
  const search = new URLSearchParams(window.location.search);
  for (const key of ["token", "password", "Password", "login", "Login", "slotLogin", "slotPassword", "sessionId", "session", "userId", "playerId", "idUser", "idKassi", "idPartner", "idValute"]) search.delete(key);
  const query = search.toString();
  window.history.replaceState(window.history.state, "", window.location.pathname + (query ? "?" + query : "") + window.location.hash);
  const config = getFrontendEnvConfig();
  const isFramed = window.parent !== window;
  const allowedOrigins = (config.parentOrigins ?? "").split(",").map(v => v.trim()).filter(Boolean);
  const parentOrigin = resolveParentOrigin(allowedOrigins, document.referrer, isFramed);
  const context = {
    gameId: search.get("gameId") ?? search.get("game") ?? config.gameId,
    locale: search.get("locale") ?? config.locale ?? "en", theme: "dark",
    mode: isFramed ? "embedded" : "standalone", isFramed, parentOrigin, allowedOrigins,
    initSource: "missing", backendMode: "soap", sessionApiBaseUrl: config.sessionApiBaseUrl,
  };
  persistInitContext(context);
  return context;
}
export function getMissingRequiredContext(context) {
  const missing = [];
  if (!context.isFramed || !context.parentOrigin || context.initSource !== "postMessage") missing.push("parentInitialization");
  if (!context.token) missing.push("token");
  if (!(context.playerId ?? context.userId ?? context.idUser)) missing.push("playerId");
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
  const parentOrigin = context.parentOrigin;

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    diagnosticsRef.current = diagnostics;
  }, [diagnostics]);

  const postEvent = useCallback(
    (type, payload = {}) => {
      const activeContext = contextRef.current;
      const targetOrigin = parentOrigin;
      if (!activeContext.isFramed) return false;
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
    [parentOrigin],
  );

  useEffect(() => {
    const handleMessage = (message) => {
      const payload = readHostMessage(message, window.parent, parentOrigin, contextRef.current.isFramed);
      if (!payload) return;
      const command = payload.type ?? payload.event;
      if (!HOST_COMMANDS.has(command)) return;
      if (command === "INIT_CONTEXT") {
        const next = normalizeHostInit(payload.payload, contextRef.current.gameId);
        if (next) onInitContext?.(next);
        return;
      }
      onCommand?.(command, payload.payload ?? payload.data ?? {});
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [parentOrigin, onCommand, onInitContext]);

  useEffect(() => {
    if (!context.isFramed || !parentOrigin || context.initSource === "postMessage") return;
    const announceReady = () => postEvent("READY", {
      canReceiveInitContext: true,
      needsInitContext: true,
    });
    announceReady();
    const timer = window.setInterval(announceReady, 1000);
    return () => window.clearInterval(timer);
  }, [postEvent, parentOrigin, context.isFramed, context.initSource]);

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
