import React from 'react';
import useTeamsConnection from '@/components/teams/useTeamsConnection';
import OnboardingConnectionStep from '@/components/onboarding/OnboardingConnectionStep';

export default function OnboardingTeams({ next, saving }) {
  const state = useTeamsConnection();
  return <OnboardingConnectionStep title="Connect Microsoft Teams" description="Share project updates with Teams using your own work account." connected={state.connected} loading={state.loading} error={state.error} connect={state.connect} next={next} saving={saving} />;
}