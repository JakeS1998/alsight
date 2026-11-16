import {readJCTContractorFee} from './jctContractorFeeRead.ts';
import {correctedDocumentLinks} from './documentLinkCorrections.ts';
import {jctFeeForAccount} from './jctFeeTerms.ts';
export async function saveJCTFeeExtraction(base44,contract) {
 [contract]=await correctedDocumentLinks(base44.asServiceRole.entities,'JCT',[contract]);
 const refs=[contract.contractor_id,contract.account_id!==contract.client_account_id?contract.account_id:null].filter(Boolean);
 const accounts=refs.length ? await base44.entities.Account.filter({$or:[{id:{$in:refs}},{dataverse_id:{$in:refs}}]},{limit:2}) : {items:[]};
   const account=accounts.items.length===1?accounts.items[0]:null,result=await readJCTContractorFee(base44,contract);
 const data={contract_id:contract.id,account_id:account?.id || '',linked_url:contract.link_to_file,source_url:result.source_url,source_name:result.source_name,source_etag:result.source_etag,status:result.status,amount:result.amount,contractor:result.contractor,vat_basis:result.vat_basis,page:result.page,quote:result.quote.slice(0,2000),note:result.note.slice(0,2000),extracted_at:new Date().toISOString()};
 if(!account || !jctFeeForAccount(data,contract,account)){data.status='unusable';data.amount=null;data.note=[data.note,!account ? 'The signed JCT was read, but the contractor account link is missing or ambiguous; the quoted amount is excluded until that link is reviewed.' : 'The amount or contractor identity could not be safely matched to this JCT account.'].join(' ').slice(0,2000);}
 const prior=await base44.entities.JCTFeeExtraction.filter({contract_id:contract.id},{limit:1,sort:'-created_date'});
 const saved=prior.items[0]?await base44.entities.JCTFeeExtraction.update(prior.items[0].id,data):await base44.entities.JCTFeeExtraction.create(data);
 return {...result,...data,id:saved.id,saved:true};
}