import React from 'react';
import {DialogContent as StandardDialogContent,DialogPortal,DialogOverlay} from '@/components/ui/dialog';
import FormPanelSurface from '@/components/forms/FormPanelSurface';
export {Dialog,DialogTrigger,DialogClose,DialogHeader,DialogFooter,DialogTitle,DialogDescription,DialogPortal,DialogOverlay} from '@/components/ui/dialog';
export const DialogContent=React.forwardRef(function DialogContent({formPanel=true,...props},ref){
 if(!formPanel)return <StandardDialogContent ref={ref} {...props}/>;
 return <DialogPortal><DialogOverlay/><FormPanelSurface ref={ref} {...props}/></DialogPortal>;
});
export default DialogContent;