import {correctedDocumentLinks} from './documentLinkCorrections.ts';
const normalise=value=>String(value||'').toLowerCase().replace(/\blimited\b/g,'ltd').replace(/[^a-z0-9]/g,'');
export function jctFeeForAccount(row,contract,account) {
 if(!row||row.status!=='extracted'||row.account_id!==account.id||row.linked_url!==contract.link_to_file||!(row.amount>0)||!row.page||!row.quote)return null;
 if(![account.name,account.company_name,account.full_name].filter(Boolean).some(name=>normalise(name)===normalise(row.contractor)))return null;
 return {value:row.amount,extracted_at:row.extracted_at,source:`Signed JCT ${row.source_name}, PDF page ${row.page}: ${row.quote}. Document-extracted contract sum; not independently verified. ${row.vat_basis || 'VAT basis not stated'}.`,source_url:row.source_url,source_page:row.page,source_etag:row.source_etag};
}
export async function jctFeeTerms(base44,contracts,account) {
 const ids=contracts.filter(c=>!c.document_type).map(c=>c.id).filter(Boolean);
 if(!ids.length||!base44.asServiceRole)return new Map();
 contracts=await correctedDocumentLinks(base44.asServiceRole.entities,'JCT',contracts);
 const page=await base44.asServiceRole.entities.JCTFeeExtraction.filter({contract_id:{$in:ids},account_id:account.id},{limit:80,sort:'-extracted_at'});
 if(page.has_more)throw new Error('Too many JCT extraction versions for this contract page.');
 const terms=new Map();
 for(const contract of contracts){const row=page.items.find(r=>r.contract_id===contract.id),fee=jctFeeForAccount(row,contract,account);if(fee)terms.set(contract.id,fee);}
 return terms;
}