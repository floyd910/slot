import { asNumber } from "../utils/number.js";
import {
  getBackendTestParams,
  useBackendTestParams,
} from "./runtimeConfig.js";
import {
  GAME_NUMERIC_ID,
  formatSoapDateTime,
  xmlEscape,
} from "./soapClient.js";

const FRAME_SPIN_DEFAULTS = {
  idPartner: "1",
  idKassi: "70",
  idValute: "1",
  idUser: "1",
  login: "testslot",
  password: "1",
  idGame: GAME_NUMERIC_ID,
};

const readConfigValue = (...values) =>
  values.find((value) => value != null && value !== "");


const getSpinValue = (testParams, key, fallback) =>
  useBackendTestParams()
    ? readConfigValue(testParams[key], fallback, FRAME_SPIN_DEFAULTS[key])
    : fallback;

export const buildSpinRequest = ({ stake, lines, isDemo, isFreeSpin } = {}) => {
  const freeSpin = Boolean(isFreeSpin);
  const testParams = getBackendTestParams();
  const sum = getSpinValue(testParams, "sum", stake);
  const selectedLines = getSpinValue(testParams, "lines", lines);
  const spin = {
    idPartner: getSpinValue(testParams, "idPartner", FRAME_SPIN_DEFAULTS.idPartner),
    idKassi: getSpinValue(testParams, "idKassi", FRAME_SPIN_DEFAULTS.idKassi),
    idValute: getSpinValue(testParams, "idValute", FRAME_SPIN_DEFAULTS.idValute),
    sum,
    selectedLines,
    idUser: getSpinValue(testParams, "idUser", FRAME_SPIN_DEFAULTS.idUser),
    login: getSpinValue(testParams, "login", FRAME_SPIN_DEFAULTS.login),
    password: getSpinValue(testParams, "password", FRAME_SPIN_DEFAULTS.password),
    idGame: getSpinValue(testParams, "idGame", FRAME_SPIN_DEFAULTS.idGame),
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

  return {
    methodName: "SetSlotSpinHiranmandiFrame",
    stake: asNumber(sum, stake),
    lines: selectedLines,
    xml: `<message MessageType="SetSlotSpinHiranmandiFrame" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="1.0"><Spin ${spinAttributes} /></message>`,
  };
};

export const buildDoubleRequest = ({ idCard, wasDouble, sum } = {}) => {
  const idPartner = "1";

  return {
    methodName: "GetSlotDubleHiranmandi",
    idCard,
    wasDouble,
    xml: `<message MessageType="GetSlotDubleHiranmandi" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="1.0"><Spin idPartner="${xmlEscape(idPartner)}" idCard="${xmlEscape(idCard)}" WasDouble="${xmlEscape(wasDouble)}" Sum="${xmlEscape(sum)}" /></message>`,
  };
};

export const buildPayRequest = ({ idCard } = {}) => ({
  methodName: "PaySlotHiranmandiFrame",
  idCard,
  xml: `<message MessageType="PaySlotHiranmandiFrame"><Pay idCard="${xmlEscape(idCard)}" /></message>`,
});



