import {corporatePSCClient} from './aseCorporatePSCSource.ts';
import {normaliseCompanyNumber,publicOrigin} from './companiesHouseData.ts';
export const exactCompanyName=value=>String(value || '').trim().replace(/\s+/g,' ').toUpperCase();
export async function findExactCompanyName(account) {
  const name=exactCompanyName(account.name);
  if(!name || name.length>200) return {outcome:'skipped',note:'Company name is missing or exceeds the search limit.'};
  const client=await corporatePSCClient(),matches=new Map();let complete=false;
  for(let start=0;start<500;start+=100) {
    const page=await client.get(`/search/companies?q=${encodeURIComponent(account.name.trim())}&items_per_page=100&start_index=${start}`);
    if(!Array.isArray(page.items)) throw new Error('Companies House name search was unavailable.');
    for(const item of page.items) if(exactCompanyName(item.title)===name) matches.set(normaliseCompanyNumber(item.company_number),item);
    if(page.items.length<100 || start+page.items.length>=page.total_results) {complete=true;break;}
  }
  if(!complete || matches.size>1) return {outcome:'ambiguous',note:!complete ? 'Search exceeds 500 results; uniqueness could not be established. No number saved.' : 'Multiple company numbers share this exact name. No number saved.'};
  if(!matches.size) return {outcome:'no_match',note:'No exact registered-name match. Similar names, previous names and Ltd/Limited substitutions were not used.'};
  const number=[...matches.keys()][0],profile=await client.profile(number);
  if(exactCompanyName(profile.company_name)!==name) return {outcome:'no_match',note:'Current registered name did not exactly match the profile name.'};
  return {outcome:'matched',company_number:number,registered_name:profile.company_name,company_status:profile.company_status,source_reference:`${publicOrigin}/company/${number}`,note:'Unique exact current registered-name match, ignoring only case and repeated whitespace; registry profile and number verified.'};
}