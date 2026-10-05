import React from 'react';
import {Link} from 'react-router-dom';
const internal=/^\/(?:projects(?:\/[a-zA-Z0-9_-]+)?|accounts(?:\/[a-zA-Z0-9_-]+(?:\/contacts\/[a-zA-Z0-9_-]+)?)?|opportunities\/[a-zA-Z0-9_-]+|crm(?:\/(?:contacts\/[a-zA-Z0-9_-]+|opportunities|pipeline|tasks|activities|clients))?|framework-reports(?:\/[a-zA-Z0-9_-]+)?|documents|warranties|help)(?:[?#].*)?$/;
export default function AliceRecordLink({href,children}) {
 const className='font-medium underline underline-offset-2 hover:text-primary';
 if(internal.test(href || ''))return <Link to={href} className={className}>{children}</Link>;
 if(/^https:\/\//i.test(href || ''))return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
 return <span>{children}</span>;
}