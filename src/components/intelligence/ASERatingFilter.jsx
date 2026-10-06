import React from 'react';
import { FilterSelect } from '@/components/FilterSelect';
const options = {
 project: [{value:'attention',label:'Needs attention'},{value:'clear',label:'Recorded indicators clear'},{value:'unassessed',label:'Not assessed'}],
 opportunity: [{value:'attention',label:'Needs attention'},{value:'complete',label:'Recorded context complete'}],
 lost: [{value:'lost',label:'Closed · Lost'}],
};
export default function ASERatingFilter({kind,value,onChange}) {
 return <FilterSelect label="ASE rating" value={value || ''} onChange={onChange} options={options[kind] || []}/>;
}