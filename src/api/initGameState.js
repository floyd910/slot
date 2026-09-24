import { DOUBLE_MAX_STEPS, createDoubleState, createEmptyDoublingState } from "../config/gameSettings.js";
import { mapJsonSpinPayload } from "./slotPayloadMappers.js";
import { resolveApiGameId } from "./gameApiIds.js";

export function mapInitGameState(state, context) {
  if (state == null) return null;
  const fail = () => { throw Object.assign(new Error("Invalid init gameState"), {code:"BACKEND_RESPONSE_ERROR"}); };
  if (!state.SpinResult || String(state.idGameType) !== String(resolveApiGameId(context)) ||
      !state.idCard || String(state.idCard) !== String(state.SpinResult.idCard)) fail();
  const truth = value => value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
  const numeric = value => (typeof value === "string" || typeof value === "number") && String(value).trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
  for (const value of [state.CardSum,state.SumPay,state.CountFreeSpin,state.SpinResult.WasDouble,state.SpinResult.LineSum,state.SpinResult.Lines]) if (!numeric(value)) fail();
  if (!Number.isInteger(Number(state.CountFreeSpin)) || !Number.isInteger(Number(state.SpinResult.Lines))) fail();
  const wasDouble = Number(state.SpinResult.WasDouble);
  if (!Number.isInteger(wasDouble) || wasDouble > DOUBLE_MAX_STEPS) fail();
  const paid=typeof state.PayDate === "string" && state.PayDate.trim() !== "";
  const payload = {idCard:state.idCard,Number:state.SpinResult.Number,WinSum:paid ? 0 : Number(state.SumPay),FreeSpin:0,Gold:0};
  for(let row=1;row<=3;row++) payload['Line'+row]=Object.fromEntries(Array.from({length:5},(_,i)=>['Slot'+(i+1),state['Line'+row]?.['Slot'+row+(i+1)]]));
  for(let i=1;i<=10;i++) payload['LineWinKoff'+i]={Koff:state.LinesKoff?.['Koff'+i]};
  const spinResult=mapJsonSpinPayload(payload,{...context,isDemo:truth(state.SlotDemoSpin),isFreeSpin:truth(state.SlotFreeSpin)});

  const doublingState = createEmptyDoublingState();
  const doubleState = createDoubleState();
  if (!paid && spinResult.WinSum > 0 && wasDouble > 0) {
    Object.assign(doublingState, {
      entered: true,
      active: wasDouble < DOUBLE_MAX_STEPS,
      step: wasDouble,
      marks: Array.from({length: DOUBLE_MAX_STEPS}, (_, index) => index < wasDouble ? "x2" : ""),
      currentAmount: spinResult.WinSum,
      initialAmount: spinResult.WinSum / (2 ** wasDouble),
    });
    doubleState.step = wasDouble + 1;
  }

  // CardSum is the total bet and LineSum is the per-line stake, never a payout.
  // SumPay is the unpaid win. A last-card snapshot cannot resolve an in-flight request.
  return {raw:state,WasDouble:wasDouble,doublingState,doubleState,totalStake:Number(state.CardSum),stake:Number(state.SpinResult.LineSum),lines:Number(state.SpinResult.Lines),freeSpinsPlayed:Number(state.CountFreeSpin),grid:spinResult.grid,spinResult:{...spinResult,WasDouble:wasDouble,backendManagedWallet:true,creditedToBalance:paid,...(paid ? {winningCells:[],lineWins:[],scatterCells:[]} : {})},
    requiresReconciliation: false};
}
