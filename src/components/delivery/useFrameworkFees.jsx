import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { readFrameworkFeeSettings, FRAMEWORK_FEE_KEY, DEFAULT_FRAMEWORK_FEE_BANDS, DEFAULT_FRAMEWORK_FEE_LABELS } from '@/lib/frameworkFees';

export default function useFrameworkFees() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await readFrameworkFeeSettings(base44.entities);
      setSettings(data);
    } catch (failure) {
      setError(failure.message || 'Unable to load framework fee settings.');
      setSettings({ key: FRAMEWORK_FEE_KEY, bands: DEFAULT_FRAMEWORK_FEE_BANDS, ...DEFAULT_FRAMEWORK_FEE_LABELS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { settings, loading, error, reload: load, setSettings };
}