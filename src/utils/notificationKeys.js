// Backend diagnostics stay internal; UI messages are stable localization keys.
export const notificationErrorKeys = {
  "BET_REJECTED": "betRejected",
  "INSUFFICIENT_FUNDS": "insufficientBalance",
  "GAME_NOT_FOUND": "gameNotFound",
  "COLLECTION_UNAVAILABLE": "collectionUnavailable",
  "ACCESS_DENIED": "authenticationFailed",
  "BAD_REQUEST": "requestFailed",
  "UNAUTHORIZED": "loginRequired",
  "FORBIDDEN": "accessDenied",
  "INVALID_SESSION": "invalidSession",
  "SESSION_EXPIRED": "sessionExpired",
  "TIMEOUT": "serverTimeout",
  "NETWORK_ERROR": "networkError",
  "NETWORK_UNREACHABLE": "networkError",
  "BACKEND_UNAVAILABLE": "serverUnavailable",
  "SERVER_ERROR": "serverUnavailable",
  "REQUEST_IN_PROGRESS": "processing",
  "CONFIGURATION_ERROR": "configurationError",
  "BACKEND_RESPONSE_ERROR": "invalidBackendResponse",
  "RECOVERY_REQUIRED": "operationPendingRecovery",
  "PARTNER_TIMEOUT": "partnerUnavailable",
  "PARTNER_UNAVAILABLE": "partnerUnavailable",
  "MAINTENANCE": "maintenance"
};
export function notificationKey(value, dictionaries, fallback = 'requestFailed') {
 if (!value) return '';
 if (value.code && notificationErrorKeys[value.code]) return notificationErrorKeys[value.code];
 const status = Number(value.status ?? value.details?.status);
 if (status === 401) return 'authenticationFailed';
 if (status === 403) return 'accessDenied';
 if (status === 404) return 'gameNotFound';
 if (status >= 500) return 'serverUnavailable';
 const message = typeof value === 'string' ? value : value.message;
 for (const copy of Object.values(dictionaries)) {
  if (Object.hasOwn(copy, message)) return message;
  const match = Object.entries(copy).find(([, text]) => text === message);
  if (match) return match[0];
 }
 return fallback;
}
