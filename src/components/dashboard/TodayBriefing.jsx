import React from 'react';
import { Link } from 'react-router-dom';
import useTodayBriefing from '@/components/dashboard/useTodayBriefing';
import useTodayContacts from '@/components/dashboard/useTodayContacts';
import TodayBriefingRow from '@/components/dashboard/TodayBriefingRow';
export default function TodayBriefing({dashboard,tasks}) {
 const query=useTodayBriefing(dashboard),contacts=useTodayContacts(dashboard.user);
 const loading=query.isPending || tasks.loading || contacts.isPending;
 const totals=query.data?.totals;
 const total=totals ? Object.values(totals).reduce((sum,n)=>sum+n,0)+tasks.total+(contacts.data?.total || 0) : 0;
 const taskRows=tasks.rows.slice(0,3).map(t=>({key:t.key,severity:'attention',title:t.title,detail:`${t.source} · Due ${t.due?.slice(0,10) || 'today'}`,to:t.to,label:'Review action'}));
 const people=contacts.data?.attention ? contacts.data.rows.map(r=>({key:`contact-${r.person.id}`,severity:'contact',title:r.person.full_name,detail:r.next?.due_at && Date.parse(r.next.due_at)<Date.now() ? `Overdue contact action: ${r.next.title}` : 'Follow-up suggested: no recent recorded contact',to:`/people/${r.person.id}`,label:'View person'})) : [];
 const rows=[...(query.data?.items || []).filter(r=>r.severity!=='upcoming'),...taskRows,...people,...(query.data?.items || []).filter(r=>r.severity==='upcoming')];
 const incomplete=query.error || tasks.error || contacts.error;
 return <section className="dashboard-panel" aria-label="Your daily briefing"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-extrabold">{loading ? 'Preparing your Today briefing…' : incomplete ? 'Your Today briefing' : total ? `${total} ${total===1?'thing needs':'things need'} your attention` : 'You’re up to date'}</h2><p className="mt-1 text-xs text-muted-foreground">Recorded risks, decisions, approvals, proposals, actions and relationships. Key dates cover the next 14 days.</p></div><button onClick={()=>{query.refetch();contacts.refetch();}} disabled={query.isFetching || contacts.isFetching} className="text-xs font-semibold text-chart-2 underline disabled:opacity-50">Refresh briefing</button></div>
 {incomplete && <p role="alert" className="mt-3 text-xs text-destructive">Some attention items could not be loaded. The briefing may be incomplete; use Refresh to retry.</p>}
 {loading ? <p role="status" className="mt-3 text-sm text-muted-foreground">Checking your accessible records…</p> : <><ul className="mt-4 grid gap-3 md:grid-cols-2">{rows.map(item=><TodayBriefingRow key={item.key} item={item} role={dashboard.role}/>)}</ul>{!rows.length && !incomplete && <p className="mt-3 text-sm text-muted-foreground">No recorded items require attention right now.</p>}<div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{totals && <><Link to="/projects">{totals.risks} high-risk items · {totals.decisions} overdue decisions · {totals.proposals} proposals awaiting response · {totals.dates} projects with key dates</Link><Link to="/approvals" className="underline">{totals.approvals} approvals</Link></>}<Link to="/crm/tasks" className="underline">{tasks.total} due or overdue actions</Link><Link to="/people" className="underline">{contacts.data?.total || 0} relationships to follow up</Link></div><p className="mt-2 text-[10px] text-muted-foreground">Showing up to three entries per category. Counts include all matching records; a project may have more than one attention item. Open the relevant workspace to review more.</p></>}
 </section>;
}