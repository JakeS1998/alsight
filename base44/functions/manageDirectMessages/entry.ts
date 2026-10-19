import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {withPortalUserNames} from '../../shared/portalUserNames.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  const roles=['admin','director','regional_director','bsm','finance','bdm','sam','sam_director'];
  if(!user || !roles.includes(user.role))return Response.json({error:'Internal team access required.'},{status:403});
  const input=await req.json(),db=base44.asServiceRole.entities;
  if(input.action==='directory') {
   const search=input.search??'',offset=input.offset??0;
   if(typeof search!=='string'||search.length>100||!Number.isInteger(offset)||offset<0||offset>10000)return Response.json({error:'Invalid search.'},{status:400});
   const escaped=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const query={role:{$in:roles},email:{$ne:user.email},...(search?{$or:[{full_name:{$regex:escaped,$options:'i'}},{email:{$regex:escaped,$options:'i'}}]}:{})};
   const rows=await db.User.filter(query,'full_name',31,offset),named=await withPortalUserNames(db,rows.slice(0,30));
   return Response.json({items:named.map(p=>({id:p.id,name:p.full_name||p.email})),has_more:rows.length>30,next_offset:offset+30});
  }
  if(input.action==='inbox') {
   const page=await db.DirectMessageThread.filter({members:user.id},{sort:'-last_sent_at',limit:30,...(input.cursor?{cursor:input.cursor}:{})});
   const unread=await db.DirectMessage.aggregate({query:{recipient_id:user.id,is_read:false},groupBy:'sender_id',limit:1000});
   return Response.json({...page,unread:unread.rows,total_unread:await db.DirectMessage.count({recipient_id:user.id,is_read:false})});
  }
  if(!['messages','send','read'].includes(input.action)||typeof input.peer_id!=='string'||input.peer_id.length>100||input.peer_id===user.id)return Response.json({error:'Invalid conversation.'},{status:400});
  const peer=await db.User.get(input.peer_id);
  if(!peer||!roles.includes(peer.role))return Response.json({error:'Recipient must be an internal team member.'},{status:403});
  const threadKey=[user.id,peer.id].sort().join(':');
  if(input.action==='messages')return Response.json(await db.DirectMessage.filter({thread_key:threadKey},{sort:'-created_date',limit:50,...(input.cursor?{cursor:input.cursor}:{})}));
  if(input.action==='read') {
   const result=await db.DirectMessage.updateMany({thread_key:threadKey,recipient_id:user.id,is_read:false},{$set:{is_read:true}});
   return Response.json({ok:true,has_more:result.has_more});
  }
  const body=typeof input.body==='string'?input.body.trim():'';
  if(!body||body.length>4000)return Response.json({error:'Enter a message of up to 4,000 characters.'},{status:400});
  if(await db.DirectMessage.count({sender_id:user.id,created_date:{$gte:new Date(Date.now()-60000).toISOString()}})>=30)return Response.json({error:'Please wait a moment before sending more messages.'},{status:429});
  const named=await withPortalUserNames(db,[user,peer]);
  const message=await db.DirectMessage.create({thread_key:threadKey,sender_id:user.id,recipient_id:peer.id,body,is_read:false});
  await db.DirectMessageThread.upsert([{thread_key:threadKey,members:[user.id,peer.id],people:named.map(p=>({id:p.id,name:p.full_name||p.email})),last_message:body,last_sent_at:message.created_date}],{key:'thread_key'});
  return Response.json({message});
 }catch(error){return Response.json({error:error.message},{status:500});}
}