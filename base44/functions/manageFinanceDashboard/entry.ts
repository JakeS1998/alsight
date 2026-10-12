import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { financeRoles,reportAddress,validateSources,powerToken,powerRequest,powerQuery } from '../../shared/financePowerBI.ts';
import { summaryDax,projectsDax,ordersDax } from '../../shared/financeDax.ts';
import { resolveFinanceProjects,saveFinanceMapping } from '../../shared/financeProjectMatching.ts';
import { reconcileOrders,financePODetail } from '../../shared/financeReconciliation.ts';
import { validateFinanceInvoices,liveFinanceInvoices } from '../../shared/financeSalesInvoices.ts';
import {discoverFinanceTables,inspectFinanceTable} from '../../shared/financeDataverseDiscovery.ts';
import {financeSyncState,startFinanceSync,syncFinanceBatch,continueFinanceSync} from '../../shared/financeDataverseSync.ts';
import {readDataverseFinance} from '../../shared/financeDataverseReads.ts';
import {readFinanceForecast} from '../../shared/financeForecast.ts';
import {financeMappingStatus,saveFinanceFieldMapping} from '../../shared/financeDataverseMappings.ts';
import {applyWorkbookFinanceMappings} from '../../shared/financeWorkbookMatching.ts';
import {applyLegacyFinanceNameMappings} from '../../shared/financeNameMatching.ts';
import {readProjectFinanceOrders} from '../../shared/projectFinanceOrders.ts';
import {commercialPipelineSummary} from '../../shared/commercialPipelineSummary.ts';
import {recalculateBlankPOHeaders} from '../../shared/financeRecalculateHeaders.ts';
import {powerBIOrderState,publishedPowerBIState} from '../../shared/powerBIOrderState.ts';
import {readPowerBIOrderFinance} from '../../shared/powerBIOrderReads.ts';
import {readProjectNumberMappings,saveProjectNumberMapping} from '../../shared/financeProjectNumberMapping.ts';
import {readPowerBIBalances} from '../../shared/powerBIBalances.ts';
import {commercialRoles,commercialAccessScope} from '../../shared/commercialAccessScope.ts';
import {readPowerBIBalanceTrend} from '../../shared/powerBIBalanceTrend.ts';
import {scopedReadCache} from '../../shared/scopedReadCache.ts';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});

  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const raw=await req.text();if(raw.length>20000)throw new Error('Request too large.');const input=JSON.parse(raw);
  if(!commercialRoles.includes(user.role))return Response.json({error:'Commercial reporting access required.'},{status:403});
  const actions=['balanceTrend','balanceSummary','balanceInvoices','recalculatePOHeaders','pipeline','projectOrders','projectOrderDetail','projectOrderCashFlow','applyNameLinks','applyCodeLinks','transactions','dvMappingStatus','dvSaveMapping','forecast','dvContinue','dvStart','dvBatch','dvDetail','dvDiscover','dvInspect','status','configure','preview','confirm','summary','list','numberMappings','mapNumber','mappings','projects','map','orders','poDetail','configureInvoices','invoices'];
  if(!actions.includes(input.action))throw new Error('Invalid finance operation.');
  const admin=['recalculatePOHeaders','applyNameLinks','applyCodeLinks','dvMappingStatus','dvSaveMapping','dvContinue','dvStart','dvBatch','dvDiscover','dvInspect','configure','preview','confirm','numberMappings','mapNumber','mappings','projects','map','configureInvoices'];
  if(admin.includes(input.action)&&user.role!=='admin')return Response.json({error:'Administrator access required.'},{status:403});
  if(input.action==='recalculatePOHeaders')return Response.json(await recalculateBlankPOHeaders(base44));
  if(input.action==='dvMappingStatus')return Response.json(await financeMappingStatus(base44));
  if(input.action==='dvSaveMapping')return Response.json(await saveFinanceFieldMapping(base44,user,input));
  if(input.action==='dvDiscover')return Response.json(await discoverFinanceTables(base44));
  if(input.action==='dvInspect')return Response.json(await inspectFinanceTable(base44,input.logical));
  if(input.action==='dvContinue')return Response.json(await continueFinanceSync(base44,input));
  if(input.action==='dvStart')return Response.json(await startFinanceSync(base44));
  if(input.action==='dvBatch')return Response.json(await syncFinanceBatch(base44,input));

  const privilegedState=admin.includes(input.action)||['projectOrders','projectOrderDetail','projectOrderCashFlow'].includes(input.action);
  const importedPowerBI=await powerBIOrderState(base44),powerBI=publishedPowerBIState(importedPowerBI);
  const state=powerBI;

  const scope=await commercialAccessScope(base44,user,state),reporting=scope.client;
  if(input.action==='pipeline')return Response.json(await commercialPipelineSummary(reporting));
  if(input.action==='balanceTrend')return Response.json(await readPowerBIBalanceTrend(base44,state,input,scope));
  
  if(['balanceSummary','balanceInvoices'].includes(input.action))return Response.json(await readPowerBIBalances(base44,user,state,input,scope));
  if(input.action==='status')return Response.json({source:'powerbi',configured:Boolean(importedPowerBI),confirmed:Boolean(powerBI),restricted:scope.restricted,sync:scope.restricted&&powerBI?{active_generation:powerBI.active_generation,last_completed_at:powerBI.last_completed_at,status:powerBI.status}:powerBI,report:powerBI?{name:powerBI.report_name,...(!scope.restricted?{url:powerBI.report_url}:{})}:null});
  if(['summary','list','orders','invoices','transactions','dvDetail'].includes(input.action)&&!powerBI)throw new Error('Complete and activate the Power BI order import before loading finance reporting. Dataverse finance is no longer used by these views.');
  if(['projectOrders','projectOrderDetail','projectOrderCashFlow'].includes(input.action))return Response.json(await readProjectFinanceOrders(reporting,state,input));
  if(input.action==='applyNameLinks')return Response.json(await applyLegacyFinanceNameMappings(base44,state,input));
  if(input.action==='applyCodeLinks')return Response.json(await applyWorkbookFinanceMappings(base44,state,input));
  if(input.action==='forecast')return Response.json(await readFinanceForecast(reporting,user,state,input));
  if(powerBI){
   if(input.action==='status')return Response.json({source:'powerbi',configured:true,confirmed:true,sync:powerBI,report:{name:powerBI.report_name,url:powerBI.report_url}});
   if(input.action==='summary'){
    const key=JSON.stringify(['finance-summary-v2',user.id,user.role,powerBI.namespace,powerBI.active_generation,powerBI.last_completed_at,scope.projectIds]);
    return Response.json(await scopedReadCache(key,()=>readPowerBIOrderFinance(reporting,scope.restricted?{...powerBI,tables:{list:[]}}:powerBI,input)));
   }
   if(['transactions','list','orders','invoices','dvDetail'].includes(input.action))return Response.json(await readPowerBIOrderFinance(reporting,scope.restricted?{...powerBI,tables:{list:[]}}:powerBI,input));
  }
  if(state){
      if(input.action==='numberMappings')return Response.json(await readProjectNumberMappings(base44,state,input));
      if(input.action==='mapNumber')return Response.json(await saveProjectNumberMapping(base44,user,input,state));
      if(input.action==='status')return Response.json({source:'dataverse',configured:true,confirmed:Boolean(state.active_generation),sync:state,report:state.active_generation?{name:'Dataverse finance tables',url:null}:null});
   if(input.action==='map')return Response.json(await saveFinanceMapping(base44,user,input,{dataset_id:state.namespace}));
   if(input.action==='mappings')return Response.json(await base44.entities.FinanceProjectMapping.filter({dataset_id:state.namespace,...(input.status==='review'?{status:{$in:['unmatched','ambiguous']}}:input.status==='linked'?{status:{$in:['manual','automatic']}}:{})},{limit:50,sort:'-updated_date',...(input.cursor?{cursor:input.cursor}:{})}));
   if(['transactions','summary','list','orders','invoices','dvDetail'].includes(input.action)){if(!state.active_generation)throw new Error('The first Dataverse finance sync is still running; figures will appear after all tables finish.');return Response.json(await readDataverseFinance(base44,state,input));}
  }
  if(scope.restricted)return Response.json({error:'This operation is not available within project-scoped Commercial access.'},{status:403});
  const db=base44.asServiceRole.entities;
  let config=(await db.FinanceConnection.filter({key:'primary'},{limit:1})).items[0]||null;
  const confirmed=Boolean(config?.revision&&config.confirmed_revision===config.revision);
  if(input.action==='status')return Response.json({configured:Boolean(config?.dataset_id),confirmed,report:confirmed?{name:config.report_name,url:config.report_url,confirmed_at:config.confirmed_at}:null,...(user.role==='admin'?{config}:{})});
  if(input.action==='configure'){
   const address=reportAddress(input.reportURL),sources=validateSources(input.sources),token=await powerToken(base44);
   const report=await powerRequest(token,`groups/${address.workspace_id}/reports/${address.report_id}`);
   if(!/^[0-9a-f-]{36}$/i.test(report.datasetId||''))throw new Error('This report does not expose a supported semantic model.');
   const values={key:'primary',...address,dataset_id:report.datasetId,report_name:report.name,sources,revision:crypto.randomUUID(),preview_revision:'',confirmed_revision:''};
   const result=await db.FinanceConnection.upsert([values],{key:'key'});return Response.json({config:result.records[0],notice:'Report found. Preview the model data and confirm it before publishing figures.'});
  }
  if(input.action==='projects'){
   const search=String(input.search||'').trim().slice(0,120);if(search.length<2)return Response.json({items:[]});
   const pattern=search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   return Response.json(await base44.entities.Project.filter({$or:[{name:{$regex:pattern,$options:'i'}},{project_number:{$regex:pattern,$options:'i'}}]},{limit:30,fields:['name','project_number','dataverse_id']}));
  }
  if(!config?.dataset_id)throw new Error('An administrator must configure the Power BI report first.');
  if(input.action==='preview'){
   const token=await powerToken(base44),summary=(await powerQuery(token,config.dataset_id,summaryDax(config.sources)))[0];
   const rows=await resolveFinanceProjects(base44,config,(await powerQuery(token,config.dataset_id,projectsDax(config.sources))).slice(0,10));
   await db.FinanceConnection.update(config.id,{preview_revision:config.revision,previewed_at:new Date().toISOString()});
   return Response.json({summary,rows,revision:config.revision,read_at:new Date().toISOString()});
  }
  if(input.action==='confirm'){
   if(config.preview_revision!==config.revision||input.revision!==config.revision)throw new Error('Preview the current report configuration before confirming it.');
   await db.FinanceConnection.update(config.id,{confirmed_revision:config.revision,confirmed_at:new Date().toISOString(),confirmed_by:user.id});return Response.json({notice:'Verified report configuration is now the dashboard’s primary reporting source.'});
  }
  if(input.action==='configureInvoices'){
   const invoices=await validateFinanceInvoices(base44,input.fields||{});await db.FinanceConnection.update(config.id,{invoices});return Response.json({notice:'Sales-invoice fields verified against live Dataverse metadata.'});
  }
  // A shared Power BI model cannot enforce this app's entity RLS. Non-admin reporting uses the protected snapshot only.
  if(user.role!=='admin'&&['summary','list','orders'].includes(input.action))return Response.json({error:'Commercial reporting requires the RLS-protected Dataverse snapshot. Ask an administrator to complete the sync.'},{status:403});
  if(!confirmed)throw new Error('The administrator must preview and confirm the selected Power BI data before reporting.');
  if(input.action==='map')return Response.json(await saveFinanceMapping(base44,user,input,config));
  if(input.action==='mappings'){
   const query={dataset_id:config.dataset_id,...(input.status==='review'?{status:{$in:['unmatched','ambiguous']}}:input.status==='linked'?{status:{$in:['automatic','manual']}}:{})};
   return Response.json(await base44.entities.FinanceProjectMapping.filter(query,{limit:50,sort:'-updated_date',...(input.cursor?{cursor:input.cursor}:{})}));
  }
  if(input.action==='poDetail')return Response.json(await financePODetail(base44,input));
  if(['orders','invoices'].includes(input.action)){
   const mapping=(await db.FinanceProjectMapping.filter({dataset_id:config.dataset_id,source_key:String(input.sourceKey||'')},{limit:1})).items[0];if(!mapping)throw new Error('Refresh the source-project list before opening transactions.');
   if(input.action==='invoices')return Response.json(await liveFinanceInvoices(base44,config,mapping,input));
   if(!['SO','PO'].includes(input.type))throw new Error('Choose SO or PO.');
   if(String(input.after||'').length>500)throw new Error('Invalid order page.');
   const rows=await powerQuery(await powerToken(base44),config.dataset_id,ordersDax(config.sources[input.type],mapping,input.after||'')),shown=rows.slice(0,50);
   return Response.json({items:await reconcileOrders(base44,input.type,shown,mapping),has_more:rows.length>50,next:rows.length>50?shown.at(-1).Reference:null,read_at:new Date().toISOString()});
  }
  const token=await powerToken(base44);
  if(input.action==='summary')return Response.json({summary:(await powerQuery(token,config.dataset_id,summaryDax(config.sources)))[0],read_at:new Date().toISOString()});
  if(String(input.search||'').length>120||String(input.after?.name||'').length>500||String(input.after?.code||'').length>250)throw new Error('Search or page value too long.');
  const rows=await powerQuery(token,config.dataset_id,projectsDax(config.sources,input)),shown=rows.slice(0,50);
  return Response.json({items:await resolveFinanceProjects(base44,config,shown),has_more:rows.length>50,next:rows.length>50?{name:shown.at(-1).Project,code:shown.at(-1).Code}:null,read_at:new Date().toISOString()});
 }catch(error){return Response.json({error:error.message||'Unable to load finance data.'},{status:400});}
}