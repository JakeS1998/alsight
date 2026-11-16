export async function dmaSignedFolderFromWord(reads,document) {
 let item=document;
 for(let depth=0;depth<8;depth++) {
  if(item.folder&&/^(?:\d+[.\s]*)?legals signed$/i.test(item.name))return item;
  if(item.folder&&/^(?:\d+[.\s]*)?legals$/i.test(item.name)) {
   const signed=(await reads.children(item)).filter(child=>child.folder&&/^(?:\d+[.\s]*)?legals signed$/i.test(child.name));
   if(signed.length!==1)throw new Error('The linked Word agreement has no unique Legals Signed folder under its Legals folder.');
   return signed[0];
  }
  if(!item.parentReference?.id)break;
  item=await reads.graph(`/drives/${encodeURIComponent(item.parentReference.driveId)}/items/${encodeURIComponent(item.parentReference.id)}?$select=id,name,parentReference,folder,webUrl`);
 }
 throw new Error('Could not trace the linked Word agreement back to its Legals folder.');
}