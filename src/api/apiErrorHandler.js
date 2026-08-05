const STATUS_CODES = new Map([
  [400, "BAD_REQUEST"],
  [401, "UNAUTHORIZED"],
  [403, "FORBIDDEN"],
  [408, "TIMEOUT"],
]);

const PUBLIC_MESSAGES = {
  BAD_REQUEST: "The request could not be processed.",
  UNAUTHORIZED: "Authorization is required.",
  FORBIDDEN: "Access is forbidden.",
  INVALID_SESSION: "The session is invalid or has expired.",
  SESSION_EXPIRED: "The session is invalid or has expired.",
  TIMEOUT: "The server did not respond in time.",
  NETWORK_ERROR: "A network error occurred.",
  NETWORK_UNREACHABLE: "The network is unavailable.",
  BACKEND_UNAVAILABLE: "The server is temporarily unavailable.",
  REQUEST_IN_PROGRESS: "Please wait for the current operation to finish.",
  CONFIGURATION_ERROR: "The application configuration is invalid.",
};

const inferCode = (error) => {
  if (error?.code) return error.code;
  const status = Number(error?.status ?? error?.details?.status);
  if (STATUS_CODES.has(status)) return STATUS_CODES.get(status);
  if (status >= 500) return "SERVER_ERROR";
  return navigator.onLine ? "NETWORK_ERROR" : "NETWORK_UNREACHABLE";
};

export class ApiErrorHandler {
  normalize(error, operation = "request") {
    const code = inferCode(error);
    const normalized = new Error(
      PUBLIC_MESSAGES[code] ?? "The server could not complete the request.",
      { cause: error },
    );
    normalized.name = "ApiError";
    normalized.code = code;
    normalized.operation = operation;
    normalized.requestId = error?.requestId ?? null;
    normalized.status = error?.status ?? error?.details?.status ?? null;
    return normalized;
  }

  async execute(operation, request) {
    try {
      return await request();
    } catch (error) {
      throw this.normalize(error, operation);
    }
  }
}

export const apiErrorHandler = new ApiErrorHandler();