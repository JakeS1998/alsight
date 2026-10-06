import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProjectHeroPhoto from '@/components/projects/ProjectHeroPhoto';
import FrameworkVersionBadge from '@/components/projects/FrameworkVersionBadge';
import SourceOpportunityLink from '@/components/crm/SourceOpportunityLink';
import { INTERNAL_ROLES } from '@/lib/portal';
import useProjectHeroPhoto from '@/components/projects/useProjectHeroPhoto';
import ProjectHeroPosition from '@/components/projects/ProjectHeroPosition';
import ProjectRecordContext from '@/components/projects/ProjectRecordContext';

export default function ProjectWorkspaceHeader({ project, user, isSupplier, client }) {
  const photo = useProjectHeroPhoto(project, user);
  return <>
    <div className="ws-topline"><Link to="/projects" className="ws-back"><ArrowLeft size={18} /> Back to Projects</Link></div>
    <header className="ws-hero">
      <ProjectHeroPhoto key={`${project.id}:${photo.data?.url || ''}:${photo.dataUpdatedAt}`} photo={photo} project={project} />
      <div className="ws-herotext">
        <div className="ws-eyebrow">Delivery 360</div>
        <h1 className="ws-title">{project.name}</h1>
        <div className="ws-meta">
          <span className={`ws-pill${project.live_project ? ' ws-live' : ''}`}>{project.live_project ? 'Live' : 'On Hold'}</span>
          {typeof project.procurement_route === 'boolean' && <span className="ws-pill">{project.procurement_route ? 'Framework' : 'Direct'}</span>}
          <FrameworkVersionBadge projectNumber={project.project_number} />
        </div>
        <ProjectRecordContext project={project} client={client} user={user} isSupplier={isSupplier}/>
        {!isSupplier && project.description && <p className="ws-description">{project.description}</p>}
        {INTERNAL_ROLES.includes(user?.role) && <SourceOpportunityLink projectId={project.id} />}
        <ProjectHeroPosition project={project} />
      </div>
    </header>
  </>;
}