import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { aseRoles } from '@/components/ase/aseClient';
export default function AccountCurrentWork({ account, projects }) {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['account-current-work',account.id,user?.id,user?.role,projects.map(row => row.id).join(',')], queryFn: async () => {
    const [live,open] = await Promise.all([
      projects.length ? base44.entities.Project.filter({ id: { $in: projects.map(row => row.id) }, status: { $ne: 'inactive' },live_project: true, approval_status: { $nin: ['complete','completed'] }, $or: [{ practical_completion_date: { $exists: false } },{ practical_completion_date: { $in: [null,''] } },{ practical_completion_date: { $gte: new Date().toISOString() } }] },{ limit: 5,fields: ['name','project_number'] }) : { items: [] },
      aseRoles.includes(user?.role) ? base44.entities.Opportunity.filter({ account_id: { $in: [account.id,account.dataverse_id].filter(Boolean) },status: 'open' },{ limit: 5,sort: '-updated_date',fields: ['title','stage'] }) : { items: [] },
    ]); return { live: live.items,open: open.items };
  } });
  const sections=[['Active Projects','live'],...(aseRoles.includes(user?.role) ? [['Current Opportunities','open']] : [])].filter(([,key])=>query.isPending || query.error || query.data?.[key]?.length);
  if (!sections.length) return null;
  return <section className="account-panel account-overview-wide"><div className={sections.length>1 ? 'grid gap-6 md:grid-cols-2' : 'grid gap-6'}>{sections.map(([title,key]) => <div key={key}><h2>{title}</h2>{query.isPending ? <p role="status" className="text-sm text-muted-foreground">Loading…</p> : query.error ? <p role="alert" className="text-sm text-destructive">Account work is unavailable.</p> : !query.data[key].length ? <p className="text-sm text-muted-foreground">No visible {title.toLowerCase()}.</p> : <ul className={key === 'live' ? 'grid gap-4 min-[1200px]:grid-cols-3 min-[1600px]:grid-cols-4' : 'space-y-3'}>{query.data[key].map(row => <li key={row.id}><Link className="text-sm font-semibold hover:underline" to={key === 'live' ? `/projects/${row.id}` : `/opportunities/${row.id}`}>{row.name || row.title}</Link><p className="mt-1 text-xs capitalize text-muted-foreground">{row.project_number || row.stage?.replaceAll('_',' ')}</p></li>)}</ul>}</div>)}</div></section>;
}