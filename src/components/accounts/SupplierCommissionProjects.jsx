import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/portal';
export default function SupplierCommissionProjects({ projects = [] }) {
  return <div className="mt-3 border-t border-border pt-3">
    <h3 className="mb-2 text-xs font-semibold">Five most recent projects</h3>
    {!projects.length ? <p className="text-xs text-muted-foreground">No accessible projects with commission recorded.</p> : <div className="overflow-x-auto"><table className="w-full text-xs">
      <thead className="text-muted-foreground"><tr><th scope="col" className="pb-2 text-left font-medium">Project</th><th scope="col" className="pb-2 text-right font-medium">%</th><th scope="col" className="pb-2 pl-3 text-right font-medium">Commission £</th></tr></thead>
      <tbody>{projects.map(project => <tr key={project.id} className="border-t border-border"><th scope="row" className="py-2 pr-3 text-left font-medium"><Link to={`/projects/${project.id}`} className="hover:underline">{project.name}</Link><span className="block text-muted-foreground">{project.project_number}</span></th><td className="py-2 text-right tabular-nums">{project.rate.toFixed(2)}%</td><td className="whitespace-nowrap py-2 pl-3 text-right tabular-nums">{project.cash_value==null?'Not recorded':formatCurrency(project.cash_value)}</td></tr>)}</tbody>
    </table></div>}
    <p className="mt-2 text-[11px] text-muted-foreground">Newest project records first. Cash value is the project’s recorded average commission rate × full project value excluding VAT; unavailable project values are marked “Not recorded”.</p>
  </div>;
}