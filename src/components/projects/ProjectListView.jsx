import React from 'react';
import projectFullValue from '@/components/projects/projectFullValue';
import RecordUpdatedAt from '@/components/RecordUpdatedAt';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate, regionName } from '@/lib/portal';
import { projectStaffName } from '@/components/projects/projectStaffName';
import ProjectListStatus from '@/components/projects/ProjectListStatus';
const columns = [{ label: 'Number', sort: 'number' }, { label: 'Name', sort: 'name' }, { label: 'Client' }, { label: 'Value', sort: 'value', financial: true }, { label: 'BSM' }, { label: 'Region' }, { label: 'Completion' }, { label: 'Status' }];
export default function ProjectListView({ projects, accountMap, staffMap, role, density, sortBy, onSort }) {
  const navigate = useNavigate();
  const comfortable = density === 'comfortable';
  const cell = comfortable ? 'px-4 py-5 align-middle' : 'px-4 py-2.5 align-middle';
  const showValues = !['supplier', 'project_manager'].includes(role);
  const sortColumn = value => onSort(value === 'number' ? 'number' : sortBy === `${value}_asc` ? `${value}_desc` : `${value}_asc`);
  return <div className="min-w-0 w-full max-w-full overflow-x-auto rounded-xl border border-border bg-card">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Projects in {density} list view. Select a project to open its details.</caption>
      <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><tr>{columns.filter(column => !column.financial || showValues).map(column => {
        const active = column.sort && (sortBy === column.sort || sortBy.startsWith(`${column.sort}_`));
        return <th key={column.label} scope="col" aria-sort={active ? sortBy.endsWith('_desc') ? 'descending' : 'ascending' : undefined} className="whitespace-nowrap px-4 py-3 font-medium">{column.sort ? <button type="button" onClick={() => sortColumn(column.sort)} className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{column.label}<ArrowUpDown className={active ? 'h-3 w-3 text-foreground' : 'h-3 w-3 opacity-50'} /></button> : column.label}</th>;
      })}</tr></thead>
      <tbody className="divide-y divide-border">{projects.map(project => <tr key={project.id} tabIndex={0} aria-label={`Open ${project.name}`} onClick={event => { if (!event.target.closest('a,button')) navigate(`/projects/${project.id}`); }} onKeyDown={event => { if (event.key === 'Enter' && event.target === event.currentTarget) navigate(`/projects/${project.id}`); }} className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted focus-visible:outline-none">
        <td className={`${cell} whitespace-nowrap text-muted-foreground`}>{project.project_number || '—'}</td>
        <td className={`${cell} min-w-[220px]`}><Link className="font-semibold text-foreground hover:underline" to={`/projects/${project.id}`}>{project.name}</Link><RecordUpdatedAt record={project} className="mt-1" /></td>
        <td className={`${cell} min-w-[160px] text-muted-foreground`}>{accountMap[project.client_account_id]?.name || project.client_name || '—'}</td>
        {showValues && <td className={`${cell} whitespace-nowrap tabular-nums`}>{formatCurrency(projectFullValue(project))}</td>}
        <td className={`${cell} min-w-[150px] text-muted-foreground`}>{projectStaffName(project.bsm_aad_id, staffMap) || '—'}</td>
        <td className={`${cell} whitespace-nowrap text-muted-foreground`}>{regionName(project.department_id) || '—'}</td>
        <td className={`${cell} whitespace-nowrap text-muted-foreground`}>{formatDate(project.practical_completion_date)}</td>
        <td className={`${cell} min-w-[130px]`}><ProjectListStatus project={project} comfortable={comfortable} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}