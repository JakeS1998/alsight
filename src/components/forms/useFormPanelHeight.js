import {useEffect,useRef,useState} from 'react';
export default function useFormPanelHeight(){
 const [height,setHeight]=useState(70),drag=useRef(null),[mobile,setMobile]=useState(()=>window.matchMedia('(max-width:767px)').matches);
 useEffect(()=>{const query=window.matchMedia('(max-width:767px)'),update=()=>setMobile(query.matches);query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 const clamp=value=>Math.min(90,Math.max(50,value));
 return {height,mobile,handle:{role:'slider',tabIndex:0,'aria-label':'Form panel height','aria-orientation':'vertical','aria-valuemin':50,'aria-valuemax':90,'aria-valuenow':Math.round(height),'aria-valuetext':`${Math.round(height)} percent of screen`,
  onPointerDown:event=>{drag.current={y:event.clientY,height,viewport:window.innerHeight};event.currentTarget.setPointerCapture(event.pointerId);},
  onPointerMove:event=>{if(drag.current)setHeight(clamp(drag.current.height+(drag.current.y-event.clientY)/drag.current.viewport*100));},
  onPointerUp:()=>{drag.current=null;},onPointerCancel:()=>{drag.current=null;},
  onKeyDown:event=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;event.preventDefault();setHeight(old=>event.key==='Home'?50:event.key==='End'?90:clamp(old+(event.key==='ArrowUp'?5:-5)));}
 }};
}