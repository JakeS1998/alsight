import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function useBrokenLinks(refreshToken) {
 const [source, setSource] = useState('jct');
 const query = useInfiniteQuery({
  queryKey: ['data-quality-broken-links', source, refreshToken], initialPageParam: null,
  queryFn: async ({ pageParam }) => {
   const { data } = await base44.functions.invoke('getDataQuality', { action: 'broken_links', source, ...(pageParam ? { cursor: pageParam } : {}) });
   if (data.error) throw new Error(data.error);
   return data;
  },
  getNextPageParam: page => page.has_more ? page.next_cursor : undefined
 });
 return { source, setSource, ...query, items: query.data?.pages.flatMap(page => page.items) || [], summary: query.data?.pages[0] };
}