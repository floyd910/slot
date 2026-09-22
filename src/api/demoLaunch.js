import { getDemoPlayerId } from './demoIdentity.js';

const PUBLIC_DEMO_ORIGIN = 'https://raxshloto.online';
export function isStandaloneDemo(runtime = globalThis.window) {
  if (!runtime || runtime.parent !== runtime) return false;
  const origin = runtime.location.origin;
  const configuredOrigin = import.meta.env?.DEV ? import.meta.env?.VITE_LOCAL_DEMO_ORIGIN : null;
  return (origin === PUBLIC_DEMO_ORIGIN || Boolean(configuredOrigin && origin === configuredOrigin)) && /^#\/(slots(?:$|[/?])|games\/[^/?#]+$)/.test(runtime.location.hash);
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
