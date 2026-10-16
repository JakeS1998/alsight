import React from 'react';
import {Outlet} from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import {useAuth} from '@/lib/AuthContext';
import {INTERNAL_ROLES} from '@/lib/portal';
export default function PeopleRoute(){const {user}=useAuth();return INTERNAL_ROLES.includes(user?.role) ? <Outlet/> : <AccessDenied/>;}