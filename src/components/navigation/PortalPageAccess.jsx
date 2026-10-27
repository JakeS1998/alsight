import React from 'react';
import {useLocation} from 'react-router-dom';
import {useAuth} from '@/lib/AuthContext';
import {canViewWorkspace,workspaceForPath} from '@/components/navigation/workspaceAccess';
import AccessDenied from '@/pages/AccessDenied';
export default function PortalPageAccess({children}) {
 const {user}=useAuth(),{pathname}=useLocation(),workspace=workspaceForPath(pathname,user);
 return workspace&&!canViewWorkspace(user,workspace)?<AccessDenied/>:children;
}