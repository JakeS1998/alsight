import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
const illustration='https://media.base44.com/images/public/6ab62433a194f918c54c8249/da9395d2a_generated_image.png';
export default function AdaptiveProjectCards({rows}) {
 return <div className="at-project-cards">{rows.slice(0,4).map((row,index)=><Link className="at-project-card" to={row.to} key={row.id}><div className="at-project-picture"><Image src={illustration} alt="" className="h-full w-full" focalPointX={0.35+index*0.15}/><span className="at-project-active">Active</span><span className="at-project-illustration">Illustration</span></div><div className="at-project-copy"><h4>{row.title}</h4><p>{row.detail||'Live project workspace'}</p><span><Building2 size={12}/> Open project <ArrowUpRight size={13}/></span></div></Link>)}</div>;
}