import {useEffect} from 'react';
import { useInfiniteQuery,useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import organisationQueryPolicy from '@/components/data/organisationQueryPolicy';

const entities = ['LegalDocument', 'DMA', 'JCT', 'Warranty'];
export default function useProjectDocuments(project, user, linkedDocumentId) {
  const cache=useQueryClient();
  useEffect(()=>{if(!project?.id||!user?.id)return;return base44.entities.Warranty.subscribe(event=>{if(!event.data?.project_id||[project.id,project.dataverse_id].includes(event.data.project_id))cache.invalidateQueries({queryKey:['project-documents',project.id]});});},[cache,project?.id,project?.dataverse_id,user?.id]);
  const supplier = user?.role === 'supplier';
  const accountId = user?.account_id || user?.data?.account_id;
  const ids = [project?.id, project?.dataverse_id].filter(Boolean);
  const query = useInfiniteQuery({
    queryKey: ['project-documents', project?.id, project?.dataverse_id, user?.id, user?.role, accountId, ...(linkedDocumentId ? [linkedDocumentId] : [])],
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
        const page = await base44.entities[entity].filter(scope, {
          sort: '-created_date', limit: 50, ...(pageParam[entity] ? { cursor: pageParam[entity] } : {}),
        });
        if (linkedDocumentId && !Object.keys(pageParam).length && page.has_more && !page.items.some(row => row.id === linkedDocumentId)) {
          const linked = await base44.entities[entity].filter({...scope, id:linkedDocumentId}, {limit:1});
          page.linkedDocument = linked.items.find(row => row.id === linkedDocumentId);
        }
        results[entity] = page;
      }
      return results;
    },
    getNextPageParam: page => entities.some(entity => page[entity].has_more)
      ? Object.fromEntries(entities.map(entity => [entity, page[entity].has_more ? page[entity].next_cursor : false])) : undefined,
  });
  const rows = entity => {
    const items = query.data?.pages.flatMap(page => page[entity].items) || [];
    const linked = query.data?.pages[0]?.[entity]?.linkedDocument;
    return linked && !items.some(row => row.id === linked.id) ? [linked, ...items] : items;
  };
  return { legalDocs: rows('LegalDocument'), dmas: rows('DMA'), jcts: rows('JCT'), warranties: rows('Warranty'),
    loading: query.isLoading, error: query.error, retrying: query.isFetching, retry: query.refetch,
    more: query.hasNextPage, loadingMore: query.isFetchingNextPage, loadMore: query.fetchNextPage };
}