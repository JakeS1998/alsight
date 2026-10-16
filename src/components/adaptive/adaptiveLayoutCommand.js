import { focuses, widgetOrder } from '@/components/adaptive/adaptiveEngine';
const aliases={projects:['projects','my projects','active projects'],documents:['documents','document attention'],approvals:['approvals','my approvals','outstanding approvals'],commercial:['commercial','finance','commercial follow through'],activity:['activity','my activity','recent activity'],opportunities:['opportunities','my opportunities','open opportunities']};
const clean=text=>text.toLowerCase().replace(/[’']/g,'').replace(/[-–]/g,' ').replace(/\b(the|widget|panel|section|please)\b/g,' ').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
const identify=text=>Object.keys(aliases).find(id=>aliases[id].includes(clean(text)));
export default function adaptiveLayoutCommand(text,config,context) {
 const input=clean(text);
 if(/^(restore|reset)( my)?( default)?( workspace)? layout$/.test(input))return {patch:{order:[],hidden:[],pinned:[],focus:focuses[0]},message:'Your default workspace layout is restored.'};
 const focus=input.match(/^(?:focus on|switch to|prioritise|prioritize) (.+)$/);
 if(focus){const target=clean(focus[1]),value=focuses.find(item=>clean(item)===target)||({priorities:'My priorities',projects:'My projects',activity:'My activity',finance:'Commercial'}[target]);return value?{patch:{focus:value},message:`Workspace focus changed to ${value}.`}:{error:'Choose priorities, projects, commercial, documents or activity.'};}
 const command=input.match(/^(hide|show|pin|unpin|move|put|bring) (.+?)(?: (?:to )?(?:the )?(top|first|bottom|last|up|down))?$/);
 if(!command)return /^(hide|show|pin|unpin|move|put|bring|focus on|switch to|restore.*layout|reset.*layout)\b/.test(input)?{error:'Try “pin my projects”, “hide documents”, “move approvals to the top”, or “focus on commercial”.'}:null;
 const [,verb,target,direction]=command,id=identify(target);
 if(!id)return {error:'Name one workspace panel: projects, documents, approvals, commercial, activity or opportunities.'};
 if(!context.widgets.includes(id))return {error:'That panel is not available for your current workspace role; no settings were changed.'};
 const add=(values,value)=>[...new Set([...values,value])],remove=(values,value)=>values.filter(item=>item!==value);
 if(verb==='hide')return {patch:{hidden:add(config.hidden,id)},message:`${target} hidden. Say “show ${target}” to bring it back.`};
 if(verb==='show')return {patch:{hidden:remove(config.hidden,id)},message:`${target} is now visible.`};
 if(verb==='pin'||verb==='unpin')return {patch:{pinned:verb==='pin'?add(config.pinned,id):remove(config.pinned,id),...(verb==='pin'?{hidden:remove(config.hidden,id)}:{})},message:`${target} ${verb==='pin'?'pinned and shown':'unpinned'}.`};
 if(!direction)return {error:'Specify up, down, top or bottom, for example “move projects to the top”.'};
 const order=widgetOrder({...config,hidden:remove(config.hidden,id)},context,config.focus),at=order.indexOf(id),end=['bottom','last'].includes(direction),edge=['top','first','bottom','last'].includes(direction),pinned=config.pinned.includes(id);
 if(edge){order.splice(at,1);end?order.push(id):order.unshift(id);return {patch:{order,hidden:remove(config.hidden,id),pinned:end?remove(config.pinned,id):add(config.pinned,id)},message:`${target} moved to the ${end?'bottom':'top'}${end?' and unpinned':' and pinned'}.`};}
 const next=at+(direction==='up'?-1:1);
 if(next<0||next>=order.length)return {message:`${target} is already at that edge of the workspace.`};
 if(config.pinned.includes(order[next])!==pinned)return {error:'Pinned panels stay above unpinned panels. Pin or unpin this panel first.'};
 [order[at],order[next]]=[order[next],order[at]];
 return {patch:{order,hidden:remove(config.hidden,id)},message:`${target} moved ${direction}.`};
}