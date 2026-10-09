export const approvalTables = {documents:'Legal documents',dma:'Development agreements (DMA)',warranties:'Warranties'};
export const approvalRelatedRules = {
 project_bsm:{label:'Linked project BSM',field:'bsm_aad_id',kind:'staff'},
 project_bdm:{label:'Linked project BDM',field:'bdm_aad_id',kind:'staff'},
 project_director:{label:'Linked project director',field:'director_aad_id',kind:'staff'},
 document_bsm:{label:'Document BSM',field:'bsm_aad_id',kind:'staff',document:true},
 project_manager:{label:'Linked project manager contact',field:'project_manager_id',kind:'contact'},
 client_rep:{label:'Linked client representative',field:'client_rep_id',kind:'contact'},
 client_rep2:{label:'Linked second client representative',field:'client_rep2_id',kind:'contact'},
 contractor_contact:{label:'Linked contractor contact',field:'contractor_contact_id',kind:'contact'}
};
export const liveApproverRoles = ['admin','director','regional_director','bsm','bdm','finance'];
export async function loadApprovalRouting(base44,table) {
 if(!approvalTables[table])throw new Error('Choose an approval-enabled document table.');
 const page=await base44.asServiceRole.entities.ApprovalRouting.filter({table},{limit:2});
 if(page.items.length>1)throw new Error('Duplicate approval routing rules need administrator attention.');
 return page.items[0] || {table,named_emails:['jake@allianceleisure.co.uk'],related_rules:[],enabled:true,inherited:true};
}