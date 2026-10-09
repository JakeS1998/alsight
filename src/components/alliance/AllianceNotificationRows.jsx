import React,{useState} from 'react';
import fullName from '@/components/data/fullName';
import {Link} from 'react-router-dom';
export default function AllianceNotificationRows({notifications,onNavigate}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState('');
  if(!notifications.enabled) return null;
  const update=async(row,dismiss=false)=>{setBusy(row.id);setError('');try{await notifications.update(row,dismiss);}catch(e){setError(e.message || 'Unable to update notification.');}finally{setBusy('');}};
  const title=row=>row.reason==='company' ? `${fullName(row.author_name,row.author_id)} shared a company update` : row.reason==='everyone' ? `${fullName(row.author_name,row.author_id)} mentioned @everyone` : `${fullName(row.author_name,row.author_id)} mentioned you`;
  return <section className="mt-3 border-b border-border pb-3" aria-label="Alliance Insider notifications">
    <h3 className="text-sm font-medium">Alliance Insider</h3>
    {(error || notifications.error) && <p role="alert" className="mt-2 text-xs text-destructive">{error || notifications.error}</p>}
    {notifications.loading ? <p role="status" className="mt-2 text-xs text-muted-foreground">Loading updates…</p> : !notifications.rows.length ? <p className="mt-2 text-xs text-muted-foreground">No new Insider notifications.</p> : <ul className="mt-2 max-h-64 divide-y divide-border overflow-auto">{notifications.rows.map(row=><li key={row.id} className="py-3 text-sm">
      <Link to={`/pulse?${new URLSearchParams({post:row.post_id,...(row.group_id ? {group:row.group_id} : {})})}`} onClick={()=>{update(row);onNavigate();}} className={`block break-words text-chart-2 hover:underline ${row.read_at ? 'font-medium' : 'font-bold'}`}>{title(row)}{!row.read_at && <span className="ml-2 text-xs text-primary">New</span>}</Link>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(row.created_date).toLocaleString('en-GB')}</p>
      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">{!row.read_at && <button type="button" disabled={busy===row.id} onClick={()=>update(row)} className="underline disabled:opacity-50">Mark as read</button>}<button type="button" disabled={busy===row.id} onClick={()=>update(row,true)} className="underline disabled:opacity-50">Dismiss</button></div>
    </li>)}</ul>}
    {notifications.hasMore && <button type="button" disabled={notifications.loadingMore} onClick={notifications.loadMore} className="mt-2 text-xs underline">{notifications.loadingMore ? 'Loading…' : 'More notifications'}</button>}
  </section>;
}