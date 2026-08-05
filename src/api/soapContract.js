import { createSoapError } from "./soapFaultParser.js";

export const SOAP_CONTRACT_VERSION = "1.0";
export const SUPPORTED_SOAP_CONTRACT_VERSIONS = new Set([
  SOAP_CONTRACT_VERSION,
]);

const getMessageNode = (document) => {
  const root = document?.documentElement;
  if (root?.localName?.toLowerCase() === "message") return root;
  return Array.from(document?.getElementsByTagName?.("*") ?? []).find(
    (node) => node.localName?.toLowerCase() === "message",
  );
};

export const validateSoapContract = (document, meta = {}) => {
  const message = getMessageNode(document);
  if (!message) {
    throw createSoapError({
      ...meta,
      code: "SOAP_CONTRACT_INVALID",
      message: "SOAP payload does not contain a message contract",
    });
  }

  const version = message.getAttribute("MessageFormatVersion");
  if (!version) {
    throw createSoapError({
      ...meta,
      code: "SOAP_CONTRACT_VERSION_MISSING",
      message: "SOAP payload does not declare MessageFormatVersion",
    });
  }
  if (!SUPPORTED_SOAP_CONTRACT_VERSIONS.has(version)) {
    throw createSoapError({
      ...meta,
      code: "SOAP_CONTRACT_VERSION_UNSUPPORTED",
      message: "Unsupported SOAP contract version",
      details: { receivedVersion: version, supportedVersions: [...SUPPORTED_SOAP_CONTRACT_VERSIONS] },
    });
  }

  return {
    messageType: message.getAttribute("MessageType") ?? "",
    version,
  };
};