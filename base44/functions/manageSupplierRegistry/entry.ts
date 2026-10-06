import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {supplierRegistryRun} from '../../shared/supplierRegistryRun.ts';
import {dataRequestError} from '../../shared/dataRequestError.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user || user.role!=='admin') return Response.json({error:'Supplier registry refresh is administrator-only.'},{status:403});
    const input=await req.json();
    if(!['start','step','status'].includes(input.action)) return Response.json({error:'Choose a supplier registry operation.'},{status:400});
    if(input.action!=='start' && (typeof input.runId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.runId))) return Response.json({error:'Valid run required.'},{status:400});
    if(input.action==='status') return Response.json({run:await base44.entities.SupplierRegistryRun.get(input.runId)});
    if(input.action==='step' && (typeof input.token!=='string' || input.token.length>64)) return Response.json({error:'Valid continuation required.'},{status:400});
    return Response.json(await supplierRegistryRun(base44,user,input));
  } catch(error) {return dataRequestError(error,'Supplier registry operation failed.',400);}
}