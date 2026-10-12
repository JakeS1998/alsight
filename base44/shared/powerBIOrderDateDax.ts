const norm=column=>`UPPER(TRIM(COALESCE(${column},"")))`;
export function orderDateVariables(){
 const t="'crf00_transaction_tb'",fields=['Document number','Document reference','Journal entry reference no.'];
 const conditions=fields.map(field=>`(${norm(`${t}[${field}]`)} IN linkedRefs)`).join(' || ');
 // Link SOs to invoice references; accept PO supplier references only when unique.
 return `VAR poRef=MAXX(FILTER('PO_Log',${norm("'PO_Log'[Document number]")}=ref),${norm("'PO_Log'[Reference number]")}) VAR aliasOrders=FILTER('PO_Log',${norm("'PO_Log'[Reference number]")}=poRef) VAR uniquePORef=IF(LEN(poRef)>0 && COUNTROWS(SUMMARIZE(aliasOrders,'PO_Log'[Document number]))=1,poRef,BLANK()) VAR invoiceRefs=SELECTCOLUMNS(FILTER('Map',${norm("'Map'[Converted from.2]")}=ref),"LinkedReference",${norm("'Map'[Document number]")}) VAR linkedRefs=FILTER(DISTINCT(UNION(ROW("LinkedReference",ref),ROW("LinkedReference",uniquePORef),invoiceRefs)),LEN([LinkedReference])>0) VAR matched=FILTER(${t},${conditions})`;
}