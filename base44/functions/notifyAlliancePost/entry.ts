import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {internalRoles} from '../../shared/allianceLayerAccess.ts';
export default async function(req) {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user || user.role!=='admin') return Response.json({error:'Forbidden'},{status:403});
    const {postId}=await req.json();
    if(typeof postId!=='string' || !/^[a-f0-9]{24}$/i.test(postId)) return Response.json({error:'Invalid post.'},{status:400});
    const db=base44.asServiceRole.entities,post=await db.AlliancePulseItem.get(postId);
    if(!post || post.status!=='published') return Response.json({skipped:true});
    const company=post.type==='Company Update',everyone=/(^|\s)@everyone(?=$|[\s.,!?;:])/i.test(post.summary || '');
    const ids=(post.mentions || []).map(mention=>mention.user_id);
    if(!company && !everyone && !ids.length) return Response.json({skipped:true});
    const group=post.group_id ? await db.AlliancePulseGroup.get(post.group_id) : null;
    if(post.group_id && !group) return Response.json({skipped:true});
    if(company) {
      const author=await db.User.get(post.author_id);
      if(group || !author || !['admin','director','regional_director'].includes(author.role)) return Response.json({skipped:true});
    }
    let offset=0,notified=0;
    const query={role:{$in:internalRoles}};
    if(group) query.id={$in:group.member_ids};else if(!company && !everyone) query.id={$in:ids};
    while(true) {
      const people=await db.User.filter(query,'id',100,offset);
      const recipients=people.filter(person=>internalRoles.includes(person.role) && (!group || group.member_ids.includes(person.id)) && (company || everyone || ids.includes(person.id)));
      if(recipients.length) {
        const result=await db.AllianceNotification.upsert(recipients.map(person=>({notification_key:`${post.id}:${person.id}`,user_id:person.id,post_id:post.id,group_id:group?.id || '',reason:company ? 'company' : ids.includes(person.id) ? 'mention' : 'everyone',author_name:(post.author_name || 'Alliance colleague').slice(0,200)})),{key:'notification_key'});
        notified+=result.created;
      }
      if(people.length<100) break;
      offset+=100;
    }
    return Response.json({notified});
  } catch(error) {return Response.json({error:error.message || 'Unable to notify colleagues.'},{status:500});}
}