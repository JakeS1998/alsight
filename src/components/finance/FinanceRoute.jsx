import React from 'react';
import { Outlet } from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';
import {STAFF_WORKSPACE_ROLES} from '@/lib/portal';
export default function FinanceRoute(){const {user}=useAuth();return STAFF_WORKSPACE_ROLES.includes(user?.role)?<Outlet/>:<AccessDenied/>;}