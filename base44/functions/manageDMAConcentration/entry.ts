import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {startDMACheck} from '../../shared/dmaCheckQueue.ts';
import {dmaCheckStep} from '../../shared/dmaCheckStep.ts';
import {enqueueSignedDMACheck} from '../../shared/dmaSignedCheck.ts';
import {startSupplierCommercialChecks} from '../../shared/supplierCommercialQueue.ts';
import {supplierCommercialStep} from '../../shared/supplierCommercialStep.ts';
import {extractAppointmentFee} from '../../shared/appointmentFeeExtraction.ts';
import {checkHensallDMARules} from '../../shared/hensallDMAContractValue.ts';
import {checkDMASupplierRules} from '../../shared/dmaSupplierContractValue.ts';
import {recheckAllSignedDMAs} from '../../shared/dmaRecheckAll.ts';
import {extractProjectDMAFees} from '../../shared/vigoDMAFees.ts';
import {readVigoDMAEvidence} from '../../shared/vigoDMAAttribution.ts';
import {checkDMASignedWordRules} from '../../shared/dmaSignedSourceChecks.ts';
export default async function(req:Request):Promise<Response>{
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Signed DMA portfolio checks are administrator-only.'},{status:403});
  const input=await req.json().catch(()=>({}));
  if(input.action==='extractSigned'){
   if(typeof input.dmaId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.dmaId))return Response.json({error:'Valid signed DMA identifier required.'},{status:400});
   const dma=await base44.entities.DMA.get(input.dmaId),projects=await base44.entities.Project.filter({$or:[{id:dma.project_id},{dataverse_id:dma.project_id}]},{limit:2});
   if(dma.executed!=='yes'||projects.items.length!==1)return Response.json({error:'An executed DMA linked to one accessible project is required.'},{status:400});
   const project=projects.items[0],extraction=await extractProjectDMAFees(base44,user,project.id,dma.id,true);
   const evidence=extraction.status==='ready'?await readVigoDMAEvidence(base44,null,false,project.id):null;
   return Response.json({status:extraction.status,note:extraction.note,evidence});
  }
  if(input.action==='enqueueSigned'){
   if(typeof input.dmaId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.dmaId))return Response.json({error:'Valid signed DMA identifier required.'},{status:400});
   return Response.json(await enqueueSignedDMACheck(base44,input.dmaId));
  }
  if(input.action==='processSignedNow'){
   if(typeof input.dmaId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.dmaId))return Response.json({error:'Valid signed DMA identifier required.'},{status:400});
   const queued=await enqueueSignedDMACheck(base44,input.dmaId);
   if(queued.skipped)return Response.json(queued);
   const page=await base44.asServiceRole.entities.DMACheckJob.filter({dma_id:input.dmaId},{sort:'-created_date',limit:1});
   let job=page.items[0];
   if(!job)return Response.json({error:'DMA check was not queued.'},{status:409});
   if(job.status==='queued'){
    if(!job.token)job=await base44.asServiceRole.entities.DMACheckJob.update(job.id,{token:crypto.randomUUID()});
    await dmaCheckStep(base44,user,{jobId:job.id,token:job.token});
    job=await base44.asServiceRole.entities.DMACheckJob.get(job.id);
   }
   return Response.json({jobId:job.id,status:job.status,stage:job.stage,extraction_status:job.extraction_status,note:job.note});
  }
  if(input.action==='appointmentFee'){
   if(typeof input.appointmentId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.appointmentId))return Response.json({error:'Valid executed appointment required.'},{status:400});
   const document=await base44.entities.LegalDocument.get(input.appointmentId),accounts=await base44.entities.Account.filter({$or:[{id:document.account_id},{dataverse_id:document.account_id}]},{limit:2});
   if(accounts.items.length!==1)return Response.json({error:'Appointment supplier is missing or ambiguous.'},{status:400});
   return Response.json(await extractAppointmentFee(base44,user,document,accounts.items[0]));
  }
  if(input.action==='supplierRules')return Response.json({...checkDMASupplierRules(),...await checkDMASignedWordRules()});
  if(input.action==='recheckAll')return Response.json(await recheckAllSignedDMAs(base44));
  if(input.action==='hensallRules')return Response.json(checkHensallDMARules());
  if(input.action==='supplierStart')return Response.json(await startSupplierCommercialChecks(base44));
  if(input.action==='supplierStatus')return Response.json(await base44.asServiceRole.entities.SupplierCommercialCheck.aggregate({query:{},groupBy:['status','concentration_status'],limit:20}));
  if(input.action==='start')return Response.json(await startDMACheck(base44));
  if(input.action==='status')return Response.json(await base44.asServiceRole.entities.DMACheckJob.aggregate({query:{},groupBy:'status',limit:10}));
  if(!['step','supplierStep'].includes(input.action)||typeof input.jobId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.jobId)||typeof input.token!=='string'||!input.token||input.token.length>100)return Response.json({error:'Valid portfolio check operation required.'},{status:400});
  return Response.json(await (input.action==='supplierStep'?supplierCommercialStep(base44,user,input):dmaCheckStep(base44,user,input)));
 }catch(error){return Response.json({error:String(error.message).slice(0,1000)},{status:500});}
}