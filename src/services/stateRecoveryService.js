const LEGACY_PENDING_KEY = "hiranmandi-frame:pending-operation:v1";
const LEGACY_GAME_STATE_KEY = "hiranmandi-frame:game-state:v1";
const PENDING_KEY = "hiranmandi-frame:pending-operation:v2";
const GAME_STATE_KEY = "hiranmandi-frame:game-state:v2";
const LAST_SPIN_KEY = "hiranmandi-frame:last-spin:v1";
const memoryStore = new Map();

export const ROUND_OPERATION_STATUS = Object.freeze({
  SPIN_PROCESSING: "SPIN_PROCESSING",
  WAITING_FOR_PLAYER_ACTION: "WAITING_FOR_PLAYER_ACTION",
  DOUBLE_PROCESSING: "DOUBLE_PROCESSING",
  WAITING_FOR_COLLECT: "WAITING_FOR_COLLECT",
  ROUND_COMPLETED: "ROUND_COMPLETED",
  RECOVERY_REQUIRED: "RECOVERY_REQUIRED",
});

const hashScope = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const getScopedKey = (baseKey, context = {}) => {
  const sessionId = context.sessionId ?? context.session ?? "anonymous";
  const gameId = context.recoveryGameId ?? context.gameId;
  if (!gameId) return null;
  return `${baseKey}:${hashScope(`${sessionId}:${gameId}`)}`;
};

const safeJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readStorage = (key) => {
  if (!key) return null;
  try {
    const value = safeJson(window.sessionStorage.getItem(key));
    if (value) memoryStore.set(key, value);
    return value ?? memoryStore.get(key) ?? null;
  } catch {
    return memoryStore.get(key) ?? null;
  }
};

const notifyRecoveryStateChanged = () => {
  window.dispatchEvent(new CustomEvent("hiranmandi:recovery-state-changed"));
};

const writeStorage = (key, value) => {
  if (!key) return;
  memoryStore.set(key, value);
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked inside partner iframes.
  }
  notifyRecoveryStateChanged();
};

const removeStorage = (key) => {
  if (!key) return;
  memoryStore.delete(key);
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked inside partner iframes.
  }
  notifyRecoveryStateChanged();
};

const isUnfinishedRound = (round) =>
  Boolean(
    round?.gameId &&
      round.operationStatus &&
      round.operationStatus !== ROUND_OPERATION_STATUS.ROUND_COMPLETED,
  );

export class StateRecoveryService {
  constructor() {
    removeStorage(LEGACY_PENDING_KEY);
    removeStorage(LEGACY_GAME_STATE_KEY);
  }

  rememberPendingRequest(request, context = {}) {
    const pending = {
      ...request,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    writeStorage(getScopedKey(PENDING_KEY, context), pending);
    return pending;
  }

  markRecoveryRequired(error, patch = {}, context = {}) {
    const pending = this.getPendingRequest(context);
    if (!pending) return null;
    const next = {
      ...pending,
      ...patch,
      status: "recovery-required",
      errorCode: error?.code ?? "UNKNOWN",
      errorMessage: error?.message ?? "Operation result is unknown",
      updatedAt: new Date().toISOString(),
    };
    writeStorage(getScopedKey(PENDING_KEY, context), next);
    return next;
  }

  completePendingRequest(requestId, context = {}) {
    const pending = this.getPendingRequest(context);
    if (!pending || (requestId && pending.requestId !== requestId)) return;
    removeStorage(getScopedKey(PENDING_KEY, context));
  }

  getPendingRequest(context = {}) {
    return readStorage(getScopedKey(PENDING_KEY, context));
  }

  saveGameState(state = {}, context = {}) {
    writeStorage(getScopedKey(GAME_STATE_KEY, context), {
      ...state,
      savedAt: new Date().toISOString(),
    });
  }

  saveLastSpin(snapshot = {}, context = {}) {
    const grid = snapshot.grid;
    if (!grid?.A?.length || !grid?.B?.length || !grid?.C?.length) return null;
    const value = { ...snapshot, savedAt: new Date().toISOString() };
    writeStorage(getScopedKey(LAST_SPIN_KEY, context), value);
    return value;
  }

  getLastSpin(context = {}) {
    return readStorage(getScopedKey(LAST_SPIN_KEY, context));
  }

    saveRound(round = {}, context = {}) {
    const gameId = context.recoveryGameId ?? context.gameId ?? round.gameId;
    if (!gameId) return null;
    const current = this.getLocalState({ ...context, recoveryGameId: gameId }) ?? {};
    const next = {
      ...current, ...round, gameId,
      idCard: round.idCard ?? round.roundId ?? current.idCard ?? current.roundId ?? null,
      roundId: round.roundId ?? round.idCard ?? current.roundId ?? current.idCard ?? null,
      requestId: round.requestId ?? current.requestId ?? null,
      WasDouble: Number(round.WasDouble ?? round.wasDouble ?? current.WasDouble ?? 0),
      // A processing snapshot must never erase the last completed board.
      lastConfirmedGrid: round.lastConfirmedGrid ?? current.lastConfirmedGrid ?? round.grid ?? current.grid ?? null,
      lastConfirmedSpinResult: round.lastConfirmedSpinResult ?? current.lastConfirmedSpinResult ?? round.spinResult ?? current.spinResult ?? null,
      operationStatus: round.operationStatus ?? current.operationStatus ?? ROUND_OPERATION_STATUS.WAITING_FOR_PLAYER_ACTION,
      savedAt: new Date().toISOString(),
    };
    writeStorage(getScopedKey(GAME_STATE_KEY, { ...context, recoveryGameId: gameId }), next);
    return next;
  }

  markRoundRecoveryRequired(error, patch = {}, context = {}) {
    return this.saveRound({ ...patch, operationStatus: ROUND_OPERATION_STATUS.RECOVERY_REQUIRED, recoveryError: { code: error?.code ?? "UNKNOWN", message: error?.message ?? "Operation result is unknown" } }, context);
  }

  completeRound(context = {}) { this.clearLocalState(context); }

  getLocalState(context = {}) {
    return readStorage(getScopedKey(GAME_STATE_KEY, context));
  }

  clearLocalState(context = {}) {
    removeStorage(getScopedKey(GAME_STATE_KEY, context));
  }

  getActiveRounds() {
    const recoveredByKey = new Map(memoryStore);
    try {
      for (let index = 0; index < window.sessionStorage.length; index += 1) {
        const key = window.sessionStorage.key(index);
        if (!key?.startsWith(GAME_STATE_KEY + ":")) continue;
        const value = safeJson(window.sessionStorage.getItem(key));
        if (value) recoveredByKey.set(key, value);
      }
    } catch {
      // The in-memory snapshots remain available when iframe storage is blocked.
    }

    return [...recoveredByKey.values()]
      .filter(isUnfinishedRound)
      .sort(
        (left, right) =>
          Date.parse(right.savedAt ?? 0) - Date.parse(left.savedAt ?? 0),
      );
  }

  hasActiveRound(gameId) {
    return this.getActiveRounds().some((round) => round.gameId === gameId);
  }

  buildCorrelation(context = {}, operation = {}) {
    return {
      requestId: operation.requestId ?? null,
      roundId: operation.roundId ?? operation.idCard ?? null,
      gameId: context.recoveryGameId ?? context.gameId ?? operation.gameId ?? null,
      idCard: operation.idCard ?? null,
      methodName: operation.methodName ?? null,
    };
  }

  async recoverAfterTimeout({ request, recoveryClient, context = {} } = {}) {
    const pending = request ?? this.getPendingRequest(context);
    if (!pending) return { status: "none" };

    if (typeof recoveryClient === "function") {
      const recovered = await recoveryClient(pending);
      this.completePendingRequest(pending.requestId, context);
      return { status: "recovered", pending, recovered };
    }

    return {
      status: "unavailable",
      pending,
      message: "No backend recovery endpoint is configured; blind retry is disabled.",
    };
  }
}

export const stateRecoveryService = new StateRecoveryService();