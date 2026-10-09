import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import ApprovalRoutingPeople from '@/components/approvals/ApprovalRoutingPeople.jsx';
import approvalClient from '@/components/approvals/approvalClient';
export default function ApprovalRoutingEditor({rule,title,relatedRules,onSaved,onCancel}) {
 const [named,setNamed]=useState(rule.named_emails || []),[related,setRelated]=useState(rule.related_rules || []),[enabled,setEnabled]=useState(rule.enabled),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async()=>{setBusy(true);setError('');try{const result=await approvalClient('saveRouting',{table:rule.table,named_emails:named,related_rules:related,enabled});onSaved(result.notice);}catch(error){setError(error.message);}finally{setBusy(false);}};
 return <section className="space-y-4 rounded-panel border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-heading text-lg font-semibold">Edit routing · {title}</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} disabled={busy} onChange={event=>setEnabled(event.target.checked)}/>Routing enabled</label></div>
  <p className="text-sm text-muted-foreground">Choose named people, linked project contacts, or both. A person resolved more than once receives only one request per draft.</p>
  <div className="grid gap-6 lg:grid-cols-2"><ApprovalRoutingPeople selected={named} onChange={setNamed} disabled={busy}/><div className="space-y-3"><h4 className="font-semibold">Linked project contacts and owners</h4>{Object.entries(relatedRules).map(([key,rule])=><label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={related.includes(key)} disabled={busy} onChange={()=>setRelated(values=>values.includes(key) ? values.filter(value=>value!==key) : [...values,key])}/>{rule.label}</label>)}<p className="text-xs text-muted-foreground">Resolved separately for each document’s linked project. Missing, ambiguous or unauthorised contacts are not assigned approvals.</p></div></div>
  {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  <div className="flex gap-2"><Button type="button" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save routing'}</Button><Button type="button" variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button></div>
 </section>;
}