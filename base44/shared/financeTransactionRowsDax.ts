export function financeTransactionRowsDax(codes,costsOnly=false){
 const t="'crf00_transaction_tb'";
 const costs=`(${t}[crf00_journal]="APJ" && ${t}[Account number]>=5000 && ${t}[Account number]<6000)`;
 const income=`(${t}[crf00_journal]="ARJ" && ${t}[Account number]>=4000 && ${t}[Account number]<5000)`;
 const filter=`FILTER(${t},(${t}[Project ID] IN ${codes} || ${t}[Consol_Project_No] IN ${codes}) && (${costsOnly?costs:`${income} || ${costs}`}))`;
 return `SUMMARIZE(${filter},${t}[GL entry key],${t}[Paid date],${t}[Due date],${t}[Amount],${t}[crf00_journal],${t}[Account number])`;
}