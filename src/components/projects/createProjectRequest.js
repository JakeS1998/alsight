import flowRequest from '@/components/dataverse/flowClient';
export default async function createProjectRequest(values, requestId) {
  const result = await flowRequest('createProject', { values, requestId });
  return result.project;
}