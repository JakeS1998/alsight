import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalHeader from '@/components/PortalHeader';
import { useAuth } from '@/lib/AuthContext';
import AliceWidget from '@/components/alice/AliceWidget';
import aliceAccessKey from '@/components/alice/aliceAccessKey';

export default function PortalLayout() {
  const { user } = useAuth();
  return <div className="min-h-screen bg-secondary">
    <PortalHeader />
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Outlet /></main>
    {user?.id && user.role !== 'framework_stakeholder' && <AliceWidget key={aliceAccessKey(user)} />}
  </div>;
}