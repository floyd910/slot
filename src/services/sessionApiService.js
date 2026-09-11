import { games, combinations, initialGrid } from "../data/mockData.js";
import {
  getGames as getMockGames,
  getPaytable as getMockPaytable,
} from "../api/mockSlotBackend.js";
import {
  getSessionApiBaseUrl,
  mergeRuntimeConfig,
} from "../api/runtimeConfig.js";

import { resolveApiGameId } from "../api/gameApiIds.js";

const buildApiUrl = (path) =>
  `${getSessionApiBaseUrl().replace(/\/$/, "")}${path}`;

const requestRemoteSession = async (params) => {
  const playerId = params.playerId ?? params.userId ?? params.idUser;
  const gameId = resolveApiGameId(params);
  const response = await fetch(buildApiUrl("/init"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({ token: params.token, gameId, playerId }),
  });

  if (!response.ok) {
    const error = new Error(`Session API returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  if (!payload?.sessionId) {
    const error = new Error("Session API response is missing sessionId");
    error.code = "INVALID_SESSION";
    throw error;
  }
  return payload;
};

const validateSessionContext = (params = {}) => {
  if (params.initSource !== "postMessage") {
    throw Object.assign(new Error("Parent initialization is required"), { code: "ACCESS_DENIED" });
  }
  if (params.maintenance) {
    const error = new Error("Maintenance mode");
    error.code = "MAINTENANCE";
    throw error;
  }
  if (!params.token) {
    const error = new Error("Missing token parameter");
    error.code = "ACCESS_DENIED";
    throw error;
  }
  if (!(params.playerId ?? params.userId ?? params.idUser)) {
    const error = new Error("Missing playerId parameter");
    error.code = "CONFIGURATION_ERROR";
    throw error;
  }
  if (!params.gameId) {
    const error = new Error("Missing gameId parameter");
    error.code = "CONFIGURATION_ERROR";
    throw error;
  }
};

export class SessionApiService {
  async initSession(params = {}) {
    mergeRuntimeConfig(params);
    validateSessionContext(params);

    const remote = await requestRemoteSession(params);
    const balance = remote.balance;
    if ((typeof balance !== "number" && typeof balance !== "string") || String(balance).trim() === "" || !Number.isFinite(Number(balance)) || Number(balance) < 0 || typeof remote.currency !== "string" || !remote.currency.trim()) {
      throw Object.assign(new Error("Session response is missing a valid balance or currency"), { code: "BACKEND_RESPONSE_ERROR" });
    }
    const playerId = remote.playerId ?? params.playerId ?? params.userId ?? params.idUser;
    mergeRuntimeConfig({ ...params, sessionId: remote.sessionId, playerId, userId: playerId, idUser: playerId });
    return {
      sessionId: remote.sessionId,
      player: { id: playerId, balance: Number(balance), currency: remote.currency },
      games, combinations, grid: initialGrid,
      backendGameId: remote.backendGameId ?? null,
      unfinishedRound: remote.unfinishedRound ?? null,
    };
  }

  async getGames() {
    return getMockGames();
  }

  async getPaytable() {
    return getMockPaytable();
  }
}

export const sessionApiService = new SessionApiService();