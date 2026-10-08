import React from 'react';
import useOutlookConnection from '@/components/outlook/useOutlookConnection';
import OnboardingConnectionStep from '@/components/onboarding/OnboardingConnectionStep';

export default function OnboardingOutlook({ next, saving }) {
  const state = useOutlookConnection();
  return <OnboardingConnectionStep title="Connect your Outlook calendar" description="See your work calendar and manage meetings without leaving ALSight." connected={state.connected} loading={state.loading} error={state.error} connect={state.connect} next={next} saving={saving} />;
}