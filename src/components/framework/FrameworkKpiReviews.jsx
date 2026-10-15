import React from 'react';
import {YES_NO_FIELDS} from '@/components/framework/frameworkKpiFields';
export default function FrameworkKpiReviews({data}) {
 return <div><h3 className="kpi-sectionhead">High-level KPIs · latest recorded ALS reviews</h3><div className="kpi-high">{YES_NO_FIELDS.map(([key,label])=>{const metric=data.highLevel[key];return <div key={key} className="kpi-review"><p>{label}</p><div className="kpi-counts"><span><b>{metric.yes}</b> confirmed</span><span><b>{metric.no}</b> not met</span><span><b>{data.total-metric.yes-metric.no}</b> not recorded</span></div></div>;})}</div></div>;
}