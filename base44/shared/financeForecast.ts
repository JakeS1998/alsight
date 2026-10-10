import {forecastInputs} from './financeForecastInputs.ts';
import {forecastProject,monthIndex,monthKey,monthlyShare} from './financeForecastCalculation.ts';
import {scopedReadCache} from './scopedReadCache.ts';
export async function readFinanceForecast(base44,user,state,input){
 const search=String(input.search||'').trim();if(search.length>120)throw new Error('Project search is too long.');
 const horizon=input.horizon??12,windowOffset=input.windowOffset??0,offset=input.offset??0;
 if(![6,12,24].includes(horizon)||!Number.isInteger(windowOffset)||windowOffset<0||windowOffset>1200||!Number.isInteger(offset)||offset<0||offset>100000)throw new Error('Invalid forecast period or project page.');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=key=>parts.find(p=>p.type===key).value,today=`${part('year')}-${part('month')}-${part('day')}`;
 const key=JSON.stringify(['finance-forecast-line-items-v1',user.id,user.role,user.data,user.account_id,user.region,user.delegate_region,user.staff_aad_id,user.dataverse_systemuser_id,user.delegate_of,search,today,state?.namespace,state?.active_generation,state?.last_completed_at]);
 const projects=await scopedReadCache(key,async()=>{const rows=[];for await(const source of forecastInputs(base44,state,search))rows.push(forecastProject(source,today,Boolean(state?.active_generation)));return rows;});
 const first=monthIndex(today.slice(0,7))+windowOffset,last=first+horizon-1,eligible=projects.filter(p=>!p.reason),excluded=projects.filter(p=>p.reason);
 const month=input.month&&/^\d{4}-\d{2}$/.test(input.month)&&monthIndex(input.month)>=first&&monthIndex(input.month)<=last?input.month:monthKey(first),selected=monthIndex(month);
 const monthly=Array.from({length:horizon},(_,i)=>{const index=first+i;let invoice=0,po=0,contributors=0,costCovered=0,invoiceBaselines=0;for(const p of eligible){const amount=monthlyShare(p.invoiceRemaining,p,index);if(amount==null)continue;contributors++;invoice+=Math.round(amount*100);const cost=monthlyShare(p.poRemaining,p,index);if(cost!=null){po+=Math.round(cost*100);costCovered++;}if(p.invoiceBaseline)invoiceBaselines++;}return {month:monthKey(index),invoice:invoice/100,po:costCovered?po/100:null,projects:contributors,missingCosts:contributors-costCovered,invoiceBaselines};});
 const contributions=input.excluded===true?excluded:eligible.filter(p=>monthlyShare(p.invoiceRemaining,p,selected)!=null);
 const items=contributions.slice(offset,offset+25).map(p=>({...p,invoice:p.reason?null:monthlyShare(p.invoiceRemaining,p,selected),po:p.reason?null:monthlyShare(p.poRemaining,p,selected)}));
 return {today,monthly,month,items,total:contributions.length,has_more:offset+25<contributions.length,eligible:eligible.length,excluded:excluded.length,has_later:eligible.some(p=>p.firstMonth+p.months-1>last),snapshot_at:state?.last_completed_at||null};
}