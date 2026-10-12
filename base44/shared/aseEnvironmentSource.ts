import {sourceJson,makeSourceFact} from './aseSourceCommon.ts';
import {environmentSearchName,environmentMatch,environmentReference} from './aseEnvironmentIdentity.ts';
const root='https://environment.data.gov.uk/public-register';
export async function environmentRegister(account,carrier=false) {
 const name=environmentSearchName(account),register=carrier ? 'waste-carriers-brokers' : 'enforcement-action';
 const url=new URL(`${root}/${register}/registration.json`);url.searchParams.set('name-search',name);url.searchParams.set('_limit','40');url.searchParams.set('_offset','0');
 const response=await sourceJson(url.href,{headers:{Accept:'application/json'}});
 if(!Array.isArray(response.items) || response.meta?.publisher!=='Environment Agency')throw new Error('Environment Agency returned an unexpected response; no result inferred.');
 const limit=Number(response.meta.limit);if(!Number.isFinite(limit) || limit<1 || limit>40 || response.items.length>40)throw new Error('Environment Agency search limit was not confirmed.');
 return {url:url.href,items:response.items,complete:response.items.length<limit,checked_at:new Date().toISOString()};
}
export async function retrieveEnvironmentAgency(account,identifier,refresh) {
 const result=await environmentRegister(account),warnings=['England only. Published actions may be historical; no current breach, resolution, UK-wide clearance or ESG score is inferred. Name/address matches require identity review. Enforcement data: Environment Agency, Open Government Licence v3.'];
 const records=result.items.slice(0,39).map(item=>({reference:environmentReference(item['@id']),name:String(item.offender?.name || 'Name unavailable').slice(0,200),date:typeof item.actionDate==='string' ? item.actionDate.slice(0,10) : '',type:String(item.offence?.actionType?.prefLabel || 'Enforcement action').slice(0,100),legislation:String(item.offence?.legislationTitle || '').slice(0,250),matching_status:environmentMatch(account,item)})).filter(row=>row.reference);
 const complete=result.complete && result.items.length<=39 && records.length===result.items.length;
 if(!complete)warnings.push('Search is limited or a record lacked a safe source reference; results are incomplete, never a clearance.');
 const facts=[makeSourceFact(account,'environment_agency',identifier,refresh,'search',{component:'environment_agency',title:'Environment Agency enforcement search',value:`${records.length} published candidate records`,source_reference:result.url,notes:`${complete ? 'Bounded search completed' : 'Incomplete bounded search'}. No matches does not establish environmental clearance. ${warnings[0]}`}),...records.map((row,index)=>makeSourceFact(account,'environment_agency',identifier,refresh,`action-${index}`,{component:'environment_agency',title:`${row.type}: ${row.name}`,value:row.date || 'Action date unavailable',source_reference:row.reference,notes:`${row.matching_status}. Published action date: ${row.date || 'unknown'}. ${row.legislation}. Historical record, not proof of a current breach.`,confidence:'Low'}))];
 return {facts,raw:{search:result.url,complete,items:result.items},summary:{complete,candidate_count:records.length,records,coverage:'England',search_name:environmentSearchName(account),licence:'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'},warnings};
}
export async function liveEnvironmentRegistrations(account) {
 const result=await environmentRegister(account,true);
 return {checked_at:result.checked_at,complete:result.complete,source_reference:result.url,records:result.items.map(item=>({reference:environmentReference(item['@id']),name:String(item.holder?.name || 'Name unavailable').slice(0,200),registration:String(item.registrationNumber || '').slice(0,100),tier:String(item.tier?.label || 'Not stated'),expiry:typeof item.expiryDate==='string' ? item.expiryDate.slice(0,10) : '',matching_status:environmentMatch(account,item,true)})).filter(row=>row.reference),note:'Live England waste-carrier, broker and dealer register. Exact company-number matches confirm identity only; expiry is not a full compliance check. No match does not prove a registration is required or absent. Records are displayed for internal use only and are not saved in ASE history or source snapshots. Environment Agency Conditional Licence applies.'};
}