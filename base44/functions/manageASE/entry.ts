import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { internalRoles,defaultModels,accountModel,getPolicy,calculate } from '../../shared/asePolicy.ts';
import { createAssessment,validateEvidence,currentASESourceQuery } from '../../shared/aseAssessment.ts';
import { seedDemo } from '../../shared/aseDemo.ts';
import { explainAssessment } from '../../shared/aseInsight.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44=createClientFromRequest(req), user=await base44.auth.me();
    if (!user || !internalRoles.includes(user.role)) return Response.json({error:'ASE is available to internal staff only.'},{status:403});
    const input=await req.json();
    const actions=['policy','savePolicy','seed','summary','detail','addEvidence','assess','explain','checkRules'];
    if (!actions.includes(input.action)) return Response.json({error:'Invalid ASE operation.'},{status:400});
    if (['savePolicy','seed','addEvidence','assess','checkRules'].includes(input.action) && user.role!=='admin') return Response.json({error:'Only administrators can manage ASE evidence, assessments and policy.'},{status:403});
    const policy=await getPolicy(base44);
    if (input.action==='policy') return Response.json({policy});
    if (input.action==='savePolicy') {
      const models={};
      for (const [model,rules] of Object.entries(defaultModels)) {
        const supplied=input.weights?.[model];
        if (!supplied || Object.keys(supplied).length!==rules.length) return Response.json({error:'Supply every component weighting.'},{status:400});
        const weights=rules.map(rule=>supplied[rule.key]);
        if (weights.some(value=>!Number.isFinite(value) || value<0 || value>100) || Math.abs(weights.reduce((a,b)=>a+b,0)-100)>0.000001) return Response.json({error:'Each model must total 100%, with non-negative weightings.'},{status:400});
        models[model]=rules.map(rule=>({...rule,weighting:supplied[rule.key]}));
      }
      const saved=await base44.entities.ASEPolicy.create({version:`approved-${new Date().toISOString()}`,models,approved_by:user.id});
      return Response.json({policy:saved});
    }
    if (input.action==='seed') return Response.json({accounts:await seedDemo(base44,policy)});
    if (input.action==='checkRules') {
      const make=(component,value,period='2026-03-31')=>({id:component+period,component,value:String(value),period_months:12,currency:'GBP',reporting_period:period,source_date:'2026-09-30',retrieval_date:'2026-10-05T00:00:00Z'});
      const full=defaultModels.company.map((r,i)=>make(r.key,[30,6,1.5,18,'5','5'][i]));
      const a=calculate(defaultModels,'company',full,new Date('2026-10-05'));
      const b=calculate(defaultModels,'company',full.filter(r=>r.component!=='adverse'),new Date('2026-10-05'));
      const c=calculate(defaultModels,'company',full.slice(0,1),new Date('2026-10-05'));
      const d=calculate(defaultModels,'english_local_authority',defaultModels.english_local_authority.map((r,i)=>make(r.key,[25,1,8,0.5,'5','4','5'][i])),new Date('2026-10-05'));
      const checks={company:a.precise_score===4.2 && a.displayed_rating===4,missingRenormalised:Math.abs(b.precise_score-37/9)<0.00001,insufficientUnassessed:c.displayed_rating===null,council:Math.abs(d.precise_score-4.2)<0.00001};
      return Response.json({checks,passed:Object.values(checks).every(Boolean)});
    }
    if (typeof input.accountId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.accountId)) return Response.json({error:'Valid Account is required.'},{status:400});
    const account=await base44.entities.Account.get(input.accountId);
    if (!account) return Response.json({error:'Account unavailable.'},{status:404});
    const model=accountModel(account);
    const currentPage=await base44.entities.ASECurrentRating.filter({account_id:account.id},{limit:1});
    const current=currentPage.items[0] || null;
    if (input.action==='summary') return Response.json({current,model});
    if (input.action==='addEvidence') {
      if (!model) return Response.json({error:'Select a supported organisation type in Account details first.'},{status:400});
      const data=validateEvidence(input.evidence || {},policy.models[model]);
      const evidence=await base44.entities.ASEEvidence.create({...data,account_id:account.id,is_demo:account.name.startsWith('ASE Demo')});
      return Response.json({evidence});
    }
    if (input.action==='assess') return Response.json({assessment:await createAssessment(base44,account,policy)});
    if (input.cursor!=null && (typeof input.cursor!=='string' || input.cursor.length>4096)) return Response.json({error:'Invalid history cursor.'},{status:400});
    if (input.assessmentId!=null && (typeof input.assessmentId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.assessmentId))) return Response.json({error:'Invalid assessment.'},{status:400});
    const selectedId=input.assessmentId || current?.assessment_id;
    const assessment=selectedId ? await base44.entities.ASEAssessment.get(selectedId) : null;
    if (assessment && (assessment.account_id!==account.id || assessment.status!=='published')) return Response.json({error:'Assessment unavailable for this Account.'},{status:404});
    const [componentPage,evidencePage]=assessment ? await Promise.all([base44.entities.ASEComponentScore.filter({assessment_id:assessment.id},{limit:10}),base44.entities.ASEEvidence.filter({assessment_id:assessment.id},{limit:100})]) : [{items:[]},{items:[]}];
    if (input.action==='explain') {
      if (!assessment) return Response.json({error:'Create an assessment first.'},{status:400});
      const previous=assessment.previous_assessment_id ? await base44.entities.ASEEvidence.filter({assessment_id:assessment.previous_assessment_id},{limit:100}) : {items:[]};
      return Response.json({insight:await explainAssessment(base44,assessment,componentPage.items,evidencePage.items,previous.items)});
    }
    const [history,sourceEvidence]=await Promise.all([base44.entities.ASEAssessment.filter({account_id:account.id,status:'published'},{sort:'-assessment_date',limit:20,...(input.cursor ? {cursor:input.cursor} : {})}),base44.entities.ASEEvidence.filter(currentASESourceQuery(account),{limit:100})]);
    return Response.json({account:{id:account.id,name:account.name},model,policy,current,assessment,components:componentPage.items,evidence:evidencePage.items,history,sourceEvidence:sourceEvidence.items,sourceHasMore:sourceEvidence.has_more});
  } catch(error) {return Response.json({error:error.message || 'Unable to complete ASE operation.'},{status:400});}
}