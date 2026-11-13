import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {startDMACheck} from '../../shared/dmaCheckQueue.ts';
import {dmaCheckStep} from '../../shared/dmaCheckStep.ts';
import {enqueueSignedDMACheck} from '../../shared/dmaSignedCheck.ts';
export default async function(req:Request):Promise<Response>{
 try {
  const base44=createClientFromRequest(req),user=await base44.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!user)return Response.json({error:'Sign in required.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Signed DMA portfolio checks are administrator-only.'},{status:403});
  const input=await req.json().catch(()=>({}));
  if(input.action==='enqueueSigned'){
   if(typeof input.dmaId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.dmaId))return Response.json({error:'Valid signed DMA identifier required.'},{status:400});
   return Response.json(await enqueueSignedDMACheck(base44,input.dmaId));
  }
  if(input.action==='start')return Response.json(await startDMACheck(base44));
  if(input.action==='status')return Response.json(await base44.asServiceRole.entities.DMACheckJob.aggregate({query:{},groupBy:'status',limit:10}));
  if(input.action!=='step'||typeof input.jobId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.jobId)||typeof input.token!=='string'||input.token.length>100)return Response.json({error:'Valid portfolio check operation required.'},{status:400});
  return Response.json(await dmaCheckStep(base44,user,input));
 }catch(error){return Response.json({error:String(error.message).slice(0,1000)},{status:500});}
}