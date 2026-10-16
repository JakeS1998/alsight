import React from 'react';
import FrameworkKpiMatrix from '@/components/framework/FrameworkKpiMatrix';
import FrameworkKpiConversion from '@/components/framework/FrameworkKpiConversion';
export default function FrameworkKpiPeriodTable({periods}) {

 return <div className="kpi-dash"><FrameworkKpiMatrix periods={periods}/><FrameworkKpiConversion periods={periods}/></div>;
}