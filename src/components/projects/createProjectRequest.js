import flowRequest from '@/components/dataverse/flowClient';
export default async function createProjectRequest(values, requestId, pqSource = {}) {
  const result = await flowRequest('createProject', { values, requestId, ...pqSource });
  return result.project;
}