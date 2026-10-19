import React from 'react';
import AdaptiveProjectCard from '@/components/adaptive/AdaptiveProjectCard';
export default function AdaptiveProjectCards({rows}) {
 return <div className="at-project-cards">{rows.slice(0,5).map(row=><AdaptiveProjectCard key={row.id} row={row}/>)}</div>;
}