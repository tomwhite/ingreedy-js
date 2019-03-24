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
