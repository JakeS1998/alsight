import { base44 } from '@/api/base44Client';
export const OUTLOOK_CONNECTOR_ID = '6a8315682b9286e588aab2e1';
export const calendarTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export default async function calendarRequest(action, input = {}) {
  try {
    const response = await base44.functions.invoke('manageOutlookCalendar', { action, timeZone: calendarTimeZone, ...input });
    if (response.data?.error) { const error = new Error(response.data.error); error.code = response.data.code; throw error; }
    return response.data;
  } catch (error) {
    if (error.response?.data) { error.message = error.response.data.error || error.message; error.code = error.response.data.code; }
    throw error;
  }
}