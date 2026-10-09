const table=s=>`'${s.table}'`, col=(s,k)=>`${table(s)}[${s[k]}]`, text=v=>`"${String(v||'').replace(/"/g,'""')}"`;
function grouped(s,type){
 const code=s.code?col(s,'code'):null;
 return `SELECTCOLUMNS(SUMMARIZE(${table(s)},${col(s,'project')}${code?','+code:''},"_amount",SUM(${col(s,'value')}),"_orders",DISTINCTCOUNT(${col(s,'reference')}),"_missing",COUNTBLANK(${col(s,'value')})),"Project",COALESCE(${col(s,'project')} & "",""),"Code",${code?`COALESCE(${code} & "","")`:'""'},"_SO",${type==='SO'?'[_amount]':'BLANK()'},"_PO",${type==='PO'?'[_amount]':'BLANK()'},"_SOCount",${type==='SO'?'[_orders]':'0'},"_POCount",${type==='PO'?'[_orders]':'0'},"_Missing",[_missing])`;
}
export const projectTable=s=>`GROUPBY(UNION(${grouped(s.SO,'SO')},${grouped(s.PO,'PO')}),[Project],[Code],"SO",SUMX(CURRENTGROUP(),[_SO]),"PO",SUMX(CURRENTGROUP(),[_PO]),"SOCount",SUMX(CURRENTGROUP(),[_SOCount]),"POCount",SUMX(CURRENTGROUP(),[_POCount]),"Missing",SUMX(CURRENTGROUP(),[_Missing]))`;
export function summaryDax(s){return `EVALUATE VAR P=${projectTable(s)} RETURN ROW("SO",SUM(${col(s.SO,'value')}),"PO",SUM(${col(s.PO,'value')}),"Projects",COUNTROWS(P),"SOCount",DISTINCTCOUNT(${col(s.SO,'reference')}),"POCount",DISTINCTCOUNT(${col(s.PO,'reference')}),"Missing",COUNTBLANK(${col(s.SO,'value')})+COUNTBLANK(${col(s.PO,'value')}))`;}
export function projectsDax(s,input={}){
 const conditions=[];
 if(input.search)conditions.push(`CONTAINSSTRING([Project],${text(input.search)}) || CONTAINSSTRING([Code],${text(input.search)})`);
 if(input.after)conditions.push(`([Project]>${text(input.after.name)} || ([Project]=${text(input.after.name)} && [Code]>${text(input.after.code)}))`);
 const t=projectTable(s),filtered=conditions.length?`FILTER(${t},${conditions.map(c=>`(${c})`).join(' && ')})`:t;
 return `EVALUATE TOPN(51,${filtered},[Project],ASC,[Code],ASC) ORDER BY [Project] ASC,[Code] ASC`;
}
export function ordersDax(s,mapping,after=''){
 const match=`COALESCE(${col(s,'project')} & "","")=${text(mapping.source_name)}${s.code?` && COALESCE(${col(s,'code')} & "","")=${text(mapping.source_code)}`:''}`;
 const rows=`SELECTCOLUMNS(CALCULATETABLE(SUMMARIZE(${table(s)},${col(s,'reference')},"_amount",SUM(${col(s,'value')}),"_missing",COUNTBLANK(${col(s,'value')})),FILTER(${table(s)},${match})),"Reference",COALESCE(${col(s,'reference')} & "",""),"Value",[_amount],"Missing",[_missing])`;
 return `EVALUATE TOPN(51,${after?`FILTER(${rows},[Reference]>${text(after)})`:rows},[Reference],ASC) ORDER BY [Reference] ASC`;
}