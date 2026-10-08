import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function useOnboarding() {
  const { user, updateOnboarding } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const internal = ['admin', 'director', 'regional_director', 'bsm', 'bdm', 'finance'].includes(user?.role);
  const steps = [{ id: 'welcome', label: 'Welcome' }, { id: 'details', label: 'Details' }, { id: 'outlook', label: 'Outlook' }, ...(internal ? [{ id: 'teams', label: 'Teams' }, { id: 'dataverse', label: 'Dataverse' }] : []), { id: 'complete', label: 'Complete' }];
  const index = Math.max(0, steps.findIndex(item => item.id === user?.onboarding_step));
  const step = steps[index].id;
  const requested = safeReturnTo();
  const returnTo = requested.split('?')[0] === '/onboarding' ? '/' : requested;
  async function save(values, done = false) {
    setSaving(true); setError('');
    try {
      await updateOnboarding(values);
      if (done) { sessionStorage.removeItem('alsight-onboarding-return'); navigate(returnTo, { replace: true }); }
    } catch (failure) { setError(failure.message || 'Could not save your setup progress. Please try again.'); }
    finally { setSaving(false); }
  }
  return { user, steps, step, index, saving, error, returnTo,
    next: () => save({ onboarding_step: steps[Math.min(index + 1, steps.length - 1)].id }),
    back: () => save({ onboarding_step: steps[Math.max(0, index - 1)].id }),
    finish: () => save({ onboarding_step: 'complete', onboarding_completed_at: new Date().toISOString() }, true)
  };
}