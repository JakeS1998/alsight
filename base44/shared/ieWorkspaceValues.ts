import {ieError,ieText} from './ieAccess.ts';
export const workKinds=['research','consultation','creative'];
export function ieDate(value){const date=ieText(value,10);if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))ieError('Enter a valid date.');return date;}
export function ieNumber(value,integer=false){if(value===null||value===undefined||value==='')return null;if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e12||integer&&!Number.isInteger(value))ieError('Enter a valid non-negative '+(integer?'whole number.':'amount.'));return integer?value:Math.round(value*100)/100;}
export function ieWorkValues(values,item){
 const out={kind:ieText(values.kind,30),title:ieText(values.title,200),work_type:ieText(values.work_type,100),status:ieText(values.status,30),owner_id:ieText(values.owner_id,100),notes:ieText(values.notes,4000),due_date:ieDate(values.due_date)};
 if(!workKinds.includes(out.kind)||!out.title||!['planned','in_progress','complete'].includes(out.status))ieError('Enter a title, work area and status.');
 const people=[...(item.owner_id?[{id:item.owner_id,name:item.owner_name}]:[]),...(item.team||[])],owner=people.find(p=>p.id===out.owner_id);
 if(out.owner_id&&!owner)ieError('Choose the engagement owner or an existing team member.');out.owner_name=owner?.name||'';
 out.held_on=out.kind==='consultation'?ieDate(values.held_on):'';out.audience=out.kind==='consultation'?ieText(values.audience,250):'';
 for(const key of ['attendees','stakeholders','survey_responses'])out[key]=out.kind==='consultation'?ieNumber(values[key],true):null;
 return out;
}
export function ieFinanceValues(values){
 const out={payment_type:ieText(values.payment_type,50),notes:ieText(values.notes,4000)};
 if(!['','direct_invoice','als_fees','added_value','sponsorship','other'].includes(out.payment_type))ieError('Choose a payment arrangement.');
 for(const key of ['engagement_value','invoiced','added_value'])out[key]=ieNumber(values[key]);return out;
}
export async function ieWorkspaceEvent(db,user,item,summary){await db.IEEvent.create({engagement_id:item.id,engagement_name:item.name,actor_id:user.id,actor_name:user.full_name||user.email,kind:'workspace_updated',summary,occurred_at:new Date().toISOString(),changes:{}});}