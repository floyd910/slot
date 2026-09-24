import { resolveApiGameId } from '../api/gameApiIds.js';
const shown = new Set();
// Reconnects must not repeat a session. Storage failures retain same-page deduplication.
export function claimFreeSpinCompletion(context, sessionId) {
  const key = 'slot:free-spin-completion:v1:' + JSON.stringify([
    String(context.playerId ?? context.userId ?? context.idUser), resolveApiGameId(context), sessionId,
  ]);
  if (shown.has(key)) return false;
  try {
    if (globalThis.window?.localStorage?.getItem(key)) return false;
    globalThis.window?.localStorage?.setItem(key, 'shown');
  } catch {}
  shown.add(key);
  return true;
}
