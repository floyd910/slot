const OPERATION_BY_METHOD = Object.freeze({
  "/spin": "SPIN",
  "/pay": "PAY",
  "/double": "DOUBLE",
  "/freespins": "FREESPIN",
  "/init": "INIT",
});

const normalizeOperation = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "UNKNOWN";
  return OPERATION_BY_METHOD[text.toLowerCase()] ?? text.replace(/^\//, "").toUpperCase();
};

const readableError = (error) => {
  if (!error) return null;
  if (typeof error === "string") return error;
  return {
    name: error.name ?? null,
    code: error.code ?? null,
    message: error.message ?? String(error),
    details: error.details ?? null,
    backendErrorCode: error.backendErrorCode ?? null,
  };
};

export const logGameError = ({
  error,
  operation,
  context = {},
  requestId,
  idCard,
  endpoint,
  response,
  timeout,
  reason,
  file,
} = {}) => {
  const resolvedOperation = normalizeOperation(
    operation ?? error?.operation ?? error?.methodName,
  );
  const resolvedRequestId = requestId ?? error?.requestId ?? null;
  const resolvedIdCard = idCard ?? error?.idCard ?? error?.roundId ?? null;
  const resolvedStatus = error?.status ?? error?.details?.status ?? null;
  const resolvedTimeout = timeout ?? error?.timeoutMs ??
    (error?.code === "TIMEOUT" || error?.name === "AbortError" ? true : false);
  const diagnostic = {
    gameId: error?.gameId ?? context.gameId ?? context.recoveryGameId ?? null,
    playerId: context.playerId ?? context.userId ?? context.idUser ?? null,
    requestId: resolvedRequestId,
    idCard: resolvedIdCard,
    operation: resolvedOperation,
    endpoint: endpoint ?? error?.endpoint ?? error?.methodName ?? null,
    status: resolvedStatus,
    response: response ?? error?.response ?? null,
    error: readableError(error),
    timeout: resolvedTimeout,
    reason: reason ?? error?.reason ?? error?.code ?? null,
    file: file ?? error?.file ?? null,
    message: error?.message ?? String(reason ?? "Unknown game error"),
  };
  const summary = [
    `[GAME_ERROR] operation=${diagnostic.operation}`,
    `requestId=${diagnostic.requestId ?? "null"}`,
    `idCard=${diagnostic.idCard ?? "null"}`,
    `status=${diagnostic.status ?? "null"}`,
    `reason=${diagnostic.reason ?? "unknown"}`,
  ].join(" ");
  console.error(summary, diagnostic);
  return diagnostic;
};