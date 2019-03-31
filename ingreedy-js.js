function tokenize(s) {
  return clumpFractions(s).split(/([,()]|\s+)/).filter(function(e) {
    return String(e).trim();
  })
}

function joinLine(columns) {
    return columns.join("\t");
}

function clumpFractions(s) {
  return s.replace(/(\d+)\s+(\d)\/(\d)/, '$1$$$2/$3')
}

function cleanUnicodeFractions(s) {
  var fractions = {
      '\u215b': '1/8',
      '\u215c': '3/8',
      '\u215d': '5/8',
      '\u215e': '7/8',
      '\u2159': '1/6',
      '\u215a': '5/6',
      '\u2155': '1/5',
      '\u2156': '2/5',
      '\u2157': '3/5',
      '\u2158': '4/5',
      '\u00bc': '1/4',
      '\u00be': '3/4',
      '\u2153': '1/3',
      '\u2154': '2/3',
      '\u00bd': '1/2',
  }
  for(var unicode in fractions) {
    var ascii = fractions[unicode];
    s = s.replace(unicode, ' ' + ascii)
  }
  return s;
}

function unclump(s) {
  return s.replace(/\$/, ' ')
}

function getFeatures(token, index, tokens) {
  var l = tokens.length;
  return [
    (`I${index}`),
    (`L${lengthGroup(l)}`),
    (isCapitalized(token) ? "Yes" : "No") + "CAP",
    (insideParenthesis(token, tokens) ? "Yes" : "No") + "PAREN"
  ];
}

function singularize(word) {
    units = {
        "cups": "cup",
        "tablespoons": "tablespoon",
        "teaspoons": "teaspoon",
        "pounds": "pound",
        "ounces": "ounce",
        "cloves": "clove",
        "sprigs": "sprig",
        "pinches": "pinch",
        "bunches": "bunch",
        "slices": "slice",
        "grams": "gram",
        "heads": "head",
        "quarts": "quart",
        "stalks": "stalk",
        "pints": "pint",
        "pieces": "piece",
        "sticks": "stick",
        "dashes": "dash",
        "fillets": "fillet",
        "cans": "can",
        "ears": "ear",
        "packages": "package",
        "strips": "strip",
        "bulbs": "bulb",
        "bottles": "bottle"
    }
    if (word in units) {
        return units[word];
    } else {
        return word;
    }
}

function isCapitalized(token) {
  return /^[A-Z]/.test(token)
}

function lengthGroup(actualLength) {
  var lengths = [4, 8, 12, 16, 20];
  for (var i = 0; i < lengths.length; i++) {
    if (actualLength < lengths[i]) {
      return lengths[i].toString();
    }
  }
  return "X";
}

function insideParenthesis(token, tokens) {
    if (token === '(' || token === ')') {
      return true;
    }
    var line = tokens.join(' ');
    // TODO: should escape token in line below
    return RegExp('.*\\(.*'+token+'.*\\).*').test(line);
}

function displayIngredient(ingredient) {
    var str = "";
    for (var i = 0; i < ingredient.length; i++) {
        var tag_tokens = ingredient[i];
        var tag = tag_tokens[0];
        var tokens = tag_tokens[1].join(" ");
        str += `<span class='${tag}'>${tokens}</span>`;
    }
    return str;
}

function smartJoin(words) {
    var input = words.join(" ");
    input = input.replace(" , ", ", ")
    input = input.replace("( ", "(")
    input = input.replace(" )", ")")
    return input
}

function import_data(lines) {
    var data = [{}];
    var display = [[]];
    var prevTag = null;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line == '' || line == '\n') {
            data.push({});
            display.push([]);
            prevTag = null;
        } else if (line[0] == "#") {
            continue;
        } else {
            columns = line.trim().split('\t')
            token = columns[0].trim()

            token = unclump(token)

            tag_confidence = columns[columns.length - 1].split('/', 2);
            tag = tag_confidence[0];
            confidence = tag_confidence[1];
            tag = tag.replace(/^[BI]\-/, '').toLowerCase();

            if (prevTag != tag) {
                display[display.length - 1].push([tag, [token]]);
                prevTag = tag;
            } else {
                var ingredient = display[display.length - 1];
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

    var output = [];
    for (var i = 0; i < data.length; i++) {
        var ingredient = data[i];
        var dict = {};
        for (var k in ingredient) {
            var tokens = ingredient[k];
            dict[k] = smartJoin(tokens);
        }
        output.push(dict);
    }

    for (var i = 0; i < output.length; i++) {
        output[i]["display"] = displayIngredient(display[i]);
    }

    for (var i = 0; i < output.length; i++) {
        var all_tokens = [];
        for (var j = 0; j < display[i].length; j++) {
            all_tokens.push(display[i][j][1].join(" "));
        }
        output[i]["input"] = smartJoin(all_tokens);
    }

    return output;
}

function export_data(lines) {
    var output = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var line_clean = cleanUnicodeFractions(line);
        var tokens = tokenize(line_clean);
        for (var j = 0; j < tokens.length; j++) {
            var token = tokens[j];
            var features = getFeatures(token, j+1, tokens);
            output.push(joinLine([token].concat(features)));
        }
        output.push('');
    }
    return output.join('\n');
}

