import {useEffect} from 'react';
export default function usePortalShortcuts(items,enabled,blocked,onRun){
 useEffect(()=>{
  let prefix='',timer;
  const reset=()=>{prefix='';clearTimeout(timer);};
  const handle=event=>{
   if(event.defaultPrevented||event.repeat||event.isComposing||event.ctrlKey||event.metaKey||event.altKey){reset();return;}
   const target=event.target;
   if(target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="dialog"],[role="alertdialog"],[role="menu"]')||document.querySelector('[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"],[role="menu"][data-state="open"],[role="listbox"][data-state="open"]')){reset();return;}
   if(event.key==='Escape'){reset();return;}
   if(blocked){reset();return;}
   const key=event.key.toLowerCase();
   if(!enabled&&key!=='?'){reset();return;}
   if(event.shiftKey&&key!=='?'){reset();return;}
   const sequence=prefix?`${prefix} ${key}`:key;
   const match=items.find(item=>item.keys===sequence);
   reset();
   if(match){event.preventDefault();onRun(match);return;}
   if(enabled&&items.some(item=>item.keys.startsWith(`${key} `))){event.preventDefault();prefix=key;timer=setTimeout(reset,1500);}
  };
  window.addEventListener('keydown',handle);
  window.addEventListener('blur',reset);
  document.addEventListener('focusin',reset);
  document.addEventListener('pointerdown',reset);
  return()=>{reset();window.removeEventListener('keydown',handle);window.removeEventListener('blur',reset);document.removeEventListener('focusin',reset);document.removeEventListener('pointerdown',reset);};
 },[items,enabled,blocked,onRun]);
}