import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function StakeholderRoute() {
  const { user } = useAuth();
  return user?.role === 'framework_stakeholder' ? <Navigate to="/framework-reports" replace /> : <Outlet />;
}