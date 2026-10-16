import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { deadlineDay } from '@/components/adaptive/adaptiveTime';
export default function WorkingDayTimeline({calendar,actions,time}) {
 const [expanded,setExpanded]=useState(false),today=time.day;
 const due=actions.filter(a=>deadlineDay(a.due)===today).map(a=>({key:a.key,title:a.title,detail:'Task due today',time:'Due today',sort:`${today}T23:59`,to:a.to}));
 const rows=[...calendar.rows,...due].sort((a,b)=>a.sort.localeCompare(b.sort));
 return <section className="at-panel at-day scroll-mt-24" id="adaptive-day"><header className="at-section-head"><div><span className="at-eyebrow">MAKE ROOM FOR WHAT MATTERS</span><h2>My working day</h2></div><Link className="at-text-link" to="/calendar">View calendar <ArrowUpRight size={12}/></Link></header><p className="at-section-note">Meetings and dated work · {time.timezone}</p>
  {calendar.loading&&<p role="status" className="at-small">Loading today’s calendar…</p>}
  {calendar.error&&<div className="at-calendar-note"><p>Calendar unavailable. Your dated tasks still appear here.</p><Link className="at-text-link" to="/calendar">Manage Outlook connection <ArrowUpRight size={13}/></Link></div>}
  {!calendar.loading&&!rows.length&&<div className="at-empty"><CalendarDays size={25}/><h3>A little breathing room.</h3><p>No meetings or dated tasks found for today.</p><Link className="at-text-link" to="/calendar">Open calendar</Link></div>}
  <ol className="at-timeline">{rows.slice(0,expanded?rows.length:6).map(row=><li key={row.key} className={row.ended?'at-ended':''}><time className={row.kind==='calendar'&&row.ended?'line-through text-muted-foreground':''}>{row.time}</time><div><h3 className={row.kind==='calendar'&&row.ended?'line-through text-muted-foreground':''}>{row.to?<Link to={row.to}>{row.title}</Link>:row.title}</h3><p>{row.detail}</p>{row.attendees?.length>0&&<p>Attendees: {row.attendees.join(', ')}</p>}{row.ended&&row.kind==='calendar'&&<p className="at-small">Finished</p>}{row.joinUrl&&!row.ended&&<a className="at-text-link" href={row.joinUrl} target="_blank" rel="noopener noreferrer">Join meeting <ArrowUpRight size={13}/></a>}{row.href&&/^https:\/\//i.test(row.href)&&<a className="at-text-link" href={row.href} target="_blank" rel="noopener noreferrer">Open in Outlook <ArrowUpRight size={13}/></a>}</div></li>)}</ol>
  {rows.length>6&&<button className="at-btn" onClick={()=>setExpanded(!expanded)}>{expanded?'Show less':'Show full day'}</button>}{calendar.more&&<button className="at-btn" disabled={calendar.loadingMore} onClick={()=>calendar.loadMore()}>{calendar.loadingMore?'Loading…':'Load more appointments'}</button>}
 </section>;
}