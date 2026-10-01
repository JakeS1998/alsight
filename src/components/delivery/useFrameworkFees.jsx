import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { readFrameworkFeeSettings } from '@/lib/frameworkFees';

export default function useFrameworkFees(version = 'FW3') {
  const query = useQuery({
    queryKey: ['framework-fees', version],
    queryFn: () => readFrameworkFeeSettings(base44.entities, version),
  });
  return {
    settings: query.data || null,
    loading: query.isFetching,
    error: query.error?.message || '',
    reload: query.refetch,
  };
}