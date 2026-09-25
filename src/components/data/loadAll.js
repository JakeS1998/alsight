// The SDK caps each request, so continue until the final partial page.
const PAGE_SIZE = 500;

async function collect(fetchPage) {
  const records = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await fetchPage(skip);
    records.push(...page);
    if (page.length < PAGE_SIZE) return records;
  }
}

export const listAll = (entity, sort = '-created_date') =>
  collect((skip) => entity.list(sort, PAGE_SIZE, skip));

export const filterAll = (entity, query, sort = '-created_date') =>
  collect((skip) => entity.filter(query, sort, PAGE_SIZE, skip));