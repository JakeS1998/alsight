import {createClientFromRequest} from 'npm:@base44/sdk@0.8.52';
export default async function(req){
 try{
  const base44=createClientFromRequest(req),user=await base44.auth.me();
  if(!user)return Response.json({error:'Sign in to continue.'},{status:401});
  if(!['admin','director','regional_director','bsm','finance','bdm'].includes(user.role))return Response.json({error:'Internal commercial access required.'},{status:403});
  if(req.method!=='POST')return Response.json({error:'Method not allowed.'},{status:405});
  const text=await req.text();if(text.length>1000)throw new Error('Request too large.');
  const {accountId}=JSON.parse(text);if(typeof accountId!=='string'||!accountId||accountId.length>80)throw new Error('Choose a supplier.');
  const account=await base44.entities.Account.get(accountId);
  if(!account)throw new Error('Supplier unavailable.');
  const supplier={$or:[{account_id:account.id},...(account.company_number?[{supplier_company_number:account.company_number}]:[])]};
  const grouped=await base44.entities.COMS.aggregate({query:{...supplier,commission_rate:{$gte:0,$lte:100}},groupBy:'project_ref',avg:'commission_rate',limit:1000});
  if(grouped.truncated)throw new Error('Commission history is too large for a complete average.');
  const refs=grouped.rows.map(r=>r.project_ref).filter(Boolean);
  if(!refs.length)return Response.json({average:null,projects:0,excluded:grouped.rows.length});
  const projects=await base44.entities.Project.aggregate({query:{project_number:{$in:refs}},groupBy:'project_number',max:['full_value','submitted_proposal_value','estimated_value'],limit:1000});
  if(projects.truncated)throw new Error('Project values are incomplete; average unavailable.');
  let numerator=0,denominator=0,count=0,excluded=0;
  for(const rate of grouped.rows){
   const p=projects.rows.find(p=>p.project_number===rate.project_ref);
   const value=p?.max_full_value??p?.max_submitted_proposal_value??p?.max_estimated_value;
   if(!p||p.count!==1||!Number.isFinite(value)||value<=0||!Number.isFinite(rate.avg_commission_rate)){excluded++;continue;}
   numerator+=rate.avg_commission_rate*value;denominator+=value;count++;
  }
  return Response.json({average:denominator?numerator/denominator:null,projects:count,excluded});
 }catch(error){return Response.json({error:error.message||'Unable to load supplier commissions.'},{status:400});}
}