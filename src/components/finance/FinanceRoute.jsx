import React from 'react';
import { Outlet } from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import { useAuth } from '@/lib/AuthContext';
export default function FinanceRoute(){const {user}=useAuth();return ['admin','finance','director','regional_director','bdm','bsm'].includes(user?.role)?<Outlet/>:<AccessDenied/>;}