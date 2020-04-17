const lunr = require('lunr');
const mccance = require('./mccance_def')
const afcd = require('./afcd_def')
const usfdc = require('./usfdc_def')
const foodmap = require('./foodmap')

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

function lookupFood(name, fallbackToSearch) {
 let foodName = foodmap.lookupExact(name);
 if (foodName != null) {
   // TODO: turn into a hash lookup
   for (let i = 0; i < mccance.length; i++) {
     if (mccance[i]["name"] === foodName) {
       return mccance[i];
     }
   }
   // Try AFCD if not in McCance
   for (let i = 0; i < afcd.length; i++) {
     if (afcd[i]["name"] === foodName) {
       return afcd[i];
     }
   }
   // Try USFDC
   for (let i = 0; i < usfdc.length; i++) {
     if (usfdc[i]["name"] === foodName) {
       return usfdc[i];
     }
   }
 }
 return fallbackToSearch ? search(name) : null;
}

exports.normalize = normalize
exports.lookupFood = lookupFood
