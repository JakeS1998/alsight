import {powerToken,powerQuery} from './financePowerBI.ts';
import {mainProjectNumber} from './financeProjectNumberGroups.ts';
export async function powerBIProjectCashFlow(base44,state,mappings){
 const codes=[...new Set(mappings.flatMap(m=>[m.source_code,mainProjectNumber(m.source_code)]).filter(Boolean))];
 if(!codes.length)return {entries:[],available:true,missingDates:0,missingValues:0,dueDateFallback:0};
 const values=codes.map(code=>`"${String(code).replace(/"/g,'""')}"`).join(','),t="'crf00_transaction_tb'";
 // Only invoice income/cost lines: exclude control accounts, VAT and journals that repeat the invoice.
 // GL keys and source values prevent duplicate model joins from multiplying a transaction.
 const filter=`FILTER(${t},(${t}[Project ID] IN {${values}} || ${t}[Consol_Project_No] IN {${values}}) && ((${t}[crf00_journal]="ARJ" && ${t}[Account number]>=4000 && ${t}[Account number]<5000) || (${t}[crf00_journal]="APJ" && ${t}[Account number]>=5000 && ${t}[Account number]<6000)))`;
 const unique=`SUMMARIZE(${filter},${t}[GL entry key],${t}[Paid date],${t}[Due date],${t}[Amount],${t}[crf00_journal],${t}[Account number])`;
 const paid=`NOT(ISBLANK([Paid date]))`,date=`COALESCE([Paid date],[Due date])`;
 const points=`SELECTCOLUMNS(${unique},"date",IF(ISBLANK(${date}),BLANK(),FORMAT(${date},"yyyy-MM-dd")),"type",IF([crf00_journal]="ARJ",IF(${paid},"received","expectedReceived"),IF(${paid},"spent","expectedSpent")),"value",IF([crf00_journal]="ARJ",-[Amount],[Amount]))`;
 const query=`EVALUATE TOPN(1001,GROUPBY(${points},[date],[type],"amount",SUMX(CURRENTGROUP(),[value]),"count",COUNTX(CURRENTGROUP(),1)),[date],ASC,[type],ASC)`;
 const rows=await powerQuery(await powerToken(base44),state.dataset_id,query);
 if(rows.length>1000)throw new Error('Project payment history exceeds the chart reporting limit.');
 const entries=[];let missingDates=0,missingValues=0,dueDateFallback=0;
 for(const row of rows){
  if(!row.date){missingDates+=row.count;continue;}
  if(!Number.isFinite(row.amount)){missingValues+=row.count;continue;}
  if(row.type.startsWith('expected'))dueDateFallback+=row.count;
  entries.push({date:row.date,type:row.type,amount:row.amount});
 }
 return {entries,available:true,missingDates,missingValues,dueDateFallback};
}