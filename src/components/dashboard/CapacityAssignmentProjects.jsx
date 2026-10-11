import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
export default function CapacityAssignmentProjects({options,person}) {
  const [cursors,setCursors]=useState([undefined]);
  const query=useDeliveryCapacity({...options,person,action:'projects',cursor:cursors.at(-1)});
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Loading assigned projects…</p>;
  if(query.error)return <p role="alert" className="text-xs text-destructive">{query.error.message} <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const page=query.data?.assignmentPage;
  return <div className="rounded-lg bg-secondary/50 p-3"><h4 className="text-xs font-semibold">Active projects involving this person</h4><ul className="mt-2 space-y-1">{page?.items.map(project=><li key={project.id}><Link to={`/projects/${project.id}`} className="text-xs text-chart-2 underline">{project.name}</Link></li>)}</ul>{!page?.items.length && <p className="mt-2 text-xs text-muted-foreground">No active projects in this selection.</p>}<div className="mt-2 flex gap-3">{cursors.length>1 && <button onClick={()=>setCursors(items=>items.slice(0,-1))} className="text-xs underline">Previous projects</button>}{page?.has_more && <button onClick={()=>setCursors(items=>[...items,page.next_cursor])} className="text-xs underline">Next projects</button>}</div></div>;
}