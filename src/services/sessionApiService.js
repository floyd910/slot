import { requestFreeSpins } from "../api/freeSpinsApiClient.js";
import { isDemoContext } from "../api/demoLaunch.js";
import { buildAuthHeaders } from "../api/authHeaders.js";
import { mapInitGameState } from "../api/initGameState.js";
import { requestBalance } from "../api/balanceApiClient.js";
import { games, combinations, getInitialGrid } from "../data/mockData.js";
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
    headers: buildAuthHeaders(params.token),
    body: new URLSearchParams({ gameId, playerId }),
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
  if (params.initSource !== "postMessage" && !isDemoContext(params)) {
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
    const playerId = params.playerId ?? params.userId ?? params.idUser;
    const gameState = mapInitGameState(remote.gameState, params);
    const wallet = await requestBalance({ token: params.token, playerId });
    // No last-spin snapshot means there is no spin history to refresh yet.
    const freeSpinsLeft = gameState ? await requestFreeSpins(params) : 0;
    if (gameState) gameState.freeSpinsLeft = freeSpinsLeft;
    mergeRuntimeConfig({ ...params, sessionId: remote.sessionId, playerId, userId: playerId, idUser: playerId });
    return {
      sessionId: remote.sessionId,
      player: { id: playerId, balance: wallet.balance, currency: wallet.currency },
      games, combinations, grid: gameState?.grid ?? getInitialGrid(params.recoveryGameId ?? params.gameId),
      gameState,
      freeSpinsLeft,
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