async function directValues(projects, field) {
  const values = [];
  let cursor;
  do {
    const page = await projects.filter({ procurement_route: false }, { distinct: field, limit: 500, cursor });
    values.push(...page.items.filter(Boolean));
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return values;
}

// Keep historical framework records, but exclude projects explicitly marked Direct.
export async function uklfReportScope(db) {
  const [ids, dataverseIds, numbers] = await Promise.all(
    ['id', 'dataverse_id', 'project_number'].map(field => directValues(db.Project, field))
  );
  const refs = numbers.flatMap(number => {
    const match = /^PROJ(\d+)$/i.exec(number);
    return match ? [number, match[1], `FW3${match[1]}`, `FW3 ${match[1]}`] : [number];
  });
  return {
    project_id: { $nin: [...ids, ...dataverseIds] },
    project_number: { $nin: numbers },
    framework_ref: { $nin: refs },
  };
}