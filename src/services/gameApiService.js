import {
  double as mockDouble,
  pay as mockPay,
  spin as mockSpin,
} from "../api/mockSlotBackend.js";
import { getRuntimeConfig, useSoapBackend } from "../api/runtimeConfig.js";
import {
  buildDoubleRequest,
  buildPayRequest,
  buildSpinRequest,
} from "../api/soapRequestBuilder.js";
import {
  parseDoubleResponse,
  parsePayResponse,
  parseSpinResponse,
} from "../api/soapResponseParser.js";
import { sendSoapRequest } from "../api/soapClient.js";
import { normalizeDoubleResult } from "../models/doubleResult.js";
import { normalizePayResult } from "../models/payResult.js";
import { normalizeSpinResult } from "../models/spinResult.js";
import { stateRecoveryService } from "./stateRecoveryService.js";

// Temporary: keep Double outcomes local/random until backend-controlled
// doubling is re-enabled.
const USE_RANDOM_DOUBLE_RESULTS = true;

const getContext = () => getRuntimeConfig();

const remember = (operation) =>
  stateRecoveryService.rememberPendingRequest({
    ...stateRecoveryService.buildCorrelation(getContext(), operation),
    ...operation,
  });

const complete = (requestId) => stateRecoveryService.completePendingRequest(requestId);

const trackTimeout = (error, operation) => {
  if (error?.code === "TIMEOUT") {
    stateRecoveryService.markRecoveryRequired(error, operation);
  }
};

export class GameApiService {
  async spin(params = {}) {
    if (!useSoapBackend()) {
      const result = await mockSpin(params);
      return normalizeSpinResult(result);
    }

    const request = buildSpinRequest(params);
    const operation = {
      methodName: request.methodName,
      requestId: params.requestId,
      stake: request.stake,
      lines: params.lines,
      isDemo: params.isDemo,
      isFreeSpin: params.isFreeSpin,
    };
    remember(operation);

    try {
      const { payloadDocument } = await sendSoapRequest(request.methodName, request.xml, {
        requestId: params.requestId,
        retryAttempts: 1,
        meta: stateRecoveryService.buildCorrelation(getContext(), operation),
      });
      const result = parseSpinResponse(payloadDocument, {
        stake: request.stake,
        lines: params.lines,
        isDemo: params.isDemo,
        isFreeSpin: params.isFreeSpin,
        selectedCombination: params.selectedCombination,
        requestId: params.requestId,
      });
      stateRecoveryService.saveGameState({
        lastIdCard: result.idCard,
        currentMode: params.isFreeSpin ? "free-spin" : "spin",
        freeSpinsLeft: result.FreeSpin,
        WasDouble: 0,
        currentWinSum: result.WinSum,
        spinResult: result,
      });
      complete(params.requestId);
      return result;
    } catch (error) {
      trackTimeout(error, operation);
      throw error;
    }
  }

  async double(params = {}) {
    if (USE_RANDOM_DOUBLE_RESULTS || !useSoapBackend()) {
      const result = await mockDouble(params);
      return normalizeDoubleResult({ ...result, requestId: params.requestId });
    }

    const request = buildDoubleRequest(params);
    const operation = {
      methodName: request.methodName,
      requestId: params.requestId,
      idCard: params.idCard,
      roundId: params.idCard,
      wasDouble: params.wasDouble,
      sum: params.sum,
    };
    remember(operation);

    try {
      const { payloadDocument } = await sendSoapRequest(request.methodName, request.xml, {
        requestId: params.requestId,
        idCard: params.idCard,
        roundId: params.idCard,
        retryAttempts: 3,
        timeoutMs: 2500,
        meta: stateRecoveryService.buildCorrelation(getContext(), operation),
      });
      const result = parseDoubleResponse(payloadDocument, {
        idCard: params.idCard,
        requestId: params.requestId,
        roundId: params.idCard,
        wasDouble: params.wasDouble,
        side: params.side,
      });
      stateRecoveryService.saveGameState({
        lastIdCard: result.idCard,
        currentMode: "double",
        WasDouble: params.wasDouble,
        currentWinSum: result.WinSum,
      });
      complete(params.requestId);
      return result;
    } catch (error) {
      trackTimeout(error, operation);
      throw error;
    }
  }

  async pay(params = {}) {
    // Current backend contract for this game settles pay locally/mock-side.
    // Keep the builder available so a real Pay method can be enabled without UI changes.
    const request = buildPayRequest(params);
    const operation = {
      methodName: request.methodName,
      requestId: params.requestId,
      idCard: params.idCard,
      roundId: params.idCard,
    };
    remember(operation);

    try {
      const result = normalizePayResult({ ...(await mockPay(params)), requestId: params.requestId });
      stateRecoveryService.clearLocalState();
      complete(params.requestId);
      return result;
    } catch (error) {
      trackTimeout(error, operation);
      throw error;
    }
  }

  recoverState() {
    return stateRecoveryService.getLocalState();
  }

  recoverAfterTimeout(options) {
    return stateRecoveryService.recoverAfterTimeout(options);
  }
}

export const gameApiService = new GameApiService();