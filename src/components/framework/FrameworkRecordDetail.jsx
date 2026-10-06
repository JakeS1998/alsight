import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {formatDate} from '@/lib/portal';
import FrameworkMilestoneTrail from '@/components/framework/FrameworkMilestoneTrail';
import FrameworkLinkDialog from '@/components/framework/FrameworkLinkDialog';
import UKLFKPIEditor from '@/components/framework/UKLFKPIEditor';
import FrameworkPhotoGallery from '@/components/framework/FrameworkPhotoGallery';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';
export default function FrameworkRecordDetail({reportId}) {
 const {user}=useAuth(),cache=useQueryClient(),[link,setLink]=useState(false),[edit,setEdit]=useState(false);
 const query=useQuery({queryKey:['framework-workspace','detail',user?.id,user?.role,reportId,'document-milestones'],queryFn:async()=>{const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'detail',reportId});if(data.error)throw new Error(data.error);return data.report;},enabled:!!user?.id && !!reportId,...organisationQueryPolicy,staleTime:60000});
 if(query.isPending)return <p role="status" className="p-8 text-sm text-muted-foreground">Loading Framework record…</p>;
 if(query.error)return <p role="alert" className="p-5 text-sm text-destructive">Record unavailable. <button className="underline" onClick={()=>query.refetch()}>Try again</button></p>;
 const row=query.data;if(!row)return <p className="p-8 text-muted-foreground">No accessible Framework record was found.</p>;
 const fields=[['Framework Reference',row.framework_ref],['Project Reference',row.project_number],['Client',row.client],['Questionnaire Date',formatDate(row.pq_date)],['Agreement Sent',formatDate(row.aa_sent)],['Agreement Signed',formatDate(row.aa_signed)],['Call-Off Date',formatDate(row.calloff_date)],['On Time',row.completed_on_time==='Y' ? 'Yes' : row.completed_on_time==='N' ? 'No, review outcome' : 'Not recorded'],['To Budget',row.completed_to_budget==='Y' ? 'Yes' : row.completed_to_budget==='N' ? 'No, review outcome' : 'Not recorded'],['Zero RIDDOR',row.zero_riddor==='Y' ? 'Yes' : row.zero_riddor==='N' ? 'No, review outcome' : 'Not recorded'],['Last Updated',formatDate(row.updated_date)]];
 return <><section className="space-y-5 rounded-panel border border-border bg-card p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">{row.site || 'Framework project'}</h2><p className="mt-1 text-sm text-muted-foreground">{row.client || 'Client not recorded'}</p></div><div className="flex gap-2">{row.project_id ? <Button asChild variant="outline"><Link to={`/projects/${row.project_id}`}>Open in ALSight</Link></Button> : !row.linked && user?.role==='admin' ? <Button variant="outline" onClick={()=>setLink(true)}>Link to ALSight</Button> : row.linked && <span className="text-xs text-muted-foreground">Linked project access restricted</span>}{user?.role==='admin' && <Button variant="outline" onClick={()=>setEdit(true)}>Review Outcome</Button>}</div></div><FrameworkMilestoneTrail row={row}/><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value || 'Not recorded'}</dd></div>)}</dl>{edit && <UKLFKPIEditor report={row} frameworkContext onCancel={()=>setEdit(false)} onSaved={()=>{setEdit(false);cache.invalidateQueries({queryKey:['framework-workspace']});}}/>}{link && <FrameworkLinkDialog row={row} onClose={()=>setLink(false)}/>}</section><FrameworkPhotoGallery reportId={row.id} canEdit={['admin','director','bsm','bdm'].includes(user?.role)}/></>;
}