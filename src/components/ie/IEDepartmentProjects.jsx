import React,{useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useAuth} from '@/lib/AuthContext';
import {ieCall} from '@/components/ie/ieClient';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import IEQueryState from '@/components/ie/IEQueryState';
export default function IEDepartmentProjects(){
 const {user}=useAuth(),[search,setSearch]=useState(''),[term,setTerm]=useState('');
 useEffect(()=>{const timer=setTimeout(()=>setTerm(search),250);return()=>clearTimeout(timer);},[search]);
 const query=useInfiniteQuery({queryKey:['ie-department-projects',user.id,user.role,term],initialPageParam:'',queryFn:({pageParam})=>ieCall('departmentProjects',{search:term,cursor:pageParam}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,retry:false});
 return <section className="space-y-4" aria-label="I&E projects">
  <p className="text-sm text-muted-foreground">Projects assigned to the Insights &amp; Engagement department.</p>
  <Input aria-label="Search I&E projects" placeholder="Search I&E projects…" value={search} onChange={e=>setSearch(e.target.value)}/>
  <IEQueryState query={query}>
   <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data?.pages.flatMap(page=>page.items).map(project=><Link key={project.id} to={['sam','sam_director'].includes(user.role)?`/insights-engagement/projects/${project.id}`:`/projects/${project.id}`} className="rounded-panel border border-border bg-card p-5 hover:border-primary"><p className="text-xs text-muted-foreground">{project.project_number||'Number not recorded'}</p><h2 className="mt-2 font-semibold">{project.name}</h2><p className="mt-2 text-sm text-muted-foreground">{project.client_name||'Client not recorded'}</p><p className="mt-3 text-xs">{project.live_project?'Live':'On hold'}</p></Link>)}</div>
   {query.data&&!query.data.pages[0].items.length&&<p className="py-8 text-sm text-muted-foreground">No I&amp;E projects match this search.</p>}
   {query.hasNextPage&&<Button variant="outline" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>Load more projects</Button>}
  </IEQueryState>
 </section>;
}