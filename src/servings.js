var ocr = require('./ocr.js')

function getServings(text) {
  const re = /serves:?\s+(\d+)/i;
  const matches = text.match(re);
  if (matches) {
    return matches[1];
  }
  return NaN;
}

function getServingsFromPage(response) {
  return ocr.getBlocks(response)
    .map(function(block) {
      const text = ocr.getTextFromBlock(block);
      const servings = getServings(text);
      return servings;
    })
    .reduce(function(acc, cur) {
      if (!isNaN(acc)) {
        return acc;
      }
      if (!isNaN(cur)) {
        return cur;
      }
      return NaN;
    }, NaN);
}

exports.getServings = getServings
exports.getServingsFromPage = getServingsFromPage
