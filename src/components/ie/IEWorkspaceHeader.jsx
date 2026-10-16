import React from 'react';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
export default function IEWorkspaceHeader(){
 return <div className="mb-[var(--ie-space)] [&_h1]:text-sidebar-foreground">
  <WorkspacePageHeader title="Insights & Engagement" description="Research, planning and engagement work, connected to clients and the places they serve." image="https://media.base44.com/images/public/6ab62433a194f918c54c8249/18affe273_generated_image.png" imageAlt="Community representatives and researchers reviewing survey findings and leisure-centre plans together" imageFocalPointY={0.2}/>
 </div>;
}