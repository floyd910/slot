import { isEnabled } from "../utils/featureFlags.js";

const DEFAULT_SOAP_ENDPOINT = "/soap-hiranmandi";

let runtimeConfig = {};

export const mergeRuntimeConfig = (params) => {
  runtimeConfig = { ...runtimeConfig, ...params };
  return runtimeConfig;
};

export const getRuntimeConfig = () => runtimeConfig;

export const getSoapEndpoint = () =>
  runtimeConfig.soapEndpoint ??
  window.HIRANMANDI_FRAME_CONFIG?.soapEndpoint ??
  DEFAULT_SOAP_ENDPOINT;

export const useSoapBackend = () => {
  const mode =
    runtimeConfig.backendMode ??
    window.HIRANMANDI_FRAME_CONFIG?.backendMode ??
    "soap";
  return mode !== "mock";
};

export const useBackendTestParams = () =>
  isEnabled(
    runtimeConfig.backendTestParams ??
      window.HIRANMANDI_FRAME_CONFIG?.backendTestParams,
  );
