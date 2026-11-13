export async function dmaSignedSource(reads,project,dma) {
  const signed=file=>file.file && /\.pdf$/i.test(file.name) && /legals[ %]*20?signed|legals signed/i.test(decodeURIComponent(file.webUrl || ''));
  const roots=[];
  if(dma.link_to_file) roots.push(dma.link_to_file);
  if(project.link_to_legals) roots.push(project.link_to_legals);
  if(dma.link_to_file?.includes('Work%20in%20Progress')) roots.push(dma.link_to_file.replace('Work%20in%20Progress','Signed').replace(/\/[^/?]+\.(docx?|pdf)(\?.*)?$/i,''));
  const visited=new Set(),found=new Map(),errors=[];
  for(const link of [...new Set(roots)]) {
    let root;try {root=await reads.resolve(link);}catch(error){errors.push(String(error.message));continue;}
    if(signed(root)) return reads.graph(`/drives/${root.parentReference.driveId}/items/${root.id}`);
    if(!root.folder) continue;
    const folders=[root];
    for(let n=0;n<folders.length;n++) {
      if(visited.size>=25) throw new Error('Signed DMA discovery exceeds 25 folders; provide a direct signed PDF link.');
      const folder=folders[n],key=`${folder.parentReference.driveId}:${folder.id}`;if(visited.has(key))continue;visited.add(key);
      const children=await reads.children(folder);
      for(const item of children) {
        const path=decodeURIComponent(item.webUrl || '');
        if(item.folder && (/signed|dma/i.test(item.name) || !/work in progress/i.test(path) && n===0))folders.push(item);
        if(signed(item) && (/development management|delivery agreement|\bdma\b/i.test(item.name) || /\/[^/]*dma\//i.test(path)))found.set(item.id,item);
      }
    }
    if(found.size)break;
  }
  if(found.size!==1)throw new Error(found.size ? 'Multiple signed DMA PDFs were found; a direct document link is required.' : 'No unambiguous signed DMA PDF was found in the saved document or project legal links. '+errors.join(' ').slice(0,200));
  const file=[...found.values()][0];return reads.graph(`/drives/${file.parentReference.driveId}/items/${file.id}`);
}