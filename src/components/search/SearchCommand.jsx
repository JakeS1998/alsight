import React,{useCallback,useRef} from 'react';
import {Command as CommandPrimitive} from 'cmdk';
import {matchPositions} from '@/components/search/orderedSearch';
const SearchCommand=React.forwardRef(({filter,...props},ref)=>{
 const root=useRef(null);
 const attach=useCallback(node=>{root.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;},[ref]);
 const fallbackFilter=useCallback((value,search,keywords=[])=>{
  const term=search.trim().toLowerCase();if(!term)return 1;
  const text=[value,...keywords].join(' ').toLowerCase();
  if(text.includes(term))return 1;
  const direct=Array.from(root.current?.querySelectorAll('[data-search-text]:not([data-disabled=true])') || []).some(item=>item.dataset.searchText.toLowerCase().includes(term));
  return !direct && matchPositions(text,term).length ? 0.5 : 0;
 },[]);
 return <CommandPrimitive ref={attach} filter={filter || fallbackFilter} {...props}/>;
});
SearchCommand.displayName='SearchCommand';
export default SearchCommand;