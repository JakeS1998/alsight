import React from 'react';
import {Link} from 'react-router-dom';
import {Building2,ArrowUpRight} from 'lucide-react';
import {StatusBadge} from '@/components/StatusBadge';
import {IE_STATUSES} from '@/components/ie/ieClient';
import {IE_SERVICES} from '@/components/ie/ieServices';
import {formatDate} from '@/lib/portal';
export default function IERegisterTable({items=[]}){
 return <div className="ie-table-scroll"><table className="ie-engagement-table"><thead><tr>{['Engagement','Client','Service','Product','Status','SAM','Target completion','Linked to',''].map((label,i)=><th key={label||i} scope="col">{label}</th>)}</tr></thead><tbody>{items.map(item=><tr key={item.id}><td><Link className="ie-table-title" to={`/insights-engagement/${item.id}`}><span className="ie-row-thumb"><Building2 strokeWidth={1.5}/></span><span><strong>{item.name}</strong><small>{item.reference}</small></span></Link></td><td>{item.client_name||'Not recorded'}</td><td>{IE_SERVICES[item.service]||'Not recorded'}</td><td><span>{item.product_name||'Not classified'}</span><small className="ie-cell-secondary">{item.support_type_name}</small></td><td><StatusBadge status={item.status} map={IE_STATUSES}/></td><td>{item.owner_name||'Unassigned'}</td><td className="whitespace-nowrap">{item.target_date?formatDate(item.target_date):'Not set'}</td><td><span title={item.project_name||item.opportunity_name}>{item.project_name?'Project':item.opportunity_name?'Opportunity':'Standalone'}</span></td><td><Link className="ie-open-link" to={`/insights-engagement/${item.id}`} aria-label={`Open ${item.name}`}><ArrowUpRight/></Link></td></tr>)}</tbody></table>{!items.length&&<p className="ie-register-empty">No engagements match these filters.</p>}</div>;
}