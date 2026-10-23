import React,{useLayoutEffect,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import PortalOverflowMenu from '@/components/navigation/PortalOverflowMenu';
export default function OverflowNavigation({children}) {
 const items=React.Children.toArray(children),navRef=useRef(null),measureRef=useRef(null);
 const [visible,setVisible]=useState(0);
 useLayoutEffect(()=>{
  const nav=navRef.current,measure=measureRef.current;let mounted=true;
  const update=()=>{
   if(!mounted||!nav.clientWidth)return;
   const boxes=Array.from(measure.children),more=boxes.pop().getBoundingClientRect().width;
   const widths=boxes.map(box=>box.getBoundingClientRect().width),gap=parseFloat(getComputedStyle(nav).columnGap)||0;
   const available=nav.clientWidth,total=widths.reduce((sum,width)=>sum+width,0)+Math.max(0,widths.length-1)*gap;
   let count=widths.length;
   if(total>available){count=0;let used=more;for(const width of widths){if(used+gap+width>available)break;used+=gap+width;count++;}}
   setVisible(count);
  };
  const observer=new ResizeObserver(update);observer.observe(nav);observer.observe(measure);update();
  document.fonts?.ready.then(update);
  return()=>{mounted=false;observer.disconnect();};
 },[children]);
 return <nav ref={navRef} aria-label="Main navigation" className="portal-navigation hidden min-w-0 items-center lg:flex">
  {items.slice(0,visible)}
  {visible<items.length&&<PortalOverflowMenu items={items.slice(visible)}/>}
  <div ref={measureRef} className="portal-nav-measure" aria-hidden="true" inert="">
   {items.map(item=><span key={item.key} className="inline-flex">{item}</span>)}
   <span className="inline-flex"><button type="button" tabIndex={-1} className="portal-nav-item">More<ChevronDown className="h-4 w-4"/></button></span>
  </div>
 </nav>;
}