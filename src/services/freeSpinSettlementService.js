import {freeSpinSeries} from "./freeSpinSeries.js";

// Only confirmed responses mark a card paid. Unknown /pay results remain pending.
const active = new Map();
export function settleFreeSpinSeries({context,pay,requestId,keepalive=false}) {
 const key=JSON.stringify([context.playerId ?? context.userId ?? context.idUser,context.gameId]);
 if(active.has(key))return active.get(key);
 const operation=(async()=>{
  let balance=null;
  for(const card of freeSpinSeries.getPayments(context)) {
   if(card.paid)continue;
   const paymentRequestId=freeSpinSeries.preparePayment(context,card.idCard,requestId());
   const response=await pay({idCard:card.idCard,requestId:paymentRequestId,keepalive});
   if(response?.idCard == null || String(response.idCard)!==String(card.idCard) ||
      typeof response.paidAt!=='string' || !response.paidAt.trim() ||
      response.success===false || response.paid===false ||
      (response.backendManagedWallet===true &&
       (typeof response.balance!=='number' || !Number.isFinite(response.balance) || response.balance<0))) {
    throw Object.assign(new Error('Free-spin payment is not confirmed'),{code:'BACKEND_RESPONSE_ERROR',requestId:paymentRequestId});
   }
   freeSpinSeries.markPaid(context,card.idCard,response.balance);
   balance=response.balance;
  }
  return {balance,paidTotal:freeSpinSeries.getPaidTotal(context)};
 })();
 active.set(key,operation);
 operation.finally(()=>active.delete(key)).catch(()=>{});
 return operation;
}
