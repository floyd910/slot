import { REQUEST_TIMEOUT_MS } from "../config/gameSettings.js";

export const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const withTimeout = (promise, label, timeoutMs = REQUEST_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        const error = new Error(`${label} timed out`);
        error.code = "TIMEOUT";
        reject(error);
      }, timeoutMs);
    }),
  ]);
