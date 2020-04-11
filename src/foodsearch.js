const lunr = require('lunr');
const mccance = require('./foodsearch_def').mccance
var foodmap = require('./foodmap.js')

function indexFoods() {
  return lunr(function() {
    this.ref("name");
    this.field("name");

    mccance.forEach(function(food) {
      // TODO: boost foods containing "raw"
      this.add(food);
    }, this);
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

function search(name) {
  const hits = idx.search(name);
  if (hits.length == 0) {
    return null;
  }
  // TODO: turn into a hash lookup
  for (let i = 0; i < mccance.length; i++) {
    if (mccance[i]["name"] === hits[0].ref) {
      return mccance[i];
    }
  }
  return null;
}

function lookupFood(name) {
 let foodName = foodmap.lookupExact(name);
 if (foodName != null) {
   // TODO: turn into a hash lookup
   for (let i = 0; i < mccance.length; i++) {
     if (mccance[i]["name"] === foodName) {
       return mccance[i];
     }
   }
 }
 return search(name);
}

exports.normalize = normalize
exports.lookupFood = lookupFood
