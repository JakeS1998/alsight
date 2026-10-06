import {base44} from '@/api/base44Client';
import {formatCurrency} from '@/lib/portal';
export default async function frameworkAliceAnswer(question) {
 const text=question.toLowerCase(),allowed=text.replace(/total\s+(?:call[ -]?off|contract)\s+value/g,'').replace(/\bto budget\b/g,'');
 if(/\b(value|values|budget|budgets|cost|costs|fees?|margins?|invoices?|payments?|spend|forecast|variations?|commercial)\b|£/.test(allowed))return {text:'This Framework workspace permits only aggregate Total Call-Off Value. Project-level values and other commercial information are not available here. Use the appropriate protected Project area if you have access.',links:[]};
 const {data}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'summary',days:30});
 if(data.error)throw new Error(data.error);
 let answer,filters;
 if(/total.*(?:call[ -]?off|contract).*value/.test(text))answer=data.totalCallOffValue===undefined ? 'Total Call-Off Value is not available to your role.' : `Total Call-Off Value: ${formatCurrency(data.totalCallOffValue)}. This is the aggregate Framework total, without a breakdown.`;
 else if(/unlinked|not linked/.test(text)){answer=`${data.unlinked} of ${data.total} Framework projects are not linked to ALSight.`;filters={linked:'unlinked'};}
 else if(/agreement/.test(text)){answer=`${data.agreement} of ${data.total} projects have a recorded signed agreement; ${data.missingAgreements} have no agreement signed date.`;filters=/missing|not recorded|without/.test(text) ? {attention:'agreements'} : {stage:'aa_signed'};}
 else if(/outcome.*(?:missing|outstanding)|(?:missing|without|outstanding).*outcome/.test(text)){answer=`${data.outstanding} projects at Call-Off have no recorded delivery outcome.`;filters={attention:'outstanding'};}
 else if(/review/.test(text)){answer=`${data.review} outcomes require review because an explicit delayed, not-to-budget or RIDDOR outcome is recorded.`;filters={outcome:'review'};}
 else if(/on time|to budget|riddor|proportion|performance/.test(text))answer=`Recorded outcomes: On Time ${data.onTime} of ${data.onTimeRecorded}; To Budget ${data.toBudget} of ${data.budgetRecorded}; Zero RIDDOR ${data.safe} of ${data.safetyRecorded}. Each denominator includes only explicit recorded assessments. Overall outcome coverage: ${data.outcomes} of ${data.total}.`;
 else if(/changed|recent|new|activity/.test(text))answer=`Last 30 days: ${data.added} records added/imported, ${data.signed} recorded agreement signing dates, ${data.calledOff} recorded Call-Off dates, and ${data.outcomeUpdated} existing outcome records updated. ${data.activityNote}`;
 else if(/call[ -]?off/.test(text)){answer=`${data.calloff} of ${data.total} Framework projects have reached recorded Call-Off.`;filters={stage:'calloff_date'};}
 else if(/questionnaire/.test(text)){answer=`${data.questionnaire} of ${data.total} projects have a recorded Questionnaire date.`;filters={stage:'pq_date'};}
 else if(/linked/.test(text))answer=`${data.linked} of ${data.total} Framework projects are linked to ALSight. Linked project access still follows your permissions.`;
 else answer=`Framework context: ${data.total} projects, ${data.linked} linked to ALSight, ${data.outcomes} with recorded outcomes. Ask about missing agreements, unlinked projects, Call-Off, recorded outcomes, recent activity or aggregate Total Call-Off Value.`;
 let links=[];
 if(filters && /which|show|list|find/.test(text)){const {data:page}=await base44.functions.invoke('getStakeholderFrameworkReport',{workspaceAction:'list',filters,limit:10});answer+=` Showing ${page.rows.length} of ${page.count} matching records.`;links=page.rows.map(row=>({label:`${row.site || row.framework_ref} · ${row.client || 'Client not recorded'}`,to:`/framework-reports/${row.id}`}));}
 return {text:answer,links};
}