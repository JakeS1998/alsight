export const ieRoles=['admin','sam','sam_director','director','regional_director','finance','bsm'];
export const ieManagers=['admin','sam','sam_director'];
export function ieError(message,status=400){const error=new Error(message);error.status=status;throw error;}
export const ieIdentity=user=>[user.id,user.staff_aad_id,user.data?.staff_aad_id,user.dataverse_systemuser_id,user.data?.dataverse_systemuser_id].filter(Boolean);
export function ieScope(user){
 if(['admin','sam_director','director','finance'].includes(user.role))return {};
 if(user.role==='sam')return {access_user_ids:user.id};
 if(user.role==='regional_director'){
  const region=user.region||user.data?.region;
  return region?{$or:[{region_id:region},{project_id:{$in:user.ieRegionalProjectIds||[]}}]}:{id:{$in:[]}};
 }
 if(user.role==='bsm')return {bsm_identity:{$in:ieIdentity(user)}};
 ieError('I&E access is not available for this role.',403);
}
export async function ieRecord(base44,user,id){
 if(typeof id!=='string'||id.length>100)ieError('Choose an engagement.');
 const page=await base44.asServiceRole.entities.IEEngagement.filter({...ieScope(user),id},{limit:1});
 if(!page.items.length)ieError('Engagement unavailable or access denied.',403);
 return page.items[0];
}
export function ieEditable(user,item){return ieManagers.includes(user.role)&&(user.role!=='sam'||!item||item.access_user_ids.includes(user.id));}
export function ieText(value,max=250){if(value==null)return '';if(typeof value!=='string'||value.length>max)ieError('Check the length and format of your entry.');return value.trim();}
export const ieToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function ieAttention(){const date=new Date();date.setUTCDate(date.getUTCDate()+7);return {status:{$nin:['completed','cancelled']},$or:[{awaiting_action:true},{target_date:{$gte:'1900-01-01',$lte:date.toISOString().slice(0,10)}}]};}
export const ieEscape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');