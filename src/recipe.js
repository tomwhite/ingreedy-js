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

function getIngredientsTextFromPage(response) {
  const centerBlock = ocr.getCenterBlock(response);
  if (!centerBlock) {
    return null;
  }
  const text = ocr.getTextFromBlock(centerBlock).trim();
  return text.split("\n")
    .filter(line => !line.match(/serves:?\s+(\d+).*/i))
    .join("\n");
}

exports.getServings = getServings
exports.getServingsFromPage = getServingsFromPage
exports.getIngredientsTextFromPage = getIngredientsTextFromPage
