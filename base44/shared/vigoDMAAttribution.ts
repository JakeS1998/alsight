import {vigoProjectId,vigoProjectRef,savedVigoDMAFees,extractVigoDMAFees} from './vigoDMAFees.ts';
import {projectSharePointReads} from './projectSharePointReads.ts';
const normalise=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const types={principaldesignercdmfee:'appointment_pd_cdm',principaldesignercdm:'appointment_pd_cdm',principaldesignerbuildingregsfee:'appointment_pd_br',principaldesignerbuildingregulationsfee:'appointment_pd_br',projectmanagerfee:'appointment_pm',architectfee:'appointment_architect',contractorfee:'contractor',contractsum:'contractor'};
const aliases=account=>[account.id,account.dataverse_id].filter(Boolean);
export async function readVigoDMAEvidence(base44,account,automatic=false) {
 if(account) {
  const refs=[vigoProjectId,vigoProjectRef],ids=aliases(account);
  const [appointments,contracts]=await Promise.all([base44.entities.LegalDocument.count({project_id:{$in:refs},account_id:{$in:ids},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_pd_br','appointment_architect']}}),base44.entities.JCT.count({project_id:{$in:refs},executed:'yes',$or:[{contractor_id:{$in:ids}},{account_id:{$in:ids},client_account_id:{$nin:ids}}]})]);
  if(!appointments&&!contracts)return null;
 }
 const project=await base44.entities.Project.get(vigoProjectId).catch(e=>[403,404].includes(e.status)?null:Promise.reject(e));
 if(!project)return null;
 const refs=[vigoProjectId,vigoProjectRef];
 const [documents,contracts,proposals,delivery,dmas]=await Promise.all([
  base44.entities.LegalDocument.filter({project_id:{$in:refs},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_pd_br','appointment_architect']}},{limit:40}),
  base44.entities.JCT.filter({project_id:{$in:refs},executed:'yes'},{limit:20}),
  base44.entities.FeeProposal.count({project_id:{$in:refs},is_current:true,status:{$ne:'lost'}}),
  base44.entities.ProjectDelivery.filter({project_id:{$in:refs}},{limit:2}),
  base44.entities.DMA.filter({project_id:{$in:refs},executed:'yes'},{limit:2})
 ]);
 if(documents.has_more||contracts.has_more)throw new Error('Too many signed supplier records to safely attribute the DMA fees.');
 const linked=[...documents.items,...contracts.items.map(c=>({...c,document_type:'contractor',account_id:c.contractor_id||c.account_id}))];
 if(account&&!linked.some(d=>aliases(account).includes(d.account_id)))return null;
 if(automatic&&!proposals)await extractVigoDMAFees(base44,await base44.auth.me(),vigoProjectId);
 const extraction=await savedVigoDMAFees(base44);
 const base={project_id:project.id,project_name:project.name,status:proposals?'proposal_available':extraction?.status||'not_extracted',source_url:extraction?.source_url,source_name:extraction?.source_name,source_etag:extraction?.source_etag,extracted_at:extraction?.extracted_at,note:proposals?'A current Pathway proposal exists; DMA fallback is not used.':extraction?.note||'Signed DMA fees have not yet been read.',rows:[]};
 if(proposals||!extraction||extraction.status!=='ready')return base;
 if(dmas.items.length!==1||dmas.items[0].id!==extraction.dma_id)return {...base,status:'unusable',note:'The executed DMA record changed or is ambiguous; cached fees are not used.'};
 try {
  const reads=await projectSharePointReads(base44),meta=await reads.resolve(extraction.source_url),live=await reads.graph(`/drives/${meta.parentReference.driveId}/items/${meta.id}?$select=id,eTag`);
  if(live.id!==extraction.source_id||live.eTag!==extraction.source_etag)return {...base,status:'unusable',note:'The signed DMA changed; old extracted fees are not used. An administrator must open the fee evidence to read the current version.'};
 }catch(error){return {...base,status:'unusable',note:'Source freshness could not be confirmed; DMA fees are not used. '+String(error.message).slice(0,200)};}
 const ids=[...new Set(linked.map(d=>d.account_id).filter(Boolean))];
 const page=ids.length?await base44.entities.Account.filter({$or:[{id:{$in:ids}},{dataverse_id:{$in:ids}}]},{limit:80,fields:['name','company_name','full_name','dataverse_id','company_number']}):{items:[]};
 if(page.has_more)throw new Error('Supplier attribution exceeds its bounded account page.');
 const rows=extraction.rows.map(row=>{
  const type=types[normalise(row.role)],hasName=!['','notspecified','unknown','notprovided'].includes(normalise(row.supplier_name));
  let candidates=linked.filter(d=>d.document_type===type);
  if(hasName)candidates=candidates.filter(d=>{const company=page.items.find(a=>aliases(a).includes(d.account_id));return company&&[company.name,company.company_name,company.full_name].some(n=>n&&normalise(n)===normalise(row.supplier_name));});
  // A role-only professional fee can use one unambiguous executed appointment, never a generic build budget.
  if(type==='contractor'&&!hasName)candidates=[];
  const document=candidates.length===1?candidates[0]:null,company=document?page.items.find(a=>aliases(a).includes(document.account_id)):null;
  let reason=!type?'Not a clearly attributable supplier fee role.':!document||!company?'Supplier cannot be identified unambiguously from an executed, role-matched appointment / contract.':row.confidence!=='high'||!row.page||!row.quote||!(row.amount>0)?'Fee amount or page evidence is unclear.':'';
  if(!reason&&extraction.rows.filter(r=>types[normalise(r.role)]===type).length!==1)reason='Multiple fee rows for this role need clarification; no amounts are inferred or added twice.';
  return {...row,vat_basis:'excluding VAT (assumed)',document_type:type,document_id:document?.id,document_reference:document?.document_id,account_id:company?.id,supplier:company?.name||'',match_source:document?`Executed ${document.document_id} (${document.document_type})`:'',reason};
 }).filter(row=>!account||row.account_id===account.id);
 const programme=delivery.items.length===1?delivery.items[0]:null;
 return {...base,rows,programme_complete:!!(programme?.contract_start&&(programme?.forecast_pc||programme?.original_pc)),programme_note:programme?.contract_start&&(programme?.forecast_pc||programme?.original_pc)?'Existing programme eligibility rules apply.':'No complete project programme dates are recorded; the full fee is allocated to the current financial year (1 April to 31 March).'};
}
export function dmaTermsForContract(evidence,contract) {
 if(evidence?.status!=='ready')return null;
 const matches=evidence.rows.filter(row=>Boolean(contract.id)&&row.document_id===contract.id||Boolean(contract.document_id)&&row.document_type===(contract.document_type||'contractor')&&contract.document_id===row.document_reference);
 if(matches.length!==1||matches[0].reason)return null;
 const row=matches[0];
 return {value:row.amount,source:`Signed Vigo Road DMA Schedule 5, PDF page ${row.page}: ${row.quote}. Supplier identified by ${row.match_source}. OCR-derived fallback; VAT excluded by assumption, not independently verified.`,source_url:evidence.source_url,source_page:row.page,source_etag:evidence.source_etag};
}