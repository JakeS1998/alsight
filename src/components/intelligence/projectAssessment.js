import projectHealthDimensions from '@/components/alice/projectHealthDimensions';
import {projectStage} from '@/components/dashboard/pipelineStage';
export default function projectAssessment(project,data,facts,timing) {
  const dimensions=projectHealthDimensions(data,facts),stage=projectStage(project),today=new Date().toISOString().slice(0,10);
  const started=data.delivery?.contract_start && data.delivery.contract_start.slice(0,10)<=today;
  const completed=[data.delivery?.pc_achieved,project.practical_completion_date].some(date=>date && date.slice(0,10)<=today);
  return dimensions.map(d=>{
    if(d.name==='Legal' && data.legalPending && !timing.legalDue && !started) return {...d,status:'In preparation',reason:`${data.legalPending} recorded agreements are incomplete. No passed signing target or construction commencement is recorded; future requirements are not treated as overdue.`};
    if(d.name==='Documents' && data.outstanding && !timing.warrantyDue && !completed) return {...d,status:'Not yet due',reason:`${data.outstanding} active warranties are outstanding. No passed warranty due date or achieved practical completion is recorded.`};
    return d;
  });
}