const measuresDef = require("./measures_def");

const foodsearch = require("./foodsearch");

const unitToGrams = {
  clove: 5, // TODO: use food measures, since this only applies to some foods, typically garlic
  gram: 1,
  millilitre: 1,
  ounce: 28.3,
  pound: 454,
  teaspoon: 5,
  tablespoon: 15,
};

const foodMeasures = Object.assign(
  {},
  ...measuresDef.map((v) => ({ [v.food]: v.weight }))
);

function normalizeQuantity(quantity) {
  let match = quantity.match(/(\d+) (\d+)\/(\d+)/);
  if (match != null) {
    return Number(match[1]) + Number(match[2]) / Number(match[3]);
  }
  match = quantity.match(/(\d+)\/(\d+)/);
  if (match != null) {
    return Number(match[1]) / Number(match[2]);
  }
  return Number(quantity);
}

function calculateMass(quantity, unit, name) {
  const quantityFloat = normalizeQuantity(quantity);
  if (isNaN(quantityFloat)) {
    return quantityFloat;
  }
  if (unit in unitToGrams) {
    return quantityFloat * unitToGrams[unit];
  }
  if (!unit && name in foodMeasures) {
    return quantityFloat * foodMeasures[name];
  }
  return NaN;
}

const Outcome = Object.freeze({
  SUCCESS: Symbol.for("success"),
  FOOD_NOT_SPECIFIED: Symbol.for("food not specified"),
  FOOD_NOT_FOUND: Symbol.for("food not found"),
  CARBS_NOT_NUMERIC: Symbol.for("carbs not numeric"),
  QUANTITY_NOT_SPECIFIED: Symbol.for("quantity not specified"),
  QUANTITY_NOT_NUMERIC: Symbol.for("quantity not numeric"),
  UNIT_NOT_SPECIFIED: Symbol.for("unit not specified"),
  UNIT_NOT_FOUND: Symbol.for("unit not found"),
});

function calculateCarbsInFood(food, fallbackToSearch) {
  if (!("name" in food)) {
    return {
      ...food,
      success: false,
      outcome: Outcome.FOOD_NOT_SPECIFIED,
      reasonText: "Food not specified",
    };
  }
  let resolvedFood = foodsearch.lookupFood(food["name"], fallbackToSearch);
  if (resolvedFood == null) {
    if ("carbFactorOverride" in food) {
      resolvedFood = {
        name: '"' + food["name"] + '"',
      };
    } else {
      return {
        ...food,
        success: false,
        outcome: Outcome.FOOD_NOT_FOUND,
        reasonText: 'Food not found: "' + food["name"] + '"',
      };
    }
  }
  // get the carb factor from i) the override (if defined), or ii) the resolved food
  const carbsPer100gStr =
    "carbFactorOverride" in food
      ? food["carbFactorOverride"]
      : resolvedFood["carbs"];
  if (
    carbsPer100gStr === 0 ||
    carbsPer100gStr === "0" ||
    carbsPer100gStr === "N" ||
    carbsPer100gStr === "Tr"
  ) {
    return {
      ...food,
      food: resolvedFood,
      success: true,
      outcome: Outcome.SUCCESS,
      carbs: 0.0,
    };
  }
  const carbsPer100g = parseFloat(carbsPer100gStr);
  if (isNaN(carbsPer100g)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      outcome: Outcome.CARBS_NOT_NUMERIC,
      reasonText: 'Carbs per 100g not numeric: "' + carbsPer100gStr + '"',
    };
  }
  if (!("qty" in food)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      outcome: Outcome.QUANTITY_NOT_SPECIFIED,
      reasonText: "Quantity not specified",
    };
  }
  const qty = normalizeQuantity(food["qty"]);
  if (isNaN(qty)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      outcome: Outcome.QUANTITY_NOT_NUMERIC,
      reasonText: 'Quantity not numeric: "' + food["qty"] + '"',
    };
  }
  if ("unit" in food) {
    const unit = food["unit"];
    if (unit in unitToGrams) {
      return {
        ...food,
        food: resolvedFood,
        success: true,
        outcome: Outcome.SUCCESS,
        carbs: (qty * unitToGrams[unit] * carbsPer100g) / 100.0,
      };
    } else {
      return {
        ...food,
        food: resolvedFood,
        success: false,
        outcome: Outcome.UNIT_NOT_FOUND,
        reasonText: 'Unit not found: "' + unit + '"',
      };
    }
  }
  if (resolvedFood["name"] in foodMeasures) {
    return {
      ...food,
      food: resolvedFood,
      success: true,
      outcome: Outcome.SUCCESS,
      carbs: (qty * foodMeasures[resolvedFood["name"]] * carbsPer100g) / 100.0,
    };
  }
  return {
    ...food,
    food: resolvedFood,
    success: false,
    outcome: Outcome.UNIT_NOT_SPECIFIED,
    reasonText: "Unit not specified",
  };
}

function calculateTotalCarbs(foods) {
  let carbsTotal = 0.0;
  let unknownFoods = false;
  for (const food of foods) {
    if ("carbs" in food) {
      carbsTotal += food["carbs"];
    } else {
      unknownFoods = true;
    }
  }
  return {
    carbs: carbsTotal,
    unknownFoods: unknownFoods,
  };
}

exports.normalizeQuantity = normalizeQuantity;
exports.calculateMass = calculateMass;
exports.calculateCarbsInFood = calculateCarbsInFood;
exports.calculateTotalCarbs = calculateTotalCarbs;
exports.Outcome = Outcome;
