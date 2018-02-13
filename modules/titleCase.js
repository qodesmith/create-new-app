function titleCase(txt) {
  if (typeof txt !== 'string' || !txt.length) return '';
  return txt
    .replace(/_/g, '-')
    .split('-')
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

module.exports = titleCase;
