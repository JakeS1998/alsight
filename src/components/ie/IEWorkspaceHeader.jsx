import React from 'react';
import WorkspacePageHeader from '@/components/layout/WorkspacePageHeader';
export default function IEWorkspaceHeader(){
 return <div className="mb-[var(--ie-space)] [&_h1]:text-sidebar-foreground">
  <WorkspacePageHeader title="Insights & Engagement" description="Research, planning and engagement work, connected to clients and the places they serve." image="https://media.base44.com/images/public/6ab62433a194f918c54c8249/cf1f7801c_image.png" imageAlt="Four colleagues meeting around a laptop in a lounge seating area" imageFocalPointY={0.47}/>
 </div>;
}