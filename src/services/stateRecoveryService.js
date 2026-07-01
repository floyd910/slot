const PENDING_KEY = "hiranmandi-frame:pending-operation:v1";
const GAME_STATE_KEY = "hiranmandi-frame:game-state:v1";

const safeJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readStorage = (key) => {
  try {
    return safeJson(window.sessionStorage.getItem(key));
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked inside partner iframes.
  }
};

const removeStorage = (key) => {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Storage can be blocked inside partner iframes.
  }
};

export class StateRecoveryService {
  rememberPendingRequest(request) {
    const pending = {
      ...request,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    writeStorage(PENDING_KEY, pending);
    return pending;
  }

  markRecoveryRequired(error, patch = {}) {
    const pending = this.getPendingRequest();
    if (!pending) return null;
    const next = {
      ...pending,
      ...patch,
      status: "recovery-required",
      errorCode: error?.code ?? "UNKNOWN",
      errorMessage: error?.message ?? "Operation result is unknown",
      updatedAt: new Date().toISOString(),
    };
    writeStorage(PENDING_KEY, next);
    return next;
  }

  completePendingRequest(requestId) {
    const pending = this.getPendingRequest();
    if (!pending || (requestId && pending.requestId !== requestId)) return;
    removeStorage(PENDING_KEY);
  }

  getPendingRequest() {
    return readStorage(PENDING_KEY);
  }

  saveGameState(state = {}) {
    writeStorage(GAME_STATE_KEY, {
      ...state,
      savedAt: new Date().toISOString(),
    });
  }

  getLocalState() {
    return readStorage(GAME_STATE_KEY);
  }

  clearLocalState() {
    removeStorage(GAME_STATE_KEY);
  }

  buildCorrelation(context = {}, operation = {}) {
    return {
      requestId: operation.requestId ?? null,
      roundId: operation.roundId ?? operation.idCard ?? null,
      sessionId: context.sessionId ?? operation.sessionId ?? null,
      gameId: context.gameId ?? operation.gameId ?? null,
      idCard: operation.idCard ?? null,
      methodName: operation.methodName ?? null,
    };
  }

  async recoverAfterTimeout({ request, recoveryClient } = {}) {
    const pending = request ?? this.getPendingRequest();
    if (!pending) return { status: "none" };

    if (typeof recoveryClient === "function") {
      const recovered = await recoveryClient(pending);
      this.completePendingRequest(pending.requestId);
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