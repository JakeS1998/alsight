import {flowConfig} from './dataverseFlowApi.ts';
import {isGuid} from './dataverseFlowFields.ts';
import {writeFlowContext,loadFlowRecord,saveFlowRecord} from './dataverseFlowWrite.ts';
import {correctedDocumentLinks} from './documentLinkCorrections.ts';
import {roleFlowMappings} from './bsmProjectWriteAccess.ts';
const sources={jct:{entity:'JCT',table:'jct'},dma:{entity:'DMA',table:'dma'},appointment:{entity:'LegalDocument',table:'documents'}};
export async function saveQualityLink(base44,user,input) {
 const source=sources[input.source];
 if(!source||typeof input.recordId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(input.recordId)||typeof input.url!=='string'||input.url.length>2000)throw new Error('Choose a valid document and link.');
 const url=new URL(input.url.trim());
 if(url.protocol!=='https:'||url.hostname!=='allianceleisureservice.sharepoint.com'||url.username||url.password)throw new Error('Use an HTTPS Alliance SharePoint document link.');
 const db=base44.entities,record=await db[source.entity].get(input.recordId);
 const [effective]=await correctedDocumentLinks(db,source.entity,[record]);
 if(input.version!==record.updated_date||input.linkVersion!==(effective.link_version||''))throw new Error('This record changed. Refresh and reopen its link editor.');
 const prior=await db.DocumentLinkCorrection.filter({entity:source.entity,record_id:record.id},{limit:2});
 if(prior.items.length>1)throw new Error('Duplicate local link corrections need review.');
 const config=isGuid(record.dataverse_id)&&record.status!=='inactive'?await flowConfig(base44):null;
 const linkWritable=roleFlowMappings(source.table,config?.tables?.[source.table]?.mappings||[],user.role).some(mapping=>mapping.local==='link_to_file'&&mapping.write===true);
 if(record.status==='inactive'||isGuid(record.dataverse_id)&&!linkWritable) {
  const values={entity:source.entity,record_id:record.id,url:url.href,original_url:record.link_to_file||'',changed_by:user.id};
  if(prior.items[0])await db.DocumentLinkCorrection.update(prior.items[0].id,values);else await db.DocumentLinkCorrection.create(values);
  return {saved:true,notice:record.status==='inactive'?'Saved in ALS Hub only. The inactive source record is unchanged; PDF reconciliation will use this corrected link.':'Saved in ALS Hub only because document-link write-back is disabled. Dataverse is unchanged; read the PDF again to use this corrected link.'};
 }
 let notice='Saved in ALS Hub. Read the document again to reconcile its value.';
 if(isGuid(record.dataverse_id)) {
  const input={action:'save',table:source.table,recordId:record.id,values:{link_to_file:url.href}};
  const context=await writeFlowContext(base44,user,config,input),fresh=await loadFlowRecord(context);
  if(fresh.values.status==='inactive')throw new Error('The source record is now inactive. Refresh its status before saving a local correction.');
  const result=await saveFlowRecord(base44,context,{...input,etag:fresh.etag});
  if(result.refreshRequired)throw new Error(result.notice);
  notice=result.notice;
 } else await db[source.entity].update(record.id,{link_to_file:url.href});
 if(prior.items[0])await db.DocumentLinkCorrection.delete(prior.items[0].id);
 return {saved:true,notice};
}