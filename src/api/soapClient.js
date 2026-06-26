import { wait } from "../utils/async.js";
import { getSoapEndpoint } from "./runtimeConfig.js";

export const GAME_NUMERIC_ID = "36";
export const BACKEND_TEST_PARAMS = {
  idPartner: "1",
  idKassi: "70",
  idValute: "1",
  sum: "10",
  lines: "10",
  idGame: "36",
};

const SOAP_NAMESPACE = "urn:InBetIntf-IInBet";
const SOAP_ACTION = `${SOAP_NAMESPACE}#GetMessage`;

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

const parseXml = (xml, label = "SOAP response") => {
  const document = new DOMParser().parseFromString(String(xml ?? ""), "text/xml");
  const errorNode = document.querySelector("parsererror");
  if (errorNode) {
    const error = new Error(`Invalid ${label}`);
    error.code = "NETWORK_ERROR";
    throw error;
  }
  return document;
};

export const findNode = (document, localName) =>
  Array.from(document.getElementsByTagName("*")).find(
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

const throwBackendErrorIfPresent = (document) => {
  const errorAttrs = readAttributes(document, "Error");
  if (!Object.keys(errorAttrs).length) return;
  const message = errorAttrs.ErrorType || "Backend returned an error";
  const error = new Error(message);
  error.code = "BACKEND_ERROR";
  error.backendErrorId = errorAttrs.ErrorId;
  throw error;
};

const buildSoapEnvelope = (innerXml) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/">
  <soap:Body soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <GetMessage xmlns="${SOAP_NAMESPACE}">
      <Value xsi:type="xsd:string">${xmlEscape(innerXml)}</Value>
    </GetMessage>
  </soap:Body>
</soap:Envelope>`;

export const callSoap = async (messageXml) => {
  const response = await fetch(getSoapEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: SOAP_ACTION,
    },
    body: buildSoapEnvelope(messageXml),
  });

  if (!response.ok) {
    const error = new Error(`SOAP request failed with ${response.status}`);
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const soapText = await response.text();
  const soapDocument = parseXml(soapText, "SOAP envelope");
  const fault = findNode(soapDocument, "Fault");
  if (fault) {
    const faultText = findNode(fault, "faultstring")?.textContent ?? "SOAP fault";
    const error = new Error(faultText);
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const returnNode = findNode(soapDocument, "return");
  const payload = returnNode?.textContent?.trim();
  if (!payload) {
    const error = new Error("SOAP response did not include a return payload");
    error.code = "NETWORK_ERROR";
    throw error;
  }
  const payloadDocument = parseXml(payload, "game payload");
  throwBackendErrorIfPresent(payloadDocument);
  return payloadDocument;
};

export const callSoapWithRetry = async (messageXml, attempts = 2) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await callSoap(messageXml);
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await wait(450);
    }
  }
  throw lastError;
};
