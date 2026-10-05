export async function syncASECurrent(base44,accountId) {
  const page=await base44.entities.ASEAssessment.filter({account_id:accountId,status:'published'},{sort:'-assessment_date',limit:1});
  const a=page.items[0];if(!a) return;
  await base44.entities.ASECurrentRating.upsert([{account_id:a.account_id,assessment_id:a.id,precise_score:a.precise_score,displayed_rating:a.displayed_rating,rating_label:a.rating_label,previous_rating:a.previous_rating,change:a.change,data_confidence:a.data_confidence,assessment_date:a.assessment_date,explanation:a.explanation,is_demo:a.is_demo}],{key:'account_id'});
}
export async function finishASEPublication(base44,assessment,sourceEvidence,components) {
  if(assessment.status==='published') {await syncASECurrent(base44,assessment.account_id);return assessment;}
  const db=base44.entities;
  const existing=await db.ASEEvidence.filter({assessment_id:assessment.id},{limit:100});
  if(existing.has_more) throw new Error('Assessment snapshot exceeds the evidence limit.');
  const byKey=new Map(existing.items.map(row=>[row.external_key,row]));
  const missing=sourceEvidence.filter(row=>!byKey.has(`snapshot:${assessment.id}:${row.id}`));
  if(missing.length) {
    const saved=await db.ASEEvidence.bulkCreate(missing.map(row=>{const {id,created_date,updated_date,created_by_id,created_by,...data}=row;return {...data,external_key:`snapshot:${assessment.id}:${id}`,assessment_id:assessment.id};}));
    for(const row of saved) byKey.set(row.external_key,row);
  }
  const scorePage=await db.ASEComponentScore.filter({assessment_id:assessment.id},{limit:10});
  const stored=new Set(scorePage.items.map(row=>row.component));
  const missingScores=components.filter(row=>!stored.has(row.component));
  if(missingScores.length) await db.ASEComponentScore.bulkCreate(missingScores.map(({latest,...component})=>({...component,sealed:true,evidence_ids:component.evidence_ids.map(id=>byKey.get(`snapshot:${assessment.id}:${id}`)?.id).filter(Boolean),account_id:assessment.account_id,assessment_id:assessment.id})));
  const published=await db.ASEAssessment.update(assessment.id,{status:'published'});
  await syncASECurrent(base44,assessment.account_id);return published;
}