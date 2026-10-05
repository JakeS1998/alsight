import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ProjectPOReferences from '@/components/projects/ProjectPOReferences';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
import SourceOpportunityLink from '@/components/crm/SourceOpportunityLink';
import { INTERNAL_ROLES } from '@/lib/portal';

export default function ProjectWorkspaceHeader({ project, user, isSupplier }) {
  return <>
    <div className="ws-topline"><Link to="/projects" className="ws-back"><ArrowLeft size={18} /> Back to Projects</Link></div>
    <header className="ws-hero">
      <Image className="ws-heroimg" src="https://media.base44.com/images/public/6ab62433a194f918c54c8249/2270cf491_generated_82905707.jpg" alt="Illustrative leisure-centre facade" />
      <div className="ws-herotext">
        <div className="ws-eyebrow">{project.project_number}</div>
        <h1 className="ws-title">{project.name}</h1>
        <div className="ws-meta">
          <span className={`ws-pill${project.live_project ? ' ws-live' : ''}`}>{project.live_project ? 'Live' : 'On Hold'}</span>
          {typeof project.procurement_route === 'boolean' && <span className="ws-pill">{project.procurement_route ? 'Framework' : 'Direct'}</span>}
          <FrameworkVersionBadge projectNumber={project.project_number} />
          <ProjectPOReferences project={project} />
        </div>
        {!isSupplier && project.description && <p className="ws-description">{project.description}</p>}
        {INTERNAL_ROLES.includes(user?.role) && <SourceOpportunityLink projectId={project.id} />}
      </div>
    </header>
  </>;
}