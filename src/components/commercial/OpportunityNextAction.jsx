import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function OpportunityNextAction({item,canEdit,onAction}){
 const query=useQuery({queryKey:['commercial-next-action',item.id],queryFn:()=>base44.entities.CRMTask.filter({opportunity_id:item.id,status:{$in:['open','in_progress']}},{limit:1,sort:'due_date'})});
 const task=query.data?.items[0],late=task?.due_date && task.due_date<new Date().toISOString().slice(0,10);
 return <section className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${late ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/40'}`}><div><h2 className="text-xs font-medium text-muted-foreground">Next action</h2><p className="mt-1 text-sm font-semibold">{query.isPending ? 'Loading next action…' : query.error ? 'Next action could not be loaded' : task?.title || item.next_action || 'Agree the next step'}</p>{task && <p className="mt-1 text-xs text-muted-foreground">{task.owner_name || 'Action owner not recorded'} · Due {task.due_date || 'date not set'}{late ? ' · Overdue' : ''}</p>}</div>{canEdit && item.status==='open' && <Button size="sm" variant="outline" onClick={onAction}>Set next action</Button>}</section>;
}