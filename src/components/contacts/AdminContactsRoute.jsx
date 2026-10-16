import React from 'react';
import { Outlet } from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';
export default function AdminContactsRoute() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <AccessDenied />;
}