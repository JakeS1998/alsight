import React from 'react';
import {ArrowRight} from 'lucide-react';
import IEServiceChart from '@/components/ie/IEServiceChart';
import IEStatusChart from '@/components/ie/IEStatusChart';
import IEWorkList from '@/components/ie/IEWorkList';
import IEQueryState from '@/components/ie/IEQueryState';
export default function IEDashboardAside({query,classifications,onFilter}){
 const data=query.data;
 return <><div className="ie-chart-column"><IEQueryState query={query}><IEServiceChart services={data?.services} classifications={classifications} onFilter={onFilter}/><IEStatusChart statuses={data?.statuses} total={data?.total} onFilter={onFilter}/></IEQueryState></div><div className="ie-work-column"><section className="ie-dashboard-panel"><header className="ie-panel-heading"><h2>My work</h2><button type="button" className="ie-text-action" onClick={()=>onFilter({mine:true})}>View all <ArrowRight/></button></header><IEQueryState query={query}><IEWorkList items={data?.mine} empty="No open engagements assigned to me."/></IEQueryState></section><section className="ie-dashboard-panel"><header className="ie-panel-heading"><h2>Needs attention</h2><button type="button" className="ie-text-action" onClick={()=>onFilter({attention:true})}>View all <ArrowRight/></button></header><IEQueryState query={query}><IEWorkList items={data?.needs} attention empty="Nothing needs attention right now."/></IEQueryState></section></div></>;
}