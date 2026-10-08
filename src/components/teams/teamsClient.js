import { base44 } from '@/api/base44Client';
export const TEAMS_CONNECTOR_ID = '6ac767c8caa8fda818b4f2e2';
export default async function teamsRequest(action, input = {}) {
  try {
    const { data } = await base44.functions.invoke('manageAllianceTeams', { action, ...input });
    if (data.error) { const error = new Error(data.error); error.code = data.code; throw error; }
    return data;
  } catch (error) {
    if (error.response?.data) { error.message = error.response.data.error || error.message; error.code = error.response.data.code; }
    throw error;
  }
}