const assert = require("assert");
const foodsearch = require("../src/foodsearch.js");

describe("normalize", function () {
  it("should find the canonical food name", function () {
    assert.equal(foodsearch.normalize("celeriac"), "Celeriac, raw");
  });
});

describe("lookupFood", function () {
  describe("match", function () {
    const food = foodsearch.lookupFood("red  onions", false);
    it("should have the right name", function () {
      assert.equal(food.name, "Onions, raw");
    });
    it("should have carbs", function () {
      assert.equal(food.carbs, 8.0);
    });
  });
  describe("use AFCD for food not in McCance (CoFID)", function () {
    const food = foodsearch.lookupFood("almond", false);
    it("should have the right name", function () {
      assert.equal(food.name, "Nut, almond, with skin, raw, unsalted");
    });
    it("should have carbs", function () {
      assert.equal(food.carbs, 5.4);
    });
  });
  describe("use USFDC for food not in McCance (CoFID) or AFCD", function () {
    const food = foodsearch.lookupFood("balsamic vinegar", false);
    it("should have the right name", function () {
      assert.equal(food.name, "Vinegar, balsamic");
    });
    it("should have carbs", function () {
      assert.equal(food.carbs, 17.03);
    });
  });
  describe("fall back to search", function () {
    const food = foodsearch.lookupFood("blue cheese", true);
    it("should have the right name", function () {
      assert.equal(food.name, "Cheese, Stilton, blue");
    });
  });
});

describe("search", function () {
  describe("match", function () {
    const food = foodsearch.search("cheese");
    it("should have search term in name", function () {
      assert.equal(food.name.toLowerCase().includes("cheese"), true);
    });
  });
  describe("no match", function () {
    const food = foodsearch.search("zoh");
    it("should return null", function () {
      assert.equal(food, null);
    });
  });
  describe("special lunr characters", function () {
    const food = foodsearch.search("cheese pickle:"); // : is a special character in lunr
    it("should have search term in name", function () {
      assert.equal(food.name.toLowerCase().includes("cheese"), true);
    });
  });
});
