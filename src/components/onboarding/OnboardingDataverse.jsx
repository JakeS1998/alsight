import React from 'react';
import useDataverseUser from '@/components/dataverse/useDataverseUser';
import { safeReturnTo } from '@/lib/authReturnTo';
import OnboardingConnectionStep from '@/components/onboarding/OnboardingConnectionStep';

export default function OnboardingDataverse({ next, saving }) {
  const state = useDataverseUser();
  const connect = () => {
    sessionStorage.setItem('alsight-onboarding-return', `/onboarding?returnTo=${encodeURIComponent(safeReturnTo())}`);
    state.run('begin');
  };
  return <OnboardingConnectionStep title="Connect your Dataverse account" description="Link your Microsoft account to confirm access to Alliance’s Dataverse environment, using your individual permissions." connected={Boolean(state.connection?.connected)} loading={state.loading || Boolean(state.busy)} error={state.error || state.loadError} connect={connect} next={next} saving={saving} note="Microsoft will securely authorise your access and return you to this step. IT must enable delegated permissions first; if access isn’t ready yet, choose Set up later." />;
}