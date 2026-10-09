export function researchFailure(detail){
 return new Error(`ALICE’s generated research was rejected: ${detail} This is not caused by a blank Project purpose field. Please select Research why it matters again; nothing has been saved.`);
}
export function researchText(value,max,label,required=false){
 if(value==null)throw researchFailure(`${label} is missing.`);
 if(typeof value!=='string')throw researchFailure(`${label} must be text.`);
 if(required&&!value.trim())throw researchFailure(`${label} is empty.`);
 if(value.length>max)throw researchFailure(`${label} contains ${value.length} characters; the limit is ${max}.`);
 return value.trim();
}
export function researchList(value,label){
 if(!Array.isArray(value))throw researchFailure(`${label} is missing or is not a list.`);
 if(value.length>3)throw researchFailure(`${label} contains ${value.length} entries; the limit is 3.`);
 return value;
}
export function researchSourceUrl(value,label){
 const text=researchText(value,400,label,true);
 let url;
 try{url=new URL(text);}catch{throw researchFailure(`${label} is not a valid web address.`);}
 if(url.protocol!=='https:'||url.username||url.password)throw researchFailure(`${label} must be an HTTPS link without embedded credentials.`);
 return url;
}