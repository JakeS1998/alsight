import React from 'react';
import COSharePointFailures from '@/components/contingency/live/COSharePointFailures';
export default function COProjectLegalCoverage({config}){
 const coverage=config.policy?.project_legals;if(!coverage?.enabled)return null;
 return <section className="cc-panel"><h2>Project legal-folder backups</h2><p className="mt-2 text-sm">Continuously discovers each project’s SharePoint Link Legals Folder and copies its files and subfolders privately. New or changed links are included automatically as discovery progresses.</p><p className="mt-2 text-sm text-muted-foreground">{coverage.linked_projects??'All'} linked projects at approval · Checks every five minutes · {coverage.last_scan?'Last complete discovery: '+new Date(coverage.last_scan).toLocaleString('en-GB',{timeZone:'Europe/London'}):'Initial discovery in progress'}. Initial copies may take several batches. Files above 10 MB are flagged and need separate backup arrangements.</p><COSharePointFailures/></section>;
}