import { projectCompletionDates } from './projectCompletionDates.ts';
export const assignmentFields = ['project_manager_id','bdm_aad_id','bsm_aad_id','director_aad_id','strategic_account_manager_aad_id'];
export const capacityProjectFields = ['id','dataverse_id','name','department_id',...assignmentFields,'aa_executed_date','practical_completion_date','construction_term_weeks',...[1,2,3,4].flatMap(n=>[`riba${n}_end`,`riba${n}_term_weeks`]),...[1,2,3,4,5].map(n=>`riba${n}_system_date`)];
const date = value => value && Number.isFinite(Date.parse(value)) ? String(value).slice(0,10) : null;
export function projectCommitments(project, delivery, today) {
  const expected = projectCompletionDates(project), events = [];
  const add = (label,value,source) => {const day=date(value); if(day && day>=today && day<=new Date(Date.parse(today)+90*86400000).toISOString().slice(0,10)) events.push({label,date:day,source});};
  if (!delivery?.pc_achieved) add('Construction start',delivery?.contract_start,'Recorded pathway start');
  for(let n=1;n<=4;n++) if(!date(project[`riba${n}_end`]) || date(project[`riba${n}_end`])>=today) add(`RIBA ${n} completion`,project[`riba${n}_end`] || expected[`riba${n}_system_date`],project[`riba${n}_end`] ? 'Recorded programme' : 'Expected programme');
  if(!delivery?.pc_achieved) add('Practical completion',delivery?.forecast_pc || delivery?.original_pc || project.practical_completion_date || expected.riba5_system_date,'Recorded or expected programme');
  const started=date(delivery?.contract_start), stage4=date(project.riba3_end), stage5=date(project.riba4_end);
  const demanding= !delivery?.pc_achieved && ((started && started<=today) || (stage5 && stage5<=today) || (stage4 && stage4<=today));
  const evidence=!!(started || stage4 || stage5 || events.length);
  return {events:events.sort((a,b)=>a.date.localeCompare(b.date)),demanding:!!demanding,evidence};
}
export function classifyCapacity(people) {
  const peers=people.filter(p=>p.resolved && p.evidence>0);
  const median=field=>{const values=peers.map(p=>p[field]).sort((a,b)=>a-b);return values.length ? (values[Math.floor((values.length-1)/2)]+values[Math.ceil((values.length-1)/2)])/2 : 0;};
  const middle={active:median('active'),demanding:median('demanding'),near:median('near')};
  return people.map(p=>{const signals=[];if(p.active>middle.active)signals.push('More active projects than the visible peer median');if(p.demanding>middle.demanding)signals.push('More late-design / construction projects than the visible peer median');if(p.near>middle.near && p.near>1)signals.push('More projects with commitments in 30 days than the visible peer median');return {...p,classification:!p.resolved || !p.evidence || peers.length<3 ? 'Insufficient information' : signals.length>=2 ? 'Concentrated' : signals.length ? 'Elevated' : 'Balanced',signals};});
}