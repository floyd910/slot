let activeHandler;
export function registerDoubleExit(handler) { activeHandler=handler; return ()=>{if(activeHandler===handler)activeHandler=null;}; }
export function requestDoubleExit(options={}) { return activeHandler ? activeHandler(options) : Promise.resolve({handled:false,allowExit:true}); }
export function createDoubleExitHandler({getState,recovery,pay,onPaid,onError,onStart=()=>{},requestId}) {
  let inFlight;
  return function exit({keepalive=false}={}) {
    if(inFlight)return inFlight;
    const state=getState(), context=state.context;
    // Collect on exit for ordinary wins with Double available as well as entered Double.
    const inDouble=Boolean(state.doublingState?.entered || state.doublingState?.active || state.doubleState?.active || state.doublingState?.step>0);
    if(!inDouble)return Promise.resolve({handled:false,allowExit:true});
    if(recovery.getPendingRequest(context) || state.roundRecoveryBlocked || recovery.getLocalState(context)?.operationStatus==='RECOVERY_REQUIRED') return Promise.resolve({handled:true,allowExit:true,pending:true});
    const spin=state.spinResult;
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
