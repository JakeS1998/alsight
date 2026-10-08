export async function dataverseRequest(stage, url, options, sensitiveValues = []) {
  try {
    return await fetch(url, options);
  } catch (error) {
    let detail = String(error.message || error.name || 'Request failed');
    for (const value of sensitiveValues) {
      if (value) { detail = detail.split(value).join('[redacted]').split(encodeURIComponent(value)).join('[redacted]'); }
    }
    detail = detail.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]');
    console.error('Dataverse request failed', { stage, name: error.name, detail: detail.slice(0, 500) });
    const timedOut = ['TimeoutError', 'AbortError'].includes(error.name);
    throw new Error(timedOut ? `${stage} timed out. Try again or ask IT to check service availability.` : `${stage} could not be reached. ${stage === 'Microsoft authentication' ? 'The request failed before Microsoft could confirm the credentials.' : 'Ask IT to confirm the Dataverse Web API address and environment availability.'}`);
  }
}