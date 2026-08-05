import { gameApiService } from "../services/gameApiService.js";
import { sessionApiService } from "../services/sessionApiService.js";
import { stateRecoveryService } from "../services/stateRecoveryService.js";
import { apiErrorHandler } from "./apiErrorHandler.js";

let activeMutation = null;

const run = (operation, request) => apiErrorHandler.execute(operation, request);

const runExclusive = (operation, request) => {
  if (activeMutation) {
    return Promise.reject(
      apiErrorHandler.normalize(
        Object.assign(new Error("Request already in progress"), {
          code: "REQUEST_IN_PROGRESS",
        }),
        operation,
      ),
    );
  }

  const pending = run(operation, request);
  activeMutation = pending;
  return pending.finally(() => {
    if (activeMutation === pending) activeMutation = null;
  });
};

export const frameApi = {
  initSession(params) {
    return run("initSession", () => sessionApiService.initSession(params));
  },

  getGames() {
    return run("getGames", () => sessionApiService.getGames());
  },

  getPaytable() {
    return run("getPaytable", () => sessionApiService.getPaytable());
  },

  spin(params) {
    return runExclusive("spin", () => gameApiService.spin(params));
  },

  double(params) {
    return runExclusive("double", () => gameApiService.double(params));
  },

  pay(params) {
    return runExclusive("pay", () => gameApiService.pay(params));
  },

  recoverState() {
    return gameApiService.recoverState();
  },

  recoverAfterTimeout(options) {
    return runExclusive("recoverState", () => gameApiService.recoverAfterTimeout(options));
  },

  getPendingRequest() {
    return stateRecoveryService.getPendingRequest();
  },
};