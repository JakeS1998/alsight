import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import useTeamsConnection from '@/components/teams/useTeamsConnection';
export default function TeamsConnectionCard() {
  const connection = useTeamsConnection();
  return <section className="space-y-3 rounded-xl border border-border bg-card p-6">
    <h2 className="text-base font-semibold">Alliance Teams</h2>
    <p className="text-sm text-muted-foreground">Connect your own Microsoft account to share project updates with your Teams channels.</p>
    {connection.loading ? <p role="status" className="text-sm">Checking Teams connection…</p> : !connection.user ? <Button onClick={() => base44.auth.redirectToLogin()}>Sign in</Button> : <>
      {connection.connected && <p className="text-sm">Connected as {connection.name}.</p>}
      <Button variant="outline" onClick={connection.connected ? connection.disconnect : connection.connect}>{connection.connected ? 'Disconnect Teams' : 'Connect Teams'}</Button>
    </>}
    {connection.error && <p role="alert" className="text-sm text-destructive">{connection.error}</p>}
  </section>;
}