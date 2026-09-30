import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useDataQuality() {
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState('postcode');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const request = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current++; }; }, []);
  useEffect(() => {
    let active = true;
    setChecking(true); setError('');
    base44.functions.invoke('getDataQuality', { action: 'summary' }).then(({ data }) => { if (data.error) throw new Error(data.error); if (active) setSummary(data); }).catch(() => { if (active) setError('Unable to load data quality checks. Please retry.'); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [revision]);
  const load = async (offset = 0) => {
    const id = ++request.current;
    setLoading(true); setError('');
    try {
      const { data } = await base44.functions.invoke('getDataQuality', { action: 'issues', check: selected, offset });
      if (data.error) throw new Error(data.error);
      if (mounted.current && id === request.current) {
        setResult(old => ({ ...data, items: offset && old ? [...old.items, ...data.items] : data.items }));
        setSummary(old => old ? { ...old, checks: old.checks.map(check => check.key === selected ? { ...check, count: data.total } : check) } : old);
      }
    } catch { if (mounted.current && id === request.current) setError('Unable to load affected records. Please retry.'); }
    finally { if (mounted.current && id === request.current) setLoading(false); }
  };
  useEffect(() => { if (summary && !checking) { setResult(null); load(); } return () => { request.current++; }; }, [selected, checking]);
  return { summary, selected, setSelected, result, loading, checking, error, refresh: () => setRevision(value => value + 1), loadMore: () => load(result.nextOffset) };
}