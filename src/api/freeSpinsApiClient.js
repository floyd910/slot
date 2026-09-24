import { buildAuthHeaders } from './authHeaders.js';
import { resolveApiGameId } from './gameApiIds.js';
import { getSessionApiBaseUrl } from './runtimeConfig.js';

async function requestFreeSpinsPayload(context) {
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
  return payload;
}

export async function requestFreeSpins(context) {
  return Number((await requestFreeSpinsPayload(context)).CountFreeSpin);
}

// Proposed optional API extension: docs/free-spins-completion-api.md.
export async function requestFreeSpinSession(context) {
  return parseFreeSpinSession((await requestFreeSpinsPayload(context)).FreeSpinSession);
}

export function parseFreeSpinSession(value) {
  if (value == null) return null;
  const invalid = () => { throw Object.assign(new Error('Invalid free-spin session result'), {code:'BACKEND_RESPONSE_ERROR'}); };
  if (typeof value !== 'object' || typeof value.id !== 'string' || !value.id.trim() ||
      !['active', 'completed'].includes(value.status) ||
      !Number.isSafeInteger(value.remaining) || value.remaining < 0 ||
      typeof value.creditedToBalance !== 'boolean') invalid();
  if (value.status !== 'completed' || value.remaining !== 0 || !value.creditedToBalance) return null;
  if (!['string', 'number'].includes(typeof value.totalWin) ||
      !/^\d+(\.\d{1,2})?$/.test(String(value.totalWin)) ||
      !Number.isSafeInteger(Math.round(Number(value.totalWin) * 100)) ||
      typeof value.currency !== 'string' || !/^[A-Z]{3}$/.test(value.currency)) invalid();
  const [whole, fraction = ''] = String(value.totalWin).split('.');
  const totalWin = whole.replace(/^0+(?=\d)/, '') + '.' + fraction.padEnd(2, '0');
  return {id:value.id, totalWin, currency:value.currency};
}
