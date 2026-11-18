import React,{useEffect} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import MeetingSessionSummary from '@/components/projects/workspace/MeetingSessionSummary';
import ReviewQueryState from '@/components/projects/workspace/ReviewQueryState';
import {meetingMember} from '@/components/projects/workspace/meetingSessionActivity';

export default function MeetingSessionNotes(){
 const {sessionId}=useParams(),{user}=useAuth();
 const query=useQuery({queryKey:['meeting-session',user?.id,sessionId],enabled:!!user?.id,queryFn:async()=>{
  const row=await base44.entities.CRMActivity.get(sessionId).catch(e=>[403,404].includes(e.status || e.response?.status) ? null : Promise.reject(e));
  return row?.next_action==='meeting_start' && meetingMember(row,user) ? row : null;
 }});
 const missing=query.isSuccess && !query.data;
 useEffect(()=>{if(!missing)return;const tag=document.createElement('meta');tag.name='prerender-status-code';tag.content='404';document.head.append(tag);return ()=>tag.remove();},[missing]);
 return <main className="mx-auto max-w-3xl space-y-5 p-4 sm:p-8"><Link to="/" className="text-sm underline">Back to ALS Hub</Link><h1 className="text-2xl font-semibold">{query.data?.subject || 'Meeting notes'}</h1><ReviewQueryState query={query}>{missing ? <p>This meeting is not available to your account.</p> : query.data && <MeetingSessionSummary session={query.data} user={user} standalone/>}</ReviewQueryState></main>;
}