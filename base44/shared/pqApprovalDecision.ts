import {fail,hash,pqCurrentRecipient,publicPQRound} from './pqApprovalCommon.ts';
import {notifyPQApprover} from './pqApprovalNotify.ts';
export async function pqRecipientAction(base44,user,round,input){
 const db=base44.asServiceRole.entities,questionnaire=await db.ProjectQuestionnaire.get(round.questionnaire_id);
 if(!pqCurrentRecipient(round,user)||questionnaire?.approval_round_id!==round.id||questionnaire.status!=='submitted')fail('This approval issue is not awaiting your decision.',403);
 const step=round.steps[round.current_index];
 if(input.action==='send_code'){
  const recent=await db.PQApprovalChallenge.filter({round_id:round.id,user_id:user.id},{sort:'-sent_at',limit:1});
  if(recent.items[0]&&Date.now()-Date.parse(recent.items[0].sent_at)<60000)fail('Wait one minute before requesting another code.',429);
  if(await db.PQApprovalChallenge.count({round_id:round.id,user_id:user.id,sent_at:{$gte:new Date(Date.now()-86400000).toISOString()}})>=10)fail('Daily verification-code limit reached.',429);
  const random=new Uint32Array(1);crypto.getRandomValues(random);const code=String(100000+random[0]%900000),salt=crypto.randomUUID(),now=new Date();
  const challenge=await db.PQApprovalChallenge.create({round_id:round.id,user_id:user.id,step_index:round.current_index,code_hash:`${salt}:${await hash(`${salt}:${code}`)}`,sent_at:now.toISOString(),expires_at:new Date(now.getTime()+600000).toISOString(),attempts:0,used:false});
  try{await base44.asServiceRole.integrations.Core.SendEmail({to:step.email,from_name:'ALS Hub',template_name:'PQApprovalVerification',variables:{code}});}catch(error){await db.PQApprovalChallenge.update(challenge.id,{used:true});throw error;}
  return {challenge_id:challenge.id};
 }
 if(!['approve','reject'].includes(input.decision)||typeof input.comment!=='string'||input.comment.length>1000)fail('Choose a decision and use no more than 1,000 characters for comments.');
 if(input.confirmed!==true||input.snapshotHash!==round.snapshot_hash)fail('Review and confirm the issued questionnaire before deciding.');
 if(input.decision==='reject'&&!input.comment.trim())fail('Provide a reason for rejecting this questionnaire.');
 if(typeof input.challengeId!=='string'||!/^[a-f0-9]{24}$/i.test(input.challengeId)||typeof input.code!=='string'||!/^\d{6}$/.test(input.code))fail('Request and enter the six-digit verification code.');
 const challenge=await db.PQApprovalChallenge.get(input.challengeId);
 if(!challenge||challenge.round_id!==round.id||challenge.user_id!==user.id||challenge.step_index!==round.current_index||challenge.used||Date.parse(challenge.expires_at)<=Date.now())fail('Verification expired. Request a new code.',403);
 if(challenge.attempts>=5)fail('Too many attempts. Request a new code.',429);
 const attempt=await db.PQApprovalChallenge.updateMany({id:challenge.id,attempts:challenge.attempts,used:false},{$inc:{attempts:1}});
 if(!attempt.updated)fail('Verification is already in progress. Try again.',409);
 const [salt,expected]=challenge.code_hash.split(':');if(await hash(`${salt}:${input.code}`)!==expected)fail('The verification code is incorrect.',403);
 const now=new Date().toISOString(),approved=input.decision==='approve',next=approved?round.current_index+1:round.current_index,status=approved?(next===round.steps.length?'approved':'active'):'rejected';
 const steps=round.steps.map((entry,index)=>index===round.current_index?{...entry,status:approved?'approved':'rejected',decided_at:now,comment:input.comment.trim(),verification_method:'email_otp'}:entry);
 const updated=await db.PQApprovalRound.updateMany({id:round.id,status:'active',current_index:round.current_index},{$set:{steps,current_index:next,status,...(status!=='active'?{completed_at:now}:{})}});
 if(!updated.updated)fail('A decision has already been recorded or this issue was withdrawn.',409);
 await db.PQApprovalChallenge.update(challenge.id,{used:true});
 const result=await db.PQApprovalRound.get(round.id);
 return {round:publicPQRound(result),...await notifyPQApprover(base44,result)};
}