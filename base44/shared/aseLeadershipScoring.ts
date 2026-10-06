import {v2UnavailableCheck} from './aseV2ExternalChecks.ts';
export function leadershipPersonScores(audits,policy) {
  const today=new Date().toISOString().slice(0,10);
  return audits.map(original=>{const c=structuredClone(original);if(c.source==='disqualification' && ['ADVERSE','HISTORIC'].includes(c.match_status)) {const periods=(c.candidates || []).filter(m=>['ADVERSE','HISTORIC'].includes(m.match_status)).flatMap(m=>m.periods || []);if(periods.length && periods.every(d=>d.end && d.end<today)) c.match_status='HISTORIC';else if(periods.length && !periods.some(d=>d.start && d.end && d.start<=today && d.end>=today)) c.match_status='MANUAL REVIEW';}const state=c.match_status;let score=null;
    if(state==='CLEAR') score=policy.stable_score;
    if(c.source==='disqualification') {if(state==='ADVERSE') score=policy.disqualification_current_score;if(state==='HISTORIC'){const ends=(c.candidates || []).flatMap(m=>m.periods || []).map(p=>p.end).filter(Boolean).sort(),end=ends.at(-1);score=end && Date.now()-Date.parse(end)<=policy.recent_days*86400000 ? policy.disqualification_recent_historic_score : policy.disqualification_old_historic_score;}}
    if(c.source==='sanctions' && state==='CONFIRMED MATCH') score=1;
    if(c.source==='individual_insolvency') {if(state==='ADVERSE') score=policy.personal_current_score;if(state==='HISTORIC') score=policy.personal_historic_score;}
    c.score=score;return c;
  });
}
export function aggregateLeadershipSource(audits,source,slot,label,complete,policy) {
  const rows=audits.filter(r=>r.source===source),out=v2UnavailableCheck('adverse',slot,label,source==='individual_insolvency' ? 'Official Individual Insolvency Register / manual evidence' : source==='sanctions' ? 'Official UK Sanctions List' : 'Companies House',rows.length ? 'Screening contains incomplete or uncertain identities; no adverse score inferred.' : 'No current screening evidence available.');
  if(!rows.length) {out.state=rows.some(r=>r.match_status==='CHECK FAILED') ? 'CHECK FAILED' : 'UNAVAILABLE';return out;}
  const adverse=rows.filter(r=>r.score!==null && ['ADVERSE','CONFIRMED MATCH','HISTORIC'].includes(r.match_status)),uncertain=rows.some(r=>r.score===null);
  if(adverse.length || complete && !uncertain) {out.score=Math.min(...rows.filter(r=>r.score!==null).map(r=>r.score));out.state=adverse.length ? 'ADVERSE' : 'CLEAR';out.verified=true;out.confidence=uncertain || !complete ? 'Medium' : 'High';out.checked_at=rows.map(r=>r.checked_at).sort().at(-1);out.reason=adverse.length ? `${adverse.length} verified current/historic leadership findings in this check; the lowest applicable governance score contributes once. Company financial distress or personal character is not inferred.` : 'All current relevant subjects in the retrieved roster completed this dated check with no relevant finding.';out.source_reference=adverse[0]?.evidence_reference || rows[0]?.evidence_reference;}
  if(source==='individual_insolvency') {const active=[...new Set(rows.filter(r=>r.match_status==='ADVERSE').map(r=>r.evidence_key || r.evidence_reference))];if(active.length>1) out.score=Math.min(out.score ?? 5,policy.personal_multiple_score);out.optional_for_assessment=true;out.reason+=' Personal insolvency is a governance indicator only; it cannot impose an overall ASE cap.';}
  if(out.score===null && rows.some(r=>['MANUAL REVIEW','POTENTIAL MATCH'].includes(r.match_status))) {out.state='LIMITED';out.matching_status='POTENTIAL MATCH / MANUAL REVIEW';}
  out.fact_keys=[...new Set(adverse.flatMap(r=>r.candidates?.filter(m=>['ADVERSE','CONFIRMED MATCH','HISTORIC'].includes(m.match_status)).map(m=>m.evidence_key) || [r.evidence_key]).filter(Boolean))];return out;
}