import React from 'react';
import {ListPlus,FileText,MessageSquare,StickyNote} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuLabel,DropdownMenuSeparator} from '@/components/ui/dropdown-menu';
const actions=[['actions','Add project action',ListPlus],['notes','Add meeting note',StickyNote],['documents','Review project documents',FileText],['comment','Add comment',MessageSquare]];
export default function ProjectWorkspaceQuickMenu({children,project,user,onSelect,onAction}) {
  const canWrite=['admin','director','bdm','bsm'].includes(user?.role);
  return <DropdownMenu onOpenChange={open=>{if(open)onSelect(project);}}><DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger><DropdownMenuContent side="right" align="start" collisionPadding={12}><DropdownMenuLabel>Quick actions</DropdownMenuLabel><DropdownMenuSeparator/>{actions.map(([kind,label,Icon])=><DropdownMenuItem key={kind} disabled={kind!=='documents' && !canWrite} onSelect={()=>onAction(project,kind)}><Icon/>{label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}