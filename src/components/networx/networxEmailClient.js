import { base44 } from '@/api/base44Client';
export default async function networxEmailClient(input) {
  try {
    const {data} = await base44.functions.invoke('manageNetworxEmail',input);
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) { throw new Error(error.response?.data?.error || error.message || 'Dataverse email could not be accessed.'); }
}