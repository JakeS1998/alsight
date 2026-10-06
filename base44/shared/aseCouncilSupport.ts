import {makeSourceFact} from './aseSourceCommon.ts';
const norm=value=>String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
export function councilSupportEvidence(account,code,refresh,support,officialName,now=new Date()) {
  if(account.local_authority_code!==code || !/^E\d{8}$/.test(code) || !officialName) return [];
  const year=now.getUTCFullYear()-(now.getUTCMonth()<3 ? 1 : 0),period=`${year}-${String(year+1).slice(-2)}`;
  const candidates=support.filter(entry=>entry.code===code && entry.exact_match===true && norm(entry.authority_name)===norm(officialName) && entry.financial_year===year && entry.url===`https://www.gov.uk/guidance/exceptional-financial-support-for-local-authorities-for-${period}`);
  if(candidates.length!==1) return [];
  const entry=candidates[0],amounts=[...entry.value.matchAll(/£\s*([\d,]+(?:\.\d+)?)\s*(m|million|bn|billion)\b/gi)],years=entry.value.match(/\b20\d{2}[-/]\d{2,4}\b/g) || [];
  const amount=amounts.length===1 ? Number(amounts[0][1].replaceAll(',',''))*(/^(bn|billion)$/i.test(amounts[0][2]) ? 1e9 : 1e6) : null;
  const dated=Number.isFinite(Date.parse(entry.source_date)) && Date.parse(entry.source_date)<=now.getTime() && Date.parse(entry.source_date)<=Date.parse(refresh.refreshed_at) && now.getTime()-Date.parse(refresh.refreshed_at)>=0 && now.getTime()-Date.parse(refresh.refreshed_at)<=86400000;
  if(!dated || !(amount>0) || years.some(value=>value!==period) || !/support agreed in[ -]principle/i.test(entry.value) || /withdrawn|revoked|cancelled|not agreed|not approved|superseded/i.test(entry.value)) return [];
  return [makeSourceFact(account,'local_authority',code,refresh,`auto-efs-in-principle-${year}`,{component:'efs',title:`Current in-principle Exceptional Financial Support · ${period}`,value:'3',evidence_type:'event',severity:'moderate',confidence:'Low',automatic_eligible:true,source_reference:entry.url,source_date:entry.source_date,notes:`Exact official return-name match ${entry.authority_name}, ONS ${code}. GOV.UK reports ${entry.value} for ${period}. Broader official-evidence rule assigns 3/5 to current support agreed in principle. This is not a final capitalisation direction, confirmed receipt of funds, consecutive-year approval or insolvency. Other components remain independently assessed.`})];
}