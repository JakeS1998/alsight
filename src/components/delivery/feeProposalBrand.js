export const FEE_BRAND = { orange: [247, 146, 30], navy: [22, 21, 68], royal: [48, 51, 146], silver: [242, 242, 243], lightOrange: [243, 181, 99] };
const LOGO_URL = 'https://base44.app/api/apps/6ab62433a194f918c54c8249/files/mp/public/6ab62433a194f918c54c8249/32d46dda1_alliance-leisure-official-logo.png';
export async function loadFeeProposalLogo() {
  const response = await fetch(LOGO_URL);
  if (!response.ok) throw new Error('Unable to load the Alliance Leisure logo. Please try again.');
  return new Uint8Array(await response.arrayBuffer());
}
export function drawFeeProposalBrand(doc, { logo, width, height, margin, page, pages, internal }) {
  doc.addImage(logo, 'PNG', margin, 12, 90, 40.5, 'alliance-leisure-logo');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...FEE_BRAND.navy);
  doc.text(internal ? 'Internal commercial' : 'Fee proposal', width - margin, 36, { align: 'right' });
  doc.setDrawColor(...FEE_BRAND.orange); doc.setLineWidth(2); doc.line(margin, 64, width - margin, 64);
  doc.setLineWidth(0.5); doc.setDrawColor(...FEE_BRAND.silver); doc.line(margin, height - 40, width - margin, height - 40);
  doc.setFontSize(8); doc.setTextColor(...FEE_BRAND.navy);
  doc.text(`Alliance Leisure · ${internal ? 'INTERNAL — NOT FOR CLIENT DISTRIBUTION' : 'Client copy'} · ${new Date().toLocaleDateString('en-GB')}`, margin, height - 24);
  doc.setTextColor(...FEE_BRAND.orange); doc.text(`${page} / ${pages}`, width - margin, height - 24, { align: 'right' });
}