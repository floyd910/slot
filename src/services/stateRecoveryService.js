const LEGACY_PENDING_KEY = "hiranmandi-frame:pending-operation:v1";
const LEGACY_GAME_STATE_KEY = "hiranmandi-frame:game-state:v1";
const PENDING_KEY = "hiranmandi-frame:pending-operation:v2";
const GAME_STATE_KEY = "hiranmandi-frame:game-state:v2";

const hashScope = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const getScopedKey = (baseKey, context = {}) => {
  const sessionId = context.sessionId ?? context.session;
  const gameId = context.recoveryGameId ?? context.gameId;
  if (!sessionId || !gameId) return null;
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
    return safeJson(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  if (!key) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked inside partner iframes.
  }
};

const removeStorage = (key) => {
  if (!key) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked inside partner iframes.
  }
};

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

  getLocalState(context = {}) {
    return readStorage(getScopedKey(GAME_STATE_KEY, context));
  }

  clearLocalState(context = {}) {
    removeStorage(getScopedKey(GAME_STATE_KEY, context));
  }

  buildCorrelation(context = {}, operation = {}) {
    return {
      requestId: operation.requestId ?? null,
      roundId: operation.roundId ?? operation.idCard ?? null,
      gameId: context.gameId ?? operation.gameId ?? null,
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