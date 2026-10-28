import { frameApi } from "../api/frameApi.js";
import { isHiranmandiTerminal } from "../api/terminalApi.js";

export const refreshTerminalBalance = async ({ context, liveSpinStateRef, setPlayer, postEvent, balance: prefetchedBalance } = {}) => {
  if (!isHiranmandiTerminal(context)) return null;
  const balance = prefetchedBalance == null
    ? await frameApi.getTerminalDeposit(context)
    : Number(prefetchedBalance);
  let currency;
  setPlayer((current) => {
    if (!current) return current;
    currency = current.currency;
    const nextPlayer = { ...current, balance };
    if (liveSpinStateRef?.current) {
      liveSpinStateRef.current = { ...liveSpinStateRef.current, player: nextPlayer };
    }
    return nextPlayer;
  });
  postEvent?.("UPDATE_BALANCE", { balance, currency });
  return balance;
};
