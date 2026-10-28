import { isEnabled } from "../utils/featureFlags.js";
import { getTerminalGameConfig, TERMINAL_GAME_METHODS } from "./terminalGames.js";

const DEFAULT_SOAP_ENDPOINT = "/soap-hiranmandi";
const TERMINAL_SOAP_HOST = "betproduct-admin.com";
const env = import.meta.env ?? {};

let runtimeConfig = {};

const readEnvValue = (...names) =>
  names.map((name) => env[name]).find((value) => value != null && value !== "");

export const getFrontendEnvConfig = () => ({
  backendMode: readEnvValue("VITE_HIRANMANDI_BACKEND_MODE"),
  demoMode: readEnvValue("VITE_HIRANMANDI_DEMO_MODE"),
  gameId: readEnvValue("VITE_HIRANMANDI_GAME_ID"),
  idKassi: readEnvValue("VITE_HIRANMANDI_ID_KASSI"),
  idPartner: readEnvValue("VITE_HIRANMANDI_ID_PARTNER", "VITE_HIRANMANDI_PARTNER_ID"),
  idValute: readEnvValue("VITE_HIRANMANDI_ID_VALUTE"),
  locale: readEnvValue("VITE_HIRANMANDI_LOCALE"),
  soapEndpoint: readEnvValue("VITE_HIRANMANDI_SOAP_ENDPOINT"),
  terminalSoapEndpoint: readEnvValue("VITE_HIRANMANDI_TERMINAL_SOAP_ENDPOINT"),
  terminalApiBase: readEnvValue("VITE_TERMINAL_API_BASE"),
  testMode: readEnvValue("VITE_HIRANMANDI_TEST_MODE"),
});

export const getBackendTestParams = () => ({});

export const mergeRuntimeConfig = (params) => {
  runtimeConfig = { ...runtimeConfig, ...params };
  return runtimeConfig;
};

export const getRuntimeConfig = () => runtimeConfig;

const SHARED_TERMINAL_METHODS = new Set([
  "LoginTerminal",
  "AddDepozitTerminal",
  "GetDepozitTerminal",
  "GetLastSpinList",
]);

const useSameOriginTerminalProxy = (endpoint, terminalGame) => {
  const proxyPath = terminalGame?.proxyPath ?? "/soap-hiranmandi-terminal";
  if (!endpoint) return proxyPath;
  try {
    const resolved = new URL(endpoint, window.location.origin);
    const isKnownLocalProxy = /^\/soap-(?:hiranmandi-terminal|terminal-[a-z0-9-]+)$/i.test(resolved.pathname);
    const isKnownRemoteEndpoint =
      resolved.hostname.toLowerCase() === TERMINAL_SOAP_HOST &&
      /\/soap\/\/Slot[^/]+SOAPTerminal\.dll\/soap\/IInBet$/i.test(resolved.pathname);
    return isKnownLocalProxy || (isKnownRemoteEndpoint && resolved.origin !== window.location.origin)
      ? proxyPath
      : endpoint;
  } catch {
    return endpoint;
  }
};

export const getSoapEndpoint = (methodName = "") => {
  if (SHARED_TERMINAL_METHODS.has(methodName) || TERMINAL_GAME_METHODS.has(methodName)) {
    const terminalGame = getTerminalGameConfig(runtimeConfig);
    return useSameOriginTerminalProxy(
      runtimeConfig.terminalSoapEndpoint ??
        window.HIRANMANDI_FRAME_CONFIG?.terminalSoapEndpoint ??
        getFrontendEnvConfig().terminalSoapEndpoint,
      terminalGame,
    );
  }
  return runtimeConfig.soapEndpoint ??
    window.HIRANMANDI_FRAME_CONFIG?.soapEndpoint ??
    getFrontendEnvConfig().soapEndpoint ??
    DEFAULT_SOAP_ENDPOINT;
};

export const useSoapBackend = () => {
  const mode =
    runtimeConfig.backendMode ??
    window.HIRANMANDI_FRAME_CONFIG?.backendMode ??
    getFrontendEnvConfig().backendMode ??
    "soap";
  return mode !== "mock";
};

export const useBackendTestParams = () =>
  !import.meta.env?.PROD && isEnabled(
    runtimeConfig.backendTestParams ??
      window.HIRANMANDI_FRAME_CONFIG?.backendTestParams,
  );


