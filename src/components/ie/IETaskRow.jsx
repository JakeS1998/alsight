import React from 'react';
import {CheckCircle2,Circle,Trash2} from 'lucide-react';
import {IE_WORK_AREAS,IE_WORK_STATUS} from '@/components/ie/ieWorkConfig';
export default function IETaskRow({item,engagement,canEdit,busy,onEdit,onChange,onDelete,board=false}) {
 const people=[...(engagement.owner_id?[{id:engagement.owner_id,name:engagement.owner_name}]:[]),...(engagement.team||[])];
 const options=people.filter((p,i)=>people.findIndex(other=>other.id===p.id)===i);
 if(item.owner_id&&!options.some(p=>p.id===item.owner_id))options.push({id:item.owner_id,name:item.owner_name||'Previous assignee'});
 const today=new Date(),day=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
 const overdue=item.due_date&&item.due_date<day&&item.status!=='complete';
 const field='min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-xs hover:border-border focus:border-ring disabled:opacity-70';
 return <div className={board?'space-y-3 rounded-panel border border-border bg-card p-3':'grid min-w-[720px] grid-cols-[minmax(240px,1fr)_160px_145px_140px_32px] items-center gap-3 border-b border-border px-3 py-3 last:border-0'}>
  <div className="flex min-w-0 items-start gap-2"><button type="button" className="mt-0.5 shrink-0 text-muted-foreground hover:text-success disabled:opacity-50" aria-label={item.status==='complete'?'Reopen task':'Complete task'} disabled={!canEdit||busy} onClick={()=>onChange(item,{status:item.status==='complete'?'planned':'complete'})}>{item.status==='complete'?<CheckCircle2 size={18} className="text-success"/>:<Circle size={18}/>}</button><div className="min-w-0"><button type="button" onClick={()=>onEdit(item)} className={`text-left text-sm font-medium hover:underline ${item.status==='complete'?'text-muted-foreground line-through':'text-foreground'}`}>{item.title}</button><p className="mt-1 text-[10px] text-muted-foreground">{IE_WORK_AREAS[item.kind].title}{item.work_type?` · ${item.work_type}`:''}</p></div></div>
  <select aria-label={`Assignee for ${item.title}`} className={field} disabled={!canEdit||busy} value={item.owner_id||''} onChange={e=>onChange(item,{owner_id:e.target.value})}><option value="">Unassigned</option>{options.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
  <input aria-label={`Due date for ${item.title}`} type="date" className={`${field} ${overdue?'text-destructive':'text-muted-foreground'}`} disabled={!canEdit||busy} value={item.due_date||''} onChange={e=>onChange(item,{due_date:e.target.value})}/>
  <select aria-label={`Status for ${item.title}`} className={field} disabled={!canEdit||busy} value={item.status} onChange={e=>onChange(item,{status:e.target.value})}>{Object.entries(IE_WORK_STATUS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
  {canEdit&&<button type="button" aria-label={`Delete ${item.title}`} disabled={busy} onClick={()=>onDelete(item)} className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"><Trash2 size={14}/></button>}
 </div>;
}