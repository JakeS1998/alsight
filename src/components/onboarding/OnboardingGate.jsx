import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function OnboardingGate() {
  const { user } = useAuth();
  const location = useLocation();
  if (user && !user.onboarding_completed_at) {
    return <Navigate to={`/onboarding?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <Outlet />;
}