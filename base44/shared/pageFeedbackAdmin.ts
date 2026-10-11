import {feedbackCategories,feedbackPages} from './pageFeedbackPages.ts';
export function feedbackQuery(filters={}) {
 if(!filters || typeof filters!=='object' || Array.isArray(filters) || Object.keys(filters).some(key=>!['page','rating','category','user','from','to'].includes(key)))throw new Error('Invalid feedback filters.');
 const query={};
 if(filters.page){if(!feedbackPages.some(p=>p.key===filters.page))throw new Error('Invalid page filter.');query.page_key=filters.page;}
 if(filters.rating){const rating=Number(filters.rating);if(!Number.isInteger(rating)||rating<1||rating>5)throw new Error('Invalid rating filter.');query.rating=rating;}
 if(filters.category){if(!feedbackCategories.includes(filters.category))throw new Error('Invalid category filter.');query.feedback_category=filters.category;}
 if(filters.user){if(typeof filters.user!=='string'||filters.user.length>120)throw new Error('User search is too long.');const pattern=filters.user.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');if(pattern)query.$or=['user_name','user_email'].map(field=>({[field]:{$regex:pattern,$options:'i'}}));}
 for(const field of ['from','to'])if(filters[field]){if(typeof filters[field]!=='string'||filters[field].length>30||!Number.isFinite(Date.parse(filters[field])))throw new Error('Invalid date range.');query.submitted_at={...query.submitted_at,[field==='from'?'$gte':'$lt']:new Date(filters[field]).toISOString()};}
 if(filters.from&&filters.to&&Date.parse(filters.from)>=Date.parse(filters.to))throw new Error('The end date must not be before the start date.');
 return query;
}
export async function feedbackSummary(db,query) {
 const results=await Promise.all([
  db.PageFeedback.aggregate({query,groupBy:['page_key','page_name'],avg:'rating',sort:'avg_rating',limit:1000}),
  db.PageFeedback.aggregate({query,groupBy:'rating',sum:'rating',limit:5}),
  db.PageFeedback.aggregate({query,groupBy:'feedback_category',limit:6})
 ]);
 if(results.some(result=>result.truncated))throw new Error('Feedback totals could not be calculated completely. Narrow the filters.');
 const [pages,ratings,categories]=results.map(result=>result.rows);
 const total=ratings.reduce((n,r)=>n+r.count,0),sum=ratings.reduce((n,r)=>n+(r.sum_rating||0),0);
 return {total,average:total?sum/total:null,positive:ratings.filter(r=>r.rating>=4).reduce((n,r)=>n+r.count,0),negative:ratings.filter(r=>r.rating<=2).reduce((n,r)=>n+r.count,0),pages,categories};
}