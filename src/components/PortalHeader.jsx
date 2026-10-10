import React, { useState, useRef } from 'react';
import useStickyHeight from '@/components/projects/useStickyHeight';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { INTERNAL_ROLES } from '@/lib/portal';
import Logo from '@/components/Logo';
import NotificationCenter from '@/components/NotificationCenter';
import UserMenu from '@/components/UserMenu';
import PortalSearch from '@/components/search/PortalSearch';

import PlatformNavigation from '@/components/layout/PlatformNavigation';
import { Sparkles } from 'lucide-react';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import useApprovalSummary from '@/components/approvals/useApprovalSummary';
import { Menu, X } from 'lucide-react';

export default function PortalHeader() {
  const headerRef = useRef(null);
  useStickyHeight(headerRef, '--portal-header-height');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role || 'client';
  const approvalAccess = useApprovalAccess();
  const approvalSummary = useApprovalSummary();
  const signOut = () => { setMenuOpen(false); logout(false); navigate('/login'); };
  const nav = (compact = false) => <PlatformNavigation role={role} approvalAccess={approvalAccess.enabled} pending={approvalSummary.data?.pending || 0} compact={compact} onNavigate={()=>setMenuOpen(false)}/>;
  return <header ref={headerRef} className="sticky top-0 z-40 bg-als-navy text-white shadow-sm">
    <div className="portal-topbar">
      <Link to={role === 'framework_stakeholder' ? '/framework-reports' : '/today'} aria-label="ALSight home" onClick={() => setMenuOpen(false)} className="portal-logo"><Logo variant="header" className="portal-logo-image" /></Link>
      <nav aria-label="Main navigation" className="portal-navigation hidden min-w-0 items-center lg:flex">{nav()}</nav>
      <div className="portal-utilities">
        <PortalSearch />
        {role !== 'framework_stakeholder' && <button type="button" className="portal-icon-button portal-alice-trigger" aria-label="Ask ALICE" title="Ask ALICE" onClick={()=>window.dispatchEvent(new CustomEvent('alsight-open-alice',{detail:{prompt:'What needs my attention?',autoSend:false}}))}><Sparkles className="h-5 w-5"/></button>}
        {INTERNAL_ROLES.includes(role) && <NotificationCenter user={user} />}
        <div className="portal-profile hidden min-w-0 shrink-0 lg:block"><UserMenu user={user} onSignOut={signOut} /></div>
        <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} className="portal-icon-button lg:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
    </div>
    {menuOpen && <div className="border-t border-white/10 px-5 pb-4 pt-3 lg:hidden sm:px-8"><nav aria-label="Main navigation" className="grid gap-1 sm:grid-cols-2">{nav(true)}</nav><div className="mt-3 border-t border-white/10 pt-3"><UserMenu user={user} mobile onSignOut={signOut} onNavigate={() => setMenuOpen(false)} /></div></div>}
  </header>;
}