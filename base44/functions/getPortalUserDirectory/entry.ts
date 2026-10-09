import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {withPortalUserNames} from '../../shared/portalUserNames.ts';
import {portalUserSearch} from '../../shared/portalUserSearch.ts';
import {portalDirectoryQuery} from '../../shared/portalDirectoryVisibility.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user || user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  const input=await req.json(),offset=input.offset ?? 0,search=input.search ?? '';
  if(!Number.isInteger(offset) || offset<0 || offset>10000 || typeof search!=='string' || search.length>100 || (input.linked!=null && typeof input.linked!=='boolean'))return Response.json({error:'Invalid directory page.'},{status:400});
  const db=base44.entities,query={...(input.linked ? {} : portalDirectoryQuery),...await portalUserSearch(db,search),...(input.linked ? {dataverse_systemuser_id:{$exists:true,$nin:[null,'']}} : {})};
  const people=await db.User.filter(query,'full_name',51,offset),items=await withPortalUserNames(db,people.slice(0,50));
  return Response.json({items,has_more:people.length>50,next_offset:offset+50});
 }catch(error){return Response.json({error:error.message},{status:500});}
}