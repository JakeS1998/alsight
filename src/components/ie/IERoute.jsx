import React from 'react';
import {Outlet} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import AccessDenied from '@/pages/AccessDenied';
import {IE_ROLES} from '@/components/ie/ieClient';
export default function IERoute(){const {user}=useAuth();return IE_ROLES.includes(user?.role)?<Outlet/>:<AccessDenied/>;}