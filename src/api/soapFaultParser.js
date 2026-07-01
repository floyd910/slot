const nodeList = (document) => Array.from(document?.getElementsByTagName?.("*") ?? []);

const findNode = (document, localName) =>
  nodeList(document).find((node) => node.localName === localName);

const readAttributes = (node) =>
  Array.from(node?.attributes ?? []).reduce((attrs, attribute) => {
    attrs[attribute.name] = attribute.value;
    return attrs;
  }, {});

export const createSoapError = ({
  code = "NETWORK_ERROR",
  message = "SOAP request failed",
  methodName,
  requestId,
  sessionId,
  gameId,
  idCard,
  roundId,
  cause,
  details,
} = {}) => {
  const error = new Error(message);
  error.code = code;
  error.methodName = methodName;
  error.requestId = requestId;
  error.sessionId = sessionId;
  error.gameId = gameId;
  error.idCard = idCard;
  error.roundId = roundId;
  error.details = details;
  if (cause) error.cause = cause;
  return error;
};

export const parseSoapError = (document, meta = {}) => {
  if (!document) return null;

  const parserError = findNode(document, "parsererror");
  if (parserError) {
    return createSoapError({
      ...meta,
      code: "XML_PARSE_ERROR",
      message: "Broken XML received from SOAP backend",
      details: parserError.textContent?.trim(),
    });
  }

  const faultNode = findNode(document, "Fault");
  if (faultNode) {
    const faultString = findNode(faultNode, "faultstring")?.textContent?.trim();
    const faultCode = findNode(faultNode, "faultcode")?.textContent?.trim();
    return createSoapError({
      ...meta,
      code: "SOAP_FAULT",
      message: faultString || "SOAP backend returned a fault",
      details: { faultCode },
    });
  }

  const errorNode = findNode(document, "Error");
  if (errorNode) {
    const attrs = readAttributes(errorNode);
    const errorType = attrs.ErrorType ?? attrs.Type ?? attrs.Code;
    const message = attrs.Message ?? errorType ?? "Backend returned a business error";
    const normalizedCode = /session/i.test(message)
      ? "INVALID_SESSION"
      : /duplicate/i.test(message)
        ? "DUPLICATE_REQUEST"
        : "BACKEND_ERROR";

    return createSoapError({
      ...meta,
      code: normalizedCode,
      message,
      details: attrs,
    });
  }

  return null;
};

export const normalizeTransportError = (error, meta = {}) => {
  if (error?.code) {
    Object.assign(error, {
      methodName: error.methodName ?? meta.methodName,
      requestId: error.requestId ?? meta.requestId,
      sessionId: error.sessionId ?? meta.sessionId,
      gameId: error.gameId ?? meta.gameId,
      idCard: error.idCard ?? meta.idCard,
      roundId: error.roundId ?? meta.roundId,
    });
    return error;
  }

  if (error?.name === "AbortError") {
    return createSoapError({
      ...meta,
      code: "TIMEOUT",
      message: `${meta.methodName ?? "SOAP"} timed out`,
      cause: error,
    });
  }

  return createSoapError({
    ...meta,
    code: navigator.onLine ? "NETWORK_ERROR" : "NETWORK_UNREACHABLE",
    message: error?.message || "SOAP network request failed",
    cause: error,
  });
};