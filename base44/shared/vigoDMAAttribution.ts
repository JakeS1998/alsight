import {vigoProjectId,vigoProjectRef,savedVigoDMAFees,extractVigoDMAFees} from './vigoDMAFees.ts';
import {projectSharePointReads} from './projectSharePointReads.ts';
import {resolveDMASavedLink} from './dmaSavedLink.ts';
import {isHensall,isDMAContractValue} from './hensallDMAContractValue.ts';
import {dmaSupplierContractorAccount as dmaContractorAccount,dmaContractValueCandidates} from './dmaSupplierContractValue.ts';
const normalise=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const types={principaldesignercdmfee:'appointment_pd_cdm',principaldesignercdm:'appointment_pd_cdm',principaldesignerbuildingregsfee:'appointment_pd_br',principaldesignerbuildingregulationsfee:'appointment_pd_br',projectmanagerfee:'appointment_pm',architectfee:'appointment_architect',contractorfee:'contractor',contractsum:'contractor',contractvalue:'contractor'};
const aliases=account=>[account.id,account.dataverse_id].filter(Boolean);
export async function readVigoDMAEvidence(base44,account,automatic=false,projectId=vigoProjectId,reviewWithProposal=false) {
  const selected=projectId===vigoProjectId ? null : await base44.entities.Project.get(projectId);
  const projectRefs=selected ? [selected.id,selected.dataverse_id].filter(Boolean) : [vigoProjectId,vigoProjectRef];
  if(account) {
  const refs=projectRefs,ids=aliases(account);
  const [appointments,contracts]=await Promise.all([base44.entities.LegalDocument.count({project_id:{$in:refs},account_id:{$in:ids},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_pd_br','appointment_architect']}}),base44.entities.JCT.count({project_id:{$in:refs},executed:'yes',$or:[{contractor_id:{$in:ids}},{account_id:{$in:ids},client_account_id:{$nin:ids}}]})]);
  if(!appointments)return null;
 }
 const project=selected || await base44.entities.Project.get(projectId).catch(e=>[403,404].includes(e.status)?null:Promise.reject(e));
 if(!project)return null;
 const refs=projectRefs;
 const [documents,contracts,proposals,delivery,dmas]=await Promise.all([
  base44.entities.LegalDocument.filter({project_id:{$in:refs},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_pd_br','appointment_architect']}},{limit:40}),
  base44.entities.JCT.filter({project_id:{$in:refs},executed:'yes'},{limit:20}),
  base44.entities.FeeProposal.count({project_id:{$in:refs},is_current:true,status:{$ne:'lost'}}),
  base44.entities.ProjectDelivery.filter({project_id:{$in:refs}},{limit:2}),
  base44.entities.DMA.filter({project_id:{$in:refs},executed:'yes'},{limit:2})
 ]);
 if(documents.has_more||contracts.has_more)throw new Error('Too many signed supplier records to safely attribute the DMA fees.');
 const ids=[...new Set([...documents.items.map(d=>d.account_id),...contracts.items.flatMap(c=>[c.contractor_id,c.account_id])].filter(Boolean))];
 const page=ids.length?await base44.entities.Account.filter({$or:[{id:{$in:ids}},{dataverse_id:{$in:ids}}]},{limit:80,fields:['name','company_name','full_name','dataverse_id','company_number']}):{items:[]};
 if(page.has_more)throw new Error('Supplier attribution exceeds its bounded account page.');
 const linked=[...documents.items,...contracts.items.map(c=>({...c,document_type:'contractor',account_id:dmaContractorAccount(c,page.items)}))];
 if(account&&!linked.some(d=>aliases(account).includes(d.account_id)))return null;
 if(automatic&&!proposals&&projectId===vigoProjectId)await extractVigoDMAFees(base44,await base44.auth.me(),vigoProjectId);
   const saved=projectId===vigoProjectId ? null : await base44.asServiceRole.entities.DMAFeeExtraction.filter({project_id:project.id,status:'ready'},{limit:2});
   const extraction=projectId===vigoProjectId ? await savedVigoDMAFees(base44) : saved.items.length===1 ? saved.items[0] : null;
 const proposalPriority=proposals&&!reviewWithProposal;
 const base={project_id:project.id,project_name:project.name,status:proposalPriority?'proposal_available':extraction?.status||'not_extracted',source_url:extraction?.source_url,source_name:extraction?.source_name,source_etag:extraction?.source_etag,extracted_at:extraction?.extracted_at,note:proposalPriority?'A current Pathway proposal exists; DMA fallback is not used.':extraction?.note||'Signed DMA fees have not yet been read.',rows:[]};
 if(proposalPriority||!extraction||extraction.status!=='ready')return base;
 if(dmas.items.length!==1||dmas.items[0].id!==extraction.dma_id)return {...base,status:'unusable',note:'The executed DMA record changed or is ambiguous; cached fees are not used.'};
 try {
  const reads=await projectSharePointReads(base44),meta=await resolveDMASavedLink(reads,extraction.source_url),live=await reads.graph(`/drives/${meta.parentReference.driveId}/items/${meta.id}?$select=id,eTag`);
  if(live.id!==extraction.source_id||live.eTag!==extraction.source_etag)return {...base,status:'unusable',note:'The signed DMA changed; old extracted fees are not used. An administrator must open the fee evidence to read the current version.'};
 }catch(error){return {...base,status:'unusable',note:'Source freshness could not be confirmed; DMA fees are not used. '+String(error.message).slice(0,200)};}
 const hasContractValue=extraction.rows.some(row=>normalise(row.role)==='contractvalue'&&isDMAContractValue(row));
 const rows=extraction.rows.map(row=>{
  const type=types[normalise(row.role)],hasName=!['','na','none','notapplicable','notspecified','unknown','notprovided','notnamed'].includes(normalise(row.supplier_name));
  let candidates=linked.filter(d=>d.document_type===type);
  if(hasName)candidates=candidates.filter(d=>{const company=page.items.find(a=>aliases(a).includes(d.account_id));return company&&[company.name,company.company_name,company.full_name].some(n=>n&&normalise(n)===normalise(row.supplier_name));});
  // Attribute the exact Contract Value line to one verified project contractor.
  if(type==='contractor'&&isDMAContractValue(row))candidates=dmaContractValueCandidates(row,candidates,page.items);
  else if(type==='contractor'&&!hasName)candidates=[];
  const document=candidates.length===1?candidates[0]:null,company=document?page.items.find(a=>aliases(a).includes(document.account_id)):null;
  let reason=type==='contractor'?'Contractor amounts come from the signed JCT, never DMA Schedule 5.':!type?'Not a clearly attributable supplier fee role.':!document||!company?'Supplier cannot be identified unambiguously from an executed, role-matched appointment / contract.':row.confidence!=='high'||!row.page||!row.quote||!(row.amount>0)?'Fee amount or page evidence is unclear.':'';
  if(!reason&&type==='contractor'&&isHensall(company)&&!isDMAContractValue(row))reason='Hensall contract exposure must use Schedule 5 Contract Value or its accepted Contract Sum replacement, not contractor fees or other totals.';
  if(!reason&&['contractvalue','contractsum'].includes(normalise(row.role))&&!isDMAContractValue(row))reason='The exact cost-plan label is missing from the cited evidence.';
  if(!reason&&normalise(row.role)==='contractsum'&&hasContractValue)reason='Schedule 5 Contract Value takes precedence; Contract Sum is not counted again.';
  if(!reason&&type==='contractor'&&!isDMAContractValue(row)&&extraction.rows.some(isDMAContractValue))reason='The Schedule 5 Contract Value or Contract Sum line takes precedence over other contractor totals.';
  return {...row,vat_basis:'excluding VAT (assumed)',document_type:type,document_id:document?.id,document_reference:document?.document_id,account_id:company?.id,supplier:company?.name||'',match_source:document?`Executed ${document.document_id} (${document.document_type})`:'',reason};
 }).filter(row=>!account||row.account_id===account.id);
 const counts=new Map();
 rows.filter(row=>!row.reason&&row.document_id).forEach(row=>counts.set(row.document_id,(counts.get(row.document_id)||0)+1));
 rows.forEach(row=>{if(!row.reason&&counts.get(row.document_id)>1)row.reason='Multiple cost-plan values match this signed supplier document; no amounts are inferred or counted twice.';});
 const programme=delivery.items.length===1?delivery.items[0]:null;
 return {...base,rows,programme_complete:!!(programme?.contract_start&&(programme?.forecast_pc||programme?.original_pc)),programme_note:programme?.contract_start&&(programme?.forecast_pc||programme?.original_pc)?'Existing programme eligibility rules apply.':'No complete project programme dates are recorded; the full fee is allocated to the current financial year (1 April to 31 March).'};
}
export function dmaTermsForContract(evidence,contract) {
 if(!contract.document_type || contract.document_type==='contractor' || evidence?.status!=='ready')return null;
 const matches=evidence.rows.filter(row=>!row.reason&&(Boolean(contract.id)&&row.document_id===contract.id||Boolean(contract.document_id)&&row.document_type===(contract.document_type||'contractor')&&contract.document_id===row.document_reference));
 if(matches.length!==1||matches[0].reason)return null;
 const row=matches[0];
 return {value:row.amount,source:`Signed ${evidence.project_name || 'project'} DMA Schedule 5, PDF page ${row.page}: ${row.quote}. Supplier identified by ${row.match_source}. OCR-derived fallback; VAT excluded by assumption, not independently verified.`,source_url:evidence.source_url,source_page:row.page,source_etag:evidence.source_etag};
}