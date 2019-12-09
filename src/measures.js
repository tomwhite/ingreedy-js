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

function calculateCarbs(foods) {
  let carbsTotal = 0.0;
  for (const food of foods) {
    if ("name" in food) {
      food["food"] = lookup(food["name"]);
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

function getCarbs(food) {
  if ("food" in food && food["food"] != null) {
    let carbsStr = food["food"]["carbohydrate_content"];
    if (carbsStr === "0" || carbsStr === "N" || carbsStr === "Tr") {
      return 0.0;
    } else if ("weight" in food) {
      return (food["weight"] * carbsStr) / 100.0;
    }
  }
  return NaN;
}
