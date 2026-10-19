import React,{forwardRef,useRef} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {motion,useReducedMotion} from 'framer-motion';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';
import AliceFormPrefill from '@/components/forms/AliceFormPrefill';
import useFormPanelHeight from '@/components/forms/useFormPanelHeight';
import '@/components/forms/form-panel.css';
const FormPanelSurface=forwardRef(function FormPanelSurface({className,children,alicePrefill=true,style,...props},ref){
 const bodyRef=useRef(null),{height,handle}=useFormPanelHeight(),reduced=useReducedMotion();
 return <DialogPrimitive.Content asChild ref={ref} {...props}><motion.div className="als-form-panel" style={{...style,'--form-panel-height':`${height}dvh`}} initial={reduced?false:{opacity:0,translateY:24}} animate={{opacity:1,translateY:0}} transition={{type:'spring',stiffness:300,damping:28}}>
  <div className="als-form-handle" {...handle}><span/></div>
  <DialogPrimitive.Close className="als-form-close rounded-xl p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="h-5 w-5"/><span className="sr-only">Close form</span></DialogPrimitive.Close>
  {alicePrefill&&<AliceFormPrefill bodyRef={bodyRef}/>}
  <div ref={bodyRef} className={cn(className,'als-form-panel-body')}>{children}</div>
 </motion.div></DialogPrimitive.Content>;
});
export default FormPanelSurface;