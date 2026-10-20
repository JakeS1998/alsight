import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TodayContactSuggestions from '@/components/dashboard/TodayContactSuggestions';
import HomeFollowupForm from '@/components/dashboard/HomeFollowupForm';
import SubmissionSummary from '@/components/forms/SubmissionSummary';
export default function TodayPeople({user}) {
 const [draft,setDraft]=useState(null),[notice,setNotice]=useState('');
 const client=useQueryClient();
 const saved=async details=>{await Promise.all([client.invalidateQueries({queryKey:['today-planner-reminders',user.id]}),client.invalidateQueries({queryKey:['portal-reminders',user.id]})]);setNotice(details);};
 return <section className="space-y-3">{notice && <div role="status"><p className="text-sm text-success">Follow-up saved in ALS Hub.</p><SubmissionSummary rows={[[ 'Follow-up',notice.subject],['Remind me at',new Date(notice.remind_at).toLocaleString('en-GB')]]}/></div>}<TodayContactSuggestions user={user} onFollowup={(subject,contactId)=>{setDraft({subject,contactId});setNotice('');}}/>{draft && <HomeFollowupForm user={user} initial={draft.subject} contactId={draft.contactId} onClose={()=>setDraft(null)} onSaved={saved}/>}</section>;
}