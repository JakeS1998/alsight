import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {powerBIOrderState} from '../../shared/powerBIOrderState.ts';
import {configurePowerBIOrders,startPowerBIOrders,batchPowerBIOrders,confirmPowerBIOrders} from '../../shared/powerBIOrderImport.ts';
import {saveFinanceMapping} from '../../shared/financeProjectMatching.ts';
import {readProjectNumberMappings,saveProjectNumberMapping} from '../../shared/financeProjectNumberMapping.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const raw=await req.text();if(raw.length>15000)throw new Error('Request too large.');const input=JSON.parse(raw);
  if(input.action==='configure')return Response.json(await configurePowerBIOrders(base44,input));
  if(input.action==='start')return Response.json(await startPowerBIOrders(base44));
  if(input.action==='batch')return Response.json(await batchPowerBIOrders(base44,input));
  if(input.action==='confirm')return Response.json(await confirmPowerBIOrders(base44,user,input));
  const state=await powerBIOrderState(base44);
  if(input.action==='status')return Response.json({state});
  if(!state)throw new Error('Configure the model first.');
  if(input.action==='numberMappings')return Response.json(await readProjectNumberMappings(base44,state,input));
   if(input.action==='mapNumber')return Response.json(await saveProjectNumberMapping(base44,user,input,state));
   if(input.action==='map')return Response.json(await saveFinanceMapping(base44,user,input,{dataset_id:state.namespace}));
  if(input.action==='mappings')return Response.json(await base44.entities.FinanceProjectMapping.filter({dataset_id:state.namespace,...(input.status==='review'?{status:{$in:['unmatched','ambiguous']}}:input.status==='linked'?{status:{$in:['manual','automatic']}}:{})},{limit:50,sort:'source_code',...(input.cursor?{cursor:input.cursor}:{})}));
  if(input.action==='preview'){
   if(!['purchase_orders','sales_orders'].includes(input.kind))throw new Error('Choose an order type.');
   const query={namespace:state.namespace,generation:state.generation,kind:input.kind};
   return Response.json({...await base44.entities.FinanceDataverseRecord.filter(query,{limit:20,sort:'reference',...(input.cursor?{cursor:input.cursor}:{})}),total:await base44.entities.FinanceDataverseRecord.count(query)});
  }
  throw new Error('Invalid model import operation.');
 }catch(error){return Response.json({error:error.message||'Power BI order import failed.'},{status:400});}
}