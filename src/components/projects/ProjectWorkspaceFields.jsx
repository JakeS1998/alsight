import React from 'react';
import { Link } from 'react-router-dom';
import ProjectDetailGroups from '@/components/projects/ProjectDetailGroups';
import InlineDataverseField from '@/components/dataverse/InlineDataverseField';
import ProjectDirectory from '@/components/projects/ProjectDirectory';

export default function ProjectWorkspaceFields({ summary, assignments, details, project, onProjectUpdated }) {
  return <>
    <section className="ws-overview">
      <div className="ws-sectionhead"><h2 className="ws-sectiontitle">Delivery 360</h2></div>
      <div className="ws-card ws-summary">{summary.map(field => <div className="ws-field" key={field.label}>
        <div className="ws-label">{field.label}</div>
        <div className="ws-value"><InlineDataverseField label={field.label}>{field.to ? <Link to={field.to}>{field.value}</Link> : field.value}</InlineDataverseField></div>
      </div>)}</div>
    </section>
    <div className="ws-grid2">
      <ProjectDirectory project={project} assignments={assignments} onUpdated={onProjectUpdated} />
      <section className="ws-card ws-panel">
        <div className="ws-panelhead"><h3 className="ws-sectiontitle">Additional Details</h3></div>
        <ProjectDetailGroups groups={details} />
      </section>
    </div>
  </>;
}