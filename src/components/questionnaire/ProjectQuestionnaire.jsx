import React,{useState} from 'react';
import {Button} from '@/components/ui/button';
import QuestionnaireField from '@/components/questionnaire/QuestionnaireField';
import QuestionnaireProgress from '@/components/questionnaire/QuestionnaireProgress';
import QuestionnaireActions from '@/components/questionnaire/QuestionnaireActions';
import useProjectQuestionnaire from '@/components/questionnaire/useProjectQuestionnaire';
import PQApprovalPanel from '@/components/questionnaire/PQApprovalPanel';
import PQExistingSource from '@/components/questionnaire/PQExistingSource';
import PQDocumentLink from '@/components/questionnaire/PQDocumentLink';
export default function ProjectQuestionnaire({project,subject,onProjectUpdated}) {
 const state=useProjectQuestionnaire(project.id,subject,project.link_to_project_questionnaire),[active,setActive]=useState(0);
 const {data,answers,busy,error,loading,dirty,missing}=state;
 if(loading)return <div role="status" className="ws-card ws-panel">Loading project questionnaire and checking its linked source…</div>;
 if(!data)return <div className="ws-card ws-panel"><p role="alert" className="text-destructive">{error||'Questionnaire unavailable.'}</p><Button type="button" onClick={state.load}>Try again</Button></div>;
 const section=data.sections[active],submitted=data.record?.status==='submitted',readOnly=!data.canEdit||submitted;
 const select=index=>{setActive(index);};
 const submit=async()=>{
  const absent=data.sections.flatMap(item=>item.fields).filter(field=>field.required&&!String(answers[field.id]||'').trim());
  if(absent.length){state.setMissing(absent.map(field=>field.id));state.setError('Complete the highlighted required fields. Enter N/A where a response does not apply.');setActive(data.sections.findIndex(item=>item.fields.some(field=>field.id===absent[0].id)));setTimeout(()=>document.getElementById(`pq-${absent[0].id}`)?.focus(),0);return;}
  if(window.confirm('Submit this completed questionnaire? Submission records the form only and does not grant approval.'))await state.save('submit');
 };
 return <section className="ws-card ws-panel space-y-6" aria-label="Digital project questionnaire">
 <header className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="ws-sectiontitle">UK Leisure Framework Project Questionnaire</h3><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{data.recordedApproval?'Approved':submitted?'Submitted':data.record?.source_import?.status==='imported'?'Imported':'Draft'}</span></div>
 <p className="text-sm text-muted-foreground">{project.project_number} · {project.name}. Template based on {data.sourceProject}; this form contains this project’s own answers.</p>
 <PQExistingSource data={data} loading={loading} onRetry={()=>state.load(true)}/>
 {!data.locked&&<p className="text-xs text-muted-foreground">Fields marked * are required for submission. Drafts can be saved incomplete. Checklists may be left blank where not applicable.</p>}
 {!subject&&<PQDocumentLink project={project} onUpdated={onProjectUpdated}/>}
 {subject&&data.sourceUrl&&<a className="inline-block text-sm font-medium text-foreground underline underline-offset-4" href={data.sourceUrl} target="_blank" rel="noreferrer">Open this project’s existing PQ document</a>}
 {!data.canEdit&&<p className="text-sm text-muted-foreground">Read-only access.</p>}</header>
 {error&&<p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
 <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]"><QuestionnaireProgress sections={data.sections} answers={answers} active={active} onSelect={select}/>
 <div className="min-w-0 space-y-5"><div><p className="text-xs text-muted-foreground">Section {active+1} of {data.sections.length}</p><h4 className="mt-1 text-lg font-semibold">{section.title}</h4>{section.guidance&&<p className="mt-2 text-sm text-muted-foreground">{section.guidance}</p>}</div>
 <fieldset disabled={busy||readOnly} className="min-w-0 space-y-6">{section.fields.map(field=><QuestionnaireField key={field.id} field={field} value={answers[field.id]} onChange={value=>state.change(field.id,value)} disabled={busy||readOnly} invalid={missing.includes(field.id)}/>)}</fieldset>
 <QuestionnaireActions active={active} total={data.sections.length} onPrevious={()=>select(active-1)} onNext={()=>select(active+1)} onSave={()=>state.save('save')} onSubmit={submit} onReopen={()=>state.save('reopen')} onReload={state.load} busy={busy} canEdit={data.canEdit} approvalActive={data.approvalStatus==='active'} submitted={submitted} dirty={dirty} record={data.record}/>
 </div></div><PQApprovalPanel project={project} subject={subject} record={data.record} locked={data.locked} recordedApproval={data.recordedApproval} onChanged={state.load}/></section>;
}