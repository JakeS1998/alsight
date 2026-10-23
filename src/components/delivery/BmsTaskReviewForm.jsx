import React,{useState} from 'react';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import BmsTaskReviewFields from '@/components/delivery/BmsTaskReviewFields';
import BmsExistingTaskPicker from '@/components/delivery/BmsExistingTaskPicker';
import BmsTaskHistory from '@/components/delivery/BmsTaskHistory';
export default function BmsTaskReviewForm({task,projectId,canEdit,onSave,onDone}) {
 const {user}=useAuth(),review=task.review||{};
 const [value,setValue]=useState({status:review.status==='not_applicable'?'not_applicable':task.source||task.linked?'outstanding':review.status||'outstanding',reason:review.reason||'',evidence_reference:review.evidence_reference||'',evidence_url:review.evidence_url||'',approver:review.approver||'',approval_date:review.approval_date||'',linked_entity:task.linked?.entity||review.linked_entity||'',linked_id:task.linked?.id||review.linked_id||''});
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[picker,setPicker]=useState(false);
 const canAssessGates=['admin','director'].includes(user?.role),autoNa=task.framework&&task.notApplicable&&task.reason==='Non-framework project';
 const editable=canEdit&&!autoNa&&(!task.source||task.conditional);
 const submit=async event=>{event.preventDefault();setBusy(true);setError('');try{await onSave(task,value);onDone();}catch(err){setError(err.response?.data?.error||err.message);}finally{setBusy(false);}};
 return <div className="ml-6 mt-3 space-y-3 rounded-md bg-muted/40 p-3 text-xs">
  {task.detail&&<p className="text-muted-foreground">{task.detail}</p>}{task.hint&&<p className="text-muted-foreground">{task.hint}</p>}{task.source&&<p className="text-muted-foreground">Managed through the existing stage fields or linked records below. No separate completion task is created.</p>}
  {task.review?.evidence_reference&&<p className="whitespace-pre-wrap">Evidence: {task.review.evidence_reference}</p>}
  {task.review?.approver&&<p className="text-muted-foreground">Approval evidence: {task.review.approver} · {task.review.approval_date}</p>}
  {editable&&<form onSubmit={submit} className="space-y-3"><fieldset disabled={busy} className="space-y-3">
   <BmsTaskReviewFields task={task} value={value} setValue={setValue} canAssessGates={canAssessGates}/>
   {!task.source&&value.status!=='not_applicable'&&<><p className="text-muted-foreground">{value.linked_id?'Linked to the existing register record; its live status determines completion. No duplicate task will be created.':'Check for equivalent existing work before recording a missing task.'}</p><Button type="button" size="sm" variant="outline" onClick={()=>setPicker(!picker)}>{picker?'Hide existing tasks':value.linked_id?'Change existing link':'Link existing task'}</Button>{picker&&<BmsExistingTaskPicker task={task} projectId={projectId} disabled={busy} onLink={row=>{setValue(previous=>({...previous,status:'outstanding',linked_entity:row.entity,linked_id:row.id}));setPicker(false);}}/>}</>}
   <Button type="submit" size="sm" disabled={busy}>{busy?'Saving…':'Save review'}</Button>
  </fieldset>{error&&<p role="alert" className="text-destructive">{error}</p>}</form>}
  {!canEdit&&<p className="text-muted-foreground">Read-only. A project editor can record this evidence.</p>}
  <BmsTaskHistory review={task.review}/>
 </div>;
}