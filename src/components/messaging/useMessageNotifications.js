import {useCallback,useRef} from 'react';
import {useToast} from '@/components/ui/use-toast';

export default function useMessageNotifications(userId) {
 const {toast}=useToast(),seen=useRef(new Set());
 const requestPermission=useCallback(async()=>{
  if(!('Notification' in window)||!window.isSecureContext)return;
  const key=`als-message-notification-prompt:${userId}`;
  if(Notification.permission!=='default'||localStorage.getItem(key))return;
  localStorage.setItem(key,'asked');
  try {
   const permission=await Notification.requestPermission();
   if(permission==='granted')toast({title:'Desktop message notifications enabled',description:'You’ll receive alerts while ALS Hub is open.'});
   else toast({title:'Desktop notifications are not enabled',description:'You can allow them later in your browser’s site settings.'});
  } catch {
   toast({title:'Notification permission could not be requested',description:'Open ALS Hub directly in your browser and allow notifications in its site settings.'});
  }
 },[userId,toast]);
 const notify=useCallback((event,person,onOpen)=>{
  const message=event.data,id=event.id||message?.id;
  if(event.type!=='create'||!id||message?.recipient_id!==userId||message.sender_id===userId||seen.current.has(id))return;
  seen.current.add(id);
  if(seen.current.size>200)seen.current.delete(seen.current.values().next().value);
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const notification=new Notification(person.name==='Team member'?'New ALS Hub message':`${person.name} sent you a message`,{body:message.body||'Open Messages to read your new message.',tag:`als-message:${id}`});
  notification.onclick=()=>{window.focus();onOpen(person);notification.close();};
 },[userId]);
 return {requestPermission,notify};
}