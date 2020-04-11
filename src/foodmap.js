const foodmap = {};
for (const food of foods) {
    foodmap[food["normalized_name"]] = food;
}

const lemmatizer = new Lemmatizer();

function normalizeName(name) {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove diacritics, see https://stackoverflow.com/a/37511463
        .toLowerCase() // lowercase
        .split(/\s+/) // split on spaces
        .map(token => lemmatizer.only_lemmas(token, "noun")) // lemmatize
        .join(" "); // join with spaces
}

function lookupExact(foodName) {
    const foodNameNormalized = normalizeName(foodName);
    if (foodNameNormalized in foodmap) {
        return foodmap[foodNameNormalized]["food"];
    }
    return null;
}
