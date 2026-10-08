import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import teamsRequest from '@/components/teams/teamsClient';
import { base44 } from '@/api/base44Client';
export default function ProjectTeamsShare({ project }) {
  const [open, setOpen] = useState(false), [teams, setTeams] = useState([]), [channels, setChannels] = useState([]);
  const [team, setTeam] = useState(''), [channel, setChannel] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
  useEffect(() => {
    if (!open) return; let active = true;
    setBusy(true); setError(''); setSent(false);
    (async () => {
      try { if (!await base44.auth.isAuthenticated()) throw new Error('Sign in to share updates.'); const data = await teamsRequest('teams'); if (active) setTeams(data.items); }
      catch (err) { if (active) setError(err.message); }
      finally { if (active) setBusy(false); }
    })();
    return () => { active = false; };
  }, [open]);
  useEffect(() => {
    if (!open || !team) return; let active = true; setBusy(true); setError('');
    teamsRequest('channels', { teamId: team }).then(data => { if (active) setChannels(data.items); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [open, team]);
  const send = async e => {
    e.preventDefault(); setBusy(true); setError('');
    try { await teamsRequest('share', { projectId: project.id, teamId: team, channelId: channel, message }); setSent(true); setMessage(''); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return <><Button variant="outline" size="sm" onClick={() => setOpen(true)}>Share to Teams</Button><Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent><DialogHeader><DialogTitle>Share project update</DialogTitle><DialogDescription>Send an update about {project.name} as your own Teams account. Everyone with access to the selected channel can read it.</DialogDescription></DialogHeader>
    <form onSubmit={send} className="space-y-4"><fieldset disabled={busy} className="space-y-4">
      <label className="block space-y-1 text-sm">Team<select required value={team} onChange={e => { setTeam(e.target.value); setChannel(''); setChannels([]); setSent(false); }} className="block w-full rounded-md border border-input bg-background p-2"><option value="">Choose a team</option>{teams.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label className="block space-y-1 text-sm">Channel<select required value={channel} onChange={e => { setChannel(e.target.value); setSent(false); }} className="block w-full rounded-md border border-input bg-background p-2"><option value="">Choose a channel</option>{channels.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label className="block space-y-1 text-sm">Update<Textarea required maxLength={2000} value={message} onChange={e => { setMessage(e.target.value); setSent(false); }} rows={4} /></label>
    </fieldset>{busy && <p role="status" className="text-sm">Working…</p>}{!busy && !error && !teams.length && <p className="text-sm text-muted-foreground">No Teams memberships found.</p>}{!busy && team && !error && !channels.length && <p className="text-sm text-muted-foreground">No channels found.</p>}{error && <p role="alert" className="text-sm text-destructive">{error} <Link to="/account-settings" className="underline">Account Settings</Link></p>}{sent && <p role="status" className="text-sm text-success">Update sent to Teams.</p>}<Button disabled={busy || !channel || !message.trim()} type="submit">Send update</Button></form>
  </DialogContent></Dialog></>;
}