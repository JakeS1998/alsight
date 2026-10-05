import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalHeader from '@/components/PortalHeader';
import { useAuth } from '@/lib/AuthContext';
import AliceWidget from '@/components/alice/AliceWidget';
import aliceAccessKey from '@/components/alice/aliceAccessKey';
import '@/components/layout/portal-responsive.css';

export default function PortalLayout() {
  const { user } = useAuth();
  return <div className="portal-shell min-h-screen bg-secondary">
    <PortalHeader />
    <main className="portal-main"><Outlet /></main>
    {user?.id && user.role !== 'framework_stakeholder' && <AliceWidget key={aliceAccessKey(user)} />}
  </div>;
}