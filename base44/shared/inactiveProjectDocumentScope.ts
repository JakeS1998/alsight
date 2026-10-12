export async function inactiveProjectDocumentScope(base44) {
  const refs = [];
  let cursor;
  do {
    const page = await base44.entities.Project.filter(
      { status: 'inactive' },
      { limit: 200, fields: ['dataverse_id'], ...(cursor ? { cursor } : {}) }
    );
    for (const project of page.items) {
      refs.push(project.id);
      if (project.dataverse_id) refs.push(project.dataverse_id);
    }
    if (!page.has_more) break;
    cursor = page.next_cursor;
  } while (cursor);
  return refs.length ? { project_id: { $nin: refs } } : {};
}