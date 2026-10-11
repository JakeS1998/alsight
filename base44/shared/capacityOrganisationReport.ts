import { projectCommitments } from './deliveryCapacitySignals.ts';
import { capacityResponsibilityIdentity } from './capacityResponsibilityIdentity.ts';
import { capacityResponsibilityCriteria } from './capacityResponsibilityCriteria.ts';
import { capacityOrganisationReads } from './capacityOrganisationReads.ts';
import { capacityVisibleIds, restrictCapacityOrganisation } from './capacityVisibleDetails.ts';
const validDate=value=>value && Number.isFinite(Date.parse(value)) ? String(value).slice(0,10) : null;
export async function capacityOrganisationReport(db,user,input,projects,latest,read,visibleProjectIds=new Set(projects.map(project=>project.id)),detailDb=null) {
  const today=new Date().toISOString().slice(0,10),cutoff=new Date(Date.parse(today)+90*86400000).toISOString().slice(0,10);
  const identities=await capacityResponsibilityIdentity(db,user,projects.flatMap(project=>[project.bdm_aad_id,project.bsm_aad_id]),read);
  const selected=input.filters?.bdm ? identities.resolve(input.filters.bdm,'BDM').key : null;
  const aliases=selected ? [...identities.people].filter(([,person])=>person.key===selected).map(([id])=>id) : [];
  if(selected && !aliases.length)aliases.push(input.filters.bdm);
  const evidence=await capacityOrganisationReads(db,user,input,projects,read,aliases,!!detailDb);
  const visibleOpportunityIds=detailDb ? await capacityVisibleIds(detailDb,'Opportunity',evidence.opportunities.map(opportunity=>opportunity.id)) : new Set(evidence.opportunities.map(opportunity=>opportunity.id));
  const maps={bdm:new Map(),bsm:new Map()},clients={bdm:new Map(),bsm:new Map()},totals={bdm:{projects:projects.length,opportunities:0,pipelineValue:0,administration:0},bsm:{projects:projects.length,administration:0}},regions=new Map(),projectIndex=new Map();
  const gaps={missingBdm:0,missingBsm:0,missingManager:0,missingProgramme:0,missingStart:0,unresolved:0,unclassifiedOpportunities:0,missingOpportunityValues:0};
  const ownerFor=(id,role)=>{
    if(!String(id || '').trim())return null;
    const person=identities.resolve(id,role.toUpperCase());
    let owner=maps[role].get(person.key);
    if(!owner){owner={...person,projects:0,opportunities:0,pipelineValue:0,valuedOpportunities:0,administration:0,dueDocuments:0,warranties:0,dueWarranties:0,approvals:0,near:0,demanding:0,transitions:0,records:[],clientIds:new Set(),regionCounts:new Map()};maps[role].set(person.key,owner);if(!person.resolved)gaps.unresolved++;}
    return owner;
  };
  const clientFor=(role,clientId,label,owner,record)=>{if(!clientId)return;const client=clients[role].get(clientId) || {label:label || 'Linked client',owners:new Set(),records:[]};client.owners.add(owner?.key || null);client.records.push({id:record.id,label:record.label,href:record.href});clients[role].set(clientId,client);if(owner)owner.clientIds.add(clientId);};
  const snapshots=[];
  for(const project of projects){
    const paths=[latest.get(project.id),latest.get(project.dataverse_id)].filter(Boolean).sort((a,b)=>String(b.updated_date).localeCompare(String(a.updated_date))),path=paths[0];
    const signals=projectCommitments(project,path,today),near=signals.events.some(event=>event.date<=new Date(Date.parse(today)+30*86400000).toISOString().slice(0,10)),transition=signals.events.some(event=>['RIBA 3 completion','RIBA 4 completion'].includes(event.label));
    const record={id:project.id,label:project.name || 'Project',href:`/projects/${project.id}`,kind:'project',events:signals.events},owners={bdm:ownerFor(project.bdm_aad_id,'bdm'),bsm:ownerFor(project.bsm_aad_id,'bsm')};
    const snapshot={project,record,owners,signals,path};snapshots.push(snapshot);
    for(const id of [project.id,project.dataverse_id].filter(Boolean))projectIndex.set(id,snapshot);
    if(!owners.bdm)gaps.missingBdm++;if(!owners.bsm)gaps.missingBsm++;
    if(!project.project_manager_id)gaps.missingManager++;if(!signals.evidence)gaps.missingProgramme++;if(!validDate(path?.contract_start))gaps.missingStart++;
    for(const role of ['bdm','bsm']){const owner=owners[role];if(owner){owner.projects++;owner.near+=near ? 1 : 0;owner.demanding+=signals.demanding ? 1 : 0;owner.transitions+=transition ? 1 : 0;owner.records.push(record);owner.regionCounts.set(project.department_id || '',(owner.regionCounts.get(project.department_id || '') || 0)+1);}clientFor(role,project.client_account_id || project.account_id,project.client_name,owner,record);}
    const region=regions.get(project.department_id || '') || {id:project.department_id || '',projects:0,starts:[0,0,0],milestones:0,transitions:0,records:[]};region.projects++;region.transitions+=transition ? 1 : 0;region.milestones+=signals.events.length ? 1 : 0;
    [30,60,90].forEach((days,index)=>{const end=new Date(Date.parse(today)+days*86400000).toISOString().slice(0,10);if(signals.events.some(event=>event.label==='Construction start' && event.date<=end))region.starts[index]++;});
    if(signals.events.length)region.records.push({id:record.id,label:record.label,href:record.href});regions.set(region.id,region);
  }
  for(const opportunity of evidence.opportunities){
    const person=identities.resolve(opportunity.owner_id,'owner'),owner=person.role==='bdm' || maps.bdm.has(person.key) ? ownerFor(opportunity.owner_id,'bdm') : null;
    const budget=opportunity.budget!=null && Number.isFinite(Number(opportunity.budget)) && Number(opportunity.budget)>=0 ? Number(opportunity.budget) : null;
    totals.bdm.opportunities++;if(budget!=null)totals.bdm.pipelineValue+=budget;else gaps.missingOpportunityValues++;
    if(!owner){gaps.unclassifiedOpportunities++;continue;}
    const record={id:opportunity.id,label:opportunity.title || 'Opportunity',href:`/opportunities/${opportunity.id}`,kind:'opportunity',events:[]};owner.opportunities++;owner.records.push(record);if(budget!=null){owner.pipelineValue+=budget;owner.valuedOpportunities++;}clientFor('bdm',opportunity.account_id,'Linked opportunity client',owner,record);
  }
  const due=value=>{const date=validDate(value);return date && date>=today && date<=cutoff;};
  for(const row of evidence.documents){const owner=projectIndex.get(row.project_id)?.owners.bsm;totals.bsm.administration+=row.count;if(owner){owner.administration+=row.count;owner.dueDocuments+=(due(row.drafting_due_date) || due(row.signing_target_date)) ? row.count : 0;}}
  for(const row of evidence.warranties){const owner=projectIndex.get(row.project_id)?.owners.bsm;if(owner){owner.warranties+=row.count;owner.dueWarranties+=due(row.warranty_due) ? row.count : 0;}}
  for(const row of evidence.approvals){const owner=projectIndex.get(row.project_id)?.owners.bsm;if(owner)owner.approvals+=row.count;}
  const roleRows={bdm:capacityResponsibilityCriteria([...maps.bdm.values()],totals.bdm,clients.bdm),bsm:capacityResponsibilityCriteria([...maps.bsm.values()],totals.bsm,clients.bsm)};
  if(input.person && input.responsibilityRole){const owner=roleRows[input.responsibilityRole].find(person=>person.key===input.person),records=(owner?.records || []).filter(record=>record.kind==='project' ? visibleProjectIds.has(record.id) : visibleOpportunityIds.has(record.id)).sort((a,b)=>a.label.localeCompare(b.label) || a.id.localeCompare(b.id)),offset=input.offset || 0;return {today,recordPage:{items:records.slice(offset,offset+10).map(({events,...record})=>record),nextOffset:offset+10<records.length ? offset+10 : null}};}
  const insights=[];
  for(const role of ['bdm','bsm'])for(const owner of roleRows[role]){
    if(['Concentrated','Potential dependency'].includes(owner.classification))insights.push({key:`${role}:${owner.key}`,title:`${owner.name}: ${role.toUpperCase()} ${owner.classification.toLowerCase()}`,identified:owner.reasons.join(' '),why:role==='bdm' ? 'Commercial continuity may depend on a narrow set of recorded owners.' : 'Support continuity and upcoming administration may depend on a narrow set of recorded owners.',review:'Review shared ownership, cover arrangements and the stage / complexity of the linked work. Counts are not effort estimates.',records:owner.records.slice(0,3).map(({id,label,href})=>({id,label,href}))});
    for(const overlap of owner.overlaps)insights.push({key:`overlap:${role}:${owner.key}:${overlap.month}`,title:`${owner.name}: ${overlap.projects} commitments in ${overlap.month}`,identified:`${overlap.projects} supported / owned projects have milestones in the same calendar month.`,why:'Several approaching milestones may require coordination; this does not establish simultaneous effort or a diary clash.',review:'Check milestone timing and support responsibilities on the linked projects.',records:overlap.records});
  }
  const starts=[...regions.values()].reduce((sum,region)=>sum+region.starts[2],0);
  for(const region of regions.values())if(region.starts[2]>0 && region.starts[2]>starts-region.starts[2])insights.push({key:`region:${region.id}`,regionId:region.id,title:'Upcoming starts are concentrated in one region',identified:`${region.starts[2]} of ${starts} recorded starts within 90 days sit in this region.`,why:'Upcoming delivery mobilisation is concentrated geographically; available resource evidence cannot establish whether capacity is sufficient.',review:'Review the regional mobilisation programme and confirmed project team arrangements.',records:region.records.slice(0,3)});
  if(gaps.missingBdm || gaps.missingBsm)insights.push({key:'missing-owners',title:'Some project responsibilities are not recorded',identified:`${gaps.missingBdm} live projects lack a BDM and ${gaps.missingBsm} lack a BSM.`,why:'Incomplete ownership makes responsibility comparisons and continuity reviews less reliable.',review:'Confirm ownership using the existing project records and Admin Data Quality checks.',records:snapshots.filter(row=>!row.owners.bdm || !row.owners.bsm).slice(0,3).map(row=>({id:row.record.id,label:row.record.label,href:row.record.href}))});
  const limitations=['Workload figures include all active live projects across the organisation, subject to the selected filters, regardless of your project-detail permissions.','Project and opportunity names, milestone details, links and drill-down records are returned only when your existing RLS rules permit access. Restricted records still contribute to the totals.','Staff identities use existing contact links and your signed-in profile. Unlinked portal and Dataverse identifiers are not merged by name.','Project count, stage and pipeline value provide responsibility context, not hours, complexity estimates, individual performance or confirmed availability.','Approval counts describe pending requests on supported projects, not personal approval assignments. Undated administration is outstanding work, not forecast demand.','Client continuity prompts use repeated project / opportunity ownership, not verified strategic-relationship importance. Supplier insurance and strategic relationship enrichment are not included in this first increment.'];
  if(input.filters?.region || (!detailDb && user.role==='regional_director'))limitations.push('Regional pipeline includes only opportunities explicitly linked to projects in this regional selection. Unlinked opportunities cannot be regionalised reliably.');
  if(input.filters?.bdm)limitations.push('The selected BDM filter also restricts opportunity ownership to identifiable aliases of that BDM. A one-person selection cannot establish a peer distribution.');
  if(gaps.unclassifiedOpportunities)limitations.push(`${gaps.unclassifiedOpportunities} total opportunities could not be linked to a confirmed BDM identity; they remain in the total pipeline denominator but are not assigned to a BDM by assumption.`);
  if(gaps.missingOpportunityValues)limitations.push(`${gaps.missingOpportunityValues} total opportunities lack a usable pipeline value; value-based concentration uses recorded values only.`);
  const compact=owner=>{const {records,clientIds,regionCounts,exclusiveClients,...row}=owner;return row;};
  const report={today,organisation:{bdm:{owners:roleRows.bdm.map(compact),missing:gaps.missingBdm,totals:totals.bdm},bsm:{owners:roleRows.bsm.map(compact),missing:gaps.missingBsm,totals:totals.bsm},regions:[...regions.values()].map(region=>({...region,records:region.records.slice(0,3)})),insights,gaps,limitations,summary:{projects:projects.length,near:snapshots.filter(row=>row.record.events.some(event=>(Date.parse(event.date)-Date.parse(today))/86400000<=30)).length,next:snapshots.filter(row=>visibleProjectIds.has(row.project.id) && (!input.personal || ['admin','director','regional_director'].includes(user.role) || Object.values(row.owners).some(owner=>owner?.key===identities.ownKey))).flatMap(row=>row.record.events.map(event=>({label:row.record.label,href:row.record.href,...event}))).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3)},personal:{near:snapshots.filter(row=>Object.values(row.owners).some(owner=>owner?.key===identities.ownKey) && row.record.events.some(event=>(Date.parse(event.date)-Date.parse(today))/86400000<=30)).length,bdm:roleRows.bdm.find(owner=>owner.key===identities.ownKey)?.projects || 0,bsm:roleRows.bsm.find(owner=>owner.key===identities.ownKey)?.projects || 0,opportunities:roleRows.bdm.find(owner=>owner.key===identities.ownKey)?.opportunities || 0}}};
  return detailDb ? restrictCapacityOrganisation(report,visibleProjectIds,visibleOpportunityIds) : report;
}