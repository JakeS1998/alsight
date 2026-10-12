import {powerQuery} from './financePowerBI.ts';
export const modelTable=s=>`'${s.table.replace(/'/g,"''")}'`;
const col=(s,key)=>`${modelTable(s)}[${s[key].replace(/\]/g,']]')}]`;
const text=value=>`"${String(value).replace(/"/g,'""')}"`;
export async function modelColumns(token,dataset){return powerQuery(token,dataset,'EVALUATE SELECTCOLUMNS(INFO.VIEW.COLUMNS(), "Table", [Table], "Column", [Name], "DataType", [DataType], "Hidden", [IsHidden])');}
export function validateOrderSources(sources,columns){
 const result={};for(const type of ['PO','SO']){
  const s=sources?.[type];if(!s||typeof s.table!=='string'||s.table.length>120)throw new Error(`${type}: choose a model table.`);
  result[type]={table:s.table};for(const key of ['project','code','reference','value','supplier']){
   const name=s[key]||'';if(typeof name!=='string'||name.length>120)throw new Error('Invalid model column.');
   if(!name){if(['project','reference','value'].includes(key))throw new Error(`${type}: map ${key}.`);result[type][key]='';continue;}
   const found=columns.find(c=>c.Table===s.table&&c.Column===name);if(!found)throw new Error(`${type}: ${name} is not a column in ${s.table}.`);
   if(key==='value'&&!['Number','Decimal','Currency','Integer','Double','Int64','Decimal Number','Fixed Decimal Number'].includes(found.DataType))throw new Error(`${type}: select a numeric order-value column.`);
   result[type][key]=name;
  }
 }return result;
}
export function orderTotalsDax(s){return `EVALUATE ROW("Rows",COUNTROWS(${modelTable(s)}),"Orders",DISTINCTCOUNT(${col(s,'reference')}),"Amount",SUM(${col(s,'value')}),"Missing",COUNTBLANK(${col(s,'value')}),"BlankReferences",COUNTBLANK(${col(s,'reference')}))`;}
export function orderPageDax(s,after=''){
 const rows=`SELECTCOLUMNS(${modelTable(s)},"Reference",COALESCE(${col(s,'reference')} & "",""),"Project",COALESCE(${col(s,'project')} & "",""),"Code",${s.code?`COALESCE(${col(s,'code')} & "","")`:'""'},"Amount",${col(s,'value')},"Supplier",${s.supplier?`COALESCE(${col(s,'supplier')} & "","")`:'""'})`;
 return `EVALUATE TOPN(100,${after?`FILTER(${rows},[Reference]>${text(after)})`:rows},[Reference],ASC) ORDER BY [Reference] ASC`;
}