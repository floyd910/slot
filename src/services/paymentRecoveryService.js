import {stateRecoveryService as recovery, ROUND_OPERATION_STATUS} from './stateRecoveryService.js';
import {freeSpinSeries} from './freeSpinSeries.js';
import {resolveApiGameId} from '../api/gameApiIds.js';

// Called only after /init has been validated and the wallet has been refreshed.
// A confirmed PayDate settles the round. The same unpaid card restores the win
// and cancels the failed transport attempt; /pay is never replayed automatically.
export function reconcileConfirmedPayment(context, remote, gameState, wallet, expectedPending) {
 const pending=recovery.getPendingRequest(context);
 const playerId=context.playerId ?? context.userId ?? context.idUser;
 const card=remote?.gameState;
 const samePendingPayment=Boolean(
   expectedPending && pending?.methodName === '/pay' &&
   pending.requestId === expectedPending.requestId &&
   String(pending.idCard) === String(expectedPending.idCard) &&
   (remote.playerId == null || String(remote.playerId) === String(playerId)) &&
   String(card?.idGameType) === String(resolveApiGameId(context)) &&
   pending.idCard != null && String(card?.idCard) === String(pending.idCard) &&
   String(gameState?.spinResult?.idCard) === String(pending.idCard)
 );
 if (!samePendingPayment) return false;

 const paymentConfirmed=typeof card.PayDate === 'string' && card.PayDate.trim() &&
   gameState.spinResult.creditedToBalance === true && Number.isFinite(wallet?.balance);
 if (paymentConfirmed) {
   recovery.saveLastSpin({grid:gameState.grid,spinResult:gameState.spinResult},context);
   // Preserve the Free Spins ledger if this card belongs to a bonus payout batch.
   freeSpinSeries.markPaid(context,pending.idCard,wallet.balance);
   recovery.completeRound(context);
   recovery.completePendingRequest(pending.requestId,context);
   return true;
 }

 const paymentNotApplied=(card.PayDate == null || (typeof card.PayDate === 'string' && !card.PayDate.trim())) &&
   gameState.spinResult.creditedToBalance !== true;
 if (!paymentNotApplied) return false;

 const previousRound = recovery.getLocalState(context);
 const previousSpin = previousRound?.spinResult ?? recovery.getLastSpin(context)?.spinResult;
 // An empty PayDate with a zero SumPay cannot replace a known positive win.
 // Retain the pending request until /init confirms either outcome.
 if (Number(gameState.spinResult.WinSum) === 0 &&
     String(previousSpin?.idCard) === String(pending.idCard) &&
     previousSpin.creditedToBalance !== true &&
     Math.max(Number(previousSpin.WinSum ?? 0), Number(previousRound?.currentWinSum ?? 0)) > 0) {
   return false;
 }

 const unpaidSpin={...gameState.spinResult,creditedToBalance:false};
 recovery.saveLastSpin({grid:gameState.grid,spinResult:unpaidSpin},context);
 recovery.saveRound({
   requestId:null,
   idCard:unpaidSpin.idCard,
   operationType:'COLLECT',
   operationStatus:ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT,
   currentWinSum:Number(unpaidSpin.WinSum ?? 0),
   spinResult:unpaidSpin,
   lastConfirmedSpinResult:unpaidSpin,
   grid:gameState.grid,
   lastConfirmedGrid:gameState.grid,
   doubleAvailable:Number(unpaidSpin.WinSum ?? 0) > 0,
   autoExpressActive:false,
   recoveryError:null,
 },context);
 recovery.completePendingRequest(pending.requestId,context);
 return false;
}