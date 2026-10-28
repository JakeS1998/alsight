import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import {Building2,Users,ChevronDown} from 'lucide-react';
import RelationshipNavigation from '@/components/relationships/RelationshipNavigation';
import UKLFIcon from '@/components/framework/UKLFIcon';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuSub,DropdownMenuSubTrigger,DropdownMenuSubContent} from '@/components/ui/dropdown-menu';
export default function PortalOverflowMenu({items}) {
 const {pathname}=useLocation();
 const networkActive=['/accounts','/suppliers','/clients','/people','/contacts'].some(path=>pathname.startsWith(path));
 const active=items.some(item=>item.props['data-active']||(item.type===RelationshipNavigation&&networkActive));
 return <DropdownMenu><DropdownMenuTrigger className="portal-nav-item" data-active={active} aria-label="More navigation options">More<ChevronDown className="h-4 w-4"/></DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="max-h-[calc(100dvh-6rem)] min-w-52 overflow-y-auto">
   {items.map(item=>item.type===RelationshipNavigation?<DropdownMenuSub key={item.key}>
    <DropdownMenuSubTrigger className={networkActive?'bg-muted font-semibold':''}><Building2/>Relationships</DropdownMenuSubTrigger>
    <DropdownMenuSubContent>
     <DropdownMenuItem asChild><Link to="/suppliers" onClick={item.props.onNavigate}><Building2/>Suppliers</Link></DropdownMenuItem>
     <DropdownMenuItem asChild><Link to="/clients" onClick={item.props.onNavigate}><Building2/>Clients</Link></DropdownMenuItem>
     {item.props.showPeople&&<DropdownMenuItem asChild><Link to="/people" onClick={item.props.onNavigate}><Users/>People</Link></DropdownMenuItem>}
    </DropdownMenuSubContent>
   </DropdownMenuSub>:<DropdownMenuItem asChild key={item.key}>{React.cloneElement(item,{className:`flex w-full items-center gap-2 ${item.props['data-active']?'bg-muted font-semibold':''}`},React.Children.map(item.props.children,child=>React.isValidElement(child)&&child.type===UKLFIcon?React.cloneElement(child,{darkBackground:false}):child))}</DropdownMenuItem>)}
  </DropdownMenuContent>
 </DropdownMenu>;
}