function getServings(text) {
  const re = /serves:?\s+(\d+)/i;
  const matches = text.match(re);
  if (matches) {
    return matches[1];
  }
  return NaN;
}