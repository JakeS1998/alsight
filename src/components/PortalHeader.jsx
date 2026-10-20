import React, { useState, useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES, STAFF_WORKSPACE_ROLES } from '@/lib/portal';
import Logo from '@/components/Logo';
import NotificationCenter from '@/components/NotificationCenter';
import UserMenu from '@/components/UserMenu';
import PortalSearch from '@/components/search/PortalSearch';
import UKLFIcon from '@/components/framework/UKLFIcon';
import InsightsEngagementIcon from '@/components/InsightsEngagementIcon';
import {WORKSPACE_ACCESS} from '@/components/navigation/workspaceAccess';
import RelationshipNavigation from '@/components/relationships/RelationshipNavigation';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import { LayoutDashboard, FolderKanban, Building2, UserCircle, Users, BriefcaseBusiness, CircleHelp, House, MessagesSquare, ClipboardCheck, ChartNoAxesCombined } from 'lucide-react';
import MobileBottomNavigation from '@/components/navigation/MobileBottomNavigation';
import mobileNavigationItems from '@/components/navigation/mobileNavigationItems';

const NAV_ITEMS = [
  { label: 'Today', path: '/today', icon: House, roles: WORKSPACE_ACCESS.today },
  { label: 'Alliance360', path: '/alliance360', icon: LayoutDashboard, roles: WORKSPACE_ACCESS.alliance360 },
  { label: 'Network', path: '/accounts', icon: Building2, roles: WORKSPACE_ACCESS.network },
  { label: 'I & E', path: '/insights-engagement', icon: InsightsEngagementIcon, roles: WORKSPACE_ACCESS.ie },
  { label: 'Opportunities', path: '/opportunities', icon: BriefcaseBusiness, roles: WORKSPACE_ACCESS.opportunities },
  { label: 'Projects', path: '/projects', icon: FolderKanban, roles: WORKSPACE_ACCESS.projects },
  { label: 'Commercial', path: '/commercial', icon: ChartNoAxesCombined, roles: WORKSPACE_ACCESS.commercial },
  { label: 'Approvals', path: '/approvals', icon: ClipboardCheck, roles: WORKSPACE_ACCESS.approvals },
  { label: 'Framework', path: '/framework', icon: UKLFIcon, roles: WORKSPACE_ACCESS.framework },
  { label: 'Insider', path: '/insider', icon: MessagesSquare, roles: WORKSPACE_ACCESS.insider },
  { label: 'My Account', path: '/account', icon: UserCircle, roles: WORKSPACE_ACCESS.account },
  { label: 'Contacts', path: '/contacts', icon: Users, roles: WORKSPACE_ACCESS.contacts },
  { label: 'Help', path: '/help', icon: CircleHelp, roles: WORKSPACE_ACCESS.help },
];
export default function PortalHeader() {
  const headerRef = useRef(null);
  useStickyHeight(headerRef, '--portal-header-height');
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role || 'client';
  const approvalAccess = useApprovalAccess();
  const approvalSummary = useApprovalSummary();
  const items = NAV_ITEMS.filter(item => item.roles.includes(role) && !['/account','/contacts','/help'].includes(item.path) && (item.path !== '/approvals' || approvalAccess.enabled));
  const signOut = () => { setMenuOpen(false); logout(false); navigate('/login'); };
  const primaryItems = mobileNavigationItems(role);
  const nav = (compact = false, excluded = []) => items.filter(item => !excluded.includes(item.path)).map(item => {
    const Icon = item.icon;
    if(item.path==='/accounts') return <RelationshipNavigation key="relationships" compact={compact} showPeople={STAFF_WORKSPACE_ROLES.includes(role)} onNavigate={()=>setMenuOpen(false)}/>;
    const active = item.path === '/opportunities' ? (location.pathname.startsWith('/crm') || location.pathname === '/opportunities' || location.pathname.startsWith('/opportunities/')) : item.path === '/today' ? ['/', '/today', '/today-legacy'].includes(location.pathname) : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    return <Link key={item.path} to={item.path} onClick={() => setMenuOpen(false)} aria-current={active ? 'page' : undefined} data-active={active} data-outstanding={item.path === '/approvals' && approvalSummary.data?.pending > 0} className={`portal-nav-item ${['/today', '/alliance360'].includes(item.path) ? 'font-bold' : ''} ${compact ? 'w-full' : ''}`}>{Icon === UKLFIcon ? <UKLFIcon darkBackground /> : <Icon className="h-4 w-4 shrink-0" />}{item.path === '/alliance360' ? <span>Alliance<span className="text-primary">360</span></span> : item.label}{item.path==='/approvals' && approvalSummary.data?.pending>0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{approvalSummary.data.pending}</span>}</Link>;
  });
  return <><header ref={headerRef} className="sticky top-0 z-40 bg-als-navy text-white shadow-sm">
    <div className="portal-topbar">
      <Link to={['sam','sam_director'].includes(role) ? '/insights-engagement' : role === 'framework_stakeholder' ? '/framework' : '/today'} aria-label="ALS Hub home" onClick={() => setMenuOpen(false)} className="portal-logo"><Logo variant="header" className="portal-logo-image" /></Link>
      <nav aria-label="Main navigation" className="portal-navigation hidden min-w-0 items-center lg:flex">{nav()}</nav>
      <div className="portal-utilities">
        <PortalSearch />
        {INTERNAL_ROLES.includes(role) && <NotificationCenter user={user} />}
        <div className="portal-profile hidden min-w-0 shrink-0 lg:block"><UserMenu user={user} onSignOut={signOut} /></div>

      </div>
    </div>
  </header>
    <MobileBottomNavigation user={user} items={primaryItems} open={menuOpen} onOpenChange={setMenuOpen} onSignOut={signOut}>
      {nav(true, ['/today', ...primaryItems.map(item => item.path)])}
    </MobileBottomNavigation>
  </>;
}