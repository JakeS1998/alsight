import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import CRMNav from '@/components/crm/CRMNav';
export default function CRMRoute() {
  const { user } = useAuth();
  if (!['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'].includes(user?.role)) return <p className="p-6 text-muted-foreground">CRM is for the internal team.</p>;
  return <div className="space-y-5"><Outlet /></div>;
}