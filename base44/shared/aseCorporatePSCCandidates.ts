import {secrets} from 'base44:runtime';
import {readSourceResponse} from './aseSourceCommon.ts';
import {normaliseCompanyNumber} from './companiesHouseData.ts';
export async function pscCandidates(client,company,warnings) {
  const candidates=new Set(),stem=String(company.name).split(/\s+/)[0];
  const add=value=>{try {candidates.add(normaliseCompanyNumber(value));} catch {}};
  try {
    const page=await client.get('/search/companies?'+new URLSearchParams({q:stem,items_per_page:'25',start_index:'0'}));
    for(const row of page.items || []) if(row.company_status!=='dissolved') add(row.company_number);
    if(page.total_results>25) warnings.push(`Discovery for ${company.name} is limited to 25 name-search candidates.`);
  } catch {warnings.push(`Name-based discovery unavailable for ${company.name}; no relationship was inferred.`);}
  const key=await secrets.get('SERPAPI_API_KEY');
  if(key) try {
    const params=new URLSearchParams({engine:'google',q:`site:find-and-update.company-information.service.gov.uk/company/ "${company.name}" "significant control"`,num:'20',api_key:key,gl:'uk',hl:'en'});
    const response=await fetch('https://serpapi.com/search.json?'+params,{redirect:'manual',signal:AbortSignal.timeout(12000)}),stored=await readSourceResponse(response,1000000);
    if(!response.ok) throw new Error('Discovery unavailable');const result=JSON.parse(stored.text);if(result.error) throw new Error('Discovery unavailable');
    for(const row of result.organic_results || []) {const match=String(row.link || '').match(/^https:\/\/find-and-update\.company-information\.service\.gov\.uk\/company\/([A-Z0-9]{8})(?:\/|$)/);if(match)add(match[1]);}
  } catch {warnings.push(`Indexed PSC discovery unavailable for ${company.name}; only register-checked name candidates are shown.`);}
  candidates.delete(company.number);return [...candidates].slice(0,35);
}