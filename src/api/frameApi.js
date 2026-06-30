import {
  getRuntimeConfig,
  mergeRuntimeConfig,
  useBackendTestParams,
  useSoapBackend,
} from "./runtimeConfig.js";
import {
  double as mockDouble,
  getGames as getMockGames,
  getPaytable as getMockPaytable,
  pay as mockPay,
  spin as mockSpin,
  createSession,
} from "./mockSlotBackend.js";
import { mapSpinPayload } from "./slotPayloadMappers.js";
import { asNumber } from "../utils/number.js";
import {
  BACKEND_TEST_PARAMS,
  GAME_NUMERIC_ID,
  callSoap,
  callSoapWithRetry,
  formatSoapDateTime,
  readAttributes,
  xmlEscape,
} from "./soapClient.js";

const validateSessionContext = (params) => {
  if (params.maintenance) {
    const error = new Error("Maintenance mode");
    error.code = "MAINTENANCE";
    throw error;
  }
  if (!params.token) {
    const error = new Error("Missing token parameter");
    error.code = "ACCESS_DENIED";
    throw error;
  }
  if (!params.sessionId) {
    const error = new Error("Missing sessionId parameter");
    error.code = "INVALID_SESSION";
    throw error;
  }
  if (!params.gameId) {
    const error = new Error("Missing gameId parameter");
    error.code = "CONFIGURATION_ERROR";
    throw error;
  }
};

const buildSpinMessage = ({ stake, totalStake, lines, isDemo, isFreeSpin }) => {
  const runtimeConfig = getRuntimeConfig();
  const globalConfig = window.HIRANMANDI_FRAME_CONFIG ?? {};
  const forceTestParams = useBackendTestParams();
  const login = forceTestParams
    ? BACKEND_TEST_PARAMS.login
    : runtimeConfig.login ??
      runtimeConfig.Login ??
      runtimeConfig.slotLogin ??
      globalConfig.login ??
      globalConfig.Login ??
      globalConfig.slotLogin ??
      "Terminal";
  const password = forceTestParams
    ? BACKEND_TEST_PARAMS.password
    : runtimeConfig.password ??
      runtimeConfig.Password ??
      runtimeConfig.slotPassword ??
      globalConfig.password ??
      globalConfig.Password ??
      globalConfig.slotPassword ??
      "Gefest";
  const idUser = forceTestParams
    ? BACKEND_TEST_PARAMS.idUser
    : runtimeConfig.idUser ??
      runtimeConfig.userId ??
      runtimeConfig.playerId ??
      globalConfig.idUser ??
      globalConfig.userId ??
      globalConfig.playerId ??
      "demo-player";
  const idValute = forceTestParams
    ? BACKEND_TEST_PARAMS.idValute
    : runtimeConfig.idValute ?? globalConfig.idValute ?? "1";
  const spinCurrency = forceTestParams
    ? BACKEND_TEST_PARAMS.currency ?? BACKEND_TEST_PARAMS.idValute
    : runtimeConfig.spinCurrency ??
      runtimeConfig.Currency ??
      runtimeConfig.currencyId ??
      globalConfig.spinCurrency ??
      globalConfig.Currency ??
      globalConfig.currencyId ??
      idValute;
  const spinSum = forceTestParams ? BACKEND_TEST_PARAMS.sum : totalStake ?? stake;
  const selectedLines = forceTestParams ? BACKEND_TEST_PARAMS.lines : lines;
  const idGame = forceTestParams
    ? BACKEND_TEST_PARAMS.idGame
    : runtimeConfig.backendGameId ?? globalConfig.backendGameId ?? GAME_NUMERIC_ID;

  return {
    stake: asNumber(spinSum, totalStake ?? stake),
    xml: `<message MessageType="SetSlotSpinHiranmandiFrame" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="1.0">
 <Spin
   Login="${xmlEscape(login)}"
   Password="${xmlEscape(password)}"
   idUser="${xmlEscape(idUser)}"
   idValute="${xmlEscape(idValute)}"
   currency="${xmlEscape(spinCurrency)}"
   Sum="${xmlEscape(spinSum)}"
   Lines="${xmlEscape(selectedLines)}"
   idGame="${xmlEscape(idGame)}"
   DemoSpin="${isDemo ? 1 : 0}"
   FreeSpin="${isFreeSpin ? 1 : 0}"
 />
</message>`,
  };
};

const buildDoubleMessage = ({ idCard, wasDouble, sum }) => {
  const runtimeConfig = getRuntimeConfig();
  return `<message MessageType="GetSlotDubleHiranmandi">
 <Spin
   idPartner="${xmlEscape(runtimeConfig.idPartner ?? runtimeConfig.partnerId ?? "1")}"
   idCard="${xmlEscape(idCard)}"
   WasDouble="${xmlEscape(wasDouble)}"
   Sum="${xmlEscape(sum)}"
 />
</message>`;
};

export const frameApi = {
  async initSession(params) {
    mergeRuntimeConfig(params);
    validateSessionContext(params);
    return createSession(params);
  },

  async getGames() {
    return getMockGames();
  },

  async getPaytable() {
    return getMockPaytable();
  },

  async spin({ stake, totalStake, lines, isDemo, isFreeSpin, selectedCombination, requestId }) {
    if (!useSoapBackend()) {
      return mockSpin({
        stake,
        lines,
        isDemo,
        isFreeSpin,
        selectedCombination,
        requestId,
      });
    }

    const spinMessage = buildSpinMessage({ stake, totalStake, lines, isDemo, isFreeSpin });
    window.__HIRANMANDI_LAST_SOAP_REQUEST__ = spinMessage.xml;
    const document = await callSoap(spinMessage.xml);
    window.__HIRANMANDI_LAST_SOAP_RESPONSE__ = new XMLSerializer().serializeToString(document);
    return mapSpinPayload(document, {
      stake: spinMessage.stake,
      lines,
      isDemo,
      isFreeSpin,
      selectedCombination,
      requestId,
    });
  },

  async double({ idCard, wasDouble, sum, side }) {
    if (!useSoapBackend()) return mockDouble({ idCard, wasDouble, sum, side });

    const document = await callSoapWithRetry(
      buildDoubleMessage({ idCard, wasDouble, sum }),
      3,
    );
    const attrs = readAttributes(document, "GameResult");
    const winSum = asNumber(attrs.WinSum);
    return {
      idCard: attrs.idCard ?? idCard,
      WinSum: winSum,
      WasDouble: wasDouble,
      side,
      status: winSum > 0 ? "win" : "lose",
    };
  },

  async pay({ idCard }) {
    return mockPay({ idCard });
  },
};
