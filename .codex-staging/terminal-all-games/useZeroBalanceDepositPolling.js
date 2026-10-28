import { useEffect, useRef } from "react";
import { getTerminalDeposit } from "../api/terminalApi.js";

const BASE_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 30000;

// Poll only while the displayed balance is exactly zero. Each mounted caller
// owns at most one timeout and one in-flight SOAP request. Lobby and game
// callers are mutually exclusive through their `enabled` condition.
export const useZeroBalanceDepositPolling = ({
  balance,
  busy = false,
  context,
  enabled = true,
  onBalance,
}) => {
  const onBalanceRef = useRef(onBalance);
  onBalanceRef.current = onBalance;

  const terminalId = context?.idKassi ?? context?.terminalId;
  const gameId = context?.recoveryGameId ?? context?.gameId;

  useEffect(() => {
    if (!enabled || busy || Number(balance) !== 0 || !terminalId) return undefined;

    let cancelled = false;
    let timer = null;
    let inFlight = false;
    let retryDelay = BASE_INTERVAL_MS;

    const schedule = (delay) => {
      if (!cancelled) timer = window.setTimeout(checkDeposit, delay);
    };

    const checkDeposit = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const nextBalance = await getTerminalDeposit(context);
        if (cancelled) return;
        retryDelay = BASE_INTERVAL_MS;
        const keepPolling = onBalanceRef.current?.(nextBalance) === true;
        if (keepPolling || Number(nextBalance) === 0) schedule(BASE_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        retryDelay = Math.min(MAX_INTERVAL_MS, retryDelay * 2);
        schedule(retryDelay);
      } finally {
        inFlight = false;
      }
    };

    schedule(BASE_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [balance, busy, context, enabled, gameId, terminalId]);
};
