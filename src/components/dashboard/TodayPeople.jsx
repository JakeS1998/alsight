import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TodayContactSuggestions from '@/components/dashboard/TodayContactSuggestions';
import HomeFollowupForm from '@/components/dashboard/HomeFollowupForm';
export default function TodayPeople({user}) {
 const [draft,setDraft]=useState(null),[notice,setNotice]=useState('');
 const client=useQueryClient();
 const saved=async()=>{await Promise.all([client.invalidateQueries({queryKey:['today-planner-reminders',user.id]}),client.invalidateQueries({queryKey:['portal-reminders',user.id]})]);setNotice('Follow-up saved in ALSight.');};
 return <section className="space-y-3">{notice && <p role="status" className="text-sm text-success">{notice}</p>}<TodayContactSuggestions user={user} onFollowup={(subject,contactId)=>{setDraft({subject,contactId});setNotice('');}}/>{draft && <HomeFollowupForm user={user} initial={draft.subject} contactId={draft.contactId} onClose={()=>setDraft(null)} onSaved={saved}/>}</section>;
}