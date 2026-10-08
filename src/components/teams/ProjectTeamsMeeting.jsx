import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CalendarEventDialog from '@/components/outlook/CalendarEventDialog';
export default function ProjectTeamsMeeting({ project }) {
  const [open, setOpen] = useState(false), [saved, setSaved] = useState(false);
  return <div className="flex flex-wrap items-center gap-3">
    <Button variant="outline" size="sm" onClick={() => { setSaved(false); setOpen(true); }}>Schedule Teams meeting</Button>
    {saved && <p role="status" className="text-sm text-success">Meeting saved to your Outlook calendar. <Link to="/calendar" className="underline">View meeting and join link</Link></p>}
    <p className="text-xs text-muted-foreground">Uses your connected Outlook account. <Link to="/account-settings" className="underline">Manage connection</Link></p>
    {open && <CalendarEventDialog week={new Date()} initialForm={{ subject: project.name.slice(0, 200), isOnlineMeeting: true, description: `Project meeting: ${project.name}\nhttps://alsight.base44.app/projects/${encodeURIComponent(project.id)}` }} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setSaved(true); }} />}
  </div>;
}