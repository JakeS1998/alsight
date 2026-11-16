import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {insuranceCertificateFile} from '../../shared/insuranceCertificateFile.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!user)return Response.json({error:'Sign in to open an insurance certificate.'},{status:401});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const input=await req.json().catch(()=>null);
  if(typeof input?.policyId!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(input.policyId))return Response.json({error:'Choose a valid insurance policy.'},{status:400});
  // Read through the caller's policy permissions before using the shared Dataverse connection.
  const policy=await base44.entities.SupplierInsurance.get(input.policyId).catch(e=>e.status===404?null:Promise.reject(e));
  if(!policy)return Response.json({error:'Insurance policy unavailable.'},{status:404});
  if(!(await base44.auth.isAuthenticated()))return Response.json({error:'Sign in to continue.'},{status:401});
  return Response.json(await insuranceCertificateFile(base44,policy));
 }catch(e){return Response.json({error:String(e.message||'Unable to retrieve the insurance certificate.').slice(0,350)},{status:[400,401,403,404,413,429].includes(e.status)?e.status:500});}
}