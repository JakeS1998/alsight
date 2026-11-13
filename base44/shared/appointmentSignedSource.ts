export const appointmentRoles={appointment_pm:/project manager/i,appointment_pd_cdm:/principal designer(?!.*(?:building|regulations|\bbr\b))/i,appointment_pd_br:/principal designer.*(?:building|regulations|\bbr\b)|building.*principal designer/i,appointment_architect:/architect/i};
const pathOf=file=>decodeURIComponent(file.webUrl || '');
export async function appointmentSignedSource(reads,document,project){
 const role=appointmentRoles[document.document_type];if(!role)throw new Error('Unsupported appointment role.');
 const roots=[document.link_to_file,project.link_to_legals].filter(Boolean),errors=[];
 for(const link of roots){
  try{
   let item=await reads.resolve(link);
   if(item.file&&/\.pdf$/i.test(item.name)&&/\/Legals Signed\//i.test(pathOf(item))&&pathOf(item).split('/').slice(0,-1).some(part=>role.test(part)))return reads.graph(`/drives/${item.parentReference.driveId}/items/${item.id}`);
   let signed=null;
   for(let depth=0;depth<8;depth++){
    if(item.folder&&/^Legals Signed$/i.test(item.name)){signed=item;break;}
    if(item.folder){const children=await reads.children(item);const matches=children.filter(c=>c.folder&&/^Legals Signed$/i.test(c.name));if(matches.length===1){signed=matches[0];break;}}
    if(!item.parentReference?.id)break;
    item=await reads.graph(`/drives/${item.parentReference.driveId}/items/${item.parentReference.id}`);
   }
   if(!signed)continue;
   const folders=(await reads.children(signed)).filter(c=>c.folder&&role.test(c.name));
   if(folders.length!==1)throw new Error('Signed appointment role folder is missing or ambiguous.');
   const files=(await reads.children(folders[0])).filter(c=>c.file&&/\.pdf$/i.test(c.name));
   if(files.length!==1)throw new Error('Multiple or no signed appointment PDFs in the role folder; a direct signed file link is required.');
   return reads.graph(`/drives/${files[0].parentReference.driveId}/items/${files[0].id}`);
  }catch(error){errors.push(String(error.message).slice(0,200));}
 }
 throw new Error('No unambiguous signed appointment PDF found in the correct legal role folder. '+errors.join(' ').slice(0,400));
}