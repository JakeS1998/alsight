export const feedbackPages = [
 ['/today','Today'], ['/portfolio-overview','Alliance360'], ['/finance','Commercial'],
 ['/projects','Projects'], ['/projects/:projectId','Project details'],
 ['/framework-reports','Framework'], ['/framework-reports/:reportId','Framework project details'],
 ['/documents','Legal documents'], ['/warranties','Warranties'], ['/suppliers','Suppliers'], ['/clients','Clients'],
 ['/account','My Account'], ['/accounts/:accountId','Organisation details'],
 ['/accounts/:accountId/contacts/:contactId','Organisation contact details'],
 ['/people','People'], ['/people/:contactId','Person details'], ['/contacts/:contactId','Contact details'],
 ['/crm/opportunities','Opportunities'], ['/crm/opportunities/lost','Lost opportunities'],
 ['/opportunities/:opportunityId','Opportunity details'], ['/crm/tasks','CRM tasks'],
 ['/crm/activities','CRM activities'], ['/crm/clients','CRM clients'], ['/crm/contacts/:contactId','CRM contact details'],
 ['/delegation','Delegation'], ['/account-settings','Account settings'], ['/dataverse','Dataverse workspace'],
 ['/calendar','Calendar'], ['/approvals','Approvals'], ['/help','Help'], ['/pulse','Insider'],
 ['/lookout/:issueId','The Lookout'], ['/admin','Administration'], ['/admin/lookout','The Lookout administration'],
 ['/admin/approvals','Approval administration'], ['/admin/finance','Finance administration']
].map(([key,name])=>({key,name,pattern:new RegExp(`^${key.replace(/:[^/]+/g,'[^/]+')}/?$`)}));
export function feedbackPage(route) {
 if(typeof route!=='string' || route.length>1000 || !/^\/[A-Za-z0-9_./%-]*$/.test(route))return null;
 return feedbackPages.find(page=>page.pattern.test(route)) || null;
}
export const feedbackCategories=['Easy to use','Contains useful information','Difficult to navigate','Missing information or functionality','Something isn’t working'];