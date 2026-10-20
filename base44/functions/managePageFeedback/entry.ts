import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {feedbackPage,feedbackPages,feedbackCategories} from '../../shared/pageFeedbackPages.ts';
import {feedbackQuery,feedbackSummary} from '../../shared/pageFeedbackAdmin.ts';
import {fullName,missingFullName} from '../../shared/fullName.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user || !await base44.auth.isAuthenticated())return Response.json({error:'Please sign in to use page feedback.'},{status:401});
  const input=await req.json();
  if(!input || typeof input!=='object' || Array.isArray(input))return Response.json({error:'Invalid feedback request.'},{status:400});
  if(['submit','own'].includes(input.action)){
   const page=feedbackPage(input.page_route);
   if(!page)return Response.json({error:'Choose a recognised ALS Hub page.'},{status:400});
   if(input.action==='own'){
    const result=await base44.entities.PageFeedback.filter({user_id:user.id,page_key:page.key},{sort:'-submitted_at',limit:1,fields:['submitted_at']});
    return Response.json({submitted_at:result.items[0]?.submitted_at||null});
   }
   const allowed=['action','page_route','rating','feedback_category','comment','device_type','submission_id'];
   if(Object.keys(input).some(key=>!allowed.includes(key)) || !Number.isInteger(input.rating) || input.rating<1 || input.rating>5 || typeof (input.comment??'')!=='string' || (input.comment||'').length>2000 || !['desktop','tablet','mobile'].includes(input.device_type) || typeof input.submission_id!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.submission_id) || typeof (input.feedback_category??'')!=='string' || input.feedback_category && !feedbackCategories.includes(input.feedback_category))return Response.json({error:'Choose a rating from 1 to 5 and check your feedback.'},{status:400});
   const db=base44.asServiceRole.entities,submission_key=`${user.id}:${input.submission_id}`;
   const existing=await db.PageFeedback.filter({submission_key,user_id:user.id},{limit:1,fields:['submitted_at']});
   if(existing.items.length)return Response.json({ok:true,submitted_at:existing.items[0].submitted_at});
   const comment=(input.comment||'').trim(),feedback_category=input.feedback_category||'';
   const recent=await db.PageFeedback.filter({user_id:user.id,page_key:page.key,rating:input.rating,feedback_category,comment,submitted_at:{$gte:new Date(Date.now()-30000).toISOString()}},{limit:1,fields:['submitted_at']});
   if(recent.items.length)return Response.json({ok:true,submitted_at:recent.items[0].submitted_at});
   const name=fullName(user.full_name),submitted_at=new Date().toISOString();
   await db.PageFeedback.upsert([{submission_key,user_id:user.id,user_name:name===missingFullName?'':name,user_email:user.email||'',user_role:user.role||'',department_id:user.region||user.data?.region||'',page_key:page.key,page_name:page.name,page_route:input.page_route,rating:input.rating,feedback_category,comment,submitted_at,device_type:input.device_type}],{key:'submission_key'});
   return Response.json({ok:true,submitted_at});
  }
  if(user.role!=='admin')return Response.json({error:'Administrator access is required.'},{status:403});
  const db=base44.entities;
  if(input.action==='options'){
   const page=await db.PageFeedback.filter({},{distinct:'page_key',limit:1000});
   return Response.json({pages:feedbackPages.filter(p=>page.items.includes(p.key)).map(({key,name})=>({key,name}))});
  }
  const query=feedbackQuery(input.filters);
  if(input.action==='summary')return Response.json(await feedbackSummary(db,query));
  if(input.action==='list'){
   if(input.cursor!==undefined && (typeof input.cursor!=='string'||input.cursor.length>4000))return Response.json({error:'Invalid feedback page.'},{status:400});
   return Response.json(await db.PageFeedback.filter(query,{sort:'-submitted_at',limit:50,...(input.cursor?{cursor:input.cursor}:{})}));
  }
  return Response.json({error:'Unknown feedback operation.'},{status:400});
 } catch(error) {
  const status=Number(error.response?.status||error.status||500);
  return Response.json({error:error.message||'Page feedback is temporarily unavailable.'},{status:[400,401,403,429].includes(status)?status:500});
 }
}