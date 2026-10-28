import { flowRequest } from './dataverseFlowApi.ts';
import { isGuid } from './dataverseFlowFields.ts';
export async function networxMailbox(context) {
  const {environment,token,principalId,organisationId} = context;
  if (!isGuid(principalId) || !isGuid(organisationId)) throw Object.assign(new Error('Reconnect your Microsoft account to confirm your Dataverse identity.'),{status:409});
  const [user,settings,organisation] = await Promise.all([
    flowRequest(environment,token,`systemusers(${principalId})?$select=fullname,internalemailaddress,isdisabled,_defaultmailbox_value`),
    flowRequest(environment,token,`usersettingscollection(${principalId})?$select=incomingemailfilteringmethod`),
    flowRequest(environment,token,`organizations(${organisationId})?$select=emailcorrelationenabled`)
  ]);
  const mailbox = isGuid(user._defaultmailbox_value) ? await flowRequest(environment,token,`mailboxes(${user._defaultmailbox_value})?$select=emailaddress,emailrouteraccessapproval,incomingemaildeliverymethod,outgoingemaildeliverymethod,incomingemailstatus,outgoingemailstatus,enabledforincomingemail,enabledforoutgoingemail`) : null;
  const outgoing = Boolean(mailbox?.enabledforoutgoingemail && mailbox.outgoingemaildeliverymethod===2 && mailbox.outgoingemailstatus===1);
  const incoming = Boolean(mailbox?.enabledforincomingemail && mailbox.incomingemaildeliverymethod===2 && mailbox.incomingemailstatus===1);
  const tracking = [0,1].includes(settings.incomingemailfilteringmethod), correlation = organisation.emailcorrelationenabled === true;
  const issues = [];
  if (user.isdisabled) issues.push('Your Dataverse user is disabled. Ask IT to enable it.');
  if (!mailbox) issues.push('No default mailbox is linked to your Dataverse user. Ask IT to link your approved mailbox.');
  else {
    if (!outgoing) issues.push('Outgoing email must use Server-Side Synchronization, be enabled, and have a successful mailbox test in Dynamics.');
    if (!incoming) issues.push('Incoming email must use Server-Side Synchronization, be enabled, and have a successful mailbox test so replies can return.');
  }
  if (!correlation) issues.push('IT must enable Use Email Correlation in Dynamics system email settings. Networx does not change organisation-wide settings.');
  if (!tracking) issues.push('Enable tracked replies below to update your own Dynamics incoming email filter.');
  const sender = mailbox?.emailaddress || user.internalemailaddress || '';
  if (!sender) issues.push('Your Dataverse mailbox has no sending address.');
  return {sender,name:user.fullname,mailboxUrl:mailbox ? `${environment}/main.aspx?pagetype=entityrecord&etn=mailbox&id=${user._defaultmailbox_value}` : null,approved:mailbox?.emailrouteraccessapproval===1,outgoing,incoming,tracking,correlation,filter:settings.incomingemailfilteringmethod,ready:!issues.length,issues};
}
export async function enableNetworxReplyTracking(context) {
  const {environment,token,principalId} = context;
  const settings = await flowRequest(environment,token,`usersettingscollection(${principalId})?$select=incomingemailfilteringmethod`);
  // Preserve an existing all-email filter; otherwise the explicit button opts into replies only.
  if (![0,1].includes(settings.incomingemailfilteringmethod)) await flowRequest(environment,token,`usersettingscollection(${principalId})`,{method:'PATCH',body:JSON.stringify({incomingemailfilteringmethod:1})});
  return networxMailbox(context);
}