import {flowRequest} from './dataverseFlowApi.ts';
import {isGuid,isName} from './dataverseFlowFields.ts';
export const endingReasons=['Budget','Political','Insurance','Planning','Cabinet','Community','Other'];
export async function projectEndPlan(context){
 const {environment,token,settings,sourceId}=context;
 const request=path=>flowRequest(environment,token,path);
 const cache=new Map();
 const metadata=name=>{
  if(!isName(name))throw new Error('Invalid related table.');
  if(!cache.has(name))cache.set(name,(async()=>{
   const meta=await request(`EntityDefinitions(LogicalName='${name}')?$select=LogicalName,EntitySetName,PrimaryIdAttribute,IsCustomEntity,IsActivity&$expand=OneToManyRelationships($select=ReferencingEntity,ReferencingAttribute)`);
   if(meta.OneToManyRelationships?.['@odata.nextLink']||meta['OneToManyRelationships@odata.nextLink'])throw new Error('Related table discovery is incomplete. No records changed.');
   return meta;
  })());
  if(cache.size>80)throw new Error('This project exceeds the safe related-table limit. No records changed.');
  return cache.get(name);
 };
 const root=await metadata(settings.logicalName);
 if(root.EntitySetName!==settings.entitySet||root.PrimaryIdAttribute!==settings.primaryId)throw new Error('Project mapping changed. Ask an administrator to review it.');
 const entries=new Map(),retained=new Set(),queue=[{meta:root,ids:[sourceId],root:true}],visited=new Set();
 while(queue.length){
  const group=queue.shift(),meta=group.meta;
  if(!isName(meta.EntitySetName)||!isName(meta.PrimaryIdAttribute))throw new Error('Unsupported related table.');
  const stateData=await request(`EntityDefinitions(LogicalName='${meta.LogicalName}')/Attributes/Microsoft.Dynamics.CRM.StateAttributeMetadata?$select=LogicalName&$expand=OptionSet($select=Options)`);
  const state=stateData.value?.find(a=>a.LogicalName==='statecode');
  const inactive=state?.OptionSet?.Options?.find(o=>String(o.InvariantName).toLowerCase()==='inactive');
  const select=[meta.PrimaryIdAttribute,...(state?['statecode']:[]),...(group.root?settings.mappings.filter(m=>['comments','live_project'].includes(m.local)).map(m=>m.source):[])].join(',');
  const query=group.root?`${meta.EntitySetName}(${sourceId})?$select=${select}`:`${meta.EntitySetName}?$select=${select}&$filter=${encodeURIComponent(group.filter)}&$top=801`;
  const data=await request(query);
  if(data['@odata.nextLink'])throw new Error('Too many linked records to end safely in one transaction. No records changed.');
  const rows=group.root?[data]:data.value||[];
  if(rows.length&&!inactive)throw new Error(`${meta.LogicalName} has linked records but no Inactive state. Dataverse must support deactivation for every linked business record before this project can end. No records changed.`);
  const discovered=[];
  for(const row of rows){
   const id=row[meta.PrimaryIdAttribute],key=`${meta.LogicalName}:${id}`;
   if(!isGuid(id))throw new Error('Invalid Dataverse record identity.');
   if(visited.has(key))continue;
   visited.add(key);discovered.push(id);
   const etag=row['@odata.etag'];
   if(!/^W\/"[0-9]+"$/.test(etag||''))throw new Error('Dataverse did not return a safe record version.');
   entries.set(key,{entity:meta.LogicalName,entitySet:meta.EntitySetName,id,etag,inactive:inactive.Value,status:inactive.DefaultStatus,currentState:row.statecode,root:group.root,values:group.root?row:null});
  }
  if(entries.size>800)throw new Error('Too many linked records to end safely in one transaction. No records changed.');
  if(!discovered.length)continue;
  const relationships=meta.OneToManyRelationships||[];
  for(let start=0;start<relationships.length;start+=5){
   const children=await Promise.all(relationships.slice(start,start+5).map(async rel=>{
    if(!isName(rel.ReferencingEntity)||!isName(rel.ReferencingAttribute))throw new Error('Invalid Dataverse relationship metadata.');
    // Follow project-owned business children, never parent organisations, people, users or system history.
    if(['account','contact','systemuser','team','businessunit'].includes(rel.ReferencingEntity))return null;
    const child=await metadata(rel.ReferencingEntity);
    if(!child.IsCustomEntity&&!child.IsActivity){retained.add(child.LogicalName);return null;}
    return {meta:child,filter:discovered.map(id=>`_${rel.ReferencingAttribute}_value eq ${id}`).join(' or ')};
   }));
   queue.push(...children.filter(Boolean));
  }
 }
 const records=[...entries.values()],tableCounts={};
 for(const row of records)tableCounts[row.entity]=(tableCounts[row.entity]||0)+1;
 const canonical=records.map(r=>`${r.entity}:${r.id}:${r.etag}`).sort().join('|');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 return {records,hash,tableCounts,retained:[...retained]};
}