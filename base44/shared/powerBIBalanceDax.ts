const literal=value=>`"${String(value).replace(/"/g,'""')}"`;
export function balanceVariables(asOf,codes=null){
 const t="'crf00_transaction_tb'",[year,month,day]=asOf.split('-').map(Number);
 if(codes&&(codes.length>1000||codes.some(code=>code.length>250)))throw new Error('Project balance scope exceeds the reporting limit.');
 const allowed=codes===null?'TRUE()':codes.length?`UPPER(TRIM([Consol_Project_No])) IN {${codes.map(literal).join(',')}}`:'FALSE()';
 return `VAR todayDate=DATE(${year},${month},${day})
 VAR source=SELECTCOLUMNS(FILTER(${t},${t}[Account number] IN {1100,2100} && LEN(TRIM(${t}[Document number]))>0),"Kind",IF([Account number]=2100,"creditors","debtors"),"PartyKey",IF([Account number]=2100,COALESCE(IF(LEN(TRIM([Supplier ID]))>0,[Supplier ID]),[Supplier name]),COALESCE(IF(LEN(TRIM([Customer ID]))>0,[Customer ID]),[Customer name])),"Document",TRIM([Document number]),"SourceKey",[GL entry key],"SourceEntered",[Total entered],"SourcePaid",[Total paid],"SourceControl",[Amount],"SourceDue",[Due date],"SourceParty",IF([Account number]=2100,[Supplier name],[Customer name]),"SourceProject",IF(${allowed},[Consol_Project_No],BLANK()),"SourceReference",[Document reference],"SourceAllowed",IF(${allowed},1,0),"SourceBlocked",IF(NOT(${allowed}),1,0))
 VAR grouped=GROUPBY(source,[Kind],[PartyKey],[Document],"EntryKey",MINX(CURRENTGROUP(),[SourceKey]),"Entered",MAXX(CURRENTGROUP(),[SourceEntered]),"Paid",MAXX(CURRENTGROUP(),[SourcePaid]),"Control",SUMX(CURRENTGROUP(),[SourceControl]),"DueDate",MINX(CURRENTGROUP(),[SourceDue]),"Party",MAXX(CURRENTGROUP(),[SourceParty]),"Project",MAXX(CURRENTGROUP(),[SourceProject]),"Reference",MAXX(CURRENTGROUP(),[SourceReference]),"Allowed",MAXX(CURRENTGROUP(),[SourceAllowed]),"Blocked",SUMX(CURRENTGROUP(),[SourceBlocked]))
 VAR amounts=ADDCOLUMNS(FILTER(grouped,ABS([Control])>0.005 && [Allowed]=1 && [Blocked]=0),"Balance",IF(ISBLANK([Entered]),BLANK(),ROUND((ABS([Entered])-ABS(COALESCE([Paid],0)))*SIGN([Control])*IF([Kind]="creditors",-1,1),2)),"Days",IF(ISBLANK([DueDate]),-1,MAX(0,DATEDIFF([DueDate],todayDate,DAY))))
 VAR invoices=ADDCOLUMNS(FILTER(amounts,ISBLANK([Balance])||ABS([Balance])>0.005),"Bucket",SWITCH(TRUE(),ISBLANK([Balance]),"Unknown balance",ISBLANK([DueDate]),"No due date",[Days]=0,"Current",[Days]<=30,"1–30 days",[Days]<=60,"31–60 days",[Days]<=90,"61–90 days","90+ days"))`;
}
export function balanceSummaryDax(asOf,codes=null){return `EVALUATE ${balanceVariables(asOf,codes)} RETURN GROUPBY(invoices,[Kind],[Bucket],"Amount",SUMX(CURRENTGROUP(),[Balance]),"Invoices",COUNTX(CURRENTGROUP(),1))`;}
export function balanceInvoiceDax(asOf,input,codes=null){
 const tests=['NOT(ISBLANK([Balance]))'];
 if(input.kind!=='all')tests.push(`[Kind]=${literal(input.kind)}`);
 if(input.age==='overdue')tests.push('[Days]>0');else if(input.age!=='all')tests.push(`[Bucket]=${literal(input.age)}`);
 if(input.search)tests.push(`(CONTAINSSTRING([Party],${literal(input.search)})||CONTAINSSTRING([Document],${literal(input.search)})||CONTAINSSTRING([Reference],${literal(input.search)})||CONTAINSSTRING([Project],${literal(input.search)}))`);
 if(input.after)tests.push(`([Days]<${input.after.days}||([Days]=${input.after.days}&&[EntryKey]>${input.after.key}))`);
 return `EVALUATE ${balanceVariables(asOf,codes)} VAR selected=FILTER(invoices,${tests.join(' && ')}) RETURN TOPN(51,SELECTCOLUMNS(selected,"Key",[EntryKey],"Kind",[Kind],"Party",[Party],"Document",[Document],"Reference",[Reference],"Project",[Project],"DueDate",[DueDate],"Entered",[Entered],"Paid",[Paid],"Balance",[Balance],"Days",[Days],"Bucket",[Bucket]),[Days],DESC,[Key],ASC) ORDER BY [Days] DESC,[Key] ASC`;
}