import {powerToken,powerQuery} from './financePowerBI.ts';
export async function readPowerBIBalanceTrend(base44,state,input,scope){
 if(!state?.dataset_id)throw new Error('Activate the Power BI reporting source first.');
 if(!scope||!['creditors','debtors'].includes(input.kind))throw new Error('Choose creditors or debtors.');
 const asOf=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),t="'crf00_transaction_tb'",account=input.kind==='creditors'?2100:1100;
 // The model does not expose payment-event history for secure per-project reconstruction.
 // Never substitute raw invoice ledger totals, which omit payment history.
 if(scope.restricted)return {rows:[],kind:input.kind,as_of:asOf,scope:'projects',unavailable:'Historical balances cannot yet be safely attributed to your permitted projects. Current balances and invoices remain project-scoped.'};
 const [year,month,day]=asOf.split('-').map(Number);
 const query=`EVALUATE VAR asOf=DATE(${year},${month},${day}) VAR window=FILTER(ALL('DateTable'[Date]),'DateTable'[Date]>=EDATE(asOf,-3) && 'DateTable'[Date]<=asOf) VAR history=SUMMARIZECOLUMNS('DateTable'[Date],window,TREATAS({${account}},${t}[Account number]),"Balance",[OS Overdue]) VAR averageBalance=AVERAGEX(history,[Balance]) RETURN SELECTCOLUMNS(history,"Date",FORMAT('DateTable'[Date],"yyyy-MM-dd"),"Balance",[Balance],"Average",averageBalance) ORDER BY [Date] ASC`;
 const rows=await powerQuery(await powerToken(base44),state.dataset_id,query);
 return {rows,kind:input.kind,as_of:asOf,scope:'company',basis:'Power BI overdue balance history.'};
}