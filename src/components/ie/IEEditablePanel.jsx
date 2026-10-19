import React from 'react';
import IEInlineEditContext from '@/components/ie/IEInlineEditContext';
import IEPanel from '@/components/ie/IEPanel';

export default function IEEditablePanel({title,section,item,canEdit,children,...props}){
 return <IEPanel {...props} title={title}><IEInlineEditContext.Provider value={{item,canEdit,section}}>{children}</IEInlineEditContext.Provider></IEPanel>;
}