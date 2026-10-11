import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import useDeliveryCapacity from '@/components/dashboard/useDeliveryCapacity';
import { formatDate } from '@/lib/portal';
export default function ProjectPeopleCommitments({project}) {
  const {user}=useAuth();
  const query=useDeliveryCapacity({user,projectId:project.id,revision:project.updated_date,personal:true});
  if(!['admin','director','regional_director','bdm','bsm','finance'].includes(user?.role))return null;
  if(query.isPending)return <p role="status" className="text-xs text-muted-foreground">Checking people dependencies…</p>;
  if(query.error)return <p className="text-xs text-muted-foreground">People dependencies unavailable. <button onClick={()=>query.refetch()} className="underline">Try again</button></p>;
  const context=query.data?.context;
  if(!context)return null;
  return <section className="ws-card ws-panel"><h3 className="ws-sectiontitle">People & upcoming commitments</h3><p className="mt-2 text-xs text-muted-foreground">Uses the responsibilities recorded above; does not infer effort or confirm availability.</p>{context.events.length ? <ul className="mt-3 space-y-1">{context.events.map(event=><li key={event.label+event.date} className="text-sm">{formatDate(event.date)} · {event.label} <span className="text-xs text-muted-foreground">({event.source})</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No milestones recorded in the next 90 days. Insufficient information to assess upcoming demand.</p>}{context.dependencies.map(person=><div key={person.key} className="mt-3 text-sm"><p className="font-semibold">{person.name} · {person.roles.join(', ')}</p><p className="text-xs text-muted-foreground">Responsible on {person.active} active projects in your authorised scope.</p>{person.related.map(row=><Link key={row.id} to={`/projects/${row.id}`} className="mr-3 text-xs text-chart-2 underline">{row.name}: commitment in the same month</Link>)}</div>)}</section>;
}