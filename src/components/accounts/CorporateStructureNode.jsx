import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
export default function CorporateStructureNode({ node, nodes, currentId, ancestorIds, path=[] }) {
  if(path.includes(node.id)) return null;
  const children=nodes.filter(row=>row.parentId===node.id),current=node.id===currentId;
  const label=current ? 'This organisation' : ancestorIds.includes(node.id) ? 'Recorded ancestor' : node.parentId ? 'Group organisation' : 'Recorded group root';
  const content=<div className={`flex items-start gap-3 rounded-lg border p-3 ${current ? 'border-primary bg-primary/10' : 'border-border bg-muted/50'}`}><Building2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"/><div className="min-w-0"><Link to={`/accounts/${node.id}`} aria-current={current ? 'page' : undefined} className="break-words text-sm font-semibold hover:underline">{node.name}</Link><p className="text-xs text-muted-foreground">{label}{node.company_number ? ` · ${node.company_number}` : ''}</p></div></div>;
  return <li className="list-none">{children.length ? <details open><summary className="cursor-pointer marker:text-muted-foreground">{content}</summary><ul className="ml-4 mt-2 space-y-2 border-l border-border pl-3">{children.map(child=><CorporateStructureNode key={child.id} node={child} nodes={nodes} currentId={currentId} ancestorIds={ancestorIds} path={[...path,node.id]}/>)}</ul></details> : content}</li>;
}