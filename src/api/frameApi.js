import { getRuntimeConfig, mergeRuntimeConfig, useBackendTestParams, useSoapBackend } from "./runtimeConfig.js";
import { double as mockDouble, getGames as getMockGames, getPaytable as getMockPaytable, pay as mockPay, spin as mockSpin, createSession } from "./mockSlotBackend.js";
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

const buildSpinMessage = ({ stake, lines, isDemo, isFreeSpin }) => {
  const runtimeConfig = getRuntimeConfig();
  const forceTestParams = useBackendTestParams();
  const idPartner = forceTestParams
    ? BACKEND_TEST_PARAMS.idPartner
    : runtimeConfig.idPartner ?? runtimeConfig.partnerId ?? "1";
  const idKassi = forceTestParams
    ? BACKEND_TEST_PARAMS.idKassi
    : runtimeConfig.idKassi ?? "70";
  const idValute = forceTestParams
    ? BACKEND_TEST_PARAMS.idValute
    : runtimeConfig.idValute ?? "1";
  const spinSum = forceTestParams ? BACKEND_TEST_PARAMS.sum : stake;
  const backendLines = forceTestParams
    ? BACKEND_TEST_PARAMS.lines
    : runtimeConfig.backendLines ?? lines;
  const idGame = forceTestParams
    ? BACKEND_TEST_PARAMS.idGame
    : runtimeConfig.backendGameId ?? GAME_NUMERIC_ID;

  return {
    stake: asNumber(spinSum, stake),
    xml: `<message MessageType="SetSlotSpinHiranmandi" MessageDateTime="${formatSoapDateTime()}" MessageFormatVersion="1.0">
 <Spin
   idPartner="${xmlEscape(idPartner)}"
   idKassi="${xmlEscape(idKassi)}"
   idValute="${xmlEscape(idValute)}"
   Sum="${xmlEscape(spinSum)}"
   Lines="${xmlEscape(backendLines)}"
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

const buildPayMessage = ({ idCard }) => `<message MessageType="GetSlotPayHiranmandi">
 <Spin idCard="${xmlEscape(idCard)}"/>
</message>`;

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

  async spin({ stake, lines, isDemo, isFreeSpin, selectedCombination, requestId }) {
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

    const spinMessage = buildSpinMessage({ stake, lines, isDemo, isFreeSpin });
    const document = await callSoap(spinMessage.xml);
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
    if (!useSoapBackend()) return mockPay({ idCard });

    const document = await callSoap(buildPayMessage({ idCard }));
    const attrs = readAttributes(document, "PayResult");
    return {
      idCard: attrs.idCard ?? idCard,
      PayDate: attrs.PayDate ?? new Date().toISOString(),
    };
  },
};
