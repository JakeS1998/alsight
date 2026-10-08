import React from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import useOnboarding from '@/components/onboarding/useOnboarding';
import OnboardingFrame from '@/components/onboarding/OnboardingFrame';
import OnboardingWelcome from '@/components/onboarding/OnboardingWelcome';
import OnboardingDetails from '@/components/onboarding/OnboardingDetails';
import OnboardingOutlook from '@/components/onboarding/OnboardingOutlook';
import OnboardingTeams from '@/components/onboarding/OnboardingTeams';
import OnboardingDataverse from '@/components/onboarding/OnboardingDataverse';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';

export default function Onboarding() {
  const state = useOnboarding();
  if (state.user?.onboarding_completed_at) return <Navigate to={state.returnTo} replace />;
  const components = { welcome: OnboardingWelcome, details: OnboardingDetails, outlook: OnboardingOutlook, teams: OnboardingTeams, dataverse: OnboardingDataverse, complete: OnboardingComplete };
  const Step = components[state.step];
  return <OnboardingFrame steps={state.steps} step={state.step}>
    <Step user={state.user} next={state.next} finish={state.finish} saving={state.saving} />
    {state.error && <p role="alert" className="mt-4 text-sm text-destructive">{state.error}</p>}
    {state.index > 0 && <Button variant="ghost" className="mt-4 text-muted-foreground" disabled={state.saving} onClick={state.back}>Back</Button>}
  </OnboardingFrame>;
}