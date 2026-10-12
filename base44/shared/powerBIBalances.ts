import {powerToken,powerQuery} from './financePowerBI.ts';
import {balanceSummaryDax,balanceInvoiceDax} from './powerBIBalanceDax.ts';
export async function readPowerBIBalances(base44,user,state,input,scope){
 if(!scope)throw new Error('Commercial project access must be resolved first.');
 if(!state?.dataset_id)throw new Error('Activate the Power BI reporting source first.');
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const token=await powerToken(base44);
 if(input.action==='balanceSummary'){
  const rows=await powerQuery(token,state.dataset_id,balanceSummaryDax(asOf,scope.codes));
  const totals=['creditors','debtors'].map(kind=>{const groups=rows.filter(r=>r.Kind===kind),missing=groups.find(r=>r.Bucket==='Unknown balance')?.Invoices||0;return {kind,amount:missing?null:groups.reduce((n,r)=>n+(r.Amount||0),0),overdue:missing?null:groups.filter(r=>['1–30 days','31–60 days','61–90 days','90+ days'].includes(r.Bucket)).reduce((n,r)=>n+(r.Amount||0),0),missing};});
  return {rows,totals,as_of:asOf,read_at:new Date().toISOString(),scope:scope.restricted?'projects':'company'};
 }
 const kind=input.kind||'all',age=input.age||'all',search=String(input.search||'').trim();
 if(!['all','creditors','debtors'].includes(kind)||!['all','overdue','Current','1–30 days','31–60 days','61–90 days','90+ days','No due date'].includes(age)||search.length>120)throw new Error('Invalid outstanding invoice filter.');
 if(input.after&&(!Number.isSafeInteger(input.after.key)||input.after.key<0||!Number.isInteger(input.after.days)||input.after.days< -1||input.after.days>100000))throw new Error('Invalid invoice page.');
 const rows=await powerQuery(token,state.dataset_id,balanceInvoiceDax(asOf,{kind,age,search,after:input.after},scope.codes)),items=rows.slice(0,50),last=items.at(-1);
 return {items,has_more:rows.length>50,next:rows.length>50?{key:last.Key,days:last.Days}:null,as_of:asOf};
}