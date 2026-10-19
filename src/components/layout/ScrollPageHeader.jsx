import React, {useLayoutEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Image} from '@/components/ui/image';
export default function ScrollPageHeader({children,title,image,imageAlt='',actions}) {
 const ref=useRef(null),[position,setPosition]=useState(null);
 useLayoutEffect(()=>{
  const element=ref.current;
  let compact=false,frame;
  const update=()=>{
   const rect=(element.firstElementChild||element).getBoundingClientRect();
   const styles=window.getComputedStyle(element);
   const top=(parseFloat(styles.getPropertyValue('--portal-header-height'))||64)+(parseFloat(styles.getPropertyValue('--portal-page-header-gap'))||16);
   compact=window.matchMedia('(min-width: 1024px)').matches&&rect.bottom<top-(compact?0:32);
   setPosition(compact?{top,left:rect.left,width:rect.width}:null);
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  const observer=new ResizeObserver(schedule);observer.observe(element);
  update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[]);
 return <div ref={ref} className="min-w-0">{children}{position&&createPortal(
  <div role="region" aria-label={`${typeof title==='string'?title:'Page'} compact header`} className="fixed z-30 isolate flex min-h-[76px] items-center justify-between gap-4 overflow-hidden rounded-hero bg-als-navy px-7 py-4 font-body text-sidebar-foreground shadow-md" style={position}>
   {image&&<div className="absolute inset-y-0 right-0 -z-20 w-[70%]"><Image src={image} alt={imageAlt} className="h-full w-full"/></div>}
   <div className="absolute inset-0 -z-10" style={{background:'linear-gradient(90deg, hsl(var(--als-navy)) 20%, hsl(var(--als-navy) / .9) 42%, hsl(var(--als-navy) / .35) 72%, hsl(var(--als-navy) / .15) 100%)'}}/>
   <p className="min-w-0 font-heading text-2xl font-bold leading-tight">{title}</p>
   {actions&&<div className="flex shrink-0 flex-wrap items-center justify-end gap-2 [&_.border-input]:bg-card [&_.border-input]:text-card-foreground">{actions}</div>}
  </div>,document.body)}</div>;
}