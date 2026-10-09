import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {powerBIConnectionRecord,powerBIConnectionSummary,beginPowerBISignIn,finishPowerBISignIn,delegatedPowerBIToken} from '../../shared/powerBIUserAuth.ts';
import {reportAddress,powerRequest,powerQuery} from '../../shared/financePowerBI.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access is required to authorise the shared finance reporting connection.'},{status:403});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const raw=await req.text();if(raw.length>15000)throw new Error('Sign-in response is too large.');
  const input=JSON.parse(raw);
  if(!['status','begin','finish','check','disconnect'].includes(input.action))throw new Error('Invalid Power BI connection operation.');
  if(input.action==='begin')return Response.json(await beginPowerBISignIn(base44,user));
  if(input.action==='finish')return Response.json(await finishPowerBISignIn(base44,user,input));
  const record=await powerBIConnectionRecord(base44);
  if(input.action==='status')return Response.json(powerBIConnectionSummary(record));
  if(input.action==='disconnect'){
   if(record)await base44.asServiceRole.entities.PowerBIUserConnection.delete(record.id);
   return Response.json({...powerBIConnectionSummary(null),notice:'Delegated Power BI connection removed. Dataverse reporting is unchanged.'});
  }
  if(typeof input.reportURL!=='string'||input.reportURL.length>2000)throw new Error('Enter the Power BI workspace report link.');
  const address=reportAddress(input.reportURL),token=await delegatedPowerBIToken(base44);
  if(!token)throw new Error('Sign in with Microsoft before checking report access.');
  const report=await powerRequest(token,`groups/${address.workspace_id}/reports/${address.report_id}`);
  if(!/^[0-9a-f-]{36}$/i.test(report.datasetId||''))throw new Error('This report does not expose a supported semantic model.');
  await powerQuery(token,report.datasetId,'EVALUATE ROW("AccessCheck", 1)');
  const checked=await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,{last_checked_at:new Date().toISOString()});
  return Response.json({...powerBIConnectionSummary(checked),report_name:report.name,notice:`Microsoft sign-in can read ${report.name} and query its semantic model. Existing Dataverse reporting has not been changed.`});
 }catch(error){return Response.json({error:error.message||'Power BI sign-in could not be completed.'},{status:400});}
}