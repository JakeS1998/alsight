import React from 'react';
import {Link} from 'react-router-dom';
import ProjectQuestionnaire from '@/components/questionnaire/ProjectQuestionnaire';
export default function OpportunityQuestionnaire({item,account}) {
 if(item.project_id)return <div className="rounded-panel border border-border bg-card p-5"><p className="text-sm">This opportunity’s PQ has moved with its project.</p><Link to={`/projects/${item.project_id}?tab=questionnaire`} className="mt-3 inline-block text-sm font-semibold underline">Open project questionnaire</Link></div>;
 return <div className="space-y-4"><p className="text-sm text-muted-foreground">Start the Project Questionnaire at any opportunity stage. Use Save draft to save incomplete answers, then return to this tab later to continue where you left off. Submit only when complete; all sequential approvals must finish before the opportunity can become a project.</p><ProjectQuestionnaire key={item.id} project={{id:item.id,name:item.title,project_number:`OPP-${item.id.slice(-8).toUpperCase()}`,client_name:account.name}} subject={{opportunityId:item.id}}/></div>;
}