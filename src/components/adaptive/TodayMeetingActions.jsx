import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CompleteMeetingAction from '@/components/tasks/CompleteMeetingAction';
import TodayMeetingNotes from '@/components/adaptive/TodayMeetingNotes';
import useTodayMeetingActions from '@/components/adaptive/useTodayMeetingActions';
export default function TodayMeetingActions({ user }) {
  const tasks = useTodayMeetingActions(user), [selected, setSelected] = useState(null);
  return <section id="today-meeting-actions" className="at-panel scroll-mt-28" aria-labelledby="today-meeting-actions-title">
    <header className="at-section-head"><div><span className="at-eyebrow">ASSIGNED TO YOU</span><h2 id="today-meeting-actions-title">Meeting actions <ListChecks size={19}/></h2></div>{tasks.total != null && <span className="text-sm text-muted-foreground">{tasks.total} outstanding</span>}</header>
    <p className="at-section-note">All your outstanding project actions, including those assigned in meetings, regardless of priority or due date. Open meeting notes without leaving Today.</p>
    {tasks.error && <p role="alert" className="mt-3 text-sm text-destructive">Unable to load meeting actions: {tasks.error.message} <button type="button" className="underline" onClick={tasks.retry}>Retry</button></p>}
    {tasks.loading ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading your meeting actions…</p> : <ul className="mt-3 divide-y divide-border">{tasks.rows.map(task => <li key={task.key} className="py-4">
      <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{task.title}</h3>{task.priority === 'high' && <span className="text-xs font-semibold text-destructive">High priority</span>}</div>
      <p className="mt-1 text-xs text-muted-foreground"><Link to={`/projects/${task.project_id}`} className="hover:underline">{task.projectName || 'Open project'}</Link> · {task.due ? `Due ${new Date(`${task.due.slice(0,10)}T12:00:00`).toLocaleDateString('en-GB')}` : 'No due date'} · {task.status === 'in_progress' ? 'In progress' : 'Open'}</p>
      {task.comments && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{task.comments}</p>}
      <div className="mt-2 flex flex-wrap items-end gap-2"><CompleteMeetingAction task={task}/><Button type="button" variant="outline" size="sm" onClick={() => setSelected(task)}>View meeting notes</Button></div>
    </li>)}</ul>}
    {!tasks.loading && !tasks.error && !tasks.rows.length && <p className="py-4 text-sm text-muted-foreground">No outstanding meeting or project actions assigned to you.</p>}
    {tasks.more && <Button type="button" variant="outline" size="sm" disabled={tasks.loadingMore} onClick={() => tasks.loadMore()}>{tasks.loadingMore ? 'Loading…' : 'Load more actions'}</Button>}
    {selected && <TodayMeetingNotes task={selected} user={user} onClose={() => setSelected(null)}/>}
  </section>;
}