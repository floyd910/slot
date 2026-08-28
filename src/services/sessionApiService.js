import {
  createSession,
  getGames as getMockGames,
  getPaytable as getMockPaytable,
} from "../api/mockSlotBackend.js";
import { getSoapEndpoint, mergeRuntimeConfig, useSoapBackend } from "../api/runtimeConfig.js";

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
  if (useSoapBackend()) {
    const requiredSoapFields = [
      ["idPartner", params.idPartner ?? params.partnerId],
      ["idKassi", params.idKassi],
      ["idValute", params.idValute],
      ["idUser", params.idUser ?? params.userId],
      ["login", params.login],
      ["password", params.password],
    ];
    const missingSoapFields = requiredSoapFields
      .filter(([, value]) => value == null || value === "")
      .map(([field]) => field);
    if (missingSoapFields.length) {
      const error = new Error(
        `Missing required SOAP context: ${missingSoapFields.join(", ")}`,
      );
      error.code = "CONFIGURATION_ERROR";
      throw error;
    }
    const endpoint = new URL(getSoapEndpoint(), window.location.origin);
    if (import.meta.env.PROD && endpoint.protocol !== "https:") {
      const error = new Error("Production backend must use HTTPS");
      error.code = "CONFIGURATION_ERROR";
      throw error;
    }
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