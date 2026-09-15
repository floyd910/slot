// Temporary local testing only; Vite removes this branch from production builds.
export const getDevTestLaunch = () => {
  if (!import.meta.env?.DEV) return null;
  const token = import.meta.env.VITE_DEV_TEST_TOKEN;
  return token ? {token, playerId:"7", userId:"7", idUser:"7", demoMode:true, initSource:"dev-test"} : null;
};
export const isDevTestLaunch = context => {
  const fallback=getDevTestLaunch();
  return Boolean(fallback && context.initSource==="dev-test" && context.token===fallback.token && String(context.playerId)==="7");
};
