export async function projectCompletion(base44, project) {
 const page=await base44.entities.ProjectDelivery.filter({project_id:project.id},{sort:'-created_date',limit:1});
 const delivery=page.items[0]||{},missing=[];
 const date=delivery.pc_achieved||project.practical_completion_date;
 if(!date||!Number.isFinite(Date.parse(date))||Date.parse(date)>Date.now())missing.push('Practical completion achieved');
 if(delivery.final_account_status!=='closed')missing.push('Final account closed');
 for(const [key,label] of [['om_manuals','O&M manuals'],['hs_file','Health & safety file'],['warranties_status','Warranties'],['training','Training'],['asset_info','Asset information'],['client_handover','Client handover']])if(delivery[key]!=='complete')missing.push(`${label} complete`);
 if(project.procurement_route!==false){
  const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{projectId:project.id,kpiOnly:true});
  if(data.error)throw new Error(data.error);
  if(data.kpiCompletion?.complete!==true)missing.push('All UKLF KPIs recorded');
 }
 return {ready:missing.length===0,missing,completed:project.status==='inactive'&&String(project.comments||'').includes('[ALS Hub Project Complete]')};
}