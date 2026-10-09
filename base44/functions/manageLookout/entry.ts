import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {portalActor} from '../../shared/portalActor.ts';
import { internalRoles } from '../../shared/allianceLayerAccess.ts';
import { nextLookoutDate, ukParts } from '../../shared/lookoutDates.ts';
import { collectLookoutSources } from '../../shared/lookoutSources.ts';
import { cleanLookoutInputs, buildLookoutContent } from '../../shared/lookoutContent.ts';
import { storeLookoutPdf, storeLookoutDraft } from '../../shared/lookoutPdfStorage.ts';
import { publishLookout } from '../../shared/lookoutPublication.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44=createClientFromRequest(req), user=await portalActor(base44);
    if(!user || !internalRoles.includes(user.role)) return Response.json({error:'Internal staff access only.'},{status:403});
    const input=await req.json(), admin=user.role==='admin', db=base44.entities, now=new Date();
    const writes=['generate','scheduledGenerate','scheduledPublish','save','approve','publish'];
    if(writes.includes(input.action) && !admin) return Response.json({error:'Administrator approval access required.'},{status:403});
    if(input.cursor && (typeof input.cursor!=='string' || input.cursor.length>4000)) throw new Error('Invalid continuation.');
    if(input.action==='list') return Response.json(await db.LookoutIssue.filter(admin && input.admin===true ? {} : {status:'published'},{sort:'-publication_date',limit:admin && input.admin===true ? 20 : 6,fields:['issue_number','publication_date','status','approved_by_name','approved_at','published_at','generated_at','revision','pdf_file_uri'],...(input.cursor ? {cursor:input.cursor} : {})}));
    if(input.action==='scheduledPublish') {
      const p=ukParts(now); if(p.weekday!=='Thu' || Number(p.hour)!==13) return Response.json({skipped:'Outside the Thursday 1pm UK release window.'});
      const today=`${p.year}-${p.month}-${p.day}`, page=await db.LookoutIssue.filter({publication_date:today,status:{$in:['approved','publishing']}},{limit:10});
      const published=[]; for(const issue of page.items) published.push((await publishLookout(base44,issue,user)).id);
      return Response.json({published,held:published.length===0});
    }
    if(['generate','scheduledGenerate'].includes(input.action)) {
      const p=ukParts(now);if(input.action==='scheduledGenerate' && p.weekday!=='Tue') return Response.json({skipped:'Tuesday drafts only.'});
      const publicationDate=nextLookoutDate(now),page=await db.LookoutIssue.filter({week_key:publicationDate},{limit:1});
      const existing=page.items[0];if(existing && existing.status!=='draft') return Response.json({issue:existing,unchanged:true});
      const sources=await collectLookoutSources(base44.asServiceRole.entities,publicationDate,now), inputs=existing?.inputs || {}, content=buildLookoutContent(sources,inputs,publicationDate);
      if(existing) {
        const change=await db.LookoutIssue.updateMany({id:existing.id,status:'draft',revision:existing.revision},{$set:{sources,content,generated_at:now.toISOString(),revision:existing.revision+1,pdf_file_uri:'',draft_pdf_file_uri:''}});
        if(!change.updated) throw new Error('The issue changed while generating. Refresh and retry.');
        return Response.json({issue:await storeLookoutDraft(base44,await db.LookoutIssue.get(existing.id))});
      }
      const latest=await db.LookoutIssue.filter({},{sort:'-issue_number',limit:1,fields:['issue_number']});
      const result=await db.LookoutIssue.upsert([{week_key:publicationDate,publication_date:publicationDate,issue_number:(latest.items[0]?.issue_number || 0)+1,status:'draft',inputs:cleanLookoutInputs({}),sources,content,revision:1,generated_at:now.toISOString()}],{key:'week_key'});
      return Response.json({issue:await storeLookoutDraft(base44,result.records[0])});
    }
    if(typeof input.id!=='string' || !/^[a-f0-9]{24}$/i.test(input.id)) throw new Error('Choose a valid Lookout issue.');
    const issue=await db.LookoutIssue.get(input.id);
    if(!issue || (!admin && issue.status!=='published')) return Response.json({error:'This issue is not available.'},{status:404});
    if(input.action==='get') return Response.json({issue});
    if(input.action==='poll' || input.action==='vote') {
      if(issue.status!=='published') throw new Error('Voting opens when the issue is published.');
      const privileged=base44.asServiceRole.entities, key=`${issue.id}:${user.id}`;
      if(input.action==='vote') {
        if(typeof input.option!=='string' || !issue.content.poll.options.includes(input.option)) throw new Error('Choose a listed poll option.');
        await privileged.LookoutVote.upsert([{vote_key:key,issue_id:issue.id,user_id:user.id,option:input.option}],{key:'vote_key'});
      }
      const own=await privileged.LookoutVote.filter({vote_key:key},{limit:1,fields:['option']});
      const totals=await privileged.LookoutVote.aggregate({query:{issue_id:issue.id},groupBy:'option'});
      return Response.json({option:own.items[0]?.option || '',results:totals.rows.map(r=>({option:r.option,count:r.count}))});
    }
    if(input.action==='save') {
      if(!['draft','approved'].includes(issue.status) || input.revision!==issue.revision) throw new Error('This issue changed or is locked. Refresh before editing.');
      const inputs=cleanLookoutInputs(input.inputs),content=buildLookoutContent(issue.sources,inputs,issue.publication_date);
      const result=await db.LookoutIssue.updateMany({id:issue.id,revision:issue.revision,status:issue.status},{$set:{inputs,content,status:'draft',revision:issue.revision+1,pdf_file_uri:'',draft_pdf_file_uri:'',approved_at:null,approved_by:'',approved_by_name:''}});
      if(!result.updated) throw new Error('The issue changed while saving. Refresh and retry.');
      return Response.json({issue:await db.LookoutIssue.get(issue.id)});
    }
    if(input.action==='approve' || input.action==='pdf') {
      if(input.action==='approve' && (!admin || issue.status!=='draft' || input.revision!==issue.revision)) throw new Error('Save the current draft before approving.');
      if(input.action==='pdf' && issue.pdf_file_uri) return Response.json({pdf_file_uri:issue.pdf_file_uri});
      if(!admin) throw new Error('Approved PDF is not available.');
      if(input.action==='pdf' && issue.draft_pdf_file_uri) return Response.json({pdf_file_uri:issue.draft_pdf_file_uri});
      const file_uri=await storeLookoutPdf(base44,issue,input.action==='pdf' && issue.status==='draft');
      if(input.action==='pdf') return Response.json({pdf_file_uri:file_uri});
      const result=await db.LookoutIssue.updateMany({id:issue.id,status:'draft',revision:issue.revision},{$set:{status:'approved',pdf_file_uri:file_uri,approved_revision:issue.revision,approved_by:user.id,approved_by_name:user.full_name || user.email,approved_at:now.toISOString()}});
      if(!result.updated) throw new Error('The draft changed during approval. Review and approve the latest version.');
      return Response.json({issue:await db.LookoutIssue.get(issue.id)});
    }
    if(input.action==='publish') return Response.json({issue:await publishLookout(base44,issue,user)});
    return Response.json({error:'Unsupported Lookout operation.'},{status:400});
  } catch(error) { console.error('Lookout operation failed',error);return Response.json({error:error.message || 'Unable to complete this Lookout operation.'},{status:400}); }
}