import {fail} from './coCore.ts';
export async function resolveProjectFolderAlias(graph,driveId,relative,projectNumber){
 if(!/^PROJ\d{1,12}$/i.test(projectNumber||''))fail('The saved folder was not found. Confirm its current SharePoint link.',404);
 const prefix=`/v1.0/drives/${encodeURIComponent(driveId)}`,segments=relative.split('/').filter(Boolean);
 if(!segments.length||segments.length>12)fail('Confirm a direct project folder link.',404);
 let folder=await graph(`${prefix}/root?$select=id,name,folder,parentReference,webUrl`);
 for(const segment of segments){
  if(segment==='.'||segment==='..')fail('Invalid project folder path.');
  const parent=folder;
  try{folder=await graph(`${prefix}/items/${encodeURIComponent(parent.id)}:/${encodeURIComponent(segment)}?$select=id,name,folder,parentReference,webUrl`);}
  catch(error){
   if(error.status!==404)throw error;
   const expected=`${segment}_${projectNumber}`.toLowerCase();let next=`${prefix}/items/${encodeURIComponent(parent.id)}/children?$select=id,name,folder,parentReference,webUrl&$top=100`,matches=[];
   for(let page=0;next&&page<5;page++){
    const data=await graph(next);matches.push(...(data.value||[]).filter(item=>item.folder&&item.name?.toLowerCase()===expected));next=data['@odata.nextLink']||'';
   }
   if(next||matches.length!==1)fail(`The saved folder was not found and no unique ${projectNumber} folder match is available. Confirm the current folder link; no substitute was selected.`,404);
   folder=matches[0];
  }
  if(!folder.folder)fail('The project link points to a file, not a folder.');
 }
 return {...folder,parentReference:{...folder.parentReference,driveId}};
}