const foods = require("./foodmap_def");

const foodmap = {};
for (const food of foods) {
  foodmap[food["normalized_name"]] = food;
}

const lemmatize = require("wink-lemmatizer");

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics, see https://stackoverflow.com/a/37511463
    .toLowerCase() // lowercase
    .split(/\W+/) // split on word boundaries
    .map((token) => lemmatize.noun(token)) // lemmatize
    .join(" "); // join with spaces
}

function lookupExact(foodName) {
  const foodNameNormalized = normalizeName(foodName);
  if (foodNameNormalized in foodmap) {
    return (
      foodmap[foodNameNormalized]["food"] ||
      foodmap[foodNameNormalized]["food_afcd"] ||
      foodmap[foodNameNormalized]["food_usfdc"]
    );
  }
  return null;
}

exports.normalizeName = normalizeName;
exports.lookupExact = lookupExact;
