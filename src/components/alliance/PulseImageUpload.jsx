import React,{useId,useState} from 'react';
import {ImagePlus,X} from 'lucide-react';
import {base44} from '@/api/base44Client';
import PulseImage from '@/components/alliance/PulseImage';

export default function PulseImageUpload({images=[],onChange,onBusyChange,disabled}) {
  const id=useId(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const upload=async event=>{
    const files=Array.from(event.target.files || []);event.target.value='';setError('');
    if(!files.length) return;
    if(images.length+files.length>4) {setError('Choose up to four images per post.');return;}
    if(files.some(file=>!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type) || !/\.(png|jpe?g|webp|gif)$/i.test(file.name) || file.size>5*1024*1024)) {setError('Choose JPG, PNG, WebP or GIF images, up to 5 MB each.');return;}
    setBusy(true);onBusyChange(true);
    try {
      const added=await Promise.all(files.map(async file=>{
        const {file_uri}=await base44.integrations.Core.UploadPrivateFile({file});
        return {file_uri,name:file.name.slice(0,200)};
      }));
      onChange([...images,...added]);
    } catch(error) {setError(error.message || 'Unable to upload your images. Please try again.');}
    finally {setBusy(false);onBusyChange(false);}
  };
  return <section className="space-y-3" aria-label="Post images">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold">Images</p><label htmlFor={id} className={`inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-semibold ${disabled || busy || images.length===4 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-secondary'}`}><ImagePlus className="h-4 w-4"/>{busy ? 'Uploading…' : 'Add images'}</label><input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={disabled || busy || images.length===4} onChange={upload}/></div>
    <p className="text-xs text-muted-foreground">Up to four images, 5 MB each. Shared privately with people who can view this post.</p>
    {busy && <p role="status" className="text-xs text-muted-foreground">Uploading your images…</p>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {!!images.length && <div className="grid grid-cols-2 gap-3">{images.map((image,index)=><div key={image.file_uri} className="relative min-w-0"><PulseImage image={image} className="aspect-square w-full"/><button type="button" aria-label={`Remove ${image.name}`} disabled={disabled || busy} className="absolute right-2 top-2 rounded-full border border-border bg-card p-1.5 disabled:opacity-50" onClick={()=>onChange(images.filter((_,position)=>position!==index))}><X className="h-4 w-4"/></button><p className="mt-1 truncate text-[10px] text-muted-foreground">{image.name}</p></div>)}</div>}
  </section>;
}