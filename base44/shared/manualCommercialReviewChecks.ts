import {reviewCommercialTerms} from './aseCommercialTerms.ts';
export async function checkManualCommercialReviewRules() {
 const account={id:'review-account',account_type:'supplier'},contract={id:'review-contract',document_id:'JCT-review',project_id:'review-project',executed:'yes'};
 let saved;
 const base44={entities:{JCT:{filter:async()=>({items:[contract]}),count:async()=>0,update:async(id,data)=>{saved={id,...data};}},Project:{filter:async()=>({items:[]})}}};
 const input={contractId:contract.id,value:123456.78,reference:'signed-review-reference',confirmed:true,dateBasis:'project_programme'};
 await reviewCommercialTerms(base44,account,input,{id:'review-admin',role:'admin'});
 const assumed={...saved};
 await reviewCommercialTerms(base44,account,{...input,dateBasis:'contract_dates',start:'2026-04-01',end:'2027-03-31'},{id:'review-admin',role:'admin'});
 let duplicateBlocked=false;
 base44.entities.JCT.count=async()=>1;
 try {await reviewCommercialTerms(base44,account,input,{id:'review-admin',role:'admin'});}catch(error){duplicateBlocked=error.message.includes('already included');}
 return {manualReviewSavesFullAmount:assumed.commercial_value===input.value,manualReviewIncludesMissingProgramme:assumed.commercial_reviewed===true&&assumed.commercial_date_basis==='current_financial_year',manualReviewKeepsAudit:assumed.commercial_reviewed_by==='review-admin'&&!!assumed.commercial_reviewed_at,manualReviewKeepsConfirmedDates:saved.commercial_date_basis==='contract_dates'&&saved.commercial_start==='2026-04-01',manualReviewBlocksDuplicates:duplicateBlocked};
}