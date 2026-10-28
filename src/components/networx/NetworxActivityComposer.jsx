import React from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {DialogTitle,DialogDescription} from '@/components/forms/form-dialog';
import useNetworxActivity from '@/components/networx/useNetworxActivity';
import NetworxActivityForm from '@/components/networx/NetworxActivityForm';
import NetworxMeetingForm from '@/components/networx/NetworxMeetingForm';
export default function NetworxActivityComposer({entity,recordId,kind,onBusyChange,onClose}) {
 const state=useNetworxActivity({entity,recordId,kind,onBusyChange});
 const header=<header className="space-y-2"><DialogTitle>{kind==='call' ? 'Log a phone call' : kind==='teams' ? 'Create a Teams meeting' : 'Create an in-person meeting'}</DialogTitle><DialogDescription>{kind==='call' ? 'Save a completed call and its outcome directly against this relationship in Dataverse.' : 'Send invitations from your own Outlook calendar and save the meeting against this relationship in Dataverse.'}</DialogDescription></header>;
 if(state.query.isPending)return <div className="space-y-4">{header}<p role="status" className="text-sm text-muted-foreground">Loading relationship participants…</p></div>;
 if(state.query.error)return <div className="space-y-4">{header}<p role="alert" className="text-sm text-destructive">{state.query.error.message}</p><Button variant="outline" onClick={()=>state.query.refetch()}>Try again</Button></div>;
 if(state.query.data.state!=='ready')return <div className="space-y-4">{header}<p className="text-sm text-muted-foreground">{state.query.data.message}</p><Button asChild variant="outline"><Link to="/account-settings">Review my Dataverse connection</Link></Button></div>;
 if(state.result)return <div className="space-y-4">{header}<p role="status" className="font-medium text-success">{state.result.message}</p>{state.result.joinUrl && <Button asChild><a href={state.result.joinUrl} target="_blank" rel="noopener noreferrer">Join Teams meeting</a></Button>}{state.result.webLink && <Button asChild variant="outline"><a href={state.result.webLink} target="_blank" rel="noopener noreferrer">Open in Outlook</a></Button>}<p className="break-all text-xs text-muted-foreground">Dataverse activity reference: {state.result.activityId}</p>{kind!=='call' && <p className="text-xs text-muted-foreground">Manage invitation changes and cancellations in Outlook.</p>}<Button onClick={onClose}>Close</Button></div>;
 const Form=kind==='call' ? NetworxActivityForm : NetworxMeetingForm;
 return <div className="space-y-5">{header}<Form entity={entity} recordId={recordId} kind={kind} state={state} onClose={onClose}/></div>;
}