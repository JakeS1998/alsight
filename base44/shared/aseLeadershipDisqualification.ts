import {compareLeadershipIdentity,leadershipAudit} from './aseLeadershipIdentity.ts';
export async function screenDirectorDisqualification(subject,ch) {
  const result=await ch.list('/search/disqualified-officers?q='+encodeURIComponent(subject.name),100);
  if(!result.complete) throw new Error('Disqualified-officer search was truncated; no clearance inferred.');
  const candidates=[];
  for(const item of result.items) {
    const path=item.links?.self;if(!/^\/disqualified-officers\/(natural|corporate)\/[A-Za-z0-9_-]+$/.test(path || '')) throw new Error('Disqualification record link not recognised.');
    if(candidates.length>=12) throw new Error('Too many possible disqualification identities; human review required.');
    const detail=await ch.get(path),birth=String(detail.date_of_birth || '').split('-'),name=detail.name || [detail.forename,detail.other_forenames,detail.surname].filter(Boolean).join(' '),address=detail.disqualifications?.find(d=>d.address?.postal_code)?.address || {};
    const match=compareLeadershipIdentity(subject,{name,registration_number:detail.company_number,registration_country:detail.country_of_registration,birth_year:Number(birth[0]) || null,birth_month:Number(birth[1]) || null,postcode:address.postal_code,person_number:detail.person_number});
    if(match.status==='NO MATCH') continue;
    const periods=(detail.disqualifications || []).map(d=>({start:d.disqualified_from,end:d.disqualified_until,case_reference:d.case_identifier})),today=new Date().toISOString().slice(0,10),permission=(detail.permissions_to_act || []).some(p=>!p.expires_on || p.expires_on>=today);
    const active=periods.some(d=>d.start && d.end && d.start<=today && d.end>=today),historic=periods.length>0 && periods.every(d=>d.end && d.end<today),state=match.status!=='CONFIRMED MATCH' ? 'POTENTIAL MATCH' : permission ? 'MANUAL REVIEW' : active ? 'ADVERSE' : historic ? 'HISTORIC' : 'MANUAL REVIEW';
    candidates.push({evidence_key:'disqualification:'+path,match_status:state,matching_confidence:match.confidence,matching_basis:match.basis,evidence_reference:'https://api.company-information.service.gov.uk'+path,periods,permission_review:permission});
  }
  const state=candidates.some(c=>c.match_status==='ADVERSE') ? 'ADVERSE' : candidates.some(c=>['POTENTIAL MATCH','MANUAL REVIEW'].includes(c.match_status)) ? 'MANUAL REVIEW' : candidates.some(c=>c.match_status==='HISTORIC') ? 'HISTORIC' : 'CLEAR';
  return leadershipAudit(subject,'disqualification',state,state==='CLEAR' ? 'Completed Companies House disqualified-officer search: no current relevant disqualification identified within this dated search.' : 'Companies House disqualification evidence requires identity, operative dates and any permission-to-act to be considered.',{matching_confidence:state==='CLEAR' || ['ADVERSE','HISTORIC'].includes(state) ? 'High' : 'Low',evidence_reference:'https://api.company-information.service.gov.uk/search/disqualified-officers?q='+encodeURIComponent(subject.name),candidates});
}