import { REQUEST_TIMEOUT_MS } from "../config/gameSettings.js";
import { wait } from "../utils/async.js";
import { getSoapEndpoint } from "./runtimeConfig.js";
import {
  createSoapError,
  normalizeTransportError,
  parseSoapError,
} from "./soapFaultParser.js";

export const GAME_NUMERIC_ID = "36";

const SOAP_NAMESPACE = "urn:InBetIntf-IInBet";
const SOAP_ACTION = `${SOAP_NAMESPACE}#GetMessage`;
const RETRYABLE_CODES = new Set(["NETWORK_ERROR", "NETWORK_UNREACHABLE", "BACKEND_UNAVAILABLE", "TIMEOUT"]);

export const formatSoapDateTime = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const parseXml = (xml, label = "SOAP response", meta = {}) => {
  const document = new DOMParser().parseFromString(String(xml ?? ""), "text/xml");
  const parserError = parseSoapError(document, meta);
  if (parserError?.code === "XML_PARSE_ERROR") {
    parserError.message = `Invalid ${label}`;
    throw parserError;
  }
  return document;
};

export const findNode = (document, localName) =>
  Array.from(document?.getElementsByTagName?.("*") ?? []).find(
    (node) => node.localName === localName,
  );

export const readAttributes = (document, localName) => {
  const node = findNode(document, localName);
  if (!node) return {};
  return Array.from(node.attributes).reduce((attrs, attribute) => {
    attrs[attribute.name] = attribute.value;
    return attrs;
  }, {});
};

const buildSoapEnvelope = (innerXml) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
  <soap:Body soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <GetMessage xmlns="${SOAP_NAMESPACE}">
      <Value xsi:type="xsd:string">${xmlEscape(innerXml)}</Value>
    </GetMessage>
  </soap:Body>
</soap:Envelope>`;

const logSoap = (event, meta, payload = {}) => {
  const entry = {
    event,
    requestId: meta.requestId ?? null,
    sessionId: meta.sessionId ?? null,
    gameId: meta.gameId ?? null,
    methodName: meta.methodName ?? null,
    idCard: meta.idCard ?? null,
    roundId: meta.roundId ?? null,
    timestamp: new Date().toISOString(),
    ...payload,
  };
  window.__HIRANMANDI_SOAP_LOG__ = [
    ...(window.__HIRANMANDI_SOAP_LOG__ ?? []),
    entry,
  ].slice(-80);
  if (import.meta.env?.DEV) console.info("[soap]", entry);
};

const shouldRetry = (error) => RETRYABLE_CODES.has(error?.code);

export class SoapClient {
  constructor({ endpointResolver = getSoapEndpoint, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    this.endpointResolver = endpointResolver;
    this.timeoutMs = timeoutMs;
  }

  async sendSoapRequest(methodName, xmlBody, options = {}) {
    const attempts = Math.max(1, Number(options.retryAttempts ?? 1));
    const meta = {
      ...options.meta,
      methodName,
      requestId: options.requestId ?? options.meta?.requestId,
      sessionId: options.sessionId ?? options.meta?.sessionId,
      gameId: options.gameId ?? options.meta?.gameId,
      idCard: options.idCard ?? options.meta?.idCard,
      roundId: options.roundId ?? options.meta?.roundId,
    };

    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.#sendOnce(methodName, xmlBody, {
          ...options,
          meta,
          attempt,
          attempts,
        });
      } catch (error) {
        lastError = normalizeTransportError(error, meta);
        logSoap("error", meta, {
          attempt,
          code: lastError.code,
          message: lastError.message,
        });
        if (attempt >= attempts || !shouldRetry(lastError)) break;
        await wait(options.retryDelayMs ?? 450);
      }
    }
    throw lastError;
  }

  async #sendOnce(methodName, xmlBody, options) {
    const endpoint = this.endpointResolver();
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    const meta = options.meta ?? {};
    const envelope = buildSoapEnvelope(xmlBody);

    logSoap("request", meta, { endpoint, attempt: options.attempt, attempts: options.attempts });
    window.__HIRANMANDI_LAST_SOAP_REQUEST__ = xmlBody;

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: SOAP_ACTION,
        },
        body: envelope,
        signal: controller.signal,
      });
    } catch (error) {
      throw normalizeTransportError(error, meta);
    } finally {
      window.clearTimeout(timeout);
    }

    if (!response.ok) {
      throw createSoapError({
        ...meta,
        code: response.status >= 500 ? "BACKEND_UNAVAILABLE" : "NETWORK_ERROR",
        message: `SOAP request failed with ${response.status}`,
        details: { status: response.status, statusText: response.statusText },
      });
    }

    const soapText = await response.text();
    const soapDocument = parseXml(soapText, "SOAP envelope", meta);
    const soapFault = parseSoapError(soapDocument, meta);
    if (soapFault) throw soapFault;

    const returnNode = findNode(soapDocument, "return");
    const payload = returnNode?.textContent?.trim();
    if (!payload) {
      throw createSoapError({
        ...meta,
        code: "BACKEND_RESPONSE_ERROR",
        message: "SOAP response did not include a return payload",
      });
    }

    const payloadDocument = parseXml(payload, "game payload", meta);
    const businessError = parseSoapError(payloadDocument, meta);
    if (businessError) throw businessError;

    window.__HIRANMANDI_LAST_SOAP_RESPONSE__ = payload;
    logSoap("response", meta, { attempt: options.attempt });

    return {
      methodName,
      payload,
      payloadDocument,
      soapDocument,
      soapText,
      meta,
    };
  }
}

export const soapClient = new SoapClient();

export const sendSoapRequest = (methodName, xmlBody, options) =>
  soapClient.sendSoapRequest(methodName, xmlBody, options);

export const callSoap = async (messageXml, options = {}) => {
  const response = await sendSoapRequest(options.methodName ?? "GetMessage", messageXml, options);
  return response.payloadDocument;
};

export const callSoapWithRetry = async (messageXml, attempts = 2, options = {}) => {
  const response = await sendSoapRequest(options.methodName ?? "GetMessage", messageXml, {
    ...options,
    retryAttempts: attempts,
  });
  return response.payloadDocument;
};
