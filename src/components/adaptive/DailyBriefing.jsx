import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';
export default function DailyBriefing({user,data,actions,context,calendar,since}) {
 const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',hour12:false}).format(new Date())),greeting=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
 const date=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'}).format(new Date());
 const first=user.full_name?.trim().split(' ')[0]||'there',lead=actions[0];
 return <section className="at-briefing" aria-labelledby="at-greeting">
  <div className="at-brief-copy"><div className="at-eyebrow"><span className="at-live-dot"/> YOUR DAY, IN FOCUS <span className="at-date">{date}</span></div>
   <h1 id="at-greeting">{greeting}, {first}<span>.</span></h1>
   <p className="at-lede">{lead?<>Start with what matters.<br/><strong>{lead.title}</strong></>:<>A little clarity for the day ahead.<br/><strong>No attention signals in the records loaded.</strong></>}</p>
   <p className="at-summary">{data.priorityTotal!==null&&<><strong>{data.priorityTotal} open attention {data.priorityTotal===1?'item':'items'}</strong> across available sources. </>}{lead?`${lead.detail||'This item is awaiting your attention.'}`:'Your workspace will surface work as assigned tasks and project signals become available.'} {data.warnings.length>0?'Some sources are unavailable; this is a partial briefing.':''}</p>
   <a className="at-btn at-btn-primary" href="#adaptive-priorities">Find my next action <ArrowDown size={15}/></a>
  </div>
  <aside className="at-brief-aside"><Sparkles size={23}/><span className="at-eyebrow">BUILT AROUND YOU</span><h2>{context.label}</h2><p>{context.description}</p><dl><div><dt>Assigned tasks</dt><dd>{data.taskTotal??'Unavailable'}</dd></div><div><dt>Meetings today</dt><dd>{calendar.error?'Not connected / unavailable':calendar.loading?'Loading…':`${calendar.rows.length}${calendar.more?'+':''}`}</dd></div><div><dt>Projects updated since last visit</dt><dd>{!since?'First visit':data.changes??'Unavailable'}</dd></div></dl><span className="at-small">Live records · Existing access permissions</span></aside>
 </section>;
}