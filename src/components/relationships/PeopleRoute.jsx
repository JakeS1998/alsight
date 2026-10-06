import React from 'react';
import {Navigate,Outlet} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import {INTERNAL_ROLES} from '@/lib/portal';
export default function PeopleRoute(){const {user}=useAuth();return INTERNAL_ROLES.includes(user?.role) ? <Outlet/> : <Navigate to="/" replace/>;}