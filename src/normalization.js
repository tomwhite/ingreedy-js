function indexFoods() {
  return lunr(function() {
    this.ref('name');
    this.field('name');

    foods.forEach(function(food) {
      this.add(food);
    }, this)
  });
}

const idx = indexFoods();

function normalize(name) {
  const hits = idx.search(name);
  if (hits.length == 0) {
    return name;
  }
  return hits[0].ref;
}

function lookup(name) {
  const hits = idx.search(name);
  if (hits.length == 0) {
    return null;
  }
  for (let i = 0; i < foods.length; i++) {
    if (foods[i]['name'] === hits[0].ref) {
      return foods[i];
    }
  }
  return null;
}

function tsvToJson(tsv) {
  const lines = tsv.split('\n');
  const result = [];
  const headers = lines[0].split('\t');
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const line = lines[i].split('\t');
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = line[j];
    }
    result.push(obj);
  }
  return result;
}
