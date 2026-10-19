import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ieCall, IE_ROLES } from '@/components/ie/ieClient';

export default function useIEHeadlines(refreshKey) {
  const { user } = useAuth();
  const enabled = !!user && IE_ROLES.includes(user.role);
  const query = useQuery({ queryKey: ['ie-headlines', user?.id, user?.role, refreshKey], enabled, queryFn: () => ieCall('headlines'), staleTime: 60000, retry: false });
  return { query, user, enabled };
}