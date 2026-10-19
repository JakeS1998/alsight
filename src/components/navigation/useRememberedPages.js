import { useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import useListState from '@/components/navigation/useListState';

export default function useRememberedPages(name, readPage, identity = '') {
  const { user } = useAuth(), { pathname } = useLocation();
  const [pageCount, setPageCount] = useListState(`${name}:pages:${identity}`, 1);
  const query = useInfiniteQuery({
    queryKey: ['remembered-list', user?.id, user?.role, pathname, name, identity], enabled: !!user?.id,
    initialPageParam: null, queryFn: ({ pageParam }) => readPage(pageParam),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
  });
  const restoring = !query.isError && !!query.hasNextPage && (query.data?.pages.length || 0) < pageCount;
  useEffect(() => { if (restoring && !query.isFetching) query.fetchNextPage(); }, [restoring, query.isFetching, query.data?.pages.length]);
  const load = async (next = null) => {
    const result = await (next ? query.fetchNextPage() : query.refetch());
    if (!result.isError) setPageCount(result.data?.pages.length || 1);
    return result;
  };
  return { rows: query.data?.pages.flatMap(page => page.items) || [], cursor: query.data?.pages.at(-1)?.next_cursor,
    more: !!query.hasNextPage, loading: query.isFetching || restoring, error: query.error?.message, load };
}