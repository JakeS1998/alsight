import { base44 } from '@/api/base44Client';
export default async function prepareNetworxAttachment(file) {
 const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
 const body=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error(`Unable to read ${file.name}.`));reader.readAsDataURL(file);});
 return {id:crypto.randomUUID(),filename:file.name,size:file.size,file_uri,body};
}