import React from 'react';
import {Outlet} from 'react-router-dom';
import AccessDenied from '@/pages/AccessDenied';
import {useAuth} from '@/lib/AuthContext';
import {canViewWorkspace} from '@/components/navigation/workspaceAccess';
export default function PeopleRoute(){const {user}=useAuth();return canViewWorkspace(user,'people') ? <Outlet/> : <AccessDenied/>;}