import {ieError,ieText,ieToday} from './ieAccess.ts';
import {iePeople,iePersonMap,ieAccessUsers} from './iePeople.ts';
import {ieServiceValue} from './ieServiceValue.ts';
const statuses=['scoping','planned','live','on_hold','completed','cancelled'];
export async function ieValues(base44,user,input,previous){
 const db=base44.asServiceRole.entities,values=input.values||{},out={};
 for(const [field,max] of Object.entries({name:250,client_id:100,owner_id:100,opportunity_id:100,project_id:100,category_id:100,support_type_id:100,region_id:100,description:6000,expected_outcome:4000,notes_risks:4000,action_note:1000}))out[field]=ieText(values[field],max);
 if(!out.name||!out.client_id||!out.owner_id)ieError('Enter a name, client and responsible SAM.');
 const people=await iePeople(db),map=iePersonMap(people);
 if(user.role==='sam'&&!previous&&map.get(out.owner_id)?.user_id!==user.id)ieError('Create the engagement in your own name; a SAM Director can reassign it.',403);
 if(user.role==='sam'&&previous&&(out.owner_id!==previous.owner_id||JSON.stringify(values.team_ids||[])!==JSON.stringify(previous.team_ids||[])))ieError('A SAM Director must change engagement ownership or team membership.',403);
 out.status=values.status||'scoping';out.priority=values.priority||'normal';
 if(!statuses.includes(out.status)||!['normal','high','urgent'].includes(out.priority))ieError('Choose a valid status and priority.');
 for(const key of ['start_date','target_date','completion_date']){out[key]=ieText(values[key],10);if(out[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(out[key])||isNaN(Date.parse(out[key]))||new Date(out[key]).toISOString().slice(0,10)!==out[key]))ieError('Enter a valid date.');}
 if(out.start_date&&out.target_date&&out.target_date<out.start_date)ieError('Target completion cannot precede the start date.');
 if(out.status==='completed'&&(!out.completion_date||out.completion_date>ieToday()))ieError('Record the actual completion date, not a future date.');
 if(out.completion_date&&out.start_date&&out.completion_date<out.start_date)ieError('Actual completion cannot precede the start date.');
 if(out.status!=='completed')out.completion_date='';
 if(previous?.status==='completed'&&out.status!=='completed'&&!ieText(input.reason,1000))ieError('Record a reason for reopening this engagement.');
 out.awaiting_action=values.awaiting_action===true;if(out.awaiting_action&&!out.action_note)ieError('Explain the outstanding action or information.');
 if(!Array.isArray(values.sites||[])||(values.sites||[]).length>30)ieError('Use up to 30 sites.');out.sites=[...new Set((values.sites||[]).map(site=>ieText(site,250)).filter(Boolean))];
 if(!Array.isArray(values.team_ids||[])||(values.team_ids||[]).length>30)ieError('Use up to 30 team members.');out.team_ids=[...new Set(values.team_ids||[])];
 if(!map.has(out.owner_id)||out.team_ids.some(id=>!map.has(id)))ieError('Assign an active SAM contact or an existing SAM portal user.');
 out.owner_id=map.get(out.owner_id).id;
 out.team_ids=[...new Set(out.team_ids.map(id=>map.get(id).id))];
 out.owner_name=map.get(out.owner_id).name;
 out.team=out.team_ids.map(id=>({id,name:map.get(id).name}));
 out.access_user_ids=[...new Set([...ieAccessUsers(people,[out.owner_id,...out.team_ids]),...(previous?.deliverable_owner_ids||[])])];
 const account=await db.Account.get(out.client_id);if(account.account_type!=='client')ieError('Choose an existing client account.');out.client_name=account.name;
 const accountIds=[account.id,account.dataverse_id].filter(Boolean);out.project_name='';out.opportunity_name='';out.bsm_identity='';
 if(out.project_id){const project=await db.Project.get(out.project_id);if(!accountIds.includes(project.client_account_id)&&!accountIds.includes(project.account_id))ieError('The project must belong to the selected client.');out.project_name=project.name;out.bsm_identity=project.bsm_aad_id||'';out.region_id=project.department_id||out.region_id;}
 if(out.opportunity_id){const opportunity=await base44.entities.Opportunity.get(out.opportunity_id);if(!opportunity||!accountIds.includes(opportunity.account_id))ieError('The opportunity must be accessible and belong to the client.');out.opportunity_name=opportunity.title;}
 for(const [field,name,kind] of [['category_id','category_name','category'],['support_type_id','support_type_name','support']]){out[name]='';if(out[field]){const item=await db.IEClassification.get(out[field]);if(item.kind!==kind||item.active===false&&out[field]!==previous?.[field])ieError('Choose an active service classification.');if(kind==='support'&&item.parent_id&&item.parent_id!==out.category_id)ieError('Choose a support type from the selected category.');out[name]=item.name;}}
 Object.assign(out,ieServiceValue({...previous,...out}));
 return out;
 }