// Temporary shared test-player fallback, including production.
// A parent postMessage launch replaces this context.
export const getDevTestLaunch = () => {
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpbiI6InRlc3RzbG90IiwicGFzc3dvcmQiOiIxIiwiaWF0IjoxNzg5MTMzNDE2fQ.MUIQxL8_YZRl05hpdxx3-lI5hUwtUgl8JMW4-0offkQ";
  return token ? {token, playerId:"7", userId:"7", idUser:"7", demoMode:false, initSource:"dev-test"} : null;
};
export const isDevTestLaunch = context => {
  const fallback=getDevTestLaunch();
  return Boolean(fallback && context.initSource==="dev-test" && context.token===fallback.token && String(context.playerId)==="7");
};
