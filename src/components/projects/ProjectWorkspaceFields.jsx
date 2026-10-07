import React from 'react';
import { Link } from 'react-router-dom';
import ProjectDetailGroups from '@/components/projects/ProjectDetailGroups';

export default function ProjectWorkspaceFields({ summary, assignments, details }) {
  return <>
    <section className="ws-overview">
      <div className="ws-sectionhead"><h2 className="ws-sectiontitle">Delivery 360</h2></div>
      <div className="ws-card ws-summary">{summary.map(field => <div className="ws-field" key={field.label}>
        <div className="ws-label">{field.label}</div>
        <div className="ws-value">{field.to ? <Link to={field.to}>{field.value}</Link> : field.value}</div>
      </div>)}</div>
    </section>
    <div className="ws-grid2">
      <section className="ws-card ws-panel">
        <div className="ws-panelhead"><h3 className="ws-sectiontitle">Team Assignments</h3></div>
        <div className="ws-teamgrid">{assignments.map(([label, value]) => <div className="ws-teamitem" key={label}><div className="ws-label">{label}</div><div className="ws-value">{value || '—'}</div></div>)}</div>
      </section>
      <section className="ws-card ws-panel">
        <div className="ws-panelhead"><h3 className="ws-sectiontitle">Additional Details</h3></div>
        <ProjectDetailGroups groups={details} />
      </section>
    </div>
  </>;
}