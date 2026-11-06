import {balanceVariables} from './powerBIBalanceDax.ts';
export function customerOverdueHistoryDax(asOf,codes){
 return `EVALUATE ${balanceVariables(asOf,codes)}
 VAR datedInvoices=FILTER(amounts,[Kind]="debtors" && NOT(ISBLANK([Entered])) && NOT(ISBLANK([Balance])) && NOT(ISBLANK([DueDate])) && [DueDate]<=todayDate && (ABS([Balance])>0.005 || NOT(ISBLANK([PaidDate]))))
 VAR firstDue=MINX(datedInvoices,[DueDate])
 VAR dates=SELECTCOLUMNS(CALENDAR(COALESCE(firstDue,todayDate),todayDate),"HistoryDate",[Date])
 VAR history=ADDCOLUMNS(dates,"HistoryBalance",VAR point=[HistoryDate] RETURN COALESCE(SUMX(FILTER(datedInvoices,[DueDate]<point && (ABS([Balance])>0.005 || [PaidDate]>point)),IF(point=todayDate,[Balance],ABS([Entered])*IF([Control]<0,-1,1))),0))
 VAR averageBalance=AVERAGEX(history,[HistoryBalance])
 RETURN SELECTCOLUMNS(FILTER(history,NOT(ISBLANK(firstDue))),"Date",FORMAT([HistoryDate],"yyyy-MM-dd"),"Balance",ROUND([HistoryBalance],2),"Average",averageBalance) ORDER BY [Date] ASC`;
}