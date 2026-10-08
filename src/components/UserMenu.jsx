import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronDown, KeyRound, LogOut, UserCog, ClipboardCheck } from 'lucide-react';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import ProfilePicture from '@/components/profile/ProfilePicture';
import { ROLE_LABELS, ROLE_BADGE_CLASS, INTERNAL_ROLES } from '@/lib/portal';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

export default function UserMenu({ user, onSignOut, onNavigate, mobile = false }) {
  const role = user?.role || 'client';
  const approvalAccess = useApprovalAccess();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={`Account menu for ${user?.full_name || user?.email || 'user'}`} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${mobile ? '' : 'text-right'}`}>
        {user?.profile_picture_uri && <ProfilePicture user={user} className="h-9 w-9 text-xs"/>}
        <span className="min-w-0"><span className="block max-w-48 truncate text-sm font-medium leading-tight lg:max-w-32 2xl:max-w-48" title={user?.full_name || user?.email}>{user?.full_name || user?.email}</span><span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE_CLASS[role] || ''}`}>{ROLE_LABELS[role] || role}</span></span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/70" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align={mobile ? 'start' : 'end'} className="w-52">
      <DropdownMenuItem asChild><Link to="/account-settings" onClick={onNavigate}><KeyRound /> Account settings</Link></DropdownMenuItem>
      <DropdownMenuItem asChild><Link to="/calendar" onClick={onNavigate}><CalendarDays /> My calendar</Link></DropdownMenuItem>
      {approvalAccess.enabled && <DropdownMenuItem asChild><Link to="/approvals" onClick={onNavigate}><ClipboardCheck /> Approval centre</Link></DropdownMenuItem>}
      {INTERNAL_ROLES.includes(role) && <DropdownMenuItem asChild><Link to="/delegation" onClick={onNavigate}><UserCog /> Delegation</Link></DropdownMenuItem>}
      {role === 'admin' && <DropdownMenuItem asChild><Link to="/admin" onClick={onNavigate}><UserCog /> Admin</Link></DropdownMenuItem>}
      {role === 'client' && <DropdownMenuItem asChild><Link to="/account" onClick={onNavigate}>My Account</Link></DropdownMenuItem>}
      {role === 'admin' && <DropdownMenuItem asChild><Link to="/people" onClick={onNavigate}>People</Link></DropdownMenuItem>}
      <DropdownMenuItem asChild><Link to="/help" onClick={onNavigate}>Help</Link></DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onSignOut}><LogOut /> Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}