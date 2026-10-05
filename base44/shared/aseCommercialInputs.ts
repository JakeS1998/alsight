import {contractQuery,annualiseTerms} from './aseCommercialTerms.ts';
import {contractProjectTerms} from './aseContractProjectTerms.ts';
export async function syncCommercialInputs(base44,account) {
  let cursor;const ids=[];
  for(let batch=0;batch<10;batch++) {
    const page=await base44.entities.JCT.filter(contractQuery(account),{limit:20,sort:'document_id',...(cursor ? {cursor} : {})});
    const linked=await contractProjectTerms(base44,page.items,account),updates=[];
    for(const row of linked) {
      ids.push(row.id);
      let input={commercial_effective_value:0,commercial_effective_annual_value:0,commercial_effective_start:'',commercial_effective_end:'',commercial_effective_reference:'',commercial_effective_date_basis:'',commercial_effective_mode:'unavailable',commercial_effective_source:{}};
      const reviewed=row.commercial_reviewed===true;
      const value=reviewed ? row.commercial_value : row.pathway_terms?.value;
      const start=reviewed ? row.commercial_start : row.recorded_terms?.start,end=reviewed ? row.commercial_end : row.recorded_terms?.end;
      if(value>0 && start && end) {
        const days=(Date.parse(end)-Date.parse(start))/86400000+1;
        if(Number.isFinite(days) && days>=2 && days<=36525 && /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) && new Date(start).toISOString().slice(0,10)===start && new Date(end).toISOString().slice(0,10)===end) {
          const reference=reviewed ? row.commercial_reference : `pathway:${row.project_record_id}:${account.company_number}`;
          if(reference) input={commercial_effective_value:value,commercial_effective_annual_value:annualiseTerms(value,start,end).annual_value,commercial_effective_start:start,commercial_effective_end:end,commercial_effective_reference:reference,commercial_effective_date_basis:reviewed ? row.commercial_date_basis || 'contract_dates' : 'project_programme',commercial_effective_mode:reviewed ? 'reviewed' : 'pathway_proposal',commercial_effective_source:{project_name:row.project_name,project_id:row.project_record_id,date_source:reviewed ? row.commercial_date_source : row.recorded_terms.date_source,programme_record_id:reviewed ? row.commercial_programme_record_id : row.recorded_terms.programme_record_id,...(!reviewed ? row.pathway_terms : {source:'Reviewed signed contract terms',reviewed_at:row.commercial_reviewed_at})}};
        }
      }
      if(Object.entries(input).some(([key,value])=>JSON.stringify(row[key])!==JSON.stringify(value))) updates.push({id:row.id,...input});
    }
    // Only derived columns of already-accessible signed contracts are written, never reviewed terms.
    if(updates.length) await base44.asServiceRole.entities.JCT.bulkUpdate(updates);
    if(!page.has_more) return ids;
    cursor=page.next_cursor;
  }
  throw new Error('Commercial synchronisation exceeds 200 signed contracts; no partial concentration is reported.');
}