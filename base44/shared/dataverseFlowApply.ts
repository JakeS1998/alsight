import { propagateFlowProjectAccess } from './dataverseProjectReferences.ts';
import {isLoiDocument} from './loiDocumentType.ts';
import {syncDocumentApprovals} from './documentApprovalSync.ts';
import {refreshInsuranceAccountAccess} from './supplierInsuranceReferences.ts';
import {projectValueSyncUpdates} from './projectValueSyncUpdates.ts';
import {withUKLFRecordLease} from './uklfRecordLease.ts';
import {createMissingUKLFRecords} from './uklfRecordCreation.ts';
import {uklfProjectFields} from './uklfRecordValues.ts';
import {receiveProjectApproval,projectCounter} from './projectApprovalIntake.ts';
export async function applyFlowUpdates(base44, table, spec, updates, appliedReviews, sourceIds=updates.map(row=>row.dataverse_id)) {
  if (table === 'users') {
    for (let start = 0; start < updates.length; start += 4) {
      await Promise.all(updates.slice(start, start + 4).map(({ id, ...values }) => base44.entities.User.update(id, values)));
    }
  } else if (updates.length) {
    const values=table==='projects' ? await projectValueSyncUpdates(base44,updates) : updates;
    if(table==='documents') {
      // Execution transitions must use single writes so the LOI workflow fires.
      const page=await base44.entities.LegalDocument.filter({dataverse_id:{$in:values.map(row=>row.dataverse_id)}},{limit:100,fields:['dataverse_id','document_type','executed','comments']});
      if(page.has_more)throw new Error('Document transition check exceeds the sync batch limit.');
      const existing=new Map(page.items.map(row=>[row.dataverse_id,row])),bulk=[];
      for(const {id,...value} of values) {
        const previous=existing.get(value.dataverse_id),document={...previous,...value};
        if(value.executed==='yes' && previous?.executed!=='yes' && isLoiDocument(document)) {
          if(previous)await base44.entities.LegalDocument.update(previous.id,value);
          else await base44.entities.LegalDocument.create(value);
        }else bulk.push(value);
      }
      if(bulk.length)await base44.entities[spec.entity].upsert(bulk,{key:'dataverse_id'});
    }else await base44.entities[spec.entity].upsert(values.map(({ id, ...value }) => value), { key: 'dataverse_id' });
  }
  if (table === 'projects' && updates.length) {
    await propagateFlowProjectAccess(base44, updates);
    const approvalCounter=await projectCounter(base44);
    const approvalProjects=await base44.asServiceRole.entities.Project.filter({dataverse_id:{$in:sourceIds},created_date:{$gte:approvalCounter.enabled_from}},{limit:100,fields:['created_date']});
    if(approvalProjects.has_more)throw new Error('Project approval sync exceeds its safe batch limit.');
    for(const project of approvalProjects.items)await receiveProjectApproval(base44,project.id);
    const projects=await base44.entities.Project.filter({dataverse_id:{$in:sourceIds},procurement_route:true},{limit:100,fields:uklfProjectFields});
    if(projects.has_more)throw new Error('UKLF project sync exceeds its safe batch limit.');
    if(projects.items.length)await withUKLFRecordLease(base44,(_,assertLease)=>createMissingUKLFRecords(base44,projects.items,assertLease));
  }
  if (table === 'accounts' && updates.length) {
    const accounts = await base44.entities.Account.filter({dataverse_id:{$in:updates.map(a=>a.dataverse_id)}},{limit:50,fields:['dataverse_id','linked_user_id']});
    await refreshInsuranceAccountAccess(base44, accounts.items);
  }
  if (['documents','dma','warranties'].includes(table) && sourceIds.length) {
    const page=await base44.entities[spec.entity].filter({dataverse_id:{$in:sourceIds}},{limit:50});
    await syncDocumentApprovals(base44,table,page.items);
  }
  if (appliedReviews.length) await base44.entities.DataverseSyncReview.bulkUpdate(appliedReviews.map(id => ({ id, status: 'applied', error: '', applied_at: new Date().toISOString() })));
}