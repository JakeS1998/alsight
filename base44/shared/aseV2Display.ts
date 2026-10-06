export function v2DisplayAssessment(assessment) {
 if(!assessment)return assessment;
 const provisional=!Number.isFinite(assessment.final_score) && Number.isFinite(assessment.raw_score);
 const score=provisional ? Math.min(assessment.raw_score,...(assessment.caps || []).map(cap=>cap.cap)) : assessment.final_score;
 const classification=provisional ? assessment.policy_snapshot?.classifications?.find(band=>score>=band.minimum)?.label || 'Unclassified' : assessment.classification;
 return {...assessment,display_score:score,display_classification:classification,is_provisional:provisional};
}
export async function v2DisplayRatings(db,ratings) {
 const missing=ratings.filter(row=>!Number.isFinite(row.precise_score));
 if(!missing.length)return ratings;
 const ids=[...new Set(missing.map(row=>row.assessment_id).filter(Boolean))];
 const page=ids.length ? await db.ASEV2Assessment.filter({id:{$in:ids}},{limit:ids.length,fields:['account_id','final_score','raw_score','caps','classification','policy_snapshot']}) : {items:[]};
 return ratings.map(current=>{
  const assessment=page.items.find(row=>row.id===current.assessment_id && row.account_id===current.account_id);
  const display=v2DisplayAssessment(assessment);
  if(!display?.is_provisional)return current;
  return {...current,displayed_rating:Number(display.display_score.toFixed(1)),precise_score:display.display_score,rating_label:`Provisional · ${display.display_classification}`,is_provisional:true,published_score:null,evidence_minimum:assessment.policy_snapshot?.confidence?.minimum,change:null};
 });
}