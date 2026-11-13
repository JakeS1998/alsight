import {requireAdmin,configuration,incident,now,safeError,ready} from './coCore.ts';
import {flowConfig,sharedFlowContext,flowRequest} from './dataverseFlowApi.ts';
import {graphClient,drivePath} from './coMicrosoft.ts';
import {isName,isGuid} from './dataverseFlowFields.ts';
export async function diagnoseContingency(b,u,m){
 requireAdmin(m);const started=now(),checks=[],E=b.asServiceRole.entities;
 async function probe(name,work){try{const value=await work();checks.push({name,status:'pass',detail:'Read succeeded.'});return value;}catch(e){checks.push({name,status:'fail',detail:safeError(e)});return null;}}
 const note=(name,status,detail)=>checks.push({name,status,detail});
 note('Administrator permission','pass','Authenticated contingency administration permission confirmed for this account.');
 const c=await probe('Contingency configuration',()=>configuration(b));
 await probe('Incident state',()=>incident(b));
 await probe('Audit journal read',()=>E.COAudit.list({limit:1}));
 const scope=m.global?{}:{id:{$in:m.dataset_ids}},query={...scope,enabled:true};
 const [sources,total]=await Promise.all([probe('Approved source configuration',()=>E.CODataset.filter(query,{sort:'created_date',limit:5})),probe('Approved source count',()=>E.CODataset.count(query))]);
 let dvContext=null,graph=null,cfg=null;
 await Promise.all([probe('Dataverse connection',async()=>{cfg=await flowConfig(b);const ctx=await sharedFlowContext(b,cfg);await flowRequest(ctx.environment,ctx.token,'WhoAmI');dvContext=ctx;return true;}),probe('SharePoint connection',async()=>{const request=await graphClient(b);await request('/v1.0/sites/root?$select=id,webUrl');graph=request;return true;})]);
 if(total===0)note('Source coverage','warning','No enabled approved sources: record replication and document availability cannot yet be checked.');
 else if(typeof total==='number')note('Source coverage',total>5?'warning':'pass',`Checking ${Math.min(total,5)} of ${total} enabled approved sources. At most five sources are inspected per run.`);
 const sampled=sources?.items||[];
 await Promise.all(sampled.map(async d=>{
  const records=await probe(`${d.label}: saved snapshot read`,()=>E.CORecord.filter({dataset_id:d.id},{sort:'-replicated_at',limit:1}));
  const record=records?.items?.[0];if(records&&!record)note(`${d.label}: snapshot availability`,'warning','No copied record is available. This check does not create a copy.');
  if(d.kind==='sharepoint'&&record)note(`${d.label}: private file metadata`,record.file_uri&&!/^https?:/i.test(record.file_uri)&&/^[a-f0-9]{64}$/i.test(record.sha256||'')?'pass':'fail','Checks the saved private-file reference and checksum metadata only; it does not download or verify file contents.');
  const last=Date.parse(d.state?.last_success||'');note(`${d.label}: copy freshness`,Number.isFinite(last)&&!d.state?.error&&Date.now()-last<=d.interval_minutes*60000?'pass':'warning',d.state?.error?safeError({message:d.state.error}):Number.isFinite(last)?`Last completed copy: ${d.state.last_success}.`:'No completed copy has been recorded.');
  if(d.kind==='dataverse'&&dvContext){await probe(`${d.label}: Microsoft record read`,async()=>{if(d.environment!==cfg.environment_url||d.table_key!=='custom'&&cfg.tables?.[d.table_key]?.revision!==d.mapping?.revision)throw new Error('Source environment or mapping changed; review this source.');if(!isName(d.mapping?.entitySet)||!isName(d.mapping?.primaryId))throw new Error('Invalid source mapping.');const id=record?.source_id||d.scope_ids?.[0];if(!isGuid(id)){note(`${d.label}: record sample`,'warning','No approved sample record ID is available; checking table metadata only.');return flowRequest(dvContext.environment,dvContext.token,`EntityDefinitions(LogicalName='${isName(d.mapping.logicalName)?d.mapping.logicalName:'invalid'}')?$select=LogicalName`);}return flowRequest(dvContext.environment,dvContext.token,`${d.mapping.entitySet}(${id})?$select=${d.mapping.primaryId}`);});}
  else if(d.kind==='sharepoint'&&graph)await probe(`${d.label}: Microsoft folder read`,async()=>{const folder=await graph(`${drivePath(d)}?$select=id,name,folder`);if(!folder?.folder)throw new Error('The approved source is not an accessible folder.');return true;});
  else note(`${d.label}: Microsoft source read`,'skipped','Connection check failed; source read was not attempted.');
 }));
 if(c)note('Production acceptance evidence',ready(c)?'pass':'warning',ready(c)?'Existing pilot evidence and two owner approvals are recorded; this diagnostic does not revalidate them.':'Pilot evidence and independent owner approvals are incomplete. This diagnostic does not complete acceptance tests or unlock production.');
 return{started_at:started,completed_at:now(),read_only:true,status:checks.some(x=>x.status==='fail')?'fail':checks.some(x=>x.status==='warning')?'warning':'pass',checks,limitations:['Activation, emergency edits, concurrent approvals, password-only outage sign-in, private-file downloads, restoration and Microsoft write-back are not exercised.','No incident, operating policy, copy, change journal, audit entry or acceptance evidence is created or modified by this check. Results are shown only for this run.']};
}