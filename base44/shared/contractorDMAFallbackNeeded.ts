export async function contractorDMAFallbackNeeded(base44,project) {
 const refs=[project.id,project.dataverse_id].filter(Boolean);
 const [proposals,appointments]=await Promise.all([
  base44.entities.FeeProposal.count({project_id:{$in:refs},is_current:true,status:{$ne:'lost'}}),
  base44.entities.LegalDocument.count({project_id:{$in:refs},executed:'yes',document_type:{$in:['appointment_pm','appointment_pd_cdm','appointment_pd_br','appointment_architect']}})
 ]);
 // Legacy entry point now checks professional appointments only; contractors never use DMA fees.
 return !proposals && appointments>0;
}