const postcodeCache = new Map();
export const normalisePostcode = value => String(value || '').toUpperCase().replace(/\s+/g, '');
export const hasProjectCoordinates = project => typeof project.latitude === 'number' && typeof project.longitude === 'number' && Number.isFinite(project.latitude) && Number.isFinite(project.longitude) && Math.abs(project.latitude) <= 90 && Math.abs(project.longitude) <= 180;
export async function resolveProjectPostcodes(postcodes, signal) {
  const missing = postcodes.filter(postcode => !postcodeCache.has(postcode));
  for (let offset = 0; offset < missing.length; offset += 100) {
    const response = await fetch('https://api.postcodes.io/postcodes?filter=postcode,latitude,longitude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postcodes: missing.slice(offset, offset + 100) }), signal });
    if (!response.ok) throw new Error('Postcode lookup is unavailable.');
    const data = await response.json();
    if (data.status !== 200 || !Array.isArray(data.result)) throw new Error('Postcode lookup is unavailable.');
    data.result.forEach(item => postcodeCache.set(normalisePostcode(item.query), item.result && { latitude: item.result.latitude, longitude: item.result.longitude }));
  }
  return Object.fromEntries(postcodes.map(postcode => [postcode, postcodeCache.get(postcode)]));
}