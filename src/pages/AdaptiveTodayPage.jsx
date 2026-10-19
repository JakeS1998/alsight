import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import AdaptiveWorkspace from '@/components/adaptive/AdaptiveWorkspace';
import AdaptiveWorkspaceSkeleton from '@/components/adaptive/AdaptiveWorkspaceSkeleton';
import '@/components/adaptive/adaptive-today.css';
import '@/components/adaptive/adaptive-reference.css';
import '@/components/adaptive/adaptive-flow.css';
import '@/components/adaptive/adaptive-refinements.css';
export default function AdaptiveTodayPage() {
 const {user}=useAuth();
 if(!user)return <AdaptiveWorkspaceSkeleton/>;
 return <AdaptiveWorkspace key={user.id} user={user}/>;
}