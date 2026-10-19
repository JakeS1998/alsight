import React from 'react';
import {useCommandState} from 'cmdk';
import SearchHighlight from '@/components/search/SearchHighlight';
export default function CommandSearchText({children}) {
 const term=useCommandState(state=>state.search);
 function highlight(node) {
  if(typeof node==='string' || typeof node==='number')return <SearchHighlight text={node} term={term}/>;
  if(!React.isValidElement(node) || !node.props.children || node.type==='mark')return node;
  return React.cloneElement(node,{},React.Children.map(node.props.children,highlight));
 }
 return <>{React.Children.map(children,highlight)}</>;
}