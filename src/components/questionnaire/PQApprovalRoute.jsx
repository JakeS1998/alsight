import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import PQApproverPicker from '@/components/questionnaire/PQApproverPicker';
export default function PQApprovalRoute({projectId,busy,onStart}) {
 const [steps,setSteps]=useState([]);
 const move=(index,delta)=>setSteps(current=>{const next=[...current];[next[index],next[index+delta]]=[next[index+delta],next[index]];return next;});
 return <div className="space-y-4"><p className="text-sm text-muted-foreground">Choose one to ten approvers in order. Each must approve before the next person can decide; rejection stops the sequence.</p>
 <ol className="space-y-2">{steps.map((person,index)=><li key={person.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3"><span className="min-w-0 flex-1 text-sm"><strong>{index+1}. {person.name}</strong><span className="block break-all text-xs text-muted-foreground">{person.email}</span></span><Button type="button" size="sm" variant="outline" disabled={busy||index===0} onClick={()=>move(index,-1)}>Up</Button><Button type="button" size="sm" variant="outline" disabled={busy||index===steps.length-1} onClick={()=>move(index,1)}>Down</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={()=>setSteps(current=>current.filter(item=>item.id!==person.id))}>Remove</Button></li>)}</ol>
 {steps.length<10&&<PQApproverPicker projectId={projectId} disabled={busy} excluded={steps.map(person=>person.id)} onSelect={person=>setSteps(current=>[...current,person])}/>}
 <Button type="button" disabled={busy||!steps.length} onClick={()=>{if(window.confirm('Issue this saved questionnaire to the selected approvers in this order? It will be locked until the sequence finishes or is withdrawn.'))onStart(steps.map(person=>person.id));}}>{busy?'Issuing…':'Request sequential approval'}</Button></div>;
}