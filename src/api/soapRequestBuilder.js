import { asNumber } from "../utils/number.js";
import {
  getBackendTestParams,
  getRuntimeConfig,
  useBackendTestParams,
} from "./runtimeConfig.js";
import { SOAP_CONTRACT_VERSION } from "./soapContract.js";
import {
  GAME_NUMERIC_ID,
  formatSoapDateTime,
  xmlEscape,
} from "./soapClient.js";

const readConfigValue = (...values) =>
  values.find((value) => value != null && value !== "");

const configurationError = (field) => {
  const error = new Error(`Missing required SOAP configuration: ${field}`);
  error.code = "CONFIGURATION_ERROR";
  return error;
};

const requireConfigValue = (config, field, ...aliases) => {
  const value = readConfigValue(
    config[field],
    ...aliases.map((alias) => config[alias]),
  );
  if (value == null || value === "") throw configurationError(field);
  return value;
};

const getSoapRequestConfig = () => {
  const runtime = getRuntimeConfig();
  const test = useBackendTestParams() ? getBackendTestParams() : {};
  return { ...runtime, ...test };
};

const messageAttributes = (messageType) =>
  `MessageType="${messageType}" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="${SOAP_CONTRACT_VERSION}"`;

export const buildSpinRequest = ({ stake, lines, isDemo, isFreeSpin } = {}) => {
  const config = getSoapRequestConfig();
  const freeSpin = Boolean(isFreeSpin);
  const sum = asNumber(stake, 0);
  const selectedLines = asNumber(lines, 0);
  if (!(sum >= 0)) throw configurationError("stake");
  if (!(selectedLines > 0)) throw configurationError("lines");

  const spin = {
    idPartner: requireConfigValue(config, "idPartner", "partnerId"),
    idKassi: requireConfigValue(config, "idKassi"),
    idValute: requireConfigValue(config, "idValute"),
    sum,
    selectedLines,
    idUser: requireConfigValue(config, "idUser", "userId"),
    login: requireConfigValue(config, "login"),
    password: requireConfigValue(config, "password"),
    idGame: readConfigValue(config.backendGameId, config.idGame, GAME_NUMERIC_ID),
  };

  const spinAttributes = [
    ["idPartner", spin.idPartner],
    ["idKassi", spin.idKassi],
    ["idValute", spin.idValute],
    ["Sum", spin.sum],
    ["Lines", spin.selectedLines],
    ["idUser", spin.idUser],
    ["Login", spin.login],
    ["Password", spin.password],
    ["idGame", spin.idGame],
    ["DemoSpin", freeSpin ? "0" : isDemo ? "1" : "0"],
    ["FreeSpin", freeSpin ? "1" : "0"],
  ]
    .map(([key, value]) => `${key}="${xmlEscape(value)}"`)
    .join(" ");

  const methodName = "SetSlotSpinHiranmandiFrame";
  return {
    methodName,
    stake: sum,
    lines: selectedLines,
    contractVersion: SOAP_CONTRACT_VERSION,
    xml: `<message ${messageAttributes(methodName)}><Spin ${spinAttributes} /></message>`,
  };
};

export const buildDoubleRequest = ({ idCard, wasDouble, sum } = {}) => {
  const config = getSoapRequestConfig();
  const methodName = "GetSlotDubleHiranmandi";
  const idPartner = requireConfigValue(config, "idPartner", "partnerId");
  if (idCard == null || idCard === "") throw configurationError("idCard");
  if (wasDouble == null || wasDouble === "") throw configurationError("wasDouble");

  return {
    methodName,
    idCard,
    wasDouble,
    contractVersion: SOAP_CONTRACT_VERSION,
    xml: `<message ${messageAttributes(methodName)}><Spin idPartner="${xmlEscape(idPartner)}" idCard="${xmlEscape(idCard)}" WasDouble="${xmlEscape(wasDouble)}" Sum="${xmlEscape(sum)}" /></message>`,
  };
};

export const buildPayRequest = ({ idCard } = {}) => {
  const methodName = "PaySlotHiranmandiFrame";
  if (idCard == null || idCard === "") throw configurationError("idCard");
  return {
    methodName,
    idCard,
    contractVersion: SOAP_CONTRACT_VERSION,
    xml: `<message ${messageAttributes(methodName)}><Pay idCard="${xmlEscape(idCard)}" /></message>`,
  };
};