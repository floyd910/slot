import {buildDoubleForm, sendDoubleRequest, mapDoubleResponse} from '../api/doubleApiClient.js';
import {stateRecoveryService as recovery, ROUND_OPERATION_STATUS} from './stateRecoveryService.js';
import {createDoubleState, createEmptyDoublingState} from '../config/gameSettings.js';

export async function recoverPendingDouble(context) {
  const pending = recovery.getPendingRequest(context);
  if (pending?.methodName !== '/double') {
    throw Object.assign(new Error('Only pending Double requests can be replayed'), {code:'RECOVERY_REQUIRED'});
  }
  const previous = pending.recoveryState ?? recovery.getLocalState(context);
  if (!previous?.spinResult || String(previous.spinResult.idCard) !== String(pending.idCard)) {
    throw Object.assign(new Error('Original Double result context is unavailable'), {code:'RECOVERY_REQUIRED'});
  }
  // Reuse the original request ID and all original form fields. Never issue /pay here.
  const body = pending.formData ? new URLSearchParams(pending.formData) : buildDoubleForm(pending, context);
  try {
    const payload = await sendDoubleRequest(body, {token:context.token, requestId:pending.requestId});
    const result = mapDoubleResponse(payload, pending);
    const spinResult = {...previous.spinResult, WinSum:result.WinSum, BaseWinSum:result.WinSum, BackendWinSum:result.WinSum, creditedToBalance:false};
    const round = {
      ...previous, spinResult, lastConfirmedSpinResult:spinResult,
      currentWinSum:result.WinSum, WasDouble:pending.wasDouble,
      operationStatus:result.WinSum > 0 ? ROUND_OPERATION_STATUS.WAITING_FOR_COLLECT : ROUND_OPERATION_STATUS.ROUND_COMPLETED,
      doubleAvailable:false, doubleState:createDoubleState(), doublingState:createEmptyDoublingState(),
    };
    recovery.saveRound(round, context);
    recovery.completePendingRequest(pending.requestId, context);
    return round;
  } catch (error) {
    // An unrecognized/in-progress response is not evidence the operation failed.
    recovery.markRecoveryRequired(error, {}, context);
    throw error;
  }
}
