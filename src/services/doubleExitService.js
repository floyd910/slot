export function hasPendingExitRecovery(state, recovery) {
  return Boolean(state.roundRecoveryBlocked || recovery.getPendingRequest(state.context) ||
    recovery.getLocalState(state.context)?.operationStatus === 'RECOVERY_REQUIRED');
}
export function resolveExitPaidBalance({frontendWallet=false,currentBalance=0,payout=0,serverBalance}) {
  if (!frontendWallet) return Number(serverBalance);
  const balance=Number(currentBalance), win=Number(payout);
  if (!Number.isFinite(balance) || !Number.isFinite(win)) return Number(serverBalance);
  return Number((balance+win).toFixed(2));
}
let activeHandler;
export function registerDoubleExit(handler) { activeHandler=handler; return ()=>{if(activeHandler===handler)activeHandler=null;}; }
export function requestDoubleExit(options={}) { return activeHandler ? activeHandler(options) : Promise.resolve({handled:false,allowExit:true}); }
export function createDoubleExitHandler({getState,recovery,pay,onPaid,onError,onStart=()=>{},requestId}) {
  let inFlight;
  return function exit({keepalive=false}={}) {
    if(inFlight)return inFlight;
    const state=getState(), context=state.context;
    // Collect every confirmed unpaid ordinary win on exit, even if the Double
    // offer state was never set or has already been cleared.
    const spin=state.spinResult;
    const hasUnpaidOrdinaryWin=Boolean(
      spin?.idCard &&
      spin.creditedToBalance !== true &&
      spin.freeSpinDeferred !== true &&
      spin.isFreeSpin !== true &&
      Number(spin.WinSum)>0
    );
    const inDouble=Boolean(state.doublingState?.entered || state.doublingState?.active || state.doubleState?.active || state.doublingState?.step>0);
    if(!inDouble && !hasUnpaidOrdinaryWin)return Promise.resolve({handled:false,allowExit:true});
    if(hasPendingExitRecovery(state, recovery)) return Promise.resolve({handled:true,allowExit:true,pending:true});
    if(!spin?.idCard || spin.creditedToBalance || Number(spin.WinSum)<=0){recovery.completeRound(context);return Promise.resolve({handled:true,allowExit:true});}
    const id=requestId();
    // Persist the payment obligation, never a resumable Double UI.
    recovery.saveRound({requestId:id,idCard:spin.idCard,operationType:'COLLECT',operationStatus:'WAITING_FOR_COLLECT',exitRequested:true,doubleAvailable:false,doubleState:null,doublingState:null,spinResult:spin,currentWinSum:Number(spin.WinSum)},context);
    onStart();
    inFlight=pay({idCard:spin.idCard,requestId:id,keepalive}).then(result=>{
      recovery.completeRound(context);
      recovery.saveLastSpin({grid:spin.grid??state.grid,spinResult:{...spin,WinSum:0,creditedToBalance:true}},context);
      onPaid(result,state);
      return {handled:true,allowExit:true};
    }).catch(error=>{
      onError(error);
      return {handled:true,allowExit:false};
    }).finally(()=>{inFlight=null;});
    return inFlight;
  };
}
