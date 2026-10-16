import React,{useState} from 'react';
import {Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import IEPanel from '@/components/ie/IEPanel';
import IEInlineEditor from '@/components/ie/IEInlineEditor';
export default function IEEditablePanel({title,section,item,canEdit,children,...props}){
 const [editing,setEditing]=useState(false);
 const action=canEdit&&!editing?<Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" aria-label={`Edit ${title.toLowerCase()}`} title={`Edit ${title.toLowerCase()}`} onClick={()=>setEditing(true)}><Pencil className="h-3.5 w-3.5"/></Button>:null;
 return <IEPanel {...props} title={title} actions={action}>{editing&&canEdit?<IEInlineEditor section={section} item={item} onClose={()=>setEditing(false)}/>:children}</IEPanel>;
}