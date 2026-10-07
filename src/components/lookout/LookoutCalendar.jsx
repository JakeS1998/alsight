import React from 'react';
export default function LookoutCalendar({date,events}) {
  const days=Array.from({length:14},(_,i)=>{const day=new Date(date+'T12:00:00Z');day.setUTCDate(day.getUTCDate()+i);return day.toISOString().slice(0,10);});
  return <><div className="grid grid-cols-2 gap-2 sm:grid-cols-7">{days.map(day=><div key={day} className="lookout-kpi !p-2"><time className="text-xs font-bold" dateTime={day}>{new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})}</time>{events.filter(e=>e.date===day).map((e,i)=><p key={i} className="mt-2 break-words text-xs"><strong>{e.type}</strong><br/>{e.title}</p>)}</div>)}</div>{!events.length && <p className="lookout-muted mt-3">No upcoming entries recorded or submitted.</p>}</>;
}