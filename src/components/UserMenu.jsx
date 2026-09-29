import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, UserCog } from 'lucide-react';
import { ROLE_LABELS, ROLE_BADGE_CLASS, INTERNAL_ROLES } from '@/lib/portal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function UserMenu({ user, onSignOut, onNavigate, mobile = false }) {
  const role = user?.role || 'client';
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={`Account menu for ${user?.full_name || user?.email || 'user'}`} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${mobile ? '' : 'text-right'}`}>
        <span className="min-w-0"><span className="block max-w-72 truncate text-sm font-medium leading-tight" title={user?.full_name || user?.email}>{user?.full_name || user?.email}</span><span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE_CLASS[role] || ''}`}>{ROLE_LABELS[role] || role}</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/70" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={mobile ? 'start' : 'end'} className="w-52">
      <DropdownMenuItem asChild><Link to="/account-settings" onClick={onNavigate}><KeyRound /> Account settings</Link></DropdownMenuItem>
      {INTERNAL_ROLES.includes(role) && <DropdownMenuItem asChild><Link to="/delegation" onClick={onNavigate}><UserCog /> Delegation</Link></DropdownMenuItem>}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}