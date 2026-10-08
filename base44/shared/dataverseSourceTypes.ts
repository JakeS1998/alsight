export function dataverseSourceType(type) {
  if (['Picklist', 'State', 'Status', 'EntityName'].includes(type)) return 'String';
  if (['String', 'Memo', 'Lookup', 'Uniqueidentifier', 'Boolean', 'DateTime', 'Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(type)) return type;
  return 'Json';
}