import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
import {internalRoles} from '../../shared/asePolicy.ts';
import {getASEV2Policy,validateASEV2Config} from '../../shared/aseV2Config.ts';
import {createASEV2Assessment} from '../../shared/aseV2Assessment.ts';
import {validateV2Input} from '../../shared/aseV2Inputs.ts';
import {checkASEV2Rules} from '../../shared/aseV2Checks.ts';
import {checkAppointmentExposure} from '../../shared/aseAppointmentChecks.ts';
import {withASEAutomationLease} from '../../shared/aseAutomationLease.ts';
import {startLeadershipRun,advanceLeadershipRun,publicLeadershipRun} from '../../shared/aseLeadershipRuns.ts';
import {saveLeadershipReview} from '../../shared/aseLeadershipReviews.ts';
import {checkLeadershipRules} from '../../shared/aseLeadershipChecks.ts';
import {officialSanctions} from '../../shared/aseLeadershipSanctions.ts';
import {checkASEV2Scheduling} from '../../shared/aseV2SchedulingChecks.ts';
import {v2DisplayAssessment} from '../../shared/aseV2Display.ts';
import {dataRequestError} from '../../shared/dataRequestError.ts';
export default async function(req: Request): Promise<Response> {
  try {
    const base44=createClientFromRequest(req),user=await base44.auth.me();
    if(!user || !internalRoles.includes(user.role)) return Response.json({error:'ASE v2 is internal-only.'},{status:403});
    const input=await req.json();if(!['detail','history','configuration','saveConfiguration','saveInput','assess','checkRules','leadershipStart','leadershipStep','leadershipStatus','leadershipReview'].includes(input.action)) return Response.json({error:'Invalid ASE v2 operation.'},{status:400});
    if(['saveConfiguration','saveInput','assess','checkRules','leadershipStart','leadershipStep','leadershipStatus','leadershipReview'].includes(input.action) && user.role!=='admin') return Response.json({error:'Only administrators can approve ASE v2 methodology, evidence or assessments.'},{status:403});
    if(input.action==='checkRules') {const core=checkASEV2Rules(),leadership=checkLeadershipRules(),scheduling=await checkASEV2Scheduling(),appointments=await checkAppointmentExposure();let liveSanctions;if(input.liveSources===true){const list=await officialSanctions();liveSanctions={publication_date:list.date,designation_count:list.entries.length,integrity_sha256:list.sha256};}return Response.json({...core,leadership,scheduling,appointments,passed:core.passed && leadership.passed && scheduling.passed && appointments.passed,...(liveSanctions ? {liveSanctions} : {})});}
    const policy=await getASEV2Policy(base44.entities);
    if(input.action==='configuration') return Response.json({policy});
    if(input.action==='saveConfiguration') {if(input.confirmed!==true || JSON.stringify(input.configuration).length>16000) throw new Error('Confirm the bounded methodology configuration.');const configuration=validateASEV2Config(input.configuration);return Response.json({policy:await base44.entities.ASEV2Policy.create({version:`ASE-v2-${new Date().toISOString()}`,configuration,approved_by:user.id})});}
    if(typeof input.accountId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.accountId)) throw new Error('Valid relationship required.');
    const account=await base44.entities.Account.get(input.accountId);if(!account) return Response.json({error:'Relationship unavailable.'},{status:404});
    if(input.action==='leadershipStatus') {const page=await base44.entities.ASELeadershipRun.filter({account_id:account.id},{sort:'-created_date',limit:1});return Response.json({run:publicLeadershipRun(page.items[0])});}
    if(input.action==='leadershipReview') return Response.json({saved:await saveLeadershipReview(base44.entities,account,input,user,policy.configuration.leadership)});
    if(['leadershipStart','leadershipStep'].includes(input.action)) {
      const result=await withASEAutomationLease(base44,async assertLease=>{if(input.action==='leadershipStart') return startLeadershipRun(base44.entities,account,user,policy.configuration.leadership);if(typeof input.runId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.runId)) throw new Error('Valid screening run required.');const run=await base44.entities.ASELeadershipRun.get(input.runId);if(!run || run.account_id!==account.id) throw new Error('Screening run unavailable.');return advanceLeadershipRun(base44.entities,run,policy.configuration.leadership,assertLease);},`account:${account.id}`);
      if(result.busy) return Response.json({error:'An update for this organisation is already running; resume screening when it finishes.'},{status:409});return Response.json({run:result});
    }
    if(input.action==='saveInput') return Response.json({saved:await base44.entities.ASEV2OrganisationInput.create(validateV2Input(input,account,user))});
    if(input.action==='assess') {
      if(input.confirmed!==true || account.name.startsWith('ASE Demo') || account.status==='inactive') throw new Error('Confirm reassessment of a live, non-demo relationship.');
      const result=await withASEAutomationLease(base44,assertLease=>createASEV2Assessment(base44,account,user,policy,assertLease),`account:${account.id}`);
      if(result.busy) return Response.json({error:'An update for this organisation is already running; retry when its current step finishes.'},{status:409});
      return Response.json({assessment:result});
    }
    if(input.cursor!=null && (typeof input.cursor!=='string' || input.cursor.length>4096)) throw new Error('Invalid history cursor.');
    const history=await base44.entities.ASEV2Assessment.filter({account_id:account.id},{sort:'-assessment_date',limit:10,...(input.cursor ? {cursor:input.cursor} : {})});
    if(input.action==='history') return Response.json({history:{...history,items:history.items.map(v2DisplayAssessment)}});
    const currentPage=await base44.entities.ASEV2Current.filter({account_id:account.id},{limit:1}),current=currentPage.items[0] || null;
    if(input.assessmentId!=null && (typeof input.assessmentId!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(input.assessmentId))) throw new Error('Invalid assessment reference.');
    const id=input.assessmentId || current?.assessment_id,assessment=id ? await base44.entities.ASEV2Assessment.get(id) : null;
    if(assessment && assessment.account_id!==account.id) return Response.json({error:'Assessment belongs to another relationship.'},{status:403});
    return Response.json({policy,current,assessment:v2DisplayAssessment(assessment),history:{...history,items:history.items.map(v2DisplayAssessment)}});
  } catch(error){return dataRequestError(error,'Unable to complete ASE v2 operation.',400);}
}