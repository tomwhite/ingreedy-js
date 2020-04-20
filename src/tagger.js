function tokenize(s) {
  // handle abbreviation like "100g" by treating it as "100 grams"
  s = s.replace(/(\d+)g/, "$1 grams");
  s = s.replace(/(\d+)oz/, "$1 ounces");
  s = s.replace(/(\d+)ml/, "$1 millilitre");
  s = s.replace(/(\d+)lb/, "$1 pound");
  // handle abbreviation like "100 g" (with space) by treating it as "100 grams"
  s = s.replace(/(\d+) +g /, "$1 grams ");
  s = s.replace(/(\d+) +oz /, "$1 ounces ");
  s = s.replace(/(\d+) +ml /, "$1 millilitre ");
  s = s.replace(/(\d+) +lb /, "$1 pound ");
  // handle abbreviations like tsp and tbsp
  s = s.replace(/tsp\.?/, " teaspoon");
  s = s.replace(/tbsp\.?/, " tablespoon");
  return clumpFractions(s)
    .split(/([,()]|\s+)/)
    .filter(function (e) {
      return String(e).trim();
    });
}

function joinLine(columns) {
  return columns.join("\t");
}

function clumpFractions(s) {
  return s.replace(/(\d+)\s+(\d)\/(\d)/, "$1$$$2/$3");
}

function cleanUnicodeFractions(s) {
  const fractions = {
    "\u215b": "1/8",
    "\u215c": "3/8",
    "\u215d": "5/8",
    "\u215e": "7/8",
    "\u2159": "1/6",
    "\u215a": "5/6",
    "\u2155": "1/5",
    "\u2156": "2/5",
    "\u2157": "3/5",
    "\u2158": "4/5",
    "\u00bc": "1/4",
    "\u00be": "3/4",
    "\u2153": "1/3",
    "\u2154": "2/3",
    "\u00bd": "1/2",
  };
  for (let unicode in fractions) {
    const ascii = fractions[unicode];
    s = s.replace(unicode, " " + ascii);
  }
  return s;
}

function unclump(s) {
  return s.replace(/\$/, " ");
}

function getFeatures(token, index, tokens) {
  const l = tokens.length;
  return [
    `I${index}`,
    `L${lengthGroup(l)}`,
    (isCapitalized(token) ? "Yes" : "No") + "CAP",
    (insideParenthesis(token, tokens) ? "Yes" : "No") + "PAREN",
  ];
}

function singularize(word) {
  const units = {
    cups: "cup",
    tablespoons: "tablespoon",
    teaspoons: "teaspoon",
    pounds: "pound",
    ounces: "ounce",
    cloves: "clove",
    sprigs: "sprig",
    pinches: "pinch",
    bunches: "bunch",
    slices: "slice",
    grams: "gram",
    heads: "head",
    quarts: "quart",
    stalks: "stalk",
    pints: "pint",
    pieces: "piece",
    sticks: "stick",
    dashes: "dash",
    fillets: "fillet",
    cans: "can",
    ears: "ear",
    packages: "package",
    strips: "strip",
    bulbs: "bulb",
    bottles: "bottle",
  };
  if (word in units) {
    return units[word];
  } else {
    return word;
  }
}

function isCapitalized(token) {
  return /^[A-Z]/.test(token);
}

function lengthGroup(actualLength) {
  const lengths = [4, 8, 12, 16, 20];
  for (const length of lengths) {
    if (actualLength < length) {
      return length.toString();
    }
  }
  return "X";
}

// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function insideParenthesis(token, tokens) {
  if (token === "(" || token === ")") {
    return true;
  }
  const line = tokens.join(" ");
  return RegExp(".*\\(.*" + escapeRegExp(token) + ".*\\).*").test(line);
}

function displayIngredient(ingredient) {
  let str = "";
  for (let i = 0; i < ingredient.length; i++) {
    const tag_tokens = ingredient[i];
    const tag = tag_tokens[0];
    const tokens = tag_tokens[1].join(" ");
    str += `<span class='${tag}'>${tokens}</span>`;
  }
  return str;
}

function smartJoin(words) {
  return words
    .join(" ")
    .replace(" , ", ", ")
    .replace("( ", "(")
    .replace(" )", ")");
}

function import_data(lines) {
  const data = [{}];
  const display = [[]];
  let prevTag = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line == "" || line == "\n") {
      data.push({});
      display.push([]);
      prevTag = null;
    } else if (line[0] == "#") {
      continue;
    } else {
      const columns = line.trim().split("\t");
      let token = columns[0].trim();

      token = unclump(token);

      let tag_confidence = columns[columns.length - 1].split("/", 2);
      let tag = tag_confidence[0];
      tag = tag.replace(/^[BI]-/, "").toLowerCase();

      if (prevTag != tag) {
        display[display.length - 1].push([tag, [token]]);
        prevTag = tag;
      } else {
        const ingredient = display[display.length - 1];
        ingredient[ingredient.length - 1][1].push(token);
      }

      if (!(tag in data[data.length - 1])) {
        data[data.length - 1][tag] = [];
      }

      if (tag === "unit") {
        token = singularize(token);
      }

      data[data.length - 1][tag].push(token);
    }
  }

  const output = [];
  for (let i = 0; i < data.length; i++) {
    const ingredient = data[i];
    const dict = {};
    for (let k in ingredient) {
      const tokens = ingredient[k];
      dict[k] = smartJoin(tokens);
    }
    output.push(dict);
  }

  for (let i = 0; i < output.length; i++) {
    output[i]["display"] = displayIngredient(display[i]);
  }

  for (let i = 0; i < output.length; i++) {
    const all_tokens = [];
    for (let j = 0; j < display[i].length; j++) {
      all_tokens.push(display[i][j][1].join(" "));
    }
    output[i]["input"] = smartJoin(all_tokens);
  }

  return output;
}

function export_data(lines) {
  const output = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const line_clean = cleanUnicodeFractions(line);
    const tokens = tokenize(line_clean);
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];
      const features = getFeatures(token, j + 1, tokens);
      output.push(joinLine([token].concat(features)));
    }
    output.push("");
  }
  return output.join("\n");
}

/*
 * Carb factor overrides can be added to the end of ingredient lines to indicate the carb factor of the food.
 * E.g. "100 grams freekeh [60.2]" overrides the carb factor to be 60.2 g/100g.
 * This is useful if the system can't find the food.
 */
function extractCarbFactorOverrides(lines) {
  const regex = /\[([\d.]+)\]$/;
  const modifiedLines = lines.map((line) => line.replace(regex, "").trim());
  const carbFactorOverrides = lines.map((line) => {
    const m = line.match(regex);
    return m == null ? m : parseFloat(m[1]);
  });
  return {
    lines: modifiedLines,
    carbFactorOverrides: carbFactorOverrides,
  };
}

exports.tokenize = tokenize;
exports.joinLine = joinLine;
exports.clumpFractions = clumpFractions;
exports.cleanUnicodeFractions = cleanUnicodeFractions;
exports.unclump = unclump;
exports.getFeatures = getFeatures;
exports.singularize = singularize;
exports.isCapitalized = isCapitalized;
exports.lengthGroup = lengthGroup;
exports.insideParenthesis = insideParenthesis;
exports.displayIngredient = displayIngredient;
exports.smartJoin = smartJoin;
exports.import_data = import_data;
exports.export_data = export_data;
exports.extractCarbFactorOverrides = extractCarbFactorOverrides;
