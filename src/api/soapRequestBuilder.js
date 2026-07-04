import { asNumber } from "../utils/number.js";
import {
  getBackendTestParams,
  getFrontendEnvConfig,
  getRuntimeConfig,
  useBackendTestParams,
} from "./runtimeConfig.js";
import {
  GAME_NUMERIC_ID,
  formatSoapDateTime,
  xmlEscape,
} from "./soapClient.js";

const readConfigValue = (...values) => values.find((value) => value != null && value !== "");

const getGlobalConfig = () => window.HIRANMANDI_FRAME_CONFIG ?? {};

export const buildSpinRequest = ({ stake, totalStake, lines, isDemo, isFreeSpin } = {}) => {
  const runtimeConfig = getRuntimeConfig();
  const globalConfig = getGlobalConfig();
  const envConfig = getFrontendEnvConfig();
  const testParams = getBackendTestParams();
  const forceTestParams = useBackendTestParams();
  const login = forceTestParams
    ? testParams.login
    : readConfigValue(
        runtimeConfig.login,
        runtimeConfig.Login,
        runtimeConfig.slotLogin,
        globalConfig.login,
        globalConfig.Login,
        globalConfig.slotLogin,
        envConfig.login,
      );
  const password = forceTestParams
    ? testParams.password
    : readConfigValue(
        runtimeConfig.password,
        runtimeConfig.Password,
        runtimeConfig.slotPassword,
        globalConfig.password,
        globalConfig.Password,
        globalConfig.slotPassword,
        envConfig.password,
      );
  const idUser = forceTestParams
    ? testParams.idUser
    : readConfigValue(
        runtimeConfig.idUser,
        runtimeConfig.userId,
        runtimeConfig.playerId,
        globalConfig.idUser,
        globalConfig.userId,
        globalConfig.playerId,
        envConfig.idUser,
        "demo-player",
      );
  const idValute = forceTestParams
    ? testParams.idValute
    : readConfigValue(runtimeConfig.idValute, globalConfig.idValute, envConfig.idValute, "1");
  const currency = forceTestParams
    ? readConfigValue(testParams.currency, testParams.idValute, idValute)
    : readConfigValue(
        runtimeConfig.spinCurrency,
        runtimeConfig.Currency,
        runtimeConfig.currencyId,
        runtimeConfig.currency,
        globalConfig.spinCurrency,
        globalConfig.Currency,
        globalConfig.currencyId,
        globalConfig.currency,
        envConfig.currency,
        idValute,
      );
  const sum = forceTestParams ? readConfigValue(testParams.sum, totalStake, stake) : totalStake ?? stake;
  const selectedLines = forceTestParams ? readConfigValue(testParams.lines, lines) : lines;
  const idGame = forceTestParams
    ? readConfigValue(testParams.idGame, GAME_NUMERIC_ID)
    : readConfigValue(runtimeConfig.backendGameId, globalConfig.backendGameId, envConfig.backendGameId, GAME_NUMERIC_ID);

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
