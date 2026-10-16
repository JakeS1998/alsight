import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AccessDenied from '@/pages/AccessDenied';
export default function CRMRoute() {
  const { user } = useAuth();
  if (!['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'].includes(user?.role)) return <AccessDenied />;
  return <div className="space-y-5"><Outlet /></div>;
}