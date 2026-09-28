import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_LABELS, ROLE_BADGE_CLASS, INTERNAL_ROLES } from '@/lib/portal';
import Logo from '@/components/Logo';
import { LayoutDashboard, FolderKanban, Building2, UserCircle, LogOut, Menu, X, BarChart3, Users, UserCog, BriefcaseBusiness } from 'lucide-react';

const ALL_ROLES = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm', 'client', 'supplier', 'project_manager'];
const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: INTERNAL_ROLES.concat(['client', 'supplier']) },
  { label: 'Projects', path: '/projects', icon: FolderKanban, roles: ALL_ROLES },
  { label: 'CRM', path: '/crm', icon: BriefcaseBusiness, roles: INTERNAL_ROLES },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: INTERNAL_ROLES },
  { label: 'Delegation', path: '/delegation', icon: UserCog, roles: INTERNAL_ROLES },
  { label: 'My Account', path: '/account', icon: UserCircle, roles: ['client', 'supplier'] },
  { label: 'Accounts', path: '/accounts', icon: Building2, roles: ALL_ROLES },
  { label: 'Contacts', path: '/contacts', icon: Users, roles: ['admin'] },
];
export default function PortalHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role || 'client';
  const items = NAV_ITEMS.filter(item => item.roles.includes(role));
  const signOut = () => { setMenuOpen(false); logout(false); navigate('/login'); };
  const nav = (compact = false) => items.map(item => {
    const Icon = item.icon;
    const active = item.path === '/crm' ? (location.pathname.startsWith('/crm') || location.pathname.startsWith('/opportunities/')) : location.pathname === item.path;
    return <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-primary text-primary-foreground' : 'text-white/75 hover:bg-white/10 hover:text-white'} ${compact ? 'w-full' : 'whitespace-nowrap'}`}><Icon className="h-4 w-4 shrink-0" />{item.label}</Link>;
  });
  return <header className="sticky top-0 z-40 bg-als-navy text-white shadow-sm">
    <div className="mx-auto flex min-h-16 max-w-screen-2xl items-center gap-5 px-5 sm:px-8">
      <Link to="/" aria-label="ALS Live home" onClick={() => setMenuOpen(false)} className="shrink-0"><Logo className="h-10" onDark /></Link>
      <nav aria-label="Main navigation" className="hidden min-w-0 flex-1 items-center gap-1 xl:flex">{nav()}</nav>
      <div className="ml-auto hidden shrink-0 items-center gap-3 xl:flex">
        <div className="text-right"><p className="max-w-40 truncate text-sm font-medium">{user?.full_name || user?.email}</p><span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE_CLASS[role] || ''}`}>{ROLE_LABELS[role] || role}</span></div>
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-white/75 hover:bg-white/10 hover:text-white"><LogOut className="h-5 w-5" /></button>
      </div>
      <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} className="ml-auto rounded-lg p-2 text-white xl:hidden">{menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
    </div>
    {menuOpen && <div className="border-t border-white/10 px-5 pb-4 pt-3 xl:hidden sm:px-8"><nav aria-label="Main navigation" className="grid gap-1 sm:grid-cols-2">{nav(true)}</nav><div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><div><p className="text-sm font-medium">{user?.full_name || user?.email}</p><span className="text-xs text-white/70">{ROLE_LABELS[role] || role}</span></div><button type="button" onClick={signOut} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10"><LogOut className="h-4 w-4" />Sign out</button></div></div>}
  </header>;
}