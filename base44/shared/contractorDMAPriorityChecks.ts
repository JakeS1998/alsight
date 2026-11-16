import {contractProjectTerms} from './aseContractProjectTerms.ts';
import {contractorDMAFallbackNeeded} from './contractorDMAFallbackNeeded.ts';
export async function checkContractorDMAPriority() {
 const project={id:'6ac7b8e21d5610a3a3c8f502',name:'Priority fixture'},account={id:'contractor-fixture',company_number:'05335916'};
 const contract={id:'jct-fixture',project_id:project.id,contractor_id:account.id,document_id:'JCT-fixture'};
 const evidence={status:'ready',project_id:project.id,rows:[{document_id:contract.id,amount:500,page:35,quote:'Contract Sum 500',match_source:'Executed JCT-fixture',reason:''}]};
 const run=async ({amount=100,company=account.company_number,proposal=true,source=evidence}={})=>{
  const db={
   Project:{filter:async()=>({items:[project]})},
   ProjectDelivery:{filter:async()=>({items:[{id:'delivery-fixture',project_id:project.id,delivery_team:JSON.stringify([{role:'Contractor',supplier_company_number:company,fees:{riba_1:amount},contractor_ohp:{riba_1:{type:'percentage',value:10}}}])}]})},
   FeeProposal:{filter:async()=>({items:proposal?[{id:'proposal-fixture',project_id:project.id,revision_number:1,status:'accepted'}]:[]})},
   JCT:{filter:async()=>({items:[contract]})},Account:{filter:async()=>({items:[account]})},
   DMAFeeExtraction:{filter:async()=>({items:[{project_id:project.id}]})}
  };
  const client={entities:db,asServiceRole:{entities:db},auth:{me:async()=>({id:'fixture-user',role:'admin'})}};
  const [terms]=await contractProjectTerms(client,[contract],account,source);
  return {terms,needsDMA:await contractorDMAFallbackNeeded(client,project)};
 };
 const [builder,empty,unmatched,missing,unclear]=await Promise.all([run(),run({amount:0}),run({company:'00000001'}),run({proposal:false}),run({amount:0,source:{...evidence,rows:[{...evidence.rows[0],reason:'Ambiguous contractor'}]}})]);
 return {
  contractorBuilderPriority:builder.terms.pathway_terms?.value===110&&!builder.terms.dma_terms&&!builder.needsDMA,
  contractorEmptyBuilderDMAFallback:!empty.terms.pathway_terms&&empty.terms.dma_terms?.value===500&&empty.needsDMA,
  contractorUnmatchedBuilderDMAFallback:!unmatched.terms.pathway_terms&&unmatched.terms.dma_terms?.value===500&&unmatched.needsDMA,
  contractorNoProposalDMAFallback:missing.terms.dma_terms?.value===500&&missing.needsDMA,
  contractorAmbiguousDMAExcluded:!unclear.terms.pathway_terms&&!unclear.terms.dma_terms
 };
}