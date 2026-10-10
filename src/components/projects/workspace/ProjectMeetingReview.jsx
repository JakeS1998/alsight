import React from 'react';
import { TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StickyNote } from 'lucide-react';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectReviewHeader from '@/components/projects/workspace/ProjectReviewHeader';
import ProjectMeetingActions from '@/components/projects/workspace/ProjectMeetingActions';
import ProjectMeetingNotes from '@/components/projects/workspace/ProjectMeetingNotes';
export default function ProjectMeetingReview({project,user,staffMap,accountMap,session,sessionKey,onRecord}) {
  if (!project) return <p className="p-8 text-sm text-muted-foreground">Select a project to begin its review.</p>;
  return <div>
    <ProjectReviewHeader project={project} staffMap={staffMap} accountMap={accountMap}/>
    <ProjectDetail key={project.id} embedded embeddedProjectId={project.id} suppliedAccountMap={accountMap}
      actionsContent={<ProjectMeetingActions project={project} user={user} onRecord={onRecord}/>}
      extraNavigation={<TabsTrigger value="notes" className="ws-navitem"><StickyNote/>Meeting notes</TabsTrigger>}
      extraContent={<TabsContent value="notes" className="ws-content"><ProjectMeetingNotes project={project} user={user} session={session} sessionKey={sessionKey} onRecord={onRecord}/></TabsContent>}
    />
  </div>;
}