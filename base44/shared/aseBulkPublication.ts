import {prepareAssessment} from './aseAssessmentPreview.ts';
import {createAssessment} from './aseAssessment.ts';
export const bulkASEAccountQuery={name:{$regex:'^(?!ASE Demo)'},$or:[{organisation_type:{$regex:'^(english[ _]local[ _]authority|uk[ _]limited[ _]company|uk[ _]plc|limited[ _]company|plc|ltd)$',$options:'i'}},{$and:[{organisation_type:{$in:[null,'']}},{company_type:{$in:['ltd','plc']}}]}]};
export async function publishASEBatch(base44,policy,user,input) {
  if(input.confirmBulk!==true || typeof input.runId!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(input.runId)) throw new Error('Confirm bulk publication and supply a valid launch reference.');
  if(input.cursor!=null && (typeof input.cursor!=='string' || input.cursor.length>4096)) throw new Error('Invalid account cursor.');
  const limit=input.limit ?? 10;
  if(!Number.isInteger(limit) || limit<1 || limit>10) throw new Error('Publish between one and ten accounts per batch.');
  const page=await base44.entities.Account.filter(bulkASEAccountQuery,{sort:'id',limit,...(input.cursor ? {cursor:input.cursor} : {})});
  const note=`Bulk ASE launch ${input.runId}. Administrator approved publication using existing eligible evidence. Missing evidence remains Not assessed.`;
  const results=[];
  for(const account of page.items) {
    try {
      const previousLaunch=await base44.entities.ASEAssessment.filter({account_id:account.id,status:'published',publication_note:note},{limit:1,fields:['displayed_rating']});
      if(previousLaunch.items.length) {results.push({accountId:account.id,name:account.name,status:'already_published',rating:previousLaunch.items[0].displayed_rating ?? null});continue;}
      const preview=await prepareAssessment(base44,account,policy);
      const assessment=await createAssessment(base44,account,policy,{preparedAt:preview.preparedAt,previewToken:preview.previewToken,confirmed:true,note},user);
      results.push({accountId:account.id,name:account.name,status:'published',assessmentId:assessment.id,rating:assessment.displayed_rating ?? null});
    } catch(error) {results.push({accountId:account.id,name:account.name,status:'failed',error:String(error.message || 'Publication failed.').slice(0,1000)});}
  }
  return {runId:input.runId,results,next_cursor:page.next_cursor || null,has_more:page.has_more};
}