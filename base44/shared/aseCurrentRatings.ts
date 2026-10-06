import {v2DisplayRatings} from './aseV2Display.ts';
import {confidenceRating} from './aseRatingExplanation.ts';
export async function aseCurrentRatings(db,accountIds) {
  const ids=[...new Set(accountIds.filter(Boolean))];
  if(!ids.length)return [];
  const v2=await db.ASEV2Current.filter({account_id:{$in:ids}},{sort:'-assessment_date',limit:ids.length});
  const ratings=await v2DisplayRatings(db,v2.items);
  const missing=ids.filter(id=>!ratings.some(row=>row.account_id===id));
  if(!missing.length)return ratings;
  const legacy=await db.ASECurrentRating.filter({account_id:{$in:missing}},{sort:'-assessment_date',limit:missing.length});
  return [...ratings,...legacy.items.map(row=>({...confidenceRating(row),methodology:'legacy',is_legacy:true}))];
}