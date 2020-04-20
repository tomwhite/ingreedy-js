var ocr = require("./ocr.js");

function getServings(text) {
  const re = /serves:?\s+(\d+)/i;
  const matches = text.match(re);
  if (matches) {
    return matches[1];
  }
  return NaN;
}

function getServingsFromPage(response) {
  return ocr
    .getBlocks(response)
    .map(function (block) {
      const text = ocr.getTextFromBlock(block);
      const servings = getServings(text);
      return servings;
    })
    .reduce(function (acc, cur) {
      if (!isNaN(acc)) {
        return acc;
      }
      if (!isNaN(cur)) {
        return cur;
      }
      return NaN;
    }, NaN);
}

function fixFractions(line) {
  return line.replace(/\bV(\d+)\b/, "1/$1");
}

function getIngredientsBlocksFromPage(response) {
  // TODO: make this more robust by finding the nearest block that overlaps
  const centerBlock = ocr.getCenterBlock(response);
  if (!centerBlock) {
    return [];
  }
  return [centerBlock];
}

function getIngredientsTextFromBlocks(blocks) {
  const text = blocks
    .map((block) => ocr.getTextFromBlock(block).trim())
    .reduce((acc, cur) => acc + "\n" + cur, "");
  return text
    .trim()
    .split("\n")
    .filter((line) => !line.match(/serves:?\s+(\d+).*/i))
    .map((line) => fixFractions(line))
    .join("\n");
}

exports.getServings = getServings;
exports.getServingsFromPage = getServingsFromPage;
exports.getIngredientsBlocksFromPage = getIngredientsBlocksFromPage;
exports.getIngredientsTextFromBlocks = getIngredientsTextFromBlocks;
exports.fixFractions = fixFractions;
