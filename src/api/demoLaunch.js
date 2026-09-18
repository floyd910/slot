const PUBLIC_DEMO_ORIGIN = 'https://raxshloto.online';
export function isStandaloneDemo(runtime = globalThis.window) {
  if (!runtime || runtime.parent !== runtime) return false;
  const origin = runtime.location.origin;
  const configuredOrigin = import.meta.env?.DEV ? import.meta.env?.VITE_LOCAL_DEMO_ORIGIN : null;
  return (origin === PUBLIC_DEMO_ORIGIN || Boolean(configuredOrigin && origin === configuredOrigin)) && /^#\/(slots(?:$|[/?])|games\/[^/?#]+$)/.test(runtime.location.hash);
}
export const isDemoContext = context => isStandaloneDemo() && context?.initSource === 'demo-stand' && typeof context.token === 'string' && Boolean(context.token.trim()) && Boolean(context.playerId);
let pendingLaunch;
export function requestDemoLaunch() {
  if (!isStandaloneDemo()) return Promise.reject(Object.assign(new Error('Demo authorization is unavailable here'),{code:'ACCESS_DENIED'}));
  if (!pendingLaunch) pendingLaunch = fetch('/api/demo-launch', {method:'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)})
    .then(async response => {
      if (!response.ok) throw Object.assign(new Error('Demo launch unavailable'),{code:'CONFIGURATION_ERROR',status:response.status});
      const result = await response.json();
      if (typeof result.token !== 'string' || !result.token.trim() || result.playerId == null || !String(result.playerId).trim() || typeof result.demoMode !== 'boolean') throw Object.assign(new Error('Invalid demo launch response'),{code:'BACKEND_RESPONSE_ERROR'});
      return {token:result.token,playerId:String(result.playerId),userId:String(result.playerId),idUser:String(result.playerId),demoMode:result.demoMode,initSource:'demo-stand'};
    }).catch(error=>{pendingLaunch=null;throw error;});
  return pendingLaunch;
}
