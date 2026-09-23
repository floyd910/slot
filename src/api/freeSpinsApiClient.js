import { buildAuthHeaders } from './authHeaders.js';
import { resolveApiGameId } from './gameApiIds.js';
import { getSessionApiBaseUrl } from './runtimeConfig.js';

export async function requestFreeSpins(context) {
  const playerId = context.playerId ?? context.userId ?? context.idUser;
  if (playerId == null || !String(playerId).trim()) {
    throw Object.assign(new Error('Missing player ID'), {code:'CONFIGURATION_ERROR'});
  }
  const response = await fetch(getSessionApiBaseUrl().replace(/\/$/, '') + '/freespins', {
    method:'POST',
    headers:buildAuthHeaders(context.token),
    body:new URLSearchParams({gameId:resolveApiGameId(context), playerId:String(playerId)}),
    signal:AbortSignal.timeout(9000),
  });
  if (!response.ok) throw Object.assign(new Error('Free-spin count returned HTTP ' + response.status), {status:response.status});
  const payload = await response.json();
  const value = payload?.CountFreeSpin;
  if (!['string','number'].includes(typeof value) || !/^\d+$/.test(String(value)) ||
      !Number.isSafeInteger(Number(value)) || Number(value) < 0) {
    throw Object.assign(new Error('Invalid free-spin count'), {code:'BACKEND_RESPONSE_ERROR'});
  }
  return Number(value);
}
