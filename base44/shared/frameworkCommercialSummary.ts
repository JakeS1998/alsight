import {frameworkFeeSettings,frameworkFeeAmount} from './frameworkFees.ts';
import {frameworkCommercialContext} from './frameworkCommercialContext.ts';
import {frameworkProjectNumber,frameworkCommercialVersion,frameworkProposalValues} from './frameworkCommercialValues.ts';
export async function frameworkCommercialSummary(db,source,scope) {
 const context=await frameworkCommercialContext(db,source,scope),byAlias=new Map(),byNumber=new Map();
 for(const project of context.projects){byAlias.set(project.id,project);if(project.dataverse_id)byAlias.set(project.dataverse_id,project);byNumber.set(frameworkProjectNumber(project.project_number),project);}
 const groups=new Map();
 for(const row of context.rows) {
  const project=byAlias.get(row.project_id) || byNumber.get(frameworkProjectNumber(row.project_number || row.framework_ref));
  const key=project?.id || `${row.project_id || ''}:${row.project_number || ''}:${row.framework_ref}`;
  const group=groups.get(key) || {project,reference:row.framework_ref,number:row.project_number,historicalValue:0};
  group.historicalValue+=row.sum_calloff_value || 0;groups.set(key,group);
 }
 const eligible=new Set(context.callOff.projectIds);
  const summary={totalCallOffValue:context.callOff.value,callOffFinancialYear:context.callOff.financialYear.label,totalUKLFFees:0,totalPipelineValue:0,fw3PipelineValue:0,fw4PipelineValue:0,proposalValueCount:0,estimatedValueCount:0,historicalValueCount:0,uncalculatedFeeCount:0};
 for(const group of groups.values()) {
  const project=group.project,aliases=project ? [project.id,project.dataverse_id].filter(Boolean) : [];
  const types=new Set(aliases.flatMap(alias=>[...(context.documents.get(alias) || [])]));
  const route=types.has('access_agreement') ? 'dma' : types.has('equipment_only_agreement') && types.has('single_task_agreement') ? null : types.has('single_task_agreement') ? 'single_task' : types.has('equipment_only_agreement') ? 'equipment_only' : 'dma';
  const version=frameworkCommercialVersion(project?.project_number || group.number,group.reference);
  const defaults=frameworkFeeSettings(null,version,route),settings=frameworkFeeSettings(context.settings.find(row=>row.key===defaults.key),version,route);
  const proposal=aliases.map(alias=>context.proposals.get(alias)).filter(Boolean).sort((a,b)=>Number(b.revision_number)-Number(a.revision_number))[0];
  const estimate=Math.max(0,Number(project?.sum_estimated_value) || 0);
  const values=frameworkProposalValues(proposal,settings) || (project ? {value:estimate,feeBase:estimate,source:'estimated'} : {value:group.historicalValue,feeBase:group.historicalValue,source:'historical'});
  if(values.value<=0)continue;
  const signed=aliases.some(alias=>context.signedProjects.has(alias));
  if(!signed) {
   // Pipeline is remaining framework work, not signed call-offs or completed projects.
   if(project && !project.max_practical_completion_date) {
    summary.totalPipelineValue+=values.value;
    if(version==='FW3')summary.fw3PipelineValue+=values.value;
    if(version==='FW4')summary.fw4PipelineValue+=values.value;
   }
   continue;
  }
  if(!eligible.has(project?.id))continue;
   summary[`${values.source}ValueCount`]+=1;
  if(!settings.bands.length){summary.uncalculatedFeeCount+=1;continue;}
  summary.totalUKLFFees+=frameworkFeeAmount(settings.bands,values.feeBase,settings.calculation);
 }
 for(const key of ['totalCallOffValue','totalUKLFFees','totalPipelineValue','fw3PipelineValue','fw4PipelineValue'])summary[key]=Math.round(summary[key]*100)/100;
 return summary;
}