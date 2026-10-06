import React, { useState, useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';
import Logo from '@/components/Logo';
import NotificationCenter from '@/components/NotificationCenter';
import UserMenu from '@/components/UserMenu';
import PortalSearch from '@/components/search/PortalSearch';
import UKLFIcon from '@/components/framework/UKLFIcon';
import RelationshipNavigation from '@/components/relationships/RelationshipNavigation';
import { LayoutDashboard, FolderKanban, Building2, UserCircle, Menu, X, Users, BriefcaseBusiness, CircleHelp, House } from 'lucide-react';

const ALL_ROLES = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm', 'client', 'supplier', 'project_manager'];
const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: House, roles: INTERNAL_ROLES.concat(['client', 'supplier']) },
  { label: 'Portfolio', path: '/portfolio-overview', icon: LayoutDashboard, roles: INTERNAL_ROLES },
  { label: 'Projects', path: '/projects', icon: FolderKanban, roles: ALL_ROLES },
  { label: 'Framework', path: '/framework-reports', icon: UKLFIcon, roles: INTERNAL_ROLES.concat(['framework_stakeholder']) },
  { label: 'Opportunities', path: '/crm/opportunities', icon: BriefcaseBusiness, roles: INTERNAL_ROLES },
  { label: 'My Account', path: '/account', icon: UserCircle, roles: ['client'] },
  { label: 'Relationships', path: '/accounts', icon: Building2, roles: ALL_ROLES.filter(role => role !== 'supplier') },
  { label: 'Contacts', path: '/contacts', icon: Users, roles: ['admin'] },
  { label: 'Help', path: '/help', icon: CircleHelp, roles: ALL_ROLES.concat(['framework_stakeholder']) },
];
export default function PortalHeader() {
  const headerRef = useRef(null);
  useStickyHeight(headerRef, '--portal-header-height');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role || 'client';
  const items = NAV_ITEMS.filter(item => item.roles.includes(role) && !['/account','/contacts','/help'].includes(item.path));
  const signOut = () => { setMenuOpen(false); logout(false); navigate('/login'); };
  const nav = (compact = false) => items.map(item => {
    const Icon = item.icon;
    if(item.path==='/accounts' && INTERNAL_ROLES.includes(role)) return <RelationshipNavigation key="relationships" compact={compact} onNavigate={()=>setMenuOpen(false)}/>;
    const active = item.path === '/crm/opportunities' ? (location.pathname.startsWith('/crm') || location.pathname.startsWith('/opportunities/')) : location.pathname === item.path;
    return <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium 2xl:px-3 ${active ? 'bg-primary text-primary-foreground' : 'text-white/75 hover:bg-white/10 hover:text-white'} ${compact ? 'w-full' : 'whitespace-nowrap'}`}>{Icon === UKLFIcon ? <UKLFIcon darkBackground /> : <Icon className="h-4 w-4 shrink-0" />}{item.label}</Link>;
  });
  return <header ref={headerRef} className="sticky top-0 z-40 bg-als-navy text-white shadow-sm">
    <div className="portal-topbar">
      <Link to={role === 'framework_stakeholder' ? '/framework-reports' : '/'} aria-label="ALSight home" onClick={() => setMenuOpen(false)} className="shrink-0"><Logo variant="header" className="h-10 w-28 sm:w-36 2xl:w-44" /></Link>
      <nav aria-label="Main navigation" className="portal-navigation hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">{nav()}</nav>
      <PortalSearch />
      {INTERNAL_ROLES.includes(role) && <NotificationCenter user={user} />}
      <div className="hidden min-w-0 shrink-0 lg:block"><UserMenu user={user} onSignOut={signOut} /></div>
      <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} className="rounded-lg p-2 text-white lg:hidden">{menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
    </div>
    {menuOpen && <div className="border-t border-white/10 px-5 pb-4 pt-3 lg:hidden sm:px-8"><nav aria-label="Main navigation" className="grid gap-1 sm:grid-cols-2">{nav(true)}</nav><div className="mt-3 border-t border-white/10 pt-3"><UserMenu user={user} mobile onSignOut={signOut} onNavigate={() => setMenuOpen(false)} /></div></div>}
  </header>;
}