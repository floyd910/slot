// Shared server-only handler for the public test stand. Never import into src/.
export function demoLaunch(request, env) {
  const headers = {'Content-Type':'application/json', 'Cache-Control':'no-store'};
  const fail = (status, error) => ({status, headers, body:JSON.stringify({error})});
  if (request.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED');
  if (env.DEMO_ENABLED !== 'true') return fail(404, 'DEMO_DISABLED');
  if (!env.DEMO_ORIGIN || request.origin !== env.DEMO_ORIGIN) return fail(403, 'FORBIDDEN');
  if (!env.DEMO_TOKEN || !env.DEMO_PLAYER_ID) return fail(503, 'DEMO_NOT_CONFIGURED');
  return {status:200,headers,body:JSON.stringify({token:env.DEMO_TOKEN,playerId:env.DEMO_PLAYER_ID,demoMode:false})};
}
