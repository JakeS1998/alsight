import React from 'react';
import Logo from '@/components/Logo';
import LookoutSection from '@/components/lookout/LookoutSection';
import LookoutCalendar from '@/components/lookout/LookoutCalendar';
import LookoutPoll from '@/components/lookout/LookoutPoll';
import '@/components/lookout/lookout.css';
const List=({items,empty})=>items.length?<ul className="list-inside list-disc space-y-2">{items.map((text,i)=><li key={i} className="whitespace-pre-wrap break-words">{text}</li>)}</ul>:<p className="lookout-muted">{empty}</p>;
export default function LookoutPublication({issue}) {
  const c=issue.content;
  return <article className="lookout-theme lookout-paper overflow-hidden">
    <header className="lookout-masthead p-6 md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><Logo className="h-12 w-40"/><p className="text-xs font-semibold uppercase tracking-wider">Issue {String(issue.issue_number).padStart(3,'0')} · {issue.publication_date}</p></div><p className="lookout-muted mt-6 text-xs uppercase tracking-widest">ALSight presents</p><h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight md:text-6xl">THE LOOKOUT</h1><p className="mt-3 font-semibold">Projects, People & Information Connected</p><p className="lookout-muted mt-1 text-sm">Your weekly view across Alliance.</p>{issue.status!=='published' && <p className="mt-3 text-xs font-bold uppercase">{issue.status==='approved'?'Approved · awaiting publication':'Draft · administrator review'}</p>}</header>
    <div className="space-y-5 p-4 md:p-6">
      <LookoutSection number="1" title="Executive Snapshot"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{c.kpis.map(k=><div key={k.label} className="lookout-kpi"><p className="text-3xl font-extrabold tabular-nums">{k.value}</p><h3 className="mt-2 text-xs font-bold">{k.label}</h3><p className="lookout-muted mt-1 text-xs">{k.detail}</p></div>)}</div><div className="lookout-kpi mt-3"><h3 className="text-xs font-bold uppercase">Key Business Announcement</h3><p className="mt-2 whitespace-pre-wrap">{c.announcement}</p></div><p className="lookout-muted mt-3 text-xs">{c.reporting_window}</p></LookoutSection>
      <LookoutSection number="2" title="Action Required" action><List items={c.actions} empty="No mandatory actions submitted for this issue."/></LookoutSection>
      <LookoutSection number="3" title="Department Round-up"><div className="grid gap-3 md:grid-cols-2">{c.departments.map(d=><div key={d.name} className="lookout-kpi"><h3 className="font-bold">{d.name}</h3><p className="mt-2 whitespace-pre-wrap">{d.summary || 'No update submitted.'}</p><p className="mt-3 whitespace-pre-wrap text-xs"><strong>Impact:</strong> {d.impact || 'Not submitted.'}</p><p className="mt-2 whitespace-pre-wrap text-xs"><strong>Required action:</strong> {d.action || 'None submitted.'}</p></div>)}</div></LookoutSection>
      <LookoutSection number="4" title="Looking Ahead"><p className="lookout-muted mb-3 text-xs">14 days from publication · events, deadlines, training & social activities.</p><LookoutCalendar date={issue.publication_date} events={c.events}/></LookoutSection>
      <LookoutSection number="5" title="People & Culture"><List items={c.people} empty="No people updates submitted or recognition recorded."/></LookoutSection>
      <LookoutSection number="6" title="Values in Action"><p className="whitespace-pre-wrap">{c.values || 'No values-in-action example submitted.'}</p></LookoutSection>
      <LookoutSection number="7" title="What's New in ALSight"><div className="grid gap-5 md:grid-cols-2"><div><h3 className="mb-3 font-bold">Released this week</h3><List items={c.released} empty="No releases submitted."/></div><div><h3 className="mb-3 font-bold">Coming soon</h3><List items={c.coming_soon} empty="No roadmap updates submitted."/></div></div></LookoutSection>
      <LookoutSection number="8" title="Quick Poll"><LookoutPoll issue={issue}/></LookoutSection>
      <p className="lookout-muted text-xs leading-relaxed">{c.notes}</p>
    </div><footer className="border-t border-lookout-grey px-6 py-5 text-center text-xs font-semibold tracking-wide">Projects | People | Information Connected</footer>
  </article>;
}