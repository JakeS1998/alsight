import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import platformNavigation from '@/components/layout/platformNavigation';
export default function PlatformNavigation({role,approvalAccess,pending=0,compact=false,onNavigate}) {
  const {pathname}=useLocation();
  return platformNavigation(role,approvalAccess).map(group=>{
    const Icon=group.icon,active=group.match.some(path=>pathname===path || pathname.startsWith(`${path}/`));
    return <div key={group.label} className={compact ? 'flex w-full items-center' : 'flex shrink-0 items-center'}>
      <Link to={group.to} onClick={onNavigate} data-active={active} aria-current={active ? 'page' : undefined} className={compact ? 'portal-nav-item flex-1' : 'portal-nav-item'}><Icon/>{group.label}{group.label==='Today' && pending>0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{pending}</span>}</Link>
      {!!group.links.length && <DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="flex h-9 w-5 shrink-0 items-center justify-center rounded-sm text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Open ${group.label} sections`}><ChevronDown className="h-3 w-3"/></button></DropdownMenuTrigger><DropdownMenuContent align="start" className="w-60"><DropdownMenuLabel>{group.label}</DropdownMenuLabel>{group.links.map(([label,to])=><DropdownMenuItem key={to} asChild><Link to={to} onClick={onNavigate}>{label}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}
    </div>;
  });
}