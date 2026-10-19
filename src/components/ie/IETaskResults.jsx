import React from 'react';
import {useInfiniteQuery} from '@tanstack/react-query';
import {Droppable,Draggable} from '@hello-pangea/dnd';
import {ieCall} from '@/components/ie/ieClient';
import {IE_WORK_STATUS} from '@/components/ie/ieWorkConfig';
import {Button} from '@/components/ui/button';
import IETaskRow from '@/components/ie/IETaskRow';
export default function IETaskResults({engagement,kind,status,board,...actions}) {
 const query=useInfiniteQuery({queryKey:['ie-tasks',engagement.id,kind,status||'all'],initialPageParam:'',queryFn:({pageParam})=>ieCall('workList',{engagement_id:engagement.id,kind,status,cursor:pageParam}),getNextPageParam:page=>page.has_more?page.next_cursor:undefined,retry:false});
 const items=actions.deletion.visible(query.data?.pages.flatMap(page=>page.items)||[]);
 const content=<>{query.isPending?<p role="status" className="p-4 text-xs text-muted-foreground">Loading tasks…</p>:query.error?<p role="alert" className="p-4 text-xs text-destructive">{query.error.message} <button onClick={()=>query.refetch()} className="underline">Try again</button></p>:<>
 {!items.length&&<p className="p-6 text-center text-xs text-muted-foreground">No tasks here yet.</p>}
 {items.map((item,index)=>board?<Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!actions.canEdit||actions.busy}>{provided=><div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}><IETaskRow {...actions} item={item} engagement={engagement} board/></div>}</Draggable>:<IETaskRow key={item.id} {...actions} item={item} engagement={engagement}/>)}
 {query.hasNextPage&&<Button variant="outline" size="sm" className="m-3" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more tasks'}</Button>}
 </>}</>;
 return board?<section className="min-w-0 rounded-panel border border-border bg-muted/60 p-3"><h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold">{IE_WORK_STATUS[status]}</h3><Droppable droppableId={status} isDropDisabled={!actions.canEdit||actions.busy}>{provided=><div ref={provided.innerRef} {...provided.droppableProps} className="min-h-40 space-y-3">{content}{provided.placeholder}</div>}</Droppable></section>:<div className="overflow-x-auto rounded-panel border border-border bg-card"><div className="grid min-w-[720px] grid-cols-[minmax(240px,1fr)_160px_145px_140px_32px] gap-3 border-b border-border bg-muted/50 px-3 py-3 text-xs font-semibold text-muted-foreground"><span>Task name</span><span>Assignee</span><span>Due date</span><span>Status</span><span/></div>{content}</div>;
}