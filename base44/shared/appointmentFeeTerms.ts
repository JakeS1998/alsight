import {projectSharePointReads} from './projectSharePointReads.ts';
export async function appointmentFeeTerms(base44,contracts,account,projects){
 const result=new Map(),references=contracts.filter(c=>c.document_type).map(c=>c.document_id).filter(Boolean);
 if(!references.length)return result;
 const aliases=[account.id,account.dataverse_id].filter(Boolean),refs=projects.flatMap(p=>[p.id,p.dataverse_id].filter(Boolean));
 const [documents,dmas]=await Promise.all([base44.entities.LegalDocument.filter({document_id:{$in:references},account_id:{$in:aliases},executed:'yes'},{limit:80}),base44.entities.DMA.filter({project_id:{$in:refs},executed:'yes'},{limit:80,fields:['project_id']})]);
 if(documents.has_more||dmas.has_more)throw new Error('Appointment evidence exceeds the bounded contract page.');
 const eligible=documents.items.filter(d=>!dmas.items.some(dma=>projects.some(p=>[p.id,p.dataverse_id].includes(d.project_id)&&[p.id,p.dataverse_id].includes(dma.project_id))));
 if(!eligible.length)return result;
 const saved=await base44.asServiceRole.entities.AppointmentFeeExtraction.filter({appointment_id:{$in:eligible.map(d=>d.id)},status:'ready'},{limit:80});
 if(saved.has_more)throw new Error('Too many appointment fee extractions for safe attribution.');
 if(!saved.items.length)return result;
 const reads=await projectSharePointReads(base44);
 for(const document of eligible){
  const matches=saved.items.filter(e=>e.appointment_id===document.id&&e.account_id===document.account_id&&e.document_type===document.document_type&&e.appointment_link===(document.link_to_file || ''));
  if(matches.length!==1)continue;
  const evidence=matches[0];
  const project=projects.find(p=>[p.id,p.dataverse_id].includes(document.project_id));
  if(!project||project.id!==evidence.project_id||!(evidence.amount>0)||!evidence.page||!evidence.quote)continue;
  try{
   const meta=await reads.resolve(evidence.source_url),live=await reads.graph(`/drives/${meta.parentReference.driveId}/items/${meta.id}?$select=id,eTag`);
   if(live.id!==evidence.source_id||live.eTag!==evidence.source_etag)continue;
   result.set(`${document.project_id}:${document.document_type}:${document.document_id}`,{value:evidence.amount,source:`Executed ${document.document_id}, signed appointment PDF page ${evidence.page}: ${evidence.quote}. OCR-derived company-specific fee; VAT excluded by assumption, not independently verified.`,source_url:evidence.source_url,source_page:evidence.page,source_etag:evidence.source_etag});
  }catch(error){if(!String(error.message).includes('SharePoint')&&!String(error.message).includes('sync'))throw error;}
 }
 return result;
}