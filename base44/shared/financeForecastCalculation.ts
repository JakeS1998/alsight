import {projectCompletionDates} from './projectCompletionDates.ts';
export const monthIndex=month=>Number(month.slice(0,4))*12+Number(month.slice(5,7))-1;
export const monthKey=index=>`${Math.floor(index/12)}-${String(index%12+1).padStart(2,'0')}`;
const date=value=>{const s=String(value||'').slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s?s:null;};
const validMoney=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const cents=value=>Math.round(value*100);
export function forecastProject(input,today,snapshot){
 const {project:p,delivery:d,actuals,linked}=input,value=p.submitted_proposal_value??p.estimated_value;
 const result={id:p.id,name:p.name,code:p.project_number||'',value:validMoney(value)?value:0,valueSource:p.submitted_proposal_value!=null?'Submitted fee proposal':'Estimated value',end:null,endBasis:null,reason:null,invoiceNote:null,poNote:null};
 if(!validMoney(value)||value<=0)return {...result,reason:'No positive value after applying the submitted proposal override'};
 if((date(d.pc_achieved)&&date(d.pc_achieved)<=today)||(date(p.practical_completion_date)&&date(p.practical_completion_date)<=today))return {...result,reason:'Practical completion already recorded'};
 const expected=projectCompletionDates(p).riba5_system_date;
 for(const [value,basis]of [[d.forecast_pc,'Forecast practical completion'],[d.original_pc,'Original practical completion'],[p.riba5_system_date,'Expected RIBA 5 completion'],[p.practical_completion_date,'Practical completion date'],[expected,'Calculated programme completion']]){const end=date(value);if(end){result.end=end;result.endBasis=basis;break;}}
 if(!result.end)return {...result,reason:'No usable programme end date'};
 if(result.end<=today)return {...result,reason:'Programme end date is not in the future'};
 const totals=kind=>{const rows=actuals.filter(a=>a.kind===kind);return {amount:rows.reduce((n,a)=>n+(a.has_amount===true?(a.sum_amount||0):0),0),missing:rows.reduce((n,a)=>n+(a.has_amount===true?0:a.count),0)};};
 const invoices=totals('invoices'),pos=totals('purchase_orders'),verified=snapshot&&linked;
 result.invoiceNote=!verified?'Full-value baseline: no confirmed finance link':invoices.missing?'Full-value baseline: invoice amounts unavailable':'Client value less recorded invoice amounts';
 result.invoiceBaseline=!verified||invoices.missing>0;
 result.invoiceRemaining=Math.max(0,cents(value)-(result.invoiceBaseline?0:cents(invoices.amount)));
 const cost=validMoney(input.cost)?input.cost:validMoney(d.contract_sum)?d.contract_sum:null;
 result.costSource=validMoney(input.cost)?'Submitted proposal supplier costs':cost!=null?'Recorded construction contract sum (construction only)':null;
 result.poRemaining=cost==null||pos.missing>0?null:Math.max(0,cents(cost)-cents(pos.amount));
 result.poNote=cost==null?'Supplier cost budget not recorded':pos.missing?'Recorded PO amounts incomplete':!verified?'Cost baseline: no confirmed finance link':`${result.costSource}, less recorded POs`;
 result.months=monthIndex(result.end.slice(0,7))-monthIndex(today.slice(0,7))+1;
 result.firstMonth=monthIndex(today.slice(0,7));
 return result;
}
export function monthlyShare(total,project,index){
 if(total==null||project.reason||index<project.firstMonth||index>=project.firstMonth+project.months)return null;
 const share=Math.floor(total/project.months),last=index===project.firstMonth+project.months-1;
 return (share+(last?total-share*project.months:0))/100;
}