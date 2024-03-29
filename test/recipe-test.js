const assert = require("assert");
const recipe = require("../src/recipe");

const response0096 = require("./IMG_0096.JPG.google");
const response0100 = require("./IMG_0100.JPG.google");
const response0217 = require("./IMG_0217.JPG.google");
const response0218 = require("./IMG_0218.JPG.google");
const response0219 = require("./IMG_0219.JPG.google");
const response0220 = require("./IMG_0220.JPG.google");
const response0221 = require("./IMG_0221.JPG.google");
const response0222 = require("./IMG_0222.JPG.google");

describe("getServings", function () {
  it("should parse integer", function () {
    assert.equal(recipe.getServings("Serves 4"), 4);
  });
  it("should parse integer, with colon", function () {
    assert.equal(recipe.getServings("Serves: 4"), 4);
  });
  it("should parse range", function () {
    assert.equal(recipe.getServings("Serves 4-6"), 4);
  });
  it("should parse 'for'", function () {
    assert.equal(recipe.getServings("For 4-6"), 4);
  });
  it("should return NaN for unrelated text", function () {
    assert.equal(
      isNaN(
        recipe.getServings("Text unrelated to number of people this is for")
      ),
      true
    );
  });
});

describe("getServingsFromPage", function () {
  it("should find in page response0096", function () {
    assert.equal(recipe.getServingsFromPage(response0096), 6);
  });
  it("should find in page response0100", function () {
    assert.equal(recipe.getServingsFromPage(response0100), 6);
  });
  it("should find in page response0217", function () {
    assert.equal(recipe.getServingsFromPage(response0217), 4);
  });
  it("should find in page response0218", function () {
    assert.equal(recipe.getServingsFromPage(response0218), 4);
  });
  it("should find in page response0219", function () {
    assert.equal(recipe.getServingsFromPage(response0219), 4);
  });
  it("should return NaN if number of servings not shown, in page response0220", function () {
    assert.equal(isNaN(recipe.getServingsFromPage(response0220)), true);
  });
  it("should return NaN if number of servings not shown, in page response0221", function () {
    assert.equal(isNaN(recipe.getServingsFromPage(response0221)), true);
  });
  it("should find in page response0222", function () {
    assert.equal(recipe.getServingsFromPage(response0222), 5);
  });
});

describe("fix fractions", function () {
  it("should leave line with fraction intact", function () {
    assert.equal(recipe.fixFractions("1/2 tsp honey"), "1/2 tsp honey");
  });
  it("should change leading V to 1/", function () {
    assert.equal(recipe.fixFractions("V2 tsp honey"), "1/2 tsp honey");
  });
});

describe("getIngredientsTextFromBlocks", function () {
  it("should find text for centre block", function () {
    const blocks = recipe.getIngredientsBlocksFromPage(response0096);
    assert.equal(
      recipe.getIngredientsTextFromBlocks(blocks).trim(),
      `500g dried haricot beans
2-3 tablespoons vegetable oil
2 large onions, finely chopped or minced in a food processor
2 fat garlic cloves, crushed
1 tablespoon cocoa powder
2 teaspoons ground cinnamon
2 teaspoons ground cumin
1 teaspoon cayenne pepper
400g can chopped tomatoes
100g tamarind paste (the paste should be the consistency of a ketchup)
4 tablespoons brown sugar
4 tablespoons red wine vinegar
500ml boiling water
Maldon sea salt flakes and freshly ground black pepper
toasted bread, to serve`
    );
  });
});
