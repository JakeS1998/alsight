import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useDataverseUser from '@/components/dataverse/useDataverseUser';

export default function DataverseConnectionCard() {
  const { connection, loading, loadError, reload, busy, error, notice, run } = useDataverseUser();
  return <section className="space-y-4 rounded-xl border border-border bg-card p-6">
    <header><h2 className="text-base font-semibold">Your Dataverse account</h2><p className="mt-1 text-sm text-muted-foreground">Connect your work Microsoft account. Dataverse uses your individual permissions, not a shared application user.</p></header>
    {loading ? <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading your connection…</p> : loadError ? <><p role="alert" className="text-sm text-destructive">{loadError}</p><Button variant="outline" onClick={() => reload()}>Try again</Button></> : <>
      <div className="space-y-1 text-sm"><p className="font-medium">{connection?.connected ? 'Your Dataverse account is connected' : 'Not connected'}</p><p className="break-all text-muted-foreground">{connection?.environment_url}</p>
        {connection?.last_checked_at && <p className="text-muted-foreground">Access confirmed: {new Date(connection.last_checked_at).toLocaleString()}</p>}
        {connection?.connected && <p className="text-xs text-muted-foreground">Dataverse user: {connection.dataverse_user_id}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={Boolean(busy)} onClick={() => run('begin')}>{busy === 'begin' && <Loader2 className="animate-spin" />}{connection?.connected ? 'Reconnect Microsoft account' : 'Connect Microsoft account'}</Button>
        {connection?.connected && <><Button variant="outline" disabled={Boolean(busy)} onClick={() => run('check')}>{busy === 'check' && <Loader2 className="animate-spin" />}Check my access</Button><Button variant="outline" disabled={Boolean(busy)} onClick={() => run('disconnect')}>{busy === 'disconnect' && <Loader2 className="animate-spin" />}Disconnect</Button></>}
      </div>
      <p className="text-xs text-muted-foreground">Sign-in opens on Microsoft and returns to the published ALSight app. IT must first enable delegated consent and register the Web return address shown in Admin. Shared synchronisation uses Jake’s account; your write-back uses only your own connected account.</p>
    </>}
    <Link to="/dataverse" className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline">Open Dataverse write-back workspace</Link>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </section>;
}