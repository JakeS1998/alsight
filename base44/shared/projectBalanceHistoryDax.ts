import {balanceVariables} from './powerBIBalanceDax.ts';
export function projectBalanceHistoryDax(asOf,kind,codes){
 const [year,month,day]=asOf.split('-').map(Number),account=kind==='creditors'?2100:1100,t="'crf00_transaction_tb'";
 // Use every entry of wholly permitted invoices, including settled invoices.
 // Shared or unassigned entries never become visible through a project filter.
 return `EVALUATE ${balanceVariables(asOf,codes)}
 VAR safeDocuments=SELECTCOLUMNS(FILTER(grouped,[Kind]="${kind}" && [Allowed]=1 && [Blocked]=0),"SafeParty",[PartyKey],"SafeDocument",[Document])
 VAR safeEntries=SELECTCOLUMNS(FILTER(source,[Kind]="${kind}" && VAR party=[PartyKey] VAR document=[Document] RETURN CONTAINS(safeDocuments,[SafeParty],party,[SafeDocument],document)),"Key",[SourceKey])
 VAR window=FILTER(ALL('DateTable'[Date]),'DateTable'[Date]>=EDATE(DATE(${year},${month},${day}),-3) && 'DateTable'[Date]<=DATE(${year},${month},${day}))
 VAR history=SUMMARIZECOLUMNS('DateTable'[Date],window,TREATAS({${account}},${t}[Account number]),TREATAS(safeEntries,${t}[GL entry key]),"Balance",${kind==='creditors'?'-[OS Overdue]':'[OS Overdue]'})
 VAR averageBalance=AVERAGEX(history,[Balance])
 RETURN SELECTCOLUMNS(history,"Date",FORMAT('DateTable'[Date],"yyyy-MM-dd"),"Balance",[Balance],"Average",averageBalance) ORDER BY [Date] ASC`;
}