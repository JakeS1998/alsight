import React from 'react';
import { Outlet } from 'react-router-dom';
import PortalHeader from '@/components/PortalHeader';
import AliceWidget from '@/components/alice/AliceWidget';

export default function PortalLayout() {
  return <div className="min-h-screen bg-secondary">
    <PortalHeader />
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8"><Outlet /></main>
    <AliceWidget />
  </div>;
}