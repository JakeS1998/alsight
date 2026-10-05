import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { INTERNAL_ROLES } from '@/lib/portal';

export default function useProjectHeroPhoto(project, user) {
  const queryClient = useQueryClient();
  const enabled = !!project?.id && !!user?.id;
  const canReadUploads = project?.procurement_route !== false && INTERNAL_ROLES.includes(user?.role);
  const queryKey = ['project-hero-photo', project?.id, user?.id, user?.role, 'leisure-location-v2'];
  const query = useQuery({
    queryKey, enabled, staleTime: 10 * 60 * 1000, refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      let reportId = null;
      if (canReadUploads) {
        const { data } = await base44.functions.invoke('getStakeholderFrameworkReport', { projectId: project.id });
        reportId = data.report?.id || null;
        if (reportId) {
          const page = await base44.entities.FrameworkProjectPhoto.filter({ report_id: reportId }, { sort: '-created_date', limit: 1, fields: ['file_uri', 'caption', 'report_id'] });
          const photo = page.items[0];
          if (photo) {
            const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: photo.file_uri, expires_in: 3600 });
            return { reportId, url: signed_url, caption: photo.caption };
          }
        }
      }
      const image = await queryClient.fetchQuery({
        queryKey: ['project-google-image', project.id, project.name, project.site_postcode, user.id, user.role, 'leisure-location-v2'],
        staleTime: 24 * 60 * 60 * 1000,
        queryFn: async () => (await base44.functions.invoke('findProjectHeaderImage', { projectId: project.id })).data,
      });
      return { ...image, reportId };
    },
  });
  useEffect(() => {
    if (!enabled || !canReadUploads) return;
    return base44.entities.FrameworkProjectPhoto.subscribe(event => {
      if (event.type === 'delete' || event.data?.report_id === query.data?.reportId) {
        queryClient.invalidateQueries({ queryKey: ['project-hero-photo', project.id] });
      }
    });
  }, [enabled, canReadUploads, project?.id, query.data?.reportId, queryClient]);
  return query;
}