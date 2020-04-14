var assert = require('assert');
var measures = require('../src/measures');

describe('normalizeQuantity', function() {
    it('should normalize integer', function() {
        assert.equal(measures.normalizeQuantity("1"), 1);
    });
    it('should normalize mixed fraction', function() {
        assert.equal(measures.normalizeQuantity("1 1/2"), 1.5);
    });
    it('should normalize fraction', function() {
        assert.equal(measures.normalizeQuantity("11/2"), 5.5);
    });
    it('should return NaN for non-numeric value', function() {
        assert.equal(isNaN(measures.normalizeQuantity("1blah")), true);
    });
});

describe('calculateMass', function() {
    it('should work for quantity and grams', function() {
        assert.equal(measures.calculateMass("2", "gram", "Onions, raw"), 2);
    });
    it('should convert ounces', function() {
        assert.equal(measures.calculateMass("2", "ounce", "Onions, raw"), 56.6);
    });
    it('should convert pounds', function() {
        assert.equal(measures.calculateMass("2", "pound", "Onions, raw"), 908);
    });
    it('should return NaN for unknown unit', function() {
        assert.equal(isNaN(measures.calculateMass("2", "hundredweight", "Onions, raw")), true);
    });
    it('should know mass of food with measure, with null quantity', function() {
        assert.equal(measures.calculateMass("2", null, "Apples, eating, raw, flesh and skin"), 350);
    });
    it('should know mass of food with measure, with blank quantity', function() {
        assert.equal(measures.calculateMass("2", "", "Apples, eating, raw, flesh and skin"), 350);
    });
    it('should return NaN for food with no measure, with null quantity', function() {
        assert.equal(isNaN(measures.calculateMass("2", null, "rabbit")), true);
    });
    it('should return NaN for food with no measure, with blank quantity', function() {
        assert.equal(isNaN(measures.calculateMass("2", "", "rabbit")), true);
    });
    it('should return NaN for food with no measure, with blank unit and quantity', function() {
        assert.equal(isNaN(measures.calculateMass("", "", "salt")), true);
    });
    it('should return NaN for food with meaningless unit and quantity', function() {
        assert.equal(isNaN(measures.calculateMass("2blah", "blah", "Onions, raw")), true);
    });
});

describe('calculateCarbsInFood', function() {
    describe('missing food', function() {
        const result = measures.calculateCarbsInFood({ });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Food not specified');
        });    
    });
    describe('unknown food', function() {
        const result = measures.calculateCarbsInFood({ qty: "100", unit: "gram", name: "zoh" });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Food not found: "zoh"');
        });    
    });
    describe("zero carb food doesn't need qty or unit", function() {
        const result = measures.calculateCarbsInFood({ name: "beef" });
        it('should succeed', function() {
            assert.equal(result.success, true);
        });
        it('should have carbs', function() {
            assert.equal(result.carbs, 0);
        });    
    });
    describe("missing qty for non-zero carb food", function() {
        const result = measures.calculateCarbsInFood({ name: "flour" });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Quantity not specified');
        });    
    });
    describe("non-numeric qty", function() {
        const result = measures.calculateCarbsInFood({ qty: "two", unit: "gram", name: "flour" });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Quantity not numeric: "two"');
        });    
    });
    describe("all fields", function() {
        const result = measures.calculateCarbsInFood({ qty: "100", unit: "gram", name: "flour" });
        it('should succeed', function() {
            assert.equal(result.success, true);
        });
        it('should have carbs', function() {
            assert.equal(result.carbs, 80.9);
        });    
    });
    describe("fractional qty", function() {
        const result = measures.calculateCarbsInFood({ qty: "1 1/2", unit: "gram", name: "flour" });
        it('should succeed', function() {
            assert.equal(result.success, true);
        });
        it('should have carbs', function() {
            assert.equal(result.carbs, 1.2135);
        });    
    });
    describe("unknown unit", function() {
        const result = measures.calculateCarbsInFood({ qty: "1", unit: "shoe", name: "flour" });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Unit not found: "shoe"');
        });    
    });
    describe("known food weight without unit", function() {
        const result = measures.calculateCarbsInFood({ qty: "2", name: "red onions" });
        it('should succeed', function() {
            assert.equal(result.success, true);
        });
        it('should have carbs', function() {
            assert.equal(result.carbs, 20.8);
        });    
    });
    describe("unknown food weight without unit", function() {
        const result = measures.calculateCarbsInFood({ qty: "1", name: "flour" });
        it('should fail', function() {
            assert.equal(result.success, false);
        });
        it('should have reason text', function() {
            assert.equal(result.reasonText, 'Unit not specified');
        });    
    });
});