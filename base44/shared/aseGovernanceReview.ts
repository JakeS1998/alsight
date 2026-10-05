import {validateEvidence} from './aseAssessment.ts';
import {backlogPath,opinionPath} from './aseCouncilRegisters.ts';
export function validateGovernanceReview(account,row,input,rules,user) {
  const check=input.verification,evidence=input.evidence;
  if(!check || check.identity_confirmed!==true || check.primary_document_checked!==true) throw new Error('Confirm the council identity and that you have read the primary document.');
  if(!['audit','intervention'].includes(row.component) || evidence?.component!==row.component) throw new Error('Governance review must keep the source component.');
  if(!['current','resolved','historic'].includes(check.document_status)) throw new Error('Confirm whether the documented position is current, resolved or historic.');
  if(typeof check.primary_reference!=='string' || check.primary_reference.length>1000) throw new Error('Provide a primary report or notice URL.');
  const url=new URL(check.primary_reference),host=url.hostname.toLowerCase();
  let councilHost='';try{councilHost=new URL(/^https?:\/\//i.test(account.website || '') ? account.website : 'https://'+account.website).hostname.toLowerCase().replace(/^www\./,'');}catch{ /* No recorded council website. */ }
  const trusted=host==='www.gov.uk' || host==='assets.publishing.service.gov.uk' || host==='www.nao.org.uk' || host==='www.psaa.co.uk' || (councilHost.endsWith('.gov.uk') && (host===councilHost || host.endsWith('.'+councilHost)));
  if(url.protocol!=='https:' || url.username || url.password || url.port || !trusted || url.pathname==='/') throw new Error('Use a specific HTTPS document on GOV.UK, NAO, PSAA or the recorded council website.');
  if(row.component==='audit' && [opinionPath,backlogPath].some(path=>url.pathname.startsWith(path))) throw new Error('General backstop guidance and non-compliance lists are not the council audit opinion. Link the actual council or auditor report.');
  if(typeof evidence.notes!=='string' || evidence.notes.trim().length<40) throw new Error('Record at least 40 characters explaining the verified findings, dates and source basis.');
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && Date.parse(value)<=Date.now();
  for(const key of ['operative_from','operative_to']) if(check[key] && !validDate(check[key])) throw new Error('Operative dates must be valid and not in the future.');
  if(check.operative_to && (!check.operative_from || check.operative_to<check.operative_from)) throw new Error('An ending date requires a commencement date and cannot precede it.');
  const contextOnly=row.component==='audit' && check.audit_basis==='backstop_only';
  if(row.component==='audit' && !['substantive','mixed','backstop_only'].includes(check.audit_basis)) throw new Error('Verify whether the audit basis is substantive, mixed or backstop-only.');
  if(row.component==='audit' && check.audit_basis==='mixed' && ['1','2'].includes(evidence.value) && check.material_findings_confirmed!==true) throw new Error('Confirm substantive material findings independently of the backstop limitation.');
  if(row.component==='intervention') {
    if(['1','2','3'].includes(evidence.value) && (check.document_status!=='current' || !validDate(check.operative_from) || check.operative_to)) throw new Error('An active event requires current status, a commencement date and no ending date.');
    if(evidence.value==='4' && (check.document_status!=='resolved' || !validDate(check.operative_to) || Date.now()-Date.parse(check.operative_to)>731*86400000)) throw new Error('A resolved event must have ended within the preceding 24 months.');
    if(evidence.value==='5' && check.document_status!=='current') throw new Error('Verified absence requires a current check, not a historic document.');
  }
  const verified=validateEvidence({...evidence,source:row.source,source_reference:url.href,...(contextOnly ? {value:'5',severity:'none'} : {})},rules);
  if(contextOnly) verified.value='Backstop-only audit limitation; context, not scored';
  return {...verified,score_eligible:!contextOnly,governance_review:{council_code:account.local_authority_code,identity_confirmed:true,primary_document_checked:true,primary_reference:url.href,document_status:check.document_status,audit_basis:row.component==='audit' ? check.audit_basis : 'not_applicable',operative_from:check.operative_from || '',operative_to:check.operative_to || '',material_findings_confirmed:check.material_findings_confirmed===true,verified_by:user.id,verified_name:user.full_name || user.id,verified_at:new Date().toISOString(),discovery_reference:row.governance_review?.discovery_reference || row.source_reference}};
}