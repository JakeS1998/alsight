import React from 'react';
import {Button} from '@/components/ui/button';
export default function QuestionnaireActions({active,total,onPrevious,onNext,onSave,onSubmit,onReopen,onReload,busy,canEdit,submitted,dirty,record,approvalActive}) {
 return <footer className="space-y-3 border-t border-border pt-5"><div className="flex flex-wrap items-center gap-2">
 <Button type="button" variant="outline" onClick={onPrevious} disabled={active===0||busy}>Previous</Button>
 {active<total-1&&<Button type="button" variant="outline" onClick={onNext} disabled={busy}>Next section</Button>}
 {canEdit&&!submitted&&<><Button type="button" variant="secondary" onClick={onSave} disabled={busy}>{busy?'Saving…':'Save draft'}</Button><Button type="button" onClick={onSubmit} disabled={busy}>Submit questionnaire</Button></>}
 {canEdit&&submitted&&!approvalActive&&<Button type="button" onClick={()=>{if(!record.approval_round_id||window.confirm('Reopen for editing? Previous approval decisions apply only to the earlier issued version; submit again and request a new approval sequence after editing.'))onReopen();}} disabled={busy}>Reopen for editing</Button>}
 {approvalActive&&<p className="text-sm text-muted-foreground">Questionnaire locked while sequential approval is active.</p>}
 <Button type="button" variant="ghost" onClick={()=>{if(!dirty||window.confirm('Discard unsaved changes and reload?'))onReload();}} disabled={busy}>Reload saved version</Button>
 </div><p role="status" className="text-xs text-muted-foreground">{dirty?'Unsaved changes. Save your draft before leaving this tab.':record?`Saved ${new Date(record.saved_at).toLocaleString('en-GB')} by ${record.saved_by}`:'No draft saved yet.'}</p>
 {submitted&&<p role="status" className="text-sm text-success">Submitted {new Date(record.submitted_at).toLocaleString('en-GB')} by {record.submitted_by}. Submission is not approval.</p>}</footer>;
}