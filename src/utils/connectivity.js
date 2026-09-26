export const isBrowserOffline = () => globalThis.navigator?.onLine === false;

export const createOfflineError = (operation = "Operation") =>
  Object.assign(new Error(`${operation} was not sent because the browser is offline.`), {
    code: "OFFLINE",
    definitelyNotSent: true,
  });

export const assertBrowserOnline = (operation) => {
  if (isBrowserOffline()) throw createOfflineError(operation);
};
