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
   const response=await pay({idCard:card.idCard,requestId:requestId(),keepalive});
   freeSpinSeries.markPaid(context,card.idCard,response.balance);
   balance=response.balance;
  }
  return {balance,paidTotal:freeSpinSeries.getPaidTotal(context)};
 })();
 active.set(key,operation);
 operation.finally(()=>active.delete(key)).catch(()=>{});
 return operation;
}
