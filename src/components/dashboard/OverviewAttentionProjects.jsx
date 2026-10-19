import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const attentionLink = (project, reason) => `/projects/${project.id}?tab=delivery&stage=${reason.startsWith('Overdue action') ? 6 : 9}&phase=works`;
export default function OverviewAttentionProjects({ projects }) {
  if (!projects.length) return <p className="py-3 text-sm text-muted-foreground">No recorded actions or completion dates currently need attention.</p>;
  return <ul aria-label="Projects needing attention" className="max-h-64 space-y-3 overflow-y-auto overscroll-contain pr-1">
    {projects.map(({ project, reasons }) => <li key={project.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
      <Link to={attentionLink(project, reasons[0])} className="text-sm font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{project.name}</Link>
      <ul className="mt-1 space-y-1">{reasons.map(reason => <li key={reason}>
        <Link to={attentionLink(project, reason)} className="flex items-start justify-between gap-3 rounded-sm py-1 text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span>{reason}<span className="sr-only"> · Open {reason.startsWith('Overdue action') ? 'Action Register' : 'Build completion dates'}</span></span><ArrowUpRight aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0"/>
        </Link>
      </li>)}</ul>
    </li>)}
  </ul>;
}