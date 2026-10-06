import React from 'react';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import MeetingOperationContext from '@/components/projects/workspace/MeetingOperationContext';
import ProjectMeetingActions from '@/components/projects/workspace/ProjectMeetingActions';
import ProjectMeetingNotes from '@/components/projects/workspace/ProjectMeetingNotes';
import ProjectMeetingDocuments from '@/components/projects/workspace/ProjectMeetingDocuments';
const titles={actions:'Add project action',notes:'Add meeting note',documents:'Review project documents',comment:'Add comment'};
export default function ProjectWorkspaceQuickDialog({selection,user,manager,meeting,onClose}) {
  const {project,kind}=selection,session=meeting && manager.active ? manager.session : null;
  const record=(type,row)=>session ? manager.record(type,project,row) : Promise.resolve(true);
  return <Dialog open onOpenChange={open=>{if(!open && !manager.operations)onClose();}}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" onEscapeKeyDown={event=>{if(manager.operations)event.preventDefault();}} onPointerDownOutside={event=>{if(manager.operations)event.preventDefault();}}><DialogHeader><DialogTitle>{titles[kind]}</DialogTitle><DialogDescription>{project.project_number ? `${project.project_number} · ` : ''}{project.name}</DialogDescription></DialogHeader><MeetingOperationContext.Provider value={manager.operationContext}>{kind==='actions' ? <ProjectMeetingActions project={project} user={user} onRecord={record}/> : kind==='documents' ? <ProjectMeetingDocuments project={project} user={user}/> : <ProjectMeetingNotes project={project} user={user} session={session} sessionKey={session?.key_points || ''} onRecord={record} kind={kind==='comment' ? 'comment' : 'meeting_note'}/>}</MeetingOperationContext.Provider></DialogContent></Dialog>;
}