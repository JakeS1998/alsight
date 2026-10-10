import React from 'react';
import {TabsContent} from '@/components/ui/tabs';
import ProjectRegisterTab from '@/components/projects/command/ProjectRegisterTab';
import ProjectPeopleTab from '@/components/projects/command/ProjectPeopleTab';
import ProjectApprovalLinks from '@/components/projects/command/ProjectApprovalLinks';
import ProjectRiskRegister from '@/components/delivery/ProjectRiskRegister';
import ProjectHandoverPack from '@/components/handover/ProjectHandoverPack';
import ProjectActivityHistory from '@/components/projects/workspace/ProjectActivityHistory';
import ProjectChanges from '@/components/alice/ProjectChanges';
import ProjectLessons from '@/components/alliance/ProjectLessons';
export default function ProjectConnectedTabs({project,user,query,accountMap,legalDocs,dmas,jcts,actionsContent,approvalAccess}) {
  return <>
    <TabsContent value="actions" className="ws-content">{actionsContent || <ProjectRegisterTab project={project} user={user} kind="actions"/>}</TabsContent>
    <TabsContent value="decisions" className="ws-content"><ProjectRegisterTab project={project} user={user} kind="decisions"/></TabsContent>
    <TabsContent value="risks" className="ws-content">{query.isPending ? <p role="status">Loading risk context…</p> : query.error ? <p role="alert" className="text-destructive">Unable to load risk context. <button className="underline" onClick={()=>query.refetch()}>Retry</button></p> : <ProjectRiskRegister project={project} delivery={query.data.delivery} accountMap={accountMap}/>}</TabsContent>
    <TabsContent value="people" className="ws-content"><ProjectPeopleTab project={project} accountMap={accountMap} legalDocs={legalDocs} jcts={jcts}/></TabsContent>
    <TabsContent value="activity" className="ws-content space-y-5"><ProjectChanges project={project} legalDocs={legalDocs} dmas={dmas} jcts={jcts}/><ProjectActivityHistory project={project} user={user}/><ProjectLessons project={project}/></TabsContent>
    <TabsContent value="handover" className="ws-content"><ProjectHandoverPack embedded project={project} savingDelivery={false} onStarted={()=>query.refetch()}/></TabsContent>
    {approvalAccess && <TabsContent value="approvals" className="ws-content"><ProjectApprovalLinks project={project} user={user}/></TabsContent>}
  </>;
}