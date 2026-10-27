import React from 'react';
import {Outlet} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import AccessDenied from '@/pages/AccessDenied';
import {canViewWorkspace} from '@/components/navigation/workspaceAccess';
export default function IERoute(){const {user}=useAuth();return canViewWorkspace(user,'ie')?<Outlet/>:<AccessDenied/>;}