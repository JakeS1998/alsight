export async function publishV2Current(db,assessment) {
 const page=await db.ASEV2Current.filter({account_id:assessment.account_id},{limit:1}),current=page.items[0];
 if(current?.assessment_id===assessment.id || current?.assessment_date>assessment.assessment_date)return assessment;
 const previous=assessment.previous_assessment_id ? await db.ASEV2Assessment.get(assessment.previous_assessment_id) : null;
 const previousRating=previous?.final_score==null ? null : Number(previous.final_score.toFixed(1));
 await db.ASEV2Current.upsert([{account_id:assessment.account_id,assessment_id:assessment.id,methodology:'ASE v2',displayed_rating:assessment.final_score==null ? null : Number(assessment.final_score.toFixed(1)),precise_score:assessment.final_score,rating_label:assessment.classification,data_confidence:assessment.confidence,coverage:assessment.coverage,assessment_date:assessment.assessment_date,explanation:assessment.explanation,previous_rating:previousRating,change:Number.isFinite(previousRating) && Number.isFinite(assessment.final_score) ? assessment.final_score-previousRating : null}],{key:'account_id'});
 return assessment;
}