import React from 'react';
import PMPathwayFees from '@/components/delivery/PMPathwayFees';
import PMPathwayRegister from '@/components/delivery/PMPathwayRegister';
import { ProgrammeMilestones } from '@/components/delivery/ProgrammeMilestones';
import JourneyProgressBreakdown from '@/components/delivery/JourneyProgressBreakdown';
import { savedConstructionValues } from '@/components/delivery/constructionAutomation';
import { formatCurrency } from '@/lib/portal';
const fields = {
  1: [['scope_summary','Scope summary'],['client_objectives','Client objectives'],['initial_constraints','Constraints'],['target_programme','Target programme'],['key_stakeholders','Stakeholders'],['site_visit_completed','Site visit completed'],['feasibility_status','Feasibility'],['feasibility_notes','Feasibility notes'],['next_action','Next action']],
  9: [['contractor','Contractor'],['contract_sum','Construction contract sum'],['contract_start','Contract start'],['original_pc','Original PC'],['forecast_pc','Forecast PC'],['pct_programme','Programme complete (%)'],['pct_cost','Cost complete (%)'],['current_valuation','Current valuation'],['variations','Variations'],['eot','Extension of time'],['eot_notes','EOT notes'],['lad_exposure','LAD exposure'],['lad_rate','LAD rate (£)'],['lad_rate_period','LAD rate period'],['lad_completion_date','LAD completion date'],['lad_terms','LAD terms / reference'],['key_site_issues','Site issues'],['last_progress_meeting','Last progress meeting'],['next_progress_meeting','Next progress meeting']],
  10: [['pc_achieved','Practical completion achieved'],['final_account_status','Final account'],['defects_period','Defects period'],['retention','Retention'],['om_manuals','O&M manuals'],['hs_file','Health & safety file'],['warranties_status','Warranties'],['training','Training'],['asset_info','Asset information'],['client_handover','Client handover'],['lessons_learned','Lessons learned']],
};
export default function PMPathwayStage({ stage, data, project }) {
  const kind = ({ 6: 'actions', 7: 'decisions', 8: 'risks' })[stage.id];
  const construction = stage.id === 9 ? { ...data.delivery, ...savedConstructionValues(project, data.delivery) } : data.delivery;
  return <section className="space-y-4 rounded-xl border border-border bg-card p-4">
    <h3 className="text-sm font-semibold">{String(stage.id).padStart(2,'0')} · {stage.label}</h3>
    <JourneyProgressBreakdown stage={stage} />
    {fields[stage.id] && <dl className="grid gap-4 sm:grid-cols-2">{fields[stage.id].map(([key,label]) => <div key={key}><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{['contract_sum','current_valuation','lad_rate'].includes(key) ? construction[key] == null ? 'Not recorded' : formatCurrency(construction[key]) : typeof construction[key] === 'boolean' ? construction[key] ? 'Yes' : 'No' : String(construction[key] || 'Not recorded').replaceAll('_',' ')}</dd></div>)}</dl>}
    {stage.id === 2 && <PMPathwayFees data={data} project={project} />}
    {stage.id === 3 && <div className="space-y-2">{[...data.legalDocs,...data.dmas.map(d => ({...d,document_type:'DMA'})),...data.jcts.map(d => ({...d,document_type:'JCT'}))].map(doc => <div key={`${doc.document_type}-${doc.id}`} className="flex justify-between gap-4 border-b border-border py-2 text-sm"><span>{doc.document_type?.replaceAll('_',' ')} · {doc.document_id || 'Document'}</span><span>{doc.executed === 'yes' ? 'Executed' : doc.executed === 'po' ? 'PO issued' : 'Outstanding'}</span></div>)}{!data.legalDocs.length && !data.dmas.length && !data.jcts.length && <p className="text-sm text-muted-foreground">No documents recorded yet.</p>}</div>}
    {stage.id === 4 && <div className="space-y-2">{data.team.map((member,i) => <div key={i} className="flex justify-between gap-4 border-b border-border py-2 text-sm"><span>{member.role}</span><span>{member.name}</span></div>)}{!data.team.length && <p className="text-sm text-muted-foreground">No delivery team recorded yet.</p>}</div>}
    {stage.id === 5 && <ProgrammeMilestones project={project} feeProposals={data.feeProposals} jcts={data.jcts} delivery={data.delivery} />}
    {kind && <PMPathwayRegister key={`${project.id}-${kind}`} projectId={project.id} kind={kind} initial={data[kind]} />}
    {stage.id === 8 && <div className="space-y-1 text-sm">{data.approvals.map((approval,i) => <p key={i}>{approval.stakeholder.toUpperCase()}: {approval.approved ? `Approved — ${approval.approver_name || 'Name not recorded'}` : 'Awaiting approval'}</p>)}</div>}
  </section>;
}