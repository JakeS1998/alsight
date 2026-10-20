import React from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import CommercialPageHeader from '@/components/finance/CommercialPageHeader';
import CommercialNavigation from '@/components/finance/CommercialNavigation';
import useCommercialScope from '@/components/finance/useCommercialScope';
import { financeCall } from '@/components/finance/financeClient';
import '@/components/finance/finance-briefing.css';

export default function CommercialLayout() {
  const { user } = useAuth();
  const scope = useCommercialScope();
  const status = useQuery({ queryKey: ['finance-status', scope], queryFn: () => financeCall({ action: 'status' }), refetchInterval: query => query.state.data?.sync?.status === 'running' ? 5000 : false });
  return <div className="finance-briefing">
    <CommercialPageHeader status={status.data} user={user} />
    <CommercialNavigation />
    <Outlet context={{ status }} />
  </div>;
}