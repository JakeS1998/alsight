import React,{useState} from 'react';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {base44} from '@/api/base44Client';
import {InviteUserDialog} from '@/components/contacts/InviteUserDialog';
import {Button} from '@/components/ui/button';
import {ROLE_LABELS} from '@/lib/portal';
import ApprovalAccessControl from '@/components/approvals/ApprovalAccessControl.jsx';
import PersonPageAccess from '@/components/relationships/PersonPageAccess';
import assignedRoles from '@/components/data/assignedRoles';
import {useAuth} from '@/lib/AuthContext';
export default function PersonPortalAccount({contact}) {
  const [open,setOpen]=useState(false),cache=useQueryClient();
  const {user:administrator}=useAuth();
  const query=useQuery({queryKey:['person-portal-account',contact.id,administrator?.id,administrator?.role],enabled:administrator?.role==='admin',retry:false,queryFn:async()=>{const response=await base44.functions.invoke('getPersonPortalAccess',{contactId:contact.id});return response.data;}});
  if(query.isPending) return <p className="text-sm text-muted-foreground">Loading portal identity…</p>;
  if(query.error) return <div role="alert" className="space-y-3"><p className="text-sm text-destructive">{query.error.response?.data?.error || query.error.message || 'Portal access could not be loaded.'}</p><Button variant="outline" onClick={()=>query.refetch()}>Try again</Button></div>;
  const {user,pending,accounts}=query.data,linked=accounts.find(a=>a.dataverse_id===(user?.account_id || pending?.account_id)),state=pending ? 'Invited' : user ? 'Linked portal account' : 'No Portal Account';
  return <section className="rounded-xl border border-border bg-card p-6"><h2 className="font-semibold">Portal Account</h2><p className="mt-2 text-sm text-muted-foreground">A person is a relationship record. Portal access is a separate, administrator-controlled permission.</p><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">{[['Portal status',state],['Portal roles',assignedRoles(user || {role:pending?.portal_role,duty_roles:pending?.duty_roles}).map(role=>ROLE_LABELS[role] || role).join(' + ') || 'Not assigned'],['Organisation access',linked?.name || (user?.account_id || pending?.account_id ? 'Linked organisation, details unavailable' : 'Not assigned')]].map(([label,value])=><div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><p className="mt-4 text-xs text-muted-foreground">Sign-in, lock and activation details are not inferred from the existence of a linked identity.</p><PersonPageAccess contact={contact} user={user}/><ApprovalAccessControl contact={contact}/><Button className="mt-5" onClick={()=>setOpen(true)}>{user || pending ? 'Manage portal role and organisation' : 'Invite to portal'}</Button><InviteUserDialog open={open} onOpenChange={setOpen} contact={contact} accounts={accounts} existingUser={user} pendingAssignment={pending} onDone={()=>cache.invalidateQueries({queryKey:['person-portal-account',contact.id]})}/></section>;
}