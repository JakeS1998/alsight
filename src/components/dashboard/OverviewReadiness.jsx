import React from 'react';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
const ratio = (rows, statuses) => { const count = (rows || []).reduce((n,r) => n+r.count,0); return count ? Math.round(rows.reduce((n,r) => n+(statuses.includes(r.status) ? r.count : 0),0)/count*100) : null; };
export default function OverviewReadiness({ data, metrics, fees }) {
  const total = metrics.projects;
  const percent = n => total ? Math.round(n/total*100) : null;
  const deliveryCount = data.delivery.reduce((n,r) => n+r.count,0);
  const programme = data.delivery.filter(r => r.avg_pct_programme != null);
  const progressCount = programme.reduce((n,r) => n+r.count,0);
  const build = progressCount ? Math.round(programme.reduce((n,r) => n+r.avg_pct_programme*r.count,0)/progressCount) : null;
  const rows = [['Scope',percent(data.coverage[0]),'Project description recorded'],['Fee',percent(fees.length),'Current fee proposal recorded'],['Prepare',percent(data.coverage[1]),'Questionnaire approval date recorded'],['Design',percent(data.coverage[2]),'RIBA 3 end recorded'],['Programme',percent(data.coverage[3]),'Completion target recorded'],['Act',ratio(data.actions,['done']),'Completed action records'],['Decide',ratio(data.decisions,['agreed']),'Agreed decision records'],['De-risk',ratio(data.risks,['closed']),'Closed risk records'],['Build',build,'Average saved programme progress'],['Handover',deliveryCount ? Math.round(data.delivery.reduce((n,r) => n+(r.client_handover === 'complete' ? r.count : 0),0)/deliveryCount*100) : null,'Delivery records marked handover complete']];
  return <DashboardPanel title="Project pathway readiness" subtitle="Recorded indicators, not full project checklist scores" link="/projects" linkLabel="View details"><div className="readiness-bars">{rows.map(([label,value,detail],i) => <div key={label} title={`${detail}: ${value == null ? 'Not recorded' : value+'%'}`}><span className="mb-1 block text-[9px] font-semibold">{value == null ? '—' : value+'%'}</span><div className={`mx-auto w-full max-w-10 rounded-t-md ${i < 2 ? 'bg-success' : 'bg-primary'}`} style={{height: value == null ? 4 : Math.max(4,value * 1.1)}} /><strong className="mt-2 block text-[9px]">{String(i+1).padStart(2,'0')}</strong><span className="mt-1 block truncate text-[8px] text-muted-foreground">{label}</span></div>)}</div></DashboardPanel>;
}