import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
export default function OutlookConnectionPanel({ connection }) {
  return <section className="rounded-panel border border-border bg-card p-6 space-y-4">
    <div className="flex items-start gap-3"><CalendarDays className="mt-1 h-6 w-6 text-primary" /><div><h2 className="font-heading text-lg font-semibold">Your Outlook calendar</h2><p className="text-sm text-muted-foreground">Connect your own Microsoft account. Other ALSight users cannot access your calendar.</p></div></div>
    {connection.loading ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Checking your connection…</p> : !connection.user ? <Button onClick={() => base44.auth.redirectToLogin()}>Sign in to connect</Button> : <>
      <p className="text-sm"><span className={connection.connected ? 'text-success font-medium' : 'text-muted-foreground'}>{connection.connected ? 'Connected' : 'Not connected'}</span>{connection.connected && ` · ${connection.calendar?.name || 'Outlook Calendar'}`}</p>
      <div className="flex flex-wrap gap-2">{connection.connected ? <><Button asChild><Link to="/calendar">Open my calendar</Link></Button><Button variant="outline" onClick={connection.disconnect}>Disconnect Outlook</Button></> : <Button onClick={connection.connect}>Connect Outlook</Button>}<Button variant="ghost" onClick={connection.refresh}>Check connection</Button></div>
    </>}
    {connection.error && <p role="alert" className="text-sm text-destructive">{connection.error}</p>}
  </section>;
}