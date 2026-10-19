import React, {useContext, useEffect, useId} from 'react';
import {Image} from '@/components/ui/image';
import {KpiArtworkContext} from '@/components/metrics/KpiIllustrationProvider';
import {artworkSubject, kpiArtwork} from '@/components/metrics/kpiArtwork';
import '@/components/metrics/kpi-illustrations.css';
export default function KpiIllustration({label='',variant}){
 const id=useId(),context=useContext(KpiArtworkContext);
 const preferred=kpiArtwork[variant] ? variant : artworkSubject(label);
 const register=context?.register,unregister=context?.unregister;
 useEffect(()=>{
  if(!register)return;
  register(id,preferred);
  return ()=>unregister(id);
 },[id,preferred,register,unregister]);
 const src=context ? context.assignments[id]?.src : kpiArtwork[preferred];
 return <span className="alsight-kpi-art" aria-hidden="true">{src && <Image src={src} alt="" className="alsight-kpi-drawing" fittingType="fill" focalPointX={0.8} focalPointY={0.6} loading="lazy"/>}</span>;
}