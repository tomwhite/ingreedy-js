function cleanUnicodeFractions(s) {
  var fractions = {
              '\u215b': '1/8',
              '\u215c': '3/8',
              '\u215d': '5/8',
              '\u215e': '7/8',
              }
  for(var unicode in fractions) {
    var ascii = fractions[unicode];
    s = s.replace(unicode, ' ' + ascii)
  }
  return s;
}

function joinLine(columns) {
    return columns.join("\t");
}

function clumpFractions(s) {
  return s.replace(/(\d+)\s+(\d)\/(\d)/, '$1$$$2/$3')
}

function tokenize(s) {
  return clumpFractions(s).split(/([,()]|\s+)/).filter(function(e) {
    return String(e).trim();
  })
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

