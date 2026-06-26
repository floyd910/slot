import { RETRYABLE_CODES } from "../config/gameSettings.js";

export const normalizeRuntimeStatus = (error) => {
  if (!navigator.onLine) return "network-error";
  if (error?.code === "MAINTENANCE") return "maintenance";
  if (error?.code === "INVALID_SESSION") return "invalid-session";
  if (error?.code === "ACCESS_DENIED") return "access-denied";
  if (error?.code === "SESSION_EXPIRED") return "session-expired";
  if (error?.code === "CONFIGURATION_ERROR") return "configuration-error";
  if (RETRYABLE_CODES.has(error?.code)) return "network-error";
  return "error";
};
