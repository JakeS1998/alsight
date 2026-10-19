import {useInfiniteQuery} from '@tanstack/react-query';
import {ieCall} from '@/components/ie/ieClient';
const kinds=['legal','dma','jct'];
export default function useIELegalDocuments(engagementId){
 const query=useInfiniteQuery({
  queryKey:['ie-project-legal-process',engagementId],initialPageParam:{},retry:false,
  queryFn:async({pageParam})=>Object.fromEntries(await Promise.all(kinds.map(async kind=>[kind,pageParam[kind]===false?{items:[],has_more:false}:await ieCall('projectDocuments',{engagement_id:engagementId,kind,cursor:pageParam[kind]||''})]))),
  getNextPageParam:page=>kinds.some(kind=>page[kind].has_more)?Object.fromEntries(kinds.map(kind=>[kind,page[kind].has_more?page[kind].next_cursor:false])):undefined
 });
 const pages=query.data?.pages||[];
 return {query,legalDocs:pages.flatMap(p=>p.legal.items),dmas:pages.flatMap(p=>p.dma.items),jcts:pages.flatMap(p=>p.jct.items),accountMap:Object.assign({},...pages.flatMap(p=>kinds.map(kind=>p[kind].accountMap||{}))),psoChecks:pages[0]?.legal.psoChecks};
}