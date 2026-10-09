import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
const fields = ['name', 'project_number', 'client_name', 'latitude', 'longitude', 'site_postcode', 'estimated_value', 'submitted_proposal_value', 'full_value', 'live_project'];
export default function useProjectMapPins({ user, query, sort, ready, serverPaging, refreshKey }) {
  return useQuery({
    queryKey: ['project-map-pins', user?.id, user?.role, query, sort, refreshKey], enabled: serverPaging && ready, staleTime: 60000,
    queryFn: async ({ signal }) => {
      const projects = []; let cursor;
      do {
        signal.throwIfAborted();
        const page = await base44.entities.Project.filter(query, { fields, sort, limit: 1000, ...(cursor ? { cursor } : {}) });
        signal.throwIfAborted();
        projects.push(...page.items);
        if (!page.has_more) break;
        if (!page.next_cursor || page.next_cursor === cursor) throw new Error('Unable to load all project locations.');
        cursor = page.next_cursor;
      } while (cursor);
      return projects;
    },
  });
}