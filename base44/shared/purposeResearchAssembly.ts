import {researchFailure,researchText,researchList,researchSourceUrl,researchSourceTitle} from './purposeResearchValidation.ts';
// Sources travel with the evidence they support. Only the application assigns numbers.
function withoutGeneratedCitations(text){
 return text.replace(/\[\s*\d+(?:\s*[,;]\s*\d+)*\s*\]/g,'').replace(/ +([.,;:])/g,'$1').trim();
}
export function assemblePurposeResearch(result){
 const intent=withoutGeneratedCitations(researchText(result?.draft,1000,'Purpose draft',true));
 const evidence=researchList(result?.context,'Local evidence'),warnings=researchList(result?.warnings,'Evidence-gap warnings');
 const sources=[],sourceNumbers=new Map();
 const paragraphs=evidence.map((entry,index)=>{
  const label=`Evidence ${index+1}`,text=withoutGeneratedCitations(researchText(entry?.text,300,`${label} text`,true));
  if(!text)throw researchFailure(`${label} text is empty.`);
  const source=entry?.source,url=researchSourceUrl(source?.url,`${label} source link`).href;
  const title=researchSourceTitle(source?.title,`${label} source title`),year=researchText(source?.year,30,`${label} publication/reporting year`).replace(/[\r\n]/g,' ');
  if(!sourceNumbers.has(url)){sources.push({title,url,year});sourceNumbers.set(url,sources.length);}
  return `${text} [${sourceNumbers.get(url)}]`;
 });
 const context=paragraphs.length?`Local context (not evidence of this project’s delivered outcomes):\n${paragraphs.join('\n\n')}`:'';
 const references=sources.map((source,index)=>`${index+1}. [${source.title}${source.year?` (${source.year})`:''}](${source.url})`).join('\n');
 return {purpose:researchText([intent,context,references?`Sources:\n${references}`:''].filter(Boolean).join('\n\n'),4000,'Combined research draft',true),warnings:warnings.map((warning,index)=>researchText(warning,200,`Evidence-gap warning ${index+1}`,true))};
}