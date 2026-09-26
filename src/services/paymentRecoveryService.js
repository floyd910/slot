import {stateRecoveryService as recovery} from './stateRecoveryService.js';
import {freeSpinSeries} from './freeSpinSeries.js';
import {resolveApiGameId} from '../api/gameApiIds.js';

// Called only after /init has been validated and the wallet has been refreshed.
// Empty PayDate is not proof of failure: never replay /pay here.
export function reconcileConfirmedPayment(context, remote, gameState, wallet, expectedPending) {
 const pending=recovery.getPendingRequest(context);
 const playerId=context.playerId ?? context.userId ?? context.idUser;
 const card=remote?.gameState;
 if (!expectedPending || pending?.methodName !== '/pay' || pending.requestId !== expectedPending.requestId ||
     String(pending.idCard) !== String(expectedPending.idCard) ||
     String(remote.playerId) !== String(playerId) || String(card?.idGameType) !== String(resolveApiGameId(context)) ||
     pending.idCard == null || String(card?.idCard) !== String(pending.idCard) ||
     String(gameState?.spinResult?.idCard) !== String(pending.idCard) ||
     typeof card.PayDate !== 'string' || !card.PayDate.trim() ||
     gameState.spinResult.creditedToBalance !== true || !Number.isFinite(wallet?.balance)) return false;
 recovery.saveLastSpin({grid:gameState.grid,spinResult:gameState.spinResult},context);
 // Preserve the Free Spins ledger if this card belongs to a bonus payout batch.
 freeSpinSeries.markPaid(context,pending.idCard,wallet.balance);
 recovery.completeRound(context);
 recovery.completePendingRequest(pending.requestId,context);
 return true;
}
