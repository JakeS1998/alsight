const encoder = new TextEncoder();
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export function createHandoverZip(files) {
  const local = [], central = []; let offset = 0, centralSize = 0;
  for (const file of files) {
    const name = encoder.encode(file.name), bytes = file.bytes, crc = crc32(bytes);
    const header = new Uint8Array(30 + name.length), view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true); view.setUint16(12, 33, true);
    view.setUint32(14, crc, true); view.setUint32(18, bytes.length, true); view.setUint32(22, bytes.length, true); view.setUint16(26, name.length, true); header.set(name, 30);
    const directory = new Uint8Array(46 + name.length), entry = new DataView(directory.buffer);
    entry.setUint32(0, 0x02014b50, true); entry.setUint16(4, 20, true); entry.setUint16(6, 20, true); entry.setUint16(8, 0x800, true); entry.setUint16(14, 33, true);
    entry.setUint32(16, crc, true); entry.setUint32(20, bytes.length, true); entry.setUint32(24, bytes.length, true); entry.setUint16(28, name.length, true); entry.setUint32(42, offset, true); directory.set(name, 46);
    local.push(header, bytes); central.push(directory); offset += header.length + bytes.length; centralSize += directory.length;
  }
  const end = new Uint8Array(22), view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, centralSize, true); view.setUint32(16, offset, true);
  const output = new Uint8Array(offset + centralSize + end.length); let index = 0;
  for (const part of [...local, ...central, end]) { output.set(part, index); index += part.length; }
  return output;
}