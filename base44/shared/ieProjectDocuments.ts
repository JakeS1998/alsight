import {ieError,ieRecord,ieText} from './ieAccess.ts';
export async function ieProjectContext(base44,item){
 if(!item.project_id)return null;
 const page=await base44.asServiceRole.entities.Project.filter({$or:[{id:item.project_id},{dataverse_id:item.project_id}]},{limit:1,fields:['name','project_number','dataverse_id','pq_approval_date','link_to_legals','link_to_project_questionnaire','link_to_riba4_report','link_to_pso','link_to_pcs']});
 return page.items[0]||null;
}
export async function ieProjectDocuments(base44,user,input){
 const item=await ieRecord(base44,user,input.engagement_id),project=await ieProjectContext(base44,item);
 if(!project)ieError('No linked project is available.',403);
 const kinds={legal:'LegalDocument',dma:'DMA',jct:'JCT'},kind=ieText(input.kind,20);
 if(!kinds[kind])ieError('Choose a project document type.');
 // Engagement access authorises only this linked project's read-only document metadata.
 const page=await base44.asServiceRole.entities[kinds[kind]].filter({project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)},status:{$ne:'inactive'}},{sort:'-created_date',limit:30,fields:['document_id','document_type','executed','date_of_execution','drafted_date','drafting_due_date','approval_status','approval_date','approval_comments','approvers_name','sent_to_client','sent_for_signing','signing_target_date','pso_signoff','contract_particulars','link_to_file','comments','updated_date','account_id','contractor_id','is_bsm_document_owner','fee_proposal_date','link_to_client_proposal','link_to_fee_proposal','dma_version','shared_with_council','form_of_jct','shared_with_contractor','loi_expiry_date','loi_expiry_scan','practical_completion','variation_comments','payment_terms','payment_comments','lads','lad_comments','pcg_bond','pcg_comments','retention','retention_comments','framework_support_fee','fsf_comments','pi_limit','pi_comments','schedule2','sch2_comments','equipment','equip_comments','structural_insurance','si_comments','risk_register','rr_comments','cp_comments','cps','cps_comments','ers','er_comments','pci','pci_comments','prelims','prelim_comments','soa','soa_comments','rr','valuation_schedule'],...(input.cursor?{cursor:ieText(input.cursor,4000)}:{})});
 const db=base44.asServiceRole.entities,accountIds=[...new Set(page.items.flatMap(doc=>[doc.account_id,doc.contractor_id].filter(Boolean)))];
 const [accounts,delivery]=await Promise.all([
  accountIds.length?db.Account.filter({$or:[{id:{$in:accountIds}},{dataverse_id:{$in:accountIds}}]},{limit:120,fields:['name','dataverse_id']}):{items:[]},
  kind==='legal'&&!input.cursor?db.ProjectDelivery.filter({project_id:{$in:[project.id,project.dataverse_id].filter(Boolean)}},{sort:'-created_date',limit:1,fields:['pso_pq_date','pso_aa_date','pso_aa_variations_date','pso_dma_date']}):{items:[]}
 ]);
 const accountMap={};for(const account of accounts.items)for(const id of [account.id,account.dataverse_id].filter(Boolean))accountMap[id]={name:account.name};
 const d=delivery.items[0];
 return {...page,accountMap,...(kind==='legal'&&!input.cursor?{psoChecks:{pq:!!d?.pso_pq_date,aa:!!d?.pso_aa_date,aa_variations:!!d?.pso_aa_variations_date,dma:!!d?.pso_dma_date}}:{})};
 }