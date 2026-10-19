import React from 'react';
import { Outlet } from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';
import {canViewWorkspace} from '@/components/navigation/workspaceAccess';
export default function FinanceRoute(){const {user}=useAuth();return canViewWorkspace(user?.role,'commercial')?<Outlet/>:<AccessDenied/>;}