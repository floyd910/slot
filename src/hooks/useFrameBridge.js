import { useCallback, useEffect, useMemo } from "react";

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export function readFrameParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get("token"),
    session: params.get("session"),
    gameId: params.get("gameId") ?? params.get("game"),
    language: params.get("language") ?? params.get("lang") ?? "en",
    currency: params.get("currency") ?? "GEL",
    playerId: params.get("playerId"),
    allowedOrigins: parseAllowedOrigins(params.get("allowedOrigins")),
  };
}

export function useFrameBridge({ params, onCommand }) {
  const allowedOrigins = useMemo(() => params.allowedOrigins ?? [], [params.allowedOrigins]);

  const isAllowedOrigin = useCallback(
    (origin) => {
      if (!allowedOrigins.length) return true;
      return allowedOrigins.includes(origin);
    },
    [allowedOrigins],
  );

  const postEvent = useCallback(
    (event, data = {}) => {
      const targetOrigin = allowedOrigins[0] ?? "*";
      window.parent?.postMessage({ source: "hiranmandi-frame", event, data }, targetOrigin);
    },
    [allowedOrigins],
  );

  useEffect(() => {
    const handleMessage = (message) => {
      if (!isAllowedOrigin(message.origin)) return;
      const payload = message.data;
      if (!payload || payload.source !== "partner-site") return;
      onCommand?.(payload.event, payload.data ?? {});
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isAllowedOrigin, onCommand]);

  useEffect(() => {
    const notifySize = () => {
      postEvent("size_update", {
        docheight: document.documentElement.scrollHeight,
        docwidth: document.documentElement.scrollWidth,
      });
    };

    notifySize();
    window.addEventListener("resize", notifySize);
    return () => window.removeEventListener("resize", notifySize);
  }, [postEvent]);

  return { postEvent };
}
