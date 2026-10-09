import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const views = ['/today', '/portfolio-overview', '/pulse'];
const sharedKeys = new Set(['dashboard-data', 'dashboard-portfolio-extras', 'overview-analytics', 'overview-recent', 'alliance-layer', 'project-value-summary']);

export default function usePortalDataRefresh(userId, pathname) {
  const cache = useQueryClient();
  useEffect(() => {
    if (!userId || !views.includes(pathname)) return;
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      cache.invalidateQueries({ predicate: query => sharedKeys.has(query.queryKey[0]), refetchType: 'active' });
    };
    refresh();
    const timer = window.setInterval(refresh, 65000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [cache, userId, pathname]);
}