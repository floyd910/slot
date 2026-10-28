const STORAGE_KEY = "game-room:pending-cashier-withdrawal:v1";

const terminalIdFrom = (context = {}) => String(
  context.idKassi ?? context.terminalId ?? "",
);

const readStored = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
};

export const cashierWithdrawalStore = {
  read(context = {}) {
    const record = readStored();
    const terminalId = terminalIdFrom(context);
    return record?.terminalId && terminalId && String(record.terminalId) === terminalId
      ? record
      : null;
  },

  save(context = {}, amount) {
    const record = {
      terminalId: terminalIdFrom(context),
      amount: Number(Number(amount).toFixed(2)),
      requestedAt: new Date().toISOString(),
    };
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* keep current tab locked */ }
    return record;
  },

  clear(context = {}) {
    if (!this.read(context)) return false;
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { return false; }
    return true;
  },
};
