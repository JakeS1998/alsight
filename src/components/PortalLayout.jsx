import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PortalHeader from '@/components/PortalHeader';
import { useAuth } from '@/lib/AuthContext';
import AliceWidget from '@/components/alice/AliceWidget';
import aliceAccessKey from '@/components/alice/aliceAccessKey';
import '@/components/layout/portal-responsive.css';
import '@/components/layout/portal-design.css';

export default function PortalLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    if (!match || !user?.id) return;
    const key = `als-recent-projects:${user.id}`;
    const previous = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([match[1], ...previous.filter(id => id !== match[1])].slice(0, 8)));
  }, [pathname, user?.id]);
  return <div className="portal-shell min-h-screen bg-secondary">
    <PortalHeader />
    <main className="portal-main"><Outlet /></main>
    {user?.id && user.role !== 'framework_stakeholder' && <AliceWidget key={aliceAccessKey(user)} />}
  </div>;
}