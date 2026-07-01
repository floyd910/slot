import {
  createSession,
  getGames as getMockGames,
  getPaytable as getMockPaytable,
} from "../api/mockSlotBackend.js";
import { mergeRuntimeConfig } from "../api/runtimeConfig.js";

const validateSessionContext = (params = {}) => {
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
  if (!params.sessionId) {
    const error = new Error("Missing sessionId parameter");
    error.code = "INVALID_SESSION";
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
    return createSession(params);
  }

  async getGames() {
    return getMockGames();
  }

  async getPaytable() {
    return getMockPaytable();
  }
}

export const sessionApiService = new SessionApiService();