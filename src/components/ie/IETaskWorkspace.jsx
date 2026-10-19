import React,{useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {DragDropContext} from '@hello-pangea/dnd';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ieCall} from '@/components/ie/ieClient';
import {IE_WORK_AREAS,IE_WORK_STATUS} from '@/components/ie/ieWorkConfig';
import useDeletion from '@/components/deletion/useDeletion';
import IETaskResults from '@/components/ie/IETaskResults';
import IETaskDetail from '@/components/ie/IETaskDetail';
import IEWorkForm from '@/components/ie/IEWorkForm';
export default function IETaskWorkspace({engagement,canEdit,board=false}) {
 const cache=useQueryClient(),deletion=useDeletion('IEWorkItem'),[kind,setKind]=useState('all'),[selected,setSelected]=useState(null),[adding,setAdding]=useState(false);
 const refresh=()=>cache.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('ie-')});
 const save=useMutation({mutationFn:({item,changes})=>ieCall('workSave',{engagement_id:engagement.id,id:item.id,values:{...item,...changes}}),onSuccess:refresh});
 const change=(item,changes)=>save.mutate({item,changes});
 const remove=item=>deletion.request({id:item.id,label:`Task “${item.title}”`,onDelete:async()=>{await ieCall('workDelete',{engagement_id:engagement.id,id:item.id});await refresh();}});
 const drop=result=>{if(!result.destination||result.destination.droppableId===result.source.droppableId||!canEdit||save.isPending)return;const item=cache.getQueriesData({queryKey:['ie-tasks',engagement.id]}).flatMap(([,data])=>data?.pages?.flatMap(page=>page.items)||[]).find(row=>row.id===result.draggableId);if(item)change(item,{status:result.destination.droppableId});};
 const actions={engagement,kind,canEdit,busy:save.isPending,onEdit:setSelected,onChange:change,onDelete:remove,deletion};
 return <section className="space-y-4" aria-label={board?'Project task board':'Project task list'}>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{board?'Board':'Task list'}</h2><p className="mt-1 text-xs text-muted-foreground">{board?'Move tasks between columns to update progress.':'Click a task to open its details. Change assignees, dates and progress directly.'}</p></div><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="ie-task-area">Work area</label><select id="ie-task-area" className="h-9 rounded-md border border-input bg-card px-3 text-xs" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">All work areas</option>{Object.entries(IE_WORK_AREAS).map(([key,area])=><option key={key} value={key}>{area.title}</option>)}</select>{canEdit&&<Button size="sm" onClick={()=>setAdding(true)}><Plus/>Add task</Button>}</div></div>
  {save.error&&<p role="alert" className="text-sm text-destructive">{save.error.message}</p>}{save.isPending&&<p role="status" className="text-xs text-muted-foreground">Saving task…</p>}
  {board?<DragDropContext onDragEnd={drop}><div className="ie-task-board">{Object.keys(IE_WORK_STATUS).map(status=><IETaskResults key={status} {...actions} status={status} board/>)}</div></DragDropContext>:<IETaskResults {...actions}/>}
  {adding&&<div className="rounded-panel border border-border bg-card p-4"><label className="mb-2 block text-xs font-semibold" htmlFor="ie-new-task-area">New task work area</label><select id="ie-new-task-area" autoFocus className="h-9 rounded-md border border-input bg-card px-3 text-sm" defaultValue="" onChange={e=>{if(e.target.value){setAdding(e.target.value);}}}><option value="" disabled>Choose a work area</option>{Object.entries(IE_WORK_AREAS).map(([key,area])=><option key={key} value={key}>{area.title}</option>)}</select><Button variant="ghost" size="sm" onClick={()=>setAdding(false)}>Cancel</Button></div>}
  {typeof adding==='string'&&<IEWorkForm engagement={engagement} kind={adding} onClose={()=>setAdding(false)}/>}
  {selected&&<IETaskDetail key={selected.id} item={selected} engagement={engagement} canEdit={canEdit} onClose={()=>setSelected(null)}/>}
 </section>;
}