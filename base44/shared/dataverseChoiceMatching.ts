const normalise = value => {
  const text = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ({ notapplicable: 'na', tobeconfirmed: 'tbc' })[text] || text;
};
export function matchFlowChoices(options = [], choices, previous = {}) {
  const values = {}, allowed = [...(choices || []), ...options.map(option => option.label)];
  for (const option of options) {
    if (Object.prototype.hasOwnProperty.call(previous, option.value) && allowed.includes(previous[option.value])) {
      values[option.value] = previous[option.value]; continue;
    }
    const matches = (choices || []).filter(choice => normalise(choice) === normalise(option.label));
    values[option.value] = matches.length === 1 ? matches[0] : option.label;
  }
  return values;
}