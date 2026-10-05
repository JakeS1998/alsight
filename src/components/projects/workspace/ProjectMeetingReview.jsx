import React,{useState} from 'react';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import ProjectReviewHeader from '@/components/projects/workspace/ProjectReviewHeader';
import ProjectMeetingOverview from '@/components/projects/workspace/ProjectMeetingOverview';
import ProjectMeetingActions from '@/components/projects/workspace/ProjectMeetingActions';
import ProjectMeetingDocuments from '@/components/projects/workspace/ProjectMeetingDocuments';
import ProjectMeetingNotes from '@/components/projects/workspace/ProjectMeetingNotes';
export default function ProjectMeetingReview({project,user,staffMap,accountMap,sessionId,onRecord}) {
 const [tab,setTab]=useState('overview');
 if(!project) return <p className="p-8 text-sm text-muted-foreground">Select a project to begin its review.</p>;
 return <div><ProjectReviewHeader project={project} staffMap={staffMap} accountMap={accountMap}/><Tabs value={tab} onValueChange={setTab} className="p-5"><TabsList className="mb-4 w-full">{['overview','actions','documents','notes'].map(t=><TabsTrigger key={t} value={t} className="flex-1 capitalize">{t}</TabsTrigger>)}</TabsList><TabsContent value="overview"><ProjectMeetingOverview project={project} user={user}/></TabsContent><TabsContent value="actions"><ProjectMeetingActions project={project} user={user} onRecord={onRecord}/></TabsContent><TabsContent value="documents"><ProjectMeetingDocuments project={project} user={user}/></TabsContent><TabsContent value="notes"><ProjectMeetingNotes project={project} user={user} sessionId={sessionId} onRecord={onRecord}/></TabsContent></Tabs></div>;
}