import {ieError} from './ieAccess.ts';
export async function ieHeadlineTotals(db,query){
 const result=await db.IEEngagement.aggregate({query,groupBy:['status','service_value_source'],sum:'service_value',limit:100});
 if(result.truncated)ieError('The I&E headline reporting limit was reached.');
 let total=0,active=0,value=0,withValue=0;
 for(const row of result.rows){
  total+=row.count;
  if(['planned','live'].includes(row.status))active+=row.count;
  if(['workbook','finance'].includes(row.service_value_source)){withValue+=row.count;value+=Number(row.sum_service_value)||0;}
 }
 return {total,active,serviceValue:withValue?Math.round(value*100)/100:null,withValue,refreshedAt:new Date().toISOString()};
}