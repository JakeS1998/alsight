import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { reportProject } from '../../shared/uklfCompletion.ts';
import {kpiYesNo,kpiMoney,kpiCounts,kpiText,validDate,derivedKpis,frameworkKpiCompletion} from '../../shared/frameworkKpiRules.ts';
import {researchFrameworkPopulation} from '../../shared/frameworkPopulation.ts';
import {invalidateScopedRead} from '../../shared/scopedReadCache.ts';

const INTERNAL = ['admin', 'director', 'regional_director', 'bsm', 'finance', 'bdm'];
const OUTCOMES = ['Y', 'N', ''];
const FIELDS = ['completed_on_time', 'completed_to_budget'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (!INTERNAL.includes(user.role)) return Response.json({ error: 'Internal team access required' }, { status: 403 });
    const {reportId,kpis,action,frameworkContext=false}=await req.json();
    if(typeof reportId!=='string' || !/^[a-f0-9]{24}$/i.test(reportId))return Response.json({error:'Invalid UKLF reference'},{status:400});
    if(frameworkContext && user.role!=='admin')return Response.json({error:'Framework administrator access required'},{status:403});
    // Read with the caller's permissions before the narrowly scoped privileged update.
    const existing=await base44.entities.FrameworkProjectReport.get(reportId);
    if(!existing)return Response.json({error:'UKLF record unavailable'},{status:404});
    const project=await reportProject({asServiceRole:{entities:base44.entities}},existing);
    if(user.role!=='admin' && !project)return Response.json({error:'An accessible linked project is required'},{status:403});
    if(project?.procurement_route===false)return Response.json({error:'Direct projects are outside UKLF reporting'},{status:400});
    let changes={},warning;
    if(action==='population') {
      const result=await researchFrameworkPopulation(base44,project,existing);changes=result.changes || {};warning=result.warning;
    } else {
      if(!kpis || typeof kpis!=='object' || Array.isArray(kpis))return Response.json({error:'Invalid KPI submission'},{status:400});
      if([...kpiYesNo,'high_level_review_date','high_level_evidence'].some(field=>Object.hasOwn(kpis,field)))return Response.json({error:'Maintain these reviews in Framework-wide KPIs, not against a project.'},{status:400});
      for(const field of [...kpiMoney,...kpiCounts]) {
        if(!Object.hasOwn(kpis,field))continue;
        const value=kpis[field];
        if(value!==null && (!Number.isFinite(value) || value<0 || value>1e12 || (kpiCounts.includes(field) && !Number.isInteger(value)) || (field==='riddor_reporting_year' && (value<1900 || value>2200))))return Response.json({error:`Invalid value for ${field.replaceAll('_',' ')}`},{status:400});
        changes[field]=value;
      }
      for(const field of kpiText) {
        if(!Object.hasOwn(kpis,field))continue;
        const value=kpis[field];
        if(typeof value!=='string' || value.length>(field==='high_level_evidence' ? 4000 : 1000) || (/date$|^pq_date$|^aa_signed$/.test(field) && value && !validDate(value)))return Response.json({error:`Invalid ${field.replaceAll('_',' ')}`},{status:400});
        changes[field]=value.trim();
      }
      if(changes.actual_completion_date && changes.actual_completion_date>new Date().toISOString().slice(0,10))return Response.json({error:'Actual completion cannot be in the future'},{status:400});
    }
    const merged={...existing,...changes};Object.assign(changes,derivedKpis(merged));
    if(Number.isInteger(merged.riddor_incidents))changes.zero_riddor=merged.riddor_incidents===0 ? 'Y' : 'N';
    const completion=frameworkKpiCompletion({...merged,...changes});
    Object.assign(changes,{kpis_complete:completion.complete,kpis_reviewed_at:new Date().toISOString(),kpis_reviewed_by:user.id});
    await base44.asServiceRole.entities.FrameworkProjectReport.update(reportId,changes);
    invalidateScopedRead('framework:');
    return Response.json({kpis:changes,kpiCompletion:completion,warning});
  } catch (error) {
    console.error('Unable to update UKLF KPIs', error);
    return Response.json({ error: 'Unable to save UKLF KPIs' }, { status: 500 });
  }
}