var assert = require('assert');
var foodmap = require('../src/foodmap.js');

describe('normalizeName', function() {
    it('should leave already normalized names unchanged', function() {
        assert.equal(foodmap.normalizeName("celeriac"), "celeriac");
    });
    it('should remove spaces and plurals', function() {
        assert.equal(foodmap.normalizeName("red  onions"), "red onion");
    });
    it('should remove hyphens', function() {
        assert.equal(foodmap.normalizeName("flat-leaf parsley"), "flat leaf parsley");
    });
    it('should remove diacritics', function() {
        assert.equal(foodmap.normalizeName("Crème fraîche"), "creme fraiche");
    });
});

describe('lookupExact', function() {
    it('should return the canonical food name', function() {
        assert.equal(foodmap.lookupExact("red  onions"), "Onions, raw");
    });
    it('should return null if no match', function() {
        assert.equal(foodmap.lookupExact("zoh"), null);
    });
});
