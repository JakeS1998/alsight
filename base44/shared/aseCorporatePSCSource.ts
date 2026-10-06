import {secrets} from 'base44:runtime';
import {sourceJson} from './aseSourceCommon.ts';
import {normaliseCompanyNumber,publicOrigin} from './companiesHouseData.ts';
export const pscReference=number=>`${publicOrigin}/company/${number}/persons-with-significant-control`;
export function corporatePSC(row) {
  if(row.ceased_on || row.kind!=='corporate-entity-person-with-significant-control') return null;
  const identity=row.identification || {},country=String(identity.country_registered || identity.place_registered || '').toLowerCase();
  if(country && !/^(uk|u\.k\.|united kingdom|great britain|england|wales|scotland|northern ireland|companies house)/.test(country)) return null;
  let number;try {number=normaliseCompanyNumber(identity.registration_number);} catch {return null;}
  const controls=Array.isArray(row.natures_of_control) ? row.natures_of_control : [];
  const majority=controls.some(value=>/^(ownership-of-shares|voting-rights)-(50-to-75|75-to-100)-percent$/.test(value));
  return {number,name:row.name,controls,majority,notified_on:row.notified_on};
}
export async function corporatePSCClient() {
  const key=await secrets.get('COMPANIES_HOUSE_API_KEY');if(!key) throw new Error('Companies House access is not configured.');
  let calls=0;const profiles=new Map(),registers=new Map();
  const get=async path=>{if(++calls>90) throw new Error('Corporate structure lookup limit reached.');return sourceJson('https://api.company-information.service.gov.uk'+path,{headers:{Authorization:'Basic '+btoa(String(key).trim()+':'),Accept:'application/json'}});};
  const profile=number=>{if(!profiles.has(number)) profiles.set(number,get('/company/'+number).then(row=>{if(normaliseCompanyNumber(row.company_number)!==number) throw new Error('Companies House identifier mismatch.');return row;}));return profiles.get(number);};
  const psc=number=>{if(!registers.has(number)) registers.set(number,(async()=>{const items=[];for(let start=0;start<200;start+=100){const page=await get(`/company/${number}/persons-with-significant-control?items_per_page=100&start_index=${start}`);if(!Array.isArray(page.items)) throw new Error('PSC register unavailable.');items.push(...page.items);if(page.items.length<100 || items.length>=page.total_results)return {items:items.filter(row=>!row.ceased_on),complete:true};}return {items:items.filter(row=>!row.ceased_on),complete:false};})());return registers.get(number);};
  return {get,profile,psc};
}