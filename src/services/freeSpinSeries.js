import {resolveApiGameId} from '../api/gameApiIds.js';
import {getAwardedFreeSpinCount} from '../utils/freeSpins.js';
const memory = new Map();
const keyFor = context => 'slot:free-spin-series:v1:' + JSON.stringify([String(context.playerId ?? context.userId ?? context.idUser), resolveApiGameId(context)]);
const read = context => {
 const key=keyFor(context);
 try { const raw=globalThis.window?.localStorage?.getItem(key); if(raw) { const value=JSON.parse(raw); memory.set(key,value); return value; } } catch {}
 return memory.get(key) ?? null;
};
const save = (context,value) => {
 const key=keyFor(context); memory.set(key,value);
 try { globalThis.window?.localStorage?.setItem(key,JSON.stringify(value)); } catch {}
 return value;
};
const snapshot = value => ({freeSpinsWinTotal:value ? (value.winMinor == null ? null : value.winMinor / 100) : 0,freeSpinsTotal:value?.total ?? 0,freeSpinsPlayed:value?.baseline == null ? 0 : Math.max(0,value.played-value.baseline),freeSpinsLeft:value?.baseline == null ? (value?.total ?? 0) : Math.max(0,value.total-(value.played-value.baseline))});
export const freeSpinSeries = {
 getCompletionSummary(context,currency) {
  const value=read(context);
  const id=value?.awardIds?.[0];
  if(id == null || value.winMinor == null || !Number.isSafeInteger(value.winMinor) || value.winMinor<0 ||
     typeof currency !== 'string' || !currency.trim())return null;
  return {id:'local-series:'+id,totalWin:(value.winMinor/100).toFixed(2),currency};
 },
 getPayments(context) {return read(context)?.payments ?? [];},
 getPaidTotal(context) {return (read(context)?.payments ?? []).filter(p=>p.paid).reduce((sum,p)=>sum+p.winMinor,0)/100;},
 markPaid(context,id,balance) {
  const value=read(context);
  if(!value)return;
  save(context,{...value,payments:(value.payments ?? []).map(p=>String(p.idCard)===String(id)?{...p,paid:true,balance}:p)});
 },
 read(context) { const value=read(context); return value ? snapshot(value) : null; },
 // Persist confirmed results before refreshing counters; retries must not add them twice.
 recordResult(context,result,isFreeSpin) {
  const award=getAwardedFreeSpinCount(result);
  if(!award && !isFreeSpin)return;
  const id=result.idCard ?? result.requestId;
  if(id == null)throw new Error('A confirmed free-spin result requires an identity');
  const key=String(id);
  let value=read(context);
  if(value?.resultIds?.includes(key) || value?.awardIds?.includes(key))return;
  if(!isFreeSpin)value={total:0,baseline:null,played:0,awardIds:[],resultIds:[],winMinor:0,payments:[]};
  // Older sessions may have counts but no monetary history. Do not invent their total.
  if(!value)return;
  // WinSum is the server amount for this spin. Never substitute display/base fields.
  const win=Number(result.WinSum ?? 0);
  if(!Number.isFinite(win)||win<0)throw new Error('Invalid free-spin win');
  save(context,{
   ...value,total:value.total+award,
   payments:isFreeSpin && win>0 ? [...(value.payments ?? []),{idCard:result.idCard,winMinor:Math.round(win*100),paid:result.creditedToBalance === true}] : (value.payments ?? []),
   winMinor:value.winMinor == null ? null : value.winMinor+(isFreeSpin ? Math.round(win*100) : 0),
   resultIds:[...(value.resultIds ?? []),key],
   awardIds:award ? [...(value.awardIds ?? []),key] : (value.awardIds ?? [])
  });
 }, reconcile(context,played,{isFreeSpin=false}={}) {
  const value=read(context);
  if(!value) {
   if(isFreeSpin)throw Object.assign(new Error('Cannot restore free spins without the locally saved award history'),{code:'FREE_SPIN_HISTORY_MISSING'});
   return snapshot(null);
  }
  if(!Number.isSafeInteger(played) || played<0)throw Object.assign(new Error('Invalid free-spin counter'),{code:'BACKEND_RESPONSE_ERROR'});
  // /freespins can return 0 on the first normal spin after the bonus.
  // A finished series is immutable until recordResult starts a new award.
  // Retain its winnings/payment ledger, including any unconfirmed payments.
  if(value.baseline!=null && snapshot(value).freeSpinsLeft===0)return snapshot(value);
  if(value.baseline!=null && played<value.played)throw Object.assign(new Error('Invalid active free-spin counter'),{code:'BACKEND_RESPONSE_ERROR'});
  return snapshot(save(context,{...value,baseline:value.baseline ?? played,played}));
 }
};
