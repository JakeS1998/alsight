import React from 'react';
const inputClass='mt-2 w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export default function QuestionnaireField({field,value,onChange,disabled,invalid}) {
 if(field.id==='access_signature')return null;
 if(field.type==='heading')return <h4 className="border-b border-border pb-2 pt-4 font-semibold">{field.label}</h4>;
 const id=`pq-${field.id}`;
 if(field.type==='checklist')return <fieldset className="space-y-3"><legend className="text-sm font-medium">{field.label}</legend><div className="grid gap-3 sm:grid-cols-2">{field.options.map(option=><label key={option} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={(value||[]).includes(option)} onChange={event=>onChange(event.target.checked?[...(value||[]),option]:(value||[]).filter(item=>item!==option))} />{option}</label>)}</div></fieldset>;
 const props={id,value:value??'',disabled,'aria-invalid':invalid||undefined,'aria-describedby':invalid?`${id}-error`:undefined,onChange:event=>onChange(event.target.value),className:inputClass};
 return <div><label htmlFor={id} className="text-sm font-medium">{field.label}{field.required&&<span className="text-destructive"> *</span>}</label>
 {field.type==='textarea'?<textarea {...props} rows={3} maxLength={4000}/>:field.type==='select'?<select {...props}><option value="">Not recorded</option><option>Yes</option><option>No</option><option>N/A</option></select>:<input {...props} type={field.type} min={field.type==='number'?0:undefined} maxLength={field.type==='text'?1000:undefined}/>}
 {invalid&&<p id={`${id}-error`} className="mt-1 text-sm text-destructive">Please complete this field, or enter N/A where applicable.</p>}</div>;
}