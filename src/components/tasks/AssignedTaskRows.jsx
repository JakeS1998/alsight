import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
export default function AssignedTaskRows({ tasks, onNavigate }) {
  return <div className="mt-3">
    {tasks.error && <p role="alert" className="text-sm text-destructive">Unable to load assigned tasks: {tasks.error.message}</p>}
    {tasks.loading ? <p role="status" className="text-sm text-muted-foreground">Loading your tasks…</p> : <ul className="divide-y divide-border">{tasks.rows.map(task => <li key={task.key} className="py-3 text-sm">
      <Link to={task.to} onClick={onNavigate} className="block break-words font-medium text-foreground hover:underline">{task.title}</Link>
      <p className="text-xs text-muted-foreground">{task.source} · {task.due ? `Due ${new Date(task.due).toLocaleString('en-GB', { ...(task.due.length === 10 ? { dateStyle: 'medium' } : { dateStyle: 'medium', timeStyle: 'short' }) })}` : 'No due date'}{task.due && new Date(task.due).getTime() < Date.now() ? ' · Overdue' : ''}</p>
    </li>)}</ul>}
    {tasks.more && <Button variant="outline" size="sm" type="button" disabled={tasks.loadingMore} onClick={() => tasks.loadMore()}>{tasks.loadingMore ? 'Loading…' : 'Load more tasks'}</Button>}
  </div>;
}