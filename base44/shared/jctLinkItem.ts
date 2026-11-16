export async function jctLinkItem(reads,link) {
 const url=new URL(link);
 if(url.protocol!=='https:'||url.hostname!=='allianceleisureservice.sharepoint.com')throw new Error('Use a saved Alliance SharePoint document link.');
 try {return await reads.resolve(link);}catch(error){if(!/sharing link no longer exists|resource could not be found/i.test(error.message))throw error;}
 const path=decodeURIComponent(url.pathname).replace(/^\/:[bfw]:\/r/,''),site=path.match(/^\/sites\/[^/]+/);
 if(!site)return reads.resolve(link);
 const resolved=await reads.graph(`/sites/${url.hostname}:${site[0]}?$select=id`);
 const drives=await reads.graph(`/sites/${resolved.id}/drives?$select=id,name,webUrl`);
 const matches=drives.value.filter(drive=>{const root=decodeURIComponent(new URL(drive.webUrl).pathname).replace(/\/$/,'');return path===root||path.startsWith(root+'/');});
 if(matches.length!==1)throw new Error('The JCT document library is missing or ambiguous.');
 const drive=matches[0],root=decodeURIComponent(new URL(drive.webUrl).pathname).replace(/\/$/,'');let relative=path.slice(root.length);
 for(let depth=0;depth<6 && relative;depth++) {
  const encoded=relative.split('/').map(encodeURIComponent).join('/');
  try {return await reads.graph(`/drives/${drive.id}/root:${encoded}:?$select=id,name,webUrl,parentReference,folder,file`);}catch(error){if(!/resource could not be found/i.test(error.message))throw error;}
  relative=relative.slice(0,relative.lastIndexOf('/'));
  if(!/\/(?:\d+[.\s]*)?legals(?:\/|$)/i.test(relative))break;
 }
 throw new Error('The saved JCT link and its legal folders could not be located.');
}