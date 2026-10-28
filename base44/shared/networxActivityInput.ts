import {validateNetworxInput} from './networxQueries.ts';
import {isGuid} from './dataverseFlowFields.ts';
export default function networxActivityInput(input) {
 const source=validateNetworxInput({...input,action:'list',cursor:null});if(source)return source;
 if(!['prepare','save'].includes(input.action))return 'Choose a valid activity operation.';
 if(input.action==='prepare')return null;
 if(!['call','teams','in_person'].includes(input.kind) || !isGuid(input.activityId))return 'Start a new call or meeting.';
 if(typeof input.subject!=='string' || !input.subject.trim() || input.subject.length>200 || /[\r\n]/.test(input.subject))return 'Enter a subject of up to 200 characters.';
 if(typeof input.notes!=='string' || input.notes.length>5000)return 'Enter notes of up to 5,000 characters.';
 if(typeof input.location!=='string' || input.location.length>300)return 'Enter a location of up to 300 characters.';
 if(input.kind==='in_person' && !input.location.trim())return 'Enter the meeting location.';
 const iso=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
 if(!iso(input.start) || !iso(input.end) || Date.parse(input.end)<=Date.parse(input.start) || Date.parse(input.end)-Date.parse(input.start)>86400000)return 'Choose valid start and end times, up to 24 hours apart.';
 if(input.kind==='call' && (Date.parse(input.end)>Date.now()+300000 || !['incoming','outgoing'].includes(input.direction) || typeof input.phone!=='string' || input.phone.length>100))return 'Choose the call direction and a completed call time, with a phone number up to 100 characters.';
 if(!Array.isArray(input.people) || input.people.length>(input.kind==='call' ? 1 : 20) || (input.kind!=='call' && !input.people.length))return input.kind==='call' ? 'Choose at most one person for the call.' : 'Choose between 1 and 20 attendees.';
 if(input.people.some(person=>!person || !['account','contact','systemuser'].includes(person.entity) || !isGuid(person.id)))return 'Choose valid Dataverse participants.';
 if(new Set(input.people.map(person=>`${person.entity}:${person.id.toLowerCase()}`)).size!==input.people.length)return 'Choose each participant once.';
 return null;
}