import React from 'react';
import {Navigate,useLocation} from 'react-router-dom';
export default function LegacyPageRedirect({from,to}) {
 const {pathname,search,hash}=useLocation();
 return <Navigate replace to={`${to}${pathname.slice(from.length)}${search}${hash}`}/>;
}