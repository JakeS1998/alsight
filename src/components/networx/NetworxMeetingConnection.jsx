import React from 'react';
import {base44} from '@/api/base44Client';
import {Button} from '@/components/ui/button';
export default function NetworxMeetingConnection({connection}) {
 if(connection.loading)return <p role="status" className="text-sm text-muted-foreground">Checking your Outlook calendar…</p>;
 if(!connection.user)return <Button type="button" onClick={()=>base44.auth.redirectToLogin(window.location.href)}>Sign in to connect Outlook</Button>;
 return <div className="space-y-2 rounded-md border border-border bg-muted p-3 text-sm">{connection.connected ? <p>Invitations will be sent from your own Outlook calendar{connection.calendar?.name ? `, ${connection.calendar.name}` : ''}.</p> : <><p>Connect your own Alliance Outlook account to send meeting invitations.</p><Button type="button" variant="outline" onClick={connection.connect}>Connect my Outlook calendar</Button></>}{connection.error && <p role="alert" className="text-destructive">{connection.error}</p>}{connection.connected && connection.calendar?.canEdit===false && <p role="alert" className="text-destructive">This calendar is read-only. Choose a writable calendar in Account Settings.</p>}</div>;
}