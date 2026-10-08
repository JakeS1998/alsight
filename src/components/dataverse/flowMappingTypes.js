export const compatibleFlowType = (local, source) => local === source || (['String', 'Memo'].includes(local) && ['String', 'Memo', 'Uniqueidentifier', 'Lookup', 'Picklist', 'State', 'Status', 'Boolean'].includes(source)) || (local === 'Lookup' && ['Lookup', 'Uniqueidentifier'].includes(source)) || (['Money', 'Decimal', 'Double'].includes(local) && ['Money', 'Decimal', 'Double', 'Integer', 'BigInt'].includes(source));
export const normalisedChoice = value => {
  const text = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ({ notapplicable: 'na', tobeconfirmed: 'tbc' })[text] || text;
};
export function matchFlowChoices(options = [], choices, previous = {}) {
  const values = {}, allowed = [...(choices || []), ...options.map(option => option.label)];
  for (const option of options) {
    if (Object.prototype.hasOwnProperty.call(previous, option.value) && allowed.includes(previous[option.value])) {
      values[option.value] = previous[option.value]; continue;
    }
    const matches = (choices || []).filter(choice => normalisedChoice(choice) === normalisedChoice(option.label));
    values[option.value] = matches.length === 1 ? matches[0] : option.label;
  }
  return values;
}