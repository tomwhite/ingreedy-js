var foodsearch = require('./foodsearch.js')

const unitToGrams = {
  clove: 5,
  gram: 1,
  millilitre: 1,
  ounce: 28.3,
  pound: 454,
  teaspoon: 5,
  tablespoon: 15
};

const foodMeasures = {
  apple: 175,
  banana: 151,
  mandarin: 78,
  mango: 274,
  pear: 198,
  aubergine: 572,
  avocado: 210,
  "bok choy": 235,
  capsicum: 275,
  carrot: 168,
  chilli: 15,
  corn: 320,
  cucumber: 187,
  lettuce: 570,
  mushroom: 100,
  onion: 130,
  potato: 229,
  tomato: 145,

  // TODO: handle plurals better
  apples: 175,
  bananas: 151,
  mandarins: 78,
  mangoes: 274,
  pears: 198,
  aubergines: 572,
  avocados: 210,
  capsicums: 275,
  carrots: 168,
  chillies: 15,
  corns: 320,
  cucumbers: 187,
  lettuces: 570,
  mushrooms: 100,
  onions: 130,
  potatoes: 229,
  tomatoes: 145
};

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
  quantityFloat = normalizeQuantity(quantity);
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

/*
 * Deprecated. Use calculateCarbsInFood.
 */
function calculateCarbs(foods) {
  let carbsTotal = 0.0;
  for (const food of foods) {
    if ("name" in food) {
      food["food"] = lookupFood(food["name"]);
    }
    if ("qty" in food) {
      // TODO: won't normally match
      food["weight"] = calculateMass(food["qty"], food["unit"], food["name"]);
    }
    if ("weight" in food && "food" in food && food["food"] != null) {
      carbsTotal += getCarbs(food);
    }
  }
  return carbsTotal;
}

/*
 * Deprecated. Use calculateCarbsInFood.
 */
function calculateCarbsObject(foods) {
  let carbsTotal = 0.0;
  let unknownFoods = false;
  for (const food of foods) {
    if ("name" in food) {
      food["food"] = lookup(food["name"]);
    }
    if ("qty" in food) {
      // TODO: won't normally match
      food["weight"] = calculateMass(food["qty"], food["unit"], food["name"]);
    }
    let carbs = getCarbs(food);
    if (isNaN(carbs)) {
      unknownFoods = true;
    } else {
      carbsTotal += carbs;
    }
  }
  return {
    carbs: carbsTotal,
    unknownFoods: unknownFoods
  };
}

/*
 * Deprecated. Use calculateCarbsInFood.
 */
function getCarbs(food) {
  if ("food" in food && food["food"] != null) {
    let carbsStr = food["food"]["carbs"];
    if (carbsStr === "0" || carbsStr === "N" || carbsStr === "Tr") {
      return 0.0;
    } else if ("weight" in food) {
      return (food["weight"] * carbsStr) / 100.0;
    }
  }
  return NaN;
}

const FailureReason = Object.freeze({
  FOOD_NOT_SPECIFIED: Symbol("food not specified"),
  FOOD_NOT_FOUND: Symbol("food not found"),
  CARBS_NOT_NUMERIC: Symbol("carbs not numeric"),
  QUANTITY_NOT_SPECIFIED: Symbol("quantity not specified"),
  QUANTITY_NOT_NUMERIC: Symbol("quantity not numeric"),
  UNIT_NOT_SPECIFIED: Symbol("unit not specified"),
  UNIT_NOT_FOUND: Symbol("unit not found")
});

function calculateCarbsInFood(food) {
  if (!("name" in food)) {
    return {
      ...food,
      success: false,
      reason: FailureReason.FOOD_NOT_SPECIFIED,
      reasonText: "Food not specified"
    };
  }
  const resolvedFood = foodsearch.lookupFood(food["name"]);
  if (resolvedFood == null) {
    return {
      ...food,
      success: false,
      reason: FailureReason.FOOD_NOT_FOUND,
      reasonText: 'Food not found: "' + food["name"] + '"'
    };
  }
  let carbsPer100gStr = resolvedFood["carbs"];
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
      carbs: 0.0
    };
  }
  const carbsPer100g = parseFloat(carbsPer100gStr);
  if (isNaN(carbsPer100g)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      reason: FailureReason.CARBS_NOT_NUMERIC,
      reasonText: 'Carbs per 100g not numeric: "' + carbsPer100gStr + '"'
    };
  }
  if (!("qty" in food)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      reasonText: "Quantity not specified"
    };
  }
  const qty = normalizeQuantity(food["qty"]);
  if (isNaN(qty)) {
    return {
      ...food,
      food: resolvedFood,
      success: false,
      reason: FailureReason.QUANTITY_NOT_NUMERIC,
      reasonText: 'Quantity not numeric: "' + food["qty"] + '"'
    };
  }
  if ("unit" in food) {
    const unit = food["unit"];
    if (unit in unitToGrams) {
      return {
        ...food,
        food: resolvedFood,
        success: true,
        carbs: (qty * unitToGrams[unit] * carbsPer100g) / 100.0
      };
    } else {
      return {
        ...food,
        food: resolvedFood,
        success: false,
        reason: FailureReason.UNIT_NOT_FOUND,
        reasonText: 'Unit not found: "' + unit + '"'
      };
    }
  }
  if (food["name"] in foodMeasures) {
    return {
      ...food,
      food: resolvedFood,
      success: true,
      carbs: (qty * foodMeasures[food["name"]] * carbsPer100g) / 100.0
    };
  }
  return {
    ...food,
    food: resolvedFood,
    success: false,
    reason: FailureReason.UNIT_NOT_SPECIFIED,
    reasonText: "Unit not specified"
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
    unknownFoods: unknownFoods
  };
}

exports.normalizeQuantity = normalizeQuantity
exports.calculateMass = calculateMass
exports.calculateCarbsInFood = calculateCarbsInFood
exports.calculateTotalCarbs = calculateTotalCarbs
exports.FailureReason = FailureReason