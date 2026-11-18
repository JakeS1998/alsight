export async function meetingSummaryCounts(db, key) {
 const {rows}=await db.CRMActivity.aggregate({query:{key_points:key},groupBy:'next_action',countDistinct:'commitments',limit:20});
 const counts={reviewed:0,actions:0,completed:0,notes:0};
 const names={meeting_review:'reviewed',meeting_action:'actions',meeting_completed:'completed',meeting_note:'notes'};
 for(const row of rows)if(names[row.next_action])counts[names[row.next_action]]=row.next_action==='meeting_note' ? (row.count ?? 0) : (row.count_distinct_commitments ?? 0);
 return counts;
}
export const meetingDate=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/London'}).format(new Date(value));
const escapeText=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export async function emailMeetingSummary(base44,user,session,closed) {
 const svc=base44.asServiceRole,db=svc.entities,now=Date.now();
 const recent=await db.CRMActivity.filter({next_action:'meeting_summary_send',author_id:user.id,occurred_at:{$gte:new Date(now-86400000).toISOString()}},{sort:'-occurred_at',limit:5});
 if(recent.items.length>=5 || recent.items.some(row=>Date.parse(row.occurred_at)>now-300000))return Response.json({error:'Please wait before sending another summary. You can send up to five meeting summaries in 24 hours.'},{status:429});
 const ids=[...new Set([session.owner_id,...(session.meeting_hosts || []).map(p=>p.id),...(session.meeting_attendees || []).map(p=>p.id)].filter(Boolean))];
 if(!ids.length || ids.length>61)return Response.json({error:'This session does not have a valid participant list.'},{status:400});
 const [users,counts]=await Promise.all([db.User.filter({id:{$in:ids}},'full_name',61),meetingSummaryCounts(base44.entities,session.key_points)]);
 const staff=['admin','director','bdm','bsm','regional_director','finance','project_manager'];
 const available=new Map(users.filter(person=>ids.includes(person.id) && staff.includes(person.role) && person.email).map(person=>[person.id,person.email.trim().toLowerCase()]));
 const recipients=[...new Set(available.values())];
 if(!recipients.length)return Response.json({error:'No registered hosts or attendees can receive this summary.'},{status:400});
 // Record the explicit send attempt before contacting the provider, without storing addresses or note contents.
 await db.CRMActivity.create({type:'system',next_action:'meeting_summary_send',owner_id:user.id,author_id:user.id,commitments:session.id,subject:'Meeting summary send requested',occurred_at:new Date(now).toISOString()});
 const variables={meeting_name:escapeText(session.subject.slice(0,120)),issue_date:meetingDate(closed.occurred_at),reviewed:String(counts.reviewed),actions:String(counts.actions),completed:String(counts.completed),notes:String(counts.notes),cta_url:`https://als-hub.base44.app/meeting-sessions/${encodeURIComponent(session.id)}`};
 let sent=0;
 for(let offset=0;offset<recipients.length;offset+=5){
  const results=await Promise.allSettled(recipients.slice(offset,offset+5).map(to=>svc.integrations.Core.SendEmail({to,template_name:'MeetingSessionSummary',category:'transactional',variables})));
  sent+=results.filter(result=>result.status==='fulfilled' && result.value?.success!==false).length;
 }
 return Response.json({sent,unconfirmed:recipients.length-sent,unavailable:ids.length-available.size});
}