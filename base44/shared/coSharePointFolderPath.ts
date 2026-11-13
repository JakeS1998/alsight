import {fail} from './coCore.ts';
import {resolveProjectFolderAlias} from './coProjectFolderAlias.ts';
export async function resolveSharePointFolderPath(graph,url,projectNumber=''){
 const path=decodeURIComponent(url.searchParams.get('id')||url.searchParams.get('RootFolder')||url.pathname).replace(/^\/:[a-z]+:\/r\//i,'/');
 const match=path.match(/^\/(sites|teams)\/([^/]+)(\/.*)?$/i);
 if(!match||/\/Forms\/[^/]+\.aspx$/i.test(path))fail('This sharing link cannot be resolved. Save the folder’s direct SharePoint path or check access.');
 const sitePath=`/${match[1]}/${match[2]}`;
 const site=await graph(`/v1.0/sites/${encodeURIComponent(url.hostname)}:${sitePath.split('/').map(encodeURIComponent).join('/')}`);
 let next=`/v1.0/sites/${encodeURIComponent(site.id)}/drives?$select=id,webUrl&$top=100`,drive=null,base='';
 for(let n=0;next&&n<5;n++){
  const page=await graph(next);
  for(const item of page.value||[]){const p=decodeURIComponent(new URL(item.webUrl).pathname).replace(/\/$/,'');if((path===p||path.startsWith(p+'/'))&&p.length>base.length){drive=item;base=p;}}
  next=page['@odata.nextLink']||'';
 }
 if(!drive)fail('The project folder’s document library is not accessible to the connected SharePoint account.');
 const relative=path.slice(base.length).replace(/^\//,'');
 const folder=await graph(`/v1.0/drives/${encodeURIComponent(drive.id)}/root${relative?':/'+relative.split('/').map(encodeURIComponent).join('/'):''}`).catch(error=>error.status===404&&projectNumber?resolveProjectFolderAlias(graph,drive.id,relative,projectNumber):Promise.reject(error));
 if(!folder.folder)fail('The project link points to a file, not a folder.');
 return{...folder,parentReference:{...folder.parentReference,driveId:drive.id}};
}