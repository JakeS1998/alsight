// Scoped to administrator-only Dataverse operations; all writes retain their existing permissions.
export function dataverseAdminUserReads(base44, authenticatedUser) {
  if (!authenticatedUser?.id || authenticatedUser.role !== 'admin') {
    const error = new Error('Administrator access required.');
    error.status = 403;
    throw error;
  }
  const originalUsers = base44.entities.User;
  const users = new Proxy(originalUsers, {
    get(target, operation) {
      if (['filter', 'list', 'get'].includes(operation)) {
        const serviceUsers = base44.asServiceRole.entities.User;
        return serviceUsers[operation].bind(serviceUsers);
      }
      const value = Reflect.get(target, operation);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  const entities = new Proxy(base44.entities, {
    get(target, entity) { return entity === 'User' ? users : Reflect.get(target, entity); }
  });
  return new Proxy(base44, {
    get(target, key) { return key === 'entities' ? entities : Reflect.get(target, key); }
  });
}