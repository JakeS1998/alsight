import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DialogTitle, DialogDescription } from '@/components/forms/form-dialog';
import useNetworxEmail from '@/components/networx/useNetworxEmail';
import NetworxMailboxReadiness from '@/components/networx/NetworxMailboxReadiness';
import NetworxEmailFields from '@/components/networx/NetworxEmailFields';
export default function NetworxEmailComposer({entity,recordId,onBusyChange,onClose}) {
  const {query,busy,error,result,enableTracking,send} = useNetworxEmail({entity,recordId,onBusyChange});
  const header = <header className="space-y-2"><DialogTitle>Send a tracked Networx email</DialogTitle><DialogDescription>Use your own approved Dynamics mailbox. This record is the email’s Regarding record, so correlated replies return to its activity feed.</DialogDescription></header>;
  if (query.isPending) return <div className="space-y-4">{header}<p role="status" className="text-sm text-muted-foreground">Checking your Dataverse mailbox and linked recipients…</p></div>;
  if (query.error && !query.data) return <div className="space-y-4">{header}<p role="alert" className="text-sm text-destructive">{query.error.message}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>query.refetch()}>Try again</Button><Button asChild variant="outline"><Link to="/account-settings">Review my Dataverse connection</Link></Button></div></div>;
  if (query.data?.state!=='ready') return <div className="space-y-4">{header}<p className="text-sm text-muted-foreground">{query.data?.message}</p><Button asChild variant="outline"><Link to="/account-settings">Connect my Dataverse account</Link></Button></div>;
  if (result) return <div className="space-y-4">{header}<p role="status" className="font-medium text-success">{result.message}</p><p className="text-sm text-muted-foreground">The tracked email is saved against this record. Have the recipient reply to that email, leave the reply in the inbox, then refresh Networx after Microsoft synchronization completes.</p><p className="break-all text-xs text-muted-foreground">Dataverse email reference: {result.emailId}</p><Button disabled={Boolean(busy)} onClick={onClose}>Close</Button></div>;
  const {mailbox,recipients} = query.data;
  return <form onSubmit={send} className="space-y-5">
    {header}
    <NetworxMailboxReadiness mailbox={mailbox} busy={busy || (query.isFetching ? 'refresh' : '')} onEnable={enableTracking} onRefresh={()=>query.refetch()}/>
    <fieldset disabled={Boolean(busy)} className="space-y-4"><NetworxEmailFields entity={entity} recordId={recordId} recipients={recipients}/></fieldset>
    {query.error && <p role="alert" className="text-sm text-destructive">{query.error.message} Recheck the mailbox before sending.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" disabled={Boolean(busy)} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!mailbox.ready || Boolean(busy) || query.isFetching || Boolean(query.error)}>{busy==='send' ? 'Submitting to Dataverse…' : 'Send through Dataverse'}</Button></div>
  </form>;
}