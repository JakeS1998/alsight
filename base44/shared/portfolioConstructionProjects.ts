// DMA and FW4 DPA share the DMA entity; agreement links may use either project identifier.
export async function portfolioConstructionProjects(entities, query, dates) {
  const projects = await entities.Project.aggregate({query:{...query,...dates},groupBy:['id','dataverse_id'],limit:1000});
  if (projects.truncated) throw new Error('Portfolio construction selection exceeded its reporting limit.');
  const aliases = projects.rows.flatMap(project => [project.id,project.dataverse_id].filter(Boolean));
  if (!aliases.length) return [];
  const agreements = await entities.DMA.aggregate({query:{project_id:{$in:aliases},executed:{$regex:'^\\s*yes\\s*$',$options:'i'}},groupBy:'project_id',limit:1000});
  if (agreements.truncated) throw new Error('Portfolio executed agreement selection exceeded its reporting limit.');
  const executed = new Set(agreements.rows.map(agreement => agreement.project_id));
  return projects.rows.filter(project => executed.has(project.id) || executed.has(project.dataverse_id)).map(project => project.id);
}