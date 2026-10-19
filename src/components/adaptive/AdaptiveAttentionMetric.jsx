import React from 'react';
import KpiIllustration from '@/components/metrics/KpiIllustration';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function AdaptiveAttentionMetric({ data, actions, onSelect }) {
  return <section className="at-metric" data-tone="attention" aria-label="Requiring attention">
    <button type="button" className="at-attention-summary alsight-illustrated-kpi" aria-haspopup="dialog" onClick={() => onSelect('attention')}>
      <span><strong>{data.priorityTotal ?? '—'}</strong><span className="at-metric-label">Requiring attention</span><small>Actions, awareness and waiting items</small></span>
      <KpiIllustration label="Requiring attention"/>
    </button>
    <ul className="at-attention-items" aria-label="Recorded items needing attention">
      {actions.map(item => {
        const projectName = item.project?.name || (item.project_id && data.projects?.find(project => project.id === item.project_id || project.dataverse_id === item.project_id)?.name);
        const to = item.taskEntity === 'ProjectAction' ? `${item.to}&stage=6&phase=works` : item.to;
        return <li key={item.key}>
          <Link to={to} className="at-attention-item">
            <span className="min-w-0">
              {projectName && projectName !== item.title && <span className="at-attention-project">{projectName}</span>}
              <span className="at-attention-title">{item.title}</span>
              {item.detail && <span className="at-attention-detail">{item.detail}</span>}
              <span className="at-attention-source">{item.attentionKind ? `${item.attentionKind} · ` : ''}{item.label || 'Review source'}</span>
            </span><ArrowUpRight size={16} aria-hidden="true" className="mt-1 shrink-0"/>
          </Link>
        </li>;
      })}
    </ul>
    <p className="at-attention-footnote">{actions.length ? 'Loaded examples; select the total to review all attention sources.' : 'No attention items were returned. Select the total to review sources.'}</p>
  </section>;
}