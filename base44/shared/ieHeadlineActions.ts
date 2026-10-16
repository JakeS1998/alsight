import {ieScope,ieError,ieText} from './ieAccess.ts';
import {ieServiceValue} from './ieServiceValue.ts';
export async function ieHeadlineAction(base44,user,input){
 const db=base44.asServiceRole.entities;
 if(input.action==='backfillServiceValues'){
  if(user.role!=='admin')ieError('Administrator access required.',403);
  const page=await db.IEEngagement.filter({},{sort:'created_date',limit:30,fields:['origin','description','service_value','service_value_source'],...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
  if(!page.items.length)return {updated:0,has_more:false};
  const finance=await db.IEFinance.filter({engagement_id:{$in:page.items.map(item=>item.id)}},{sort:'-updated_date',limit:100,fields:['engagement_id','engagement_value']});
  if(finance.has_more)ieError('Too many finance records in this reporting batch.');
  const byEngagement=new Map();for(const row of finance.items)if(!byEngagement.has(row.engagement_id))byEngagement.set(row.engagement_id,row);
  const updates=page.items.map(item=>({id:item.id,...ieServiceValue(item,byEngagement.get(item.id))})).filter((value,index)=>value.service_value!==page.items[index].service_value||value.service_value_source!==page.items[index].service_value_source);
  if(updates.length)await db.IEEngagement.bulkUpdate(updates);
  return {updated:updates.length,has_more:page.has_more,next_cursor:page.next_cursor};
 }
 const result=await db.IEEngagement.aggregate({query:ieScope(user),groupBy:['status','service_value_source'],sum:'service_value',limit:100});
 if(result.truncated)ieError('The I&E headline reporting limit was reached.');
 let total=0,active=0,value=0,withValue=0;
 for(const row of result.rows){
  total+=row.count;
  if(['planned','live'].includes(row.status))active+=row.count;
  if(['workbook','finance'].includes(row.service_value_source)){withValue+=row.count;value+=Number(row.sum_service_value)||0;}
 }
 return {total,active,serviceValue:withValue?Math.round(value*100)/100:null,withValue,refreshedAt:new Date().toISOString()};
}