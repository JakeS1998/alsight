import {commercialRule,commercialScoringVersion,withCommercialModel} from './aseCommercialScoring.ts';
import {ratingExplanation} from './aseRatingExplanation.ts';
export const internalRoles = ['admin','director','regional_director','bsm','bdm','finance'];
export const labels = ['Not assessed','Serious Concern','Weak','Stable / Monitor','Good','Strong'];
export const ratingPolicy = {version:'provisional-v1',standard_minimum_coverage:60,standard_minimum_components:3,provisional_minimum_components:1,no_evidence:'not_assessed',low_confidence_evidence:'provisional',missing_components:'exclude_and_renormalise'};
export const policySnapshot = policy => ({...policy.models,_rating_policy:ratingPolicy});
const numeric = (key,label,weighting,unit,thresholds,descending=false,strict=false) => ({key,label,weighting,unit,thresholds,descending,strict,type:'financial'});
const category = (key,label,weighting,type,choices) => ({key,label,weighting,type,choices:choices.map((label,i)=>({value:String(5-i),label,score:5-i}))});
export const defaultModels = {
  company: [
    numeric('financial_strength','Financial strength',27,'% net assets / total assets',[0,10,25,40]),
    numeric('financial_trend','Financial trend',18,'% annual revenue change',[-10,0,5,10]),
    numeric('liquidity','Liquidity',13.5,'current ratio',[0.75,1,1.25,2]),
    numeric('debt','Debt position',13.5,'% net interest-bearing debt / total assets',[10,25,40,60],true),
    category('compliance','Filing / corporate compliance',9,'compliance',['Current and timely filings','Current; confirmed late filing in preceding three years','Worst filing 1–30 days overdue','Worst filing 31–90 days overdue','Worst filing >90 days overdue or active strike-off']),
    category('adverse','Adverse events',9,'event',['Verified absence of relevant events','Resolved event within 24 months','Unresolved non-material event','Unresolved material default or enforcement','Confirmed insolvency or winding-up']),
    {...commercialRule},
  ],
  english_local_authority: [
    numeric('reserves','Reserves position',20,'% usable General Fund reserves / net revenue expenditure',[5,10,20,30]),
    numeric('reserves_trend','Reserves sustainability / trend',20,'percentage-point annual change in reserves ratio',[-5,-2,0,2]),
    numeric('borrowing','Borrowing / debt',15,'% financing costs / net revenue expenditure',[5,10,15,20],true),
    numeric('budget','Budget / outturn position',15,'% revenue overspend / budget',[0,1,2,5],true,true),
    category('efs','Exceptional Financial Support',15,'event',['Verified absence of support','Historical support; no current application or approval','Current application pending','Approved for current year','Approved in consecutive financial years']),
    category('audit','Audit / governance',10,'governance',['Unqualified opinion; no significant findings','Unqualified opinion with recommendations','Qualified opinion; no material governance failure','Confirmed material governance weaknesses','Adverse or disclaimed audit opinion']),
    category('intervention','Statutory intervention / serious event',5,'event',['Verified absence of relevant events','Resolved relevant event within 24 months','Formal non-statutory improvement action','Active statutory financial or governance intervention','Active Section 114 position']),
  ],
};
export function accountModel(account) {
  const type = (account.organisation_type || '').toLowerCase().replaceAll(' ','_');
  if (type === 'english_local_authority') return 'english_local_authority';
  if (['uk_limited_company','uk_plc','limited_company','plc','ltd'].includes(type) || (!type && ['ltd','plc'].includes(account.company_type))) return 'company';
  return null;
}
export async function getPolicy(base44) {
  const page = await base44.entities.ASEPolicy.filter({}, {sort:'-created_date',limit:1});
  const policy=page.items[0] || {version:'approved-v1',models:defaultModels};
  const models=withCommercialModel(policy.models);
  return {...policy,models,version:`${policy.version}|${commercialScoringVersion}|${ratingPolicy.version}`,rating_policy:ratingPolicy};
}
export function scoreEvidence(rule, evidence) {
  if (evidence.score_eligible === false) return null;
  if (rule.choices) return rule.choices.find(choice=>choice.value === evidence.value)?.score ?? null;
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(evidence.value)) return null;
  const value = Number(evidence.value);
  if (!Number.isFinite(value)) return null;
  if (rule.key === 'financial_trend' && (evidence.period_months !== 12 || evidence.currency !== 'GBP')) return null;
  const crosses = rule.thresholds.filter(threshold=>rule.strict ? value > threshold : value >= threshold).length;
  return rule.descending ? 5-crosses : 1+crosses;
}
export function calculate(models, model, evidence, now=new Date()) {
  const components = models[model].map(rule=>{
    const usable = evidence.filter(row=>row.component===rule.key && scoreEvidence(rule,row) !== null);
    const period = usable.map(row=>row.reporting_period).sort().at(-1);
    const periodRows = usable.filter(row=>row.reporting_period===period).sort((a,b)=>b.retrieval_date.localeCompare(a.retrieval_date));
    const latest = rule.choices ? periodRows.reduce((a,b)=>!a || scoreEvidence(rule,b)<scoreEvidence(rule,a) ? b : a,null) : periodRows[0];
    const score = latest ? scoreEvidence(rule,latest) : null;
    return {component:rule.key,component_label:rule.label,weighting:rule.weighting,score,weighted_score:score===null ? null : score*rule.weighting/100,evidence_ids:latest ? [latest.id] : [],metric_value:latest?.value || '',explanation:latest ? `${rule.label}: ${rule.choices ? rule.choices.find(c=>c.value===latest.value).label : `${latest.value} ${rule.unit}`}. Approved rule gives ${score}/5, weighted at ${rule.weighting}%.${latest.automatic_rule_version==='blackflag-financial-fallback-v1' ? ' Source: Blackflag secondary financial fallback; no verified eligible Companies House equivalent for this component and reporting period.' : ''}${rule.key===commercialRule.key ? ' '+latest.notes : ''}` : 'Missing or unusable evidence; excluded from the score.',latest};
  });
  const used = components.filter(row=>row.score !== null && row.weighting>0);
  const coverage = used.reduce((sum,row)=>sum+row.weighting,0);
  const rated = coverage>0 && used.length>0;
  const provisional = rated && (coverage<ratingPolicy.standard_minimum_coverage || used.length<ratingPolicy.standard_minimum_components || used.some(row=>row.latest.confidence==='Low'));
  const precise = rated ? used.reduce((sum,row)=>sum+row.score*row.weighting,0)/coverage : null;
  const financial = used.filter(row=>row.component!==commercialRule.key && models[model].find(rule=>rule.key===row.component).type==='financial');
  const periods = financial.length ? Math.min(...financial.map(c=>new Set(evidence.filter(row=>row.component===c.component && scoreEvidence(models[model].find(r=>r.key===c.component),row)!==null && row.period_months===12).map(row=>row.reporting_period)).size)) : 0;
  const monthsOld = date => (now.getTime()-new Date(date).getTime())/86400000/30.4375;
  const financialAge = financial.length ? Math.max(...financial.map(c=>monthsOld(c.latest.reporting_period))) : Infinity;
  const checks = used.filter(c=>models[model].find(r=>r.key===c.component).type!=='financial');
  const checkAge = checks.length ? Math.max(...checks.map(c=>Math.max((now.getTime()-new Date(c.latest.retrieval_date).getTime())/86400000,(now.getTime()-new Date(c.latest.source_date).getTime())/86400000))) : Infinity;
  const data_confidence = provisional ? 'Low' : coverage>=90 && financialAge<=18 && periods>=3 && checkAge<=90 ? 'High' : coverage>=60 && financialAge<=30 && periods>=2 && checkAge<=180 ? 'Medium' : 'Low';
  return {components,precise_score:precise,displayed_rating:precise===null ? null : Math.floor(precise+0.5),rating_label:(provisional ? 'Provisional · ' : '')+labels[precise===null ? 0 : Math.floor(precise+0.5)],coverage,data_confidence,confidence_explanation:`${coverage}% weighting supported; ${periods} comparable annual periods. Financial period age: ${Number.isFinite(financialAge) ? financialAge.toFixed(1)+' months' : 'unknown'}. Compliance/event check age: ${Number.isFinite(checkAge) ? Math.floor(checkAge)+' days' : 'unknown'}.`,explanation:ratingExplanation(components,models[model],precise,precise===null ? null : Math.floor(precise+0.5))};
}