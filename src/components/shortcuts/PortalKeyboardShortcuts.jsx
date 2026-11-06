import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import useApprovalAccess from '@/components/approvals/useApprovalAccess';
import portalShortcutItems from '@/components/shortcuts/portalShortcutItems';
import usePortalShortcuts from '@/components/shortcuts/usePortalShortcuts';
import ShortcutHelp from '@/components/shortcuts/ShortcutHelp';
export default function PortalKeyboardShortcuts({user}){
 const navigate=useNavigate(),location=useLocation(),approvalAccess=useApprovalAccess();
 const [open,setOpen]=useState(false),[enabled,setEnabled]=useState(()=>localStorage.getItem('als-letter-shortcuts')!=='off');
 const items=useMemo(()=>portalShortcutItems(user,approvalAccess.enabled),[user,approvalAccess.enabled]);
 const run=useCallback(item=>{if(item.path)navigate(item.path);else window.dispatchEvent(new Event(item.event));},[navigate]);
 useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('als-open-shortcuts',show);return()=>window.removeEventListener('als-open-shortcuts',show);},[]);
 useEffect(()=>setOpen(false),[location.pathname]);
 usePortalShortcuts(items,enabled,open,run);
 return <ShortcutHelp open={open} onOpenChange={setOpen} items={items} enabled={enabled} onEnabledChange={value=>{setEnabled(value);localStorage.setItem('als-letter-shortcuts',value?'on':'off');}}/>;
}