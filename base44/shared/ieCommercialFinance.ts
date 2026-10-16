import {ieScope,ieError} from './ieAccess.ts';
import {ieHeadlineAction} from './ieHeadlineActions.ts';
import {ieFinanceKeys} from './ieFinanceFields.ts';
export async function ieCommercialFinance(base44,user){
 const db=base44.asServiceRole.entities;
 const [headlines,engagements]=await Promise.all([ieHeadlineAction(base44,user,{action:'headlines'}),db.IEEngagement.filter(ieScope(user),{distinct:'id',limit:1000})]);
 if(engagements.has_more)ieError('The I&E commercial reporting limit was reached.');
 const result=engagements.items.length?await db.IEFinance.aggregate({query:{engagement_id:{$in:engagements.items}},sum:ieFinanceKeys}):{rows:[]};
 if(result.truncated)ieError('The I&E finance reporting limit was reached.');
 const row=result.rows[0],recorded=Number(row?.count)||0;
 const totals=Object.fromEntries(ieFinanceKeys.map(key=>[key,recorded?Math.round((Number(row?.[`sum_${key}`])||0)*100)/100:null]));
 return {headlines,recorded,totals};
}