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

function clumpFractions(s) {
  return s.replace(/(\d+)\s+(\d)\/(\d)/, '$1$$$2/$3')
}

function tokenize(s) {
  return clumpFractions(s).split(/([,()]|\s+)/).filter(function(e) {
    return String(e).trim();
  })
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
