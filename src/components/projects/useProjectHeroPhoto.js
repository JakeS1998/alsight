import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { INTERNAL_ROLES } from '@/lib/portal';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

export default function useProjectHeroPhoto(project, user) {
  const queryClient = useQueryClient();
  const enabled = !!project?.id && !!user?.id;
  const canReadUploads = project?.procurement_route !== false && INTERNAL_ROLES.includes(user?.role);
  const retryRequested = useRef(false);
  const queryKey = ['project-hero-photo', project?.id, user?.id, user?.role, 'leisure-location-v3'];
  const googleKey = ['project-google-image', project?.id, project?.name, project?.site_postcode, user?.id, user?.role, 'leisure-location-v3'];
  const query = useQuery({
    queryKey, enabled, staleTime: 10 * 60 * 1000, refetchInterval: 10 * 60 * 1000, retry: false,
    queryFn: async () => {
      const retrySearch = retryRequested.current;
      retryRequested.current = false;
      let reportId = null;
      if (canReadUploads) {
        const data = await queryClient.fetchQuery({
          queryKey: ['framework-project-detail', user.id, user.role, project.id, undefined],
          ...organisationQueryPolicy, staleTime: 60000,
          queryFn: async () => {
            const { data } = await base44.functions.invoke('getStakeholderFrameworkReport', { projectId: project.id });
            if (data.error) throw new Error(data.error);
            return data;
          },
        });
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
        queryKey: googleKey, retry: false,
        staleTime: retrySearch ? 0 : queryClient.getQueryData(googleKey)?.url ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000,
        queryFn: async () => (await base44.functions.invoke('findProjectHeaderImage', { projectId: project.id, retrySearch })).data,
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
  return { ...query, retryPhoto: () => { retryRequested.current = true; return query.refetch(); } };
}