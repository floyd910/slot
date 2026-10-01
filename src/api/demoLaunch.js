import { getDemoPlayerId } from './demoIdentity.js';

const PUBLIC_DEMO_ORIGIN = 'https://raxshloto.online';
const PUBLIC_DEMO_ORIGINS = new Set([PUBLIC_DEMO_ORIGIN, 'https://www.raxshloto.online']);

const isLocalDevelopmentOrigin = (origin) => {
  if (!import.meta.env?.DEV) return false;
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname);
  } catch {
    return false;
  }
};
export function isStandaloneDemo(runtime = globalThis.window) {
  if (!runtime || runtime.parent !== runtime) return false;
  const origin = runtime.location.origin;
  const configuredOrigin = import.meta.env?.DEV ? import.meta.env?.VITE_LOCAL_DEMO_ORIGIN : null;
  const trustedOrigin = PUBLIC_DEMO_ORIGINS.has(origin) ||
    Boolean(configuredOrigin && origin === configuredOrigin) ||
    isLocalDevelopmentOrigin(origin);
  const hashRoute = /^#\/(slots(?:$|[/?])|games\/[^/?#]+$)/.test(runtime.location.hash ?? "");
  const query = new URLSearchParams(runtime.location.search ?? "");
  const directGameRoute = ["gameId", "game", "gameName", "selectedGame", "slotId", "slot"]
    .some((key) => Boolean(query.get(key)));
  return trustedOrigin && (hashRoute || directGameRoute);
}
export const isDemoContext = context => isStandaloneDemo() && context?.initSource === 'demo-stand' && typeof context.token === 'string' && Boolean(context.token.trim()) && Boolean(context.playerId);
export function buildDemoLaunch(token, playerId) {
  if (typeof token !== 'string' || !token.trim() || playerId == null || !String(playerId).trim()) {
    throw Object.assign(new Error('A demo token and player identity are required'), {code:'CONFIGURATION_ERROR'});
  }
  return {token, playerId:String(playerId), userId:String(playerId), idUser:String(playerId), demoMode:false, initSource:'demo-stand'};
}
export async function requestDemoLaunch() {
  if (!isStandaloneDemo()) throw Object.assign(new Error('Demo authorization is unavailable here'), {code:'ACCESS_DENIED'});
  const token = import.meta.env?.VITE_DEMO_TOKEN;
  if (typeof token !== 'string' || !token.trim()) {
    throw Object.assign(new Error('Configure DEMO_TOKEN before building the standalone demo'), {code:'CONFIGURATION_ERROR'});
  }
  return buildDemoLaunch(token, await getDemoPlayerId());
}
