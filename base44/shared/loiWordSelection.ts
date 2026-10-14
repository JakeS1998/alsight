function words(value){return String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(word=>word.length>2 && !['the','and','for','als','letter','intent','extension'].includes(word));}
export function selectLoiWord(files,project,document) {
 const hints=[...new Set(words(`${project.name} ${project.project_number} ${document.document_id}`))],extension=/extension/i.test(document.document_type);
 const candidates=files.filter(file=>file.file && /\.docx?$/i.test(file.name) && !file.name.startsWith('~$')).map(file=>{
  const name=file.name.toLowerCase(),tokens=words(name),isLoi=/\bloi\b|letter[\s_-]+of[\s_-]+intent/i.test(name);
  const score=(isLoi?20:0)+hints.filter(h=>tokens.includes(h)).length*4+(/signed|executed|final/.test(name)?3:0)-(/template|example|superseded|old|archive/.test(name)?30:0)-(/draft/.test(name)?3:0)+(extension&&/extension|extend/.test(name)?8:0);
  const version=Number(name.match(/(?:\bv|version\s*)(\d+)\b/i)?.[1]||0);
  return {file,score,version,isLoi};
 }).filter(candidate=>candidate.isLoi && candidate.score>0).sort((a,b)=>b.score-a.score || b.version-a.version);
 if(!candidates.length)return {status:'review_required',reason:'No clearly named LOI Word document found in this folder.'};
 const first=candidates[0],next=candidates[1];
 if(next && first.score===next.score && first.version===next.version)return {status:'review_required',reason:'Several Word documents are equally plausible; confirm the source.',candidates:candidates.slice(0,3).map(c=>({name:c.file.name,url:c.file.webUrl}))};
 return {status:'selected',name:first.file.name,url:first.file.webUrl,reason:'LOI wording, project-name match, extension wording and document version; not modified date.'};
}
export async function readLoiSources(reads,project,documents) {
 const results=[];
 for(const document of documents) {
  try {
   const item=await reads.resolve(document.link_to_file);
   const selected=item.folder?selectLoiWord(await reads.children(item),project,document):{status:'selected',name:item.name,url:item.webUrl,reason:'Direct document link retained.'};
   results.push({documentId:document.document_id,...selected});
  } catch(error){results.push({documentId:document.document_id,status:'review_required',reason:error.message});}
 }
 return results;
}