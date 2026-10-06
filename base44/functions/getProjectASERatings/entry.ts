import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {internalRoles} from '../../shared/asePolicy.ts';
import projectASERatingReports from '../../shared/projectASERatingReports.ts';
import {dataRequestError} from '../../shared/dataRequestError.ts';
export default async function(req:Request):Promise<Response> {
 try {
  const client=createClientFromRequest(req),user=await client.auth.me();
  if(!user || !internalRoles.includes(user.role))return Response.json({error:'ASE is internal-only.'},{status:403});
  const input=await req.json();
  if(!input.query || typeof input.query!=='object' || Array.isArray(input.query) || JSON.stringify(input.query).length>12000) return Response.json({error:'Invalid project filters.'},{status:400});
  let staffId=null;
  if(['bsm','bdm'].includes(user.role) && user.email){const escaped=user.email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const staff=await client.entities.Contact.filter({email:{$regex:`^${escaped}$`,$options:'i'}},{limit:1,fields:['aad_id']});staffId=staff.items[0]?.aad_id;}
  const ids=[...new Set([user.id,user.staff_aad_id,user.data?.staff_aad_id,user.delegate_of,user.data?.delegate_of,staffId].filter(Boolean))];
  const scope=user.role==='bsm' ? {bsm_aad_id:{$in:ids}} : user.role==='bdm' ? {$or:[{bdm_aad_id:{$in:ids}},{bsm_aad_id:{$in:ids}}]} : user.role==='regional_director' ? {department_id:user.region || user.data?.region || '__unassigned_region__'} : {};
  const query={$and:[{status:{$ne:'inactive'}},scope,input.query]};
  return Response.json({buckets:await projectASERatingReports(client.entities,query)});
 }catch(error){return dataRequestError(error,'Unable to filter project ASE ratings.');}
}