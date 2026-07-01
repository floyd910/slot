import { asNumber } from "../utils/number.js";
import { getRuntimeConfig, useBackendTestParams } from "./runtimeConfig.js";
import {
  BACKEND_TEST_PARAMS,
  GAME_NUMERIC_ID,
  formatSoapDateTime,
  xmlEscape,
} from "./soapClient.js";

const readConfigValue = (...values) => values.find((value) => value != null && value !== "");

const getGlobalConfig = () => window.HIRANMANDI_FRAME_CONFIG ?? {};

export const buildSpinRequest = ({ stake, totalStake, lines, isDemo, isFreeSpin } = {}) => {
  const runtimeConfig = getRuntimeConfig();
  const globalConfig = getGlobalConfig();
  const forceTestParams = useBackendTestParams();
  const login = forceTestParams
    ? BACKEND_TEST_PARAMS.login
    : readConfigValue(
        runtimeConfig.login,
        runtimeConfig.Login,
        runtimeConfig.slotLogin,
        globalConfig.login,
        globalConfig.Login,
        globalConfig.slotLogin,
        "Terminal",
      );
  const password = forceTestParams
    ? BACKEND_TEST_PARAMS.password
    : readConfigValue(
        runtimeConfig.password,
        runtimeConfig.Password,
        runtimeConfig.slotPassword,
        globalConfig.password,
        globalConfig.Password,
        globalConfig.slotPassword,
        "Gefest",
      );
  const idUser = forceTestParams
    ? BACKEND_TEST_PARAMS.idUser
    : readConfigValue(
        runtimeConfig.idUser,
        runtimeConfig.userId,
        runtimeConfig.playerId,
        globalConfig.idUser,
        globalConfig.userId,
        globalConfig.playerId,
        "demo-player",
      );
  const idValute = forceTestParams
    ? BACKEND_TEST_PARAMS.idValute
    : readConfigValue(runtimeConfig.idValute, globalConfig.idValute, "1");
  const currency = forceTestParams
    ? readConfigValue(BACKEND_TEST_PARAMS.currency, BACKEND_TEST_PARAMS.idValute)
    : readConfigValue(
        runtimeConfig.spinCurrency,
        runtimeConfig.Currency,
        runtimeConfig.currencyId,
        runtimeConfig.currency,
        globalConfig.spinCurrency,
        globalConfig.Currency,
        globalConfig.currencyId,
        globalConfig.currency,
        idValute,
      );
  const sum = forceTestParams ? BACKEND_TEST_PARAMS.sum : totalStake ?? stake;
  const selectedLines = forceTestParams ? BACKEND_TEST_PARAMS.lines : lines;
  const idGame = forceTestParams
    ? BACKEND_TEST_PARAMS.idGame
    : readConfigValue(runtimeConfig.backendGameId, globalConfig.backendGameId, GAME_NUMERIC_ID);

  return {
    methodName: "SetSlotSpinHiranmandiFrame",
    stake: asNumber(sum, totalStake ?? stake),
    lines: selectedLines,
    xml: `<message MessageType="SetSlotSpinHiranmandiFrame" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="1.0">
 <Spin
   Login="${xmlEscape(login)}"
   Password="${xmlEscape(password)}"
   idUser="${xmlEscape(idUser)}"
   idValute="${xmlEscape(idValute)}"
   currency="${xmlEscape(currency)}"
   Sum="${xmlEscape(sum)}"
   Lines="${xmlEscape(selectedLines)}"
   idGame="${xmlEscape(idGame)}"
   DemoSpin="${isDemo ? 1 : 0}"
   FreeSpin="${isFreeSpin ? 1 : 0}"
 />
</message>`,
  };
};

export const buildDoubleRequest = ({ idCard, wasDouble, sum } = {}) => {
  const runtimeConfig = getRuntimeConfig();

  return {
    methodName: "GetSlotDubleHiranmandi",
    idCard,
    wasDouble,
    xml: `<message MessageType="GetSlotDubleHiranmandi">
 <Spin
   idPartner="${xmlEscape(runtimeConfig.idPartner ?? runtimeConfig.partnerId ?? "1")}"
   idCard="${xmlEscape(idCard)}"
   WasDouble="${xmlEscape(wasDouble)}"
   Sum="${xmlEscape(sum)}"
 />
</message>`,
  };
};

export const buildPayRequest = ({ idCard } = {}) => ({
  methodName: "PaySlotHiranmandiFrame",
  idCard,
  xml: `<message MessageType="PaySlotHiranmandiFrame">
 <Pay idCard="${xmlEscape(idCard)}" />
</message>`,
});