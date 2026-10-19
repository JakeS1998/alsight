function labelFor(node){
 const labelled=node.getAttribute('aria-labelledby')?.split(' ').map(id=>document.getElementById(id)?.textContent||'').join(' ');
 if(node.getAttribute('aria-label')||labelled)return node.getAttribute('aria-label')||labelled;
 let label=node.labels?.[0]||node.closest('label');
 if(!label){const parent=node.parentElement;label=parent?.querySelector('label')||parent?.previousElementSibling;if(!label||label.contains(node))label=null;}
 if(label){const copy=label.cloneNode(true);copy.querySelectorAll('input,textarea,select,button,svg').forEach(child=>child.remove());const text=copy.textContent.trim();if(text)return text.slice(0,160);}
 return node.alicePrefill?.label||node.name||node.placeholder||'';
}
export default function aliceFormFields(root){
 return Array.from(root.querySelectorAll('input,textarea,select,[data-alice-lookup]')).filter(node=>!node.closest('[data-alice-input]')&&!node.matches(':disabled')&&!node.readOnly&&node.getClientRects().length&&(node.alicePrefill||!['password','file','hidden','submit','button','reset','search','range','color'].includes(node.type))).map((node,index)=>{
  const custom=node.alicePrefill,label=labelFor(node);if(!label)return null;
  const options=custom?.resolve?undefined:custom?.options|| (node.tagName==='SELECT'?Array.from(node.options).filter(option=>!option.disabled).map(option=>({value:option.value,label:option.text})):undefined);
  const type=custom?(custom.resolve?'lookup':'select'):node.type||'text',value=custom?.value??(['checkbox','radio'].includes(type)?String(node.checked):node.value);
  return {node,before:String(value??''),field:{id:`field_${index}`,label:label.slice(0,160),type,value:String(value??'').slice(0,2000),...(options?{options:options.slice(0,80).map(option=>({value:String(option.value),label:String(option.label).slice(0,160)}))}:{}),...(node.maxLength>0?{maxLength:node.maxLength}:{}),...(node.min?{min:node.min}:{}),...(node.max?{max:node.max}:{})}};
 }).filter(Boolean).slice(0,60);
}