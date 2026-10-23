import React,{useEffect} from 'react';
import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import {FormSection} from '@/components/forms/PowerForm';
import ProjectMeetingForm from '@/components/projects/ProjectMeetingForm';
export default function ProjectMeetings({project}) {
 const {user}=useAuth(),cache=useQueryClient();
 const query=useInfiniteQuery({queryKey:['project-meetings',project.id,user?.id,user?.role],enabled:!!user,initialPageParam:null,queryFn:({pageParam})=>base44.entities.CRMActivity.filter({project_id:project.id,type:{$in:['project_meeting','meeting','teams_meeting']},next_action:{$nin:['meeting_note','project_comment']}},{sort:'-occurred_at',limit:20,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined});
 useEffect(()=>base44.entities.CRMActivity.subscribe(event=>{if(!event.data?.project_id||event.data.project_id===project.id)cache.invalidateQueries({queryKey:['project-meetings',project.id]});}),[project.id,cache]);
 return <FormSection title="Project meetings" description="Record meetings throughout the project; BMS meeting evidence follows the live record.">
  {['admin','director','bdm','bsm'].includes(user?.role)&&<ProjectMeetingForm project={project} user={user}/>}
  {query.isPending?<p role="status" className="text-sm text-muted-foreground">Loading meetings…</p>:query.error?<p role="alert" className="text-sm text-destructive">Meetings unavailable. <button type="button" className="underline" onClick={()=>query.refetch()}>Retry</button></p>:<div className="space-y-3">
   {!query.data.pages[0].items.length&&<p className="text-sm text-muted-foreground">No accessible project meetings recorded yet.</p>}
   {query.data.pages.flatMap(page=>page.items).map(row=><article key={row.id} className="rounded-md border border-border p-3 text-sm"><h4 className="font-semibold">{row.subject}</h4><p className="mt-1 text-xs text-muted-foreground">{new Date(row.occurred_at).toLocaleString('en-GB')} · {row.author_name}</p>{row.participants&&<p className="mt-2">Attendees: {row.participants}</p>}<p className="mt-2 whitespace-pre-wrap">{row.description}</p></article>)}
   {query.hasNextPage&&<Button type="button" variant="outline" size="sm" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more meetings</Button>}
  </div>}
 </FormSection>;
}