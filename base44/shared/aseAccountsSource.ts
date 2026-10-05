import { secrets } from 'base44:runtime';
import { sourceJson,readSourceResponse } from './aseSourceCommon.ts';
import { parseFiledAccounts } from './aseAccountsXml.ts';
import { accountsEvidence } from './aseAccountsEvidence.ts';
const api='https://api.company-information.service.gov.uk',documents='https://document-api.company-information.service.gov.uk';
export async function retrieveAccounts(account,number,refresh) {
  const key=secrets.get('COMPANIES_HOUSE_API_KEY');
  if(!key) throw new Error('Companies House REST API credentials have not been configured.');
  const headers={Authorization:`Basic ${btoa(String(key).trim()+':')}`,Accept:'application/json'};
  const profile=await sourceJson(`${api}/company/${number}`,{headers});
  if(profile.company_number!==number) throw new Error('Companies House account identity did not match.');
  const history=await sourceJson(`${api}/company/${number}/filing-history?category=accounts&items_per_page=100`,{headers});
  const filings=(history.items || []).filter(row=>row.links?.document_metadata && /^\d{4}-\d{2}-\d{2}$/.test(row.date || '') && Date.parse(row.date)<=Date.now()).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  if(!filings.length) throw new Error('No available filed-account documents were found for this company.');
  const warnings=[],retrieved=[],periodMap=new Map();
  for(const filing of filings) {
    try {
      const metadataUrl=new URL(filing.links.document_metadata,documents);
      if(metadataUrl.origin!==documents || !/^\/document\/[A-Za-z0-9_-]+$/.test(metadataUrl.pathname)) throw new Error('Unrecognised document metadata link.');
      const metadata=await sourceJson(metadataUrl.href,{headers}),type=['application/xhtml+xml','application/xml'].find(type=>metadata.resources?.[type]);
      const reference=`https://find-and-update.company-information.service.gov.uk/company/${number}/filing-history/${encodeURIComponent(filing.transaction_id)}`;
      if(!type) {warnings.push(`Accounts filed ${filing.date}: no tagged XML/iXBRL available; PDF requires manual evidence entry.`);retrieved.push({filing_date:filing.date,source_url:reference,metadata,unsupported:true});continue;}
      if(Number(metadata.resources[type].content_length)>750000) throw new Error('Tagged document exceeds the 750 KB per-document limit.');
      let response=await fetch(metadataUrl.href+'/content',{headers:{...headers,Accept:type},redirect:'manual',signal:AbortSignal.timeout(20000)});
      if(response.status===302) {
        const location=new URL(response.headers.get('location') || '',documents);
        const approved=location.origin===documents || /^[a-z0-9.-]+\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(location.hostname);
        if(location.protocol!=='https:' || location.port || location.username || location.password || !approved) throw new Error('Document download redirected outside approved storage.');
        response=await fetch(location.href,{redirect:'manual',signal:AbortSignal.timeout(20000)});
      }
      if(!response.ok) throw new Error(`Document download returned HTTP ${response.status}.`);
      const content=await readSourceResponse(response,750000),parsed=parseFiledAccounts(content.text,number);
      if(!parsed.length) warnings.push(`Accounts filed ${filing.date}: no supported, unambiguous GBP facts matched this entity.`);
      retrieved.push({filing_date:filing.date,source_url:reference,metadata,xml:content.text});
      for(const period of parsed) if(!periodMap.has(period.end)) periodMap.set(period.end,{...period,filed_at:filing.date,source_url:reference});
    } catch(error) {warnings.push(`Accounts filed ${filing.date}: ${error.message}`);}
  }
  const periods=[...periodMap.values()].sort((a,b)=>b.end.localeCompare(a.end)).slice(0,3);
  if(!retrieved.length) throw new Error('No account document could be retrieved. '+warnings.join(' ').slice(0,600));
  const facts=accountsEvidence(account,number,refresh,periods);
  warnings.push('Primary tagged accounts are imported for review, not automatic scoring. Missing disclosures, unsupported taxonomies and dimensional group contexts are excluded. PDF-only filings need manual evidence.');
  if(history.total_count>100) warnings.push('Filing discovery is limited to the latest 100 account filings and three documents.');
  return {facts,raw:{company_number:number,documents:retrieved,periods},summary:{company_number:number,company_name:profile.company_name,documents_retrieved:retrieved.length,financial_periods:periods.map(row=>row.end),normalised_candidates:facts.filter(row=>row.component!=='filed_financials').length,tagged_financials_available:!!facts.length},warnings};
}