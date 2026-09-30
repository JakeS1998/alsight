import React from 'react';

export default function BriefDocumentInput({ file, setFile, link, setLink, disabled }) {
  return <fieldset disabled={disabled} className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
    <legend className="px-1 text-sm font-medium">Add a brief document (optional)</legend>
    <label className="block text-xs text-muted-foreground" htmlFor="project-brief-file">PDF or Word (.docx), up to 10 MB</label>
    <input key={file ? file.name : 'no-file'} id="project-brief-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={event => { setFile(event.target.files?.[0] || null); if (event.target.files?.length) setLink(''); }} className="w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-foreground" />
    {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
    <label className="block text-xs text-muted-foreground" htmlFor="project-brief-sharepoint">Or a SharePoint document link</label>
    <input id="project-brief-sharepoint" type="url" value={link} onChange={event => { setLink(event.target.value); if (event.target.value) setFile(null); }} placeholder="https://your-organisation.sharepoint.com/…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    <p className="text-xs text-muted-foreground">SharePoint links must allow access without sign-in; otherwise upload the document. Uploads are private.</p>
  </fieldset>;
}