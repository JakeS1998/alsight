import React from 'react';
const privateField=key=>/(password|secret|token|otp|verification.?code|file_uri|file_url)|(^id$|_ids?$)/i.test(key);
const fieldLabel=key=>key.replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,letter=>letter.toUpperCase());
export function submissionRows(values,labels={}){
 return Object.entries(values||{}).filter(([key])=>!privateField(key)).map(([key,value])=>[labels[key]||fieldLabel(key),value]);
}
function renderValue(value){
 if(value==null||value==='')return 'Not provided';
 if(typeof value==='boolean')return value?'Yes':'No';
 if(React.isValidElement(value))return value;
 if(Array.isArray(value))return value.length?<ul className="space-y-2">{value.map((item,index)=><li key={index}>{renderValue(item)}</li>)}</ul>:'None';
 if(typeof value==='object')return <dl className="space-y-1">{submissionRows(value).map(([label,item])=><div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{renderValue(item)}</dd></div>)}</dl>;
 return String(value);
}
export default function SubmissionSummary({rows,title='What you submitted'}){
 if(!Array.isArray(rows)||!rows.length)return null;
 return <section aria-label={title} className="mt-3 w-full min-w-0 rounded-panel border border-border bg-muted/40 p-4 text-left text-foreground">
  <h3 className="text-sm font-semibold">{title}</h3>
  <dl className="mt-3 max-h-[50dvh] space-y-3 overflow-y-auto overscroll-contain text-sm">{rows.filter(([label])=>!privateField(label)).map(([label,value],index)=><div key={`${label}-${index}`} className="min-w-0"><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{renderValue(value)}</dd></div>)}</dl>
 </section>;
}