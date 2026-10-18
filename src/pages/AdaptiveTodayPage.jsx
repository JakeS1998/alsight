import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import AdaptiveWorkspace from '@/components/adaptive/AdaptiveWorkspace';
import '@/components/adaptive/adaptive-today.css';
import '@/components/adaptive/adaptive-reference.css';
import '@/components/adaptive/adaptive-flow.css';
import '@/components/adaptive/adaptive-refinements.css';
export default function AdaptiveTodayPage() {
 const {user}=useAuth();
 if(!user)return <div role="status" className="p-8">Loading your workspace…</div>;
 return <AdaptiveWorkspace key={user.id} user={user}/>;
}