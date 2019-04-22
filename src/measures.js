const unitToGrams = {
  'clove': 5,
  'gram': 1,
  'millilitre': 1,
  'ounce': 28.3,
  'pound': 454,
  'teaspoon': 5,
  'tablespoon': 15
};

const foodMeasures = {
  'apple': 175,
  'banana': 151,
  'mandarin': 78,
  'mango': 274,
  'pear': 198,
  'aubergine': 572,
  'avocado': 210,
  'bok choy': 235,
  'capsicum': 275,
  'carrot': 168,
  'chilli': 15,
  'corn': 320,
  'cucumber': 187,
  'lettuce': 570,
  'mushroom': 100,
  'onion': 130,
  'potato': 229,
  'tomato': 145
};

function normalizeQuantity(quantity) {
  let match = quantity.match(/(\d+) (\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1]) + Number(match[2]) / Number(match[3])
  }
  match = quantity.match(/(\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1]) / Number(match[2])
  }
  return Number(quantity);
}

function calculateMass(quantity, unit, name) {
  quantityFloat = normalizeQuantity(quantity)
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
