import React from 'react';
import {Button} from '@/components/ui/button';
import ProjectQuestionnaire from '@/components/questionnaire/ProjectQuestionnaire';
export default function RequestQuestionnaire({draft,onBack}) {
 return <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain"><Button type="button" variant="outline" onClick={onBack}>Back to project details</Button><p className="text-sm text-muted-foreground">Your request is saved, but no project has been created. Complete the PQ and its approvals, then return to the form to submit.</p><ProjectQuestionnaire key={draft.id} project={{id:draft.id,name:draft.name,project_number:`REQ-${draft.id.slice(-8).toUpperCase()}`,client_name:draft.client_name}} subject={{requestDraftId:draft.id}}/></div>;
}