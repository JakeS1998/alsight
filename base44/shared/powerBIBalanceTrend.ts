import {powerToken,powerQuery} from './financePowerBI.ts';
import {projectBalanceHistoryDax} from './projectBalanceHistoryDax.ts';
import {customerOverdueHistoryDax} from './customerOverdueHistoryDax.ts';
export async function readPowerBIBalanceTrend(base44,state,input,scope){
 if(!state?.dataset_id)throw new Error('Activate the Power BI reporting source first.');
 if(!scope||!['creditors','debtors'].includes(input.kind))throw new Error('Choose creditors or debtors.');
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),t="'crf00_transaction_tb'",account=input.kind==='creditors'?2100:1100;
 if(scope.restricted){
  const reconstructed=input.kind==='debtors';
  const query=reconstructed?customerOverdueHistoryDax(asOf,scope.codes):projectBalanceHistoryDax(asOf,input.kind,scope.codes);
  const rows=await powerQuery(await powerToken(base44),state.dataset_id,query);
  return {rows,kind:input.kind,as_of:asOf,scope:'projects',period:reconstructed?'invoice_history':'three_months',reconstructed,basis:reconstructed?'Estimated history reconstructed from invoice due and final paid dates. Each invoice becomes overdue the day after its due date and stops on its final payment date. Historical values assume the full invoice amount remained outstanding until final payment; partial-payment dates are not available. Today uses the remaining balance. Shared invoices and settled invoices without payment dates are excluded.':'Power BI overdue balance history for wholly attributable project invoices. Shared invoices are excluded.',unavailable:scope.codes?.length?'No dated invoice history is available for wholly attributable invoices.':'Link this project to its finance codes to load balance history.'};
 }
 const [year,month,day]=asOf.split('-').map(Number);
 const query=`EVALUATE VAR asOf=DATE(${year},${month},${day}) VAR window=FILTER(ALL('DateTable'[Date]),'DateTable'[Date]>=EDATE(asOf,-3) && 'DateTable'[Date]<=asOf) VAR history=SUMMARIZECOLUMNS('DateTable'[Date],window,TREATAS({${account}},${t}[Account number]),"Balance",[OS Overdue]) VAR averageBalance=AVERAGEX(history,[Balance]) RETURN SELECTCOLUMNS(history,"Date",FORMAT('DateTable'[Date],"yyyy-MM-dd"),"Balance",[Balance],"Average",averageBalance) ORDER BY [Date] ASC`;
 const rows=await powerQuery(await powerToken(base44),state.dataset_id,query);
 return {rows,kind:input.kind,as_of:asOf,scope:'company',basis:'Power BI overdue balance history.'};
}