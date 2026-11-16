import {contractProjectTerms} from './aseContractProjectTerms.ts';
import {contractorDMAFallbackNeeded} from './contractorDMAFallbackNeeded.ts';
import {dmaTermsForContract} from './vigoDMAAttribution.ts';
import {syncCommercialInputs} from './aseCommercialInputs.ts';
export async function checkContractorDMAPriority() {
 const project={id:'6ac7b8e21d5610a3a3c8f502',name:'Priority fixture'},account={id:'contractor-fixture',name:'Fixture Contractor Ltd',company_number:'05335916'};
 const contract={id:'jct-fixture',project_id:project.id,contractor_id:account.id,document_id:'JCT-fixture',link_to_file:'https://allianceleisureservice.sharepoint.com/fixture.pdf'};
 const evidence={status:'ready',project_id:project.id,rows:[{document_id:contract.id,amount:500,page:35,quote:'Contract Sum 500',match_source:'Executed JCT-fixture',reason:''}]};
 const run=async ({proposal=true,jct=true,company=account.name,reviewed=false}={})=>{
  let derived;
  const record={...contract,...(reviewed?{commercial_reviewed:true,commercial_value:300,commercial_reference:contract.document_id,commercial_reviewed_at:'2026-11-17T00:00:00Z'}:{})};
  const db={Project:{filter:async()=>({items:[project]})},
   ProjectDelivery:{filter:async()=>({items:[{id:'delivery-fixture',project_id:project.id,delivery_team:JSON.stringify([{role:'Contractor',supplier_company_number:account.company_number,fees:{riba_1:100}}])}]})},
   FeeProposal:{filter:async()=>({items:proposal?[{id:'proposal-fixture',project_id:project.id,status:'accepted'}]:[]}),count:async()=>proposal?1:0},
   LegalDocument:{count:async()=>0},
   JCT:{filter:async()=>({items:[record]}),bulkUpdate:async rows=>{derived=rows[0];}},
   JCTFeeExtraction:{filter:async()=>({items:jct?[{contract_id:contract.id,account_id:account.id,linked_url:contract.link_to_file,status:'extracted',amount:200,contractor:company,page:5,quote:'Contract Sum 200',extracted_at:'2026-11-16T00:00:00Z'}]:[]})}};
  const client={entities:db,asServiceRole:{entities:db}};
  const [terms]=await contractProjectTerms(client,[record],account,evidence);
  await syncCommercialInputs(client,account,evidence,'2026-11-16');
  return {terms,derived,needsDMA:await contractorDMAFallbackNeeded(client,project)};
 };
 const [signed,missing,noProposal,wrongCompany,reviewed]=await Promise.all([run(),run({jct:false}),run({proposal:false}),run({company:'Other Contractor Ltd'}),run({reviewed:true})]);
 return {contractorSignedJCTPriority:signed.derived.commercial_effective_value===200&&signed.derived.commercial_effective_mode==='signed_jct_pdf',contractorNoDMAFallback:!signed.terms.dma_terms&&!signed.needsDMA&&dmaTermsForContract(evidence,contract)===null,contractorNoProposalSubstitution:missing.derived.commercial_effective_value===0&&!missing.terms.pathway_terms,contractorJCTWithoutProposal:noProposal.derived.commercial_effective_value===200&&!noProposal.needsDMA,contractorWrongJCTCompanyExcluded:wrongCompany.derived.commercial_effective_value===0,contractorLaterManualJCTReview:reviewed.derived.commercial_effective_value===300&&reviewed.derived.commercial_effective_mode==='reviewed'};
}