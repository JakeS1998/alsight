import React from 'react';
import { Button } from '@/components/ui/button';
import useUKLFDigest from '@/components/framework/useUKLFDigest';
import UKLFDigestRecipients from '@/components/framework/UKLFDigestRecipients';
export default function UKLFDigestSettings() {
  const digest = useUKLFDigest();
  const { settings, setSettings, busy } = digest;
  return <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="uklf-digest-heading">
    <h2 id="uklf-digest-heading" className="text-lg font-semibold">Monthly UKLF email digest</h2>
    <p className="mt-1 text-sm text-muted-foreground">Portfolio summary · first of every month at 9am UK time (GMT/BST).</p>
    <p className="mt-2 text-sm text-muted-foreground">All framework stakeholder accounts receive the summary automatically. No financial amounts or project-specific details are emailed.</p>
    {digest.error && <p role="alert" className="mt-3 text-sm text-destructive">{digest.error} {!settings && <button type="button" onClick={digest.reload} className="underline">Try again</button>}</p>}
    {busy === 'loading' && <p role="status" className="mt-3 text-sm text-muted-foreground">Loading email settings…</p>}
    {settings && <form onSubmit={digest.save} className="mt-4 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={settings.enabled} disabled={!!busy} onChange={event => setSettings(previous => ({ ...previous, enabled: event.target.checked }))} />Enable monthly emails</label>
      <UKLFDigestRecipients users={digest.users} selected={settings.selected_user_ids || []} onChange={ids => setSettings(previous => ({ ...previous, selected_user_ids: ids }))} disabled={!!busy} more={digest.more} onMore={digest.loadMore} />
      {digest.notice && <p role="status" className="text-sm text-muted-foreground">{digest.notice}</p>}
      {settings.last_run_at && <p className="text-xs text-muted-foreground">Last run: {new Date(settings.last_run_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })} UK · {settings.last_result}</p>}
      <Button type="submit" disabled={!!busy}>{busy === 'saving' ? 'Saving…' : 'Save digest settings'}</Button>
    </form>}
  </section>;
}