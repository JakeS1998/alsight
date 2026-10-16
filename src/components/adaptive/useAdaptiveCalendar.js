import { useInfiniteQuery } from '@tanstack/react-query';
import calendarRequest from '@/components/outlook/calendarClient';
import { dayBounds, localDay, localTime } from '@/components/adaptive/adaptiveTime';
const utc=value=>/(?:Z|[+-]\d{2}:\d{2})$/i.test(value||'')?value:`${value}Z`;
export default function useAdaptiveCalendar(user,now,enabled=true) {
 const bounds=dayBounds(now);
 const query=useInfiniteQuery({queryKey:['adaptive-outlook-agenda',user.id,bounds.day],enabled:enabled&&!!user.id,initialPageParam:null,queryFn:({pageParam})=>calendarRequest('list',{start:bounds.start,end:bounds.calendarEnd,timeZone:'UTC',...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.next_cursor||undefined,staleTime:120000,retry:false,refetchOnWindowFocus:true});
 const events=(query.data?.pages||[]).flatMap(page=>page.events).map(event=>{
  const startsAt=Date.parse(utc(event.start?.dateTime)),endsAt=Date.parse(utc(event.end?.dateTime)),time=event.isAllDay?'All day':localTime(startsAt),finish=localTime(endsAt);
  const day=localDay(startsAt);
  return {key:`outlook-${event.id}`,kind:'calendar',title:event.subject||'Untitled event',time,day,startsAt,endsAt,allDay:!!event.isAllDay,sort:`${day}T${event.isAllDay?'00:00':time}`,detail:[event.isAllDay?'All day':`${time}–${finish}`,event.location?.displayName,event.isOnlineMeeting?'Online meeting':''].filter(Boolean).join(' · '),attendees:(event.attendees||[]).map(a=>a.emailAddress?.name||a.emailAddress?.address).filter(Boolean),ended:endsAt<=now,href:event.webLink,joinUrl:event.isOnlineMeeting&&event.onlineMeetingProvider==='teamsForBusiness'&&/^https:\/\//i.test(event.onlineMeeting?.joinUrl||'')?event.onlineMeeting.joinUrl:null};
 }).sort((a,b)=>a.startsAt-b.startsAt);
 return {updatedAt:query.dataUpdatedAt,refreshing:query.isFetching,nextWorkingRows:events.filter(e=>e.startsAt>=Date.parse(bounds.nextWorkStart)&&e.startsAt<Date.parse(bounds.nextWorkEnd)),rows:events.filter(e=>e.startsAt<Date.parse(bounds.tomorrowStart)&&e.endsAt>Date.parse(bounds.start)),tomorrowRows:events.filter(e=>e.startsAt>=Date.parse(bounds.tomorrowStart)&&e.startsAt<Date.parse(bounds.end)),loading:query.isPending,error:query.error,more:!!query.hasNextPage,loadingMore:query.isFetchingNextPage,loadMore:query.fetchNextPage,refresh:query.refetch};
}