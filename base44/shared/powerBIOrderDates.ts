import {powerToken,powerQuery} from './financePowerBI.ts';
import {orderDateVariables} from './powerBIOrderDateDax.ts';
const normalise=value=>String(value||'').trim().toUpperCase();
const literal=value=>`"${value.replace(/"/g,'""')}"`;
const date=value=>value&&Number.isFinite(Date.parse(value))?String(value).slice(0,10):null;
export async function mapPowerBIOrderDates(base44,state,items,token){
 if(!items.length)return items;
 const refs=[...new Set(items.map(item=>normalise(item.reference||item.Reference)).filter(Boolean))];
 if(refs.length>100||refs.some(ref=>ref.length>250))throw new Error('Order date lookup exceeds the page limit.');
 if(!refs.length)return items.map(item=>({...item,date:null,paid_date:null,due_date:null,date_basis:null,transaction_matches:0}));
 const t="'crf00_transaction_tb'";
 const query=`EVALUATE GENERATE(DATATABLE("OrderReference",STRING,{${refs.map(ref=>`{${literal(ref)}}`).join(',')}}),VAR ref=[OrderReference] ${orderDateVariables()} RETURN ROW("PaidDate",MAXX(matched,${t}[Paid date]),"DueDate",MINX(matched,${t}[Due date]),"Matches",COUNTROWS(matched)))`;
 const rows=await powerQuery(token||await powerToken(base44),state.dataset_id,query);
 const dates=new Map(rows.map(row=>[normalise(row.OrderReference),row]));
 return items.map(item=>{
  const row=dates.get(normalise(item.reference||item.Reference)),paid=date(row?.PaidDate),due=date(row?.DueDate);
  return {...item,date:paid||due,paid_date:paid,due_date:due,date_basis:paid?'paid':due?'due':null,transaction_matches:row?.Matches||0};
 });
}