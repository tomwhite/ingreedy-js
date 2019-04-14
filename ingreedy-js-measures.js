function normalizeQuantity(quantity) {
  var match = quantity.match(/(\d+) (\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1]) + Number(match[2])/Number(match[3])
  }
  match = quantity.match(/(\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1])/Number(match[2])
  }
  return Number(quantity);
}