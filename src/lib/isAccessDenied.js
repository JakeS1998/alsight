export default function isAccessDenied(error) {
  const status=Number(error?.response?.status || error?.status || error?.statusCode);
  const message=String(typeof error==='string' ? error : error?.response?.data?.error || error?.message || '');
  return status===403 || /^(forbidden|access denied)\.?$/i.test(message.trim()) || /permission denied|insufficient permissions|row[- ]level security|\brls\b|not authori[sz]ed to (access|view|read)/i.test(message);
}