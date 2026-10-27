import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import AccessDenied from '@/pages/AccessDenied';
import {canViewWorkspace} from '@/components/navigation/workspaceAccess';
export default function CRMRoute() {
  const { user } = useAuth();
  if (!canViewWorkspace(user,'opportunities')) return <AccessDenied />;
  return <div className="space-y-5"><Outlet /></div>;
}