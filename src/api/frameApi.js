import { gameApiService } from "../services/gameApiService.js";
import { sessionApiService } from "../services/sessionApiService.js";
import { stateRecoveryService } from "../services/stateRecoveryService.js";

export const frameApi = {
  initSession(params) {
    return sessionApiService.initSession(params);
  },

  getGames() {
    return sessionApiService.getGames();
  },

  getPaytable() {
    return sessionApiService.getPaytable();
  },

  spin(params) {
    return gameApiService.spin(params);
  },

  double(params) {
    return gameApiService.double(params);
  },

  pay(params) {
    return gameApiService.pay(params);
  },

  recoverState() {
    return gameApiService.recoverState();
  },

  recoverAfterTimeout(options) {
    return gameApiService.recoverAfterTimeout(options);
  },

  getPendingRequest() {
    return stateRecoveryService.getPendingRequest();
  },
};