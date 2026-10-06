import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Building2,Users,ChevronDown} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
export default function RelationshipNavigation({onNavigate,compact}) {
  const {pathname}=useLocation(),active=['/accounts','/people','/contacts'].some(p=>pathname.startsWith(p));
  return <DropdownMenu><DropdownMenuTrigger className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium 2xl:px-3 ${active ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'} ${compact ? 'w-full' : ''}`}><Building2 className="h-4 w-4"/>Relationships<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem asChild><Link onClick={onNavigate} to="/accounts"><Building2 className="mr-2 h-4 w-4"/>Organisations</Link></DropdownMenuItem><DropdownMenuItem asChild><Link onClick={onNavigate} to="/people"><Users className="mr-2 h-4 w-4"/>People</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}