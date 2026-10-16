import React from 'react';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';
import projectFullValue from '@/components/projects/projectFullValue';
import {Link} from 'react-router-dom';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {formatCurrency} from '@/lib/portal';
import {Button} from '@/components/ui/button';
import contactProjectQuery from '@/components/crm/contact360/contactProjectQuery';
export default function ContactProjects({contact,account}){
 const {user}=useAuth();
 const ids=[contact.id,contact.dataverse_id].filter(Boolean);
 const key=[user?.id,user?.role,contact.id,contact.dataverse_id,account?.id,account?.dataverse_id];
 const scope=useQuery({queryKey:['contact-project-scope',...key],queryFn:()=>contactProjectQuery(contact,account),staleTime:60000,retry:false});
 const projects=useInfiniteQuery({queryKey:['contact-projects',...key,scope.data],enabled:!!scope.data,initialPageParam:null,queryFn:({pageParam})=>base44.entities.Project.filter(scope.data,{sort:'-created_date',limit:20,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:60000,retry:false});
 const rows=projects.data?.pages.flatMap(page=>page.items)||[];
 const error=scope.error||projects.error,loading=scope.isPending||projects.isPending;
 const relationship=project=>project.project_manager_id&&ids.includes(project.project_manager_id)?'Project manager':project.contractor_contact_id&&ids.includes(project.contractor_contact_id)?'Contractor contact':[project.client_rep_id,project.client_rep2_id].some(id=>ids.includes(id))?'Client representative':'Organisation project';
 return <section className="rounded-xl border border-border bg-card p-5">
  <h2 className="font-semibold">Linked projects</h2>
  {account?<p className="mt-1 text-xs text-muted-foreground">Projects linked directly to this person and all accessible projects for <Link to={`/accounts/${account.id}`} className="text-primary hover:underline">{account.name}</Link>.</p>:<p className="mt-1 text-xs text-muted-foreground">Only directly linked projects are shown until this person has a recorded organisation.</p>}
  {error&&<p role="alert" className="mt-3 text-sm text-destructive">{error.message} <button type="button" className="underline" onClick={()=>scope.error?scope.refetch():projects.refetch()}>Try again</button></p>}
  {loading&&!rows.length&&!error?<p role="status" className="mt-3 text-sm text-muted-foreground">Loading projects…</p>:!rows.length&&!error?<p className="mt-3 text-sm text-muted-foreground">No accessible projects found.</p>:<ul className="mt-3 divide-y divide-border">{rows.map(project=><li key={project.id} className="py-2 text-sm"><Link to={`/projects/${project.id}`} className="font-medium text-primary hover:underline">{project.name}</Link><p className="text-xs text-muted-foreground">{project.live_project?'Live':'On Hold'} · {relationship(project)} · {(project.submitted_proposal_value??project.estimated_value)!=null?formatCurrency(projectFullValue(project)):'Value not recorded'}</p></li>)}</ul>}
  {projects.hasNextPage&&<Button size="sm" variant="outline" onClick={()=>projects.fetchNextPage()} disabled={projects.isFetching}>{projects.isFetchingNextPage?'Loading…':'Load more'}</Button>}
 </section>;
}