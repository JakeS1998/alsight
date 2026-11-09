import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useProjectDirectoryStaff(user, projects, options, fallbackMap) {
  const ids = useMemo(() => [...new Set([
    ...projects.flatMap(project => [project.bdm_aad_id, project.bsm_aad_id, project.project_manager_id]),
    ...(options?.bdm || []), ...(options?.bsm || []), ...(options?.pm || [])
  ].filter(Boolean))].sort(), [projects, options]);
  const query = useQuery({
    queryKey: ['project-directory-staff', user?.id, user?.role, ids],
    enabled: !!user?.id && user.role !== 'supplier' && ids.length > 0,
    staleTime: 300000, retry: false,
    queryFn: async () => {
      const names = {};
      for (let start = 0; start < ids.length; start += 100) {
        const { data } = await base44.functions.invoke('getProjectBDMManager', { action: 'staff_directory', staffIds: ids.slice(start, start + 100) });
        if (data.error) throw new Error(data.error);
        Object.assign(names, data.names);
      }
      return names;
    }
  });
  const names = { ...fallbackMap, ...query.data };
  if (user?.role !== 'supplier') ids.forEach(id => {
    if (!names[id]) names[id] = query.isFetching ? 'Loading…' : query.error ? 'Unable to load name' : 'Assigned; name unavailable';
  });
  return { names, error: query.error, retry: query.refetch };
}