const normalise = value => {
  const text = String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return ({ notapplicable: 'na', tobeconfirmed: 'tbc' })[text] || text;
};
export function matchFlowChoices(options = [], choices, previous = {}) {
  const values = {};
  for (const option of options) {
    if (!choices) { values[option.value] = option.label; continue; }
    if (Object.prototype.hasOwnProperty.call(previous, option.value) && choices.includes(previous[option.value])) {
      values[option.value] = previous[option.value]; continue;
    }
    const matches = choices.filter(choice => normalise(choice) === normalise(option.label));
    if (matches.length === 1) values[option.value] = matches[0];
  }
  return values;
}