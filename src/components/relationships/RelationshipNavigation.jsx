import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Building2,Users,ChevronDown} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
export default function RelationshipNavigation({onNavigate,compact,showPeople=true}) {
  const {pathname}=useLocation(),active=['/accounts','/suppliers','/clients','/people','/contacts'].some(p=>pathname.startsWith(p));
  return <DropdownMenu><DropdownMenuTrigger data-active={active} className={`portal-nav-item ${compact ? 'w-full' : ''}`}><Building2 className="h-4 w-4"/>Network<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem asChild><Link onClick={onNavigate} to="/suppliers"><Building2 className="mr-2 h-4 w-4"/>Suppliers</Link></DropdownMenuItem><DropdownMenuItem asChild><Link onClick={onNavigate} to="/clients"><Building2 className="mr-2 h-4 w-4"/>Clients</Link></DropdownMenuItem>{showPeople&&<DropdownMenuItem asChild><Link onClick={onNavigate} to="/people"><Users className="mr-2 h-4 w-4"/>People</Link></DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>;
}