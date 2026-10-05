import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { INTERNAL_ROLES } from '@/lib/portal';

export default function useProjectHeroPhoto(project, user) {
  const queryClient = useQueryClient();
  const enabled = !!project?.id && project.procurement_route !== false && INTERNAL_ROLES.includes(user?.role);
  const queryKey = ['project-hero-photo', project?.id, user?.id, user?.role];
  const query = useQuery({
    queryKey, enabled, staleTime: 10 * 60 * 1000, refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await base44.functions.invoke('getStakeholderFrameworkReport', { projectId: project.id });
      if (!data.report) return null;
      const page = await base44.entities.FrameworkProjectPhoto.filter({ report_id: data.report.id }, { sort: '-created_date', limit: 1, fields: ['file_uri', 'caption', 'report_id'] });
      const photo = page.items[0];
      if (!photo) return { reportId: data.report.id, url: null };
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: photo.file_uri, expires_in: 3600 });
      return { reportId: data.report.id, url: signed_url, caption: photo.caption };
    },
  });
  useEffect(() => {
    if (!enabled) return;
    return base44.entities.FrameworkProjectPhoto.subscribe(event => {
      if (event.type === 'delete' || event.data?.report_id === query.data?.reportId) {
        queryClient.invalidateQueries({ queryKey: ['project-hero-photo', project.id] });
      }
    });
  }, [enabled, project?.id, query.data?.reportId, queryClient]);
  return query;
}