import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import calendarRequest from '@/components/outlook/calendarClient';
export default function useMeetingProjects(userId,meeting) {
 const attendees=meeting.attendeeDetails||[];
 const auth=useQuery({queryKey:['adaptive-outlook-auth',userId],queryFn:()=>base44.auth.isAuthenticated(),enabled:!!userId,staleTime:120000});
 const query=useInfiniteQuery({queryKey:['adaptive-meeting-projects',userId,meeting.id,JSON.stringify(attendees)],enabled:auth.data===true&&!!meeting.id&&attendees.length>0,initialPageParam:null,queryFn:({pageParam})=>calendarRequest('meetingProjects',{attendees,...(pageParam?{cursor:pageParam}:{})}),getNextPageParam:page=>page.next_cursor||undefined,staleTime:120000,refetchInterval:300000,retry:false,refetchOnWindowFocus:true});
 return {...query,projects:(query.data?.pages||[]).flatMap(page=>page.items),total:query.data?.pages[0]?.total??0,unmatched:query.data?.pages[0]?.unmatchedAttendees||[],limited:query.data?.pages[0]?.contactsLimited,loading:attendees.length>0&&(auth.isPending||auth.data===true&&query.isPending),error:auth.error||query.error};
}