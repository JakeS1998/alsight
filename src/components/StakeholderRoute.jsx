import React from 'react';
import { Outlet,useLocation } from 'react-router-dom';
import {canViewWorkspace,workspaceForPath} from '@/components/navigation/workspaceAccess';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';

export default function StakeholderRoute() {
  const { user } = useAuth();
  const {pathname}=useLocation(),workspace=workspaceForPath(pathname,user);
  return user?.role === 'framework_stakeholder' && !(workspace&&canViewWorkspace(user,workspace)) ? <AccessDenied /> : <Outlet />;
}