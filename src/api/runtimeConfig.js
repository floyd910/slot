import { isEnabled } from "../utils/featureFlags.js";

const DEFAULT_SOAP_ENDPOINT = "/soap-hiranmandi";
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
  testMode: readEnvValue("VITE_HIRANMANDI_TEST_MODE"),
});

export const getBackendTestParams = () => ({});

export const mergeRuntimeConfig = (params) => {
  runtimeConfig = { ...runtimeConfig, ...params };
  return runtimeConfig;
};

export const getRuntimeConfig = () => runtimeConfig;

export const getSoapEndpoint = () =>
  runtimeConfig.soapEndpoint ??
  window.HIRANMANDI_FRAME_CONFIG?.soapEndpoint ??
  getFrontendEnvConfig().soapEndpoint ??
  DEFAULT_SOAP_ENDPOINT;

export const useSoapBackend = () => {
  const mode =
    runtimeConfig.backendMode ??
    window.HIRANMANDI_FRAME_CONFIG?.backendMode ??
    getFrontendEnvConfig().backendMode ??
    "soap";
  return mode !== "mock";
};

export const useBackendTestParams = () =>
  isEnabled(
    runtimeConfig.backendTestParams ??
      window.HIRANMANDI_FRAME_CONFIG?.backendTestParams,
  );
