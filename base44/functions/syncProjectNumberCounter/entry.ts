import {createClientFromRequest} from 'npm:@base44/sdk@0.8.54';
import {reconcileProjectCounter} from '../../shared/projectCounterReconciliation.ts';
export default async function(req) {
 try {
  const base44=createClientFromRequest(req);
  const user=await base44.auth.me().catch(e=>e.status===401?null:Promise.reject(e));
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const input=await req.json().catch(()=>({}));
  if(input.action&&!['sync','preview'].includes(input.action))return Response.json({error:'Choose a valid counter operation.'},{status:400});
  return Response.json(await reconcileProjectCounter(base44,user,input.action==='preview'));
 } catch(error){return Response.json({error:error.message},{status:500});}
}