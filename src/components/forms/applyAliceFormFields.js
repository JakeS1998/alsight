import {flushSync} from 'react-dom';
export default async function applyAliceFormFields(fields,patches){
 let applied=0,unmatched=0;
 for(const patch of patches){
  const entry=fields.find(item=>item.field.id===patch.field);if(!entry)continue;
  const {node,before,field}=entry,custom=node.alicePrefill;if(!node.isConnected||node.matches(':disabled')||node.readOnly)continue;
  const current=String(custom?.value??(['checkbox','radio'].includes(field.type)?node.checked:node.value));if(current!==before)continue;
  const value=String(patch.value);if(value===current)continue;
  if(field.options&&!field.options.some(option=>option.value===value))continue;
  if(field.type==='number'&&(!value.trim()||!Number.isFinite(Number(value))||(field.min!==undefined&&Number(value)<Number(field.min))||(field.max!==undefined&&Number(value)>Number(field.max))))continue;
  if(field.maxLength&&value.length>field.maxLength)continue;
  if(['checkbox','radio'].includes(field.type)){if(!['true','false'].includes(value)||field.type==='radio'&&value==='false')continue;flushSync(()=>node.click());}
  else if(custom?.resolve){const match=await custom.resolve(value);if(!match){unmatched++;continue;}if(!node.isConnected||String(node.alicePrefill?.value??'')!==before)continue;flushSync(()=>node.alicePrefill.onChange(match));if(String(node.alicePrefill?.value??'')===String(match.id))applied++;continue;}
  else if(custom){flushSync(()=>custom.onChange(value));}
  else {
   const prototype=node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:node.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;
   flushSync(()=>{Object.getOwnPropertyDescriptor(prototype,'value').set.call(node,value);node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));});
  }
  const after=String(node.alicePrefill?.value??(['checkbox','radio'].includes(field.type)?node.checked:node.value));if(after===value)applied++;
 }
 return {applied,unmatched};
}