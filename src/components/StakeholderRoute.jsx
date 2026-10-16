import React from 'react';
import { Outlet } from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';

export default function StakeholderRoute() {
  const { user } = useAuth();
  return user?.role === 'framework_stakeholder' ? <AccessDenied /> : <Outlet />;
}