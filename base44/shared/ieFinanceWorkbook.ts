import {ieError,ieText} from './ieAccess.ts';
import {ieFinanceKeys} from './ieFinanceFields.ts';
const labels={
 'value':'engagement_value','i&e invoiced payment':'invoiced','payment within als fees':'als_fees','added value - £foc amount':'added_value',
 'leisure database costs':'leisure_database_costs','active insight costs':'active_insight_costs','meme costs (als)':'meme_costs','meme value':'meme_value',
 'sam time (£40 per hour)':'sam_time_cost','sam value (£60 per hour)':'sam_value','ppc':'ppc','als cost':'als_costs','als costs':'als_costs'
};
export function ieWorkbookFinance(item){
 if(!item.origin?.startsWith('sharepoint:'))return null;
 const out=Object.fromEntries(ieFinanceKeys.map(key=>[key,null]));let payment='';
 for(const line of String(item.description||'').split(/\r?\n/)){
  const match=line.match(/^([^:]+):[ \t]*(.*)$/);if(!match)continue;
  const label=match[1].trim().replace(/\s+/g,' ').toLowerCase(),key=labels[label];
  if(label==='payment type')payment=match[2].trim();
  if(!key)continue;const text=match[2].trim().replace(/^£\s*/,'').replace(/,/g,'');
  if(/^\d+(?:\.\d+)?$/.test(text)&&Number(text)<=1e12)out[key]=Math.round(Number(text)*100)/100;
 }
 if(ieFinanceKeys.every(key=>out[key]===null))return null;
 const type=payment.toLowerCase();
 out.payment_type=type.includes('foc')?'added_value':type.includes('als')&&type.includes('fee')?'als_fees':type.includes('invoice')?'direct_invoice':type.includes('sponsor')?'sponsorship':payment?'other':'';
 return {...out,engagement_id:item.id,source:'workbook',saved_by_name:'Original I&E workbook',notes:payment?`Workbook payment type: ${payment}`:''};
}
export async function ieBackfillFinance(base44,user,input){
 if(user.role!=='admin')ieError('Administrator access required.',403);
 const db=base44.asServiceRole.entities,page=await db.IEEngagement.filter({origin:{$regex:'^sharepoint:'}},{sort:'created_date',limit:30,fields:['origin','description'],...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
 if(!page.items.length)return {imported:0,has_more:false};
 const existing=await db.IEFinance.filter({engagement_id:{$in:page.items.map(item=>item.id)}},{limit:100,fields:['engagement_id']});
 if(existing.has_more)ieError('Too many finance records in this import batch.');
 const recorded=new Set(existing.items.map(item=>item.engagement_id));
 const records=page.items.filter(item=>!recorded.has(item.id)).map(ieWorkbookFinance).filter(Boolean);
 if(records.length)await db.IEFinance.upsert(records,{key:'engagement_id'});
 return {imported:records.length,has_more:page.has_more,next_cursor:page.next_cursor};
}