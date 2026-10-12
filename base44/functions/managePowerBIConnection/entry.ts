import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {powerBIConnectionRecord,powerBIConnectionSummary,beginPowerBISignIn,finishPowerBISignIn,delegatedPowerBIToken} from '../../shared/powerBIUserAuth.ts';
import {reportAddress,powerToken,powerRequest,powerQuery} from '../../shared/financePowerBI.ts';

export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
  if(user.role!=='admin')return Response.json({error:'Administrator access is required to authorise the shared finance reporting connection.'},{status:403});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const raw=await req.text();if(raw.length>15000)throw new Error('Sign-in response is too large.');
  const input=JSON.parse(raw);
  if(!['status','begin','finish','check','retry','discover','inspectOrders','disconnect'].includes(input.action))throw new Error('Invalid Power BI connection operation.');
  if(input.action==='begin')return Response.json(await beginPowerBISignIn(base44,user));
  if(input.action==='finish')return Response.json(await finishPowerBISignIn(base44,user,input));
  const record=await powerBIConnectionRecord(base44);
  if(input.action==='status'){
   const config=(await base44.asServiceRole.entities.FinanceConnection.filter({key:'primary'},{limit:1,fields:['report_url']})).items[0];
   return Response.json({...powerBIConnectionSummary(record),report_url:config?.report_url||''});
  }
  if(input.action==='disconnect'){
   if(record)await base44.asServiceRole.entities.PowerBIUserConnection.delete(record.id);
   return Response.json({...powerBIConnectionSummary(null),notice:'Delegated Power BI connection removed. Dataverse reporting is unchanged.'});
  }
  if(typeof input.reportURL!=='string'||input.reportURL.length>2000)throw new Error('Enter the Power BI workspace report link.');
  const address=reportAddress(input.reportURL),token=input.action==='retry'?await powerToken(base44,true):await delegatedPowerBIToken(base44);
  if(!token)throw new Error('Sign in with Microsoft before checking report access.');
  const report=await powerRequest(token,`groups/${address.workspace_id}/reports/${address.report_id}`);
  if(!/^[0-9a-f-]{36}$/i.test(report.datasetId||''))throw new Error('This report does not expose a supported semantic model.');
  if(input.action==='inspectOrders'){

   const rows=await Promise.all(['PO_Log','SO_Log'].map(async table=>({table,summary:await powerQuery(token,report.datasetId,`EVALUATE ROW("Rows",COUNTROWS('${table}'),"Orders",DISTINCTCOUNT('${table}'[Document number]),"Total",SUM('${table}'[Total]),"Missing",COUNTBLANK('${table}'[Total]))`),sample:await powerQuery(token,report.datasetId,`EVALUATE TOPN(5,SELECTCOLUMNS('${table}',"Reference",[Document number],"Project",[Project name],"Code",[Project],"Amount",[Total]),[Reference],ASC)`)})));
   return Response.json({rows});
  }
  if(input.action==='discover'){
   const columns=await powerQuery(token,report.datasetId,'EVALUATE SELECTCOLUMNS(INFO.VIEW.COLUMNS(), "Table", [Table], "Column", [Name], "DataType", [DataType], "Hidden", [IsHidden])');
   if(columns.length>3000)throw new Error('Model metadata exceeds the supported mapping size.');
   return Response.json({...address,report_name:report.name,dataset_id:report.datasetId,columns});
  }
  await powerQuery(token,report.datasetId,'EVALUATE ROW("AccessCheck", 1)');
  const checked=record?await base44.asServiceRole.entities.PowerBIUserConnection.update(record.id,{last_checked_at:new Date().toISOString()}):null;
  return Response.json({...powerBIConnectionSummary(checked),report_name:report.name,dataset_id:report.datasetId,notice:`${input.action==='retry'?'The current Power BI application credentials':'Microsoft sign-in'} can read ${report.name} and query its semantic model (${report.datasetId}). Existing Dataverse reporting has not been changed.`});
 }catch(error){return Response.json({error:error.message||'Power BI sign-in could not be completed.'},{status:400});}
}