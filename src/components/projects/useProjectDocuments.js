import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

const entities = ['LegalDocument', 'DMA', 'JCT', 'Warranty'];
export default function useProjectDocuments(project, user) {
  const supplier = user?.role === 'supplier';
  const accountId = user?.account_id || user?.data?.account_id;
  const ids = [project?.id, project?.dataverse_id].filter(Boolean);
  const query = useInfiniteQuery({
    queryKey: ['project-documents', project?.id, project?.dataverse_id, user?.id, user?.role, accountId],
    enabled: !!project?.id && !!user?.id, ...organisationQueryPolicy, staleTime: 300000,
    initialPageParam: {},
    queryFn: async ({ pageParam }) => {
      const results = {};
      for (const entity of entities) {
        if (pageParam[entity] === false || (supplier && (!accountId || entity === 'DMA'))) {
          results[entity] = { items: [], has_more: false }; continue;
        }
        const scope = { project_id: { $in: ids } };
        if (supplier) {
          if (entity === 'LegalDocument') scope.account_id = accountId;
          else scope.$or = [{ account_id: accountId }, { [entity === 'Warranty' ? 'supplier_id' : 'contractor_id']: accountId }];
        }
        results[entity] = await base44.entities[entity].filter(scope, {
          sort: '-created_date', limit: 50, ...(pageParam[entity] ? { cursor: pageParam[entity] } : {}),
        });
      }
      return results;
    },
    getNextPageParam: page => entities.some(entity => page[entity].has_more)
      ? Object.fromEntries(entities.map(entity => [entity, page[entity].has_more ? page[entity].next_cursor : false])) : undefined,
  });
  const rows = entity => query.data?.pages.flatMap(page => page[entity].items) || [];
  return { legalDocs: rows('LegalDocument'), dmas: rows('DMA'), jcts: rows('JCT'), warranties: rows('Warranty'),
    loading: query.isLoading, error: query.error, retrying: query.isFetching, retry: query.refetch,
    more: query.hasNextPage, loadingMore: query.isFetchingNextPage, loadMore: query.fetchNextPage };
}