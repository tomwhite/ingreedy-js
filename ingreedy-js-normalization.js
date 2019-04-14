// data source for foods is a google sheet
// see https://medium.com/@scottcents/how-to-convert-google-sheets-to-json-in-just-3-steps-228fe2c24e6

// https://spreadsheets.google.com/feeds/worksheets/1wBrknNKxX_-lmR0ZS0L3pEGvJqe4uOsRI9VrhfrnpVQ/public/basic?alt=json

// Foods tab
// https://spreadsheets.google.com/feeds/list/1wBrknNKxX_-lmR0ZS0L3pEGvJqe4uOsRI9VrhfrnpVQ/omyqap3/public/values?alt=json

function indexFoods() {
  var idx = lunr(function () {
    this.ref('name')
    this.field('name')

    foods.forEach(function (food) {
      this.add(food);
    }, this)
  });
  return idx;
}

var idx = indexFoods();

function normalize(name) {
  var hits = idx.search(name);
  if (hits.length == 0) {
    return name;
  }
  return hits[0].ref;
}

function lookup(name) {
  var hits = idx.search(name);
  if (hits.length == 0) {
    return null;
  }
  for (var i = 0; i < foods.length; i++) {
    if (foods[i]['name'] === hits[0].ref) {
      return foods[i];
    }
  }
  return null;
}

function tsvToJson(tsv) {
  var lines = tsv.split('\n');
  var result = [];
  var headers = lines[0].split('\t');
  for (var i = 1; i < lines.length; i++) {
    var obj = {};
	var line = lines[i].split('\t');
	for (var j = 0; j < headers.length; j++) {
	  obj[headers[j]] = line[j];
	}
    result.push(obj);
  }
  return result;
}