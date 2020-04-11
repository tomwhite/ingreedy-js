(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ingreedy = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const measures = require('./src/measures')
const ocr = require('./src/ocr')
const servngs = require('./src/servings')
const tagger = require('./src/tagger')

const fileInput = document.getElementById('file-input');
fileInput.onchange = function(e) {
  loadImage(
    e.target.files[0],
    function(img) {
      const dataUrl = img.toDataURL('image/png');
      document.getElementById('output').src = dataUrl;
      const base64Img = dataUrl.replace('data:image/png;base64,', '');
      ocr.makeVisionRequest(
          base64Img, 'AIzaSyChp1eQ02e3IDQbJ5aqcs2I_27GIn-TsxA',
          function(response) {
            hideFileInput();
            showResultsContainer();

            // servings
            const servings = servngs.getServingsFromPage(response);
            if (!isNaN(servings)) {
                document.getElementById('servings').value = servings;
            }

            // ingredients
            const centerBlock = ocr.getCenterBlock(response);
            const text = ocr.getTextFromBlock(centerBlock).trim();
            const textArea = document.getElementById('ingredients_box');
            textArea.value = text;
            textArea.rows = text.split("\n").length + 1;
            updateNutrients();
          });
    },
    {
      maxWidth: 1024,
      maxHeight: 768,
      orientation: true
    }
  );
};


      function hideFileInput() {
        document.getElementById('scan_container').style.display = 'none';
      }

      function showResultsContainer() {
        document.getElementById('result_container').style.display = '';
      }

      const servingsSelect = document.getElementById('servings');
      servingsSelect.addEventListener('input', (e) => servingsChanged(e));

      function servingsChanged(e) {
        updateNutrients();
      }

      const textArea = document.getElementById('ingredients_box');
      textArea.addEventListener('input', (e) => textChanged(e));

      function textChanged(e) {
        updateNutrients();
      }

      function updateNutrients() {
        const text = document.getElementById('ingredients_box').value;
        const lines = text.split(/\n/);
        const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);
        const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food));
        const totalCarbsInfo = measures.calculateTotalCarbs(foodsWithCarbs);
        const servings = document.getElementById('servings').value;
        const carbsPerServing = Math.round(totalCarbsInfo.carbs / servings);
        const warningIndicator = totalCarbsInfo.unknownFoods ? ">" : "";
        document.getElementById('carbohydrate_content').innerHTML = warningIndicator + carbsPerServing + "g Carbs";
        if (totalCarbsInfo.unknownFoods) {
            document.getElementById('carbohydrate_content').className = "badge badge-pill badge-warning";
        } else {
            document.getElementById('carbohydrate_content').className = "badge badge-pill badge-success";
        }

        let breakdown = '';
        for (const foodWithCarbs of foodsWithCarbs) {
          console.log(foodWithCarbs);
          if ('food' in foodWithCarbs && foodWithCarbs['food'] != null) {
            const name = foodWithCarbs['food']['name'];
            if (foodWithCarbs.success) {
              const c = Math.round(foodWithCarbs.carbs);
              if (c == 0.0) {
                breakdown += '<span class="zero_carbs">' + c + 'g ' + name + '</span>' + '<br/>';
              } else {
                breakdown += c + 'g ' + name + '<br/>';
              }
            } else {
              breakdown += '<span class="error">?</span>g ' + name + ' <span class="error">' + foodWithCarbs.reason + '</span><br/>';
            }
          } else {
            breakdown += '<span class="error">?</span>g <span class="error">' + foodWithCarbs.reason + '</span><br/>';
          }
        }
        document.getElementById('breakdown').innerHTML = breakdown;
      }

      function parseIngredients(lines) {
        return tagger.import_data(crfTest(tagger.export_data(lines)));
      }
      
module.exports = {updateNutrients: updateNutrients};

},{"./src/measures":13,"./src/ocr":14,"./src/servings":15,"./src/tagger":16}],2:[function(require,module,exports){
/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.8
 * Copyright (C) 2019 Oliver Nightingale
 * @license MIT
 */

;(function(){

/**
 * A convenience function for configuring and constructing
 * a new lunr Index.
 *
 * A lunr.Builder instance is created and the pipeline setup
 * with a trimmer, stop word filter and stemmer.
 *
 * This builder object is yielded to the configuration function
 * that is passed as a parameter, allowing the list of fields
 * and other builder parameters to be customised.
 *
 * All documents _must_ be added within the passed config function.
 *
 * @example
 * var idx = lunr(function () {
 *   this.field('title')
 *   this.field('body')
 *   this.ref('id')
 *
 *   documents.forEach(function (doc) {
 *     this.add(doc)
 *   }, this)
 * })
 *
 * @see {@link lunr.Builder}
 * @see {@link lunr.Pipeline}
 * @see {@link lunr.trimmer}
 * @see {@link lunr.stopWordFilter}
 * @see {@link lunr.stemmer}
 * @namespace {function} lunr
 */
var lunr = function (config) {
  var builder = new lunr.Builder

  builder.pipeline.add(
    lunr.trimmer,
    lunr.stopWordFilter,
    lunr.stemmer
  )

  builder.searchPipeline.add(
    lunr.stemmer
  )

  config.call(builder, builder)
  return builder.build()
}

lunr.version = "2.3.8"
/*!
 * lunr.utils
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A namespace containing utils for the rest of the lunr library
 * @namespace lunr.utils
 */
lunr.utils = {}

/**
 * Print a warning message to the console.
 *
 * @param {String} message The message to be printed.
 * @memberOf lunr.utils
 * @function
 */
lunr.utils.warn = (function (global) {
  /* eslint-disable no-console */
  return function (message) {
    if (global.console && console.warn) {
      console.warn(message)
    }
  }
  /* eslint-enable no-console */
})(this)

/**
 * Convert an object to a string.
 *
 * In the case of `null` and `undefined` the function returns
 * the empty string, in all other cases the result of calling
 * `toString` on the passed object is returned.
 *
 * @param {Any} obj The object to convert to a string.
 * @return {String} string representation of the passed object.
 * @memberOf lunr.utils
 */
lunr.utils.asString = function (obj) {
  if (obj === void 0 || obj === null) {
    return ""
  } else {
    return obj.toString()
  }
}

/**
 * Clones an object.
 *
 * Will create a copy of an existing object such that any mutations
 * on the copy cannot affect the original.
 *
 * Only shallow objects are supported, passing a nested object to this
 * function will cause a TypeError.
 *
 * Objects with primitives, and arrays of primitives are supported.
 *
 * @param {Object} obj The object to clone.
 * @return {Object} a clone of the passed object.
 * @throws {TypeError} when a nested object is passed.
 * @memberOf Utils
 */
lunr.utils.clone = function (obj) {
  if (obj === null || obj === undefined) {
    return obj
  }

  var clone = Object.create(null),
      keys = Object.keys(obj)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i],
        val = obj[key]

    if (Array.isArray(val)) {
      clone[key] = val.slice()
      continue
    }

    if (typeof val === 'string' ||
        typeof val === 'number' ||
        typeof val === 'boolean') {
      clone[key] = val
      continue
    }

    throw new TypeError("clone is not deep and does not support nested objects")
  }

  return clone
}
lunr.FieldRef = function (docRef, fieldName, stringValue) {
  this.docRef = docRef
  this.fieldName = fieldName
  this._stringValue = stringValue
}

lunr.FieldRef.joiner = "/"

lunr.FieldRef.fromString = function (s) {
  var n = s.indexOf(lunr.FieldRef.joiner)

  if (n === -1) {
    throw "malformed field ref string"
  }

  var fieldRef = s.slice(0, n),
      docRef = s.slice(n + 1)

  return new lunr.FieldRef (docRef, fieldRef, s)
}

lunr.FieldRef.prototype.toString = function () {
  if (this._stringValue == undefined) {
    this._stringValue = this.fieldName + lunr.FieldRef.joiner + this.docRef
  }

  return this._stringValue
}
/*!
 * lunr.Set
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A lunr set.
 *
 * @constructor
 */
lunr.Set = function (elements) {
  this.elements = Object.create(null)

  if (elements) {
    this.length = elements.length

    for (var i = 0; i < this.length; i++) {
      this.elements[elements[i]] = true
    }
  } else {
    this.length = 0
  }
}

/**
 * A complete set that contains all elements.
 *
 * @static
 * @readonly
 * @type {lunr.Set}
 */
lunr.Set.complete = {
  intersect: function (other) {
    return other
  },

  union: function (other) {
    return other
  },

  contains: function () {
    return true
  }
}

/**
 * An empty set that contains no elements.
 *
 * @static
 * @readonly
 * @type {lunr.Set}
 */
lunr.Set.empty = {
  intersect: function () {
    return this
  },

  union: function (other) {
    return other
  },

  contains: function () {
    return false
  }
}

/**
 * Returns true if this set contains the specified object.
 *
 * @param {object} object - Object whose presence in this set is to be tested.
 * @returns {boolean} - True if this set contains the specified object.
 */
lunr.Set.prototype.contains = function (object) {
  return !!this.elements[object]
}

/**
 * Returns a new set containing only the elements that are present in both
 * this set and the specified set.
 *
 * @param {lunr.Set} other - set to intersect with this set.
 * @returns {lunr.Set} a new set that is the intersection of this and the specified set.
 */

lunr.Set.prototype.intersect = function (other) {
  var a, b, elements, intersection = []

  if (other === lunr.Set.complete) {
    return this
  }

  if (other === lunr.Set.empty) {
    return other
  }

  if (this.length < other.length) {
    a = this
    b = other
  } else {
    a = other
    b = this
  }

  elements = Object.keys(a.elements)

  for (var i = 0; i < elements.length; i++) {
    var element = elements[i]
    if (element in b.elements) {
      intersection.push(element)
    }
  }

  return new lunr.Set (intersection)
}

/**
 * Returns a new set combining the elements of this and the specified set.
 *
 * @param {lunr.Set} other - set to union with this set.
 * @return {lunr.Set} a new set that is the union of this and the specified set.
 */

lunr.Set.prototype.union = function (other) {
  if (other === lunr.Set.complete) {
    return lunr.Set.complete
  }

  if (other === lunr.Set.empty) {
    return this
  }

  return new lunr.Set(Object.keys(this.elements).concat(Object.keys(other.elements)))
}
/**
 * A function to calculate the inverse document frequency for
 * a posting. This is shared between the builder and the index
 *
 * @private
 * @param {object} posting - The posting for a given term
 * @param {number} documentCount - The total number of documents.
 */
lunr.idf = function (posting, documentCount) {
  var documentsWithTerm = 0

  for (var fieldName in posting) {
    if (fieldName == '_index') continue // Ignore the term index, its not a field
    documentsWithTerm += Object.keys(posting[fieldName]).length
  }

  var x = (documentCount - documentsWithTerm + 0.5) / (documentsWithTerm + 0.5)

  return Math.log(1 + Math.abs(x))
}

/**
 * A token wraps a string representation of a token
 * as it is passed through the text processing pipeline.
 *
 * @constructor
 * @param {string} [str=''] - The string token being wrapped.
 * @param {object} [metadata={}] - Metadata associated with this token.
 */
lunr.Token = function (str, metadata) {
  this.str = str || ""
  this.metadata = metadata || {}
}

/**
 * Returns the token string that is being wrapped by this object.
 *
 * @returns {string}
 */
lunr.Token.prototype.toString = function () {
  return this.str
}

/**
 * A token update function is used when updating or optionally
 * when cloning a token.
 *
 * @callback lunr.Token~updateFunction
 * @param {string} str - The string representation of the token.
 * @param {Object} metadata - All metadata associated with this token.
 */

/**
 * Applies the given function to the wrapped string token.
 *
 * @example
 * token.update(function (str, metadata) {
 *   return str.toUpperCase()
 * })
 *
 * @param {lunr.Token~updateFunction} fn - A function to apply to the token string.
 * @returns {lunr.Token}
 */
lunr.Token.prototype.update = function (fn) {
  this.str = fn(this.str, this.metadata)
  return this
}

/**
 * Creates a clone of this token. Optionally a function can be
 * applied to the cloned token.
 *
 * @param {lunr.Token~updateFunction} [fn] - An optional function to apply to the cloned token.
 * @returns {lunr.Token}
 */
lunr.Token.prototype.clone = function (fn) {
  fn = fn || function (s) { return s }
  return new lunr.Token (fn(this.str, this.metadata), this.metadata)
}
/*!
 * lunr.tokenizer
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A function for splitting a string into tokens ready to be inserted into
 * the search index. Uses `lunr.tokenizer.separator` to split strings, change
 * the value of this property to change how strings are split into tokens.
 *
 * This tokenizer will convert its parameter to a string by calling `toString` and
 * then will split this string on the character in `lunr.tokenizer.separator`.
 * Arrays will have their elements converted to strings and wrapped in a lunr.Token.
 *
 * Optional metadata can be passed to the tokenizer, this metadata will be cloned and
 * added as metadata to every token that is created from the object to be tokenized.
 *
 * @static
 * @param {?(string|object|object[])} obj - The object to convert into tokens
 * @param {?object} metadata - Optional metadata to associate with every token
 * @returns {lunr.Token[]}
 * @see {@link lunr.Pipeline}
 */
lunr.tokenizer = function (obj, metadata) {
  if (obj == null || obj == undefined) {
    return []
  }

  if (Array.isArray(obj)) {
    return obj.map(function (t) {
      return new lunr.Token(
        lunr.utils.asString(t).toLowerCase(),
        lunr.utils.clone(metadata)
      )
    })
  }

  var str = obj.toString().toLowerCase(),
      len = str.length,
      tokens = []

  for (var sliceEnd = 0, sliceStart = 0; sliceEnd <= len; sliceEnd++) {
    var char = str.charAt(sliceEnd),
        sliceLength = sliceEnd - sliceStart

    if ((char.match(lunr.tokenizer.separator) || sliceEnd == len)) {

      if (sliceLength > 0) {
        var tokenMetadata = lunr.utils.clone(metadata) || {}
        tokenMetadata["position"] = [sliceStart, sliceLength]
        tokenMetadata["index"] = tokens.length

        tokens.push(
          new lunr.Token (
            str.slice(sliceStart, sliceEnd),
            tokenMetadata
          )
        )
      }

      sliceStart = sliceEnd + 1
    }

  }

  return tokens
}

/**
 * The separator used to split a string into tokens. Override this property to change the behaviour of
 * `lunr.tokenizer` behaviour when tokenizing strings. By default this splits on whitespace and hyphens.
 *
 * @static
 * @see lunr.tokenizer
 */
lunr.tokenizer.separator = /[\s\-]+/
/*!
 * lunr.Pipeline
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.Pipelines maintain an ordered list of functions to be applied to all
 * tokens in documents entering the search index and queries being ran against
 * the index.
 *
 * An instance of lunr.Index created with the lunr shortcut will contain a
 * pipeline with a stop word filter and an English language stemmer. Extra
 * functions can be added before or after either of these functions or these
 * default functions can be removed.
 *
 * When run the pipeline will call each function in turn, passing a token, the
 * index of that token in the original list of all tokens and finally a list of
 * all the original tokens.
 *
 * The output of functions in the pipeline will be passed to the next function
 * in the pipeline. To exclude a token from entering the index the function
 * should return undefined, the rest of the pipeline will not be called with
 * this token.
 *
 * For serialisation of pipelines to work, all functions used in an instance of
 * a pipeline should be registered with lunr.Pipeline. Registered functions can
 * then be loaded. If trying to load a serialised pipeline that uses functions
 * that are not registered an error will be thrown.
 *
 * If not planning on serialising the pipeline then registering pipeline functions
 * is not necessary.
 *
 * @constructor
 */
lunr.Pipeline = function () {
  this._stack = []
}

lunr.Pipeline.registeredFunctions = Object.create(null)

/**
 * A pipeline function maps lunr.Token to lunr.Token. A lunr.Token contains the token
 * string as well as all known metadata. A pipeline function can mutate the token string
 * or mutate (or add) metadata for a given token.
 *
 * A pipeline function can indicate that the passed token should be discarded by returning
 * null, undefined or an empty string. This token will not be passed to any downstream pipeline
 * functions and will not be added to the index.
 *
 * Multiple tokens can be returned by returning an array of tokens. Each token will be passed
 * to any downstream pipeline functions and all will returned tokens will be added to the index.
 *
 * Any number of pipeline functions may be chained together using a lunr.Pipeline.
 *
 * @interface lunr.PipelineFunction
 * @param {lunr.Token} token - A token from the document being processed.
 * @param {number} i - The index of this token in the complete list of tokens for this document/field.
 * @param {lunr.Token[]} tokens - All tokens for this document/field.
 * @returns {(?lunr.Token|lunr.Token[])}
 */

/**
 * Register a function with the pipeline.
 *
 * Functions that are used in the pipeline should be registered if the pipeline
 * needs to be serialised, or a serialised pipeline needs to be loaded.
 *
 * Registering a function does not add it to a pipeline, functions must still be
 * added to instances of the pipeline for them to be used when running a pipeline.
 *
 * @param {lunr.PipelineFunction} fn - The function to check for.
 * @param {String} label - The label to register this function with
 */
lunr.Pipeline.registerFunction = function (fn, label) {
  if (label in this.registeredFunctions) {
    lunr.utils.warn('Overwriting existing registered function: ' + label)
  }

  fn.label = label
  lunr.Pipeline.registeredFunctions[fn.label] = fn
}

/**
 * Warns if the function is not registered as a Pipeline function.
 *
 * @param {lunr.PipelineFunction} fn - The function to check for.
 * @private
 */
lunr.Pipeline.warnIfFunctionNotRegistered = function (fn) {
  var isRegistered = fn.label && (fn.label in this.registeredFunctions)

  if (!isRegistered) {
    lunr.utils.warn('Function is not registered with pipeline. This may cause problems when serialising the index.\n', fn)
  }
}

/**
 * Loads a previously serialised pipeline.
 *
 * All functions to be loaded must already be registered with lunr.Pipeline.
 * If any function from the serialised data has not been registered then an
 * error will be thrown.
 *
 * @param {Object} serialised - The serialised pipeline to load.
 * @returns {lunr.Pipeline}
 */
lunr.Pipeline.load = function (serialised) {
  var pipeline = new lunr.Pipeline

  serialised.forEach(function (fnName) {
    var fn = lunr.Pipeline.registeredFunctions[fnName]

    if (fn) {
      pipeline.add(fn)
    } else {
      throw new Error('Cannot load unregistered function: ' + fnName)
    }
  })

  return pipeline
}

/**
 * Adds new functions to the end of the pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {lunr.PipelineFunction[]} functions - Any number of functions to add to the pipeline.
 */
lunr.Pipeline.prototype.add = function () {
  var fns = Array.prototype.slice.call(arguments)

  fns.forEach(function (fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)
    this._stack.push(fn)
  }, this)
}

/**
 * Adds a single function after a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {lunr.PipelineFunction} existingFn - A function that already exists in the pipeline.
 * @param {lunr.PipelineFunction} newFn - The new function to add to the pipeline.
 */
lunr.Pipeline.prototype.after = function (existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  pos = pos + 1
  this._stack.splice(pos, 0, newFn)
}

/**
 * Adds a single function before a function that already exists in the
 * pipeline.
 *
 * Logs a warning if the function has not been registered.
 *
 * @param {lunr.PipelineFunction} existingFn - A function that already exists in the pipeline.
 * @param {lunr.PipelineFunction} newFn - The new function to add to the pipeline.
 */
lunr.Pipeline.prototype.before = function (existingFn, newFn) {
  lunr.Pipeline.warnIfFunctionNotRegistered(newFn)

  var pos = this._stack.indexOf(existingFn)
  if (pos == -1) {
    throw new Error('Cannot find existingFn')
  }

  this._stack.splice(pos, 0, newFn)
}

/**
 * Removes a function from the pipeline.
 *
 * @param {lunr.PipelineFunction} fn The function to remove from the pipeline.
 */
lunr.Pipeline.prototype.remove = function (fn) {
  var pos = this._stack.indexOf(fn)
  if (pos == -1) {
    return
  }

  this._stack.splice(pos, 1)
}

/**
 * Runs the current list of functions that make up the pipeline against the
 * passed tokens.
 *
 * @param {Array} tokens The tokens to run through the pipeline.
 * @returns {Array}
 */
lunr.Pipeline.prototype.run = function (tokens) {
  var stackLength = this._stack.length

  for (var i = 0; i < stackLength; i++) {
    var fn = this._stack[i]
    var memo = []

    for (var j = 0; j < tokens.length; j++) {
      var result = fn(tokens[j], j, tokens)

      if (result === null || result === void 0 || result === '') continue

      if (Array.isArray(result)) {
        for (var k = 0; k < result.length; k++) {
          memo.push(result[k])
        }
      } else {
        memo.push(result)
      }
    }

    tokens = memo
  }

  return tokens
}

/**
 * Convenience method for passing a string through a pipeline and getting
 * strings out. This method takes care of wrapping the passed string in a
 * token and mapping the resulting tokens back to strings.
 *
 * @param {string} str - The string to pass through the pipeline.
 * @param {?object} metadata - Optional metadata to associate with the token
 * passed to the pipeline.
 * @returns {string[]}
 */
lunr.Pipeline.prototype.runString = function (str, metadata) {
  var token = new lunr.Token (str, metadata)

  return this.run([token]).map(function (t) {
    return t.toString()
  })
}

/**
 * Resets the pipeline by removing any existing processors.
 *
 */
lunr.Pipeline.prototype.reset = function () {
  this._stack = []
}

/**
 * Returns a representation of the pipeline ready for serialisation.
 *
 * Logs a warning if the function has not been registered.
 *
 * @returns {Array}
 */
lunr.Pipeline.prototype.toJSON = function () {
  return this._stack.map(function (fn) {
    lunr.Pipeline.warnIfFunctionNotRegistered(fn)

    return fn.label
  })
}
/*!
 * lunr.Vector
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A vector is used to construct the vector space of documents and queries. These
 * vectors support operations to determine the similarity between two documents or
 * a document and a query.
 *
 * Normally no parameters are required for initializing a vector, but in the case of
 * loading a previously dumped vector the raw elements can be provided to the constructor.
 *
 * For performance reasons vectors are implemented with a flat array, where an elements
 * index is immediately followed by its value. E.g. [index, value, index, value]. This
 * allows the underlying array to be as sparse as possible and still offer decent
 * performance when being used for vector calculations.
 *
 * @constructor
 * @param {Number[]} [elements] - The flat list of element index and element value pairs.
 */
lunr.Vector = function (elements) {
  this._magnitude = 0
  this.elements = elements || []
}


/**
 * Calculates the position within the vector to insert a given index.
 *
 * This is used internally by insert and upsert. If there are duplicate indexes then
 * the position is returned as if the value for that index were to be updated, but it
 * is the callers responsibility to check whether there is a duplicate at that index
 *
 * @param {Number} insertIdx - The index at which the element should be inserted.
 * @returns {Number}
 */
lunr.Vector.prototype.positionForIndex = function (index) {
  // For an empty vector the tuple can be inserted at the beginning
  if (this.elements.length == 0) {
    return 0
  }

  var start = 0,
      end = this.elements.length / 2,
      sliceLength = end - start,
      pivotPoint = Math.floor(sliceLength / 2),
      pivotIndex = this.elements[pivotPoint * 2]

  while (sliceLength > 1) {
    if (pivotIndex < index) {
      start = pivotPoint
    }

    if (pivotIndex > index) {
      end = pivotPoint
    }

    if (pivotIndex == index) {
      break
    }

    sliceLength = end - start
    pivotPoint = start + Math.floor(sliceLength / 2)
    pivotIndex = this.elements[pivotPoint * 2]
  }

  if (pivotIndex == index) {
    return pivotPoint * 2
  }

  if (pivotIndex > index) {
    return pivotPoint * 2
  }

  if (pivotIndex < index) {
    return (pivotPoint + 1) * 2
  }
}

/**
 * Inserts an element at an index within the vector.
 *
 * Does not allow duplicates, will throw an error if there is already an entry
 * for this index.
 *
 * @param {Number} insertIdx - The index at which the element should be inserted.
 * @param {Number} val - The value to be inserted into the vector.
 */
lunr.Vector.prototype.insert = function (insertIdx, val) {
  this.upsert(insertIdx, val, function () {
    throw "duplicate index"
  })
}

/**
 * Inserts or updates an existing index within the vector.
 *
 * @param {Number} insertIdx - The index at which the element should be inserted.
 * @param {Number} val - The value to be inserted into the vector.
 * @param {function} fn - A function that is called for updates, the existing value and the
 * requested value are passed as arguments
 */
lunr.Vector.prototype.upsert = function (insertIdx, val, fn) {
  this._magnitude = 0
  var position = this.positionForIndex(insertIdx)

  if (this.elements[position] == insertIdx) {
    this.elements[position + 1] = fn(this.elements[position + 1], val)
  } else {
    this.elements.splice(position, 0, insertIdx, val)
  }
}

/**
 * Calculates the magnitude of this vector.
 *
 * @returns {Number}
 */
lunr.Vector.prototype.magnitude = function () {
  if (this._magnitude) return this._magnitude

  var sumOfSquares = 0,
      elementsLength = this.elements.length

  for (var i = 1; i < elementsLength; i += 2) {
    var val = this.elements[i]
    sumOfSquares += val * val
  }

  return this._magnitude = Math.sqrt(sumOfSquares)
}

/**
 * Calculates the dot product of this vector and another vector.
 *
 * @param {lunr.Vector} otherVector - The vector to compute the dot product with.
 * @returns {Number}
 */
lunr.Vector.prototype.dot = function (otherVector) {
  var dotProduct = 0,
      a = this.elements, b = otherVector.elements,
      aLen = a.length, bLen = b.length,
      aVal = 0, bVal = 0,
      i = 0, j = 0

  while (i < aLen && j < bLen) {
    aVal = a[i], bVal = b[j]
    if (aVal < bVal) {
      i += 2
    } else if (aVal > bVal) {
      j += 2
    } else if (aVal == bVal) {
      dotProduct += a[i + 1] * b[j + 1]
      i += 2
      j += 2
    }
  }

  return dotProduct
}

/**
 * Calculates the similarity between this vector and another vector.
 *
 * @param {lunr.Vector} otherVector - The other vector to calculate the
 * similarity with.
 * @returns {Number}
 */
lunr.Vector.prototype.similarity = function (otherVector) {
  return this.dot(otherVector) / this.magnitude() || 0
}

/**
 * Converts the vector to an array of the elements within the vector.
 *
 * @returns {Number[]}
 */
lunr.Vector.prototype.toArray = function () {
  var output = new Array (this.elements.length / 2)

  for (var i = 1, j = 0; i < this.elements.length; i += 2, j++) {
    output[j] = this.elements[i]
  }

  return output
}

/**
 * A JSON serializable representation of the vector.
 *
 * @returns {Number[]}
 */
lunr.Vector.prototype.toJSON = function () {
  return this.elements
}
/* eslint-disable */
/*!
 * lunr.stemmer
 * Copyright (C) 2019 Oliver Nightingale
 * Includes code from - http://tartarus.org/~martin/PorterStemmer/js.txt
 */

/**
 * lunr.stemmer is an english language stemmer, this is a JavaScript
 * implementation of the PorterStemmer taken from http://tartarus.org/~martin
 *
 * @static
 * @implements {lunr.PipelineFunction}
 * @param {lunr.Token} token - The string to stem
 * @returns {lunr.Token}
 * @see {@link lunr.Pipeline}
 * @function
 */
lunr.stemmer = (function(){
  var step2list = {
      "ational" : "ate",
      "tional" : "tion",
      "enci" : "ence",
      "anci" : "ance",
      "izer" : "ize",
      "bli" : "ble",
      "alli" : "al",
      "entli" : "ent",
      "eli" : "e",
      "ousli" : "ous",
      "ization" : "ize",
      "ation" : "ate",
      "ator" : "ate",
      "alism" : "al",
      "iveness" : "ive",
      "fulness" : "ful",
      "ousness" : "ous",
      "aliti" : "al",
      "iviti" : "ive",
      "biliti" : "ble",
      "logi" : "log"
    },

    step3list = {
      "icate" : "ic",
      "ative" : "",
      "alize" : "al",
      "iciti" : "ic",
      "ical" : "ic",
      "ful" : "",
      "ness" : ""
    },

    c = "[^aeiou]",          // consonant
    v = "[aeiouy]",          // vowel
    C = c + "[^aeiouy]*",    // consonant sequence
    V = v + "[aeiou]*",      // vowel sequence

    mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
    meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
    mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
    s_v = "^(" + C + ")?" + v;                   // vowel in stem

  var re_mgr0 = new RegExp(mgr0);
  var re_mgr1 = new RegExp(mgr1);
  var re_meq1 = new RegExp(meq1);
  var re_s_v = new RegExp(s_v);

  var re_1a = /^(.+?)(ss|i)es$/;
  var re2_1a = /^(.+?)([^s])s$/;
  var re_1b = /^(.+?)eed$/;
  var re2_1b = /^(.+?)(ed|ing)$/;
  var re_1b_2 = /.$/;
  var re2_1b_2 = /(at|bl|iz)$/;
  var re3_1b_2 = new RegExp("([^aeiouylsz])\\1$");
  var re4_1b_2 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  var re_1c = /^(.+?[^aeiou])y$/;
  var re_2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;

  var re_3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;

  var re_4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  var re2_4 = /^(.+?)(s|t)(ion)$/;

  var re_5 = /^(.+?)e$/;
  var re_5_1 = /ll$/;
  var re3_5 = new RegExp("^" + C + v + "[^aeiouwxy]$");

  var porterStemmer = function porterStemmer(w) {
    var stem,
      suffix,
      firstch,
      re,
      re2,
      re3,
      re4;

    if (w.length < 3) { return w; }

    firstch = w.substr(0,1);
    if (firstch == "y") {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = re_1a
    re2 = re2_1a;

    if (re.test(w)) { w = w.replace(re,"$1$2"); }
    else if (re2.test(w)) { w = w.replace(re2,"$1$2"); }

    // Step 1b
    re = re_1b;
    re2 = re2_1b;
    if (re.test(w)) {
      var fp = re.exec(w);
      re = re_mgr0;
      if (re.test(fp[1])) {
        re = re_1b_2;
        w = w.replace(re,"");
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1];
      re2 = re_s_v;
      if (re2.test(stem)) {
        w = stem;
        re2 = re2_1b_2;
        re3 = re3_1b_2;
        re4 = re4_1b_2;
        if (re2.test(w)) { w = w + "e"; }
        else if (re3.test(w)) { re = re_1b_2; w = w.replace(re,""); }
        else if (re4.test(w)) { w = w + "e"; }
      }
    }

    // Step 1c - replace suffix y or Y by i if preceded by a non-vowel which is not the first letter of the word (so cry -> cri, by -> by, say -> say)
    re = re_1c;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      w = stem + "i";
    }

    // Step 2
    re = re_2;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = re_3;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = re_mgr0;
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = re_4;
    re2 = re2_4;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      var fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = re_mgr1;
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = re_5;
    if (re.test(w)) {
      var fp = re.exec(w);
      stem = fp[1];
      re = re_mgr1;
      re2 = re_meq1;
      re3 = re3_5;
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = re_5_1;
    re2 = re_mgr1;
    if (re.test(w) && re2.test(w)) {
      re = re_1b_2;
      w = w.replace(re,"");
    }

    // and turn initial Y back to y

    if (firstch == "y") {
      w = firstch.toLowerCase() + w.substr(1);
    }

    return w;
  };

  return function (token) {
    return token.update(porterStemmer);
  }
})();

lunr.Pipeline.registerFunction(lunr.stemmer, 'stemmer')
/*!
 * lunr.stopWordFilter
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.generateStopWordFilter builds a stopWordFilter function from the provided
 * list of stop words.
 *
 * The built in lunr.stopWordFilter is built using this generator and can be used
 * to generate custom stopWordFilters for applications or non English languages.
 *
 * @function
 * @param {Array} token The token to pass through the filter
 * @returns {lunr.PipelineFunction}
 * @see lunr.Pipeline
 * @see lunr.stopWordFilter
 */
lunr.generateStopWordFilter = function (stopWords) {
  var words = stopWords.reduce(function (memo, stopWord) {
    memo[stopWord] = stopWord
    return memo
  }, {})

  return function (token) {
    if (token && words[token.toString()] !== token.toString()) return token
  }
}

/**
 * lunr.stopWordFilter is an English language stop word list filter, any words
 * contained in the list will not be passed through the filter.
 *
 * This is intended to be used in the Pipeline. If the token does not pass the
 * filter then undefined will be returned.
 *
 * @function
 * @implements {lunr.PipelineFunction}
 * @params {lunr.Token} token - A token to check for being a stop word.
 * @returns {lunr.Token}
 * @see {@link lunr.Pipeline}
 */
lunr.stopWordFilter = lunr.generateStopWordFilter([
  'a',
  'able',
  'about',
  'across',
  'after',
  'all',
  'almost',
  'also',
  'am',
  'among',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'but',
  'by',
  'can',
  'cannot',
  'could',
  'dear',
  'did',
  'do',
  'does',
  'either',
  'else',
  'ever',
  'every',
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'how',
  'however',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'least',
  'let',
  'like',
  'likely',
  'may',
  'me',
  'might',
  'most',
  'must',
  'my',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'often',
  'on',
  'only',
  'or',
  'other',
  'our',
  'own',
  'rather',
  'said',
  'say',
  'says',
  'she',
  'should',
  'since',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tis',
  'to',
  'too',
  'twas',
  'us',
  'wants',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'yet',
  'you',
  'your'
])

lunr.Pipeline.registerFunction(lunr.stopWordFilter, 'stopWordFilter')
/*!
 * lunr.trimmer
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.trimmer is a pipeline function for trimming non word
 * characters from the beginning and end of tokens before they
 * enter the index.
 *
 * This implementation may not work correctly for non latin
 * characters and should either be removed or adapted for use
 * with languages with non-latin characters.
 *
 * @static
 * @implements {lunr.PipelineFunction}
 * @param {lunr.Token} token The token to pass through the filter
 * @returns {lunr.Token}
 * @see lunr.Pipeline
 */
lunr.trimmer = function (token) {
  return token.update(function (s) {
    return s.replace(/^\W+/, '').replace(/\W+$/, '')
  })
}

lunr.Pipeline.registerFunction(lunr.trimmer, 'trimmer')
/*!
 * lunr.TokenSet
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * A token set is used to store the unique list of all tokens
 * within an index. Token sets are also used to represent an
 * incoming query to the index, this query token set and index
 * token set are then intersected to find which tokens to look
 * up in the inverted index.
 *
 * A token set can hold multiple tokens, as in the case of the
 * index token set, or it can hold a single token as in the
 * case of a simple query token set.
 *
 * Additionally token sets are used to perform wildcard matching.
 * Leading, contained and trailing wildcards are supported, and
 * from this edit distance matching can also be provided.
 *
 * Token sets are implemented as a minimal finite state automata,
 * where both common prefixes and suffixes are shared between tokens.
 * This helps to reduce the space used for storing the token set.
 *
 * @constructor
 */
lunr.TokenSet = function () {
  this.final = false
  this.edges = {}
  this.id = lunr.TokenSet._nextId
  lunr.TokenSet._nextId += 1
}

/**
 * Keeps track of the next, auto increment, identifier to assign
 * to a new tokenSet.
 *
 * TokenSets require a unique identifier to be correctly minimised.
 *
 * @private
 */
lunr.TokenSet._nextId = 1

/**
 * Creates a TokenSet instance from the given sorted array of words.
 *
 * @param {String[]} arr - A sorted array of strings to create the set from.
 * @returns {lunr.TokenSet}
 * @throws Will throw an error if the input array is not sorted.
 */
lunr.TokenSet.fromArray = function (arr) {
  var builder = new lunr.TokenSet.Builder

  for (var i = 0, len = arr.length; i < len; i++) {
    builder.insert(arr[i])
  }

  builder.finish()
  return builder.root
}

/**
 * Creates a token set from a query clause.
 *
 * @private
 * @param {Object} clause - A single clause from lunr.Query.
 * @param {string} clause.term - The query clause term.
 * @param {number} [clause.editDistance] - The optional edit distance for the term.
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.fromClause = function (clause) {
  if ('editDistance' in clause) {
    return lunr.TokenSet.fromFuzzyString(clause.term, clause.editDistance)
  } else {
    return lunr.TokenSet.fromString(clause.term)
  }
}

/**
 * Creates a token set representing a single string with a specified
 * edit distance.
 *
 * Insertions, deletions, substitutions and transpositions are each
 * treated as an edit distance of 1.
 *
 * Increasing the allowed edit distance will have a dramatic impact
 * on the performance of both creating and intersecting these TokenSets.
 * It is advised to keep the edit distance less than 3.
 *
 * @param {string} str - The string to create the token set from.
 * @param {number} editDistance - The allowed edit distance to match.
 * @returns {lunr.Vector}
 */
lunr.TokenSet.fromFuzzyString = function (str, editDistance) {
  var root = new lunr.TokenSet

  var stack = [{
    node: root,
    editsRemaining: editDistance,
    str: str
  }]

  while (stack.length) {
    var frame = stack.pop()

    // no edit
    if (frame.str.length > 0) {
      var char = frame.str.charAt(0),
          noEditNode

      if (char in frame.node.edges) {
        noEditNode = frame.node.edges[char]
      } else {
        noEditNode = new lunr.TokenSet
        frame.node.edges[char] = noEditNode
      }

      if (frame.str.length == 1) {
        noEditNode.final = true
      }

      stack.push({
        node: noEditNode,
        editsRemaining: frame.editsRemaining,
        str: frame.str.slice(1)
      })
    }

    if (frame.editsRemaining == 0) {
      continue
    }

    // insertion
    if ("*" in frame.node.edges) {
      var insertionNode = frame.node.edges["*"]
    } else {
      var insertionNode = new lunr.TokenSet
      frame.node.edges["*"] = insertionNode
    }

    if (frame.str.length == 0) {
      insertionNode.final = true
    }

    stack.push({
      node: insertionNode,
      editsRemaining: frame.editsRemaining - 1,
      str: frame.str
    })

    // deletion
    // can only do a deletion if we have enough edits remaining
    // and if there are characters left to delete in the string
    if (frame.str.length > 1) {
      stack.push({
        node: frame.node,
        editsRemaining: frame.editsRemaining - 1,
        str: frame.str.slice(1)
      })
    }

    // deletion
    // just removing the last character from the str
    if (frame.str.length == 1) {
      frame.node.final = true
    }

    // substitution
    // can only do a substitution if we have enough edits remaining
    // and if there are characters left to substitute
    if (frame.str.length >= 1) {
      if ("*" in frame.node.edges) {
        var substitutionNode = frame.node.edges["*"]
      } else {
        var substitutionNode = new lunr.TokenSet
        frame.node.edges["*"] = substitutionNode
      }

      if (frame.str.length == 1) {
        substitutionNode.final = true
      }

      stack.push({
        node: substitutionNode,
        editsRemaining: frame.editsRemaining - 1,
        str: frame.str.slice(1)
      })
    }

    // transposition
    // can only do a transposition if there are edits remaining
    // and there are enough characters to transpose
    if (frame.str.length > 1) {
      var charA = frame.str.charAt(0),
          charB = frame.str.charAt(1),
          transposeNode

      if (charB in frame.node.edges) {
        transposeNode = frame.node.edges[charB]
      } else {
        transposeNode = new lunr.TokenSet
        frame.node.edges[charB] = transposeNode
      }

      if (frame.str.length == 1) {
        transposeNode.final = true
      }

      stack.push({
        node: transposeNode,
        editsRemaining: frame.editsRemaining - 1,
        str: charA + frame.str.slice(2)
      })
    }
  }

  return root
}

/**
 * Creates a TokenSet from a string.
 *
 * The string may contain one or more wildcard characters (*)
 * that will allow wildcard matching when intersecting with
 * another TokenSet.
 *
 * @param {string} str - The string to create a TokenSet from.
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.fromString = function (str) {
  var node = new lunr.TokenSet,
      root = node

  /*
   * Iterates through all characters within the passed string
   * appending a node for each character.
   *
   * When a wildcard character is found then a self
   * referencing edge is introduced to continually match
   * any number of any characters.
   */
  for (var i = 0, len = str.length; i < len; i++) {
    var char = str[i],
        final = (i == len - 1)

    if (char == "*") {
      node.edges[char] = node
      node.final = final

    } else {
      var next = new lunr.TokenSet
      next.final = final

      node.edges[char] = next
      node = next
    }
  }

  return root
}

/**
 * Converts this TokenSet into an array of strings
 * contained within the TokenSet.
 *
 * This is not intended to be used on a TokenSet that
 * contains wildcards, in these cases the results are
 * undefined and are likely to cause an infinite loop.
 *
 * @returns {string[]}
 */
lunr.TokenSet.prototype.toArray = function () {
  var words = []

  var stack = [{
    prefix: "",
    node: this
  }]

  while (stack.length) {
    var frame = stack.pop(),
        edges = Object.keys(frame.node.edges),
        len = edges.length

    if (frame.node.final) {
      /* In Safari, at this point the prefix is sometimes corrupted, see:
       * https://github.com/olivernn/lunr.js/issues/279 Calling any
       * String.prototype method forces Safari to "cast" this string to what
       * it's supposed to be, fixing the bug. */
      frame.prefix.charAt(0)
      words.push(frame.prefix)
    }

    for (var i = 0; i < len; i++) {
      var edge = edges[i]

      stack.push({
        prefix: frame.prefix.concat(edge),
        node: frame.node.edges[edge]
      })
    }
  }

  return words
}

/**
 * Generates a string representation of a TokenSet.
 *
 * This is intended to allow TokenSets to be used as keys
 * in objects, largely to aid the construction and minimisation
 * of a TokenSet. As such it is not designed to be a human
 * friendly representation of the TokenSet.
 *
 * @returns {string}
 */
lunr.TokenSet.prototype.toString = function () {
  // NOTE: Using Object.keys here as this.edges is very likely
  // to enter 'hash-mode' with many keys being added
  //
  // avoiding a for-in loop here as it leads to the function
  // being de-optimised (at least in V8). From some simple
  // benchmarks the performance is comparable, but allowing
  // V8 to optimize may mean easy performance wins in the future.

  if (this._str) {
    return this._str
  }

  var str = this.final ? '1' : '0',
      labels = Object.keys(this.edges).sort(),
      len = labels.length

  for (var i = 0; i < len; i++) {
    var label = labels[i],
        node = this.edges[label]

    str = str + label + node.id
  }

  return str
}

/**
 * Returns a new TokenSet that is the intersection of
 * this TokenSet and the passed TokenSet.
 *
 * This intersection will take into account any wildcards
 * contained within the TokenSet.
 *
 * @param {lunr.TokenSet} b - An other TokenSet to intersect with.
 * @returns {lunr.TokenSet}
 */
lunr.TokenSet.prototype.intersect = function (b) {
  var output = new lunr.TokenSet,
      frame = undefined

  var stack = [{
    qNode: b,
    output: output,
    node: this
  }]

  while (stack.length) {
    frame = stack.pop()

    // NOTE: As with the #toString method, we are using
    // Object.keys and a for loop instead of a for-in loop
    // as both of these objects enter 'hash' mode, causing
    // the function to be de-optimised in V8
    var qEdges = Object.keys(frame.qNode.edges),
        qLen = qEdges.length,
        nEdges = Object.keys(frame.node.edges),
        nLen = nEdges.length

    for (var q = 0; q < qLen; q++) {
      var qEdge = qEdges[q]

      for (var n = 0; n < nLen; n++) {
        var nEdge = nEdges[n]

        if (nEdge == qEdge || qEdge == '*') {
          var node = frame.node.edges[nEdge],
              qNode = frame.qNode.edges[qEdge],
              final = node.final && qNode.final,
              next = undefined

          if (nEdge in frame.output.edges) {
            // an edge already exists for this character
            // no need to create a new node, just set the finality
            // bit unless this node is already final
            next = frame.output.edges[nEdge]
            next.final = next.final || final

          } else {
            // no edge exists yet, must create one
            // set the finality bit and insert it
            // into the output
            next = new lunr.TokenSet
            next.final = final
            frame.output.edges[nEdge] = next
          }

          stack.push({
            qNode: qNode,
            output: next,
            node: node
          })
        }
      }
    }
  }

  return output
}
lunr.TokenSet.Builder = function () {
  this.previousWord = ""
  this.root = new lunr.TokenSet
  this.uncheckedNodes = []
  this.minimizedNodes = {}
}

lunr.TokenSet.Builder.prototype.insert = function (word) {
  var node,
      commonPrefix = 0

  if (word < this.previousWord) {
    throw new Error ("Out of order word insertion")
  }

  for (var i = 0; i < word.length && i < this.previousWord.length; i++) {
    if (word[i] != this.previousWord[i]) break
    commonPrefix++
  }

  this.minimize(commonPrefix)

  if (this.uncheckedNodes.length == 0) {
    node = this.root
  } else {
    node = this.uncheckedNodes[this.uncheckedNodes.length - 1].child
  }

  for (var i = commonPrefix; i < word.length; i++) {
    var nextNode = new lunr.TokenSet,
        char = word[i]

    node.edges[char] = nextNode

    this.uncheckedNodes.push({
      parent: node,
      char: char,
      child: nextNode
    })

    node = nextNode
  }

  node.final = true
  this.previousWord = word
}

lunr.TokenSet.Builder.prototype.finish = function () {
  this.minimize(0)
}

lunr.TokenSet.Builder.prototype.minimize = function (downTo) {
  for (var i = this.uncheckedNodes.length - 1; i >= downTo; i--) {
    var node = this.uncheckedNodes[i],
        childKey = node.child.toString()

    if (childKey in this.minimizedNodes) {
      node.parent.edges[node.char] = this.minimizedNodes[childKey]
    } else {
      // Cache the key for this node since
      // we know it can't change anymore
      node.child._str = childKey

      this.minimizedNodes[childKey] = node.child
    }

    this.uncheckedNodes.pop()
  }
}
/*!
 * lunr.Index
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * An index contains the built index of all documents and provides a query interface
 * to the index.
 *
 * Usually instances of lunr.Index will not be created using this constructor, instead
 * lunr.Builder should be used to construct new indexes, or lunr.Index.load should be
 * used to load previously built and serialized indexes.
 *
 * @constructor
 * @param {Object} attrs - The attributes of the built search index.
 * @param {Object} attrs.invertedIndex - An index of term/field to document reference.
 * @param {Object<string, lunr.Vector>} attrs.fieldVectors - Field vectors
 * @param {lunr.TokenSet} attrs.tokenSet - An set of all corpus tokens.
 * @param {string[]} attrs.fields - The names of indexed document fields.
 * @param {lunr.Pipeline} attrs.pipeline - The pipeline to use for search terms.
 */
lunr.Index = function (attrs) {
  this.invertedIndex = attrs.invertedIndex
  this.fieldVectors = attrs.fieldVectors
  this.tokenSet = attrs.tokenSet
  this.fields = attrs.fields
  this.pipeline = attrs.pipeline
}

/**
 * A result contains details of a document matching a search query.
 * @typedef {Object} lunr.Index~Result
 * @property {string} ref - The reference of the document this result represents.
 * @property {number} score - A number between 0 and 1 representing how similar this document is to the query.
 * @property {lunr.MatchData} matchData - Contains metadata about this match including which term(s) caused the match.
 */

/**
 * Although lunr provides the ability to create queries using lunr.Query, it also provides a simple
 * query language which itself is parsed into an instance of lunr.Query.
 *
 * For programmatically building queries it is advised to directly use lunr.Query, the query language
 * is best used for human entered text rather than program generated text.
 *
 * At its simplest queries can just be a single term, e.g. `hello`, multiple terms are also supported
 * and will be combined with OR, e.g `hello world` will match documents that contain either 'hello'
 * or 'world', though those that contain both will rank higher in the results.
 *
 * Wildcards can be included in terms to match one or more unspecified characters, these wildcards can
 * be inserted anywhere within the term, and more than one wildcard can exist in a single term. Adding
 * wildcards will increase the number of documents that will be found but can also have a negative
 * impact on query performance, especially with wildcards at the beginning of a term.
 *
 * Terms can be restricted to specific fields, e.g. `title:hello`, only documents with the term
 * hello in the title field will match this query. Using a field not present in the index will lead
 * to an error being thrown.
 *
 * Modifiers can also be added to terms, lunr supports edit distance and boost modifiers on terms. A term
 * boost will make documents matching that term score higher, e.g. `foo^5`. Edit distance is also supported
 * to provide fuzzy matching, e.g. 'hello~2' will match documents with hello with an edit distance of 2.
 * Avoid large values for edit distance to improve query performance.
 *
 * Each term also supports a presence modifier. By default a term's presence in document is optional, however
 * this can be changed to either required or prohibited. For a term's presence to be required in a document the
 * term should be prefixed with a '+', e.g. `+foo bar` is a search for documents that must contain 'foo' and
 * optionally contain 'bar'. Conversely a leading '-' sets the terms presence to prohibited, i.e. it must not
 * appear in a document, e.g. `-foo bar` is a search for documents that do not contain 'foo' but may contain 'bar'.
 *
 * To escape special characters the backslash character '\' can be used, this allows searches to include
 * characters that would normally be considered modifiers, e.g. `foo\~2` will search for a term "foo~2" instead
 * of attempting to apply a boost of 2 to the search term "foo".
 *
 * @typedef {string} lunr.Index~QueryString
 * @example <caption>Simple single term query</caption>
 * hello
 * @example <caption>Multiple term query</caption>
 * hello world
 * @example <caption>term scoped to a field</caption>
 * title:hello
 * @example <caption>term with a boost of 10</caption>
 * hello^10
 * @example <caption>term with an edit distance of 2</caption>
 * hello~2
 * @example <caption>terms with presence modifiers</caption>
 * -foo +bar baz
 */

/**
 * Performs a search against the index using lunr query syntax.
 *
 * Results will be returned sorted by their score, the most relevant results
 * will be returned first.  For details on how the score is calculated, please see
 * the {@link https://lunrjs.com/guides/searching.html#scoring|guide}.
 *
 * For more programmatic querying use lunr.Index#query.
 *
 * @param {lunr.Index~QueryString} queryString - A string containing a lunr query.
 * @throws {lunr.QueryParseError} If the passed query string cannot be parsed.
 * @returns {lunr.Index~Result[]}
 */
lunr.Index.prototype.search = function (queryString) {
  return this.query(function (query) {
    var parser = new lunr.QueryParser(queryString, query)
    parser.parse()
  })
}

/**
 * A query builder callback provides a query object to be used to express
 * the query to perform on the index.
 *
 * @callback lunr.Index~queryBuilder
 * @param {lunr.Query} query - The query object to build up.
 * @this lunr.Query
 */

/**
 * Performs a query against the index using the yielded lunr.Query object.
 *
 * If performing programmatic queries against the index, this method is preferred
 * over lunr.Index#search so as to avoid the additional query parsing overhead.
 *
 * A query object is yielded to the supplied function which should be used to
 * express the query to be run against the index.
 *
 * Note that although this function takes a callback parameter it is _not_ an
 * asynchronous operation, the callback is just yielded a query object to be
 * customized.
 *
 * @param {lunr.Index~queryBuilder} fn - A function that is used to build the query.
 * @returns {lunr.Index~Result[]}
 */
lunr.Index.prototype.query = function (fn) {
  // for each query clause
  // * process terms
  // * expand terms from token set
  // * find matching documents and metadata
  // * get document vectors
  // * score documents

  var query = new lunr.Query(this.fields),
      matchingFields = Object.create(null),
      queryVectors = Object.create(null),
      termFieldCache = Object.create(null),
      requiredMatches = Object.create(null),
      prohibitedMatches = Object.create(null)

  /*
   * To support field level boosts a query vector is created per
   * field. An empty vector is eagerly created to support negated
   * queries.
   */
  for (var i = 0; i < this.fields.length; i++) {
    queryVectors[this.fields[i]] = new lunr.Vector
  }

  fn.call(query, query)

  for (var i = 0; i < query.clauses.length; i++) {
    /*
     * Unless the pipeline has been disabled for this term, which is
     * the case for terms with wildcards, we need to pass the clause
     * term through the search pipeline. A pipeline returns an array
     * of processed terms. Pipeline functions may expand the passed
     * term, which means we may end up performing multiple index lookups
     * for a single query term.
     */
    var clause = query.clauses[i],
        terms = null,
        clauseMatches = lunr.Set.complete

    if (clause.usePipeline) {
      terms = this.pipeline.runString(clause.term, {
        fields: clause.fields
      })
    } else {
      terms = [clause.term]
    }

    for (var m = 0; m < terms.length; m++) {
      var term = terms[m]

      /*
       * Each term returned from the pipeline needs to use the same query
       * clause object, e.g. the same boost and or edit distance. The
       * simplest way to do this is to re-use the clause object but mutate
       * its term property.
       */
      clause.term = term

      /*
       * From the term in the clause we create a token set which will then
       * be used to intersect the indexes token set to get a list of terms
       * to lookup in the inverted index
       */
      var termTokenSet = lunr.TokenSet.fromClause(clause),
          expandedTerms = this.tokenSet.intersect(termTokenSet).toArray()

      /*
       * If a term marked as required does not exist in the tokenSet it is
       * impossible for the search to return any matches. We set all the field
       * scoped required matches set to empty and stop examining any further
       * clauses.
       */
      if (expandedTerms.length === 0 && clause.presence === lunr.Query.presence.REQUIRED) {
        for (var k = 0; k < clause.fields.length; k++) {
          var field = clause.fields[k]
          requiredMatches[field] = lunr.Set.empty
        }

        break
      }

      for (var j = 0; j < expandedTerms.length; j++) {
        /*
         * For each term get the posting and termIndex, this is required for
         * building the query vector.
         */
        var expandedTerm = expandedTerms[j],
            posting = this.invertedIndex[expandedTerm],
            termIndex = posting._index

        for (var k = 0; k < clause.fields.length; k++) {
          /*
           * For each field that this query term is scoped by (by default
           * all fields are in scope) we need to get all the document refs
           * that have this term in that field.
           *
           * The posting is the entry in the invertedIndex for the matching
           * term from above.
           */
          var field = clause.fields[k],
              fieldPosting = posting[field],
              matchingDocumentRefs = Object.keys(fieldPosting),
              termField = expandedTerm + "/" + field,
              matchingDocumentsSet = new lunr.Set(matchingDocumentRefs)

          /*
           * if the presence of this term is required ensure that the matching
           * documents are added to the set of required matches for this clause.
           *
           */
          if (clause.presence == lunr.Query.presence.REQUIRED) {
            clauseMatches = clauseMatches.union(matchingDocumentsSet)

            if (requiredMatches[field] === undefined) {
              requiredMatches[field] = lunr.Set.complete
            }
          }

          /*
           * if the presence of this term is prohibited ensure that the matching
           * documents are added to the set of prohibited matches for this field,
           * creating that set if it does not yet exist.
           */
          if (clause.presence == lunr.Query.presence.PROHIBITED) {
            if (prohibitedMatches[field] === undefined) {
              prohibitedMatches[field] = lunr.Set.empty
            }

            prohibitedMatches[field] = prohibitedMatches[field].union(matchingDocumentsSet)

            /*
             * Prohibited matches should not be part of the query vector used for
             * similarity scoring and no metadata should be extracted so we continue
             * to the next field
             */
            continue
          }

          /*
           * The query field vector is populated using the termIndex found for
           * the term and a unit value with the appropriate boost applied.
           * Using upsert because there could already be an entry in the vector
           * for the term we are working with. In that case we just add the scores
           * together.
           */
          queryVectors[field].upsert(termIndex, clause.boost, function (a, b) { return a + b })

          /**
           * If we've already seen this term, field combo then we've already collected
           * the matching documents and metadata, no need to go through all that again
           */
          if (termFieldCache[termField]) {
            continue
          }

          for (var l = 0; l < matchingDocumentRefs.length; l++) {
            /*
             * All metadata for this term/field/document triple
             * are then extracted and collected into an instance
             * of lunr.MatchData ready to be returned in the query
             * results
             */
            var matchingDocumentRef = matchingDocumentRefs[l],
                matchingFieldRef = new lunr.FieldRef (matchingDocumentRef, field),
                metadata = fieldPosting[matchingDocumentRef],
                fieldMatch

            if ((fieldMatch = matchingFields[matchingFieldRef]) === undefined) {
              matchingFields[matchingFieldRef] = new lunr.MatchData (expandedTerm, field, metadata)
            } else {
              fieldMatch.add(expandedTerm, field, metadata)
            }

          }

          termFieldCache[termField] = true
        }
      }
    }

    /**
     * If the presence was required we need to update the requiredMatches field sets.
     * We do this after all fields for the term have collected their matches because
     * the clause terms presence is required in _any_ of the fields not _all_ of the
     * fields.
     */
    if (clause.presence === lunr.Query.presence.REQUIRED) {
      for (var k = 0; k < clause.fields.length; k++) {
        var field = clause.fields[k]
        requiredMatches[field] = requiredMatches[field].intersect(clauseMatches)
      }
    }
  }

  /**
   * Need to combine the field scoped required and prohibited
   * matching documents into a global set of required and prohibited
   * matches
   */
  var allRequiredMatches = lunr.Set.complete,
      allProhibitedMatches = lunr.Set.empty

  for (var i = 0; i < this.fields.length; i++) {
    var field = this.fields[i]

    if (requiredMatches[field]) {
      allRequiredMatches = allRequiredMatches.intersect(requiredMatches[field])
    }

    if (prohibitedMatches[field]) {
      allProhibitedMatches = allProhibitedMatches.union(prohibitedMatches[field])
    }
  }

  var matchingFieldRefs = Object.keys(matchingFields),
      results = [],
      matches = Object.create(null)

  /*
   * If the query is negated (contains only prohibited terms)
   * we need to get _all_ fieldRefs currently existing in the
   * index. This is only done when we know that the query is
   * entirely prohibited terms to avoid any cost of getting all
   * fieldRefs unnecessarily.
   *
   * Additionally, blank MatchData must be created to correctly
   * populate the results.
   */
  if (query.isNegated()) {
    matchingFieldRefs = Object.keys(this.fieldVectors)

    for (var i = 0; i < matchingFieldRefs.length; i++) {
      var matchingFieldRef = matchingFieldRefs[i]
      var fieldRef = lunr.FieldRef.fromString(matchingFieldRef)
      matchingFields[matchingFieldRef] = new lunr.MatchData
    }
  }

  for (var i = 0; i < matchingFieldRefs.length; i++) {
    /*
     * Currently we have document fields that match the query, but we
     * need to return documents. The matchData and scores are combined
     * from multiple fields belonging to the same document.
     *
     * Scores are calculated by field, using the query vectors created
     * above, and combined into a final document score using addition.
     */
    var fieldRef = lunr.FieldRef.fromString(matchingFieldRefs[i]),
        docRef = fieldRef.docRef

    if (!allRequiredMatches.contains(docRef)) {
      continue
    }

    if (allProhibitedMatches.contains(docRef)) {
      continue
    }

    var fieldVector = this.fieldVectors[fieldRef],
        score = queryVectors[fieldRef.fieldName].similarity(fieldVector),
        docMatch

    if ((docMatch = matches[docRef]) !== undefined) {
      docMatch.score += score
      docMatch.matchData.combine(matchingFields[fieldRef])
    } else {
      var match = {
        ref: docRef,
        score: score,
        matchData: matchingFields[fieldRef]
      }
      matches[docRef] = match
      results.push(match)
    }
  }

  /*
   * Sort the results objects by score, highest first.
   */
  return results.sort(function (a, b) {
    return b.score - a.score
  })
}

/**
 * Prepares the index for JSON serialization.
 *
 * The schema for this JSON blob will be described in a
 * separate JSON schema file.
 *
 * @returns {Object}
 */
lunr.Index.prototype.toJSON = function () {
  var invertedIndex = Object.keys(this.invertedIndex)
    .sort()
    .map(function (term) {
      return [term, this.invertedIndex[term]]
    }, this)

  var fieldVectors = Object.keys(this.fieldVectors)
    .map(function (ref) {
      return [ref, this.fieldVectors[ref].toJSON()]
    }, this)

  return {
    version: lunr.version,
    fields: this.fields,
    fieldVectors: fieldVectors,
    invertedIndex: invertedIndex,
    pipeline: this.pipeline.toJSON()
  }
}

/**
 * Loads a previously serialized lunr.Index
 *
 * @param {Object} serializedIndex - A previously serialized lunr.Index
 * @returns {lunr.Index}
 */
lunr.Index.load = function (serializedIndex) {
  var attrs = {},
      fieldVectors = {},
      serializedVectors = serializedIndex.fieldVectors,
      invertedIndex = Object.create(null),
      serializedInvertedIndex = serializedIndex.invertedIndex,
      tokenSetBuilder = new lunr.TokenSet.Builder,
      pipeline = lunr.Pipeline.load(serializedIndex.pipeline)

  if (serializedIndex.version != lunr.version) {
    lunr.utils.warn("Version mismatch when loading serialised index. Current version of lunr '" + lunr.version + "' does not match serialized index '" + serializedIndex.version + "'")
  }

  for (var i = 0; i < serializedVectors.length; i++) {
    var tuple = serializedVectors[i],
        ref = tuple[0],
        elements = tuple[1]

    fieldVectors[ref] = new lunr.Vector(elements)
  }

  for (var i = 0; i < serializedInvertedIndex.length; i++) {
    var tuple = serializedInvertedIndex[i],
        term = tuple[0],
        posting = tuple[1]

    tokenSetBuilder.insert(term)
    invertedIndex[term] = posting
  }

  tokenSetBuilder.finish()

  attrs.fields = serializedIndex.fields

  attrs.fieldVectors = fieldVectors
  attrs.invertedIndex = invertedIndex
  attrs.tokenSet = tokenSetBuilder.root
  attrs.pipeline = pipeline

  return new lunr.Index(attrs)
}
/*!
 * lunr.Builder
 * Copyright (C) 2019 Oliver Nightingale
 */

/**
 * lunr.Builder performs indexing on a set of documents and
 * returns instances of lunr.Index ready for querying.
 *
 * All configuration of the index is done via the builder, the
 * fields to index, the document reference, the text processing
 * pipeline and document scoring parameters are all set on the
 * builder before indexing.
 *
 * @constructor
 * @property {string} _ref - Internal reference to the document reference field.
 * @property {string[]} _fields - Internal reference to the document fields to index.
 * @property {object} invertedIndex - The inverted index maps terms to document fields.
 * @property {object} documentTermFrequencies - Keeps track of document term frequencies.
 * @property {object} documentLengths - Keeps track of the length of documents added to the index.
 * @property {lunr.tokenizer} tokenizer - Function for splitting strings into tokens for indexing.
 * @property {lunr.Pipeline} pipeline - The pipeline performs text processing on tokens before indexing.
 * @property {lunr.Pipeline} searchPipeline - A pipeline for processing search terms before querying the index.
 * @property {number} documentCount - Keeps track of the total number of documents indexed.
 * @property {number} _b - A parameter to control field length normalization, setting this to 0 disabled normalization, 1 fully normalizes field lengths, the default value is 0.75.
 * @property {number} _k1 - A parameter to control how quickly an increase in term frequency results in term frequency saturation, the default value is 1.2.
 * @property {number} termIndex - A counter incremented for each unique term, used to identify a terms position in the vector space.
 * @property {array} metadataWhitelist - A list of metadata keys that have been whitelisted for entry in the index.
 */
lunr.Builder = function () {
  this._ref = "id"
  this._fields = Object.create(null)
  this._documents = Object.create(null)
  this.invertedIndex = Object.create(null)
  this.fieldTermFrequencies = {}
  this.fieldLengths = {}
  this.tokenizer = lunr.tokenizer
  this.pipeline = new lunr.Pipeline
  this.searchPipeline = new lunr.Pipeline
  this.documentCount = 0
  this._b = 0.75
  this._k1 = 1.2
  this.termIndex = 0
  this.metadataWhitelist = []
}

/**
 * Sets the document field used as the document reference. Every document must have this field.
 * The type of this field in the document should be a string, if it is not a string it will be
 * coerced into a string by calling toString.
 *
 * The default ref is 'id'.
 *
 * The ref should _not_ be changed during indexing, it should be set before any documents are
 * added to the index. Changing it during indexing can lead to inconsistent results.
 *
 * @param {string} ref - The name of the reference field in the document.
 */
lunr.Builder.prototype.ref = function (ref) {
  this._ref = ref
}

/**
 * A function that is used to extract a field from a document.
 *
 * Lunr expects a field to be at the top level of a document, if however the field
 * is deeply nested within a document an extractor function can be used to extract
 * the right field for indexing.
 *
 * @callback fieldExtractor
 * @param {object} doc - The document being added to the index.
 * @returns {?(string|object|object[])} obj - The object that will be indexed for this field.
 * @example <caption>Extracting a nested field</caption>
 * function (doc) { return doc.nested.field }
 */

/**
 * Adds a field to the list of document fields that will be indexed. Every document being
 * indexed should have this field. Null values for this field in indexed documents will
 * not cause errors but will limit the chance of that document being retrieved by searches.
 *
 * All fields should be added before adding documents to the index. Adding fields after
 * a document has been indexed will have no effect on already indexed documents.
 *
 * Fields can be boosted at build time. This allows terms within that field to have more
 * importance when ranking search results. Use a field boost to specify that matches within
 * one field are more important than other fields.
 *
 * @param {string} fieldName - The name of a field to index in all documents.
 * @param {object} attributes - Optional attributes associated with this field.
 * @param {number} [attributes.boost=1] - Boost applied to all terms within this field.
 * @param {fieldExtractor} [attributes.extractor] - Function to extract a field from a document.
 * @throws {RangeError} fieldName cannot contain unsupported characters '/'
 */
lunr.Builder.prototype.field = function (fieldName, attributes) {
  if (/\//.test(fieldName)) {
    throw new RangeError ("Field '" + fieldName + "' contains illegal character '/'")
  }

  this._fields[fieldName] = attributes || {}
}

/**
 * A parameter to tune the amount of field length normalisation that is applied when
 * calculating relevance scores. A value of 0 will completely disable any normalisation
 * and a value of 1 will fully normalise field lengths. The default is 0.75. Values of b
 * will be clamped to the range 0 - 1.
 *
 * @param {number} number - The value to set for this tuning parameter.
 */
lunr.Builder.prototype.b = function (number) {
  if (number < 0) {
    this._b = 0
  } else if (number > 1) {
    this._b = 1
  } else {
    this._b = number
  }
}

/**
 * A parameter that controls the speed at which a rise in term frequency results in term
 * frequency saturation. The default value is 1.2. Setting this to a higher value will give
 * slower saturation levels, a lower value will result in quicker saturation.
 *
 * @param {number} number - The value to set for this tuning parameter.
 */
lunr.Builder.prototype.k1 = function (number) {
  this._k1 = number
}

/**
 * Adds a document to the index.
 *
 * Before adding fields to the index the index should have been fully setup, with the document
 * ref and all fields to index already having been specified.
 *
 * The document must have a field name as specified by the ref (by default this is 'id') and
 * it should have all fields defined for indexing, though null or undefined values will not
 * cause errors.
 *
 * Entire documents can be boosted at build time. Applying a boost to a document indicates that
 * this document should rank higher in search results than other documents.
 *
 * @param {object} doc - The document to add to the index.
 * @param {object} attributes - Optional attributes associated with this document.
 * @param {number} [attributes.boost=1] - Boost applied to all terms within this document.
 */
lunr.Builder.prototype.add = function (doc, attributes) {
  var docRef = doc[this._ref],
      fields = Object.keys(this._fields)

  this._documents[docRef] = attributes || {}
  this.documentCount += 1

  for (var i = 0; i < fields.length; i++) {
    var fieldName = fields[i],
        extractor = this._fields[fieldName].extractor,
        field = extractor ? extractor(doc) : doc[fieldName],
        tokens = this.tokenizer(field, {
          fields: [fieldName]
        }),
        terms = this.pipeline.run(tokens),
        fieldRef = new lunr.FieldRef (docRef, fieldName),
        fieldTerms = Object.create(null)

    this.fieldTermFrequencies[fieldRef] = fieldTerms
    this.fieldLengths[fieldRef] = 0

    // store the length of this field for this document
    this.fieldLengths[fieldRef] += terms.length

    // calculate term frequencies for this field
    for (var j = 0; j < terms.length; j++) {
      var term = terms[j]

      if (fieldTerms[term] == undefined) {
        fieldTerms[term] = 0
      }

      fieldTerms[term] += 1

      // add to inverted index
      // create an initial posting if one doesn't exist
      if (this.invertedIndex[term] == undefined) {
        var posting = Object.create(null)
        posting["_index"] = this.termIndex
        this.termIndex += 1

        for (var k = 0; k < fields.length; k++) {
          posting[fields[k]] = Object.create(null)
        }

        this.invertedIndex[term] = posting
      }

      // add an entry for this term/fieldName/docRef to the invertedIndex
      if (this.invertedIndex[term][fieldName][docRef] == undefined) {
        this.invertedIndex[term][fieldName][docRef] = Object.create(null)
      }

      // store all whitelisted metadata about this token in the
      // inverted index
      for (var l = 0; l < this.metadataWhitelist.length; l++) {
        var metadataKey = this.metadataWhitelist[l],
            metadata = term.metadata[metadataKey]

        if (this.invertedIndex[term][fieldName][docRef][metadataKey] == undefined) {
          this.invertedIndex[term][fieldName][docRef][metadataKey] = []
        }

        this.invertedIndex[term][fieldName][docRef][metadataKey].push(metadata)
      }
    }

  }
}

/**
 * Calculates the average document length for this index
 *
 * @private
 */
lunr.Builder.prototype.calculateAverageFieldLengths = function () {

  var fieldRefs = Object.keys(this.fieldLengths),
      numberOfFields = fieldRefs.length,
      accumulator = {},
      documentsWithField = {}

  for (var i = 0; i < numberOfFields; i++) {
    var fieldRef = lunr.FieldRef.fromString(fieldRefs[i]),
        field = fieldRef.fieldName

    documentsWithField[field] || (documentsWithField[field] = 0)
    documentsWithField[field] += 1

    accumulator[field] || (accumulator[field] = 0)
    accumulator[field] += this.fieldLengths[fieldRef]
  }

  var fields = Object.keys(this._fields)

  for (var i = 0; i < fields.length; i++) {
    var fieldName = fields[i]
    accumulator[fieldName] = accumulator[fieldName] / documentsWithField[fieldName]
  }

  this.averageFieldLength = accumulator
}

/**
 * Builds a vector space model of every document using lunr.Vector
 *
 * @private
 */
lunr.Builder.prototype.createFieldVectors = function () {
  var fieldVectors = {},
      fieldRefs = Object.keys(this.fieldTermFrequencies),
      fieldRefsLength = fieldRefs.length,
      termIdfCache = Object.create(null)

  for (var i = 0; i < fieldRefsLength; i++) {
    var fieldRef = lunr.FieldRef.fromString(fieldRefs[i]),
        fieldName = fieldRef.fieldName,
        fieldLength = this.fieldLengths[fieldRef],
        fieldVector = new lunr.Vector,
        termFrequencies = this.fieldTermFrequencies[fieldRef],
        terms = Object.keys(termFrequencies),
        termsLength = terms.length


    var fieldBoost = this._fields[fieldName].boost || 1,
        docBoost = this._documents[fieldRef.docRef].boost || 1

    for (var j = 0; j < termsLength; j++) {
      var term = terms[j],
          tf = termFrequencies[term],
          termIndex = this.invertedIndex[term]._index,
          idf, score, scoreWithPrecision

      if (termIdfCache[term] === undefined) {
        idf = lunr.idf(this.invertedIndex[term], this.documentCount)
        termIdfCache[term] = idf
      } else {
        idf = termIdfCache[term]
      }

      score = idf * ((this._k1 + 1) * tf) / (this._k1 * (1 - this._b + this._b * (fieldLength / this.averageFieldLength[fieldName])) + tf)
      score *= fieldBoost
      score *= docBoost
      scoreWithPrecision = Math.round(score * 1000) / 1000
      // Converts 1.23456789 to 1.234.
      // Reducing the precision so that the vectors take up less
      // space when serialised. Doing it now so that they behave
      // the same before and after serialisation. Also, this is
      // the fastest approach to reducing a number's precision in
      // JavaScript.

      fieldVector.insert(termIndex, scoreWithPrecision)
    }

    fieldVectors[fieldRef] = fieldVector
  }

  this.fieldVectors = fieldVectors
}

/**
 * Creates a token set of all tokens in the index using lunr.TokenSet
 *
 * @private
 */
lunr.Builder.prototype.createTokenSet = function () {
  this.tokenSet = lunr.TokenSet.fromArray(
    Object.keys(this.invertedIndex).sort()
  )
}

/**
 * Builds the index, creating an instance of lunr.Index.
 *
 * This completes the indexing process and should only be called
 * once all documents have been added to the index.
 *
 * @returns {lunr.Index}
 */
lunr.Builder.prototype.build = function () {
  this.calculateAverageFieldLengths()
  this.createFieldVectors()
  this.createTokenSet()

  return new lunr.Index({
    invertedIndex: this.invertedIndex,
    fieldVectors: this.fieldVectors,
    tokenSet: this.tokenSet,
    fields: Object.keys(this._fields),
    pipeline: this.searchPipeline
  })
}

/**
 * Applies a plugin to the index builder.
 *
 * A plugin is a function that is called with the index builder as its context.
 * Plugins can be used to customise or extend the behaviour of the index
 * in some way. A plugin is just a function, that encapsulated the custom
 * behaviour that should be applied when building the index.
 *
 * The plugin function will be called with the index builder as its argument, additional
 * arguments can also be passed when calling use. The function will be called
 * with the index builder as its context.
 *
 * @param {Function} plugin The plugin to apply.
 */
lunr.Builder.prototype.use = function (fn) {
  var args = Array.prototype.slice.call(arguments, 1)
  args.unshift(this)
  fn.apply(this, args)
}
/**
 * Contains and collects metadata about a matching document.
 * A single instance of lunr.MatchData is returned as part of every
 * lunr.Index~Result.
 *
 * @constructor
 * @param {string} term - The term this match data is associated with
 * @param {string} field - The field in which the term was found
 * @param {object} metadata - The metadata recorded about this term in this field
 * @property {object} metadata - A cloned collection of metadata associated with this document.
 * @see {@link lunr.Index~Result}
 */
lunr.MatchData = function (term, field, metadata) {
  var clonedMetadata = Object.create(null),
      metadataKeys = Object.keys(metadata || {})

  // Cloning the metadata to prevent the original
  // being mutated during match data combination.
  // Metadata is kept in an array within the inverted
  // index so cloning the data can be done with
  // Array#slice
  for (var i = 0; i < metadataKeys.length; i++) {
    var key = metadataKeys[i]
    clonedMetadata[key] = metadata[key].slice()
  }

  this.metadata = Object.create(null)

  if (term !== undefined) {
    this.metadata[term] = Object.create(null)
    this.metadata[term][field] = clonedMetadata
  }
}

/**
 * An instance of lunr.MatchData will be created for every term that matches a
 * document. However only one instance is required in a lunr.Index~Result. This
 * method combines metadata from another instance of lunr.MatchData with this
 * objects metadata.
 *
 * @param {lunr.MatchData} otherMatchData - Another instance of match data to merge with this one.
 * @see {@link lunr.Index~Result}
 */
lunr.MatchData.prototype.combine = function (otherMatchData) {
  var terms = Object.keys(otherMatchData.metadata)

  for (var i = 0; i < terms.length; i++) {
    var term = terms[i],
        fields = Object.keys(otherMatchData.metadata[term])

    if (this.metadata[term] == undefined) {
      this.metadata[term] = Object.create(null)
    }

    for (var j = 0; j < fields.length; j++) {
      var field = fields[j],
          keys = Object.keys(otherMatchData.metadata[term][field])

      if (this.metadata[term][field] == undefined) {
        this.metadata[term][field] = Object.create(null)
      }

      for (var k = 0; k < keys.length; k++) {
        var key = keys[k]

        if (this.metadata[term][field][key] == undefined) {
          this.metadata[term][field][key] = otherMatchData.metadata[term][field][key]
        } else {
          this.metadata[term][field][key] = this.metadata[term][field][key].concat(otherMatchData.metadata[term][field][key])
        }

      }
    }
  }
}

/**
 * Add metadata for a term/field pair to this instance of match data.
 *
 * @param {string} term - The term this match data is associated with
 * @param {string} field - The field in which the term was found
 * @param {object} metadata - The metadata recorded about this term in this field
 */
lunr.MatchData.prototype.add = function (term, field, metadata) {
  if (!(term in this.metadata)) {
    this.metadata[term] = Object.create(null)
    this.metadata[term][field] = metadata
    return
  }

  if (!(field in this.metadata[term])) {
    this.metadata[term][field] = metadata
    return
  }

  var metadataKeys = Object.keys(metadata)

  for (var i = 0; i < metadataKeys.length; i++) {
    var key = metadataKeys[i]

    if (key in this.metadata[term][field]) {
      this.metadata[term][field][key] = this.metadata[term][field][key].concat(metadata[key])
    } else {
      this.metadata[term][field][key] = metadata[key]
    }
  }
}
/**
 * A lunr.Query provides a programmatic way of defining queries to be performed
 * against a {@link lunr.Index}.
 *
 * Prefer constructing a lunr.Query using the {@link lunr.Index#query} method
 * so the query object is pre-initialized with the right index fields.
 *
 * @constructor
 * @property {lunr.Query~Clause[]} clauses - An array of query clauses.
 * @property {string[]} allFields - An array of all available fields in a lunr.Index.
 */
lunr.Query = function (allFields) {
  this.clauses = []
  this.allFields = allFields
}

/**
 * Constants for indicating what kind of automatic wildcard insertion will be used when constructing a query clause.
 *
 * This allows wildcards to be added to the beginning and end of a term without having to manually do any string
 * concatenation.
 *
 * The wildcard constants can be bitwise combined to select both leading and trailing wildcards.
 *
 * @constant
 * @default
 * @property {number} wildcard.NONE - The term will have no wildcards inserted, this is the default behaviour
 * @property {number} wildcard.LEADING - Prepend the term with a wildcard, unless a leading wildcard already exists
 * @property {number} wildcard.TRAILING - Append a wildcard to the term, unless a trailing wildcard already exists
 * @see lunr.Query~Clause
 * @see lunr.Query#clause
 * @see lunr.Query#term
 * @example <caption>query term with trailing wildcard</caption>
 * query.term('foo', { wildcard: lunr.Query.wildcard.TRAILING })
 * @example <caption>query term with leading and trailing wildcard</caption>
 * query.term('foo', {
 *   wildcard: lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING
 * })
 */

lunr.Query.wildcard = new String ("*")
lunr.Query.wildcard.NONE = 0
lunr.Query.wildcard.LEADING = 1
lunr.Query.wildcard.TRAILING = 2

/**
 * Constants for indicating what kind of presence a term must have in matching documents.
 *
 * @constant
 * @enum {number}
 * @see lunr.Query~Clause
 * @see lunr.Query#clause
 * @see lunr.Query#term
 * @example <caption>query term with required presence</caption>
 * query.term('foo', { presence: lunr.Query.presence.REQUIRED })
 */
lunr.Query.presence = {
  /**
   * Term's presence in a document is optional, this is the default value.
   */
  OPTIONAL: 1,

  /**
   * Term's presence in a document is required, documents that do not contain
   * this term will not be returned.
   */
  REQUIRED: 2,

  /**
   * Term's presence in a document is prohibited, documents that do contain
   * this term will not be returned.
   */
  PROHIBITED: 3
}

/**
 * A single clause in a {@link lunr.Query} contains a term and details on how to
 * match that term against a {@link lunr.Index}.
 *
 * @typedef {Object} lunr.Query~Clause
 * @property {string[]} fields - The fields in an index this clause should be matched against.
 * @property {number} [boost=1] - Any boost that should be applied when matching this clause.
 * @property {number} [editDistance] - Whether the term should have fuzzy matching applied, and how fuzzy the match should be.
 * @property {boolean} [usePipeline] - Whether the term should be passed through the search pipeline.
 * @property {number} [wildcard=lunr.Query.wildcard.NONE] - Whether the term should have wildcards appended or prepended.
 * @property {number} [presence=lunr.Query.presence.OPTIONAL] - The terms presence in any matching documents.
 */

/**
 * Adds a {@link lunr.Query~Clause} to this query.
 *
 * Unless the clause contains the fields to be matched all fields will be matched. In addition
 * a default boost of 1 is applied to the clause.
 *
 * @param {lunr.Query~Clause} clause - The clause to add to this query.
 * @see lunr.Query~Clause
 * @returns {lunr.Query}
 */
lunr.Query.prototype.clause = function (clause) {
  if (!('fields' in clause)) {
    clause.fields = this.allFields
  }

  if (!('boost' in clause)) {
    clause.boost = 1
  }

  if (!('usePipeline' in clause)) {
    clause.usePipeline = true
  }

  if (!('wildcard' in clause)) {
    clause.wildcard = lunr.Query.wildcard.NONE
  }

  if ((clause.wildcard & lunr.Query.wildcard.LEADING) && (clause.term.charAt(0) != lunr.Query.wildcard)) {
    clause.term = "*" + clause.term
  }

  if ((clause.wildcard & lunr.Query.wildcard.TRAILING) && (clause.term.slice(-1) != lunr.Query.wildcard)) {
    clause.term = "" + clause.term + "*"
  }

  if (!('presence' in clause)) {
    clause.presence = lunr.Query.presence.OPTIONAL
  }

  this.clauses.push(clause)

  return this
}

/**
 * A negated query is one in which every clause has a presence of
 * prohibited. These queries require some special processing to return
 * the expected results.
 *
 * @returns boolean
 */
lunr.Query.prototype.isNegated = function () {
  for (var i = 0; i < this.clauses.length; i++) {
    if (this.clauses[i].presence != lunr.Query.presence.PROHIBITED) {
      return false
    }
  }

  return true
}

/**
 * Adds a term to the current query, under the covers this will create a {@link lunr.Query~Clause}
 * to the list of clauses that make up this query.
 *
 * The term is used as is, i.e. no tokenization will be performed by this method. Instead conversion
 * to a token or token-like string should be done before calling this method.
 *
 * The term will be converted to a string by calling `toString`. Multiple terms can be passed as an
 * array, each term in the array will share the same options.
 *
 * @param {object|object[]} term - The term(s) to add to the query.
 * @param {object} [options] - Any additional properties to add to the query clause.
 * @returns {lunr.Query}
 * @see lunr.Query#clause
 * @see lunr.Query~Clause
 * @example <caption>adding a single term to a query</caption>
 * query.term("foo")
 * @example <caption>adding a single term to a query and specifying search fields, term boost and automatic trailing wildcard</caption>
 * query.term("foo", {
 *   fields: ["title"],
 *   boost: 10,
 *   wildcard: lunr.Query.wildcard.TRAILING
 * })
 * @example <caption>using lunr.tokenizer to convert a string to tokens before using them as terms</caption>
 * query.term(lunr.tokenizer("foo bar"))
 */
lunr.Query.prototype.term = function (term, options) {
  if (Array.isArray(term)) {
    term.forEach(function (t) { this.term(t, lunr.utils.clone(options)) }, this)
    return this
  }

  var clause = options || {}
  clause.term = term.toString()

  this.clause(clause)

  return this
}
lunr.QueryParseError = function (message, start, end) {
  this.name = "QueryParseError"
  this.message = message
  this.start = start
  this.end = end
}

lunr.QueryParseError.prototype = new Error
lunr.QueryLexer = function (str) {
  this.lexemes = []
  this.str = str
  this.length = str.length
  this.pos = 0
  this.start = 0
  this.escapeCharPositions = []
}

lunr.QueryLexer.prototype.run = function () {
  var state = lunr.QueryLexer.lexText

  while (state) {
    state = state(this)
  }
}

lunr.QueryLexer.prototype.sliceString = function () {
  var subSlices = [],
      sliceStart = this.start,
      sliceEnd = this.pos

  for (var i = 0; i < this.escapeCharPositions.length; i++) {
    sliceEnd = this.escapeCharPositions[i]
    subSlices.push(this.str.slice(sliceStart, sliceEnd))
    sliceStart = sliceEnd + 1
  }

  subSlices.push(this.str.slice(sliceStart, this.pos))
  this.escapeCharPositions.length = 0

  return subSlices.join('')
}

lunr.QueryLexer.prototype.emit = function (type) {
  this.lexemes.push({
    type: type,
    str: this.sliceString(),
    start: this.start,
    end: this.pos
  })

  this.start = this.pos
}

lunr.QueryLexer.prototype.escapeCharacter = function () {
  this.escapeCharPositions.push(this.pos - 1)
  this.pos += 1
}

lunr.QueryLexer.prototype.next = function () {
  if (this.pos >= this.length) {
    return lunr.QueryLexer.EOS
  }

  var char = this.str.charAt(this.pos)
  this.pos += 1
  return char
}

lunr.QueryLexer.prototype.width = function () {
  return this.pos - this.start
}

lunr.QueryLexer.prototype.ignore = function () {
  if (this.start == this.pos) {
    this.pos += 1
  }

  this.start = this.pos
}

lunr.QueryLexer.prototype.backup = function () {
  this.pos -= 1
}

lunr.QueryLexer.prototype.acceptDigitRun = function () {
  var char, charCode

  do {
    char = this.next()
    charCode = char.charCodeAt(0)
  } while (charCode > 47 && charCode < 58)

  if (char != lunr.QueryLexer.EOS) {
    this.backup()
  }
}

lunr.QueryLexer.prototype.more = function () {
  return this.pos < this.length
}

lunr.QueryLexer.EOS = 'EOS'
lunr.QueryLexer.FIELD = 'FIELD'
lunr.QueryLexer.TERM = 'TERM'
lunr.QueryLexer.EDIT_DISTANCE = 'EDIT_DISTANCE'
lunr.QueryLexer.BOOST = 'BOOST'
lunr.QueryLexer.PRESENCE = 'PRESENCE'

lunr.QueryLexer.lexField = function (lexer) {
  lexer.backup()
  lexer.emit(lunr.QueryLexer.FIELD)
  lexer.ignore()
  return lunr.QueryLexer.lexText
}

lunr.QueryLexer.lexTerm = function (lexer) {
  if (lexer.width() > 1) {
    lexer.backup()
    lexer.emit(lunr.QueryLexer.TERM)
  }

  lexer.ignore()

  if (lexer.more()) {
    return lunr.QueryLexer.lexText
  }
}

lunr.QueryLexer.lexEditDistance = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.EDIT_DISTANCE)
  return lunr.QueryLexer.lexText
}

lunr.QueryLexer.lexBoost = function (lexer) {
  lexer.ignore()
  lexer.acceptDigitRun()
  lexer.emit(lunr.QueryLexer.BOOST)
  return lunr.QueryLexer.lexText
}

lunr.QueryLexer.lexEOS = function (lexer) {
  if (lexer.width() > 0) {
    lexer.emit(lunr.QueryLexer.TERM)
  }
}

// This matches the separator used when tokenising fields
// within a document. These should match otherwise it is
// not possible to search for some tokens within a document.
//
// It is possible for the user to change the separator on the
// tokenizer so it _might_ clash with any other of the special
// characters already used within the search string, e.g. :.
//
// This means that it is possible to change the separator in
// such a way that makes some words unsearchable using a search
// string.
lunr.QueryLexer.termSeparator = lunr.tokenizer.separator

lunr.QueryLexer.lexText = function (lexer) {
  while (true) {
    var char = lexer.next()

    if (char == lunr.QueryLexer.EOS) {
      return lunr.QueryLexer.lexEOS
    }

    // Escape character is '\'
    if (char.charCodeAt(0) == 92) {
      lexer.escapeCharacter()
      continue
    }

    if (char == ":") {
      return lunr.QueryLexer.lexField
    }

    if (char == "~") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexEditDistance
    }

    if (char == "^") {
      lexer.backup()
      if (lexer.width() > 0) {
        lexer.emit(lunr.QueryLexer.TERM)
      }
      return lunr.QueryLexer.lexBoost
    }

    // "+" indicates term presence is required
    // checking for length to ensure that only
    // leading "+" are considered
    if (char == "+" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    // "-" indicates term presence is prohibited
    // checking for length to ensure that only
    // leading "-" are considered
    if (char == "-" && lexer.width() === 1) {
      lexer.emit(lunr.QueryLexer.PRESENCE)
      return lunr.QueryLexer.lexText
    }

    if (char.match(lunr.QueryLexer.termSeparator)) {
      return lunr.QueryLexer.lexTerm
    }
  }
}

lunr.QueryParser = function (str, query) {
  this.lexer = new lunr.QueryLexer (str)
  this.query = query
  this.currentClause = {}
  this.lexemeIdx = 0
}

lunr.QueryParser.prototype.parse = function () {
  this.lexer.run()
  this.lexemes = this.lexer.lexemes

  var state = lunr.QueryParser.parseClause

  while (state) {
    state = state(this)
  }

  return this.query
}

lunr.QueryParser.prototype.peekLexeme = function () {
  return this.lexemes[this.lexemeIdx]
}

lunr.QueryParser.prototype.consumeLexeme = function () {
  var lexeme = this.peekLexeme()
  this.lexemeIdx += 1
  return lexeme
}

lunr.QueryParser.prototype.nextClause = function () {
  var completedClause = this.currentClause
  this.query.clause(completedClause)
  this.currentClause = {}
}

lunr.QueryParser.parseClause = function (parser) {
  var lexeme = parser.peekLexeme()

  if (lexeme == undefined) {
    return
  }

  switch (lexeme.type) {
    case lunr.QueryLexer.PRESENCE:
      return lunr.QueryParser.parsePresence
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expected either a field or a term, found " + lexeme.type

      if (lexeme.str.length >= 1) {
        errorMessage += " with value '" + lexeme.str + "'"
      }

      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }
}

lunr.QueryParser.parsePresence = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  switch (lexeme.str) {
    case "-":
      parser.currentClause.presence = lunr.Query.presence.PROHIBITED
      break
    case "+":
      parser.currentClause.presence = lunr.Query.presence.REQUIRED
      break
    default:
      var errorMessage = "unrecognised presence operator'" + lexeme.str + "'"
      throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term or field, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.FIELD:
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term or field, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

lunr.QueryParser.parseField = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  if (parser.query.allFields.indexOf(lexeme.str) == -1) {
    var possibleFields = parser.query.allFields.map(function (f) { return "'" + f + "'" }).join(', '),
        errorMessage = "unrecognised field '" + lexeme.str + "', possible fields: " + possibleFields

    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.fields = [lexeme.str]

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    var errorMessage = "expecting term, found nothing"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      return lunr.QueryParser.parseTerm
    default:
      var errorMessage = "expecting term, found '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

lunr.QueryParser.parseTerm = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  parser.currentClause.term = lexeme.str.toLowerCase()

  if (lexeme.str.indexOf("*") != -1) {
    parser.currentClause.usePipeline = false
  }

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

lunr.QueryParser.parseEditDistance = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var editDistance = parseInt(lexeme.str, 10)

  if (isNaN(editDistance)) {
    var errorMessage = "edit distance must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.editDistance = editDistance

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

lunr.QueryParser.parseBoost = function (parser) {
  var lexeme = parser.consumeLexeme()

  if (lexeme == undefined) {
    return
  }

  var boost = parseInt(lexeme.str, 10)

  if (isNaN(boost)) {
    var errorMessage = "boost must be numeric"
    throw new lunr.QueryParseError (errorMessage, lexeme.start, lexeme.end)
  }

  parser.currentClause.boost = boost

  var nextLexeme = parser.peekLexeme()

  if (nextLexeme == undefined) {
    parser.nextClause()
    return
  }

  switch (nextLexeme.type) {
    case lunr.QueryLexer.TERM:
      parser.nextClause()
      return lunr.QueryParser.parseTerm
    case lunr.QueryLexer.FIELD:
      parser.nextClause()
      return lunr.QueryParser.parseField
    case lunr.QueryLexer.EDIT_DISTANCE:
      return lunr.QueryParser.parseEditDistance
    case lunr.QueryLexer.BOOST:
      return lunr.QueryParser.parseBoost
    case lunr.QueryLexer.PRESENCE:
      parser.nextClause()
      return lunr.QueryParser.parsePresence
    default:
      var errorMessage = "Unexpected lexeme type '" + nextLexeme.type + "'"
      throw new lunr.QueryParseError (errorMessage, nextLexeme.start, nextLexeme.end)
  }
}

  /**
   * export the module via AMD, CommonJS or as a browser global
   * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
   */
  ;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module.
      define(factory)
    } else if (typeof exports === 'object') {
      /**
       * Node. Does not work with strict CommonJS, but
       * only CommonJS-like enviroments that support module.exports,
       * like Node.
       */
      module.exports = factory()
    } else {
      // Browser globals (root is window)
      root.lunr = factory()
    }
  }(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return lunr
  }))
})();

},{}],3:[function(require,module,exports){
//     wink-lemmatizer
//     English lemmatizer
//
//     This file is part of “wink-lemmatizer”.
//
//     Copyright (c) 2017-18  GRAYPE Systems Private Limited
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

// Load adjective/noun/verb exceptions.
const adjectiveExceptions = require( 'wink-lexicon/src/wn-adjective-exceptions.js' );
const nounExceptions = require( 'wink-lexicon/src/wn-noun-exceptions.js' );
const verbExceptions = require( 'wink-lexicon/src/wn-verb-exceptions.js' );
// Load all words (base form),
const words = require( 'wink-lexicon/src/wn-words.js' );
// and their senses.
const senseMap = require( 'wink-lexicon/src/wn-word-senses.js' );
// The name space.
const lemmatize = Object.create( null );

// The following code is an adaptation of [WordNet's Morphy](https://wordnet.princeton.edu/documentation/morphy7wn):

// ### isAdjective
/**
 * Checks the word in base form is an adjective or not using wordnet senses.
 *
 * @private
 * @method isAdjective
 * @param {string} word that needs to be tested for adjective.
 * @return {boolean} `true` if word is a valid adjective otherwise `false.`
 * @example
 * isAdjective( 'lat' );
 * // -> false
*/
var isAdjective = function ( word ) {
  const index = words[ word ];
  if ( index === undefined ) return false;
  const senses = senseMap[ index ];
  for ( let k = 0; k < senses.length; k += 1 ) {
    if ( senses[ k ] < 2 ) return true;
  }
  return false;
}; // isAdjective()

// ### lemmatizeAdjective
/**
 *
 * Conjugates an `adjective` to it's base form (VB). It also has an alias
 * `lemmatizeAdjective` to maintain API level compatibility with previous version.
 *
 * @method adjective
 * @param {string} adjective that needs to be conjugated to base form.
 * @return {string} the base form of `adjective`.
 * @example
 * lemmatize.adjective( 'farthest' );
 * // -> far
*/
lemmatize.adjective = function ( adjective ) {
  var lemma = adjectiveExceptions[ adjective ];
  if ( lemma ) return lemma;
  lemma = adjective.replace( /est$|er$/, '' );
  if ( lemma.length === adjective.length ) return adjective;
  if ( isAdjective( lemma ) ) return lemma;
  lemma += 'e';
  if ( isAdjective( lemma ) ) return lemma;
  return adjective;
}; // adjective()

// ### isVerb
/**
 * Checks the word in base form is a verb or not using wordnet senses.
 *
 * @private
 * @method isVerb
 * @param {string} word that needs to be tested for verb.
 * @return {boolean} `true` if word is a valid verb otherwise `false.`
 * @example
 * isVerb( 'eat' );
 * // -> true
*/
var isVerb = function ( word ) {
  const index = words[ word ];
  if ( index === undefined ) return false;
  const senses = senseMap[ index ];
  for ( let k = 0; k < senses.length; k += 1 ) {
    if ( senses[ k ] > 28 && senses[ k ] < 44  ) return true;
  }
  return false;
}; // isVerb()

// ### lemmatizeVerb
/**
 *
 * Conjugates a `verb` to it's base form (VB). It also has an alias
 * `lemmatizeVerb` to maintain API level compatibility with previous version.
 *
 * @method verb
 * @param {string} verb that needs to be conjugated to base form.
 * @return {string} the base form of `verb`.
 * @example
 * lemmatize.verb( 'winning' );
 * // -> win
*/
lemmatize.verb = function ( verb ) {
  var lemma = verbExceptions[ verb ];
  if ( lemma ) return lemma;

  lemma = verb.replace( /s$/, '' );
  if ( lemma.length !== verb.length && isVerb( lemma ) ) return lemma;

  lemma = verb.replace( /ies$/, 'y' );
  if ( lemma.length !== verb.length && isVerb( lemma ) ) return lemma;

  lemma = verb.replace( /es$|ed$|ing$/, '' );
    if ( lemma.length !== verb.length ) {
    if ( isVerb( lemma ) ) return lemma;
    lemma += 'e';
    if ( isVerb( lemma ) ) return lemma;
  }
  return verb;
}; // verb()

const nounRegexes = [
  { replace: /s$/, by: '' },
  { replace: /ses$/, by: 's' },
  { replace: /xes$/, by: 'x' },
  { replace: /zes$/, by: 's' },
  { replace: /ves$/, by: 'f' },
  { replace: /ches$/, by: 'ch' },
  { replace: /shes$/, by: 'sh' },
  { replace: /men$/, by: 'man' },
  { replace: /ies$/, by: 'y' }
];

// ### isNoun
/**
 * Checks the word in base form is a noun or not using wordnet senses.
 *
 * @private
 * @method isNoun
 * @param {string} word that needs to be tested for noun.
 * @return {boolean} `true` if word is a valid noun otherwise `false.`
 * @example
 * isAdjective( 'house' );
 * // -> true
*/
var isNoun = function ( word ) {
  const index = words[ word ];
  if ( index === undefined ) return false;
  const senses = senseMap[ index ];
  for ( let k = 0; k < senses.length; k += 1 ) {
    if ( senses[ k ] > 2 && senses[ k ] < 29  ) return true;
  }
  return false;
}; // isNoun()

// ### lemmatizeNoun
/**
 *
 * Converts the input `noun` to it's singular form. It also has an alias
 * `lemmatizeNoun` to maintain API level compatibility with previous version.
 *
 * @method noun
 * @param {string} noun that needs to be lemmatized.
 * @return {string} the singular of `noun`.
 * @example
 * lemmatize.noun( 'handkerchieves' );
 * // -> handkerchief
*/
lemmatize.noun = function ( noun ) {
  var lemma = nounExceptions[ noun ];
  if ( lemma ) return lemma;

  lemma = noun;
  for ( let k = 0; k < nounRegexes.length; k += 1 ) {
    lemma = noun.replace( nounRegexes[ k ].replace, nounRegexes[ k ].by );

    if ( lemma.length !== noun.length && isNoun( lemma ) ) return lemma;
  }

  return noun;
}; // noun()

// Create alias to maintain backwards compatibility.
lemmatize.lemmatizeNoun = lemmatize.noun;
lemmatize.lemmatizeVerb = lemmatize.verb;
lemmatize.lemmatizeAdjective = lemmatize.adjective;

module.exports = lemmatize;

},{"wink-lexicon/src/wn-adjective-exceptions.js":4,"wink-lexicon/src/wn-noun-exceptions.js":5,"wink-lexicon/src/wn-verb-exceptions.js":6,"wink-lexicon/src/wn-word-senses.js":7,"wink-lexicon/src/wn-words.js":8}],4:[function(require,module,exports){
//     wink-lexicon
//     English lexicon useful in NLP/NLU
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-lexicon”.
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//
// This data is derived from the WordNet project of Princeton University. The
// Wordnet is copyright by Princeton University. It is sourced from
// http://wordnet.princeton.edu/; the license text can be accessed at
// http://wordnet.princeton.edu/wordnet/license/ URL.
// WordNet License:
// WordNet Release 3.0 This software and database is being provided to you,
// the LICENSEE, by Princeton University under the following license.
// By obtaining, using and/or copying this software and database,
// you agree that you have read, understood, and will comply with these terms
// and conditions.:
// Permission to use, copy, modify and distribute this software and database and
// its documentation for any purpose and without fee or royalty is hereby
// granted, provided that you agree to comply with the following copyright
// notice and statements, including the disclaimer, and that the same appear
// on ALL copies of the software, database and documentation, including
// modifications that you make for internal use or for distribution.
// WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
// THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY
// MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.
// BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON UNIVERSITY MAKES NO
// REPRESENTATIONS OR WARRANTIES OF MERCHANT- ABILITY OR FITNESS FOR ANY
// PARTICULAR PURPOSE OR THAT THE USE OF THE LICENSED SOFTWARE, DATABASE OR
// DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
// TRADEMARKS OR OTHER RIGHTS. The name of Princeton University or Princeton
// may not be used in advertising or publicity pertaining to distribution of
// the software and/or database. Title to copyright in this software, database
// and any associated documentation shall at all times remain with
// Princeton University and LICENSEE agrees to preserve same.

/* eslint max-lines: ["error", {"max": 90000, "skipComments": true}] */
/* eslint-disable camelcase */

const exceptions = Object.create( null );
// Lemma constants.
const acer = 'acer';
const after = 'after';
const airy = 'airy';
const angry = 'angry';
const archer = 'archer';
const arty = 'arty';
const ashy = 'ashy';
const assaulter = 'assaulter';
const attacker = 'attacker';
const backer = 'backer';
const baggy = 'baggy';
const balky = 'balky';
const balmy = 'balmy';
const bandy = 'bandy';
const bargainer = 'bargainer';
const barmy = 'barmy';
const batty = 'batty';
const baulky = 'baulky';
const bawdy = 'bawdy';
const bayer = 'bayer';
const beady = 'beady';
const beastly = 'beastly';
const beater = 'beater';
const beefy = 'beefy';
const beery = 'beery';
const bendy = 'bendy';
const good = 'good';
const big = 'big';
const bitchy = 'bitchy';
const biter = 'biter';
const bitty = 'bitty';
const bleary = 'bleary';
const bloody = 'bloody';
const bloodthirsty = 'bloodthirsty';
const blowy = 'blowy';
const blowsy = 'blowsy';
const blowzy = 'blowzy';
const blue = 'blue';
const boner = 'boner';
const bony = 'bony';
const bonny = 'bonny';
const boozy = 'boozy';
const bosky = 'bosky';
const bossy = 'bossy';
const botchy = 'botchy';
const bother = 'bother';
const bouncy = 'bouncy';
const bounder = 'bounder';
const bower = 'bower';
const brainy = 'brainy';
const brashy = 'brashy';
const brassy = 'brassy';
const brawny = 'brawny';
const breathy = 'breathy';
const breezy = 'breezy';
const briny = 'briny';
const britisher = 'britisher';
const broadcaster = 'broadcaster';
const brooder = 'brooder';
const broody = 'broody';
const bubbly = 'bubbly';
const buggy = 'buggy';
const bulky = 'bulky';
const bumpy = 'bumpy';
const bunchy = 'bunchy';
const burly = 'burly';
const burry = 'burry';
const burster = 'burster';
const bushy = 'bushy';
const busy = 'busy';
const buster = 'buster';
const busty = 'busty';
const cagey = 'cagey';
const camper = 'camper';
const canny = 'canny';
const canter = 'canter';
const canty = 'canty';
const caster = 'caster';
const catchy = 'catchy';
const catty = 'catty';
const cer = 'cer';
const chancy = 'chancy';
const chary = 'chary';
const chatty = 'chatty';
const cheeky = 'cheeky';
const cheery = 'cheery';
const cheesy = 'cheesy';
const chesty = 'chesty';
const chewy = 'chewy';
const chilly = 'chilly';
const chintzy = 'chintzy';
const chippy = 'chippy';
const choosy = 'choosy';
const choppy = 'choppy';
const chubby = 'chubby';
const chuffy = 'chuffy';
const chummy = 'chummy';
const chunky = 'chunky';
const churchy = 'churchy';
const clammy = 'clammy';
const classy = 'classy';
const cleanly = 'cleanly';
const clerkly = 'clerkly';
const cloudy = 'cloudy';
const clubby = 'clubby';
const clumsy = 'clumsy';
const cocky = 'cocky';
const coder = 'coder';
const colly = 'colly';
const comely = 'comely';
const comfy = 'comfy';
const corny = 'corny';
const cosy = 'cosy';
const costly = 'costly';
const costumer = 'costumer';
const counterfeiter = 'counterfeiter';
const courtly = 'courtly';
const cozy = 'cozy';
const crabby = 'crabby';
const cracker = 'cracker';
const crafty = 'crafty';
const craggy = 'craggy';
const cranky = 'cranky';
const crasher = 'crasher';
const crawly = 'crawly';
const crazy = 'crazy';
const creamer = 'creamer';
const creamy = 'creamy';
const creepy = 'creepy';
const crispy = 'crispy';
const crumby = 'crumby';
const crumbly = 'crumbly';
const crummy = 'crummy';
const crusty = 'crusty';
const curly = 'curly';
const customer = 'customer';
const cute = 'cute';
const daffy = 'daffy';
const dainty = 'dainty';
const dandy = 'dandy';
const deadly = 'deadly';
const dealer = 'dealer';
const deserter = 'deserter';
const dewy = 'dewy';
const dicey = 'dicey';
const dimer = 'dimer';
const dim = 'dim';
const dingy = 'dingy';
const dinky = 'dinky';
const dippy = 'dippy';
const dirty = 'dirty';
const dishy = 'dishy';
const dizzy = 'dizzy';
const dodgy = 'dodgy';
const dopey = 'dopey';
const dotty = 'dotty';
const doughy = 'doughy';
const doughty = 'doughty';
const dowdy = 'dowdy';
const dowie = 'dowie';
const downer = 'downer';
const downy = 'downy';
const dozy = 'dozy';
const drab = 'drab';
const drafty = 'drafty';
const draggy = 'draggy';
const draughty = 'draughty';
const dreamy = 'dreamy';
const dreary = 'dreary';
const dreggy = 'dreggy';
const dresser = 'dresser';
const dressy = 'dressy';
const dry = 'dry';
const drippy = 'drippy';
const drowsy = 'drowsy';
const dumpy = 'dumpy';
const dun = 'dun';
const dusky = 'dusky';
const dusty = 'dusty';
const early = 'early';
const earthy = 'earthy';
const earthly = 'earthly';
const easy = 'easy';
const easter = 'easter';
const eastsider = 'eastsider';
const edger = 'edger';
const edgy = 'edgy';
const eerie = 'eerie';
const empty = 'empty';
const faker = 'faker';
const fancy = 'fancy';
const far = 'far';
const fat = 'fat';
const fatty = 'fatty';
const faulty = 'faulty';
const feisty = 'feisty';
const feller = 'feller';
const fiddly = 'fiddly';
const filmy = 'filmy';
const filthy = 'filthy';
const finny = 'finny';
const fishy = 'fishy';
const fit = 'fit';
const flabby = 'flabby';
const flaggy = 'flaggy';
const flaky = 'flaky';
const flasher = 'flasher';
const flashy = 'flashy';
const flat = 'flat';
const flaunty = 'flaunty';
const fledgy = 'fledgy';
const fleecy = 'fleecy';
const fleshy = 'fleshy';
const fleshly = 'fleshly';
const flighty = 'flighty';
const flimsy = 'flimsy';
const flinty = 'flinty';
const floaty = 'floaty';
const floppy = 'floppy';
const flossy = 'flossy';
const fluffy = 'fluffy';
const fluky = 'fluky';
const foamy = 'foamy';
const foggy = 'foggy';
const folder = 'folder';
const folksy = 'folksy';
const foolhardy = 'foolhardy';
const foreigner = 'foreigner';
const forest = 'forest';
const founder = 'founder';
const foxy = 'foxy';
const fratchy = 'fratchy';
const freaky = 'freaky';
const free = 'free';
const frenchy = 'frenchy';
const friendly = 'friendly';
const frisky = 'frisky';
const frizzy = 'frizzy';
const frizzly = 'frizzly';
const frosty = 'frosty';
const frouzy = 'frouzy';
const frowsy = 'frowsy';
const frowzy = 'frowzy';
const fruity = 'fruity';
const funky = 'funky';
const funny = 'funny';
const furry = 'furry';
const fussy = 'fussy';
const fusty = 'fusty';
const fuzzy = 'fuzzy';
const gabby = 'gabby';
const gamy = 'gamy';
const gammy = 'gammy';
const gassy = 'gassy';
const gaudy = 'gaudy';
const gauzy = 'gauzy';
const gawky = 'gawky';
const ghastly = 'ghastly';
const ghostly = 'ghostly';
const giddy = 'giddy';
const glad = 'glad';
const glassy = 'glassy';
const glib = 'glib';
const gloomy = 'gloomy';
const glossy = 'glossy';
const glum = 'glum';
const godly = 'godly';
const goer = 'goer';
const goner = 'goner';
const goodly = 'goodly';
const goofy = 'goofy';
const gooey = 'gooey';
const goosy = 'goosy';
const gory = 'gory';
const gradely = 'gradely';
const grader = 'grader';
const grainy = 'grainy';
const grassy = 'grassy';
const greasy = 'greasy';
const greedy = 'greedy';
const grim = 'grim';
const grisly = 'grisly';
const gritty = 'gritty';
const grizzly = 'grizzly';
const groggy = 'groggy';
const groovy = 'groovy';
const grotty = 'grotty';
const grounder = 'grounder';
const grouper = 'grouper';
const grouty = 'grouty';
const grubby = 'grubby';
const grumpy = 'grumpy';
const guest = 'guest';
const guilty = 'guilty';
const gummy = 'gummy';
const gushy = 'gushy';
const gusty = 'gusty';
const gutsy = 'gutsy';
const hairy = 'hairy';
const halfway = 'halfway';
const halter = 'halter';
const hammy = 'hammy';
const handy = 'handy';
const happy = 'happy';
const hardy = 'hardy';
const hasty = 'hasty';
const haughty = 'haughty';
const hazy = 'hazy';
const header = 'header';
const heady = 'heady';
const healthy = 'healthy';
const hearty = 'hearty';
const heavy = 'heavy';
const hefty = 'hefty';
const hep = 'hep';
const herby = 'herby';
const hind = 'hind';
const hip = 'hip';
const hippy = 'hippy';
const hoary = 'hoary';
const holy = 'holy';
const homely = 'homely';
const homer = 'homer';
const homey = 'homey';
const horny = 'horny';
const horsy = 'horsy';
const hot = 'hot';
const humpy = 'humpy';
const hunger = 'hunger';
const hungry = 'hungry';
const husky = 'husky';
const icy = 'icy';
const inky = 'inky';
const insider = 'insider';
const interest = 'interest';
const jaggy = 'jaggy';
const jammy = 'jammy';
const jaunty = 'jaunty';
const jazzy = 'jazzy';
const jerky = 'jerky';
const jointer = 'jointer';
const jolly = 'jolly';
const juicy = 'juicy';
const jumpy = 'jumpy';
const kindly = 'kindly';
const kinky = 'kinky';
const knotty = 'knotty';
const knurly = 'knurly';
const kooky = 'kooky';
const lacy = 'lacy';
const lairy = 'lairy';
const laky = 'laky';
const lander = 'lander';
const lanky = 'lanky';
const lathy = 'lathy';
const layer = 'layer';
const lazy = 'lazy';
const leafy = 'leafy';
const leaky = 'leaky';
const leary = 'leary';
const leer = 'leer';
const leery = 'leery';
const leggy = 'leggy';
const lengthy = 'lengthy';
const ler = 'ler';
const leveler = 'leveler';
const limy = 'limy';
const lippy = 'lippy';
const liter = 'liter';
const lively = 'lively';
const liver = 'liver';
const loather = 'loather';
const lofty = 'lofty';
const logy = 'logy';
const lonely = 'lonely';
const loner = 'loner';
const loony = 'loony';
const loopy = 'loopy';
const lordly = 'lordly';
const lousy = 'lousy';
const lovely = 'lovely';
const lowlander = 'lowlander';
const lowly = 'lowly';
const lucky = 'lucky';
const lumpy = 'lumpy';
const luny = 'luny';
const lusty = 'lusty';
const mad = 'mad';
const mainer = 'mainer';
const maligner = 'maligner';
const malty = 'malty';
const mangy = 'mangy';
const manky = 'manky';
const manly = 'manly';
const mariner = 'mariner';
const marshy = 'marshy';
const massy = 'massy';
const matter = 'matter';
const maungy = 'maungy';
const mazy = 'mazy';
const mealy = 'mealy';
const measly = 'measly';
const meaty = 'meaty';
const meeter = 'meeter';
const merry = 'merry';
const messy = 'messy';
const miffy = 'miffy';
const mighty = 'mighty';
const milcher = 'milcher';
const milker = 'milker';
const milky = 'milky';
const mingy = 'mingy';
const minter = 'minter';
const mirky = 'mirky';
const miser = 'miser';
const misty = 'misty';
const mocker = 'mocker';
const modeler = 'modeler';
const modest = 'modest';
const moldy = 'moldy';
const moody = 'moody';
const moony = 'moony';
const mothy = 'mothy';
const mouldy = 'mouldy';
const mousy = 'mousy';
const mouthy = 'mouthy';
const mucky = 'mucky';
const muddy = 'muddy';
const muggy = 'muggy';
const multiplexer = 'multiplexer';
const murky = 'murky';
const mushy = 'mushy';
const musky = 'musky';
const muster = 'muster';
const musty = 'musty';
const muzzy = 'muzzy';
const nappy = 'nappy';
const nasty = 'nasty';
const natty = 'natty';
const naughty = 'naughty';
const needy = 'needy';
const nervy = 'nervy';
const newsy = 'newsy';
const nifty = 'nifty';
const nippy = 'nippy';
const nitty = 'nitty';
const noisy = 'noisy';
const northeasterner = 'northeasterner';
const norther = 'norther';
const northerner = 'northerner';
const nosy = 'nosy';
const number = 'number';
const nutty = 'nutty';
const offer = 'offer';
const oily = 'oily';
const oliver = 'oliver';
const oozy = 'oozy';
const opener = 'opener';
const outsider = 'outsider';
const overcomer = 'overcomer';
const overnighter = 'overnighter';
const owner = 'owner';
const pally = 'pally';
const palmy = 'palmy';
const paltry = 'paltry';
const pappy = 'pappy';
const parky = 'parky';
const passer = 'passer';
const paster = 'paster';
const pasty = 'pasty';
const patchy = 'patchy';
const pater = 'pater';
const pawky = 'pawky';
const peachy = 'peachy';
const pearler = 'pearler';
const pearly = 'pearly';
const pedaler = 'pedaler';
const peppy = 'peppy';
const perky = 'perky';
const pesky = 'pesky';
const peter = 'peter';
const petty = 'petty';
const phony = 'phony';
const picky = 'picky';
const piggy = 'piggy';
const piny = 'piny';
const pitchy = 'pitchy';
const pithy = 'pithy';
const planer = 'planer';
const plashy = 'plashy';
const platy = 'platy';
const player = 'player';
const plucky = 'plucky';
const plumber = 'plumber';
const plumy = 'plumy';
const plummy = 'plummy';
const podgy = 'podgy';
const poky = 'poky';
const polisher = 'polisher';
const porky = 'porky';
const porter = 'porter';
const portly = 'portly';
const poster = 'poster';
const potty = 'potty';
const preachy = 'preachy';
const presenter = 'presenter';
const pretender = 'pretender';
const pretty = 'pretty';
const pricy = 'pricy';
const prickly = 'prickly';
const priestly = 'priestly';
const primer = 'primer';
const prim = 'prim';
const princely = 'princely';
const printer = 'printer';
const prissy = 'prissy';
const privateer = 'privateer';
const privy = 'privy';
const prompter = 'prompter';
const prosy = 'prosy';
const pudgy = 'pudgy';
const puffer = 'puffer';
const puffy = 'puffy';
const pulpy = 'pulpy';
const punchy = 'punchy';
const puny = 'puny';
const pushy = 'pushy';
const pussy = 'pussy';
const quaggy = 'quaggy';
const quaky = 'quaky';
const queasy = 'queasy';
const queenly = 'queenly';
const racy = 'racy';
const rainy = 'rainy';
const randy = 'randy';
const rangy = 'rangy';
const ranker = 'ranker';
const ratty = 'ratty';
const rattly = 'rattly';
const raunchy = 'raunchy';
const ready = 'ready';
const recorder = 'recorder';
const red = 'red';
const reedy = 'reedy';
const renter = 'renter';
const retailer = 'retailer';
const rimy = 'rimy';
const risky = 'risky';
const ritzy = 'ritzy';
const roaster = 'roaster';
const rocky = 'rocky';
const roily = 'roily';
const rooky = 'rooky';
const roomy = 'roomy';
const ropy = 'ropy';
const rosy = 'rosy';
const rowdy = 'rowdy';
const ruddy = 'ruddy';
const runny = 'runny';
const rusher = 'rusher';
const rushy = 'rushy';
const rusty = 'rusty';
const rutty = 'rutty';
const sad = 'sad';
const salter = 'salter';
const salty = 'salty';
const sampler = 'sampler';
const sandy = 'sandy';
const sappy = 'sappy';
const sassy = 'sassy';
const saucy = 'saucy';
const savvy = 'savvy';
const scabby = 'scabby';
const scaly = 'scaly';
const scanty = 'scanty';
const scary = 'scary';
const scraggy = 'scraggy';
const scraggly = 'scraggly';
const scraper = 'scraper';
const scrappy = 'scrappy';
const scrawny = 'scrawny';
const screwy = 'screwy';
const scrubby = 'scrubby';
const scruffy = 'scruffy';
const scungy = 'scungy';
const scurvy = 'scurvy';
const seamy = 'seamy';
const seconder = 'seconder';
const seedy = 'seedy';
const seemly = 'seemly';
const serer = 'serer';
const sexy = 'sexy';
const shabby = 'shabby';
const shady = 'shady';
const shaggy = 'shaggy';
const shaky = 'shaky';
const shapely = 'shapely';
const shy = 'shy';
const shifty = 'shifty';
const shiny = 'shiny';
const shirty = 'shirty';
const shoddy = 'shoddy';
const showy = 'showy';
const shrubby = 'shrubby';
const sickly = 'sickly';
const sightly = 'sightly';
const signaler = 'signaler';
const signer = 'signer';
const silky = 'silky';
const silly = 'silly';
const sketchy = 'sketchy';
const skewer = 'skewer';
const skimpy = 'skimpy';
const skinny = 'skinny';
const slaphappy = 'slaphappy';
const slaty = 'slaty';
const slaver = 'slaver';
const sleazy = 'sleazy';
const sleepy = 'sleepy';
const sly = 'sly';
const slimy = 'slimy';
const slim = 'slim';
const slimsy = 'slimsy';
const slinky = 'slinky';
const slippy = 'slippy';
const sloppy = 'sloppy';
const smarmy = 'smarmy';
const smelly = 'smelly';
const smoky = 'smoky';
const smug = 'smug';
const snaky = 'snaky';
const snappy = 'snappy';
const snatchy = 'snatchy';
const snazzy = 'snazzy';
const sneaker = 'sneaker';
const sniffy = 'sniffy';
const snooty = 'snooty';
const snotty = 'snotty';
const snowy = 'snowy';
const snuffer = 'snuffer';
const snuffy = 'snuffy';
const snug = 'snug';
const soapy = 'soapy';
const soggy = 'soggy';
const solder = 'solder';
const sonsy = 'sonsy';
const sooty = 'sooty';
const soppy = 'soppy';
const sorry = 'sorry';
const soupy = 'soupy';
const souther = 'souther';
const southerner = 'southerner';
const speedy = 'speedy';
const spicy = 'spicy';
const spiffy = 'spiffy';
const spiky = 'spiky';
const spindly = 'spindly';
const spiny = 'spiny';
const splashy = 'splashy';
const spongy = 'spongy';
const spooky = 'spooky';
const spoony = 'spoony';
const sporty = 'sporty';
const spotty = 'spotty';
const spreader = 'spreader';
const spry = 'spry';
const sprightly = 'sprightly';
const springer = 'springer';
const springy = 'springy';
const squashy = 'squashy';
const squat = 'squat';
const squatty = 'squatty';
const squiffy = 'squiffy';
const stagy = 'stagy';
const stalky = 'stalky';
const stapler = 'stapler';
const starchy = 'starchy';
const starer = 'starer';
const starest = 'starest';
const starry = 'starry';
const stately = 'stately';
const steady = 'steady';
const stealthy = 'stealthy';
const steamy = 'steamy';
const stingy = 'stingy';
const striper = 'striper';
const stocker = 'stocker';
const stocky = 'stocky';
const stodgy = 'stodgy';
const stony = 'stony';
const stormy = 'stormy';
const streaky = 'streaky';
const streamy = 'streamy';
const stretcher = 'stretcher';
const stretchy = 'stretchy';
const stringy = 'stringy';
const stripy = 'stripy';
const strong = 'strong';
const stroppy = 'stroppy';
const stuffy = 'stuffy';
const stumpy = 'stumpy';
const sturdy = 'sturdy';
const submariner = 'submariner';
const sulky = 'sulky';
const sultry = 'sultry';
const sunny = 'sunny';
const surly = 'surly';
const swagger = 'swagger';
const swanky = 'swanky';
const swarthy = 'swarthy';
const sweaty = 'sweaty';
const tacky = 'tacky';
const talky = 'talky';
const tangy = 'tangy';
const tan = 'tan';
const tardy = 'tardy';
const tasty = 'tasty';
const tatty = 'tatty';
const tawdry = 'tawdry';
const techy = 'techy';
const teenager = 'teenager';
const teeny = 'teeny';
const teetotaler = 'teetotaler';
const tester = 'tester';
const testy = 'testy';
const tetchy = 'tetchy';
const thin = 'thin';
const thirsty = 'thirsty';
const thorny = 'thorny';
const thready = 'thready';
const thrifty = 'thrifty';
const throaty = 'throaty';
const tidy = 'tidy';
const timely = 'timely';
const tiny = 'tiny';
const tinny = 'tinny';
const tipsy = 'tipsy';
const tony = 'tony';
const toothy = 'toothy';
const toper = 'toper';
const touchy = 'touchy';
const trader = 'trader';
const trashy = 'trashy';
const trendy = 'trendy';
const tricky = 'tricky';
const tricksy = 'tricksy';
const trimer = 'trimer';
const trim = 'trim';
const true1 = 'true';
const trusty = 'trusty';
const tubby = 'tubby';
const turfy = 'turfy';
const tweedy = 'tweedy';
const twiggy = 'twiggy';
const ugly = 'ugly';
const unfriendly = 'unfriendly';
const ungainly = 'ungainly';
const ungodly = 'ungodly';
const unhappy = 'unhappy';
const unhealthy = 'unhealthy';
const unholy = 'unholy';
const unruly = 'unruly';
const untidy = 'untidy';
const vasty = 'vasty';
const vest = 'vest';
const viewy = 'viewy';
const wacky = 'wacky';
const wan = 'wan';
const wary = 'wary';
const washy = 'washy';
const waster = 'waster';
const wavy = 'wavy';
const waxy = 'waxy';
const weakly = 'weakly';
const wealthy = 'wealthy';
const weary = 'weary';
const webby = 'webby';
const weedy = 'weedy';
const weeny = 'weeny';
const weensy = 'weensy';
const weepy = 'weepy';
const weighty = 'weighty';
const welsher = 'welsher';
const wet = 'wet';
const whacky = 'whacky';
const whimsy = 'whimsy';
const wholesaler = 'wholesaler';
const wieldy = 'wieldy';
const wily = 'wily';
const windy = 'windy';
const winy = 'winy';
const wintery = 'wintery';
const wintry = 'wintry';
const wiry = 'wiry';
const wispy = 'wispy';
const witty = 'witty';
const wonky = 'wonky';
const woody = 'woody';
const woodsy = 'woodsy';
const woolly = 'woolly';
const woozy = 'woozy';
const wordy = 'wordy';
const worldly = 'worldly';
const wormy = 'wormy';
const bad = 'bad';
const worthy = 'worthy';
const wry = 'wry';
const yare = 'yare';
const yeasty = 'yeasty';
const young = 'young';
const yummy = 'yummy';
const zany = 'zany';
const zippy = 'zippy';

// Adjective to lemma mappings
exceptions.acer = acer;
exceptions.after = after;
exceptions.airier = airy;
exceptions.airiest = airy;
exceptions.angrier = angry;
exceptions.angriest = angry;
exceptions.archer = archer;
exceptions.artier = arty;
exceptions.artiest = arty;
exceptions.ashier = ashy;
exceptions.ashiest = ashy;
exceptions.assaulter = assaulter;
exceptions.attacker = attacker;
exceptions.backer = backer;
exceptions.baggier = baggy;
exceptions.baggiest = baggy;
exceptions.balkier = balky;
exceptions.balkiest = balky;
exceptions.balmier = balmy;
exceptions.balmiest = balmy;
exceptions.bandier = bandy;
exceptions.bandiest = bandy;
exceptions.bargainer = bargainer;
exceptions.barmier = barmy;
exceptions.barmiest = barmy;
exceptions.battier = batty;
exceptions.battiest = batty;
exceptions.baulkier = baulky;
exceptions.baulkiest = baulky;
exceptions.bawdier = bawdy;
exceptions.bawdiest = bawdy;
exceptions.bayer = bayer;
exceptions.beadier = beady;
exceptions.beadiest = beady;
exceptions.beastlier = beastly;
exceptions.beastliest = beastly;
exceptions.beater = beater;
exceptions.beefier = beefy;
exceptions.beefiest = beefy;
exceptions.beerier = beery;
exceptions.beeriest = beery;
exceptions.bendier = bendy;
exceptions.bendiest = bendy;
exceptions.best = good;
exceptions.better = good;
exceptions.bigger = big;
exceptions.biggest = big;
exceptions.bitchier = bitchy;
exceptions.bitchiest = bitchy;
exceptions.biter = biter;
exceptions.bittier = bitty;
exceptions.bittiest = bitty;
exceptions.blearier = bleary;
exceptions.bleariest = bleary;
exceptions.bloodier = bloody;
exceptions.bloodiest = bloody;
exceptions.bloodthirstier = bloodthirsty;
exceptions.bloodthirstiest = bloodthirsty;
exceptions.blowier = blowy;
exceptions.blowiest = blowy;
exceptions.blowsier = blowsy;
exceptions.blowsiest = blowsy;
exceptions.blowzier = blowzy;
exceptions.blowziest = blowzy;
exceptions.bluer = blue;
exceptions.bluest = blue;
exceptions.boner = boner;
exceptions.bonier = bony;
exceptions.boniest = bony;
exceptions.bonnier = bonny;
exceptions.bonniest = bonny;
exceptions.boozier = boozy;
exceptions.booziest = boozy;
exceptions.boskier = bosky;
exceptions.boskiest = bosky;
exceptions.bossier = bossy;
exceptions.bossiest = bossy;
exceptions.botchier = botchy;
exceptions.botchiest = botchy;
exceptions.bother = bother;
exceptions.bouncier = bouncy;
exceptions.bounciest = bouncy;
exceptions.bounder = bounder;
exceptions.bower = bower;
exceptions.brainier = brainy;
exceptions.brainiest = brainy;
exceptions.brashier = brashy;
exceptions.brashiest = brashy;
exceptions.brassier = brassy;
exceptions.brassiest = brassy;
exceptions.brawnier = brawny;
exceptions.brawniest = brawny;
exceptions.breathier = breathy;
exceptions.breathiest = breathy;
exceptions.breezier = breezy;
exceptions.breeziest = breezy;
exceptions.brinier = briny;
exceptions.briniest = briny;
exceptions.britisher = britisher;
exceptions.broadcaster = broadcaster;
exceptions.brooder = brooder;
exceptions.broodier = broody;
exceptions.broodiest = broody;
exceptions.bubblier = bubbly;
exceptions.bubbliest = bubbly;
exceptions.buggier = buggy;
exceptions.buggiest = buggy;
exceptions.bulkier = bulky;
exceptions.bulkiest = bulky;
exceptions.bumpier = bumpy;
exceptions.bumpiest = bumpy;
exceptions.bunchier = bunchy;
exceptions.bunchiest = bunchy;
exceptions.burlier = burly;
exceptions.burliest = burly;
exceptions.burrier = burry;
exceptions.burriest = burry;
exceptions.burster = burster;
exceptions.bushier = bushy;
exceptions.bushiest = bushy;
exceptions.busier = busy;
exceptions.busiest = busy;
exceptions.buster = buster;
exceptions.bustier = busty;
exceptions.bustiest = busty;
exceptions.cagier = cagey;
exceptions.cagiest = cagey;
exceptions.camper = camper;
exceptions.cannier = canny;
exceptions.canniest = canny;
exceptions.canter = canter;
exceptions.cantier = canty;
exceptions.cantiest = canty;
exceptions.caster = caster;
exceptions.catchier = catchy;
exceptions.catchiest = catchy;
exceptions.cattier = catty;
exceptions.cattiest = catty;
exceptions.cer = cer;
exceptions.chancier = chancy;
exceptions.chanciest = chancy;
exceptions.charier = chary;
exceptions.chariest = chary;
exceptions.chattier = chatty;
exceptions.chattiest = chatty;
exceptions.cheekier = cheeky;
exceptions.cheekiest = cheeky;
exceptions.cheerier = cheery;
exceptions.cheeriest = cheery;
exceptions.cheesier = cheesy;
exceptions.cheesiest = cheesy;
exceptions.chestier = chesty;
exceptions.chestiest = chesty;
exceptions.chewier = chewy;
exceptions.chewiest = chewy;
exceptions.chillier = chilly;
exceptions.chilliest = chilly;
exceptions.chintzier = chintzy;
exceptions.chintziest = chintzy;
exceptions.chippier = chippy;
exceptions.chippiest = chippy;
exceptions.choosier = choosy;
exceptions.choosiest = choosy;
exceptions.choppier = choppy;
exceptions.choppiest = choppy;
exceptions.chubbier = chubby;
exceptions.chubbiest = chubby;
exceptions.chuffier = chuffy;
exceptions.chuffiest = chuffy;
exceptions.chummier = chummy;
exceptions.chummiest = chummy;
exceptions.chunkier = chunky;
exceptions.chunkiest = chunky;
exceptions.churchier = churchy;
exceptions.churchiest = churchy;
exceptions.clammier = clammy;
exceptions.clammiest = clammy;
exceptions.classier = classy;
exceptions.classiest = classy;
exceptions.cleanlier = cleanly;
exceptions.cleanliest = cleanly;
exceptions.clerklier = clerkly;
exceptions.clerkliest = clerkly;
exceptions.cloudier = cloudy;
exceptions.cloudiest = cloudy;
exceptions.clubbier = clubby;
exceptions.clubbiest = clubby;
exceptions.clumsier = clumsy;
exceptions.clumsiest = clumsy;
exceptions.cockier = cocky;
exceptions.cockiest = cocky;
exceptions.coder = coder;
exceptions.collier = colly;
exceptions.colliest = colly;
exceptions.comelier = comely;
exceptions.comeliest = comely;
exceptions.comfier = comfy;
exceptions.comfiest = comfy;
exceptions.cornier = corny;
exceptions.corniest = corny;
exceptions.cosier = cosy;
exceptions.cosiest = cosy;
exceptions.costlier = costly;
exceptions.costliest = costly;
exceptions.costumer = costumer;
exceptions.counterfeiter = counterfeiter;
exceptions.courtlier = courtly;
exceptions.courtliest = courtly;
exceptions.cozier = cozy;
exceptions.coziest = cozy;
exceptions.crabbier = crabby;
exceptions.crabbiest = crabby;
exceptions.cracker = cracker;
exceptions.craftier = crafty;
exceptions.craftiest = crafty;
exceptions.craggier = craggy;
exceptions.craggiest = craggy;
exceptions.crankier = cranky;
exceptions.crankiest = cranky;
exceptions.crasher = crasher;
exceptions.crawlier = crawly;
exceptions.crawliest = crawly;
exceptions.crazier = crazy;
exceptions.craziest = crazy;
exceptions.creamer = creamer;
exceptions.creamier = creamy;
exceptions.creamiest = creamy;
exceptions.creepier = creepy;
exceptions.creepiest = creepy;
exceptions.crispier = crispy;
exceptions.crispiest = crispy;
exceptions.crumbier = crumby;
exceptions.crumbiest = crumby;
exceptions.crumblier = crumbly;
exceptions.crumbliest = crumbly;
exceptions.crummier = crummy;
exceptions.crummiest = crummy;
exceptions.crustier = crusty;
exceptions.crustiest = crusty;
exceptions.curlier = curly;
exceptions.curliest = curly;
exceptions.customer = customer;
exceptions.cuter = cute;
exceptions.daffier = daffy;
exceptions.daffiest = daffy;
exceptions.daintier = dainty;
exceptions.daintiest = dainty;
exceptions.dandier = dandy;
exceptions.dandiest = dandy;
exceptions.deadlier = deadly;
exceptions.deadliest = deadly;
exceptions.dealer = dealer;
exceptions.deserter = deserter;
exceptions.dewier = dewy;
exceptions.dewiest = dewy;
exceptions.dicier = dicey;
exceptions.diciest = dicey;
exceptions.dimer = dimer;
exceptions.dimmer = dim;
exceptions.dimmest = dim;
exceptions.dingier = dingy;
exceptions.dingiest = dingy;
exceptions.dinkier = dinky;
exceptions.dinkiest = dinky;
exceptions.dippier = dippy;
exceptions.dippiest = dippy;
exceptions.dirtier = dirty;
exceptions.dirtiest = dirty;
exceptions.dishier = dishy;
exceptions.dishiest = dishy;
exceptions.dizzier = dizzy;
exceptions.dizziest = dizzy;
exceptions.dodgier = dodgy;
exceptions.dodgiest = dodgy;
exceptions.dopier = dopey;
exceptions.dopiest = dopey;
exceptions.dottier = dotty;
exceptions.dottiest = dotty;
exceptions.doughier = doughy;
exceptions.doughiest = doughy;
exceptions.doughtier = doughty;
exceptions.doughtiest = doughty;
exceptions.dowdier = dowdy;
exceptions.dowdiest = dowdy;
exceptions.dowier = dowie;
exceptions.dowiest = dowie;
exceptions.downer = downer;
exceptions.downier = downy;
exceptions.downiest = downy;
exceptions.dozier = dozy;
exceptions.doziest = dozy;
exceptions.drabber = drab;
exceptions.drabbest = drab;
exceptions.draftier = drafty;
exceptions.draftiest = drafty;
exceptions.draggier = draggy;
exceptions.draggiest = draggy;
exceptions.draughtier = draughty;
exceptions.draughtiest = draughty;
exceptions.dreamier = dreamy;
exceptions.dreamiest = dreamy;
exceptions.drearier = dreary;
exceptions.dreariest = dreary;
exceptions.dreggier = dreggy;
exceptions.dreggiest = dreggy;
exceptions.dresser = dresser;
exceptions.dressier = dressy;
exceptions.dressiest = dressy;
exceptions.drier = dry;
exceptions.driest = dry;
exceptions.drippier = drippy;
exceptions.drippiest = drippy;
exceptions.drowsier = drowsy;
exceptions.drowsiest = drowsy;
exceptions.dryer = dry;
exceptions.dryest = dry;
exceptions.dumpier = dumpy;
exceptions.dumpiest = dumpy;
exceptions.dunner = dun;
exceptions.dunnest = dun;
exceptions.duskier = dusky;
exceptions.duskiest = dusky;
exceptions.dustier = dusty;
exceptions.dustiest = dusty;
exceptions.earlier = early;
exceptions.earliest = early;
exceptions.earthier = earthy;
exceptions.earthiest = earthy;
exceptions.earthlier = earthly;
exceptions.earthliest = earthly;
exceptions.easier = easy;
exceptions.easiest = easy;
exceptions.easter = easter;
exceptions.eastsider = eastsider;
exceptions.edger = edger;
exceptions.edgier = edgy;
exceptions.edgiest = edgy;
exceptions.eerier = eerie;
exceptions.eeriest = eerie;
exceptions.emptier = empty;
exceptions.emptiest = empty;
exceptions.faker = faker;
exceptions.fancier = fancy;
exceptions.fanciest = fancy;
exceptions.furthest = far;
exceptions.farthest = far;
exceptions.fatter = fat;
exceptions.fattest = fat;
exceptions.fattier = fatty;
exceptions.fattiest = fatty;
exceptions.faultier = faulty;
exceptions.faultiest = faulty;
exceptions.feistier = feisty;
exceptions.feistiest = feisty;
exceptions.feller = feller;
exceptions.fiddlier = fiddly;
exceptions.fiddliest = fiddly;
exceptions.filmier = filmy;
exceptions.filmiest = filmy;
exceptions.filthier = filthy;
exceptions.filthiest = filthy;
exceptions.finnier = finny;
exceptions.finniest = finny;
exceptions.fishier = fishy;
exceptions.fishiest = fishy;
exceptions.fitter = fit;
exceptions.fittest = fit;
exceptions.flabbier = flabby;
exceptions.flabbiest = flabby;
exceptions.flaggier = flaggy;
exceptions.flaggiest = flaggy;
exceptions.flakier = flaky;
exceptions.flakiest = flaky;
exceptions.flasher = flasher;
exceptions.flashier = flashy;
exceptions.flashiest = flashy;
exceptions.flatter = flat;
exceptions.flattest = flat;
exceptions.flauntier = flaunty;
exceptions.flauntiest = flaunty;
exceptions.fledgier = fledgy;
exceptions.fledgiest = fledgy;
exceptions.fleecier = fleecy;
exceptions.fleeciest = fleecy;
exceptions.fleshier = fleshy;
exceptions.fleshiest = fleshy;
exceptions.fleshlier = fleshly;
exceptions.fleshliest = fleshly;
exceptions.flightier = flighty;
exceptions.flightiest = flighty;
exceptions.flimsier = flimsy;
exceptions.flimsiest = flimsy;
exceptions.flintier = flinty;
exceptions.flintiest = flinty;
exceptions.floatier = floaty;
exceptions.floatiest = floaty;
exceptions.floppier = floppy;
exceptions.floppiest = floppy;
exceptions.flossier = flossy;
exceptions.flossiest = flossy;
exceptions.fluffier = fluffy;
exceptions.fluffiest = fluffy;
exceptions.flukier = fluky;
exceptions.flukiest = fluky;
exceptions.foamier = foamy;
exceptions.foamiest = foamy;
exceptions.foggier = foggy;
exceptions.foggiest = foggy;
exceptions.folder = folder;
exceptions.folksier = folksy;
exceptions.folksiest = folksy;
exceptions.foolhardier = foolhardy;
exceptions.foolhardiest = foolhardy;
exceptions.foreigner = foreigner;
exceptions.forest = forest;
exceptions.founder = founder;
exceptions.foxier = foxy;
exceptions.foxiest = foxy;
exceptions.fratchier = fratchy;
exceptions.fratchiest = fratchy;
exceptions.freakier = freaky;
exceptions.freakiest = freaky;
exceptions.freer = free;
exceptions.freest = free;
exceptions.frenchier = frenchy;
exceptions.frenchiest = frenchy;
exceptions.friendlier = friendly;
exceptions.friendliest = friendly;
exceptions.friskier = frisky;
exceptions.friskiest = frisky;
exceptions.frizzier = frizzy;
exceptions.frizziest = frizzy;
exceptions.frizzlier = frizzly;
exceptions.frizzliest = frizzly;
exceptions.frostier = frosty;
exceptions.frostiest = frosty;
exceptions.frouzier = frouzy;
exceptions.frouziest = frouzy;
exceptions.frowsier = frowsy;
exceptions.frowsiest = frowsy;
exceptions.frowzier = frowzy;
exceptions.frowziest = frowzy;
exceptions.fruitier = fruity;
exceptions.fruitiest = fruity;
exceptions.funkier = funky;
exceptions.funkiest = funky;
exceptions.funnier = funny;
exceptions.funniest = funny;
exceptions.furrier = furry;
exceptions.furriest = furry;
exceptions.fussier = fussy;
exceptions.fussiest = fussy;
exceptions.fustier = fusty;
exceptions.fustiest = fusty;
exceptions.fuzzier = fuzzy;
exceptions.fuzziest = fuzzy;
exceptions.gabbier = gabby;
exceptions.gabbiest = gabby;
exceptions.gamier = gamy;
exceptions.gamiest = gamy;
exceptions.gammier = gammy;
exceptions.gammiest = gammy;
exceptions.gassier = gassy;
exceptions.gassiest = gassy;
exceptions.gaudier = gaudy;
exceptions.gaudiest = gaudy;
exceptions.gauzier = gauzy;
exceptions.gauziest = gauzy;
exceptions.gawkier = gawky;
exceptions.gawkiest = gawky;
exceptions.ghastlier = ghastly;
exceptions.ghastliest = ghastly;
exceptions.ghostlier = ghostly;
exceptions.ghostliest = ghostly;
exceptions.giddier = giddy;
exceptions.giddiest = giddy;
exceptions.gladder = glad;
exceptions.gladdest = glad;
exceptions.glassier = glassy;
exceptions.glassiest = glassy;
exceptions.glibber = glib;
exceptions.glibbest = glib;
exceptions.gloomier = gloomy;
exceptions.gloomiest = gloomy;
exceptions.glossier = glossy;
exceptions.glossiest = glossy;
exceptions.glummer = glum;
exceptions.glummest = glum;
exceptions.godlier = godly;
exceptions.godliest = godly;
exceptions.goer = goer;
exceptions.goner = goner;
exceptions.goodlier = goodly;
exceptions.goodliest = goodly;
exceptions.goofier = goofy;
exceptions.goofiest = goofy;
exceptions.gooier = gooey;
exceptions.gooiest = gooey;
exceptions.goosier = goosy;
exceptions.goosiest = goosy;
exceptions.gorier = gory;
exceptions.goriest = gory;
exceptions.gradelier = gradely;
exceptions.gradeliest = gradely;
exceptions.grader = grader;
exceptions.grainier = grainy;
exceptions.grainiest = grainy;
exceptions.grassier = grassy;
exceptions.grassiest = grassy;
exceptions.greasier = greasy;
exceptions.greasiest = greasy;
exceptions.greedier = greedy;
exceptions.greediest = greedy;
exceptions.grimmer = grim;
exceptions.grimmest = grim;
exceptions.grislier = grisly;
exceptions.grisliest = grisly;
exceptions.grittier = gritty;
exceptions.grittiest = gritty;
exceptions.grizzlier = grizzly;
exceptions.grizzliest = grizzly;
exceptions.groggier = groggy;
exceptions.groggiest = groggy;
exceptions.groovier = groovy;
exceptions.grooviest = groovy;
exceptions.grottier = grotty;
exceptions.grottiest = grotty;
exceptions.grounder = grounder;
exceptions.grouper = grouper;
exceptions.groutier = grouty;
exceptions.groutiest = grouty;
exceptions.grubbier = grubby;
exceptions.grubbiest = grubby;
exceptions.grumpier = grumpy;
exceptions.grumpiest = grumpy;
exceptions.guest = guest;
exceptions.guiltier = guilty;
exceptions.guiltiest = guilty;
exceptions.gummier = gummy;
exceptions.gummiest = gummy;
exceptions.gushier = gushy;
exceptions.gushiest = gushy;
exceptions.gustier = gusty;
exceptions.gustiest = gusty;
exceptions.gutsier = gutsy;
exceptions.gutsiest = gutsy;
exceptions.hairier = hairy;
exceptions.hairiest = hairy;
exceptions.halfways = halfway;
exceptions.halter = halter;
exceptions.hammier = hammy;
exceptions.hammiest = hammy;
exceptions.handier = handy;
exceptions.handiest = handy;
exceptions.happier = happy;
exceptions.happiest = happy;
exceptions.hardier = hardy;
exceptions.hardiest = hardy;
exceptions.hastier = hasty;
exceptions.hastiest = hasty;
exceptions.haughtier = haughty;
exceptions.haughtiest = haughty;
exceptions.hazier = hazy;
exceptions.haziest = hazy;
exceptions.header = header;
exceptions.headier = heady;
exceptions.headiest = heady;
exceptions.healthier = healthy;
exceptions.healthiest = healthy;
exceptions.heartier = hearty;
exceptions.heartiest = hearty;
exceptions.heavier = heavy;
exceptions.heaviest = heavy;
exceptions.heftier = hefty;
exceptions.heftiest = hefty;
exceptions.hepper = hep;
exceptions.heppest = hep;
exceptions.herbier = herby;
exceptions.herbiest = herby;
exceptions.hinder = hind;
exceptions.hipper = hip;
exceptions.hippest = hip;
exceptions.hippier = hippy;
exceptions.hippiest = hippy;
exceptions.hoarier = hoary;
exceptions.hoariest = hoary;
exceptions.holier = holy;
exceptions.holiest = holy;
exceptions.homelier = homely;
exceptions.homeliest = homely;
exceptions.homer = homer;
exceptions.homier = homey;
exceptions.homiest = homey;
exceptions.hornier = horny;
exceptions.horniest = horny;
exceptions.horsier = horsy;
exceptions.horsiest = horsy;
exceptions.hotter = hot;
exceptions.hottest = hot;
exceptions.humpier = humpy;
exceptions.humpiest = humpy;
exceptions.hunger = hunger;
exceptions.hungrier = hungry;
exceptions.hungriest = hungry;
exceptions.huskier = husky;
exceptions.huskiest = husky;
exceptions.icier = icy;
exceptions.iciest = icy;
exceptions.inkier = inky;
exceptions.inkiest = inky;
exceptions.insider = insider;
exceptions.interest = interest;
exceptions.jaggier = jaggy;
exceptions.jaggiest = jaggy;
exceptions.jammier = jammy;
exceptions.jammiest = jammy;
exceptions.jauntier = jaunty;
exceptions.jauntiest = jaunty;
exceptions.jazzier = jazzy;
exceptions.jazziest = jazzy;
exceptions.jerkier = jerky;
exceptions.jerkiest = jerky;
exceptions.jointer = jointer;
exceptions.jollier = jolly;
exceptions.jolliest = jolly;
exceptions.juicier = juicy;
exceptions.juiciest = juicy;
exceptions.jumpier = jumpy;
exceptions.jumpiest = jumpy;
exceptions.kindlier = kindly;
exceptions.kindliest = kindly;
exceptions.kinkier = kinky;
exceptions.kinkiest = kinky;
exceptions.knottier = knotty;
exceptions.knottiest = knotty;
exceptions.knurlier = knurly;
exceptions.knurliest = knurly;
exceptions.kookier = kooky;
exceptions.kookiest = kooky;
exceptions.lacier = lacy;
exceptions.laciest = lacy;
exceptions.lairier = lairy;
exceptions.lairiest = lairy;
exceptions.lakier = laky;
exceptions.lakiest = laky;
exceptions.lander = lander;
exceptions.lankier = lanky;
exceptions.lankiest = lanky;
exceptions.lathier = lathy;
exceptions.lathiest = lathy;
exceptions.layer = layer;
exceptions.lazier = lazy;
exceptions.laziest = lazy;
exceptions.leafier = leafy;
exceptions.leafiest = leafy;
exceptions.leakier = leaky;
exceptions.leakiest = leaky;
exceptions.learier = leary;
exceptions.leariest = leary;
exceptions.leer = leer;
exceptions.leerier = leery;
exceptions.leeriest = leery;
exceptions.leggier = leggy;
exceptions.leggiest = leggy;
exceptions.lengthier = lengthy;
exceptions.lengthiest = lengthy;
exceptions.ler = ler;
exceptions.leveler = leveler;
exceptions.limier = limy;
exceptions.limiest = limy;
exceptions.lippier = lippy;
exceptions.lippiest = lippy;
exceptions.liter = liter;
exceptions.livelier = lively;
exceptions.liveliest = lively;
exceptions.liver = liver;
exceptions.loather = loather;
exceptions.loftier = lofty;
exceptions.loftiest = lofty;
exceptions.logier = logy;
exceptions.logiest = logy;
exceptions.lonelier = lonely;
exceptions.loneliest = lonely;
exceptions.loner = loner;
exceptions.loonier = loony;
exceptions.looniest = loony;
exceptions.loopier = loopy;
exceptions.loopiest = loopy;
exceptions.lordlier = lordly;
exceptions.lordliest = lordly;
exceptions.lousier = lousy;
exceptions.lousiest = lousy;
exceptions.lovelier = lovely;
exceptions.loveliest = lovely;
exceptions.lowlander = lowlander;
exceptions.lowlier = lowly;
exceptions.lowliest = lowly;
exceptions.luckier = lucky;
exceptions.luckiest = lucky;
exceptions.lumpier = lumpy;
exceptions.lumpiest = lumpy;
exceptions.lunier = luny;
exceptions.luniest = luny;
exceptions.lustier = lusty;
exceptions.lustiest = lusty;
exceptions.madder = mad;
exceptions.maddest = mad;
exceptions.mainer = mainer;
exceptions.maligner = maligner;
exceptions.maltier = malty;
exceptions.maltiest = malty;
exceptions.mangier = mangy;
exceptions.mangiest = mangy;
exceptions.mankier = manky;
exceptions.mankiest = manky;
exceptions.manlier = manly;
exceptions.manliest = manly;
exceptions.mariner = mariner;
exceptions.marshier = marshy;
exceptions.marshiest = marshy;
exceptions.massier = massy;
exceptions.massiest = massy;
exceptions.matter = matter;
exceptions.maungier = maungy;
exceptions.maungiest = maungy;
exceptions.mazier = mazy;
exceptions.maziest = mazy;
exceptions.mealier = mealy;
exceptions.mealiest = mealy;
exceptions.measlier = measly;
exceptions.measliest = measly;
exceptions.meatier = meaty;
exceptions.meatiest = meaty;
exceptions.meeter = meeter;
exceptions.merrier = merry;
exceptions.merriest = merry;
exceptions.messier = messy;
exceptions.messiest = messy;
exceptions.miffier = miffy;
exceptions.miffiest = miffy;
exceptions.mightier = mighty;
exceptions.mightiest = mighty;
exceptions.milcher = milcher;
exceptions.milker = milker;
exceptions.milkier = milky;
exceptions.milkiest = milky;
exceptions.mingier = mingy;
exceptions.mingiest = mingy;
exceptions.minter = minter;
exceptions.mirkier = mirky;
exceptions.mirkiest = mirky;
exceptions.miser = miser;
exceptions.mistier = misty;
exceptions.mistiest = misty;
exceptions.mocker = mocker;
exceptions.modeler = modeler;
exceptions.modest = modest;
exceptions.moldier = moldy;
exceptions.moldiest = moldy;
exceptions.moodier = moody;
exceptions.moodiest = moody;
exceptions.moonier = moony;
exceptions.mooniest = moony;
exceptions.mothier = mothy;
exceptions.mothiest = mothy;
exceptions.mouldier = mouldy;
exceptions.mouldiest = mouldy;
exceptions.mousier = mousy;
exceptions.mousiest = mousy;
exceptions.mouthier = mouthy;
exceptions.mouthiest = mouthy;
exceptions.muckier = mucky;
exceptions.muckiest = mucky;
exceptions.muddier = muddy;
exceptions.muddiest = muddy;
exceptions.muggier = muggy;
exceptions.muggiest = muggy;
exceptions.multiplexer = multiplexer;
exceptions.murkier = murky;
exceptions.murkiest = murky;
exceptions.mushier = mushy;
exceptions.mushiest = mushy;
exceptions.muskier = musky;
exceptions.muskiest = musky;
exceptions.muster = muster;
exceptions.mustier = musty;
exceptions.mustiest = musty;
exceptions.muzzier = muzzy;
exceptions.muzziest = muzzy;
exceptions.nappier = nappy;
exceptions.nappiest = nappy;
exceptions.nastier = nasty;
exceptions.nastiest = nasty;
exceptions.nattier = natty;
exceptions.nattiest = natty;
exceptions.naughtier = naughty;
exceptions.naughtiest = naughty;
exceptions.needier = needy;
exceptions.neediest = needy;
exceptions.nervier = nervy;
exceptions.nerviest = nervy;
exceptions.newsier = newsy;
exceptions.newsiest = newsy;
exceptions.niftier = nifty;
exceptions.niftiest = nifty;
exceptions.nippier = nippy;
exceptions.nippiest = nippy;
exceptions.nittier = nitty;
exceptions.nittiest = nitty;
exceptions.noisier = noisy;
exceptions.noisiest = noisy;
exceptions.northeasterner = northeasterner;
exceptions.norther = norther;
exceptions.northerner = northerner;
exceptions.nosier = nosy;
exceptions.nosiest = nosy;
exceptions.number = number;
exceptions.nuttier = nutty;
exceptions.nuttiest = nutty;
exceptions.offer = offer;
exceptions.oilier = oily;
exceptions.oiliest = oily;
exceptions.oliver = oliver;
exceptions.oozier = oozy;
exceptions.ooziest = oozy;
exceptions.opener = opener;
exceptions.outsider = outsider;
exceptions.overcomer = overcomer;
exceptions.overnighter = overnighter;
exceptions.owner = owner;
exceptions.pallier = pally;
exceptions.palliest = pally;
exceptions.palmier = palmy;
exceptions.palmiest = palmy;
exceptions.paltrier = paltry;
exceptions.paltriest = paltry;
exceptions.pappier = pappy;
exceptions.pappiest = pappy;
exceptions.parkier = parky;
exceptions.parkiest = parky;
exceptions.passer = passer;
exceptions.paster = paster;
exceptions.pastier = pasty;
exceptions.pastiest = pasty;
exceptions.patchier = patchy;
exceptions.patchiest = patchy;
exceptions.pater = pater;
exceptions.pawkier = pawky;
exceptions.pawkiest = pawky;
exceptions.peachier = peachy;
exceptions.peachiest = peachy;
exceptions.pearler = pearler;
exceptions.pearlier = pearly;
exceptions.pearliest = pearly;
exceptions.pedaler = pedaler;
exceptions.peppier = peppy;
exceptions.peppiest = peppy;
exceptions.perkier = perky;
exceptions.perkiest = perky;
exceptions.peskier = pesky;
exceptions.peskiest = pesky;
exceptions.peter = peter;
exceptions.pettier = petty;
exceptions.pettiest = petty;
exceptions.phonier = phony;
exceptions.phoniest = phony;
exceptions.pickier = picky;
exceptions.pickiest = picky;
exceptions.piggier = piggy;
exceptions.piggiest = piggy;
exceptions.pinier = piny;
exceptions.piniest = piny;
exceptions.pitchier = pitchy;
exceptions.pitchiest = pitchy;
exceptions.pithier = pithy;
exceptions.pithiest = pithy;
exceptions.planer = planer;
exceptions.plashier = plashy;
exceptions.plashiest = plashy;
exceptions.platier = platy;
exceptions.platiest = platy;
exceptions.player = player;
exceptions.pluckier = plucky;
exceptions.pluckiest = plucky;
exceptions.plumber = plumber;
exceptions.plumier = plumy;
exceptions.plumiest = plumy;
exceptions.plummier = plummy;
exceptions.plummiest = plummy;
exceptions.podgier = podgy;
exceptions.podgiest = podgy;
exceptions.pokier = poky;
exceptions.pokiest = poky;
exceptions.polisher = polisher;
exceptions.porkier = porky;
exceptions.porkiest = porky;
exceptions.porter = porter;
exceptions.portlier = portly;
exceptions.portliest = portly;
exceptions.poster = poster;
exceptions.pottier = potty;
exceptions.pottiest = potty;
exceptions.preachier = preachy;
exceptions.preachiest = preachy;
exceptions.presenter = presenter;
exceptions.pretender = pretender;
exceptions.prettier = pretty;
exceptions.prettiest = pretty;
exceptions.pricier = pricy;
exceptions.priciest = pricy;
exceptions.pricklier = prickly;
exceptions.prickliest = prickly;
exceptions.priestlier = priestly;
exceptions.priestliest = priestly;
exceptions.primer = primer;
exceptions.primmer = prim;
exceptions.primmest = prim;
exceptions.princelier = princely;
exceptions.princeliest = princely;
exceptions.printer = printer;
exceptions.prissier = prissy;
exceptions.prissiest = prissy;
exceptions.privateer = privateer;
exceptions.privier = privy;
exceptions.priviest = privy;
exceptions.prompter = prompter;
exceptions.prosier = prosy;
exceptions.prosiest = prosy;
exceptions.pudgier = pudgy;
exceptions.pudgiest = pudgy;
exceptions.puffer = puffer;
exceptions.puffier = puffy;
exceptions.puffiest = puffy;
exceptions.pulpier = pulpy;
exceptions.pulpiest = pulpy;
exceptions.punchier = punchy;
exceptions.punchiest = punchy;
exceptions.punier = puny;
exceptions.puniest = puny;
exceptions.pushier = pushy;
exceptions.pushiest = pushy;
exceptions.pussier = pussy;
exceptions.pussiest = pussy;
exceptions.quaggier = quaggy;
exceptions.quaggiest = quaggy;
exceptions.quakier = quaky;
exceptions.quakiest = quaky;
exceptions.queasier = queasy;
exceptions.queasiest = queasy;
exceptions.queenlier = queenly;
exceptions.queenliest = queenly;
exceptions.racier = racy;
exceptions.raciest = racy;
exceptions.rainier = rainy;
exceptions.rainiest = rainy;
exceptions.randier = randy;
exceptions.randiest = randy;
exceptions.rangier = rangy;
exceptions.rangiest = rangy;
exceptions.ranker = ranker;
exceptions.rattier = ratty;
exceptions.rattiest = ratty;
exceptions.rattlier = rattly;
exceptions.rattliest = rattly;
exceptions.raunchier = raunchy;
exceptions.raunchiest = raunchy;
exceptions.readier = ready;
exceptions.readiest = ready;
exceptions.recorder = recorder;
exceptions.redder = red;
exceptions.reddest = red;
exceptions.reedier = reedy;
exceptions.reediest = reedy;
exceptions.renter = renter;
exceptions.retailer = retailer;
exceptions.rimier = rimy;
exceptions.rimiest = rimy;
exceptions.riskier = risky;
exceptions.riskiest = risky;
exceptions.ritzier = ritzy;
exceptions.ritziest = ritzy;
exceptions.roaster = roaster;
exceptions.rockier = rocky;
exceptions.rockiest = rocky;
exceptions.roilier = roily;
exceptions.roiliest = roily;
exceptions.rookier = rooky;
exceptions.rookiest = rooky;
exceptions.roomier = roomy;
exceptions.roomiest = roomy;
exceptions.ropier = ropy;
exceptions.ropiest = ropy;
exceptions.rosier = rosy;
exceptions.rosiest = rosy;
exceptions.rowdier = rowdy;
exceptions.rowdiest = rowdy;
exceptions.ruddier = ruddy;
exceptions.ruddiest = ruddy;
exceptions.runnier = runny;
exceptions.runniest = runny;
exceptions.rusher = rusher;
exceptions.rushier = rushy;
exceptions.rushiest = rushy;
exceptions.rustier = rusty;
exceptions.rustiest = rusty;
exceptions.ruttier = rutty;
exceptions.ruttiest = rutty;
exceptions.sadder = sad;
exceptions.saddest = sad;
exceptions.salter = salter;
exceptions.saltier = salty;
exceptions.saltiest = salty;
exceptions.sampler = sampler;
exceptions.sandier = sandy;
exceptions.sandiest = sandy;
exceptions.sappier = sappy;
exceptions.sappiest = sappy;
exceptions.sassier = sassy;
exceptions.sassiest = sassy;
exceptions.saucier = saucy;
exceptions.sauciest = saucy;
exceptions.savvier = savvy;
exceptions.savviest = savvy;
exceptions.scabbier = scabby;
exceptions.scabbiest = scabby;
exceptions.scalier = scaly;
exceptions.scaliest = scaly;
exceptions.scantier = scanty;
exceptions.scantiest = scanty;
exceptions.scarier = scary;
exceptions.scariest = scary;
exceptions.scraggier = scraggy;
exceptions.scraggiest = scraggy;
exceptions.scragglier = scraggly;
exceptions.scraggliest = scraggly;
exceptions.scraper = scraper;
exceptions.scrappier = scrappy;
exceptions.scrappiest = scrappy;
exceptions.scrawnier = scrawny;
exceptions.scrawniest = scrawny;
exceptions.screwier = screwy;
exceptions.screwiest = screwy;
exceptions.scrubbier = scrubby;
exceptions.scrubbiest = scrubby;
exceptions.scruffier = scruffy;
exceptions.scruffiest = scruffy;
exceptions.scungier = scungy;
exceptions.scungiest = scungy;
exceptions.scurvier = scurvy;
exceptions.scurviest = scurvy;
exceptions.seamier = seamy;
exceptions.seamiest = seamy;
exceptions.seconder = seconder;
exceptions.seedier = seedy;
exceptions.seediest = seedy;
exceptions.seemlier = seemly;
exceptions.seemliest = seemly;
exceptions.serer = serer;
exceptions.sexier = sexy;
exceptions.sexiest = sexy;
exceptions.shabbier = shabby;
exceptions.shabbiest = shabby;
exceptions.shadier = shady;
exceptions.shadiest = shady;
exceptions.shaggier = shaggy;
exceptions.shaggiest = shaggy;
exceptions.shakier = shaky;
exceptions.shakiest = shaky;
exceptions.shapelier = shapely;
exceptions.shapeliest = shapely;
exceptions.shier = shy;
exceptions.shiest = shy;
exceptions.shiftier = shifty;
exceptions.shiftiest = shifty;
exceptions.shinier = shiny;
exceptions.shiniest = shiny;
exceptions.shirtier = shirty;
exceptions.shirtiest = shirty;
exceptions.shoddier = shoddy;
exceptions.shoddiest = shoddy;
exceptions.showier = showy;
exceptions.showiest = showy;
exceptions.shrubbier = shrubby;
exceptions.shrubbiest = shrubby;
exceptions.shyer = shy;
exceptions.shyest = shy;
exceptions.sicklier = sickly;
exceptions.sickliest = sickly;
exceptions.sightlier = sightly;
exceptions.sightliest = sightly;
exceptions.signaler = signaler;
exceptions.signer = signer;
exceptions.silkier = silky;
exceptions.silkiest = silky;
exceptions.sillier = silly;
exceptions.silliest = silly;
exceptions.sketchier = sketchy;
exceptions.sketchiest = sketchy;
exceptions.skewer = skewer;
exceptions.skimpier = skimpy;
exceptions.skimpiest = skimpy;
exceptions.skinnier = skinny;
exceptions.skinniest = skinny;
exceptions.slaphappier = slaphappy;
exceptions.slaphappiest = slaphappy;
exceptions.slatier = slaty;
exceptions.slatiest = slaty;
exceptions.slaver = slaver;
exceptions.sleazier = sleazy;
exceptions.sleaziest = sleazy;
exceptions.sleepier = sleepy;
exceptions.sleepiest = sleepy;
exceptions.slier = sly;
exceptions.sliest = sly;
exceptions.slimier = slimy;
exceptions.slimiest = slimy;
exceptions.slimmer = slim;
exceptions.slimmest = slim;
exceptions.slimsier = slimsy;
exceptions.slimsiest = slimsy;
exceptions.slinkier = slinky;
exceptions.slinkiest = slinky;
exceptions.slippier = slippy;
exceptions.slippiest = slippy;
exceptions.sloppier = sloppy;
exceptions.sloppiest = sloppy;
exceptions.slyer = sly;
exceptions.slyest = sly;
exceptions.smarmier = smarmy;
exceptions.smarmiest = smarmy;
exceptions.smellier = smelly;
exceptions.smelliest = smelly;
exceptions.smokier = smoky;
exceptions.smokiest = smoky;
exceptions.smugger = smug;
exceptions.smuggest = smug;
exceptions.snakier = snaky;
exceptions.snakiest = snaky;
exceptions.snappier = snappy;
exceptions.snappiest = snappy;
exceptions.snatchier = snatchy;
exceptions.snatchiest = snatchy;
exceptions.snazzier = snazzy;
exceptions.snazziest = snazzy;
exceptions.sneaker = sneaker;
exceptions.sniffier = sniffy;
exceptions.sniffiest = sniffy;
exceptions.snootier = snooty;
exceptions.snootiest = snooty;
exceptions.snottier = snotty;
exceptions.snottiest = snotty;
exceptions.snowier = snowy;
exceptions.snowiest = snowy;
exceptions.snuffer = snuffer;
exceptions.snuffier = snuffy;
exceptions.snuffiest = snuffy;
exceptions.snugger = snug;
exceptions.snuggest = snug;
exceptions.soapier = soapy;
exceptions.soapiest = soapy;
exceptions.soggier = soggy;
exceptions.soggiest = soggy;
exceptions.solder = solder;
exceptions.sonsier = sonsy;
exceptions.sonsiest = sonsy;
exceptions.sootier = sooty;
exceptions.sootiest = sooty;
exceptions.soppier = soppy;
exceptions.soppiest = soppy;
exceptions.sorrier = sorry;
exceptions.sorriest = sorry;
exceptions.soupier = soupy;
exceptions.soupiest = soupy;
exceptions.souther = souther;
exceptions.southerner = southerner;
exceptions.speedier = speedy;
exceptions.speediest = speedy;
exceptions.spicier = spicy;
exceptions.spiciest = spicy;
exceptions.spiffier = spiffy;
exceptions.spiffiest = spiffy;
exceptions.spikier = spiky;
exceptions.spikiest = spiky;
exceptions.spindlier = spindly;
exceptions.spindliest = spindly;
exceptions.spinier = spiny;
exceptions.spiniest = spiny;
exceptions.splashier = splashy;
exceptions.splashiest = splashy;
exceptions.spongier = spongy;
exceptions.spongiest = spongy;
exceptions.spookier = spooky;
exceptions.spookiest = spooky;
exceptions.spoonier = spoony;
exceptions.spooniest = spoony;
exceptions.sportier = sporty;
exceptions.sportiest = sporty;
exceptions.spottier = spotty;
exceptions.spottiest = spotty;
exceptions.spreader = spreader;
exceptions.sprier = spry;
exceptions.spriest = spry;
exceptions.sprightlier = sprightly;
exceptions.sprightliest = sprightly;
exceptions.springer = springer;
exceptions.springier = springy;
exceptions.springiest = springy;
exceptions.squashier = squashy;
exceptions.squashiest = squashy;
exceptions.squatter = squat;
exceptions.squattest = squat;
exceptions.squattier = squatty;
exceptions.squattiest = squatty;
exceptions.squiffier = squiffy;
exceptions.squiffiest = squiffy;
exceptions.stagier = stagy;
exceptions.stagiest = stagy;
exceptions.stalkier = stalky;
exceptions.stalkiest = stalky;
exceptions.stapler = stapler;
exceptions.starchier = starchy;
exceptions.starchiest = starchy;
exceptions.starer = starer;
exceptions.starest = starest;
exceptions.starrier = starry;
exceptions.starriest = starry;
exceptions.statelier = stately;
exceptions.stateliest = stately;
exceptions.steadier = steady;
exceptions.steadiest = steady;
exceptions.stealthier = stealthy;
exceptions.stealthiest = stealthy;
exceptions.steamier = steamy;
exceptions.steamiest = steamy;
exceptions.stingier = stingy;
exceptions.stingiest = stingy;
exceptions.stiper = striper;
exceptions.stocker = stocker;
exceptions.stockier = stocky;
exceptions.stockiest = stocky;
exceptions.stodgier = stodgy;
exceptions.stodgiest = stodgy;
exceptions.stonier = stony;
exceptions.stoniest = stony;
exceptions.stormier = stormy;
exceptions.stormiest = stormy;
exceptions.streakier = streaky;
exceptions.streakiest = streaky;
exceptions.streamier = streamy;
exceptions.streamiest = streamy;
exceptions.stretcher = stretcher;
exceptions.stretchier = stretchy;
exceptions.stretchiest = stretchy;
exceptions.stringier = stringy;
exceptions.stringiest = stringy;
exceptions.stripier = stripy;
exceptions.stripiest = stripy;
exceptions.stronger = strong;
exceptions.strongest = strong;
exceptions.stroppier = stroppy;
exceptions.stroppiest = stroppy;
exceptions.stuffier = stuffy;
exceptions.stuffiest = stuffy;
exceptions.stumpier = stumpy;
exceptions.stumpiest = stumpy;
exceptions.sturdier = sturdy;
exceptions.sturdiest = sturdy;
exceptions.submariner = submariner;
exceptions.sulkier = sulky;
exceptions.sulkiest = sulky;
exceptions.sultrier = sultry;
exceptions.sultriest = sultry;
exceptions.sunnier = sunny;
exceptions.sunniest = sunny;
exceptions.surlier = surly;
exceptions.surliest = surly;
exceptions.swagger = swagger;
exceptions.swankier = swanky;
exceptions.swankiest = swanky;
exceptions.swarthier = swarthy;
exceptions.swarthiest = swarthy;
exceptions.sweatier = sweaty;
exceptions.sweatiest = sweaty;
exceptions.tackier = tacky;
exceptions.tackiest = tacky;
exceptions.talkier = talky;
exceptions.talkiest = talky;
exceptions.tangier = tangy;
exceptions.tangiest = tangy;
exceptions.tanner = tan;
exceptions.tannest = tan;
exceptions.tardier = tardy;
exceptions.tardiest = tardy;
exceptions.tastier = tasty;
exceptions.tastiest = tasty;
exceptions.tattier = tatty;
exceptions.tattiest = tatty;
exceptions.tawdrier = tawdry;
exceptions.tawdriest = tawdry;
exceptions.techier = techy;
exceptions.techiest = techy;
exceptions.teenager = teenager;
exceptions.teenier = teeny;
exceptions.teeniest = teeny;
exceptions.teetotaler = teetotaler;
exceptions.tester = tester;
exceptions.testier = testy;
exceptions.testiest = testy;
exceptions.tetchier = tetchy;
exceptions.tetchiest = tetchy;
exceptions.thinner = thin;
exceptions.thinnest = thin;
exceptions.thirstier = thirsty;
exceptions.thirstiest = thirsty;
exceptions.thornier = thorny;
exceptions.thorniest = thorny;
exceptions.threadier = thready;
exceptions.threadiest = thready;
exceptions.thriftier = thrifty;
exceptions.thriftiest = thrifty;
exceptions.throatier = throaty;
exceptions.throatiest = throaty;
exceptions.tidier = tidy;
exceptions.tidiest = tidy;
exceptions.timelier = timely;
exceptions.timeliest = timely;
exceptions.tinier = tiny;
exceptions.tiniest = tiny;
exceptions.tinnier = tinny;
exceptions.tinniest = tinny;
exceptions.tipsier = tipsy;
exceptions.tipsiest = tipsy;
exceptions.tonier = tony;
exceptions.toniest = tony;
exceptions.toothier = toothy;
exceptions.toothiest = toothy;
exceptions.toper = toper;
exceptions.touchier = touchy;
exceptions.touchiest = touchy;
exceptions.trader = trader;
exceptions.trashier = trashy;
exceptions.trashiest = trashy;
exceptions.trendier = trendy;
exceptions.trendiest = trendy;
exceptions.trickier = tricky;
exceptions.trickiest = tricky;
exceptions.tricksier = tricksy;
exceptions.tricksiest = tricksy;
exceptions.trimer = trimer;
exceptions.trimmer = trim;
exceptions.trimmest = trim;
exceptions.truer = true1;
exceptions.truest = true1;
exceptions.trustier = trusty;
exceptions.trustiest = trusty;
exceptions.tubbier = tubby;
exceptions.tubbiest = tubby;
exceptions.turfier = turfy;
exceptions.turfiest = turfy;
exceptions.tweedier = tweedy;
exceptions.tweediest = tweedy;
exceptions.twiggier = twiggy;
exceptions.twiggiest = twiggy;
exceptions.uglier = ugly;
exceptions.ugliest = ugly;
exceptions.unfriendlier = unfriendly;
exceptions.unfriendliest = unfriendly;
exceptions.ungainlier = ungainly;
exceptions.ungainliest = ungainly;
exceptions.ungodlier = ungodly;
exceptions.ungodliest = ungodly;
exceptions.unhappier = unhappy;
exceptions.unhappiest = unhappy;
exceptions.unhealthier = unhealthy;
exceptions.unhealthiest = unhealthy;
exceptions.unholier = unholy;
exceptions.unholiest = unholy;
exceptions.unrulier = unruly;
exceptions.unruliest = unruly;
exceptions.untidier = untidy;
exceptions.untidiest = untidy;
exceptions.vastier = vasty;
exceptions.vastiest = vasty;
exceptions.vest = vest;
exceptions.viewier = viewy;
exceptions.viewiest = viewy;
exceptions.wackier = wacky;
exceptions.wackiest = wacky;
exceptions.wanner = wan;
exceptions.wannest = wan;
exceptions.warier = wary;
exceptions.wariest = wary;
exceptions.washier = washy;
exceptions.washiest = washy;
exceptions.waster = waster;
exceptions.wavier = wavy;
exceptions.waviest = wavy;
exceptions.waxier = waxy;
exceptions.waxiest = waxy;
exceptions.weaklier = weakly;
exceptions.weakliest = weakly;
exceptions.wealthier = wealthy;
exceptions.wealthiest = wealthy;
exceptions.wearier = weary;
exceptions.weariest = weary;
exceptions.webbier = webby;
exceptions.webbiest = webby;
exceptions.weedier = weedy;
exceptions.weediest = weedy;
exceptions.weenier = weeny;
exceptions.weeniest = weeny;
exceptions.weensier = weensy;
exceptions.weensiest = weensy;
exceptions.weepier = weepy;
exceptions.weepiest = weepy;
exceptions.weightier = weighty;
exceptions.weightiest = weighty;
exceptions.welsher = welsher;
exceptions.wetter = wet;
exceptions.wettest = wet;
exceptions.whackier = whacky;
exceptions.whackiest = whacky;
exceptions.whimsier = whimsy;
exceptions.whimsiest = whimsy;
exceptions.wholesaler = wholesaler;
exceptions.wieldier = wieldy;
exceptions.wieldiest = wieldy;
exceptions.wilier = wily;
exceptions.wiliest = wily;
exceptions.windier = windy;
exceptions.windiest = windy;
exceptions.winier = winy;
exceptions.winiest = winy;
exceptions.winterier = wintery;
exceptions.winteriest = wintery;
exceptions.wintrier = wintry;
exceptions.wintriest = wintry;
exceptions.wirier = wiry;
exceptions.wiriest = wiry;
exceptions.wispier = wispy;
exceptions.wispiest = wispy;
exceptions.wittier = witty;
exceptions.wittiest = witty;
exceptions.wonkier = wonky;
exceptions.wonkiest = wonky;
exceptions.woodier = woody;
exceptions.woodiest = woody;
exceptions.woodsier = woodsy;
exceptions.woodsiest = woodsy;
exceptions.woollier = woolly;
exceptions.woolliest = woolly;
exceptions.woozier = woozy;
exceptions.wooziest = woozy;
exceptions.wordier = wordy;
exceptions.wordiest = wordy;
exceptions.worldlier = worldly;
exceptions.worldliest = worldly;
exceptions.wormier = wormy;
exceptions.wormiest = wormy;
exceptions.worse = bad;
exceptions.worst = bad;
exceptions.worthier = worthy;
exceptions.worthiest = worthy;
exceptions.wrier = wry;
exceptions.wriest = wry;
exceptions.wryer = wry;
exceptions.wryest = wry;
exceptions.yarer = yare;
exceptions.yarest = yare;
exceptions.yeastier = yeasty;
exceptions.yeastiest = yeasty;
exceptions.younger = young;
exceptions.youngest = young;
exceptions.yummier = yummy;
exceptions.yummiest = yummy;
exceptions.zanier = zany;
exceptions.zaniest = zany;
exceptions.zippier = zippy;
exceptions.zippiest = zippy;

module.exports = exceptions;

},{}],5:[function(require,module,exports){
//     wink-lexicon
//     English lexicon useful in NLP/NLU
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-lexicon”.
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//
// This data is derived from the WordNet project of Princeton University. The
// Wordnet is copyright by Princeton University. It is sourced from
// http://wordnet.princeton.edu/; the license text can be accessed at
// http://wordnet.princeton.edu/wordnet/license/ URL.
// WordNet License:
// WordNet Release 3.0 This software and database is being provided to you,
// the LICENSEE, by Princeton University under the following license.
// By obtaining, using and/or copying this software and database,
// you agree that you have read, understood, and will comply with these terms
// and conditions.:
// Permission to use, copy, modify and distribute this software and database and
// its documentation for any purpose and without fee or royalty is hereby
// granted, provided that you agree to comply with the following copyright
// notice and statements, including the disclaimer, and that the same appear
// on ALL copies of the software, database and documentation, including
// modifications that you make for internal use or for distribution.
// WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
// THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY
// MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.
// BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON UNIVERSITY MAKES NO
// REPRESENTATIONS OR WARRANTIES OF MERCHANT- ABILITY OR FITNESS FOR ANY
// PARTICULAR PURPOSE OR THAT THE USE OF THE LICENSED SOFTWARE, DATABASE OR
// DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
// TRADEMARKS OR OTHER RIGHTS. The name of Princeton University or Princeton
// may not be used in advertising or publicity pertaining to distribution of
// the software and/or database. Title to copyright in this software, database
// and any associated documentation shall at all times remain with
// Princeton University and LICENSEE agrees to preserve same.

/* eslint max-lines: ["error", {"max": 90000, "skipComments": true}] */
/* eslint-disable camelcase */

const exceptions = Object.create( null );
// Lemma constants.
const aardwolf = 'aardwolf';
const abacus = 'abacus';
const aboideau = 'aboideau';
const aboiteau = 'aboiteau';
const abscissa = 'abscissa';
const acanthus = 'acanthus';
const acarus = 'acarus';
const acciaccatura = 'acciaccatura';
const acetabulum = 'acetabulum';
const achaemenid = 'achaemenid';
const aciculum = 'aciculum';
const acicula = 'acicula';
const acinus = 'acinus';
const acromion = 'acromion';
const actinia = 'actinia';
const actinozoan = 'actinozoan';
const addendum = 'addendum';
const adenocarcinoma = 'adenocarcinoma';
const adenoma = 'adenoma';
const adieu = 'adieu';
const adytum = 'adytum';
const aecium = 'aecium';
const aecidium = 'aecidium';
const aerobium = 'aerobium';
const aggiornamento = 'aggiornamento';
const agnomen = 'agnomen';
const agon = 'agon';
const agora = 'agora';
const agouti = 'agouti';
const ala = 'ala';
const alewife = 'alewife';
const alkali = 'alkali';
const allodium = 'allodium';
const alluvium = 'alluvium';
const alodium = 'alodium';
const altocumulus = 'altocumulus';
const altostratus = 'altostratus';
const alula = 'alula';
const alumna = 'alumna';
const alumnus = 'alumnus';
const alveolus = 'alveolus';
const amanuensis = 'amanuensis';
const ambulacrum = 'ambulacrum';
const ameba = 'ameba';
const amnion = 'amnion';
const amniocentesis = 'amniocentesis';
const amoeba = 'amoeba';
const amoebiasis = 'amoebiasis';
const amora = 'amora';
const amoretto = 'amoretto';
const amorino = 'amorino';
const amphiarthrosis = 'amphiarthrosis';
const amphithecium = 'amphithecium';
const amphimixis = 'amphimixis';
const amphioxus = 'amphioxus';
const amphisbaena = 'amphisbaena';
const amphora = 'amphora';
const ampulla = 'ampulla';
const amygdala = 'amygdala';
const anabasis = 'anabasis';
const anacoluthon = 'anacoluthon';
const anacrusis = 'anacrusis';
const anaerobium = 'anaerobium';
const anagnorisis = 'anagnorisis';
const analemma = 'analemma';
const analysis = 'analysis';
const anamnesis = 'anamnesis';
const anamorphosis = 'anamorphosis';
const anastomosis = 'anastomosis';
const anaptyxis = 'anaptyxis';
const ancon = 'ancon';
const androclinium = 'androclinium';
const androecium = 'androecium';
const androsphinx = 'androsphinx';
const antheridium = 'antheridium';
const angelfish = 'angelfish';
const angioma = 'angioma';
const animalculum = 'animalculum';
const anlage = 'anlage';
const annatto = 'annatto';
const annulus = 'annulus';
const anta = 'anta';
const antalkali = 'antalkali';
const antefix = 'antefix';
const antenna = 'antenna';
const antependium = 'antependium';
const anthelion = 'anthelion';
const anthelix = 'anthelix';
const anthemion = 'anthemion';
const anthodium = 'anthodium';
const anthozoan = 'anthozoan';
const anthrax = 'anthrax';
const anticlinorium = 'anticlinorium';
const antihelix = 'antihelix';
const antihero = 'antihero';
const antiserum = 'antiserum';
const antithesis = 'antithesis';
const antitragus = 'antitragus';
const antrum = 'antrum';
const anus = 'anus';
const aorta = 'aorta';
const aphelion = 'aphelion';
const aphis = 'aphis';
const apex = 'apex';
const apodosis = 'apodosis';
const apomixis = 'apomixis';
const aponeurosis = 'aponeurosis';
const apophysis = 'apophysis';
const aposiopesis = 'aposiopesis';
const apothecium = 'apothecium';
const apotheosis = 'apotheosis';
const apparatus = 'apparatus';
const appendix = 'appendix';
const appoggiatura = 'appoggiatura';
const apsis = 'apsis';
const aqua = 'aqua';
const aquarium = 'aquarium';
const argali = 'argali';
const arboretum = 'arboretum';
const arcanum = 'arcanum';
const archegonium = 'archegonium';
const archerfish = 'archerfish';
const archesporium = 'archesporium';
const archipelago = 'archipelago';
const areola = 'areola';
const argumentum = 'argumentum';
const arietta = 'arietta';
const arista = 'arista';
const armamentarium = 'armamentarium';
const arsis = 'arsis';
const rotl = 'rotl';
const arteriosclerosis = 'arteriosclerosis';
const aruspex = 'aruspex';
const ascesis = 'ascesis';
const ascus = 'ascus';
const ascidium = 'ascidium';
const ascogonium = 'ascogonium';
const ash = 'ash';
const ashkenazi = 'ashkenazi';
const aspergillum = 'aspergillum';
const aspergillus = 'aspergillus';
const aspergillosis = 'aspergillosis';
const aspersorium = 'aspersorium';
const assegai = 'assegai';
const astragalus = 'astragalus';
const asyndeton = 'asyndeton';
const atheroma = 'atheroma';
const atherosclerosis = 'atherosclerosis';
const atmolysis = 'atmolysis';
const atrium = 'atrium';
const auditorium = 'auditorium';
const aura = 'aura';
const eyrir = 'eyrir';
const aureus = 'aureus';
const auricula = 'auricula';
const aurora = 'aurora';
const auspice = 'auspice';
const autocatalysis = 'autocatalysis';
const autochthon = 'autochthon';
const automaton = 'automaton';
const avitaminosis = 'avitaminosis';
const ax = 'ax';
const axilla = 'axilla';
const bacchante = 'bacchante';
const bacchius = 'bacchius';
const bacillus = 'bacillus';
const bacteriostasis = 'bacteriostasis';
const baculum = 'baculum';
const ballista = 'ballista';
const bambino = 'bambino';
const bandeau = 'bandeau';
const bandit = 'bandit';
const ban = 'ban';
const banjo = 'banjo';
const barklouse = 'barklouse';
const barramundi = 'barramundi';
const base = 'base';
const basidium = 'basidium';
const basileus = 'basileus';
const basso = 'basso';
const bastinado = 'bastinado';
const bateau = 'bateau';
const batfish = 'batfish';
const beadsman = 'beadsman';
const beau = 'beau';
const beef = 'beef';
const behoof = 'behoof';
const bersagliere = 'bersagliere';
const bhishti = 'bhishti';
const bibliotheca = 'bibliotheca';
const bicentenary = 'bicentenary';
const bijou = 'bijou';
const bilbo = 'bilbo';
const billfish = 'billfish';
const bimbo = 'bimbo';
const bisectrix = 'bisectrix';
const blackfoot = 'blackfoot';
const blackfish = 'blackfish';
const blastema = 'blastema';
const blastula = 'blastula';
const blindfish = 'blindfish';
const blowfish = 'blowfish';
const bluefish = 'bluefish';
const boarfish = 'boarfish';
const boschbok = 'boschbok';
const boletus = 'boletus';
const bolivar = 'bolivar';
const bolshevik = 'bolshevik';
const bonefish = 'bonefish';
const bongo = 'bongo';
const bonito = 'bonito';
const booklouse = 'booklouse';
const bookshelf = 'bookshelf';
const borax = 'borax';
const borborygmus = 'borborygmus';
const bordereau = 'bordereau';
const botargo = 'botargo';
const boxfish = 'boxfish';
const brachium = 'brachium';
const brainchild = 'brainchild';
const branchia = 'branchia';
const brant = 'brant';
const bravado = 'bravado';
const bravo = 'bravo';
const bregma = 'bregma';
const brother = 'brother';
const broadleaf = 'broadleaf';
const bronchus = 'bronchus';
const bryozoan = 'bryozoan';
const bubo = 'bubo';
const bucko = 'bucko';
const bucktooth = 'bucktooth';
const buffalo = 'buffalo';
const bulla = 'bulla';
const bund = 'bund';
const bureau = 'bureau';
const bursa = 'bursa';
const bus = 'bus';
const butterfish = 'butterfish';
const byssus = 'byssus';
const cactus = 'cactus';
const caduceus = 'caduceus';
const caecum = 'caecum';
const caesura = 'caesura';
const calamus = 'calamus';
const calathus = 'calathus';
const calcaneum = 'calcaneum';
const calx = 'calx';
const calculus = 'calculus';
const caldarium = 'caldarium';
const calix = 'calix';
const calico = 'calico';
const callus = 'callus';
const calf = 'calf';
const calyx = 'calyx';
const cambium = 'cambium';
const camera = 'camera';
const canaliculus = 'canaliculus';
const candelabrum = 'candelabrum';
const candlefish = 'candlefish';
const canthus = 'canthus';
const canula = 'canula';
const canzone = 'canzone';
const caput = 'caput';
const capitulum = 'capitulum';
const capriccio = 'capriccio';
const carabiniere = 'carabiniere';
const carbonado = 'carbonado';
const carcinoma = 'carcinoma';
const cargo = 'cargo';
const caryatid = 'caryatid';
const carina = 'carina';
const carolus = 'carolus';
const carpus = 'carpus';
const carpogonium = 'carpogonium';
const caryopsis = 'caryopsis';
const castrato = 'castrato';
const catabasis = 'catabasis';
const cataclasis = 'cataclasis';
const catalo = 'catalo';
const catalysis = 'catalysis';
const catena = 'catena';
const catfish = 'catfish';
const cathar = 'cathar';
const cathexis = 'cathexis';
const cattalo = 'cattalo';
const caudex = 'caudex';
const caulis = 'caulis';
const cavatina = 'cavatina';
const cavefish = 'cavefish';
const cavetto = 'cavetto';
const cecum = 'cecum';
const cella = 'cella';
const cembalo = 'cembalo';
const centesimo = 'centesimo';
const centrum = 'centrum';
const cephalothorax = 'cephalothorax';
const cercaria = 'cercaria';
const cercus = 'cercus';
const cerebellum = 'cerebellum';
const cerebrum = 'cerebrum';
const cervix = 'cervix';
const caestus = 'caestus';
const cesura = 'cesura';
const cheder = 'cheder';
const chaeta = 'chaeta';
const chalaza = 'chalaza';
const hallah = 'hallah';
const chalutz = 'chalutz';
const chapati = 'chapati';
const chapatti = 'chapatti';
const chapeau = 'chapeau';
const chasid = 'chasid';
const chassid = 'chassid';
const chateau = 'chateau';
const chazan = 'chazan';
const chela = 'chela';
const chelicera = 'chelicera';
const cherub = 'cherub';
const chiasma = 'chiasma';
const chiasmus = 'chiasmus';
const child = 'child';
const chilli = 'chilli';
const chitarrone = 'chitarrone';
const chlamys = 'chlamys';
const chondroma = 'chondroma';
const choragus = 'choragus';
const choriambus = 'choriambus';
const chou = 'chou';
const chromonema = 'chromonema';
const chrysalis = 'chrysalis';
const chuvash = 'chuvash';
const ciborium = 'ciborium';
const cicada = 'cicada';
const cicala = 'cicala';
const cicatrix = 'cicatrix';
const cicerone = 'cicerone';
const cicisbeo = 'cicisbeo';
const cilium = 'cilium';
const cimex = 'cimex';
const cinerarium = 'cinerarium';
const cingulum = 'cingulum';
const cirrus = 'cirrus';
const cirrocumulus = 'cirrocumulus';
const cirrostratus = 'cirrostratus';
const cisco = 'cisco';
const cisterna = 'cisterna';
const clarino = 'clarino';
const claro = 'claro';
const clepsydra = 'clepsydra';
const clinandrium = 'clinandrium';
const clingfish = 'clingfish';
const clitellum = 'clitellum';
const cloaca = 'cloaca';
const clostridium = 'clostridium';
const cloverleaf = 'cloverleaf';
const clypeus = 'clypeus';
const coagulum = 'coagulum';
const coalfish = 'coalfish';
const coccus = 'coccus';
const coccyx = 'coccyx';
const cochlea = 'cochlea';
const codfish = 'codfish';
const codex = 'codex';
const coelenteron = 'coelenteron';
const coenurus = 'coenurus';
const cognomen = 'cognomen';
const cognosente = 'cognosente';
const colon = 'colon';
const coleorhiza = 'coleorhiza';
const collegium = 'collegium';
const colloquium = 'colloquium';
const colluvium = 'colluvium';
const collyrium = 'collyrium';
const colossus = 'colossus';
const columbarium = 'columbarium';
const columella = 'columella';
const coma = 'coma';
const comatula = 'comatula';
const comedo = 'comedo';
const comic = 'comic';
const commando = 'commando';
const concertante = 'concertante';
const concerto = 'concerto';
const concertino = 'concertino';
const concha = 'concha';
const condottiere = 'condottiere';
const condyloma = 'condyloma';
const conferva = 'conferva';
const congius = 'congius';
const conidium = 'conidium';
const conjunctiva = 'conjunctiva';
const conquistador = 'conquistador';
const consortium = 'consortium';
const contagium = 'contagium';
const continuum = 'continuum';
const contralto = 'contralto';
const conversazione = 'conversazione';
const convolvulus = 'convolvulus';
const copula = 'copula';
const corbicula = 'corbicula';
const corium = 'corium';
const cornea = 'cornea';
const cornu = 'cornu';
const corona = 'corona';
const corpus = 'corpus';
const corrigendum = 'corrigendum';
const cortex = 'cortex';
const cortina = 'cortina';
const corybant = 'corybant';
const coryphaeus = 'coryphaeus';
const costa = 'costa';
const cothurnus = 'cothurnus';
const couteau = 'couteau';
const cowfish = 'cowfish';
const coxa = 'coxa';
const crambo = 'crambo';
const cranium = 'cranium';
const crasis = 'crasis';
const crawfish = 'crawfish';
const crayfish = 'crayfish';
const credendum = 'credendum';
const crematorium = 'crematorium';
const crescendo = 'crescendo';
const cribellum = 'cribellum';
const crisis = 'crisis';
const crissum = 'crissum';
const crista = 'crista';
const criterion = 'criterion';
const crux = 'crux';
const crus = 'crus';
const crusado = 'crusado';
const cruzado = 'cruzado';
const cry = 'cry';
const ctenidium = 'ctenidium';
const cubiculum = 'cubiculum';
const culex = 'culex';
const culpa = 'culpa';
const cultus = 'cultus';
const cumulus = 'cumulus';
const cumulonimbus = 'cumulonimbus';
const cumulostratus = 'cumulostratus';
const curia = 'curia';
const curriculum = 'curriculum';
const custos = 'custos';
const cutis = 'cutis';
const cuticula = 'cuticula';
const cuttlefish = 'cuttlefish';
const cyclops = 'cyclops';
const cyclosis = 'cyclosis';
const cylix = 'cylix';
const cyma = 'cyma';
const cymatium = 'cymatium';
const cypsela = 'cypsela';
const cysticercus = 'cysticercus';
const dado = 'dado';
const dago = 'dago';
const damselfish = 'damselfish';
const datum = 'datum';
const daimio = 'daimio';
const dealfish = 'dealfish';
const decemvir = 'decemvir';
const decennium = 'decennium';
const decidua = 'decidua';
const definiendum = 'definiendum';
const definiens = 'definiens';
const delphinium = 'delphinium';
const denarius = 'denarius';
const dentalium = 'dentalium';
const dermatosis = 'dermatosis';
const desideratum = 'desideratum';
const desperado = 'desperado';
const devilfish = 'devilfish';
const diaeresis = 'diaeresis';
const diagnosis = 'diagnosis';
const dialysis = 'dialysis';
const diaphysis = 'diaphysis';
const diapophysis = 'diapophysis';
const diarthrosis = 'diarthrosis';
const diastalsis = 'diastalsis';
const diastasis = 'diastasis';
const diastema = 'diastema';
const diathesis = 'diathesis';
const diazo = 'diazo';
const dibbuk = 'dibbuk';
const dichasium = 'dichasium';
const dictum = 'dictum';
const dido = 'dido';
const dieresis = 'dieresis';
const diesis = 'diesis';
const differentia = 'differentia';
const dilettante = 'dilettante';
const diluvium = 'diluvium';
const dingo = 'dingo';
const diplococcus = 'diplococcus';
const discus = 'discus';
const discobolus = 'discobolus';
const diva = 'diva';
const diverticulum = 'diverticulum';
const divertimento = 'divertimento';
const djinny = 'djinny';
const dodo = 'dodo';
const dogfish = 'dogfish';
const dogma = 'dogma';
const dogtooth = 'dogtooth';
const dollarfish = 'dollarfish';
const domatium = 'domatium';
const domino = 'domino';
const dormouse = 'dormouse';
const dorsum = 'dorsum';
const drachma = 'drachma';
const drawknife = 'drawknife';
const drosophila = 'drosophila';
const drumfish = 'drumfish';
const dryad = 'dryad';
const duo = 'duo';
const duodenum = 'duodenum';
const dupondius = 'dupondius';
const duumvir = 'duumvir';
const dwarf = 'dwarf';
const dybbuk = 'dybbuk';
const ecchymosis = 'ecchymosis';
const ecclesia = 'ecclesia';
const ecdysis = 'ecdysis';
const echidna = 'echidna';
const echinus = 'echinus';
const echinococcus = 'echinococcus';
const echo = 'echo';
const ectozoan = 'ectozoan';
const eddo = 'eddo';
const edema = 'edema';
const effluvium = 'effluvium';
const eidolon = 'eidolon';
const eisegesis = 'eisegesis';
const eisteddfod = 'eisteddfod';
const elenchus = 'elenchus';
const ellipsis = 'ellipsis';
const eluvium = 'eluvium';
const elf = 'elf';
const elytrum = 'elytrum';
const embargo = 'embargo';
const embolus = 'embolus';
const emphasis = 'emphasis';
const emporium = 'emporium';
const enarthrosis = 'enarthrosis';
const encephalon = 'encephalon';
const encephalitis = 'encephalitis';
const encephaloma = 'encephaloma';
const enchiridion = 'enchiridion';
const enchondroma = 'enchondroma';
const encomium = 'encomium';
const endameba = 'endameba';
const endamoeba = 'endamoeba';
const endocardium = 'endocardium';
const endocranium = 'endocranium';
const endometrium = 'endometrium';
const endosteum = 'endosteum';
const endostosis = 'endostosis';
const endothecium = 'endothecium';
const endothelium = 'endothelium';
const endothelioma = 'endothelioma';
const endozoan = 'endozoan';
const enema = 'enema';
const enneahedron = 'enneahedron';
const entameba = 'entameba';
const entamoeba = 'entamoeba';
const entasis = 'entasis';
const enteron = 'enteron';
const ens = 'ens';
const entozoan = 'entozoan';
const epencephalon = 'epencephalon';
const epenthesis = 'epenthesis';
const epexegesis = 'epexegesis';
const ephemeron = 'ephemeron';
const ephemera = 'ephemera';
const ephemeris = 'ephemeris';
const ephor = 'ephor';
const epicalyx = 'epicalyx';
const epicanthus = 'epicanthus';
const epicardium = 'epicardium';
const epicedium = 'epicedium';
const epiclesis = 'epiclesis';
const epididymis = 'epididymis';
const epigastrium = 'epigastrium';
const epiglottis = 'epiglottis';
const epimysium = 'epimysium';
const epiphenomenon = 'epiphenomenon';
const epiphysis = 'epiphysis';
const episternum = 'episternum';
const epithalamium = 'epithalamium';
const epithelium = 'epithelium';
const epithelioma = 'epithelioma';
const epizoan = 'epizoan';
const epyllion = 'epyllion';
const equilibrium = 'equilibrium';
const equisetum = 'equisetum';
const eringo = 'eringo';
const erratum = 'erratum';
const eryngo = 'eryngo';
const esophagus = 'esophagus';
const etymon = 'etymon';
const eucalyptus = 'eucalyptus';
const eupatrid = 'eupatrid';
const euripus = 'euripus';
const exanthema = 'exanthema';
const executrix = 'executrix';
const exegesis = 'exegesis';
const exemplum = 'exemplum';
const exordium = 'exordium';
const exostosis = 'exostosis';
const extremum = 'extremum';
const eyetooth = 'eyetooth';
const fabliau = 'fabliau';
const facia = 'facia';
const facula = 'facula';
const faeroese = 'faeroese';
const fallfish = 'fallfish';
const famulus = 'famulus';
const faroese = 'faroese';
const farrago = 'farrago';
const fascia = 'fascia';
const fasciculus = 'fasciculus';
const fatso = 'fatso';
const fauna = 'fauna';
const fecula = 'fecula';
const fedayee = 'fedayee';
const foot = 'foot';
const fellah = 'fellah';
const femur = 'femur';
const fenestella = 'fenestella';
const fenestra = 'fenestra';
const feria = 'feria';
const fermata = 'fermata';
const ferula = 'ferula';
const festschrift = 'festschrift';
const fetial = 'fetial';
const fez = 'fez';
const fiasco = 'fiasco';
const fibrilla = 'fibrilla';
const fibroma = 'fibroma';
const fibula = 'fibula';
const fico = 'fico';
const fideicommissum = 'fideicommissum';
const fieldmouse = 'fieldmouse';
const fig = 'fig';
const filum = 'filum';
const filaria = 'filaria';
const filefish = 'filefish';
const fimbria = 'fimbria';
const fish = 'fish';
const fishwife = 'fishwife';
const fistula = 'fistula';
const flabellum = 'flabellum';
const flagellum = 'flagellum';
const flagstaff = 'flagstaff';
const flambeau = 'flambeau';
const flamen = 'flamen';
const flamingo = 'flamingo';
const flatfoot = 'flatfoot';
const flatfish = 'flatfish';
const flittermouse = 'flittermouse';
const floccus = 'floccus';
const flocculus = 'flocculus';
const flora = 'flora';
const floreat = 'floreat';
const florilegium = 'florilegium';
const flyleaf = 'flyleaf';
const focus = 'focus';
const folium = 'folium';
const forum = 'forum';
const foramen = 'foramen';
const forceps = 'forceps';
const forefoot = 'forefoot';
const foretooth = 'foretooth';
const formicarium = 'formicarium';
const formula = 'formula';
const fornix = 'fornix';
const fortis = 'fortis';
const fossa = 'fossa';
const fovea = 'fovea';
const foveola = 'foveola';
const fractocumulus = 'fractocumulus';
const fractostratus = 'fractostratus';
const fraenum = 'fraenum';
const frau = 'frau';
const frenum = 'frenum';
const frenulum = 'frenulum';
const fresco = 'fresco';
const fricandeau = 'fricandeau';
const fricando = 'fricando';
const frijol = 'frijol';
const frogfish = 'frogfish';
const frons = 'frons';
const frustum = 'frustum';
const fucus = 'fucus';
const fulcrum = 'fulcrum';
const fumatorium = 'fumatorium';
const fundus = 'fundus';
const fungus = 'fungus';
const funiculus = 'funiculus';
const furculum = 'furculum';
const furcula = 'furcula';
const furfur = 'furfur';
const galea = 'galea';
const gambado = 'gambado';
const gametangium = 'gametangium';
const gametoecium = 'gametoecium';
const gammadion = 'gammadion';
const ganglion = 'ganglion';
const garfish = 'garfish';
const gas = 'gas';
const gastrula = 'gastrula';
const gateau = 'gateau';
const gazebo = 'gazebo';
const gecko = 'gecko';
const goose = 'goose';
const gelsemium = 'gelsemium';
const gemsbok = 'gemsbok';
const gemsbuck = 'gemsbuck';
const gemeinschaft = 'gemeinschaft';
const gemma = 'gemma';
const genus = 'genus';
const generatrix = 'generatrix';
const genesis = 'genesis';
const genius = 'genius';
const gens = 'gens';
const genu = 'genu';
const germen = 'germen';
const gesellschaft = 'gesellschaft';
const gestalt = 'gestalt';
const ghetto = 'ghetto';
const gingiva = 'gingiva';
const gingko = 'gingko';
const ginglymus = 'ginglymus';
const ginkgo = 'ginkgo';
const gippo = 'gippo';
const glabella = 'glabella';
const gladiolus = 'gladiolus';
const glans = 'glans';
const glioma = 'glioma';
const glissando = 'glissando';
const globefish = 'globefish';
const globigerina = 'globigerina';
const glochidium = 'glochidium';
const glomerulus = 'glomerulus';
const glossa = 'glossa';
const glottis = 'glottis';
const glutaeus = 'glutaeus';
const gluteus = 'gluteus';
const gnosis = 'gnosis';
const goatfish = 'goatfish';
const gobo = 'gobo';
const godchild = 'godchild';
const go = 'go';
const goldfish = 'goldfish';
const gomphosis = 'gomphosis';
const gonion = 'gonion';
const gonidium = 'gonidium';
const gonococcus = 'gonococcus';
const goodwife = 'goodwife';
const goosefish = 'goosefish';
const gorgoneion = 'gorgoneion';
const gospodin = 'gospodin';
const goy = 'goy';
const gps = 'gps';
const graf = 'graf';
const graffito = 'graffito';
const grandchild = 'grandchild';
const granuloma = 'granuloma';
const gravamen = 'gravamen';
const grosz = 'grosz';
const grotto = 'grotto';
const guilde = 'guilde';
const guitarfish = 'guitarfish';
const gumma = 'gumma';
const gurnar = 'gurnar';
const gutta = 'gutta';
const gymnasium = 'gymnasium';
const gynaeceum = 'gynaeceum';
const gynaecium = 'gynaecium';
const gynecium = 'gynecium';
const gynoecium = 'gynoecium';
const gyrus = 'gyrus';
const heder = 'heder';
const hadj = 'hadj';
const haematolysis = 'haematolysis';
const haematoma = 'haematoma';
const haematozoon = 'haematozoon';
const haemodialysis = 'haemodialysis';
const haemolysis = 'haemolysis';
const haemoptysis = 'haemoptysis';
const haeres = 'haeres';
const haftarah = 'haftarah';
const hagfish = 'hagfish';
const haggadah = 'haggadah';
const haggada = 'haggada';
const hajj = 'hajj';
const haler = 'haler';
const halfpenny = 'halfpenny';
const hallux = 'hallux';
const halo = 'halo';
const halter = 'halter';
const half = 'half';
const hamulus = 'hamulus';
const haphtarah = 'haphtarah';
const haredi = 'haredi';
const haruspex = 'haruspex';
const hasid = 'hasid';
const hassid = 'hassid';
const haustellum = 'haustellum';
const haustorium = 'haustorium';
const hazzan = 'hazzan';
const hectocotylus = 'hectocotylus';
const heldentenor = 'heldentenor';
const helix = 'helix';
const heliozoan = 'heliozoan';
const hematolysis = 'hematolysis';
const hematoma = 'hematoma';
const hematozoon = 'hematozoon';
const hemelytron = 'hemelytron';
const hemielytron = 'hemielytron';
const hemodialysis = 'hemodialysis';
const hemolysis = 'hemolysis';
const hemoptysis = 'hemoptysis';
const hendecahedron = 'hendecahedron';
const heraclid = 'heraclid';
const heraklid = 'heraklid';
const herbarium = 'herbarium';
const herma = 'herma';
const hernia = 'hernia';
const hero = 'hero';
const herr = 'herr';
const hetaera = 'hetaera';
const hetaira = 'hetaira';
const hibernaculum = 'hibernaculum';
const hieracosphinx = 'hieracosphinx';
const hilum = 'hilum';
const hilus = 'hilus';
const himation = 'himation';
const hippocampus = 'hippocampus';
const hippopotamus = 'hippopotamus';
const his = 'his';
const hobo = 'hobo';
const hogfish = 'hogfish';
const homunculus = 'homunculus';
const honorarium = 'honorarium';
const hoof = 'hoof';
const horologium = 'horologium';
const housewife = 'housewife';
const humerus = 'humerus';
const hydra = 'hydra';
const hydromedusa = 'hydromedusa';
const hydrozoan = 'hydrozoan';
const hymenopteran = 'hymenopteran';
const hymenium = 'hymenium';
const hypanthium = 'hypanthium';
const hyperostosis = 'hyperostosis';
const hypha = 'hypha';
const hypnosis = 'hypnosis';
const hypochondrium = 'hypochondrium';
const hypogastrium = 'hypogastrium';
const hypogeum = 'hypogeum';
const hypophysis = 'hypophysis';
const hypostasis = 'hypostasis';
const hypothalamus = 'hypothalamus';
const hypothesis = 'hypothesis';
const hyrax = 'hyrax';
const iamb = 'iamb';
const ibex = 'ibex';
const igbo = 'igbo';
const ichthyosaurus = 'ichthyosaurus';
const ichthyosaur = 'ichthyosaur';
const iconostas = 'iconostas';
const icosahedron = 'icosahedron';
const ideatum = 'ideatum';
const igorrote = 'igorrote';
const ilium = 'ilium';
const imago = 'imago';
const imperium = 'imperium';
const impi = 'impi';
const incubus = 'incubus';
const incus = 'incus';
const index = 'index';
const indigo = 'indigo';
const indumentum = 'indumentum';
const indusium = 'indusium';
const infundibulum = 'infundibulum';
const ingush = 'ingush';
const innuendo = 'innuendo';
const inoculum = 'inoculum';
const insectarium = 'insectarium';
const insula = 'insula';
const intaglio = 'intaglio';
const interleaf = 'interleaf';
const intermezzo = 'intermezzo';
const interrex = 'interrex';
const interregnum = 'interregnum';
const intima = 'intima';
const involucellum = 'involucellum';
const involucrum = 'involucrum';
const iris = 'iris';
const irs = 'irs';
const is = 'is';
const ischium = 'ischium';
const isthmus = 'isthmus';
const jackeroo = 'jackeroo';
const jackfish = 'jackfish';
const jackknife = 'jackknife';
const jambeau = 'jambeau';
const jellyfish = 'jellyfish';
const jewelfish = 'jewelfish';
const jewfish = 'jewfish';
const jingo = 'jingo';
const jinni = 'jinni';
const joe = 'joe';
const jus = 'jus';
const kaddish = 'kaddish';
const kalmuc = 'kalmuc';
const katabasis = 'katabasis';
const keeshond = 'keeshond';
const kibbutz = 'kibbutz';
const killifish = 'killifish';
const kingfish = 'kingfish';
const knife = 'knife';
const kohlrabi = 'kohlrabi';
const krone = 'krone';
const krona = 'krona';
const kroon = 'kroon';
const kylix = 'kylix';
const labarum = 'labarum';
const labellum = 'labellum';
const labium = 'labium';
const labrum = 'labrum';
const lactobacillus = 'lactobacillus';
const lacuna = 'lacuna';
const lacunar = 'lacunar';
const lamella = 'lamella';
const lamia = 'lamia';
const lamina = 'lamina';
const lapillus = 'lapillus';
const lapith = 'lapith';
const larva = 'larva';
const larynx = 'larynx';
const lasso = 'lasso';
const lat = 'lat';
const latex = 'latex';
const latifundium = 'latifundium';
const lavabo = 'lavabo';
const leaf = 'leaf';
const lecythus = 'lecythus';
const lex = 'lex';
const leu = 'leu';
const lemma = 'lemma';
const lemniscus = 'lemniscus';
const lenis = 'lenis';
const lentigo = 'lentigo';
const leonid = 'leonid';
const lepidopteran = 'lepidopteran';
const leprosarium = 'leprosarium';
const lepton = 'lepton';
const leptocephalus = 'leptocephalus';
const leucocytozoan = 'leucocytozoan';
const lev = 'lev';
const libra = 'libra';
const libretto = 'libretto';
const louse = 'louse';
const lied = 'lied';
const ligula = 'ligula';
const limbus = 'limbus';
const limen = 'limen';
const limes = 'limes';
const limulus = 'limulus';
const lingo = 'lingo';
const lingua = 'lingua';
const lionfish = 'lionfish';
const lipoma = 'lipoma';
const lira = 'lira';
const liriodendron = 'liriodendron';
const sente = 'sente';
const litas = 'litas';
const life = 'life';
const lixivium = 'lixivium';
const loaf = 'loaf';
const locus = 'locus';
const loculus = 'loculus';
const loggia = 'loggia';
const logion = 'logion';
const lomentum = 'lomentum';
const longobard = 'longobard';
const lorica = 'lorica';
const luba = 'luba';
const lubritorium = 'lubritorium';
const lumbus = 'lumbus';
const lumen = 'lumen';
const lumpfish = 'lumpfish';
const lungfish = 'lungfish';
const lunula = 'lunula';
const lure = 'lure';
const lustre = 'lustre';
const lymphangitis = 'lymphangitis';
const lymphoma = 'lymphoma';
const lymphopoiesis = 'lymphopoiesis';
const lysis = 'lysis';
const lytta = 'lytta';
const maar = 'maar';
const macaroni = 'macaroni';
const maccaroni = 'maccaroni';
const machzor = 'machzor';
const macronucleus = 'macronucleus';
const macrosporangium = 'macrosporangium';
const macula = 'macula';
const madrono = 'madrono';
const maestro = 'maestro';
const mafioso = 'mafioso';
const magus = 'magus';
const magma = 'magma';
const magnifico = 'magnifico';
const mahzor = 'mahzor';
const likuta = 'likuta';
const malleus = 'malleus';
const malleolus = 'malleolus';
const loti = 'loti';
const mamilla = 'mamilla';
const mamma = 'mamma';
const mammilla = 'mammilla';
const mandingo = 'mandingo';
const mango = 'mango';
const manifesto = 'manifesto';
const manteau = 'manteau';
const mantis = 'mantis';
const manubrium = 'manubrium';
const marchesa = 'marchesa';
const marchese = 'marchese';
const maremma = 'maremma';
const markka = 'markka';
const marsupium = 'marsupium';
const matrix = 'matrix';
const matzo = 'matzo';
const mausoleum = 'mausoleum';
const maxilla = 'maxilla';
const maximum = 'maximum';
const medium = 'medium';
const media = 'media';
const mediastinum = 'mediastinum';
const medulla = 'medulla';
const medusa = 'medusa';
const megaron = 'megaron';
const megasporangium = 'megasporangium';
const megillah = 'megillah';
const meiosis = 'meiosis';
const melanoma = 'melanoma';
const melisma = 'melisma';
const memento = 'memento';
const memorandum = 'memorandum';
const man = 'man';
const meniscus = 'meniscus';
const manservant = 'manservant';
const menstruum = 'menstruum';
const madame = 'madame';
const mademoiselle = 'mademoiselle';
const mesenteron = 'mesenteron';
const mesothorax = 'mesothorax';
const monseigneur = 'monseigneur';
const monsieur = 'monsieur';
const mestizo = 'mestizo';
const metacarpus = 'metacarpus';
const metamorphosis = 'metamorphosis';
const metanephros = 'metanephros';
const metastasis = 'metastasis';
const metatarsus = 'metatarsus';
const metathesis = 'metathesis';
const metathorax = 'metathorax';
const metazoan = 'metazoan';
const metempsychosis = 'metempsychosis';
const metencephalon = 'metencephalon';
const mezuzah = 'mezuzah';
const miasma = 'miasma';
const mouse = 'mouse';
const microanalysis = 'microanalysis';
const micrococcus = 'micrococcus';
const micronucleus = 'micronucleus';
const microsporangium = 'microsporangium';
const midrash = 'midrash';
const midwife = 'midwife';
const milium = 'milium';
const milieu = 'milieu';
const milkfish = 'milkfish';
const millennium = 'millennium';
const mina = 'mina';
const minimum = 'minimum';
const ministerium = 'ministerium';
const minutia = 'minutia';
const minyan = 'minyan';
const miosis = 'miosis';
const miracidium = 'miracidium';
const mir = 'mir';
const mitochondrion = 'mitochondrion';
const mitzvah = 'mitzvah';
const modiolus = 'modiolus';
const modulus = 'modulus';
const momentum = 'momentum';
const momus = 'momus';
const monad = 'monad';
const monkfish = 'monkfish';
const monochasium = 'monochasium';
const monopodium = 'monopodium';
const monopteron = 'monopteron';
const monopteros = 'monopteros';
const monsignor = 'monsignor';
const mooncalf = 'mooncalf';
const moonfish = 'moonfish';
const mora = 'mora';
const moratorium = 'moratorium';
const morceau = 'morceau';
const moresco = 'moresco';
const morisco = 'morisco';
const morphallaxis = 'morphallaxis';
const morphosis = 'morphosis';
const morula = 'morula';
const mosasaurus = 'mosasaurus';
const moshav = 'moshav';
const moslem = 'moslem';
const mosquito = 'mosquito';
const motto = 'motto';
const mucosa = 'mucosa';
const mucro = 'mucro';
const mudejar = 'mudejar';
const mudfish = 'mudfish';
const mulatto = 'mulatto';
const multipara = 'multipara';
const murex = 'murex';
const muskellunge = 'muskellunge';
const mycelium = 'mycelium';
const mycetoma = 'mycetoma';
const mycobacterium = 'mycobacterium';
const mycorrhiza = 'mycorrhiza';
const myelencephalon = 'myelencephalon';
const myiasis = 'myiasis';
const myocardium = 'myocardium';
const myofibrilla = 'myofibrilla';
const myoma = 'myoma';
const myosis = 'myosis';
const myrmidon = 'myrmidon';
const mythos = 'mythos';
const myxoma = 'myxoma';
const naevus = 'naevus';
const naiad = 'naiad';
const naos = 'naos';
const narcissus = 'narcissus';
const naris = 'naris';
const nasopharynx = 'nasopharynx';
const natatorium = 'natatorium';
const naumachia = 'naumachia';
const nauplius = 'nauplius';
const nautilus = 'nautilus';
const navaho = 'navaho';
const navajo = 'navajo';
const nebula = 'nebula';
const necropolis = 'necropolis';
const needlefish = 'needlefish';
const negrillo = 'negrillo';
const negrito = 'negrito';
const negro = 'negro';
const nemesis = 'nemesis';
const nephridium = 'nephridium';
const nereid = 'nereid';
const neurohypophysis = 'neurohypophysis';
const neuroma = 'neuroma';
const neuropteron = 'neuropteron';
const neurosis = 'neurosis';
const nevus = 'nevus';
const nibelung = 'nibelung';
const nidus = 'nidus';
const niello = 'niello';
const nilgai = 'nilgai';
const nimbus = 'nimbus';
const nimbostratus = 'nimbostratus';
const noctiluca = 'noctiluca';
const nodus = 'nodus';
const no = 'no';
const nomen = 'nomen';
const notum = 'notum';
const noumenon = 'noumenon';
const nova = 'nova';
const novella = 'novella';
const novena = 'novena';
const nubecula = 'nubecula';
const nucellus = 'nucellus';
const nucha = 'nucha';
const nucleus = 'nucleus';
const nucleolus = 'nucleolus';
const nullipara = 'nullipara';
const numbfish = 'numbfish';
const numen = 'numen';
const nympha = 'nympha';
const oarfish = 'oarfish';
const oasis = 'oasis';
const obelus = 'obelus';
const obligato = 'obligato';
const obolus = 'obolus';
const occiput = 'occiput';
const oceanarium = 'oceanarium';
const oceanid = 'oceanid';
const ocellus = 'ocellus';
const ochrea = 'ochrea';
const ocrea = 'ocrea';
const octahedron = 'octahedron';
const octopus = 'octopus';
const oculus = 'oculus';
const odeum = 'odeum';
const oedema = 'oedema';
const oesophagus = 'oesophagus';
const oldwife = 'oldwife';
const oleum = 'oleum';
const omasum = 'omasum';
const omayyad = 'omayyad';
const omentum = 'omentum';
const ommatidium = 'ommatidium';
const ommiad = 'ommiad';
const onager = 'onager';
const oogonium = 'oogonium';
const ootheca = 'ootheca';
const operculum = 'operculum';
const optimum = 'optimum';
const os = 'os';
const organum = 'organum';
const organa = 'organa';
const orthopteron = 'orthopteron';
const osculum = 'osculum';
const osteoma = 'osteoma';
const ostium = 'ostium';
const ottoman = 'ottoman';
const ovum = 'ovum';
const ovolo = 'ovolo';
const ovotestis = 'ovotestis';
const ox = 'ox';
const oxymoron = 'oxymoron';
const paddlefish = 'paddlefish';
const paisa = 'paisa';
const palea = 'palea';
const palestra = 'palestra';
const palingenesis = 'palingenesis';
const pallium = 'pallium';
const palmetto = 'palmetto';
const palpus = 'palpus';
const pancratium = 'pancratium';
const panettone = 'panettone';
const paparazzo = 'paparazzo';
const paperknife = 'paperknife';
const papilla = 'papilla';
const papilloma = 'papilloma';
const pappus = 'pappus';
const papula = 'papula';
const papyrus = 'papyrus';
const parabasis = 'parabasis';
const paraleipsis = 'paraleipsis';
const paralysis = 'paralysis';
const paramecium = 'paramecium';
const parament = 'parament';
const paraphysis = 'paraphysis';
const parapodium = 'parapodium';
const parapraxis = 'parapraxis';
const paraselene = 'paraselene';
const parashah = 'parashah';
const parasyntheton = 'parasyntheton';
const parazoan = 'parazoan';
const parenthesis = 'parenthesis';
const parergon = 'parergon';
const parhelion = 'parhelion';
const paries = 'paries';
const parrotfish = 'parrotfish';
const parulis = 'parulis';
const pastorale = 'pastorale';
const patagium = 'patagium';
const patella = 'patella';
const patina = 'patina';
const paterfamilias = 'paterfamilias';
const pea = 'pea';
const peccadillo = 'peccadillo';
const pecten = 'pecten';
const pedalo = 'pedalo';
const pes = 'pes';
const pekinese = 'pekinese';
const pelvis = 'pelvis';
const penny = 'penny';
const penis = 'penis';
const penetralium = 'penetralium';
const penicillium = 'penicillium';
const penknife = 'penknife';
const penna = 'penna';
const penni = 'penni';
const pentahedron = 'pentahedron';
const pentimento = 'pentimento';
const penumbra = 'penumbra';
const peplum = 'peplum';
const pericardium = 'pericardium';
const perichondrium = 'perichondrium';
const pericranium = 'pericranium';
const peridium = 'peridium';
const perigonium = 'perigonium';
const perihelion = 'perihelion';
const perineum = 'perineum';
const perinephrium = 'perinephrium';
const perionychium = 'perionychium';
const periosteum = 'periosteum';
const periphrasis = 'periphrasis';
const peristalsis = 'peristalsis';
const perithecium = 'perithecium';
const peritoneum = 'peritoneum';
const persona = 'persona';
const petechia = 'petechia';
const pfennig = 'pfennig';
const phalanx = 'phalanx';
const phallus = 'phallus';
const pharynx = 'pharynx';
const phenomenon = 'phenomenon';
const philodendron = 'philodendron';
const phlyctena = 'phlyctena';
const phylum = 'phylum';
const phyle = 'phyle';
const phyllotaxis = 'phyllotaxis';
const phylloxera = 'phylloxera';
const phylogenesis = 'phylogenesis';
const pigfish = 'pigfish';
const pileum = 'pileum';
const pileus = 'pileus';
const pinetum = 'pinetum';
const pinfish = 'pinfish';
const pinko = 'pinko';
const pinna = 'pinna';
const pinnula = 'pinnula';
const pipefish = 'pipefish';
const pirog = 'pirog';
const piscina = 'piscina';
const pithecanthropus = 'pithecanthropus';
const pithos = 'pithos';
const placebo = 'placebo';
const placenta = 'placenta';
const planetarium = 'planetarium';
const planula = 'planula';
const plasmodesma = 'plasmodesma';
const plasmodium = 'plasmodium';
const plateau = 'plateau';
const plectrum = 'plectrum';
const plenum = 'plenum';
const pleuron = 'pleuron';
const pleura = 'pleura';
const plica = 'plica';
const ploughman = 'ploughman';
const pneumobacillus = 'pneumobacillus';
const pneumococcus = 'pneumococcus';
const pocketknife = 'pocketknife';
const podetium = 'podetium';
const podium = 'podium';
const polis = 'polis';
const pollex = 'pollex';
const pollinium = 'pollinium';
const polychasium = 'polychasium';
const polyhedron = 'polyhedron';
const polyparium = 'polyparium';
const polypus = 'polypus';
const polyzoan = 'polyzoan';
const polyzoarium = 'polyzoarium';
const pons = 'pons';
const pontifex = 'pontifex';
const portamento = 'portamento';
const portico = 'portico';
const portmanteau = 'portmanteau';
const postliminium = 'postliminium';
const potato = 'potato';
const praenomen = 'praenomen';
const praxis = 'praxis';
const predella = 'predella';
const premaxilla = 'premaxilla';
const prenomen = 'prenomen';
const presa = 'presa';
const primo = 'primo';
const primigravida = 'primigravida';
const primipara = 'primipara';
const primordium = 'primordium';
const principium = 'principium';
const proboscis = 'proboscis';
const proglottis = 'proglottis';
const prognosis = 'prognosis';
const prolegomenon = 'prolegomenon';
const prolepsis = 'prolepsis';
const promycelium = 'promycelium';
const pronephros = 'pronephros';
const pronucleus = 'pronucleus';
const propositus = 'propositus';
const proptosis = 'proptosis';
const propylon = 'propylon';
const propylaeum = 'propylaeum';
const proscenium = 'proscenium';
const prosencephalon = 'prosencephalon';
const prosthesis = 'prosthesis';
const prostomium = 'prostomium';
const protasis = 'protasis';
const prothalamium = 'prothalamium';
const prothallus = 'prothallus';
const prothallium = 'prothallium';
const prothorax = 'prothorax';
const protonema = 'protonema';
const protozoan = 'protozoan';
const proventriculus = 'proventriculus';
const proviso = 'proviso';
const prytaneum = 'prytaneum';
const psalterium = 'psalterium';
const pseudopodium = 'pseudopodium';
const psychoneurosis = 'psychoneurosis';
const psychosis = 'psychosis';
const pterygium = 'pterygium';
const pteryla = 'pteryla';
const ptosis = 'ptosis';
const pubis = 'pubis';
const pudendum = 'pudendum';
const pul = 'pul';
const pulvillus = 'pulvillus';
const pulvinus = 'pulvinus';
const punchinello = 'punchinello';
const pupa = 'pupa';
const puparium = 'puparium';
const putamen = 'putamen';
const putto = 'putto';
const pycnidium = 'pycnidium';
const pygidium = 'pygidium';
const pylorus = 'pylorus';
const pyxis = 'pyxis';
const pyxidium = 'pyxidium';
const qaddish = 'qaddish';
const quadrennium = 'quadrennium';
const quadriga = 'quadriga';
const quale = 'quale';
const quantum = 'quantum';
const quarterstaff = 'quarterstaff';
const quezal = 'quezal';
const quinquennium = 'quinquennium';
const quiz = 'quiz';
const rabato = 'rabato';
const rabbitfish = 'rabbitfish';
const rhachis = 'rhachis';
const radix = 'radix';
const radius = 'radius';
const radula = 'radula';
const ramentum = 'ramentum';
const ramus = 'ramus';
const ranula = 'ranula';
const ranunculus = 'ranunculus';
const raphe = 'raphe';
const raphide = 'raphide';
const ratfish = 'ratfish';
const real = 'real';
const rearmouse = 'rearmouse';
const rectum = 'rectum';
const rectus = 'rectus';
const rectrix = 'rectrix';
const redfish = 'redfish';
const redia = 'redia';
const referendum = 'referendum';
const refugium = 'refugium';
const regulus = 'regulus';
const relatum = 'relatum';
const remex = 'remex';
const reremouse = 'reremouse';
const reseau = 'reseau';
const residuum = 'residuum';
const responsum = 'responsum';
const rete = 'rete';
const retiarius = 'retiarius';
const reticulum = 'reticulum';
const retinaculum = 'retinaculum';
const retina = 'retina';
const rhabdomyoma = 'rhabdomyoma';
const rachis = 'rachis';
const rhinencephalon = 'rhinencephalon';
const rhizobium = 'rhizobium';
const rhombus = 'rhombus';
const rhonchus = 'rhonchus';
const rhyton = 'rhyton';
const ribbonfish = 'ribbonfish';
const ricercare = 'ricercare';
const rickettsia = 'rickettsia';
const rilievo = 'rilievo';
const rima = 'rima';
const rockfish = 'rockfish';
const rom = 'rom';
const rondeau = 'rondeau';
const rosarium = 'rosarium';
const rosefish = 'rosefish';
const rostellum = 'rostellum';
const rostrum = 'rostrum';
const rouleau = 'rouleau';
const ruga = 'ruga';
const rumen = 'rumen';
const sacrum = 'sacrum';
const sacrarium = 'sacrarium';
const saguaro = 'saguaro';
const sailfish = 'sailfish';
const salesperson = 'salesperson';
const salmonella = 'salmonella';
const salpa = 'salpa';
const salpinx = 'salpinx';
const saltarello = 'saltarello';
const salvo = 'salvo';
const sanctum = 'sanctum';
const sanitarium = 'sanitarium';
const santims = 'santims';
const saphena = 'saphena';
const sarcophagus = 'sarcophagus';
const sartorius = 'sartorius';
const sassanid = 'sassanid';
const sawfish = 'sawfish';
const scaldfish = 'scaldfish';
const scalenus = 'scalenus';
const scapula = 'scapula';
const scarabaeus = 'scarabaeus';
const scarf = 'scarf';
const schatchen = 'schatchen';
const schema = 'schema';
const scherzando = 'scherzando';
const scherzo = 'scherzo';
const schmo = 'schmo';
const scholium = 'scholium';
const schul = 'schul';
const schutzstaffel = 'schutzstaffel';
const scirrhus = 'scirrhus';
const scleroma = 'scleroma';
const sclerosis = 'sclerosis';
const sclerotium = 'sclerotium';
const scolex = 'scolex';
const scopula = 'scopula';
const scoria = 'scoria';
const scotoma = 'scotoma';
const scriptorium = 'scriptorium';
const scrotum = 'scrotum';
const scudo = 'scudo';
const scutum = 'scutum';
const scutellum = 'scutellum';
const scyphus = 'scyphus';
const scyphistoma = 'scyphistoma';
const scyphozoan = 'scyphozoan';
const secondo = 'secondo';
const segno = 'segno';
const seleucid = 'seleucid';
const self = 'self';
const senor = 'senor';
const sensillum = 'sensillum';
const sent = 'sent';
const senussi = 'senussi';
const separatrix = 'separatrix';
const sephardi = 'sephardi';
const septum = 'septum';
const septarium = 'septarium';
const septennium = 'septennium';
const sequela = 'sequela';
const sequestrum = 'sequestrum';
const serum = 'serum';
const seraph = 'seraph';
const sestertium = 'sestertium';
const seta = 'seta';
const sgraffito = 'sgraffito';
const shabbas = 'shabbas';
const shabbat = 'shabbat';
const shacko = 'shacko';
const shadchan = 'shadchan';
const shako = 'shako';
const shammes = 'shammes';
const sheatfish = 'sheatfish';
const sheaf = 'sheaf';
const shellfish = 'shellfish';
const shelf = 'shelf';
const shinleaf = 'shinleaf';
const shittah = 'shittah';
const shmo = 'shmo';
const shophar = 'shophar';
const shrewmouse = 'shrewmouse';
const shul = 'shul';
const siddur = 'siddur';
const siglos = 'siglos';
const signora = 'signora';
const signore = 'signore';
const signorina = 'signorina';
const siliqua = 'siliqua';
const silva = 'silva';
const silverfish = 'silverfish';
const simulacrum = 'simulacrum';
const sinciput = 'sinciput';
const sinfonia = 'sinfonia';
const sistrum = 'sistrum';
const situla = 'situla';
const smalto = 'smalto';
const snaggletooth = 'snaggletooth';
const snailfish = 'snailfish';
const snipefish = 'snipefish';
const socman = 'socman';
const solum = 'solum';
const solarium = 'solarium';
const solatium = 'solatium';
const soldo = 'soldo';
const sol = 'sol';
const solfeggio = 'solfeggio';
const solo = 'solo';
const solidus = 'solidus';
const soma = 'soma';
const soprano = 'soprano';
const sordino = 'sordino';
const sorus = 'sorus';
const sorosis = 'sorosis';
const sovkhoz = 'sovkhoz';
const spadefish = 'spadefish';
const spadix = 'spadix';
const spearfish = 'spearfish';
const spectrum = 'spectrum';
const speculum = 'speculum';
const spermatium = 'spermatium';
const spermatogonium = 'spermatogonium';
const spermatozoon = 'spermatozoon';
const spermogonium = 'spermogonium';
const sphinx = 'sphinx';
const spica = 'spica';
const spiculum = 'spiculum';
const spirillum = 'spirillum';
const splayfoot = 'splayfoot';
const splenius = 'splenius';
const sporangium = 'sporangium';
const sporogonium = 'sporogonium';
const sporozoan = 'sporozoan';
const springhaas = 'springhaas';
const spumone = 'spumone';
const sputum = 'sputum';
const squama = 'squama';
const squash = 'squash';
const squilla = 'squilla';
const squirrelfish = 'squirrelfish';
const squiz = 'squiz';
const stadium = 'stadium';
const stamen = 'stamen';
const staminodium = 'staminodium';
const stapes = 'stapes';
const staphylococcus = 'staphylococcus';
const starets = 'starets';
const starfish = 'starfish';
const stele = 'stele';
const stemma = 'stemma';
const stenosis = 'stenosis';
const stepchild = 'stepchild';
const sternum = 'sternum';
const stigma = 'stigma';
const stimulus = 'stimulus';
const stipes = 'stipes';
const stirps = 'stirps';
const stoa = 'stoa';
const stockfish = 'stockfish';
const stoma = 'stoma';
const stomodaeum = 'stomodaeum';
const stomodeum = 'stomodeum';
const stonefish = 'stonefish';
const stotinka = 'stotinka';
const strappado = 'strappado';
const stratum = 'stratum';
const stratus = 'stratus';
const stratocumulus = 'stratocumulus';
const streptococcus = 'streptococcus';
const stretto = 'stretto';
const stria = 'stria';
const strobilus = 'strobilus';
const stroma = 'stroma';
const struma = 'struma';
const stucco = 'stucco';
const stylus = 'stylus';
const stylops = 'stylops';
const stylopodium = 'stylopodium';
const subcortex = 'subcortex';
const subdelirium = 'subdelirium';
const subgenus = 'subgenus';
const subindex = 'subindex';
const submucosa = 'submucosa';
const subphylum = 'subphylum';
const substratum = 'substratum';
const succedaneum = 'succedaneum';
const succubus = 'succubus';
const suckerfish = 'suckerfish';
const suckfish = 'suckfish';
const sudarium = 'sudarium';
const sudatorium = 'sudatorium';
const sulcus = 'sulcus';
const summa = 'summa';
const sunfish = 'sunfish';
const supercargo = 'supercargo';
const superhero = 'superhero';
const supernova = 'supernova';
const superstratum = 'superstratum';
const surgeonfish = 'surgeonfish';
const swami = 'swami';
const sweetiewife = 'sweetiewife';
const swellfish = 'swellfish';
const swordfish = 'swordfish';
const syconium = 'syconium';
const syllabus = 'syllabus';
const syllepsis = 'syllepsis';
const symphysis = 'symphysis';
const sympodium = 'sympodium';
const symposium = 'symposium';
const synapsis = 'synapsis';
const synarthrosis = 'synarthrosis';
const synclinorium = 'synclinorium';
const syncytium = 'syncytium';
const syndesmosis = 'syndesmosis';
const synopsis = 'synopsis';
const syntagma = 'syntagma';
const synthesis = 'synthesis';
const syphiloma = 'syphiloma';
const syrinx = 'syrinx';
const syssarcosis = 'syssarcosis';
const tableau = 'tableau';
const taenia = 'taenia';
const talus = 'talus';
const tallith = 'tallith';
const tapetum = 'tapetum';
const tarantula = 'tarantula';
const tarsus = 'tarsus';
const tarsometatarsus = 'tarsometatarsus';
const taxon = 'taxon';
const tax = 'tax';
const taxi = 'taxi';
const tectrix = 'tectrix';
const tooth = 'tooth';
const tegmen = 'tegmen';
const tela = 'tela';
const telamon = 'telamon';
const telangiectasia = 'telangiectasia';
const telium = 'telium';
const tempo = 'tempo';
const tenaculum = 'tenaculum';
const tenderfoot = 'tenderfoot';
const tenia = 'tenia';
const tenuis = 'tenuis';
const teraph = 'teraph';
const teras = 'teras';
const teredo = 'teredo';
const tergum = 'tergum';
const terminus = 'terminus';
const terrarium = 'terrarium';
const terzetto = 'terzetto';
const tessera = 'tessera';
const testa = 'testa';
const testis = 'testis';
const testudo = 'testudo';
const tetrahedron = 'tetrahedron';
const tetraskelion = 'tetraskelion';
const thalamencephalon = 'thalamencephalon';
const thalamus = 'thalamus';
const thallus = 'thallus';
const theca = 'theca';
const thyrse = 'thyrse';
const thesaurus = 'thesaurus';
const thesis = 'thesis';
const thickleaf = 'thickleaf';
const thief = 'thief';
const tholos = 'tholos';
const thorax = 'thorax';
const thrombus = 'thrombus';
const thymus = 'thymus';
const thyrsus = 'thyrsus';
const tibia = 'tibia';
const tilefish = 'tilefish';
const tintinnabulum = 'tintinnabulum';
const titmouse = 'titmouse';
const toadfish = 'toadfish';
const tobacco = 'tobacco';
const tomato = 'tomato';
const tomentum = 'tomentum';
const tondo = 'tondo';
const tonneau = 'tonneau';
const tophus = 'tophus';
const topos = 'topos';
const torus = 'torus';
const tornado = 'tornado';
const torpedo = 'torpedo';
const torso = 'torso';
const touraco = 'touraco';
const trabecula = 'trabecula';
const trachea = 'trachea';
const traditor = 'traditor';
const tragus = 'tragus';
const trapezium = 'trapezium';
const trapezohedron = 'trapezohedron';
const trauma = 'trauma';
const treponema = 'treponema';
const trichina = 'trichina';
const triclinium = 'triclinium';
const triennium = 'triennium';
const triforium = 'triforium';
const triggerfish = 'triggerfish';
const trihedron = 'trihedron';
const triskelion = 'triskelion';
const trisoctahedron = 'trisoctahedron';
const triumvir = 'triumvir';
const trivium = 'trivium';
const trochlea = 'trochlea';
const tropaeolum = 'tropaeolum';
const trousseau = 'trousseau';
const trunkfish = 'trunkfish';
const tryma = 'tryma';
const tuba = 'tuba';
const turf = 'turf';
const tympanum = 'tympanum';
const tyro = 'tyro';
const ubermensch = 'ubermensch';
const ugli = 'ugli';
const uighur = 'uighur';
const ulna = 'ulna';
const ultimatum = 'ultimatum';
const umbilicus = 'umbilicus';
const umbo = 'umbo';
const umbra = 'umbra';
const uncus = 'uncus';
const uredium = 'uredium';
const uredo = 'uredo';
const uredinium = 'uredinium';
const uredosorus = 'uredosorus';
const urethra = 'urethra';
const urinalysis = 'urinalysis';
const uterus = 'uterus';
const utriculus = 'utriculus';
const uvula = 'uvula';
const vacuum = 'vacuum';
const vagus = 'vagus';
const vagina = 'vagina';
const vallecula = 'vallecula';
const vaporetto = 'vaporetto';
const varix = 'varix';
const vas = 'vas';
const vasculum = 'vasculum';
const velum = 'velum';
const velamen = 'velamen';
const velarium = 'velarium';
const vena = 'vena';
const ventriculus = 'ventriculus';
const vermis = 'vermis';
const verruca = 'verruca';
const vertebra = 'vertebra';
const vertex = 'vertex';
const vertigo = 'vertigo';
const vesica = 'vesica';
const veto = 'veto';
const vexillum = 'vexillum';
const viaticum = 'viaticum';
const viator = 'viator';
const vibraculum = 'vibraculum';
const vibrissa = 'vibrissa';
const villus = 'villus';
const vimen = 'vimen';
const vinculum = 'vinculum';
const virago = 'virago';
const vis = 'vis';
const virtuoso = 'virtuoso';
const vita = 'vita';
const vitellus = 'vitellus';
const vitta = 'vitta';
const vivarium = 'vivarium';
const vox = 'vox';
const volcano = 'volcano';
const volkslied = 'volkslied';
const volta = 'volta';
const volva = 'volva';
const vorticella = 'vorticella';
const vortex = 'vortex';
const vulva = 'vulva';
const wahhabi = 'wahhabi';
const wanderjahr = 'wanderjahr';
const weakfish = 'weakfish';
const werewolf = 'werewolf';
const wharf = 'wharf';
const whitefish = 'whitefish';
const wife = 'wife';
const wolffish = 'wolffish';
const wolf = 'wolf';
const woodlouse = 'woodlouse';
const wreckfish = 'wreckfish';
const wunderkind = 'wunderkind';
const xiphisternum = 'xiphisternum';
const yeshiva = 'yeshiva';
const yogi = 'yogi';
const yourself = 'yourself';
const zamindari = 'zamindari';
const zecchino = 'zecchino';
const zero = 'zero';
const zoon = 'zoon';
const zoaea = 'zoaea';
const zoea = 'zoea';
const zoonosis = 'zoonosis';

// Noun to lemma mappings
exceptions.aardwolves = aardwolf;
exceptions.abaci = abacus;
exceptions.aboideaux = aboideau;
exceptions.aboiteaux = aboiteau;
exceptions.abscissae = abscissa;
exceptions.acanthi = acanthus;
exceptions.acari = acarus;
exceptions.acciaccature = acciaccatura;
exceptions.acetabula = acetabulum;
exceptions.achaemenidae = achaemenid;
exceptions.achaemenides = achaemenid;
exceptions.acicula = aciculum;
exceptions.aciculae = acicula;
exceptions.acini = acinus;
exceptions.acromia = acromion;
exceptions.actiniae = actinia;
exceptions.actinozoa = actinozoan;
exceptions.addenda = addendum;
exceptions.adenocarcinomata = adenocarcinoma;
exceptions.adenomata = adenoma;
exceptions.adieux = adieu;
exceptions.adyta = adytum;
exceptions.aecia = aecium;
exceptions.aecidia = aecidium;
exceptions.aerobia = aerobium;
exceptions.aggiornamenti = aggiornamento;
exceptions.agnomina = agnomen;
exceptions.agones = agon;
exceptions.agorae = agora;
exceptions.agouties = agouti;
exceptions.alae = ala;
exceptions.alewives = alewife;
exceptions.alkalies = alkali;
exceptions.allodia = allodium;
exceptions.alluvia = alluvium;
exceptions.alodia = alodium;
exceptions.altocumuli = altocumulus;
exceptions.altostrati = altostratus;
exceptions.alulae = alula;
exceptions.alumnae = alumna;
exceptions.alumni = alumnus;
exceptions.alveoli = alveolus;
exceptions.amanuenses = amanuensis;
exceptions.ambulacra = ambulacrum;
exceptions.amebae = ameba;
exceptions.amnia = amnion;
exceptions.amniocenteses = amniocentesis;
exceptions.amoebae = amoeba;
exceptions.amoebiases = amoebiasis;
exceptions.amoraim = amora;
exceptions.amoretti = amoretto;
exceptions.amorini = amorino;
exceptions.amphiarthroses = amphiarthrosis;
exceptions.amphicia = amphithecium;
exceptions.amphimixes = amphimixis;
exceptions.amphioxi = amphioxus;
exceptions.amphisbaenae = amphisbaena;
exceptions.amphorae = amphora;
exceptions.ampullae = ampulla;
exceptions.amygdalae = amygdala;
exceptions.anabases = anabasis;
exceptions.anacolutha = anacoluthon;
exceptions.anacruses = anacrusis;
exceptions.anaerobia = anaerobium;
exceptions.anagnorises = anagnorisis;
exceptions.analemmata = analemma;
exceptions.analyses = analysis;
exceptions.anamneses = anamnesis;
exceptions.anamorphoses = anamorphosis;
exceptions.anastomoses = anastomosis;
exceptions.anatyxes = anaptyxis;
exceptions.ancones = ancon;
exceptions.androclinia = androclinium;
exceptions.androecia = androecium;
exceptions.androsphinges = androsphinx;
exceptions.andtheridia = antheridium;
exceptions.angelfishes = angelfish;
exceptions.angiomata = angioma;
exceptions.animalcula = animalculum;
exceptions.anlagen = anlage;
exceptions.annattos = annatto;
exceptions.annuli = annulus;
exceptions.antae = anta;
exceptions.antalkalies = antalkali;
exceptions.antefixa = antefix;
exceptions.antennae = antenna;
exceptions.antependia = antependium;
exceptions.anthelia = anthelion;
exceptions.anthelices = anthelix;
exceptions.anthemia = anthemion;
exceptions.antheridia = antheridium;
exceptions.anthodia = anthodium;
exceptions.anthozoa = anthozoan;
exceptions.anthraces = anthrax;
exceptions.anticlinoria = anticlinorium;
exceptions.antihelices = antihelix;
exceptions.antiheroes = antihero;
exceptions.antisera = antiserum;
exceptions.antitheses = antithesis;
exceptions.antitragi = antitragus;
exceptions.antra = antrum;
exceptions.anus = anus;
exceptions.aortae = aorta;
exceptions.aphelia = aphelion;
exceptions.aphides = aphis;
exceptions.apices = apex;
exceptions.apodoses = apodosis;
exceptions.apomixes = apomixis;
exceptions.aponeuroses = aponeurosis;
exceptions.apophyses = apophysis;
exceptions.aposiopeses = aposiopesis;
exceptions.apothecia = apothecium;
exceptions.apotheoses = apotheosis;
exceptions.apparatus = apparatus;
exceptions.appendices = appendix;
exceptions.appoggiature = appoggiatura;
exceptions.apsides = apsis;
exceptions.aquae = aqua;
exceptions.aquaria = aquarium;
exceptions.araglis = argali;
exceptions.arboreta = arboretum;
exceptions.arcana = arcanum;
exceptions.archegonia = archegonium;
exceptions.archerfishes = archerfish;
exceptions.archesporia = archesporium;
exceptions.archipelagoes = archipelago;
exceptions.areolae = areola;
exceptions.argali = argali;
exceptions.argumenta = argumentum;
exceptions.ariette = arietta;
exceptions.aristae = arista;
exceptions.armamentaria = armamentarium;
exceptions.arses = arsis;
exceptions.artal = rotl;
exceptions.artel = rotl;
exceptions.arterioscleroses = arteriosclerosis;
exceptions.aruspices = aruspex;
exceptions.asceses = ascesis;
exceptions.asci = ascus;
exceptions.ascidia = ascidium;
exceptions.ascogonia = ascogonium;
exceptions.ashes = ash;
exceptions.ashkenazim = ashkenazi;
exceptions.aspergilla = aspergillum;
exceptions.aspergilli = aspergillus;
exceptions.aspergilloses = aspergillosis;
exceptions.aspersoria = aspersorium;
exceptions.assegais =  assegai;
exceptions.astragali = astragalus;
exceptions.asyndeta = asyndeton;
exceptions.atheromata = atheroma;
exceptions.atheroscleroses = atherosclerosis;
exceptions.atmolyses = atmolysis;
exceptions.atria = atrium;
exceptions.auditoria = auditorium;
exceptions.aurae = aura;
exceptions.aurar = eyrir;
exceptions.aurei = aureus;
exceptions.auriculae = auricula;
exceptions.aurorae = aurora;
exceptions.auspices = auspice;
exceptions.autocatalyses = autocatalysis;
exceptions.autochthones = autochthon;
exceptions.automata = automaton;
exceptions.avitaminoses = avitaminosis;
exceptions.axes = ax;
exceptions.axillae = axilla;
exceptions.bacchantes = bacchante;
exceptions.bacchii = bacchius;
exceptions.bacilli = bacillus;
exceptions.bacteriostases = bacteriostasis;
exceptions.bacula = baculum;
exceptions.ballistae = ballista;
exceptions.bambini = bambino;
exceptions.bandeaux = bandeau;
exceptions.banditti = bandit;
exceptions.bani = ban;
exceptions.banjoes = banjo;
exceptions.barklice = barklouse;
exceptions.barramundies = barramundi;
exceptions.bases = base;
exceptions.basidia = basidium;
exceptions.basileis = basileus;
exceptions.bassi = basso;
exceptions.bastinadoes = bastinado;
exceptions.bateaux = bateau;
exceptions.batfishes = batfish;
exceptions.beadsmen = beadsman;
exceptions.beaux = beau;
exceptions.beeves = beef;
exceptions.behooves = behoof;
exceptions.bersaglieri = bersagliere;
exceptions.bhishties = bhishti;
exceptions.bibliothecae = bibliotheca;
exceptions.bicennaries = bicentenary;
exceptions.bijoux = bijou;
exceptions.bilboes = bilbo;
exceptions.billfishes = billfish;
exceptions.bimboes = bimbo;
exceptions.bisectrices = bisectrix;
exceptions.blackfeet = blackfoot;
exceptions.blackfishes = blackfish;
exceptions.blastemata = blastema;
exceptions.blastulae = blastula;
exceptions.blindfishes = blindfish;
exceptions.blowfishes = blowfish;
exceptions.bluefishes = bluefish;
exceptions.boarfishes = boarfish;
exceptions.bok = boschbok;
exceptions.boleti = boletus;
exceptions.bolivares = bolivar;
exceptions.bolsheviki = bolshevik;
exceptions.bonefishes = bonefish;
exceptions.bongoes = bongo;
exceptions.bonitoes = bonito;
exceptions.booklice = booklouse;
exceptions.bookshelves = bookshelf;
exceptions.boraces = borax;
exceptions.borborygmi = borborygmus;
exceptions.bordereaux = bordereau;
exceptions.botargoes = botargo;
exceptions.boxfishes = boxfish;
exceptions.brachia = brachium;
exceptions.brainchildren = brainchild;
exceptions.branchiae = branchia;
exceptions.brants = brant;
exceptions.bravadoes = bravado;
exceptions.bravoes = bravo;
exceptions.bregmata = bregma;
exceptions.brethren = brother;
exceptions.broadleaves = broadleaf;
exceptions.bronchi = bronchus;
exceptions.bryozoa = bryozoan;
exceptions.buboes = bubo;
exceptions.buckoes = bucko;
exceptions.buckteeth = bucktooth;
exceptions.buffaloes = buffalo;
exceptions.bullae = bulla;
exceptions.bunde = bund;
exceptions.bureaux = bureau;
exceptions.bursae = bursa;
exceptions.bushbok = boschbok;
exceptions.bushboks = boschbok;
exceptions.busses = bus;
exceptions.butterfishes = butterfish;
exceptions.byssi = byssus;
exceptions.cacti = cactus;
exceptions.caducei = caduceus;
exceptions.caeca = caecum;
exceptions.caesurae = caesura;
exceptions.calami = calamus;
exceptions.calathi = calathus;
exceptions.calcanei = calcaneum;
exceptions.calces = calx;
exceptions.calculi = calculus;
exceptions.caldaria = caldarium;
exceptions.calices = calix;
exceptions.calicoes = calico;
exceptions.calli = callus;
exceptions.calves = calf;
exceptions.calyces = calyx;
exceptions.cambia = cambium;
exceptions.camerae = camera;
exceptions.canaliculi = canaliculus;
exceptions.candelabra = candelabrum;
exceptions.candlefishes = candlefish;
exceptions.canthi = canthus;
exceptions.canulae = canula;
exceptions.canzoni = canzone;
exceptions.capita = caput;
exceptions.capitula = capitulum;
exceptions.capricci = capriccio;
exceptions.carabinieri = carabiniere;
exceptions.carbonadoes = carbonado;
exceptions.carcinomata = carcinoma;
exceptions.cargoes = cargo;
exceptions.carides = caryatid;
exceptions.carinae = carina;
exceptions.caroli = carolus;
exceptions.carpi = carpus;
exceptions.carpogonia = carpogonium;
exceptions.caryopses = caryopsis;
exceptions.caryopsides = caryopsis;
exceptions.castrati = castrato;
exceptions.catabases = catabasis;
exceptions.cataclases = cataclasis;
exceptions.cataloes = catalo;
exceptions.catalyses = catalysis;
exceptions.catenae = catena;
exceptions.catfishes = catfish;
exceptions.cathari = cathar;
exceptions.cathexes = cathexis;
exceptions.cattaloes = cattalo;
exceptions.caudices = caudex;
exceptions.caules = caulis;
exceptions.cavatine = cavatina;
exceptions.cavefishes = cavefish;
exceptions.cavetti = cavetto;
exceptions.ceca = cecum;
exceptions.cellae = cella;
exceptions.cembali = cembalo;
exceptions.centesimi = centesimo;
exceptions.centra = centrum;
exceptions.cephalothoraces = cephalothorax;
exceptions.cercariae = cercaria;
exceptions.cercariiae = cercaria;
exceptions.cerci = cercus;
exceptions.cerebella = cerebellum;
exceptions.cerebra = cerebrum;
exceptions.cervices = cervix;
exceptions.cestuses = caestus;
exceptions.cesurae = cesura;
exceptions.chadarim = cheder;
exceptions.chaetae = chaeta;
exceptions.chalazae = chalaza;
exceptions.challoth = hallah;
exceptions.chalutzim = chalutz;
exceptions.chapaties = chapati;
exceptions.chapatties = chapatti;
exceptions.chapeaux = chapeau;
exceptions.chasidim = chasid;
exceptions.chassidim = chassid;
exceptions.chateaux = chateau;
exceptions.chazanim = chazan;
exceptions.chedarim = cheder;
exceptions.chelae = chela;
exceptions.chelicerae = chelicera;
exceptions.cherubim = cherub;
exceptions.chiasmata = chiasma;
exceptions.chiasmi = chiasmus;
exceptions.children = child;
exceptions.chillies = chilli;
exceptions.chitarroni = chitarrone;
exceptions.chlamydes = chlamys;
exceptions.chlamyses = chlamys;
exceptions.chondromata = chondroma;
exceptions.choragi = choragus;
exceptions.choriambi = choriambus;
exceptions.choux = chou;
exceptions.chromonemata = chromonema;
exceptions.chrysalides = chrysalis;
exceptions.chuvashes = chuvash;
exceptions.ciboria = ciborium;
exceptions.cicadae = cicada;
exceptions.cicale = cicala;
exceptions.cicatrices = cicatrix;
exceptions.ciceroni = cicerone;
exceptions.cicisbei = cicisbeo;
exceptions.cilia = cilium;
exceptions.cimices = cimex;
exceptions.cineraria = cinerarium;
exceptions.cingula = cingulum;
exceptions.cirri = cirrus;
exceptions.cirrocumuli = cirrocumulus;
exceptions.cirrostrati = cirrostratus;
exceptions.ciscoes = cisco;
exceptions.cisternae = cisterna;
exceptions.clani = clarino;
exceptions.clanos = clarino;
exceptions.claroes = claro;
exceptions.clepsydrae = clepsydra;
exceptions.clinandria = clinandrium;
exceptions.clingfishes = clingfish;
exceptions.clitella = clitellum;
exceptions.cloacae = cloaca;
exceptions.clostridia = clostridium;
exceptions.cloverleaves = cloverleaf;
exceptions.clypei = clypeus;
exceptions.coagula = coagulum;
exceptions.coalfishes = coalfish;
exceptions.cocci = coccus;
exceptions.coccyges = coccyx;
exceptions.cochleae = cochlea;
exceptions.codfishes = codfish;
exceptions.codices = codex;
exceptions.coelentera = coelenteron;
exceptions.coenuri = coenurus;
exceptions.cognomina = cognomen;
exceptions.cognosenti = cognosente;
exceptions.cola = colon;
exceptions.coleorhizae = coleorhiza;
exceptions.collegia = collegium;
exceptions.colloquia = colloquium;
exceptions.colluvia = colluvium;
exceptions.collyria = collyrium;
exceptions.colones = colon;
exceptions.colossi = colossus;
exceptions.columbaria = columbarium;
exceptions.columellae = columella;
exceptions.comae = coma;
exceptions.comatulae = comatula;
exceptions.comedones = comedo;
exceptions.comics = comic;
exceptions.commandoes = commando;
exceptions.concertanti = concertante;
exceptions.concerti = concerto;
exceptions.concertini = concertino;
exceptions.conchae = concha;
exceptions.condottieri = condottiere;
exceptions.condylomata = condyloma;
exceptions.confervae = conferva;
exceptions.congii = congius;
exceptions.conidia = conidium;
exceptions.conjunctivae = conjunctiva;
exceptions.conquistadores = conquistador;
exceptions.consortia = consortium;
exceptions.contagia = contagium;
exceptions.continua = continuum;
exceptions.contralti = contralto;
exceptions.conversazioni = conversazione;
exceptions.convolvuli = convolvulus;
exceptions.copulae = copula;
exceptions.corbiculae = corbicula;
exceptions.coria = corium;
exceptions.corneae = cornea;
exceptions.cornua = cornu;
exceptions.coronae = corona;
exceptions.corpora = corpus;
exceptions.corrigenda = corrigendum;
exceptions.cortices = cortex;
exceptions.cortinae = cortina;
exceptions.corybantes = corybant;
exceptions.coryphaei = coryphaeus;
exceptions.costae = costa;
exceptions.cothurni = cothurnus;
exceptions.couteaux = couteau;
exceptions.cowfishes = cowfish;
exceptions.coxae = coxa;
exceptions.cramboes = crambo;
exceptions.crania = cranium;
exceptions.crases = crasis;
exceptions.crawfishes = crawfish;
exceptions.crayfishes = crayfish;
exceptions.credenda = credendum;
exceptions.crematoria = crematorium;
exceptions.crescendi = crescendo;
exceptions.cribella = cribellum;
exceptions.crises = crisis;
exceptions.crissa = crissum;
exceptions.cristae = crista;
exceptions.criteria = criterion;
exceptions.cruces = crux;
exceptions.crura = crus;
exceptions.crusadoes = crusado;
exceptions.cruzadoes = cruzado;
exceptions.crying = cry;
exceptions.cryings = cry;
exceptions.ctenidia = ctenidium;
exceptions.cubicula = cubiculum;
exceptions.culices = culex;
exceptions.culpae = culpa;
exceptions.culti = cultus;
exceptions.cumuli = cumulus;
exceptions.cumulonimbi = cumulonimbus;
exceptions.cumulostrati = cumulostratus;
exceptions.curiae = curia;
exceptions.curricula = curriculum;
exceptions.custodes = custos;
exceptions.cutes = cutis;
exceptions.cuticulae = cuticula;
exceptions.cuttlefishes = cuttlefish;
exceptions.cyclopes = cyclops;
exceptions.cycloses = cyclosis;
exceptions.cylices = cylix;
exceptions.cylikes = cylix;
exceptions.cymae = cyma;
exceptions.cymatia = cymatium;
exceptions.cypselae = cypsela;
exceptions.cysticerci = cysticercus;
exceptions.dadoes = dado;
exceptions.dagoes = dago;
exceptions.damselfishes = damselfish;
exceptions.data = datum;
exceptions.daymio = daimio;
exceptions.daymios = daimio;
exceptions.dealfishes = dealfish;
exceptions.decemviri = decemvir;
exceptions.decennia = decennium;
exceptions.deciduae = decidua;
exceptions.definienda = definiendum;
exceptions.definientia = definiens;
exceptions.delphinia = delphinium;
exceptions.denarii = denarius;
exceptions.dentalia = dentalium;
exceptions.dermatoses = dermatosis;
exceptions.desiderata = desideratum;
exceptions.desperadoes = desperado;
exceptions.devilfishes = devilfish;
exceptions.diaereses = diaeresis;
exceptions.diaerses = diaeresis;
exceptions.diagnoses = diagnosis;
exceptions.dialyses = dialysis;
exceptions.diaphyses = diaphysis;
exceptions.diapophyses = diapophysis;
exceptions.diarthroses = diarthrosis;
exceptions.diastalses = diastalsis;
exceptions.diastases = diastasis;
exceptions.diastemata = diastema;
exceptions.diastemata = diastema;
exceptions.diathses = diathesis;
exceptions.diazoes = diazo;
exceptions.dibbukkim = dibbuk;
exceptions.dichasia = dichasium;
exceptions.dicta = dictum;
exceptions.didoes = dido;
exceptions.diereses = dieresis;
exceptions.dieses = diesis;
exceptions.differentiae = differentia;
exceptions.dilettanti = dilettante;
exceptions.diluvia = diluvium;
exceptions.dingoes = dingo;
exceptions.diplococci = diplococcus;
exceptions.disci = discus;
exceptions.discoboli = discobolus;
exceptions.dive = diva;
exceptions.diverticula = diverticulum;
exceptions.divertimenti = divertimento;
exceptions.djinn = djinny;
exceptions.dodoes = dodo;
exceptions.dogfishes = dogfish;
exceptions.dogmata = dogma;
exceptions.dogteeth = dogtooth;
exceptions.dollarfishes = dollarfish;
exceptions.domatia = domatium;
exceptions.dominoes = domino;
exceptions.dormice = dormouse;
exceptions.dorsa = dorsum;
exceptions.drachmae = drachma;
exceptions.drawknives = drawknife;
exceptions.drosophilae = drosophila;
exceptions.drumfishes = drumfish;
exceptions.dryades = dryad;
exceptions.dui = duo;
exceptions.duona = duodenum;
exceptions.duonas = duodenum;
exceptions.dupondii = dupondius;
exceptions.duumviri = duumvir;
exceptions.dwarves = dwarf;
exceptions.dybbukkim = dybbuk;
exceptions.ecchymoses = ecchymosis;
exceptions.ecclesiae = ecclesia;
exceptions.ecdyses = ecdysis;
exceptions.echidnae = echidna;
exceptions.echini = echinus;
exceptions.echinococci = echinococcus;
exceptions.echoes = echo;
exceptions.ectozoa = ectozoan;
exceptions.eddoes = eddo;
exceptions.edemata = edema;
exceptions.effluvia = effluvium;
exceptions.eidola = eidolon;
exceptions.eisegeses = eisegesis;
exceptions.eisteddfodau = eisteddfod;
exceptions.elenchi = elenchus;
exceptions.ellipses = ellipsis;
exceptions.eluvia = eluvium;
exceptions.elves = elf;
exceptions.elytra = elytrum;
exceptions.embargoes = embargo;
exceptions.emboli = embolus;
exceptions.emphases = emphasis;
exceptions.emporia = emporium;
exceptions.enarthroses = enarthrosis;
exceptions.encephala = encephalon;
exceptions.encephalitides = encephalitis;
exceptions.encephalomata = encephaloma;
exceptions.enchiridia = enchiridion;
exceptions.enchondromata = enchondroma;
exceptions.encomia = encomium;
exceptions.endamebae = endameba;
exceptions.endamoebae = endamoeba;
exceptions.endocardia = endocardium;
exceptions.endocrania = endocranium;
exceptions.endometria = endometrium;
exceptions.endostea = endosteum;
exceptions.endostoses = endostosis;
exceptions.endothecia = endothecium;
exceptions.endothelia = endothelium;
exceptions.endotheliomata = endothelioma;
exceptions.endozoa = endozoan;
exceptions.enemata = enema;
exceptions.enneahedra = enneahedron;
exceptions.entamebae = entameba;
exceptions.entamoebae = entamoeba;
exceptions.entases = entasis;
exceptions.entera = enteron;
exceptions.entia = ens;
exceptions.entozoa = entozoan;
exceptions.epencephala = epencephalon;
exceptions.epentheses = epenthesis;
exceptions.epexegeses = epexegesis;
exceptions.ephemera = ephemeron;
exceptions.ephemerae = ephemera;
exceptions.ephemerides = ephemeris;
exceptions.ephori = ephor;
exceptions.epicalyces = epicalyx;
exceptions.epicanthi = epicanthus;
exceptions.epicardia = epicardium;
exceptions.epicedia = epicedium;
exceptions.epicleses = epiclesis;
exceptions.epididymides = epididymis;
exceptions.epigastria = epigastrium;
exceptions.epiglottides = epiglottis;
exceptions.epimysia = epimysium;
exceptions.epiphenomena = epiphenomenon;
exceptions.epiphyses = epiphysis;
exceptions.episterna = episternum;
exceptions.epithalamia = epithalamium;
exceptions.epithelia = epithelium;
exceptions.epitheliomata = epithelioma;
exceptions.epizoa = epizoan;
exceptions.epyllia = epyllion;
exceptions.equilibria = equilibrium;
exceptions.equiseta = equisetum;
exceptions.eringoes = eringo;
exceptions.errata = erratum;
exceptions.eryngoes = eryngo;
exceptions.esophagi = esophagus;
exceptions.etyma = etymon;
exceptions.eucalypti = eucalyptus;
exceptions.eupatridae = eupatrid;
exceptions.euripi = euripus;
exceptions.exanthemata = exanthema;
exceptions.executrices = executrix;
exceptions.exegeses = exegesis;
exceptions.exempla = exemplum;
exceptions.exordia = exordium;
exceptions.exostoses = exostosis;
exceptions.extrema = extremum;
exceptions.eyeteeth = eyetooth;
exceptions.fabliaux = fabliau;
exceptions.faciae = facia;
exceptions.faculae = facula;
exceptions.faeroese = faeroese;
exceptions.fallfishes = fallfish;
exceptions.famuli = famulus;
exceptions.faroese = faroese;
exceptions.farragoes = farrago;
exceptions.fasciae = fascia;
exceptions.fasciculi = fasciculus;
exceptions.fatsoes = fatso;
exceptions.faunae = fauna;
exceptions.feculae = fecula;
exceptions.fedayeen = fedayee;
exceptions.feet = foot;
exceptions.fellaheen = fellah;
exceptions.fellahin = fellah;
exceptions.femora = femur;
exceptions.fenestellae = fenestella;
exceptions.fenestrae = fenestra;
exceptions.feriae = feria;
exceptions.fermate = fermata;
exceptions.ferulae = ferula;
exceptions.festschriften = festschrift;
exceptions.fetiales = fetial;
exceptions.fezzes = fez;
exceptions.fiascoes = fiasco;
exceptions.fibrillae = fibrilla;
exceptions.fibromata = fibroma;
exceptions.fibulae = fibula;
exceptions.ficoes = fico;
exceptions.fideicommissa = fideicommissum;
exceptions.fieldmice = fieldmouse;
exceptions.figs = fig;
exceptions.fila = filum;
exceptions.filariiae = filaria;
exceptions.filefishes = filefish;
exceptions.fimbriae = fimbria;
exceptions.fishes = fish;
exceptions.fishwives = fishwife;
exceptions.fistulae = fistula;
exceptions.flabella = flabellum;
exceptions.flagella = flagellum;
exceptions.flagstaves = flagstaff;
exceptions.flambeaux = flambeau;
exceptions.flamines = flamen;
exceptions.flamingoes = flamingo;
exceptions.flatfeet = flatfoot;
exceptions.flatfishes = flatfish;
exceptions.flittermice = flittermouse;
exceptions.flocci = floccus;
exceptions.flocculi = flocculus;
exceptions.florae = flora;
exceptions.floreant = floreat;
exceptions.florilegia = florilegium;
exceptions.flyleaves = flyleaf;
exceptions.foci = focus;
exceptions.folia = folium;
exceptions.fora = forum;
exceptions.foramina = foramen;
exceptions.forceps = forceps;
exceptions.forefeet = forefoot;
exceptions.foreteeth = foretooth;
exceptions.formicaria = formicarium;
exceptions.formulae = formula;
exceptions.fornices = fornix;
exceptions.fortes = fortis;
exceptions.fossae = fossa;
exceptions.foveae = fovea;
exceptions.foveolae = foveola;
exceptions.fractocumuli = fractocumulus;
exceptions.fractostrati = fractostratus;
exceptions.fraena = fraenum;
exceptions.frauen = frau;
exceptions.frena = frenum;
exceptions.frenula = frenulum;
exceptions.frescoes = fresco;
exceptions.fricandeaux = fricandeau;
exceptions.fricandoes = fricando;
exceptions.frijoles = frijol;
exceptions.frogfishes = frogfish;
exceptions.frontes = frons;
exceptions.frusta = frustum;
exceptions.fuci = fucus;
exceptions.fulcra = fulcrum;
exceptions.fumatoria = fumatorium;
exceptions.fundi = fundus;
exceptions.fungi = fungus;
exceptions.funiculi = funiculus;
exceptions.furcula = furculum;
exceptions.furculae = furcula;
exceptions.furfures = furfur;
exceptions.galeae = galea;
exceptions.gambadoes = gambado;
exceptions.gametangia = gametangium;
exceptions.gametoecia = gametoecium;
exceptions.gammadia = gammadion;
exceptions.ganglia = ganglion;
exceptions.garfishes = garfish;
exceptions.gas = gas;
exceptions.gasses = gas;
exceptions.gastrulae = gastrula;
exceptions.gateaux = gateau;
exceptions.gazeboes = gazebo;
exceptions.geckoes = gecko;
exceptions.geese = goose;
exceptions.gelsemia = gelsemium;
exceptions.gemboks = gemsbok;
exceptions.gembucks = gemsbuck;
exceptions.gemeinschaften = gemeinschaft;
exceptions.gemmae = gemma;
exceptions.genera = genus;
exceptions.generatrices = generatrix;
exceptions.geneses = genesis;
exceptions.genii = genius;
exceptions.gentes = gens;
exceptions.genua = genu;
exceptions.genus = genus;
exceptions.germina = germen;
exceptions.gesellschaften = gesellschaft;
exceptions.gestalten = gestalt;
exceptions.ghettoes = ghetto;
exceptions.gingivae = gingiva;
exceptions.gingkoes = gingko;
exceptions.ginglymi = ginglymus;
exceptions.ginkgoes = ginkgo;
exceptions.gippoes = gippo;
exceptions.glabellae = glabella;
exceptions.gladioli = gladiolus;
exceptions.glandes = glans;
exceptions.gliomata = glioma;
exceptions.glissandi = glissando;
exceptions.globefishes = globefish;
exceptions.globigerinae = globigerina;
exceptions.glochidcia = glochidium;
exceptions.glochidia = glochidium;
exceptions.glomeruli = glomerulus;
exceptions.glossae = glossa;
exceptions.glottides = glottis;
exceptions.glutaei = glutaeus;
exceptions.glutei = gluteus;
exceptions.gnoses = gnosis;
exceptions.goatfishes = goatfish;
exceptions.goboes = gobo;
exceptions.godchildren = godchild;
exceptions.goes = go;
exceptions.goldfishes = goldfish;
exceptions.gomphoses = gomphosis;
exceptions.gonia = gonion;
exceptions.gonidia = gonidium;
exceptions.gonococci = gonococcus;
exceptions.goodwives = goodwife;
exceptions.goosefishes = goosefish;
exceptions.gorgoneia = gorgoneion;
exceptions.gospopoda = gospodin;
exceptions.goyim = goy;
exceptions.gps = gps;
exceptions.grafen = graf;
exceptions.graffiti = graffito;
exceptions.grandchildren = grandchild;
exceptions.granulomata = granuloma;
exceptions.gravamina = gravamen;
exceptions.groszy = grosz;
exceptions.grottoes = grotto;
exceptions.guilder = guilde;
exceptions.guilders = guilde;
exceptions.guitarfishes = guitarfish;
exceptions.gummata = gumma;
exceptions.gurnard = gurnar;
exceptions.gurnards = gurnar;
exceptions.guttae = gutta;
exceptions.gymnasia = gymnasium;
exceptions.gynaecea = gynaeceum;
exceptions.gynaecia = gynaecium;
exceptions.gynecea = gynecium;
exceptions.gynecia = gynecium;
exceptions.gynoecea = gynoecium;
exceptions.gynoecia = gynoecium;
exceptions.gyri = gyrus;
exceptions.hadarim = heder;
exceptions.hadjes = hadj;
exceptions.haematolyses = haematolysis;
exceptions.haematomata = haematoma;
exceptions.haematozoa = haematozoon;
exceptions.haemodialyses = haemodialysis;
exceptions.haemolyses = haemolysis;
exceptions.haemoptyses = haemoptysis;
exceptions.haeredes = haeres;
exceptions.haftaroth = haftarah;
exceptions.hagfishes = hagfish;
exceptions.haggadas = haggadah;
exceptions.haggadoth = haggada;
exceptions.hajjes = hajj;
exceptions.haleru = haler;
exceptions.halfpence = halfpenny;
exceptions.hallot = hallah;
exceptions.halloth = hallah;
exceptions.halluces = hallux;
exceptions.haloes = halo;
exceptions.halteres = halter;
exceptions.halves = half;
exceptions.hamuli = hamulus;
exceptions.haphtaroth = haphtarah;
exceptions.haredim = haredi;
exceptions.haruspices = haruspex;
exceptions.hasidim = hasid;
exceptions.hassidim = hassid;
exceptions.haustella = haustellum;
exceptions.haustoria = haustorium;
exceptions.hazzanim = hazzan;
exceptions.hectocotyli = hectocotylus;
exceptions.heldentenore = heldentenor;
exceptions.helices = helix;
exceptions.heliozoa = heliozoan;
exceptions.hematolyses = hematolysis;
exceptions.hematomata = hematoma;
exceptions.hematozoa = hematozoon;
exceptions.hemelytra = hemelytron;
exceptions.hemielytra = hemielytron;
exceptions.hemodialyses = hemodialysis;
exceptions.hemolyses = hemolysis;
exceptions.hemoptyses = hemoptysis;
exceptions.hendecahedra = hendecahedron;
exceptions.heraclidae = heraclid;
exceptions.heraklidae = heraklid;
exceptions.herbaria = herbarium;
exceptions.hermae = herma;
exceptions.hermai = herma;
exceptions.herniae = hernia;
exceptions.heroes = hero;
exceptions.herren = herr;
exceptions.hetaerae = hetaera;
exceptions.hetairai = hetaira;
exceptions.hibernacula = hibernaculum;
exceptions.hieracosphinges = hieracosphinx;
exceptions.hila = hilum;
exceptions.hili = hilus;
exceptions.himatia = himation;
exceptions.hippocampi = hippocampus;
exceptions.hippopotami = hippopotamus;
exceptions.his = his;
exceptions.hoboes = hobo;
exceptions.hogfishes = hogfish;
exceptions.homunculi = homunculus;
exceptions.honoraria = honorarium;
exceptions.hooves = hoof;
exceptions.horologia = horologium;
exceptions.housewives = housewife;
exceptions.humeri = humerus;
exceptions.hydrae = hydra;
exceptions.hydromedusae = hydromedusa;
exceptions.hydrozoa = hydrozoan;
exceptions.hymenoptera = hymenopteran;
exceptions.hynia = hymenium;
exceptions.hyniums = hymenium;
exceptions.hypanthia = hypanthium;
exceptions.hyperostoses = hyperostosis;
exceptions.hyphae = hypha;
exceptions.hypnoses = hypnosis;
exceptions.hypochondria = hypochondrium;
exceptions.hypogastria = hypogastrium;
exceptions.hypogea = hypogeum;
exceptions.hypophyses = hypophysis;
exceptions.hypostases = hypostasis;
exceptions.hypothalami = hypothalamus;
exceptions.hypotheses = hypothesis;
exceptions.hyraces = hyrax;
exceptions.iambi = iamb;
exceptions.ibices = ibex;
exceptions.ibo = igbo;
exceptions.ichthyosauri = ichthyosaurus;
exceptions.ichthyosauruses = ichthyosaur;
exceptions.iconostases = iconostas;
exceptions.icosahedra = icosahedron;
exceptions.ideata = ideatum;
exceptions.igorrorote = igorrote;
exceptions.ilia = ilium;
exceptions.imagines = imago;
exceptions.imagoes = imago;
exceptions.imperia = imperium;
exceptions.impies = impi;
exceptions.incubi = incubus;
exceptions.incudes = incus;
exceptions.indices = index;
exceptions.indigoes = indigo;
exceptions.indumenta = indumentum;
exceptions.indusia = indusium;
exceptions.infundibula = infundibulum;
exceptions.ingushes = ingush;
exceptions.innuendoes = innuendo;
exceptions.inocula = inoculum;
exceptions.insectaria = insectarium;
exceptions.insulae = insula;
exceptions.intagli = intaglio;
exceptions.interleaves = interleaf;
exceptions.intermezzi = intermezzo;
exceptions.interreges = interrex;
exceptions.interregna = interregnum;
exceptions.intimae = intima;
exceptions.involucella = involucellum;
exceptions.involucra = involucrum;
exceptions.irides = iris;
exceptions.irs = irs;
exceptions.is = is;
exceptions.ischia = ischium;
exceptions.isthmi = isthmus;
exceptions.jackeroos = jackeroo;
exceptions.jackfishes = jackfish;
exceptions.jackknives = jackknife;
exceptions.jambeaux = jambeau;
exceptions.jellyfishes = jellyfish;
exceptions.jewelfishes = jewelfish;
exceptions.jewfishes = jewfish;
exceptions.jingoes = jingo;
exceptions.jinn = jinni;
exceptions.joes = joe;
exceptions.jura = jus;
exceptions.kaddishim = kaddish;
exceptions.kalmuck = kalmuc;
exceptions.kalmucks = kalmuc;
exceptions.katabases = katabasis;
exceptions.keeshonden = keeshond;
exceptions.kibbutzim = kibbutz;
exceptions.killifishes = killifish;
exceptions.kingfishes = kingfish;
exceptions.knives = knife;
exceptions.kohlrabies = kohlrabi;
exceptions.kronen = krone;
exceptions.kroner = krone;
exceptions.kronur = krona;
exceptions.krooni = kroon;
exceptions.kylikes = kylix;
exceptions.labara = labarum;
exceptions.labella = labellum;
exceptions.labia = labium;
exceptions.labra = labrum;
exceptions.lactobacilli = lactobacillus;
exceptions.lacunae = lacuna;
exceptions.lacunaria = lacunar;
exceptions.lamellae = lamella;
exceptions.lamiae = lamia;
exceptions.laminae = lamina;
exceptions.lapilli = lapillus;
exceptions.lapithae = lapith;
exceptions.larvae = larva;
exceptions.larynges = larynx;
exceptions.lassoes = lasso;
exceptions.lati = lat;
exceptions.latices = latex;
exceptions.latifundia = latifundium;
exceptions.latu = lat;
exceptions.lavaboes = lavabo;
exceptions.leaves = leaf;
exceptions.lecythi = lecythus;
exceptions.leges = lex;
exceptions.lei = leu;
exceptions.lemmata = lemma;
exceptions.lemnisci = lemniscus;
exceptions.lenes = lenis;
exceptions.lentigines = lentigo;
exceptions.leonides = leonid;
exceptions.lepidoptera = lepidopteran;
exceptions.leprosaria = leprosarium;
exceptions.lepta = lepton;
exceptions.leptocephali = leptocephalus;
exceptions.leucocytozoa = leucocytozoan;
exceptions.leva = lev;
exceptions.librae = libra;
exceptions.libretti = libretto;
exceptions.lice = louse;
exceptions.lieder = lied;
exceptions.ligulae = ligula;
exceptions.limbi = limbus;
exceptions.limina = limen;
exceptions.limites = limes;
exceptions.limuli = limulus;
exceptions.lingoes = lingo;
exceptions.linguae = lingua;
exceptions.lionfishes = lionfish;
exceptions.lipomata = lipoma;
exceptions.lire = lira;
exceptions.liriodendra = liriodendron;
exceptions.lisente = sente;
exceptions.listente = sente;
exceptions.litai = litas;
exceptions.litu = litas;
exceptions.lives = life;
exceptions.lixivia = lixivium;
exceptions.loaves = loaf;
exceptions.loci = locus;
exceptions.loculi = loculus;
exceptions.loggie = loggia;
exceptions.logia = logion;
exceptions.lomenta = lomentum;
exceptions.longobardi = longobard;
exceptions.loricae = lorica;
exceptions.luba = luba;
exceptions.lubritoria = lubritorium;
exceptions.lumbi = lumbus;
exceptions.lumina = lumen;
exceptions.lumpfishes = lumpfish;
exceptions.lungfishes = lungfish;
exceptions.lunulae = lunula;
exceptions.lures = lure;
exceptions.lustra = lustre;
exceptions.lymphangitides = lymphangitis;
exceptions.lymphomata = lymphoma;
exceptions.lymphopoieses = lymphopoiesis;
exceptions.lyses = lysis;
exceptions.lyttae = lytta;
exceptions.maare = maar;
exceptions.macaronies = macaroni;
exceptions.maccaronies = maccaroni;
exceptions.machzorim = machzor;
exceptions.macronuclei = macronucleus;
exceptions.macrosporangia = macrosporangium;
exceptions.maculae = macula;
exceptions.madornos = madrono;
exceptions.maestri = maestro;
exceptions.mafiosi = mafioso;
exceptions.magi = magus;
exceptions.magmata = magma;
exceptions.magnificoes = magnifico;
exceptions.mahzorim = mahzor;
exceptions.makuta = likuta;
exceptions.mallei = malleus;
exceptions.malleoli = malleolus;
exceptions.maloti = loti;
exceptions.mamillae = mamilla;
exceptions.mammae = mamma;
exceptions.mammillae = mammilla;
exceptions.mandingoes = mandingo;
exceptions.mangoes = mango;
exceptions.manifestoes = manifesto;
exceptions.manteaux = manteau;
exceptions.mantes = mantis;
exceptions.manubria = manubrium;
exceptions.marchese = marchesa;
exceptions.marchesi = marchese;
exceptions.maremme = maremma;
exceptions.markkaa = markka;
exceptions.marsupia = marsupium;
exceptions.matrices = matrix;
exceptions.matzoth = matzo;
exceptions.mausolea = mausoleum;
exceptions.maxillae = maxilla;
exceptions.maxima = maximum;
exceptions.media = medium;
exceptions.mediae = media;
exceptions.mediastina = mediastinum;
exceptions.medullae = medulla;
exceptions.medusae = medusa;
exceptions.megara = megaron;
exceptions.megasporangia = megasporangium;
exceptions.megilloth = megillah;
exceptions.meioses = meiosis;
exceptions.melanomata = melanoma;
exceptions.melismata = melisma;
exceptions.mementoes = memento;
exceptions.memoranda = memorandum;
exceptions.men = man;
exceptions.menisci = meniscus;
exceptions.menservants = manservant;
exceptions.menstrua = menstruum;
exceptions.mesdames = madame;
exceptions.mesdemoiselles = mademoiselle;
exceptions.mesentera = mesenteron;
exceptions.mesothoraces = mesothorax;
exceptions.messeigneurs = monseigneur;
exceptions.messieurs = monsieur;
exceptions.mestizoes = mestizo;
exceptions.metacarpi = metacarpus;
exceptions.metamorphoses = metamorphosis;
exceptions.metanephroi = metanephros;
exceptions.metastases = metastasis;
exceptions.metatarsi = metatarsus;
exceptions.metatheses = metathesis;
exceptions.metathoraces = metathorax;
exceptions.metazoa = metazoan;
exceptions.metempsychoses = metempsychosis;
exceptions.metencephala = metencephalon;
exceptions.mezuzoth = mezuzah;
exceptions.miasmata = miasma;
exceptions.mice = mouse;
exceptions.microanalyses = microanalysis;
exceptions.micrococci = micrococcus;
exceptions.micronuclei = micronucleus;
exceptions.microsporangia = microsporangium;
exceptions.midrashim = midrash;
exceptions.midwives = midwife;
exceptions.milia = milium;
exceptions.milieux = milieu;
exceptions.milkfishes = milkfish;
exceptions.millennia = millennium;
exceptions.minae = mina;
exceptions.minima = minimum;
exceptions.ministeria = ministerium;
exceptions.minutiae = minutia;
exceptions.minyanim = minyan;
exceptions.mioses = miosis;
exceptions.miracidia = miracidium;
exceptions.miri = mir;
exceptions.mitochondria = mitochondrion;
exceptions.mitzvoth = mitzvah;
exceptions.modioli = modiolus;
exceptions.moduli = modulus;
exceptions.momenta = momentum;
exceptions.momi = momus;
exceptions.monades = monad;
exceptions.monkfishes = monkfish;
exceptions.monochasia = monochasium;
exceptions.monopodia = monopodium;
exceptions.monoptera = monopteron;
exceptions.monopteroi = monopteros;
exceptions.monsignori = monsignor;
exceptions.mooncalves = mooncalf;
exceptions.moonfishes = moonfish;
exceptions.morae = mora;
exceptions.moratoria = moratorium;
exceptions.morceaux = morceau;
exceptions.morescoes = moresco;
exceptions.moriscoes = morisco;
exceptions.morphallaxes = morphallaxis;
exceptions.morphoses = morphosis;
exceptions.morulae = morula;
exceptions.mosasauri = mosasaurus;
exceptions.moshavim = moshav;
exceptions.moslim = moslem;
exceptions.moslims = moslem;
exceptions.mosquitoes = mosquito;
exceptions.mottoes = motto;
exceptions.mucosae = mucosa;
exceptions.mucrones = mucro;
exceptions.mudejares = mudejar;
exceptions.mudfishes = mudfish;
exceptions.mulattoes = mulatto;
exceptions.multiparae = multipara;
exceptions.murices = murex;
exceptions.muskallunge = muskellunge;
exceptions.mycelia = mycelium;
exceptions.mycetomata = mycetoma;
exceptions.mycobacteria = mycobacterium;
exceptions.mycorrhizae = mycorrhiza;
exceptions.myelencephala = myelencephalon;
exceptions.myiases = myiasis;
exceptions.myocardia = myocardium;
exceptions.myofibrillae = myofibrilla;
exceptions.myomata = myoma;
exceptions.myoses = myosis;
exceptions.myrmidones = myrmidon;
exceptions.mythoi = mythos;
exceptions.myxomata = myxoma;
exceptions.naevi = naevus;
exceptions.naiades = naiad;
exceptions.naoi = naos;
exceptions.narcissi = narcissus;
exceptions.nares = naris;
exceptions.nasopharynges = nasopharynx;
exceptions.natatoria = natatorium;
exceptions.naumachiae = naumachia;
exceptions.nauplii = nauplius;
exceptions.nautili = nautilus;
exceptions.navahoes = navaho;
exceptions.navajoes = navajo;
exceptions.nebulae = nebula;
exceptions.necropoleis = necropolis;
exceptions.needlefishes = needlefish;
exceptions.negrilloes = negrillo;
exceptions.negritoes = negrito;
exceptions.negroes = negro;
exceptions.nemeses = nemesis;
exceptions.nephridia = nephridium;
exceptions.nereides = nereid;
exceptions.neurohypophyses = neurohypophysis;
exceptions.neuromata = neuroma;
exceptions.neuroptera = neuropteron;
exceptions.neuroses = neurosis;
exceptions.nevi = nevus;
exceptions.nibelungen = nibelung;
exceptions.nidi = nidus;
exceptions.nielli = niello;
exceptions.nilgai = nilgai;
exceptions.nimbi = nimbus;
exceptions.nimbostrati = nimbostratus;
exceptions.noctilucae = noctiluca;
exceptions.nodi = nodus;
exceptions.noes = no;
exceptions.nomina = nomen;
exceptions.nota = notum;
exceptions.noumena = noumenon;
exceptions.novae = nova;
exceptions.novelle = novella;
exceptions.novenae = novena;
exceptions.nubeculae = nubecula;
exceptions.nucelli = nucellus;
exceptions.nuchae = nucha;
exceptions.nuclei = nucleus;
exceptions.nucleoli = nucleolus;
exceptions.nulliparae = nullipara;
exceptions.numbfishes = numbfish;
exceptions.numina = numen;
exceptions.nymphae = nympha;
exceptions.oarfishes = oarfish;
exceptions.oases = oasis;
exceptions.obeli = obelus;
exceptions.obligati = obligato;
exceptions.oboli = obolus;
exceptions.occipita = occiput;
exceptions.oceanaria = oceanarium;
exceptions.oceanides = oceanid;
exceptions.ocelli = ocellus;
exceptions.ochreae = ochrea;
exceptions.ocreae = ocrea;
exceptions.octahedra = octahedron;
exceptions.octopi = octopus;
exceptions.oculi = oculus;
exceptions.odea = odeum;
exceptions.oedemata = oedema;
exceptions.oesophagi = oesophagus;
exceptions.oldwives = oldwife;
exceptions.olea = oleum;
exceptions.omasa = omasum;
exceptions.omayyades = omayyad;
exceptions.omenta = omentum;
exceptions.ommatidia = ommatidium;
exceptions.ommiades = ommiad;
exceptions.onagri = onager;
exceptions.oogonia = oogonium;
exceptions.oothecae = ootheca;
exceptions.opercula = operculum;
exceptions.optima = optimum;
exceptions.ora = os;
exceptions.organa = organum;
exceptions.organums = organa;
exceptions.orthoptera = orthopteron;
exceptions.osar = os;
exceptions.oscula = osculum;
exceptions.ossa = os;
exceptions.osteomata = osteoma;
exceptions.ostia = ostium;
exceptions.ottomans = ottoman;
exceptions.ova = ovum;
exceptions.ovoli = ovolo;
exceptions.ovotestes = ovotestis;
exceptions.oxen = ox;
exceptions.oxymora = oxymoron;
exceptions.paddlefishes = paddlefish;
exceptions.paise = paisa;
exceptions.paleae = palea;
exceptions.palestrae = palestra;
exceptions.palingeneses = palingenesis;
exceptions.pallia = pallium;
exceptions.palmettoes = palmetto;
exceptions.palpi = palpus;
exceptions.pancratia = pancratium;
exceptions.panettoni = panettone;
exceptions.paparazzi = paparazzo;
exceptions.paperknives = paperknife;
exceptions.papillae = papilla;
exceptions.papillomata = papilloma;
exceptions.pappi = pappus;
exceptions.papulae = papula;
exceptions.papyri = papyrus;
exceptions.parabases = parabasis;
exceptions.paraleipses = paraleipsis;
exceptions.paralyses = paralysis;
exceptions.paramecia = paramecium;
exceptions.paramenta = parament;
exceptions.paraphyses = paraphysis;
exceptions.parapodia = parapodium;
exceptions.parapraxes = parapraxis;
exceptions.paraselenae = paraselene;
exceptions.parashoth = parashah;
exceptions.parasyntheta = parasyntheton;
exceptions.parazoa = parazoan;
exceptions.parentheses = parenthesis;
exceptions.parerga = parergon;
exceptions.parhelia = parhelion;
exceptions.parietes = paries;
exceptions.parrotfishes = parrotfish;
exceptions.parulides = parulis;
exceptions.pastorali = pastorale;
exceptions.patagia = patagium;
exceptions.patellae = patella;
exceptions.patinae = patina;
exceptions.patresfamilias = paterfamilias;
exceptions.pease = pea;
exceptions.peccadilloes = peccadillo;
exceptions.pectines = pecten;
exceptions.pedaloes = pedalo;
exceptions.pedes = pes;
exceptions.pekingese = pekinese;
exceptions.pelves = pelvis;
exceptions.pence = penny;
exceptions.penes = penis;
exceptions.penetralia = penetralium;
exceptions.penicillia = penicillium;
exceptions.penknives = penknife;
exceptions.pennae = penna;
exceptions.pennia = penni;
exceptions.pentahedra = pentahedron;
exceptions.pentimenti = pentimento;
exceptions.penumbrae = penumbra;
exceptions.pepla = peplum;
exceptions.pericardia = pericardium;
exceptions.perichondria = perichondrium;
exceptions.pericrania = pericranium;
exceptions.peridia = peridium;
exceptions.perigonia = perigonium;
exceptions.perihelia = perihelion;
exceptions.perinea = perineum;
exceptions.perinephria = perinephrium;
exceptions.perionychia = perionychium;
exceptions.periostea = periosteum;
exceptions.periphrases = periphrasis;
exceptions.peristalses = peristalsis;
exceptions.perithecia = perithecium;
exceptions.peritonea = peritoneum;
exceptions.personae = persona;
exceptions.petechiae = petechia;
exceptions.pfennige = pfennig;
exceptions.phalanges = phalanx;
exceptions.phalli = phallus;
exceptions.pharynges = pharynx;
exceptions.phenomena = phenomenon;
exceptions.philodendra = philodendron;
exceptions.phlyctenae  = phlyctena;
exceptions.phyla = phylum;
exceptions.phylae = phyle;
exceptions.phyllotaxes = phyllotaxis;
exceptions.phylloxerae = phylloxera;
exceptions.phylogeneses = phylogenesis;
exceptions.pigfishes = pigfish;
exceptions.pilea = pileum;
exceptions.pilei = pileus;
exceptions.pineta = pinetum;
exceptions.pinfishes = pinfish;
exceptions.pinkoes = pinko;
exceptions.pinnae = pinna;
exceptions.pinnulae = pinnula;
exceptions.pipefishes = pipefish;
exceptions.pirogi = pirog;
exceptions.piscinae = piscina;
exceptions.pithecanthropi = pithecanthropus;
exceptions.pithoi = pithos;
exceptions.placeboes = placebo;
exceptions.placentae = placenta;
exceptions.planetaria = planetarium;
exceptions.planulae = planula;
exceptions.plasmodesmata = plasmodesma;
exceptions.plasmodia = plasmodium;
exceptions.plateaux = plateau;
exceptions.plectra = plectrum;
exceptions.plena = plenum;
exceptions.pleura = pleuron;
exceptions.pleurae = pleura;
exceptions.plicae = plica;
exceptions.ploughmen = ploughman;
exceptions.pneumobacilli = pneumobacillus;
exceptions.pneumococci = pneumococcus;
exceptions.pocketknives = pocketknife;
exceptions.podetia = podetium;
exceptions.podia = podium;
exceptions.poleis = polis;
exceptions.pollices = pollex;
exceptions.pollinia = pollinium;
exceptions.polychasia = polychasium;
exceptions.polyhedra = polyhedron;
exceptions.polyparia = polyparium;
exceptions.polypi = polypus;
exceptions.polyzoa = polyzoan;
exceptions.polyzoaria = polyzoarium;
exceptions.pontes = pons;
exceptions.pontifices = pontifex;
exceptions.portamenti = portamento;
exceptions.porticoes = portico;
exceptions.portmanteaux = portmanteau;
exceptions.postliminia = postliminium;
exceptions.potatoes = potato;
exceptions.praenomina = praenomen;
exceptions.praxes = praxis;
exceptions.predelle = predella;
exceptions.premaxillae = premaxilla;
exceptions.prenomina = prenomen;
exceptions.prese = presa;
exceptions.primi = primo;
exceptions.primigravidae = primigravida;
exceptions.primiparae = primipara;
exceptions.primordia = primordium;
exceptions.principia = principium;
exceptions.proboscides = proboscis;
exceptions.proglottides = proglottis;
exceptions.prognoses = prognosis;
exceptions.prolegomena = prolegomenon;
exceptions.prolepses = prolepsis;
exceptions.promycelia = promycelium;
exceptions.pronephra = pronephros;
exceptions.pronephroi = pronephros;
exceptions.pronuclei = pronucleus;
exceptions.propositi = propositus;
exceptions.proptoses = proptosis;
exceptions.propyla = propylon;
exceptions.propylaea = propylaeum;
exceptions.proscenia = proscenium;
exceptions.prosencephala = prosencephalon;
exceptions.prostheses = prosthesis;
exceptions.prostomia = prostomium;
exceptions.protases = protasis;
exceptions.prothalamia = prothalamium;
exceptions.prothalli = prothallus;
exceptions.prothallia = prothallium;
exceptions.prothoraces = prothorax;
exceptions.protonemata = protonema;
exceptions.protozoa = protozoan;
exceptions.proventriculi = proventriculus;
exceptions.provisoes = proviso;
exceptions.prytanea = prytaneum;
exceptions.psalteria = psalterium;
exceptions.pseudopodia = pseudopodium;
exceptions.psychoneuroses = psychoneurosis;
exceptions.psychoses = psychosis;
exceptions.pterygia = pterygium;
exceptions.pterylae = pteryla;
exceptions.ptoses = ptosis;
exceptions.pubes = pubis;
exceptions.pudenda = pudendum;
exceptions.puli = pul;
exceptions.pulvilli = pulvillus;
exceptions.pulvini = pulvinus;
exceptions.punchinelloes = punchinello;
exceptions.pupae = pupa;
exceptions.puparia = puparium;
exceptions.putamina = putamen;
exceptions.putti = putto;
exceptions.pycnidia = pycnidium;
exceptions.pygidia = pygidium;
exceptions.pylori = pylorus;
exceptions.pyxides = pyxis;
exceptions.pyxidia = pyxidium;
exceptions.qaddishim = qaddish;
exceptions.quadrennia = quadrennium;
exceptions.quadrigae = quadriga;
exceptions.qualia = quale;
exceptions.quanta = quantum;
exceptions.quarterstaves = quarterstaff;
exceptions.quezales = quezal;
exceptions.quinquennia = quinquennium;
exceptions.quizzes = quiz;
exceptions.rabatos = rabato;
exceptions.rabbitfishes = rabbitfish;
exceptions.rachides = rhachis;
exceptions.radices = radix;
exceptions.radii = radius;
exceptions.radulae = radula;
exceptions.ramenta = ramentum;
exceptions.rami = ramus;
exceptions.ranulae = ranula;
exceptions.ranunculi = ranunculus;
exceptions.raphae = raphe;
exceptions.raphides = raphide;
exceptions.ratfishes = ratfish;
exceptions.reales = real;
exceptions.rearmice = rearmouse;
exceptions.recta = rectum;
exceptions.recti = rectus;
exceptions.rectrices = rectrix;
exceptions.redfishes = redfish;
exceptions.rediae = redia;
exceptions.referenda = referendum;
exceptions.refugia = refugium;
exceptions.reguli = regulus;
exceptions.reis = real;
exceptions.relata = relatum;
exceptions.remiges = remex;
exceptions.reremice = reremouse;
exceptions.reseaux = reseau;
exceptions.residua = residuum;
exceptions.responsa = responsum;
exceptions.retia = rete;
exceptions.retiarii = retiarius;
exceptions.reticula = reticulum;
exceptions.retinacula = retinaculum;
exceptions.retinae = retina;
exceptions.rhabdomyomata = rhabdomyoma;
exceptions.rhachides = rhachis;
exceptions.rhachises = rachis;
exceptions.rhinencephala = rhinencephalon;
exceptions.rhizobia = rhizobium;
exceptions.rhombi = rhombus;
exceptions.rhonchi = rhonchus;
exceptions.rhyta = rhyton;
exceptions.ribbonfishes = ribbonfish;
exceptions.ricercacari = ricercare;
exceptions.ricercari = ricercare;
exceptions.rickettsiae = rickettsia;
exceptions.rilievi = rilievo;
exceptions.rimae = rima;
exceptions.rockfishes = rockfish;
exceptions.roma = rom;
exceptions.rondeaux = rondeau;
exceptions.rosaria = rosarium;
exceptions.rosefishes = rosefish;
exceptions.rostella = rostellum;
exceptions.rostra = rostrum;
exceptions.rouleaux = rouleau;
exceptions.rugae = ruga;
exceptions.rumina = rumen;
exceptions.sacra = sacrum;
exceptions.sacraria = sacrarium;
exceptions.saguaros = saguaro;
exceptions.sailfishes = sailfish;
exceptions.salespeople = salesperson;
exceptions.salmonellae = salmonella;
exceptions.salpae = salpa;
exceptions.salpinges = salpinx;
exceptions.saltarelli = saltarello;
exceptions.salvoes = salvo;
exceptions.sancta = sanctum;
exceptions.sanitaria = sanitarium;
exceptions.santimi = santims;
exceptions.saphenae = saphena;
exceptions.sarcophagi = sarcophagus;
exceptions.sartorii = sartorius;
exceptions.sassanidae = sassanid;
exceptions.sawfishes = sawfish;
exceptions.scaldfishes = scaldfish;
exceptions.scaleni = scalenus;
exceptions.scapulae = scapula;
exceptions.scarabaei = scarabaeus;
exceptions.scarves = scarf;
exceptions.schatchonim = schatchen;
exceptions.schemata = schema;
exceptions.scherzandi = scherzando;
exceptions.scherzi = scherzo;
exceptions.schmoes = schmo;
exceptions.scholia = scholium;
exceptions.schuln = schul;
exceptions.schutzstaffeln = schutzstaffel;
exceptions.scirrhi = scirrhus;
exceptions.scleromata = scleroma;
exceptions.scleroses = sclerosis;
exceptions.sclerotia = sclerotium;
exceptions.scoleces = scolex;
exceptions.scolices = scolex;
exceptions.scopulae = scopula;
exceptions.scoriae = scoria;
exceptions.scotomata = scotoma;
exceptions.scriptoria = scriptorium;
exceptions.scrota = scrotum;
exceptions.scudi = scudo;
exceptions.scuta = scutum;
exceptions.scutella = scutellum;
exceptions.scyphi = scyphus;
exceptions.scyphistomae = scyphistoma;
exceptions.scyphozoa = scyphozoan;
exceptions.secondi = secondo;
exceptions.segni = segno;
exceptions.seleucidae = seleucid;
exceptions.selves = self;
exceptions.senores = senor;
exceptions.sensilla = sensillum;
exceptions.senti = sent;
exceptions.senussis = senussi;
exceptions.separatrices = separatrix;
exceptions.sephardim = sephardi;
exceptions.septa = septum;
exceptions.septaria = septarium;
exceptions.septennia = septennium;
exceptions.sequelae = sequela;
exceptions.sequestra = sequestrum;
exceptions.sera = serum;
exceptions.seraphim = seraph;
exceptions.sestertia = sestertium;
exceptions.setae = seta;
exceptions.sgraffiti = sgraffito;
exceptions.shabbasim = shabbas;
exceptions.shabbatim = shabbat;
exceptions.shackoes = shacko;
exceptions.shadchanim = shadchan;
exceptions.shadchans =  shadchan;
exceptions.shakoes = shako;
exceptions.shammosim = shammes;
exceptions.sheatfishes = sheatfish;
exceptions.sheaves = sheaf;
exceptions.shellfishes = shellfish;
exceptions.shelves = shelf;
exceptions.shinleaves = shinleaf;
exceptions.shittim = shittah;
exceptions.shmoes = shmo;
exceptions.shofroth = shophar;
exceptions.shophroth = shophar;
exceptions.shrewmice = shrewmouse;
exceptions.shuln = shul;
exceptions.siddurim = siddur;
exceptions.sigloi = siglos;
exceptions.signore = signora;
exceptions.signori = signore;
exceptions.signorine = signorina;
exceptions.siliquae = siliqua;
exceptions.silvae = silva;
exceptions.silverfishes = silverfish;
exceptions.simulacra = simulacrum;
exceptions.sincipita = sinciput;
exceptions.sinfonie = sinfonia;
exceptions.sistra = sistrum;
exceptions.situlae = situla;
exceptions.smalti = smalto;
exceptions.snaggleteeth = snaggletooth;
exceptions.snailfishes = snailfish;
exceptions.snipefishes = snipefish;
exceptions.socmen = socman;
exceptions.sola = solum;
exceptions.solaria = solarium;
exceptions.solatia = solatium;
exceptions.soldi = soldo;
exceptions.soles = sol;
exceptions.solfeggi = solfeggio;
exceptions.soli = solo;
exceptions.solidi = solidus;
exceptions.somata = soma;
exceptions.soprani = soprano;
exceptions.sordini = sordino;
exceptions.sori = sorus;
exceptions.soroses = sorosis;
exceptions.sovkhozy = sovkhoz;
exceptions.spadefishes = spadefish;
exceptions.spadices = spadix;
exceptions.spearfishes = spearfish;
exceptions.spectra = spectrum;
exceptions.specula = speculum;
exceptions.spermatia = spermatium;
exceptions.spermatogonia = spermatogonium;
exceptions.spermatozoa = spermatozoon;
exceptions.spermogonia = spermogonium;
exceptions.sphinges = sphinx;
exceptions.spicae = spica;
exceptions.spicula = spiculum;
exceptions.spirilla = spirillum;
exceptions.splayfeet = splayfoot;
exceptions.splenii = splenius;
exceptions.sporangia = sporangium;
exceptions.sporogonia = sporogonium;
exceptions.sporozoa = sporozoan;
exceptions.springhase = springhaas;
exceptions.spumoni = spumone;
exceptions.sputa = sputum;
exceptions.squamae = squama;
exceptions.squashes = squash;
exceptions.squillae = squilla;
exceptions.squirrelfishes = squirrelfish;
exceptions.squizzes = squiz;
exceptions.stadia = stadium;
exceptions.stamina = stamen;
exceptions.staminodia = staminodium;
exceptions.stapedes = stapes;
exceptions.staphylococci = staphylococcus;
exceptions.staretsy = starets;
exceptions.starfishes = starfish;
exceptions.startsy = starets;
exceptions.stelae = stele;
exceptions.stemmata = stemma;
exceptions.stenoses = stenosis;
exceptions.stepchildren = stepchild;
exceptions.sterna = sternum;
exceptions.stigmata = stigma;
exceptions.stimuli = stimulus;
exceptions.stipites = stipes;
exceptions.stirpes = stirps;
exceptions.stoae = stoa;
exceptions.stockfishes = stockfish;
exceptions.stomata = stoma;
exceptions.stomodaea = stomodaeum;
exceptions.stomodea = stomodeum;
exceptions.stonefishes = stonefish;
exceptions.stotinki = stotinka;
exceptions.stotkini = stotinka;
exceptions.strappadoes = strappado;
exceptions.strata = stratum;
exceptions.strati = stratus;
exceptions.stratocumuli = stratocumulus;
exceptions.streptococci = streptococcus;
exceptions.stretti = stretto;
exceptions.striae = stria;
exceptions.strobili = strobilus;
exceptions.stromata = stroma;
exceptions.strumae = struma;
exceptions.stuccoes = stucco;
exceptions.styli = stylus;
exceptions.stylopes = stylops;
exceptions.stylopodia = stylopodium;
exceptions.subcortices = subcortex;
exceptions.subdeliria = subdelirium;
exceptions.subgenera = subgenus;
exceptions.subindices = subindex;
exceptions.submucosae = submucosa;
exceptions.subphyla = subphylum;
exceptions.substrasta = substratum;
exceptions.succedanea = succedaneum;
exceptions.succubi = succubus;
exceptions.suckerfishes = suckerfish;
exceptions.suckfishes = suckfish;
exceptions.sudaria = sudarium;
exceptions.sudatoria = sudatorium;
exceptions.sudatoria = sudatorium;
exceptions.sulci = sulcus;
exceptions.summae = summa;
exceptions.sunfishes = sunfish;
exceptions.supercargoes = supercargo;
exceptions.superheroes = superhero;
exceptions.supernovae = supernova;
exceptions.superstrata = superstratum;
exceptions.surgeonfishes = surgeonfish;
exceptions.swamies = swami;
exceptions.sweetiewives = sweetiewife;
exceptions.swellfishes = swellfish;
exceptions.swordfishes = swordfish;
exceptions.syconia = syconium;
exceptions.syllabi = syllabus;
exceptions.syllepses = syllepsis;
exceptions.symphyses = symphysis;
exceptions.sympodia = sympodium;
exceptions.symposia = symposium;
exceptions.synapses = synapsis;
exceptions.synarthroses = synarthrosis;
exceptions.synclinoria = synclinorium;
exceptions.syncytia = syncytium;
exceptions.syndesmoses = syndesmosis;
exceptions.synopses = synopsis;
exceptions.syntagmata = syntagma;
exceptions.syntheses = synthesis;
exceptions.syphilomata = syphiloma;
exceptions.syringes = syrinx;
exceptions.syssarcoses = syssarcosis;
exceptions.tableaux = tableau;
exceptions.taeniae = taenia;
exceptions.tali = talus;
exceptions.tallaisim = tallith;
exceptions.tallithes = tallith;
exceptions.tallitoth = tallith;
exceptions.tapeta = tapetum;
exceptions.tarantulae = tarantula;
exceptions.tarsi = tarsus;
exceptions.tarsometatarsi = tarsometatarsus;
exceptions.taxa = taxon;
exceptions.taxes = tax;
exceptions.taxies = taxi;
exceptions.tectrices = tectrix;
exceptions.teeth = tooth;
exceptions.tegmina = tegmen;
exceptions.telae = tela;
exceptions.telamones = telamon;
exceptions.telangiectases = telangiectasia;
exceptions.telia = telium;
exceptions.tempi = tempo;
exceptions.tenacula = tenaculum;
exceptions.tenderfeet = tenderfoot;
exceptions.teniae = tenia;
exceptions.tenues = tenuis;
exceptions.teraphim = teraph;
exceptions.terata = teras;
exceptions.teredines = teredo;
exceptions.terga = tergum;
exceptions.termini = terminus;
exceptions.terraria = terrarium;
exceptions.terzetti = terzetto;
exceptions.tesserae = tessera;
exceptions.testae = testa;
exceptions.testes = testis;
exceptions.testudines = testudo;
exceptions.tetrahedra = tetrahedron;
exceptions.tetraskelia = tetraskelion;
exceptions.thalamencephala = thalamencephalon;
exceptions.thalami = thalamus;
exceptions.thalli = thallus;
exceptions.thecae = theca;
exceptions.therses = thyrse;
exceptions.thesauri = thesaurus;
exceptions.theses = thesis;
exceptions.thickleaves = thickleaf;
exceptions.thieves = thief;
exceptions.tholoi = tholos;
exceptions.thoraces = thorax;
exceptions.thrombi = thrombus;
exceptions.thymi = thymus;
exceptions.thyrsi = thyrsus;
exceptions.tibiae = tibia;
exceptions.tilefishes = tilefish;
exceptions.tintinnabula = tintinnabulum;
exceptions.titmice = titmouse;
exceptions.toadfishes = toadfish;
exceptions.tobaccoes = tobacco;
exceptions.tomatoes = tomato;
exceptions.tomenta = tomentum;
exceptions.tondi = tondo;
exceptions.tonneaux = tonneau;
exceptions.tophi = tophus;
exceptions.topoi = topos;
exceptions.tori = torus;
exceptions.tornadoes = tornado;
exceptions.torpedoes = torpedo;
exceptions.torsi = torso;
exceptions.touracos = touraco;
exceptions.trabeculae = trabecula;
exceptions.tracheae = trachea;
exceptions.traditores = traditor;
exceptions.tragi = tragus;
exceptions.trapezia = trapezium;
exceptions.trapezohedra = trapezohedron;
exceptions.traumata = trauma;
exceptions.treponemata = treponema;
exceptions.trichinae = trichina;
exceptions.triclinia = triclinium;
exceptions.triennia = triennium;
exceptions.triforia = triforium;
exceptions.triggerfishes = triggerfish;
exceptions.trihedra = trihedron;
exceptions.triskelia = triskelion;
exceptions.trisoctahedra = trisoctahedron;
exceptions.triumviri = triumvir;
exceptions.trivia = trivium;
exceptions.trochleae = trochlea;
exceptions.tropaeola = tropaeolum;
exceptions.trousseaux = trousseau;
exceptions.trunkfishes = trunkfish;
exceptions.trymata = tryma;
exceptions.tubae = tuba;
exceptions.turves = turf;
exceptions.tympana = tympanum;
exceptions.tyros =  tyro;
exceptions.ubermenschen = ubermensch;
exceptions.uglies = ugli;
exceptions.uigurs = uighur;
exceptions.ulnae = ulna;
exceptions.ultimata = ultimatum;
exceptions.umbilici = umbilicus;
exceptions.umbones = umbo;
exceptions.umbrae = umbra;
exceptions.unci = uncus;
exceptions.uncidia = uredium;
exceptions.uredines = uredo;
exceptions.uredinia = uredinium;
exceptions.uredosori = uredosorus;
exceptions.urethrae = urethra;
exceptions.urinalyses = urinalysis;
exceptions.uteri = uterus;
exceptions.utriculi = utriculus;
exceptions.uvulae = uvula;
exceptions.vacua = vacuum;
exceptions.vagi = vagus;
exceptions.vaginae = vagina;
exceptions.valleculae = vallecula;
exceptions.vaporetti = vaporetto;
exceptions.varices = varix;
exceptions.vasa = vas;
exceptions.vascula = vasculum;
exceptions.vela = velum;
exceptions.velamina = velamen;
exceptions.velaria = velarium;
exceptions.venae = vena;
exceptions.ventriculi = ventriculus;
exceptions.vermes = vermis;
exceptions.verrucae = verruca;
exceptions.vertebrae = vertebra;
exceptions.vertices = vertex;
exceptions.vertigines = vertigo;
exceptions.vertigoes = vertigo;
exceptions.vesicae = vesica;
exceptions.vetoes = veto;
exceptions.vexilla = vexillum;
exceptions.viatica = viaticum;
exceptions.viatores = viator;
exceptions.vibracula = vibraculum;
exceptions.vibrissae = vibrissa;
exceptions.villi = villus;
exceptions.vimina = vimen;
exceptions.vincula = vinculum;
exceptions.viragoes = virago;
exceptions.vires = vis;
exceptions.virtuosi = virtuoso;
exceptions.vitae = vita;
exceptions.vitelli = vitellus;
exceptions.vittae = vitta;
exceptions.vivaria = vivarium;
exceptions.voces = vox;
exceptions.volcanoes = volcano;
exceptions.volkslieder = volkslied;
exceptions.volte = volta;
exceptions.volvae = volva;
exceptions.vorticellae = vorticella;
exceptions.vortices = vortex;
exceptions.vulvae = vulva;
exceptions.wahhabis = wahhabi;
exceptions.wanderjahre = wanderjahr;
exceptions.weakfishes = weakfish;
exceptions.werewolves = werewolf;
exceptions.wharves = wharf;
exceptions.whitefishes = whitefish;
exceptions.wives = wife;
exceptions.wolffishes = wolffish;
exceptions.wolves = wolf;
exceptions.woodlice = woodlouse;
exceptions.wreckfishes = wreckfish;
exceptions.wunderkinder = wunderkind;
exceptions.xiphisterna = xiphisternum;
exceptions.yeshivahs = yeshiva;
exceptions.yeshivoth = yeshiva;
exceptions.yogin = yogi;
exceptions.yourselves = yourself;
exceptions.zamindaris = zamindari;
exceptions.zecchini = zecchino;
exceptions.zeroes = zero;
exceptions.zoa = zoon;
exceptions.zoaeae = zoaea;
exceptions.zoeae = zoea;
exceptions.zoeas = zoaea;
exceptions.zoonoses = zoonosis;

module.exports = exceptions;

},{}],6:[function(require,module,exports){
//     wink-lexicon
//     English lexicon useful in NLP/NLU
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-lexicon”.
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//
// This data is derived from the WordNet project of Princeton University. The
// Wordnet is copyright by Princeton University. It is sourced from
// http://wordnet.princeton.edu/; the license text can be accessed at
// http://wordnet.princeton.edu/wordnet/license/ URL.
// WordNet License:
// WordNet Release 3.0 This software and database is being provided to you,
// the LICENSEE, by Princeton University under the following license.
// By obtaining, using and/or copying this software and database,
// you agree that you have read, understood, and will comply with these terms
// and conditions.:
// Permission to use, copy, modify and distribute this software and database and
// its documentation for any purpose and without fee or royalty is hereby
// granted, provided that you agree to comply with the following copyright
// notice and statements, including the disclaimer, and that the same appear
// on ALL copies of the software, database and documentation, including
// modifications that you make for internal use or for distribution.
// WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
// THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY
// MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.
// BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON UNIVERSITY MAKES NO
// REPRESENTATIONS OR WARRANTIES OF MERCHANT- ABILITY OR FITNESS FOR ANY
// PARTICULAR PURPOSE OR THAT THE USE OF THE LICENSED SOFTWARE, DATABASE OR
// DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
// TRADEMARKS OR OTHER RIGHTS. The name of Princeton University or Princeton
// may not be used in advertising or publicity pertaining to distribution of
// the software and/or database. Title to copyright in this software, database
// and any associated documentation shall at all times remain with
// Princeton University and LICENSEE agrees to preserve same.

/* eslint max-lines: ["error", {"max": 90000, "skipComments": true}] */
/* eslint-disable camelcase */

const exceptions = Object.create( null );
// Lemma constants.
const abet = 'abet';
const abhor = 'abhor';
const abide = 'abide';
const aby = 'aby';
const abut = 'abut';
const accompany = 'accompany';
const acetify = 'acetify';
const acidify = 'acidify';
const acquit = 'acquit';
const address = 'address';
const admit = 'admit';
const aerify = 'aerify';
const airdrop = 'airdrop';
const alkalify = 'alkalify';
const ally = 'ally';
const allot = 'allot';
const be = 'be';
const ammonify = 'ammonify';
const amnesty = 'amnesty';
const amplify = 'amplify';
const anglify = 'anglify';
const annul = 'annul';
const appal = 'appal';
const apply = 'apply';
const arc = 'arc';
const argufy = 'argufy';
const arise = 'arise';
const eat = 'eat';
const atrophy = 'atrophy';
const aver = 'aver';
const awake = 'awake';
const baby = 'baby';
const backbite = 'backbite';
const backslide = 'backslide';
const bid = 'bid';
const bag = 'bag';
const ballyrag = 'ballyrag';
const bandy = 'bandy';
const ban = 'ban';
const bar = 'bar';
const barrel = 'barrel';
const basify = 'basify';
const bat = 'bat';
const bayonet = 'bayonet';
const beat = 'beat';
const beatify = 'beatify';
const beautify = 'beautify';
const become = 'become';
const bed = 'bed';
const bedevil = 'bedevil';
const bedim = 'bedim';
const befall = 'befall';
const befit = 'befit';
const befog = 'befog';
const begin = 'begin';
const beget = 'beget';
const beg = 'beg';
const begird = 'begird';
const behold = 'behold';
const bejewel = 'bejewel';
const belly = 'belly';
const belie = 'belie';
const benefit = 'benefit';
const bename = 'bename';
const bend = 'bend';
const berry = 'berry';
const beset = 'beset';
const beseech = 'beseech';
const bespeak = 'bespeak';
const bestir = 'bestir';
const bestrew = 'bestrew';
const bestride = 'bestride';
const betake = 'betake';
const bethink = 'bethink';
const bet = 'bet';
const bevel = 'bevel';
const bias = 'bias';
const bing = 'bing';
const bin = 'bin';
const bite = 'bite';
const bit = 'bit';
const bivouac = 'bivouac';
const blab = 'blab';
const blackberry = 'blackberry';
const blackleg = 'blackleg';
const blat = 'blat';
const bleed = 'bleed';
const bless = 'bless';
const blow = 'blow';
const blip = 'blip';
const blob = 'blob';
const bloody = 'bloody';
const blot = 'blot';
const blub = 'blub';
const blur = 'blur';
const bob = 'bob';
const body = 'body';
const bootleg = 'bootleg';
const bop = 'bop';
const bear = 'bear';
const buy = 'buy';
const bind = 'bind';
const brag = 'brag';
const breed = 'breed';
const brevet = 'brevet';
const brim = 'brim';
const break1 = 'break';
const bring = 'bring';
const browbeat = 'browbeat';
const brutify = 'brutify';
const bud = 'bud';
const bug = 'bug';
const build = 'build';
const bulldog = 'bulldog';
const bully = 'bully';
const bullshit = 'bullshit';
const bullwhip = 'bullwhip';
const bullyrag = 'bullyrag';
const bum = 'bum';
const bury = 'bury';
const burn = 'burn';
const bur = 'bur';
const bushel = 'bushel';
const busy = 'busy';
const bypass = 'bypass';
const cabal = 'cabal';
const caddy = 'caddy';
const calcify = 'calcify';
const come = 'come';
const canal = 'canal';
const cancel = 'cancel';
const candy = 'candy';
const can = 'can';
const canopy = 'canopy';
const cap = 'cap';
const carburet = 'carburet';
const carillon = 'carillon';
const carny = 'carny';
const carnify = 'carnify';
const carol = 'carol';
const carry = 'carry';
const casefy = 'casefy';
const catnap = 'catnap';
const cat = 'cat';
const catch1 = 'catch';
const cavil = 'cavil';
const certify = 'certify';
const channel = 'channel';
const chap = 'chap';
const char = 'char';
const chat = 'chat';
const chivy = 'chivy';
const chide = 'chide';
const chin = 'chin';
const chip = 'chip';
const chisel = 'chisel';
const chitchat = 'chitchat';
const chiv = 'chiv';
const chondrify = 'chondrify';
const chop = 'chop';
const choose = 'choose';
const chug = 'chug';
const chum = 'chum';
const citify = 'citify';
const clothe = 'clothe';
const clad = 'clad';
const clam = 'clam';
const clap = 'clap';
const clarify = 'clarify';
const classify = 'classify';
const cleave = 'cleave';
const clem = 'clem';
const clepe = 'clepe';
const clip = 'clip';
const clog = 'clog';
const clop = 'clop';
const clot = 'clot';
const club = 'club';
const cling = 'cling';
const cockneyfy = 'cockneyfy';
const cod = 'cod';
const codify = 'codify';
const cog = 'cog';
const coif = 'coif';
const colly = 'colly';
const combat = 'combat';
const commit = 'commit';
const compel = 'compel';
const comply = 'comply';
const complot = 'complot';
const concur = 'concur';
const confab = 'confab';
const confer = 'confer';
const con = 'con';
const control = 'control';
const copy = 'copy';
const cop = 'cop';
const coquet = 'coquet';
const corral = 'corral';
const counsel = 'counsel';
const counterplot = 'counterplot';
const countersink = 'countersink';
const crab = 'crab';
const cram = 'cram';
const crap = 'crap';
const creep = 'creep';
const crib = 'crib';
const cry = 'cry';
const crop = 'crop';
const crossbreed = 'crossbreed';
const crosscut = 'crosscut';
const crucify = 'crucify';
const cub = 'cub';
const cudgel = 'cudgel';
const cupel = 'cupel';
const cup = 'cup';
const curet = 'curet';
const curry = 'curry';
const curse = 'curse';
const curtsy = 'curtsy';
const curvet = 'curvet';
const cut = 'cut';
const dab = 'dab';
const dag = 'dag';
const dally = 'dally';
const dam = 'dam';
const damnify = 'damnify';
const dandify = 'dandify';
const dap = 'dap';
const deal = 'deal';
const debar = 'debar';
const debug = 'debug';
const debus = 'debus';
const decalcify = 'decalcify';
const declassify = 'declassify';
const decontrol = 'decontrol';
const decry = 'decry';
const defer = 'defer';
const defy = 'defy';
const degas = 'degas';
const dehumidify = 'dehumidify';
const deify = 'deify';
const demit = 'demit';
const demob = 'demob';
const demulsify = 'demulsify';
const demur = 'demur';
const demystify = 'demystify';
const denazify = 'denazify';
const deny = 'deny';
const denitrify = 'denitrify';
const den = 'den';
const descry = 'descry';
const deter = 'deter';
const detoxify = 'detoxify';
const devil = 'devil';
const devitrify = 'devitrify';
const diagram = 'diagram';
const dial = 'dial';
const dib = 'dib';
const do1 = 'do';
const dig = 'dig';
const dignify = 'dignify';
const dim = 'dim';
const din = 'din';
const dip = 'dip';
const dirty = 'dirty';
const disannul = 'disannul';
const disbar = 'disbar';
const disbud = 'disbud';
const disembody = 'disembody';
const disembowel = 'disembowel';
const disenthral = 'disenthral';
const disenthrall = 'disenthrall';
const dishevel = 'dishevel';
const disinter = 'disinter';
const dispel = 'dispel';
const disqualify = 'disqualify';
const dissatisfy = 'dissatisfy';
const distil = 'distil';
const diversify = 'diversify';
const divvy = 'divvy';
const dizzy = 'dizzy';
const dog = 'dog';
const dogleg = 'dogleg';
const dolly = 'dolly';
const don = 'don';
const dot = 'dot';
const dow = 'dow';
const dive = 'dive';
const drab = 'drab';
const drag = 'drag';
const drink = 'drink';
const draw = 'draw';
const dream = 'dream';
const dry = 'dry';
const drip = 'drip';
const drivel = 'drivel';
const drive = 'drive';
const drop = 'drop';
const drub = 'drub';
const drug = 'drug';
const drum = 'drum';
const dub = 'dub';
const duel = 'duel';
const dulcify = 'dulcify';
const dummy = 'dummy';
const dun = 'dun';
const dwell = 'dwell';
const die = 'die';
const easy = 'easy';
const eavesdrop = 'eavesdrop';
const eddy = 'eddy';
const edify = 'edify';
const electrify = 'electrify';
const embed = 'embed';
const embody = 'embody';
const embus = 'embus';
const emit = 'emit';
const empanel = 'empanel';
const empty = 'empty';
const emulsify = 'emulsify';
const enamel = 'enamel';
const englut = 'englut';
const enrol = 'enrol';
const enthral = 'enthral';
const entrammel = 'entrammel';
const entrap = 'entrap';
const envy = 'envy';
const enwind = 'enwind';
const enwrap = 'enwrap';
const equal = 'equal';
const equip = 'equip';
const espy = 'espy';
const esterify = 'esterify';
const estop = 'estop';
const etherify = 'etherify';
const excel = 'excel';
const exemplify = 'exemplify';
const expel = 'expel';
const extol = 'extol';
const facet = 'facet';
const fag = 'fag';
const fall = 'fall';
const falsify = 'falsify';
const fancy = 'fancy';
const fan = 'fan';
const fantasy = 'fantasy';
const fat = 'fat';
const featherbed = 'featherbed';
const feed = 'feed';
const feel = 'feel';
const ferry = 'ferry';
const fib = 'fib';
const fig = 'fig';
const fin = 'fin';
const fit = 'fit';
const flag = 'flag';
const flam = 'flam';
const flannel = 'flannel';
const flap = 'flap';
const flat = 'flat';
const flee = 'flee';
const fly = 'fly';
const flimflam = 'flimflam';
const flip = 'flip';
const flit = 'flit';
const flog = 'flog';
const floodlight = 'floodlight';
const flop = 'flop';
const flub = 'flub';
const fling = 'fling';
const flurry = 'flurry';
const flyblow = 'flyblow';
const fob = 'fob';
const fog = 'fog';
const footslog = 'footslog';
const forbid = 'forbid';
const forbear = 'forbear';
const fordo = 'fordo';
const foredo = 'foredo';
const forego = 'forego';
const foreknow = 'foreknow';
const forerun = 'forerun';
const foresee = 'foresee';
const foreshow = 'foreshow';
const forespeak = 'forespeak';
const foretell = 'foretell';
const forgive = 'forgive';
const forget = 'forget';
const forgo = 'forgo';
const format = 'format';
const forsake = 'forsake';
const forspeak = 'forspeak';
const forswear = 'forswear';
const fortify = 'fortify';
const fight = 'fight';
const find = 'find';
const foxtrot = 'foxtrot';
const frap = 'frap';
const frenchify = 'frenchify';
const frenzy = 'frenzy';
const fret = 'fret';
const fry = 'fry';
const frig = 'frig';
const frit = 'frit';
const frivol = 'frivol';
const frog = 'frog';
const frolic = 'frolic';
const freeze = 'freeze';
const fructify = 'fructify';
const fuel = 'fuel';
const fulfil = 'fulfil';
const fun = 'fun';
const funnel = 'funnel';
const fur = 'fur';
const gad = 'gad';
const gag = 'gag';
const gainsay = 'gainsay';
const gambol = 'gambol';
const gam = 'gam';
const gin = 'gin';
const gan = 'gan';
const gap = 'gap';
const gasify = 'gasify';
const gas = 'gas';
const give = 'give';
const gel = 'gel';
const geld = 'geld';
const gem = 'gem';
const get = 'get';
const ghostwrite = 'ghostwrite';
const gib = 'gib';
const giddy = 'giddy';
const giftwrap = 'giftwrap';
const gig = 'gig';
const gild = 'gild';
const gip = 'gip';
const gird = 'gird';
const glom = 'glom';
const glory = 'glory';
const glorify = 'glorify';
const glut = 'glut';
const gnaw = 'gnaw';
const golly = 'golly';
const go = 'go';
const grab = 'grab';
const gratify = 'gratify';
const gravel = 'gravel';
const grave = 'grave';
const grow = 'grow';
const grin = 'grin';
const grip = 'grip';
const grit = 'grit';
const grind = 'grind';
const grovel = 'grovel';
const grub = 'grub';
const guaranty = 'guaranty';
const gully = 'gully';
const gum = 'gum';
const gun = 'gun';
const gyp = 'gyp';
const hacksaw = 'hacksaw';
const have = 'have';
const ham = 'ham';
const hamstring = 'hamstring';
const handfeed = 'handfeed';
const handicap = 'handicap';
const handsel = 'handsel';
const harry = 'harry';
const hatchel = 'hatchel';
const hat = 'hat';
const hear = 'hear';
const hedgehop = 'hedgehop';
const hold = 'hold';
const hem = 'hem';
const hew = 'hew';
const hiccup = 'hiccup';
const hide = 'hide';
const hinny = 'hinny';
const hit = 'hit';
const hob = 'hob';
const hobnob = 'hobnob';
const hocus = 'hocus';
const hog = 'hog';
const hogtie = 'hogtie';
const honey = 'honey';
const hop = 'hop';
const horrify = 'horrify';
const horsewhip = 'horsewhip';
const housel = 'housel';
const heave = 'heave';
const hovel = 'hovel';
const hug = 'hug';
const humbug = 'humbug';
const humidify = 'humidify';
const hum = 'hum';
const hang = 'hang';
const hurry = 'hurry';
const hypertrophy = 'hypertrophy';
const identify = 'identify';
const imbed = 'imbed';
const impanel = 'impanel';
const impel = 'impel';
const imply = 'imply';
const inbreed = 'inbreed';
const incur = 'incur';
const indemnify = 'indemnify';
const indwell = 'indwell';
const infer = 'infer';
const initial = 'initial';
const inlay = 'inlay';
const inset = 'inset';
const inspan = 'inspan';
const install = 'install';
const intensify = 'intensify';
const interbreed = 'interbreed';
const intercrop = 'intercrop';
const intercut = 'intercut';
const interlay = 'interlay';
const interlap = 'interlap';
const intermarry = 'intermarry';
const intermit = 'intermit';
const interplead = 'interplead';
const inter = 'inter';
const interstratify = 'interstratify';
const interweave = 'interweave';
const intromit = 'intromit';
const inweave = 'inweave';
const inwrap = 'inwrap';
const jab = 'jab';
const jag = 'jag';
const jam = 'jam';
const japan = 'japan';
const jar = 'jar';
const jelly = 'jelly';
const jellify = 'jellify';
const jemmy = 'jemmy';
const jet = 'jet';
const jewel = 'jewel';
const jib = 'jib';
const jig = 'jig';
const jimmy = 'jimmy';
const jitterbug = 'jitterbug';
const job = 'job';
const jog = 'jog';
const jolly = 'jolly';
const jollify = 'jollify';
const jot = 'jot';
const joypop = 'joypop';
const jug = 'jug';
const justify = 'justify';
const jut = 'jut';
const ken = 'ken';
const kennel = 'kennel';
const keep = 'keep';
const kernel = 'kernel';
const kid = 'kid';
const kidnap = 'kidnap';
const kip = 'kip';
const knap = 'knap';
const kneecap = 'kneecap';
const kneel = 'kneel';
const know = 'know';
const knit = 'knit';
const knob = 'knob';
const knot = 'knot';
const label = 'label';
const lade = 'lade';
const ladify = 'ladify';
const lag = 'lag';
const lay = 'lay';
const lie = 'lie';
const lallygag = 'lallygag';
const lam = 'lam';
const lapidify = 'lapidify';
const lap = 'lap';
const laurel = 'laurel';
const lean = 'lean';
const leapfrog = 'leapfrog';
const leap = 'leap';
const learn = 'learn';
const lead = 'lead';
const leave = 'leave';
const lend = 'lend';
const let1 = 'let';
const level = 'level';
const levy = 'levy';
const libel = 'libel';
const lignify = 'lignify';
const lip = 'lip';
const liquefy = 'liquefy';
const liquify = 'liquify';
const light = 'light';
const lob = 'lob';
const lobby = 'lobby';
const log = 'log';
const lop = 'lop';
const lose = 'lose';
const lot = 'lot';
const lug = 'lug';
const lullaby = 'lullaby';
const mad = 'mad';
const make = 'make';
const magnify = 'magnify';
const man = 'man';
const manumit = 'manumit';
const map = 'map';
const marcel = 'marcel';
const mar = 'mar';
const marry = 'marry';
const marshal = 'marshal';
const marvel = 'marvel';
const mat = 'mat';
const mean = 'mean';
const medal = 'medal';
const meet = 'meet';
const metal = 'metal';
const metrify = 'metrify';
const may = 'may';
const mimic = 'mimic';
const minify = 'minify';
const misapply = 'misapply';
const misbecome = 'misbecome';
const miscarry = 'miscarry';
const misdeal = 'misdeal';
const misfit = 'misfit';
const misgive = 'misgive';
const mishit = 'mishit';
const mislay = 'mislay';
const mislead = 'mislead';
const misplead = 'misplead';
const misspell = 'misspell';
const misspend = 'misspend';
const mistake = 'mistake';
const misunderstand = 'misunderstand';
const mob = 'mob';
const model = 'model';
const modify = 'modify';
const mollify = 'mollify';
const melt = 'melt';
const mop = 'mop';
const mortify = 'mortify';
const mow = 'mow';
const mud = 'mud';
const muddy = 'muddy';
const mug = 'mug';
const multiply = 'multiply';
const mum = 'mum';
const mummify = 'mummify';
const mutiny = 'mutiny';
const mystify = 'mystify';
const nab = 'nab';
const nag = 'nag';
const nap = 'nap';
const net = 'net';
const nib = 'nib';
const nickel = 'nickel';
const nidify = 'nidify';
const nigrify = 'nigrify';
const nip = 'nip';
const nitrify = 'nitrify';
const nod = 'nod';
const nonplus = 'nonplus';
const notify = 'notify';
const nullify = 'nullify';
const nut = 'nut';
const objectify = 'objectify';
const occupy = 'occupy';
const occur = 'occur';
const offset = 'offset';
const omit = 'omit';
const ossify = 'ossify';
const outbid = 'outbid';
const outbreed = 'outbreed';
const outcry = 'outcry';
const outcrop = 'outcrop';
const outdo = 'outdo';
const outdraw = 'outdraw';
const outfit = 'outfit';
const outfight = 'outfight';
const outgas = 'outgas';
const outgeneral = 'outgeneral';
const outgo = 'outgo';
const outgrow = 'outgrow';
const outlay = 'outlay';
const outman = 'outman';
const output = 'output';
const outrun = 'outrun';
const outride = 'outride';
const outshine = 'outshine';
const outshoot = 'outshoot';
const outsell = 'outsell';
const outspan = 'outspan';
const outstand = 'outstand';
const outstrip = 'outstrip';
const outthink = 'outthink';
const outwit = 'outwit';
const outwear = 'outwear';
const overbid = 'overbid';
const overblow = 'overblow';
const overbear = 'overbear';
const overbuild = 'overbuild';
const overcome = 'overcome';
const overcrop = 'overcrop';
const overdo = 'overdo';
const overdraw = 'overdraw';
const overdrive = 'overdrive';
const overfly = 'overfly';
const overflow = 'overflow';
const overgrow = 'overgrow';
const overhear = 'overhear';
const overhang = 'overhang';
const overlay = 'overlay';
const overlie = 'overlie';
const overlap = 'overlap';
const overman = 'overman';
const overpay = 'overpay';
const overpass = 'overpass';
const overrun = 'overrun';
const override = 'override';
const oversee = 'oversee';
const overset = 'overset';
const oversew = 'oversew';
const overshoot = 'overshoot';
const oversimplify = 'oversimplify';
const oversleep = 'oversleep';
const oversell = 'oversell';
const overspend = 'overspend';
const overspill = 'overspill';
const overstep = 'overstep';
const overtake = 'overtake';
const overthrow = 'overthrow';
const overtop = 'overtop';
const overwind = 'overwind';
const overwrite = 'overwrite';
const pacify = 'pacify';
const pad = 'pad';
const pay = 'pay';
const pal = 'pal';
const palsy = 'palsy';
const pandy = 'pandy';
const panel = 'panel';
const panic = 'panic';
const pan = 'pan';
const parallel = 'parallel';
const parcel = 'parcel';
const parody = 'parody';
const parry = 'parry';
const partake = 'partake';
const pasquinade = 'pasquinade';
const patrol = 'patrol';
const pat = 'pat';
const pedal = 'pedal';
const peg = 'peg';
const pencil = 'pencil';
const pen = 'pen';
const pep = 'pep';
const permit = 'permit';
const personify = 'personify';
const petrify = 'petrify';
const pet = 'pet';
const pettifog = 'pettifog';
const phantasy = 'phantasy';
const photocopy = 'photocopy';
const photomap = 'photomap';
const photoset = 'photoset';
const physic = 'physic';
const picnic = 'picnic';
const pig = 'pig';
const pillory = 'pillory';
const pin = 'pin';
const pip = 'pip';
const pistol = 'pistol';
const pitapat = 'pitapat';
const pity = 'pity';
const pit = 'pit';
const plan = 'plan';
const plat = 'plat';
const plead = 'plead';
const ply = 'ply';
const plod = 'plod';
const plop = 'plop';
const plot = 'plot';
const plug = 'plug';
const pod = 'pod';
const pommel = 'pommel';
const popes = 'popes';
const pop = 'pop';
const pot = 'pot';
const preachify = 'preachify';
const precancel = 'precancel';
const prefer = 'prefer';
const preoccupy = 'preoccupy';
const prepay = 'prepay';
const presignify = 'presignify';
const pretermit = 'pretermit';
const pretty = 'pretty';
const prettify = 'prettify';
const pry = 'pry';
const prig = 'prig';
const prim = 'prim';
const prod = 'prod';
const program = 'program';
const prologue = 'prologue';
const propel = 'propel';
const prophesy = 'prophesy';
const prop = 'prop';
const prove = 'prove';
const pub = 'pub';
const pug = 'pug';
const pummel = 'pummel';
const pun = 'pun';
const pup = 'pup';
const purify = 'purify';
const putrefy = 'putrefy';
const putty = 'putty';
const put = 'put';
const qualify = 'qualify';
const quantify = 'quantify';
const quarrel = 'quarrel';
const quarry = 'quarry';
const quartersaw = 'quartersaw';
const query = 'query';
const quickstep = 'quickstep';
const quip = 'quip';
const quit = 'quit';
const quiz = 'quiz';
const rag = 'rag';
const rally = 'rally';
const ramify = 'ramify';
const ram = 'ram';
const run = 'run';
const ring = 'ring';
const rap = 'rap';
const rappel = 'rappel';
const rarefy = 'rarefy';
const ratify = 'ratify';
const rat = 'rat';
const ravel = 'ravel';
const rebel = 'rebel';
const rebuild = 'rebuild';
const rebut = 'rebut';
const recap = 'recap';
const reclassify = 'reclassify';
const recommit = 'recommit';
const recopy = 'recopy';
const rectify = 'rectify';
const recur = 'recur';
const red = 'red';
const redo = 'redo';
const refer = 'refer';
const refit = 'refit';
const reave = 'reave';
const refuel = 'refuel';
const regret = 'regret';
const rehear = 'rehear';
const reify = 'reify';
const rely = 'rely';
const remake = 'remake';
const remarry = 'remarry';
const remit = 'remit';
const rend = 'rend';
const repay = 'repay';
const repel = 'repel';
const replevy = 'replevy';
const reply = 'reply';
const repot = 'repot';
const rerun = 'rerun';
const resit = 'resit';
const reset = 'reset';
const resew = 'resew';
const retake = 'retake';
const rethink = 'rethink';
const retell = 'retell';
const retransmit = 'retransmit';
const retry = 'retry';
const retrofit = 'retrofit';
const ret = 'ret';
const reunify = 'reunify';
const revel = 'revel';
const revet = 'revet';
const revivify = 'revivify';
const rev = 'rev';
const rewind = 'rewind';
const rewrite = 'rewrite';
const rib = 'rib';
const ricochet = 'ricochet';
const rid = 'rid';
const ride = 'ride';
const rig = 'rig';
const rigidify = 'rigidify';
const rim = 'rim';
const rip = 'rip';
const rise = 'rise';
const rival = 'rival';
const rive = 'rive';
const rob = 'rob';
const rot = 'rot';
const reeve = 'reeve';
const rowel = 'rowel';
const rub = 'rub';
const rut = 'rut';
const saccharify = 'saccharify';
const sag = 'sag';
const say = 'say';
const salary = 'salary';
const salify = 'salify';
const sally = 'sally';
const sanctify = 'sanctify';
const sandbag = 'sandbag';
const sing = 'sing';
const sink = 'sink';
const saponify = 'saponify';
const sap = 'sap';
const sit = 'sit';
const satisfy = 'satisfy';
const savvy = 'savvy';
const see = 'see';
const saw = 'saw';
const scag = 'scag';
const scan = 'scan';
const scarify = 'scarify';
const scar = 'scar';
const scat = 'scat';
const scorify = 'scorify';
const scrag = 'scrag';
const scram = 'scram';
const scrap = 'scrap';
const scry = 'scry';
const scrub = 'scrub';
const scrum = 'scrum';
const scud = 'scud';
const scum = 'scum';
const scurry = 'scurry';
const seed = 'seed';
const send = 'send';
const set = 'set';
const sew = 'sew';
const shag = 'shag';
const shake = 'shake';
const sham = 'sham';
const sharecrop = 'sharecrop';
const shit = 'shit';
const shave = 'shave';
const shed = 'shed';
const shellac = 'shellac';
const shend = 'shend';
const shew = 'shew';
const shy = 'shy';
const shikar = 'shikar';
const shillyshally = 'shillyshally';
const shim = 'shim';
const shimmy = 'shimmy';
const shin = 'shin';
const ship = 'ship';
const shoe = 'shoe';
const shine = 'shine';
const shop = 'shop';
const shoot = 'shoot';
const shotgun = 'shotgun';
const shot = 'shot';
const shovel = 'shovel';
const show = 'show';
const shrink = 'shrink';
const shred = 'shred';
const shrivel = 'shrivel';
const shrive = 'shrive';
const shrug = 'shrug';
const shun = 'shun';
const shut = 'shut';
const sic = 'sic';
const sideslip = 'sideslip';
const sidestep = 'sidestep';
const sightsee = 'sightsee';
const signal = 'signal';
const signify = 'signify';
const silicify = 'silicify';
const simplify = 'simplify';
const sin = 'sin';
const sip = 'sip';
const shear = 'shear';
const skelly = 'skelly';
const sken = 'sken';
const sket = 'sket';
const skid = 'skid';
const skim = 'skim';
const skin = 'skin';
const skip = 'skip';
const skivvy = 'skivvy';
const skydive = 'skydive';
const slab = 'slab';
const slag = 'slag';
const slay = 'slay';
const slam = 'slam';
const slap = 'slap';
const slat = 'slat';
const sled = 'sled';
const sleep = 'sleep';
const slide = 'slide';
const slip = 'slip';
const slit = 'slit';
const slog = 'slog';
const slop = 'slop';
const slot = 'slot';
const slug = 'slug';
const slum = 'slum';
const sling = 'sling';
const slink = 'slink';
const slur = 'slur';
const smell = 'smell';
const smite = 'smite';
const smut = 'smut';
const snag = 'snag';
const snap = 'snap';
const sned = 'sned';
const snip = 'snip';
const snivel = 'snivel';
const snog = 'snog';
const snub = 'snub';
const sneak = 'sneak';
const snug = 'snug';
const sob = 'sob';
const sod = 'sod';
const sell = 'sell';
const solemnify = 'solemnify';
const solidify = 'solidify';
const soothsay = 'soothsay';
const sop = 'sop';
const seek = 'seek';
const sow = 'sow';
const spag = 'spag';
const spancel = 'spancel';
const span = 'span';
const spar = 'spar';
const spit = 'spit';
const spat = 'spat';
const specify = 'specify';
const speed = 'speed';
const speechify = 'speechify';
const spellbind = 'spellbind';
const spell = 'spell';
const spend = 'spend';
const spy = 'spy';
const spill = 'spill';
const spin = 'spin';
const spiral = 'spiral';
const split = 'split';
const spoil = 'spoil';
const speak = 'speak';
const spotlight = 'spotlight';
const spot = 'spot';
const spring = 'spring';
const sprig = 'sprig';
const spud = 'spud';
const spur = 'spur';
const squat = 'squat';
const squib = 'squib';
const squid = 'squid';
const squeegee = 'squeegee';
const stab = 'stab';
const stink = 'stink';
const star = 'star';
const steady = 'steady';
const stellify = 'stellify';
const stem = 'stem';
const stencil = 'stencil';
const step = 'step';
const stet = 'stet';
const sty = 'sty';
const stiletto = 'stiletto';
const stir = 'stir';
const steal = 'steal';
const stand = 'stand';
const stop = 'stop';
const story = 'story';
const stot = 'stot';
const stave = 'stave';
const strap = 'strap';
const stratify = 'stratify';
const strew = 'strew';
const stride = 'stride';
const strip = 'strip';
const strive = 'strive';
const strop = 'strop';
const strow = 'strow';
const strike = 'strike';
const strum = 'strum';
const string = 'string';
const strut = 'strut';
const stub = 'stub';
const stick = 'stick';
const stud = 'stud';
const study = 'study';
const stultify = 'stultify';
const stum = 'stum';
const sting = 'sting';
const stun = 'stun';
const stupefy = 'stupefy';
const stymie = 'stymie';
const sub = 'sub';
const subjectify = 'subjectify';
const sublet = 'sublet';
const submit = 'submit';
const subtotal = 'subtotal';
const sully = 'sully';
const sulphuret = 'sulphuret';
const sum = 'sum';
const sun = 'sun';
const sup = 'sup';
const supply = 'supply';
const swab = 'swab';
const swag = 'swag';
const swim = 'swim';
const swap = 'swap';
const swat = 'swat';
const sweep = 'sweep';
const swig = 'swig';
const swivel = 'swivel';
const swell = 'swell';
const swear = 'swear';
const swot = 'swot';
const swing = 'swing';
const syllabify = 'syllabify';
const symbol = 'symbol';
const tab = 'tab';
const tag = 'tag';
const take = 'take';
const talc = 'talc';
const tally = 'tally';
const tammy = 'tammy';
const tan = 'tan';
const tap = 'tap';
const tar = 'tar';
const tarry = 'tarry';
const tassel = 'tassel';
const tat = 'tat';
const teach = 'teach';
const taxis = 'taxis';
const taxi = 'taxi';
const teasel = 'teasel';
const ted = 'ted';
const tepefy = 'tepefy';
const terrify = 'terrify';
const testes = 'testes';
const testify = 'testify';
const thin = 'thin';
const think = 'think';
const throw1 = 'throw';
const thrive = 'thrive';
const throb = 'throb';
const thrum = 'thrum';
const thud = 'thud';
const tidy = 'tidy';
const tin = 'tin';
const tinsel = 'tinsel';
const tip = 'tip';
const tittup = 'tittup';
const toady = 'toady';
const tog = 'tog';
const tell = 'tell';
const top = 'top';
const tear = 'tear';
const torrefy = 'torrefy';
const total = 'total';
const tot = 'tot';
const towel = 'towel';
const traffic = 'traffic';
const trammel = 'trammel';
const tram = 'tram';
const transfer = 'transfer';
const transfix = 'transfix';
const transship = 'transship';
const tranship = 'tranship';
const transmit = 'transmit';
const transmogrify = 'transmogrify';
const trapan = 'trapan';
const trap = 'trap';
const travel = 'travel';
const travesty = 'travesty';
const trek = 'trek';
const trepan = 'trepan';
const try1 = 'try';
const trig = 'trig';
const trim = 'trim';
const trip = 'trip';
const tread = 'tread';
const trog = 'trog';
const trot = 'trot';
const trowel = 'trowel';
const tug = 'tug';
const tumefy = 'tumefy';
const tun = 'tun';
const tunnel = 'tunnel';
const tup = 'tup';
const twig = 'twig';
const twin = 'twin';
const twit = 'twit';
const tie = 'tie';
const typeset = 'typeset';
const typewrite = 'typewrite';
const typify = 'typify';
const uglify = 'uglify';
const unbar = 'unbar';
const unbend = 'unbend';
const unbind = 'unbind';
const uncap = 'uncap';
const unclothe = 'unclothe';
const unclog = 'unclog';
const underbid = 'underbid';
const underbuy = 'underbuy';
const undercut = 'undercut';
const underfeed = 'underfeed';
const undergird = 'undergird';
const undergo = 'undergo';
const underlay = 'underlay';
const underlie = 'underlie';
const underlet = 'underlet';
const underpay = 'underpay';
const underpin = 'underpin';
const underprop = 'underprop';
const underset = 'underset';
const undershoot = 'undershoot';
const undersell = 'undersell';
const understand = 'understand';
const understudy = 'understudy';
const undertake = 'undertake';
const underwrite = 'underwrite';
const undo = 'undo';
const unfit = 'unfit';
const unfreeze = 'unfreeze';
const unify = 'unify';
const unkennel = 'unkennel';
const unknit = 'unknit';
const unlay = 'unlay';
const unlearn = 'unlearn';
const unmake = 'unmake';
const unman = 'unman';
const unpeg = 'unpeg';
const unpin = 'unpin';
const unplug = 'unplug';
const unravel = 'unravel';
const unrig = 'unrig';
const unrip = 'unrip';
const unreeve = 'unreeve';
const unsay = 'unsay';
const unship = 'unship';
const unsling = 'unsling';
const unsnap = 'unsnap';
const unspeak = 'unspeak';
const unsteady = 'unsteady';
const unstep = 'unstep';
const unstop = 'unstop';
const unstring = 'unstring';
const unstick = 'unstick';
const unswear = 'unswear';
const unteach = 'unteach';
const unthink = 'unthink';
const untidy = 'untidy';
const untread = 'untread';
const untie = 'untie';
const unwind = 'unwind';
const unwrap = 'unwrap';
const unzip = 'unzip';
const upbuild = 'upbuild';
const uphold = 'uphold';
const upheave = 'upheave';
const up = 'up';
const uppercut = 'uppercut';
const uprise = 'uprise';
const upset = 'upset';
const upspring = 'upspring';
const upsweep = 'upsweep';
const upswell = 'upswell';
const upswing = 'upswing';
const vag = 'vag';
const vary = 'vary';
const vat = 'vat';
const verbify = 'verbify';
const verify = 'verify';
const versify = 'versify';
const vet = 'vet';
const victual = 'victual';
const vilify = 'vilify';
const vitrify = 'vitrify';
const vitriol = 'vitriol';
const vivify = 'vivify';
const vie = 'vie';
const wad = 'wad';
const waddy = 'waddy';
const wadset = 'wadset';
const wag = 'wag';
const wan = 'wan';
const war = 'war';
const waylay = 'waylay';
const weary = 'weary';
const weatherstrip = 'weatherstrip';
const web = 'web';
const wed = 'wed';
const weed = 'weed';
const weep = 'weep';
const wet = 'wet';
const wham = 'wham';
const whap = 'whap';
const whet = 'whet';
const whinny = 'whinny';
const whip = 'whip';
const whipsaw = 'whipsaw';
const whir = 'whir';
const whiz = 'whiz';
const whop = 'whop';
const wig = 'wig';
const wigwag = 'wigwag';
const wildcat = 'wildcat';
const will = 'will';
const win = 'win';
const winterfeed = 'winterfeed';
const wiredraw = 'wiredraw';
const withdraw = 'withdraw';
const withhold = 'withhold';
const withstand = 'withstand';
const wake = 'wake';
const won = 'won';
const wear = 'wear';
const worry = 'worry';
const worship = 'worship';
const wind = 'wind';
const weave = 'weave';
const wrap = 'wrap';
const wry = 'wry';
const write = 'write';
const work = 'work';
const wring = 'wring';
const yak = 'yak';
const yap = 'yap';
const yen = 'yen';
const yodel = 'yodel';
const zap = 'zap';
const zigzag = 'zigzag';
const zip = 'zip';

// Verb to lemma mappings.
exceptions.abetted = abet;
exceptions.abetting = abet;
exceptions.abhorred = abhor;
exceptions.abhorring = abhor;
exceptions.abode = abide;
exceptions.abought = aby;
exceptions.abutted = abut;
exceptions.abutting = abut;
exceptions.abye = aby;
exceptions.accompanied = accompany;
exceptions.acetified = acetify;
exceptions.acidified = acidify;
exceptions.acquitted = acquit;
exceptions.acquitting = acquit;
exceptions.addrest = address;
exceptions.admitted = admit;
exceptions.admitting = admit;
exceptions.aerified = aerify;
exceptions.airdropped = airdrop;
exceptions.airdropping = airdrop;
exceptions.alkalified = alkalify;
exceptions.allied = ally;
exceptions.allotted = allot;
exceptions.allotting = allot;
exceptions.am = be;
exceptions.ammonified = ammonify;
exceptions.amnestied = amnesty;
exceptions.amplified = amplify;
exceptions.anglified = anglify;
exceptions.annulled = annul;
exceptions.annulling = annul;
exceptions.appalled = appal;
exceptions.appalling = appal;
exceptions.applied = apply;
exceptions.arcked = arc;
exceptions.arcking = arc;
exceptions.are = be;
exceptions.argufied = argufy;
exceptions.arisen = arise;
exceptions.arose = arise;
exceptions.ate = eat;
exceptions.atrophied = atrophy;
exceptions.averred = aver;
exceptions.averring = aver;
exceptions.awoke = awake;
exceptions.awoken = awake;
exceptions.babied = baby;
exceptions.backbit = backbite;
exceptions.backbitten = backbite;
exceptions.backslid = backslide;
exceptions.backslidden = backslide;
exceptions.bade = bid;
exceptions.bagged = bag;
exceptions.bagging = bag;
exceptions.ballyragged = ballyrag;
exceptions.ballyragging = ballyrag;
exceptions.bandied = bandy;
exceptions.banned = ban;
exceptions.banning = ban;
exceptions.barred = bar;
exceptions.barrelled = barrel;
exceptions.barrelling = barrel;
exceptions.barring = bar;
exceptions.basified = basify;
exceptions.batted = bat;
exceptions.batting = bat;
exceptions.bayonetted = bayonet;
exceptions.bayonetting = bayonet;
exceptions.beaten = beat;
exceptions.beatified = beatify;
exceptions.beautified = beautify;
exceptions.became = become;
exceptions.bed = bed;
exceptions.bedded = bed;
exceptions.bedding = bed;
exceptions.bedevilled = bedevil;
exceptions.bedevilling = bedevil;
exceptions.bedimmed = bedim;
exceptions.bedimming = bedim;
exceptions.been = be;
exceptions.befallen = befall;
exceptions.befell = befall;
exceptions.befitted = befit;
exceptions.befitting = befit;
exceptions.befogged = befog;
exceptions.befogging = befog;
exceptions.began = begin;
exceptions.begat = beget;
exceptions.begetting = beget;
exceptions.begged = beg;
exceptions.begging = beg;
exceptions.beginning = begin;
exceptions.begirt = begird;
exceptions.begot = beget;
exceptions.begotten = beget;
exceptions.begun = begin;
exceptions.beheld = behold;
exceptions.beholden = behold;
exceptions.bejewelled = bejewel;
exceptions.bejewelling = bejewel;
exceptions.bellied = belly;
exceptions.belying = belie;
exceptions.benefitted = benefit;
exceptions.benefitting = benefit;
exceptions.benempt = bename;
exceptions.bent = bend;
exceptions.berried = berry;
exceptions.besetting = beset;
exceptions.besought = beseech;
exceptions.bespoke = bespeak;
exceptions.bespoken = bespeak;
exceptions.bestirred = bestir;
exceptions.bestirring = bestir;
exceptions.bestrewn = bestrew;
exceptions.bestrid = bestride;
exceptions.bestridden = bestride;
exceptions.bestrode = bestride;
exceptions.betaken = betake;
exceptions.bethought = bethink;
exceptions.betook = betake;
exceptions.betted = bet;
exceptions.betting = bet;
exceptions.bevelled = bevel;
exceptions.bevelling = bevel;
exceptions.biassed = bias;
exceptions.biassing = bias;
exceptions.bidden = bid;
exceptions.bidding = bid;
exceptions.bing = bing;
exceptions.binned = bin;
exceptions.binning = bin;
exceptions.bit = bite;
exceptions.bitted = bit;
exceptions.bitten = bite;
exceptions.bitting = bit;
exceptions.bivouacked = bivouac;
exceptions.bivouacking = bivouac;
exceptions.blabbed = blab;
exceptions.blabbing = blab;
exceptions.blackberried = blackberry;
exceptions.blacklegged = blackleg;
exceptions.blacklegging = blackleg;
exceptions.blatted = blat;
exceptions.blatting = blat;
exceptions.bled = bleed;
exceptions.blest = bless;
exceptions.blew = blow;
exceptions.blipped = blip;
exceptions.blipping = blip;
exceptions.blobbed = blob;
exceptions.blobbing = blob;
exceptions.bloodied = bloody;
exceptions.blotted = blot;
exceptions.blotting = blot;
exceptions.blown = blow;
exceptions.blubbed = blub;
exceptions.blubbing = blub;
exceptions.blurred = blur;
exceptions.blurring = blur;
exceptions.bobbed = bob;
exceptions.bobbing = bob;
exceptions.bodied = body;
exceptions.bootlegged = bootleg;
exceptions.bootlegging = bootleg;
exceptions.bopped = bop;
exceptions.bopping = bop;
exceptions.bore = bear;
exceptions.born = bear;
exceptions.borne = bear;
exceptions.bought = buy;
exceptions.bound = bind;
exceptions.bragged = brag;
exceptions.bragging = brag;
exceptions.bred = breed;
exceptions.brevetted = brevet;
exceptions.brevetting = brevet;
exceptions.brimmed = brim;
exceptions.brimming = brim;
exceptions.broke = break1;
exceptions.broken = break1;
exceptions.brought = bring;
exceptions.browbeaten = browbeat;
exceptions.brutified = brutify;
exceptions.budded = bud;
exceptions.budding = bud;
exceptions.bugged = bug;
exceptions.bugging = bug;
exceptions.built = build;
exceptions.bulldogging = bulldog;
exceptions.bullied = bully;
exceptions.bullshitted = bullshit;
exceptions.bullshitting = bullshit;
exceptions.bullwhipped = bullwhip;
exceptions.bullwhipping = bullwhip;
exceptions.bullyragged = bullyrag;
exceptions.bullyragging = bullyrag;
exceptions.bummed = bum;
exceptions.bumming = bum;
exceptions.buried = bury;
exceptions.burnt = burn;
exceptions.burred = bur;
exceptions.burring = bur;
exceptions.bushelled = bushel;
exceptions.bushelling = bushel;
exceptions.busied = busy;
exceptions.bypast = bypass;
exceptions.caballed = cabal;
exceptions.caballing = cabal;
exceptions.caddied = caddy;
exceptions.caddies = caddy;
exceptions.caddying = caddy;
exceptions.calcified = calcify;
exceptions.came = come;
exceptions.canalled = canal;
exceptions.canalling = canal;
exceptions.cancelled = cancel;
exceptions.cancelling = cancel;
exceptions.candied = candy;
exceptions.canned = can;
exceptions.canning = can;
exceptions.canopied = canopy;
exceptions.capped = cap;
exceptions.capping = cap;
exceptions.carburetted = carburet;
exceptions.carburetting = carburet;
exceptions.carillonned = carillon;
exceptions.carillonning = carillon;
exceptions.carnied = carny;
exceptions.carnified = carnify;
exceptions.carolled = carol;
exceptions.carolling = carol;
exceptions.carried = carry;
exceptions.casefied = casefy;
exceptions.catnapped = catnap;
exceptions.catnapping = catnap;
exceptions.catted = cat;
exceptions.catting = cat;
exceptions.caught = catch1;
exceptions.cavilled = cavil;
exceptions.cavilling = cavil;
exceptions.certified = certify;
exceptions.channelled = channel;
exceptions.channelling = channel;
exceptions.chapped = chap;
exceptions.chapping = chap;
exceptions.charred = char;
exceptions.charring = char;
exceptions.chatted = chat;
exceptions.chatting = chat;
exceptions.chevied = chivy;
exceptions.chevies = chivy;
exceptions.chevying = chivy;
exceptions.chid = chide;
exceptions.chidden = chide;
exceptions.chinned = chin;
exceptions.chinning = chin;
exceptions.chipped = chip;
exceptions.chipping = chip;
exceptions.chiselled = chisel;
exceptions.chiselling = chisel;
exceptions.chitchatted = chitchat;
exceptions.chitchatting = chitchat;
exceptions.chivied = chivy;
exceptions.chivved = chiv;
exceptions.chivvied = chivy;
exceptions.chivvies = chivy;
exceptions.chivving = chiv;
exceptions.chivvying = chivy;
exceptions.chondrified = chondrify;
exceptions.chopped = chop;
exceptions.chopping = chop;
exceptions.chose = choose;
exceptions.chosen = choose;
exceptions.chugged = chug;
exceptions.chugging = chug;
exceptions.chummed = chum;
exceptions.chumming = chum;
exceptions.citified = citify;
exceptions.clad = clothe;
exceptions.cladded = clad;
exceptions.cladding = clad;
exceptions.clammed = clam;
exceptions.clamming = clam;
exceptions.clapped = clap;
exceptions.clapping = clap;
exceptions.clarified = clarify;
exceptions.classified = classify;
exceptions.cleft = cleave;
exceptions.clemmed = clem;
exceptions.clemming = clem;
exceptions.clept = clepe;
exceptions.clipped = clip;
exceptions.clipping = clip;
exceptions.clogged = clog;
exceptions.clogging = clog;
exceptions.clopped = clop;
exceptions.clopping = clop;
exceptions.clotted = clot;
exceptions.clotting = clot;
exceptions.clove = cleave;
exceptions.cloven = cleave;
exceptions.clubbed = club;
exceptions.clubbing = club;
exceptions.clung = cling;
exceptions.cockneyfied = cockneyfy;
exceptions.codded = cod;
exceptions.codding = cod;
exceptions.codified = codify;
exceptions.cogged = cog;
exceptions.cogging = cog;
exceptions.coiffed = coif;
exceptions.coiffing = coif;
exceptions.collied = colly;
exceptions.combatted = combat;
exceptions.combatting = combat;
exceptions.committed = commit;
exceptions.committing = commit;
exceptions.compelled = compel;
exceptions.compelling = compel;
exceptions.complied = comply;
exceptions.complotted = complot;
exceptions.complotting = complot;
exceptions.concurred = concur;
exceptions.concurring = concur;
exceptions.confabbed = confab;
exceptions.confabbing = confab;
exceptions.conferred = confer;
exceptions.conferring = confer;
exceptions.conned = con;
exceptions.conning = con;
exceptions.controlled = control;
exceptions.controlling = control;
exceptions.copied = copy;
exceptions.copped = cop;
exceptions.copping = cop;
exceptions.coquetted = coquet;
exceptions.coquetting = coquet;
exceptions.corralled = corral;
exceptions.corralling = corral;
exceptions.could = can;
exceptions.counselled = counsel;
exceptions.counselling = counsel;
exceptions.counterplotted = counterplot;
exceptions.counterplotting = counterplot;
exceptions.countersank = countersink;
exceptions.countersunk = countersink;
exceptions.crabbed = crab;
exceptions.crabbing = crab;
exceptions.crammed = cram;
exceptions.cramming = cram;
exceptions.crapped = crap;
exceptions.crapping = crap;
exceptions.creeped = creep;
exceptions.crept = creep;
exceptions.cribbed = crib;
exceptions.cribbing = crib;
exceptions.cried = cry;
exceptions.cropped = crop;
exceptions.cropping = crop;
exceptions.crossbred = crossbreed;
exceptions.crosscutting = crosscut;
exceptions.crucified = crucify;
exceptions.cubbed = cub;
exceptions.cubbing = cub;
exceptions.cudgelled = cudgel;
exceptions.cudgelling = cudgel;
exceptions.cupelled = cupel;
exceptions.cupelling = cupel;
exceptions.cupped = cup;
exceptions.cupping = cup;
exceptions.curetted = curet;
exceptions.curettes = curet;
exceptions.curetting = curet;
exceptions.curried = curry;
exceptions.curst = curse;
exceptions.curtsied = curtsy;
exceptions.curvetted = curvet;
exceptions.curvetting = curvet;
exceptions.cutting = cut;
exceptions.dabbed = dab;
exceptions.dabbing = dab;
exceptions.dagged = dag;
exceptions.dagging = dag;
exceptions.dallied = dally;
exceptions.dammed = dam;
exceptions.damming = dam;
exceptions.damnified = damnify;
exceptions.dandified = dandify;
exceptions.dapped = dap;
exceptions.dapping = dap;
exceptions.dealt = deal;
exceptions.debarred = debar;
exceptions.debarring = debar;
exceptions.debugged = debug;
exceptions.debugging = debug;
exceptions.debussed = debus;
exceptions.debusses = debus;
exceptions.debussing = debus;
exceptions.decalcified = decalcify;
exceptions.declassified = declassify;
exceptions.decontrolled = decontrol;
exceptions.decontrolling = decontrol;
exceptions.decried = decry;
exceptions.deferred = defer;
exceptions.deferring = defer;
exceptions.defied = defy;
exceptions.degassed = degas;
exceptions.degasses = degas;
exceptions.degassing = degas;
exceptions.dehumidified = dehumidify;
exceptions.deified = deify;
exceptions.demitted = demit;
exceptions.demitting = demit;
exceptions.demobbed = demob;
exceptions.demobbing = demob;
exceptions.demulsified = demulsify;
exceptions.demurred = demur;
exceptions.demurring = demur;
exceptions.demystified = demystify;
exceptions.denazified = denazify;
exceptions.denied = deny;
exceptions.denitrified = denitrify;
exceptions.denned = den;
exceptions.denning = den;
exceptions.descried = descry;
exceptions.deterred = deter;
exceptions.deterring = deter;
exceptions.detoxified = detoxify;
exceptions.devilled = devil;
exceptions.devilling = devil;
exceptions.devitrified = devitrify;
exceptions.diagrammed = diagram;
exceptions.diagramming = diagram;
exceptions.dialled = dial;
exceptions.dialling = dial;
exceptions.dibbed = dib;
exceptions.dibbing = dib;
exceptions.did = do1;
exceptions.digging = dig;
exceptions.dignified = dignify;
exceptions.dimmed = dim;
exceptions.dimming = dim;
exceptions.dinned = din;
exceptions.dinning = din;
exceptions.dipped = dip;
exceptions.dipping = dip;
exceptions.dirtied = dirty;
exceptions.disannulled = disannul;
exceptions.disannulling = disannul;
exceptions.disbarred = disbar;
exceptions.disbarring = disbar;
exceptions.disbudded = disbud;
exceptions.disbudding = disbud;
exceptions.disembodied = disembody;
exceptions.disembowelled = disembowel;
exceptions.disembowelling = disembowel;
exceptions.disenthralled = disenthral;
exceptions.disenthralling = disenthral;
exceptions.disenthralls = disenthral;
exceptions.disenthrals = disenthrall;
exceptions.dishevelled = dishevel;
exceptions.dishevelling = dishevel;
exceptions.disinterred = disinter;
exceptions.disinterring = disinter;
exceptions.dispelled = dispel;
exceptions.dispelling = dispel;
exceptions.disqualified = disqualify;
exceptions.dissatisfied = dissatisfy;
exceptions.distilled = distil;
exceptions.distilling = distil;
exceptions.diversified = diversify;
exceptions.divvied = divvy;
exceptions.dizzied = dizzy;
exceptions.does = do1;
exceptions.dogged = dog;
exceptions.dogging = dog;
exceptions.doglegged = dogleg;
exceptions.doglegging = dogleg;
exceptions.dollied = dolly;
exceptions.done = do1;
exceptions.donned = don;
exceptions.donning = don;
exceptions.dotted = dot;
exceptions.dotting = dot;
exceptions.dought = dow;
exceptions.dove = dive;
exceptions.drabbed = drab;
exceptions.drabbing = drab;
exceptions.dragged = drag;
exceptions.dragging = drag;
exceptions.drank = drink;
exceptions.drawn = draw;
exceptions.dreamt = dream;
exceptions.drew = draw;
exceptions.dried = dry;
exceptions.dripped = drip;
exceptions.dripping = drip;
exceptions.drivelled = drivel;
exceptions.drivelling = drivel;
exceptions.driven = drive;
exceptions.dropped = drop;
exceptions.dropping = drop;
exceptions.drove = drive;
exceptions.drubbed = drub;
exceptions.drubbing = drub;
exceptions.drugged = drug;
exceptions.drugging = drug;
exceptions.drummed = drum;
exceptions.drumming = drum;
exceptions.drunk = drink;
exceptions.dubbed = dub;
exceptions.dubbing = dub;
exceptions.duelled = duel;
exceptions.duelling = duel;
exceptions.dug = dig;
exceptions.dulcified = dulcify;
exceptions.dummied = dummy;
exceptions.dunned = dun;
exceptions.dunning = dun;
exceptions.dwelt = dwell;
exceptions.dying = die;
exceptions.easied = easy;
exceptions.eaten = eat;
exceptions.eavesdropped = eavesdrop;
exceptions.eavesdropping = eavesdrop;
exceptions.eddied = eddy;
exceptions.edified = edify;
exceptions.electrified = electrify;
exceptions.embedded = embed;
exceptions.embedding = embed;
exceptions.embodied = embody;
exceptions.embussed = embus;
exceptions.embusses = embus;
exceptions.embussing = embus;
exceptions.emitted = emit;
exceptions.emitting = emit;
exceptions.empanelled = empanel;
exceptions.empanelling = empanel;
exceptions.emptied = empty;
exceptions.emulsified = emulsify;
exceptions.enamelled = enamel;
exceptions.enamelling = enamel;
exceptions.englutted = englut;
exceptions.englutting = englut;
exceptions.enrolled = enrol;
exceptions.enrolling = enrol;
exceptions.enthralled = enthral;
exceptions.enthralling = enthral;
exceptions.entrammelled = entrammel;
exceptions.entrammelling = entrammel;
exceptions.entrapped = entrap;
exceptions.entrapping = entrap;
exceptions.envied = envy;
exceptions.enwound = enwind;
exceptions.enwrapped = enwrap;
exceptions.enwrapping = enwrap;
exceptions.equalled = equal;
exceptions.equalling = equal;
exceptions.equipped = equip;
exceptions.equipping = equip;
exceptions.espied = espy;
exceptions.esterified = esterify;
exceptions.estopped = estop;
exceptions.estopping = estop;
exceptions.etherified = etherify;
exceptions.excelled = excel;
exceptions.excelling = excel;
exceptions.exemplified = exemplify;
exceptions.expelled = expel;
exceptions.expelling = expel;
exceptions.extolled = extol;
exceptions.extolling = extol;
exceptions.facetted = facet;
exceptions.facetting = facet;
exceptions.fagged = fag;
exceptions.fagging = fag;
exceptions.fallen = fall;
exceptions.falsified = falsify;
exceptions.fancied = fancy;
exceptions.fanned = fan;
exceptions.fanning = fan;
exceptions.fantasied = fantasy;
exceptions.fatted = fat;
exceptions.fatting = fat;
exceptions.featherbedded = featherbed;
exceptions.featherbedding = featherbed;
exceptions.fed = feed;
exceptions.feed = feed;
exceptions.fell = fall;
exceptions.felt = feel;
exceptions.ferried = ferry;
exceptions.fibbed = fib;
exceptions.fibbing = fib;
exceptions.figged = fig;
exceptions.figging = fig;
exceptions.finned = fin;
exceptions.finning = fin;
exceptions.fitted = fit;
exceptions.fitting = fit;
exceptions.flagged = flag;
exceptions.flagging = flag;
exceptions.flammed = flam;
exceptions.flamming = flam;
exceptions.flannelled = flannel;
exceptions.flannelling = flannel;
exceptions.flapped = flap;
exceptions.flapping = flap;
exceptions.flatted = flat;
exceptions.flatting = flat;
exceptions.fled = flee;
exceptions.flew = fly;
exceptions.flimflammed = flimflam;
exceptions.flimflamming = flimflam;
exceptions.flipped = flip;
exceptions.flipping = flip;
exceptions.flitted = flit;
exceptions.flitting = flit;
exceptions.flogged = flog;
exceptions.flogging = flog;
exceptions.floodlit = floodlight;
exceptions.flopped = flop;
exceptions.flopping = flop;
exceptions.flown = fly;
exceptions.flubbed = flub;
exceptions.flubbing = flub;
exceptions.flung = fling;
exceptions.flurried = flurry;
exceptions.flyblew = flyblow;
exceptions.flyblown = flyblow;
exceptions.fobbed = fob;
exceptions.fobbing = fob;
exceptions.fogged = fog;
exceptions.fogging = fog;
exceptions.footslogged = footslog;
exceptions.footslogging = footslog;
exceptions.forbad = forbid;
exceptions.forbade = forbid;
exceptions.forbidden = forbid;
exceptions.forbidding = forbid;
exceptions.forbore = forbear;
exceptions.forborne = forbear;
exceptions.fordid = fordo;
exceptions.fordone = fordo;
exceptions.foredid = foredo;
exceptions.foredone = foredo;
exceptions.foregone = forego;
exceptions.foreknew = foreknow;
exceptions.foreknown = foreknow;
exceptions.foreran = forerun;
exceptions.forerunning = forerun;
exceptions.foresaw = foresee;
exceptions.foreseen = foresee;
exceptions.foreshown = foreshow;
exceptions.forespoke = forespeak;
exceptions.forespoken = forespeak;
exceptions.foretold = foretell;
exceptions.forewent = forego;
exceptions.forgave = forgive;
exceptions.forgetting = forget;
exceptions.forgiven = forgive;
exceptions.forgone = forgo;
exceptions.forgot = forget;
exceptions.forgotten = forget;
exceptions.formatted = format;
exceptions.formatting = format;
exceptions.forsaken = forsake;
exceptions.forsook = forsake;
exceptions.forspoke = forspeak;
exceptions.forspoken = forspeak;
exceptions.forswore = forswear;
exceptions.forsworn = forswear;
exceptions.fortified = fortify;
exceptions.forwent = forgo;
exceptions.fought = fight;
exceptions.found = find;
exceptions.foxtrotted = foxtrot;
exceptions.foxtrotting = foxtrot;
exceptions.frapped = frap;
exceptions.frapping = frap;
exceptions.frenchified = frenchify;
exceptions.frenzied = frenzy;
exceptions.fretted = fret;
exceptions.fretting = fret;
exceptions.fried = fry;
exceptions.frigged = frig;
exceptions.frigging = frig;
exceptions.fritted = frit;
exceptions.fritting = frit;
exceptions.frivolled = frivol;
exceptions.frivolling = frivol;
exceptions.frogged = frog;
exceptions.frogging = frog;
exceptions.frolicked = frolic;
exceptions.frolicking = frolic;
exceptions.froze = freeze;
exceptions.frozen = freeze;
exceptions.fructified = fructify;
exceptions.fuelled = fuel;
exceptions.fuelling = fuel;
exceptions.fulfilled = fulfil;
exceptions.fulfilling = fulfil;
exceptions.funned = fun;
exceptions.funnelled = funnel;
exceptions.funnelling = funnel;
exceptions.funning = fun;
exceptions.furred = fur;
exceptions.furring = fur;
exceptions.gadded = gad;
exceptions.gadding = gad;
exceptions.gagged = gag;
exceptions.gagging = gag;
exceptions.gainsaid = gainsay;
exceptions.gambolled = gambol;
exceptions.gambolling = gambol;
exceptions.gammed = gam;
exceptions.gamming = gam;
exceptions.gan = gin;
exceptions.ganned = gan;
exceptions.ganning = gan;
exceptions.gapped = gap;
exceptions.gapping = gap;
exceptions.gasified = gasify;
exceptions.gassed = gas;
exceptions.gasses = gas;
exceptions.gassing = gas;
exceptions.gave = give;
exceptions.gelled = gel;
exceptions.gelling = gel;
exceptions.gelt = geld;
exceptions.gemmed = gem;
exceptions.gemming = gem;
exceptions.getting = get;
exceptions.ghostwritten = ghostwrite;
exceptions.ghostwrote = ghostwrite;
exceptions.gibbed = gib;
exceptions.gibbing = gib;
exceptions.giddied = giddy;
exceptions.giftwrapped = giftwrap;
exceptions.giftwrapping = giftwrap;
exceptions.gigged = gig;
exceptions.gigging = gig;
exceptions.gilt = gild;
exceptions.ginned = gin;
exceptions.ginning = gin;
exceptions.gipped = gip;
exceptions.gipping = gip;
exceptions.girt = gird;
exceptions.given = give;
exceptions.glommed = glom;
exceptions.glomming = glom;
exceptions.gloried = glory;
exceptions.glorified = glorify;
exceptions.glutted = glut;
exceptions.glutting = glut;
exceptions.gnawn = gnaw;
exceptions.gollied = golly;
exceptions.gone = go;
exceptions.got = get;
exceptions.gotten = get;
exceptions.grabbed = grab;
exceptions.grabbing = grab;
exceptions.gratified = gratify;
exceptions.gravelled = gravel;
exceptions.gravelling = gravel;
exceptions.graven = grave;
exceptions.grew = grow;
exceptions.grinned = grin;
exceptions.grinning = grin;
exceptions.gripped = grip;
exceptions.gripping = grip;
exceptions.gript = grip;
exceptions.gritted = grit;
exceptions.gritting = grit;
exceptions.ground = grind;
exceptions.grovelled = grovel;
exceptions.grovelling = grovel;
exceptions.grown = grow;
exceptions.grubbed = grub;
exceptions.grubbing = grub;
exceptions.guarantied = guaranty;
exceptions.gullied = gully;
exceptions.gummed = gum;
exceptions.gumming = gum;
exceptions.gunned = gun;
exceptions.gunning = gun;
exceptions.gypped = gyp;
exceptions.gypping = gyp;
exceptions.hacksawn = hacksaw;
exceptions.had = have;
exceptions.hammed = ham;
exceptions.hamming = ham;
exceptions.hamstrung = hamstring;
exceptions.handfed = handfeed;
exceptions.handicapped = handicap;
exceptions.handicapping = handicap;
exceptions.handselled = handsel;
exceptions.handselling = handsel;
exceptions.harried = harry;
exceptions.has = have;
exceptions.hatchelled = hatchel;
exceptions.hatchelling = hatchel;
exceptions.hatted = hat;
exceptions.hatting = hat;
exceptions.heard = hear;
exceptions.hedgehopped = hedgehop;
exceptions.hedgehopping = hedgehop;
exceptions.held = hold;
exceptions.hemmed = hem;
exceptions.hemming = hem;
exceptions.hewn = hew;
exceptions.hiccupped = hiccup;
exceptions.hiccupping = hiccup;
exceptions.hid = hide;
exceptions.hidden = hide;
exceptions.hinnied = hinny;
exceptions.hitting = hit;
exceptions.hobbed = hob;
exceptions.hobbing = hob;
exceptions.hobnobbed = hobnob;
exceptions.hobnobbing = hobnob;
exceptions.hocussed = hocus;
exceptions.hocussing = hocus;
exceptions.hogged = hog;
exceptions.hogging = hog;
exceptions.hogtying = hogtie;
exceptions.honied = honey;
exceptions.hopped = hop;
exceptions.hopping = hop;
exceptions.horrified = horrify;
exceptions.horsewhipped = horsewhip;
exceptions.horsewhipping = horsewhip;
exceptions.houselled = housel;
exceptions.houselling = housel;
exceptions.hove = heave;
exceptions.hovelled = hovel;
exceptions.hovelling = hovel;
exceptions.hugged = hug;
exceptions.hugging = hug;
exceptions.humbugged = humbug;
exceptions.humbugging = humbug;
exceptions.humidified = humidify;
exceptions.hummed = hum;
exceptions.humming = hum;
exceptions.hung = hang;
exceptions.hurried = hurry;
exceptions.hypertrophied = hypertrophy;
exceptions.identified = identify;
exceptions.imbedded = imbed;
exceptions.imbedding = imbed;
exceptions.impanelled = impanel;
exceptions.impanelling = impanel;
exceptions.impelled = impel;
exceptions.impelling = impel;
exceptions.implied = imply;
exceptions.inbred = inbreed;
exceptions.incurred = incur;
exceptions.incurring = incur;
exceptions.indemnified = indemnify;
exceptions.indwelt = indwell;
exceptions.inferred = infer;
exceptions.inferring = infer;
exceptions.initialled = initial;
exceptions.initialling = initial;
exceptions.inlaid = inlay;
exceptions.insetting = inset;
exceptions.inspanned = inspan;
exceptions.inspanning = inspan;
exceptions.installed = install;
exceptions.installing = install;
exceptions.intensified = intensify;
exceptions.interbred = interbreed;
exceptions.intercropped = intercrop;
exceptions.intercropping = intercrop;
exceptions.intercutting = intercut;
exceptions.interlaid = interlay;
exceptions.interlapped = interlap;
exceptions.interlapping = interlap;
exceptions.intermarried = intermarry;
exceptions.intermitted = intermit;
exceptions.intermitting = intermit;
exceptions.interpled = interplead;
exceptions.interred = inter;
exceptions.interring = inter;
exceptions.interstratified = interstratify;
exceptions.interwove = interweave;
exceptions.interwoven = interweave;
exceptions.intromitted = intromit;
exceptions.intromitting = intromit;
exceptions.inwove = inweave;
exceptions.inwoven = inweave;
exceptions.inwrapped = inwrap;
exceptions.inwrapping = inwrap;
exceptions.is = be;
exceptions.jabbed = jab;
exceptions.jabbing = jab;
exceptions.jagged = jag;
exceptions.jagging = jag;
exceptions.jammed = jam;
exceptions.jamming = jam;
exceptions.japanned = japan;
exceptions.japanning = japan;
exceptions.jarred = jar;
exceptions.jarring = jar;
exceptions.jellied = jelly;
exceptions.jellified = jellify;
exceptions.jemmied = jemmy;
exceptions.jetted = jet;
exceptions.jetting = jet;
exceptions.jewelled = jewel;
exceptions.jewelling = jewel;
exceptions.jibbed = jib;
exceptions.jibbing = jib;
exceptions.jigged = jig;
exceptions.jigging = jig;
exceptions.jimmied = jimmy;
exceptions.jitterbugged = jitterbug;
exceptions.jitterbugging = jitterbug;
exceptions.jobbed = job;
exceptions.jobbing = job;
exceptions.jogged = jog;
exceptions.jogging = jog;
exceptions.jollied = jolly;
exceptions.jollified = jollify;
exceptions.jotted = jot;
exceptions.jotting = jot;
exceptions.joypopped = joypop;
exceptions.joypopping = joypop;
exceptions.jugged = jug;
exceptions.jugging = jug;
exceptions.justified = justify;
exceptions.jutted = jut;
exceptions.jutting = jut;
exceptions.kenned = ken;
exceptions.kennelled = kennel;
exceptions.kennelling = kennel;
exceptions.kenning = ken;
exceptions.kent = ken;
exceptions.kept = keep;
exceptions.kernelled = kernel;
exceptions.kernelling = kernel;
exceptions.kidded = kid;
exceptions.kidding = kid;
exceptions.kidnapped = kidnap;
exceptions.kidnapping = kidnap;
exceptions.kipped = kip;
exceptions.kipping = kip;
exceptions.knapped = knap;
exceptions.knapping = knap;
exceptions.kneecapped = kneecap;
exceptions.kneecapping = kneecap;
exceptions.knelt = kneel;
exceptions.knew = know;
exceptions.knitted = knit;
exceptions.knitting = knit;
exceptions.knobbed = knob;
exceptions.knobbing = knob;
exceptions.knotted = knot;
exceptions.knotting = knot;
exceptions.known = know;
exceptions.labelled = label;
exceptions.labelling = label;
exceptions.laden = lade;
exceptions.ladyfied = ladify;
exceptions.ladyfies = ladify;
exceptions.ladyfying = ladify;
exceptions.lagged = lag;
exceptions.lagging = lag;
exceptions.laid = lay;
exceptions.lain = lie;
exceptions.lallygagged = lallygag;
exceptions.lallygagging = lallygag;
exceptions.lammed = lam;
exceptions.lamming = lam;
exceptions.lapidified = lapidify;
exceptions.lapped = lap;
exceptions.lapping = lap;
exceptions.laurelled = laurel;
exceptions.laurelling = laurel;
exceptions.lay = lie;
exceptions.leant = lean;
exceptions.leapfrogged = leapfrog;
exceptions.leapfrogging = leapfrog;
exceptions.leapt = leap;
exceptions.learnt = learn;
exceptions.led = lead;
exceptions.left = leave;
exceptions.lent = lend;
exceptions.letting = let1;
exceptions.levelled = level;
exceptions.levelling = level;
exceptions.levied = levy;
exceptions.libelled = libel;
exceptions.libelling = libel;
exceptions.lignified = lignify;
exceptions.lipped = lip;
exceptions.lipping = lip;
exceptions.liquefied = liquefy;
exceptions.liquified = liquify;
exceptions.lit = light;
exceptions.lobbed = lob;
exceptions.lobbied = lobby;
exceptions.lobbing = lob;
exceptions.logged = log;
exceptions.logging = log;
exceptions.lopped = lop;
exceptions.lopping = lop;
exceptions.lost = lose;
exceptions.lotted = lot;
exceptions.lotting = lot;
exceptions.lugged = lug;
exceptions.lugging = lug;
exceptions.lullabied = lullaby;
exceptions.lying = lie;
exceptions.madded = mad;
exceptions.madding = mad;
exceptions.made = make;
exceptions.magnified = magnify;
exceptions.manned = man;
exceptions.manning = man;
exceptions.manumitted = manumit;
exceptions.manumitting = manumit;
exceptions.mapped = map;
exceptions.mapping = map;
exceptions.marcelled = marcel;
exceptions.marcelling = marcel;
exceptions.marred = mar;
exceptions.married = marry;
exceptions.marring = mar;
exceptions.marshalled = marshal;
exceptions.marshalling = marshal;
exceptions.marvelled = marvel;
exceptions.marvelling = marvel;
exceptions.matted = mat;
exceptions.matting = mat;
exceptions.meant = mean;
exceptions.medalled = medal;
exceptions.medalling = medal;
exceptions.met = meet;
exceptions.metalled = metal;
exceptions.metalling = metal;
exceptions.metrified = metrify;
exceptions.might = may;
exceptions.mimicked = mimic;
exceptions.mimicking = mimic;
exceptions.minified = minify;
exceptions.misapplied = misapply;
exceptions.misbecame = misbecome;
exceptions.miscarried = miscarry;
exceptions.misdealt = misdeal;
exceptions.misfitted = misfit;
exceptions.misfitting = misfit;
exceptions.misgave = misgive;
exceptions.misgiven = misgive;
exceptions.mishitting = mishit;
exceptions.mislaid = mislay;
exceptions.misled = mislead;
exceptions.mispled = misplead;
exceptions.misspelt = misspell;
exceptions.misspent = misspend;
exceptions.mistaken = mistake;
exceptions.mistook = mistake;
exceptions.misunderstood = misunderstand;
exceptions.mobbed = mob;
exceptions.mobbing = mob;
exceptions.modelled = model;
exceptions.modelling = model;
exceptions.modified = modify;
exceptions.mollified = mollify;
exceptions.molten = melt;
exceptions.mopped = mop;
exceptions.mopping = mop;
exceptions.mortified = mortify;
exceptions.mown = mow;
exceptions.mudded = mud;
exceptions.muddied = muddy;
exceptions.mudding = mud;
exceptions.mugged = mug;
exceptions.mugging = mug;
exceptions.multiplied = multiply;
exceptions.mummed = mum;
exceptions.mummified = mummify;
exceptions.mumming = mum;
exceptions.mutinied = mutiny;
exceptions.mystified = mystify;
exceptions.nabbed = nab;
exceptions.nabbing = nab;
exceptions.nagged = nag;
exceptions.nagging = nag;
exceptions.napped = nap;
exceptions.napping = nap;
exceptions.netted = net;
exceptions.netting = net;
exceptions.nibbed = nib;
exceptions.nibbing = nib;
exceptions.nickelled = nickel;
exceptions.nickelling = nickel;
exceptions.nidified = nidify;
exceptions.nigrified = nigrify;
exceptions.nipped = nip;
exceptions.nipping = nip;
exceptions.nitrified = nitrify;
exceptions.nodded = nod;
exceptions.nodding = nod;
exceptions.nonplussed = nonplus;
exceptions.nonplusses = nonplus;
exceptions.nonplussing = nonplus;
exceptions.notified = notify;
exceptions.nullified = nullify;
exceptions.nutted = nut;
exceptions.nutting = nut;
exceptions.objectified = objectify;
exceptions.occupied = occupy;
exceptions.occurred = occur;
exceptions.occurring = occur;
exceptions.offsetting = offset;
exceptions.omitted = omit;
exceptions.omitting = omit;
exceptions.ossified = ossify;
exceptions.outbidden = outbid;
exceptions.outbidding = outbid;
exceptions.outbred = outbreed;
exceptions.outcried = outcry;
exceptions.outcropped = outcrop;
exceptions.outcropping = outcrop;
exceptions.outdid = outdo;
exceptions.outdone = outdo;
exceptions.outdrawn = outdraw;
exceptions.outdrew = outdraw;
exceptions.outfitted = outfit;
exceptions.outfitting = outfit;
exceptions.outfought = outfight;
exceptions.outgassed = outgas;
exceptions.outgasses = outgas;
exceptions.outgassing = outgas;
exceptions.outgeneralled = outgeneral;
exceptions.outgeneralling = outgeneral;
exceptions.outgone = outgo;
exceptions.outgrew = outgrow;
exceptions.outgrown = outgrow;
exceptions.outlaid = outlay;
exceptions.outmanned = outman;
exceptions.outmanning = outman;
exceptions.outputted = output;
exceptions.outputting = output;
exceptions.outran = outrun;
exceptions.outridden = outride;
exceptions.outrode = outride;
exceptions.outrunning = outrun;
exceptions.outshone = outshine;
exceptions.outshot = outshoot;
exceptions.outsold = outsell;
exceptions.outspanned = outspan;
exceptions.outspanning = outspan;
exceptions.outstood = outstand;
exceptions.outstripped = outstrip;
exceptions.outstripping = outstrip;
exceptions.outthought = outthink;
exceptions.outwent = outgo;
exceptions.outwitted = outwit;
exceptions.outwitting = outwit;
exceptions.outwore = outwear;
exceptions.outworn = outwear;
exceptions.overbidden = overbid;
exceptions.overbidding = overbid;
exceptions.overblew = overblow;
exceptions.overblown = overblow;
exceptions.overbore = overbear;
exceptions.overborne = overbear;
exceptions.overbuilt = overbuild;
exceptions.overcame = overcome;
exceptions.overcropped = overcrop;
exceptions.overcropping = overcrop;
exceptions.overdid = overdo;
exceptions.overdone = overdo;
exceptions.overdrawn = overdraw;
exceptions.overdrew = overdraw;
exceptions.overdriven = overdrive;
exceptions.overdrove = overdrive;
exceptions.overflew = overfly;
exceptions.overflown = overflow;
exceptions.overgrew = overgrow;
exceptions.overgrown = overgrow;
exceptions.overheard = overhear;
exceptions.overhung = overhang;
exceptions.overlaid = overlay;
exceptions.overlain = overlie;
exceptions.overlapped = overlap;
exceptions.overlapping = overlap;
exceptions.overlay = overlie;
exceptions.overlying = overlie;
exceptions.overmanned = overman;
exceptions.overmanning = overman;
exceptions.overpaid = overpay;
exceptions.overpast = overpass;
exceptions.overran = overrun;
exceptions.overridden = override;
exceptions.overrode = override;
exceptions.overrunning = overrun;
exceptions.oversaw = oversee;
exceptions.overseen = oversee;
exceptions.oversetting = overset;
exceptions.oversewn = oversew;
exceptions.overshot = overshoot;
exceptions.oversimplified = oversimplify;
exceptions.overslept = oversleep;
exceptions.oversold = oversell;
exceptions.overspent = overspend;
exceptions.overspilt = overspill;
exceptions.overstepped = overstep;
exceptions.overstepping = overstep;
exceptions.overtaken = overtake;
exceptions.overthrew = overthrow;
exceptions.overthrown = overthrow;
exceptions.overtook = overtake;
exceptions.overtopped = overtop;
exceptions.overtopping = overtop;
exceptions.overwound = overwind;
exceptions.overwritten = overwrite;
exceptions.overwrote = overwrite;
exceptions.pacified = pacify;
exceptions.padded = pad;
exceptions.padding = pad;
exceptions.paid = pay;
exceptions.palled = pal;
exceptions.palling = pal;
exceptions.palsied = palsy;
exceptions.pandied = pandy;
exceptions.panelled = panel;
exceptions.panelling = panel;
exceptions.panicked = panic;
exceptions.panicking = panic;
exceptions.panned = pan;
exceptions.panning = pan;
exceptions.parallelled = parallel;
exceptions.parallelling = parallel;
exceptions.parcelled = parcel;
exceptions.parcelling = parcel;
exceptions.parodied = parody;
exceptions.parried = parry;
exceptions.partaken = partake;
exceptions.partook = partake;
exceptions.pasquil = pasquinade;
exceptions.pasquilled = pasquinade;
exceptions.pasquilling = pasquinade;
exceptions.pasquils = pasquinade;
exceptions.patrolled = patrol;
exceptions.patrolling = patrol;
exceptions.patted = pat;
exceptions.patting = pat;
exceptions.pedalled = pedal;
exceptions.pedalling = pedal;
exceptions.pegged = peg;
exceptions.pegging = peg;
exceptions.pencilled = pencil;
exceptions.pencilling = pencil;
exceptions.penned = pen;
exceptions.penning = pen;
exceptions.pent = pen;
exceptions.pepped = pep;
exceptions.pepping = pep;
exceptions.permitted = permit;
exceptions.permitting = permit;
exceptions.personified = personify;
exceptions.petrified = petrify;
exceptions.petted = pet;
exceptions.pettifogged = pettifog;
exceptions.pettifogging = pettifog;
exceptions.petting = pet;
exceptions.phantasied = phantasy;
exceptions.photocopied = photocopy;
exceptions.photomapped = photomap;
exceptions.photomapping = photomap;
exceptions.photosetting = photoset;
exceptions.physicked = physic;
exceptions.physicking = physic;
exceptions.picnicked = picnic;
exceptions.picnicking = picnic;
exceptions.pigged = pig;
exceptions.pigging = pig;
exceptions.pilloried = pillory;
exceptions.pinned = pin;
exceptions.pinning = pin;
exceptions.pipped = pip;
exceptions.pipping = pip;
exceptions.pistolled = pistol;
exceptions.pistolling = pistol;
exceptions.pitapatted = pitapat;
exceptions.pitapatting = pitapat;
exceptions.pitied = pity;
exceptions.pitted = pit;
exceptions.pitting = pit;
exceptions.planned = plan;
exceptions.planning = plan;
exceptions.platted = plat;
exceptions.platting = plat;
exceptions.pled = plead;
exceptions.plied = ply;
exceptions.plodded = plod;
exceptions.plodding = plod;
exceptions.plopped = plop;
exceptions.plopping = plop;
exceptions.plotted = plot;
exceptions.plotting = plot;
exceptions.plugged = plug;
exceptions.plugging = plug;
exceptions.podded = pod;
exceptions.podding = pod;
exceptions.pommelled = pommel;
exceptions.pommelling = pommel;
exceptions.popes = popes;
exceptions.popped = pop;
exceptions.popping = pop;
exceptions.potted = pot;
exceptions.potting = pot;
exceptions.preachified = preachify;
exceptions.precancelled = precancel;
exceptions.precancelling = precancel;
exceptions.preferred = prefer;
exceptions.preferring = prefer;
exceptions.preoccupied = preoccupy;
exceptions.prepaid = prepay;
exceptions.presignified = presignify;
exceptions.pretermitted = pretermit;
exceptions.pretermitting = pretermit;
exceptions.prettied = pretty;
exceptions.prettified = prettify;
exceptions.pried = pry;
exceptions.prigged = prig;
exceptions.prigging = prig;
exceptions.primmed = prim;
exceptions.primming = prim;
exceptions.prodded = prod;
exceptions.prodding = prod;
exceptions.programmed = program;
exceptions.programmes = program;
exceptions.programming = program;
exceptions.prologed = prologue;
exceptions.prologing = prologue;
exceptions.prologs = prologue;
exceptions.propelled = propel;
exceptions.propelling = propel;
exceptions.prophesied = prophesy;
exceptions.propped = prop;
exceptions.propping = prop;
exceptions.proven = prove;
exceptions.pubbed = pub;
exceptions.pubbing = pub;
exceptions.pugged = pug;
exceptions.pugging = pug;
exceptions.pummelled = pummel;
exceptions.pummelling = pummel;
exceptions.punned = pun;
exceptions.punning = pun;
exceptions.pupped = pup;
exceptions.pupping = pup;
exceptions.purified = purify;
exceptions.putrefied = putrefy;
exceptions.puttied = putty;
exceptions.putting = put;
exceptions.qualified = qualify;
exceptions.quantified = quantify;
exceptions.quarrelled = quarrel;
exceptions.quarrelling = quarrel;
exceptions.quarried = quarry;
exceptions.quartersawn = quartersaw;
exceptions.queried = query;
exceptions.quickstepped = quickstep;
exceptions.quickstepping = quickstep;
exceptions.quipped = quip;
exceptions.quipping = quip;
exceptions.quitted = quit;
exceptions.quitting = quit;
exceptions.quizzed = quiz;
exceptions.quizzes = quiz;
exceptions.quizzing = quiz;
exceptions.ragged = rag;
exceptions.ragging = rag;
exceptions.rallied = rally;
exceptions.ramified = ramify;
exceptions.rammed = ram;
exceptions.ramming = ram;
exceptions.ran = run;
exceptions.rang = ring;
exceptions.rapped = rap;
exceptions.rappelled = rappel;
exceptions.rappelling = rappel;
exceptions.rapping = rap;
exceptions.rarefied = rarefy;
exceptions.ratified = ratify;
exceptions.ratted = rat;
exceptions.ratting = rat;
exceptions.ravelled = ravel;
exceptions.ravelling = ravel;
exceptions.rebelled = rebel;
exceptions.rebelling = rebel;
exceptions.rebuilt = rebuild;
exceptions.rebutted = rebut;
exceptions.rebutting = rebut;
exceptions.recapped = recap;
exceptions.recapping = recap;
exceptions.reclassified = reclassify;
exceptions.recommitted = recommit;
exceptions.recommitting = recommit;
exceptions.recopied = recopy;
exceptions.rectified = rectify;
exceptions.recurred = recur;
exceptions.recurring = recur;
exceptions.red = red;
exceptions.redded = red;
exceptions.redding = red;
exceptions.redid = redo;
exceptions.redone = redo;
exceptions.referred = refer;
exceptions.referring = refer;
exceptions.refitted = refit;
exceptions.refitting = refit;
exceptions.reft = reave;
exceptions.refuelled = refuel;
exceptions.refuelling = refuel;
exceptions.regretted = regret;
exceptions.regretting = regret;
exceptions.reheard = rehear;
exceptions.reified = reify;
exceptions.relied = rely;
exceptions.remade = remake;
exceptions.remarried = remarry;
exceptions.remitted = remit;
exceptions.remitting = remit;
exceptions.rent = rend;
exceptions.repaid = repay;
exceptions.repelled = repel;
exceptions.repelling = repel;
exceptions.replevied = replevy;
exceptions.replied = reply;
exceptions.repotted = repot;
exceptions.repotting = repot;
exceptions.reran = rerun;
exceptions.rerunning = rerun;
exceptions.resat = resit;
exceptions.resetting = reset;
exceptions.resewn = resew;
exceptions.resitting = resit;
exceptions.retaken = retake;
exceptions.rethought = rethink;
exceptions.retold = retell;
exceptions.retook = retake;
exceptions.retransmitted = retransmit;
exceptions.retransmitting = retransmit;
exceptions.retried = retry;
exceptions.retrofitted = retrofit;
exceptions.retrofitting = retrofit;
exceptions.retted = ret;
exceptions.retting = ret;
exceptions.reunified = reunify;
exceptions.revelled = revel;
exceptions.revelling = revel;
exceptions.revetted = revet;
exceptions.revetting = revet;
exceptions.revivified = revivify;
exceptions.revved = rev;
exceptions.revving = rev;
exceptions.rewound = rewind;
exceptions.rewritten = rewrite;
exceptions.rewrote = rewrite;
exceptions.ribbed = rib;
exceptions.ribbing = rib;
exceptions.ricochetted = ricochet;
exceptions.ricochetting = ricochet;
exceptions.ridded = rid;
exceptions.ridden = ride;
exceptions.ridding = rid;
exceptions.rigged = rig;
exceptions.rigging = rig;
exceptions.rigidified = rigidify;
exceptions.rimmed = rim;
exceptions.rimming = rim;
exceptions.ripped = rip;
exceptions.ripping = rip;
exceptions.risen = rise;
exceptions.rivalled = rival;
exceptions.rivalling = rival;
exceptions.riven = rive;
exceptions.robbed = rob;
exceptions.robbing = rob;
exceptions.rode = ride;
exceptions.rose = rise;
exceptions.rotted = rot;
exceptions.rotting = rot;
exceptions.rove = reeve;
exceptions.rowelled = rowel;
exceptions.rowelling = rowel;
exceptions.rubbed = rub;
exceptions.rubbing = rub;
exceptions.rung = ring;
exceptions.running = run;
exceptions.rutted = rut;
exceptions.rutting = rut;
exceptions.saccharified = saccharify;
exceptions.sagged = sag;
exceptions.sagging = sag;
exceptions.said = say;
exceptions.salaried = salary;
exceptions.salified = salify;
exceptions.sallied = sally;
exceptions.sanctified = sanctify;
exceptions.sandbagged = sandbag;
exceptions.sandbagging = sandbag;
exceptions.sang = sing;
exceptions.sank = sink;
exceptions.saponified = saponify;
exceptions.sapped = sap;
exceptions.sapping = sap;
exceptions.sat = sit;
exceptions.satisfied = satisfy;
exceptions.savvied = savvy;
exceptions.saw = see;
exceptions.sawn = saw;
exceptions.scagged = scag;
exceptions.scagging = scag;
exceptions.scanned = scan;
exceptions.scanning = scan;
exceptions.scarified = scarify;
exceptions.scarred = scar;
exceptions.scarring = scar;
exceptions.scatted = scat;
exceptions.scatting = scat;
exceptions.scorified = scorify;
exceptions.scragged = scrag;
exceptions.scragging = scrag;
exceptions.scrammed = scram;
exceptions.scramming = scram;
exceptions.scrapped = scrap;
exceptions.scrapping = scrap;
exceptions.scried = scry;
exceptions.scrubbed = scrub;
exceptions.scrubbing = scrub;
exceptions.scrummed = scrum;
exceptions.scrumming = scrum;
exceptions.scudded = scud;
exceptions.scudding = scud;
exceptions.scummed = scum;
exceptions.scumming = scum;
exceptions.scurried = scurry;
exceptions.seed = seed;
exceptions.seen = see;
exceptions.sent = send;
exceptions.setting = set;
exceptions.sewn = sew;
exceptions.shagged = shag;
exceptions.shagging = shag;
exceptions.shaken = shake;
exceptions.shammed = sham;
exceptions.shamming = sham;
exceptions.sharecropped = sharecrop;
exceptions.sharecropping = sharecrop;
exceptions.shat = shit;
exceptions.shaven = shave;
exceptions.shorn = shear;
exceptions.shed = shed;
exceptions.shedding = shed;
exceptions.shellacked = shellac;
exceptions.shellacking = shellac;
exceptions.shent = shend;
exceptions.shewn = shew;
exceptions.shied = shy;
exceptions.shikarred = shikar;
exceptions.shikarring = shikar;
exceptions.shillyshallied = shillyshally;
exceptions.shimmed = shim;
exceptions.shimmied = shimmy;
exceptions.shimming = shim;
exceptions.shinned = shin;
exceptions.shinning = shin;
exceptions.shipped = ship;
exceptions.shipping = ship;
exceptions.shitted = shit;
exceptions.shitting = shit;
exceptions.shod = shoe;
exceptions.shone = shine;
exceptions.shook = shake;
exceptions.shopped = shop;
exceptions.shopping = shop;
exceptions.shot = shoot;
exceptions.shotgunned = shotgun;
exceptions.shotgunning = shotgun;
exceptions.shotted = shot;
exceptions.shotting = shot;
exceptions.shovelled = shovel;
exceptions.shovelling = shovel;
exceptions.shown = show;
exceptions.shrank = shrink;
exceptions.shredded = shred;
exceptions.shredding = shred;
exceptions.shrivelled = shrivel;
exceptions.shrivelling = shrivel;
exceptions.shriven = shrive;
exceptions.shrove = shrive;
exceptions.shrugged = shrug;
exceptions.shrugging = shrug;
exceptions.shrunk = shrink;
exceptions.shrunken = shrink;
exceptions.shunned = shun;
exceptions.shunning = shun;
exceptions.shutting = shut;
exceptions.sicked = sic;
exceptions.sicking = sic;
exceptions.sideslipped = sideslip;
exceptions.sideslipping = sideslip;
exceptions.sidestepped = sidestep;
exceptions.sidestepping = sidestep;
exceptions.sightsaw = sightsee;
exceptions.sightseen = sightsee;
exceptions.signalled = signal;
exceptions.signalling = signal;
exceptions.signified = signify;
exceptions.silicified = silicify;
exceptions.simplified = simplify;
exceptions.singing = sing;
exceptions.sinned = sin;
exceptions.sinning = sin;
exceptions.sipped = sip;
exceptions.sipping = sip;
exceptions.sitting = sit;
exceptions.skellied = skelly;
exceptions.skenned = sken;
exceptions.skenning = sken;
exceptions.sketted = sket;
exceptions.sketting = sket;
exceptions.skidded = skid;
exceptions.skidding = skid;
exceptions.skimmed = skim;
exceptions.skimming = skim;
exceptions.skinned = skin;
exceptions.skinning = skin;
exceptions.skipped = skip;
exceptions.skipping = skip;
exceptions.skivvied = skivvy;
exceptions.skydove = skydive;
exceptions.slabbed = slab;
exceptions.slabbing = slab;
exceptions.slagged = slag;
exceptions.slagging = slag;
exceptions.slain = slay;
exceptions.slammed = slam;
exceptions.slamming = slam;
exceptions.slapped = slap;
exceptions.slapping = slap;
exceptions.slatted = slat;
exceptions.slatting = slat;
exceptions.sledding = sled;
exceptions.slept = sleep;
exceptions.slew = slay;
exceptions.slid = slide;
exceptions.slidden = slide;
exceptions.slipped = slip;
exceptions.slipping = slip;
exceptions.slitting = slit;
exceptions.slogged = slog;
exceptions.slogging = slog;
exceptions.slopped = slop;
exceptions.slopping = slop;
exceptions.slotted = slot;
exceptions.slotting = slot;
exceptions.slugged = slug;
exceptions.slugging = slug;
exceptions.slummed = slum;
exceptions.slumming = slum;
exceptions.slung = sling;
exceptions.slunk = slink;
exceptions.slurred = slur;
exceptions.slurring = slur;
exceptions.smelt = smell;
exceptions.smit = smite;
exceptions.smitten = smite;
exceptions.smote = smite;
exceptions.smutted = smut;
exceptions.smutting = smut;
exceptions.snagged = snag;
exceptions.snagging = snag;
exceptions.snapped = snap;
exceptions.snapping = snap;
exceptions.snedded = sned;
exceptions.snedding = sned;
exceptions.snipped = snip;
exceptions.snipping = snip;
exceptions.snivelled = snivel;
exceptions.snivelling = snivel;
exceptions.snogged = snog;
exceptions.snogging = snog;
exceptions.snubbed = snub;
exceptions.snubbing = snub;
exceptions.snuck = sneak;
exceptions.snugged = snug;
exceptions.snugging = snug;
exceptions.sobbed = sob;
exceptions.sobbing = sob;
exceptions.sodded = sod;
exceptions.sodding = sod;
exceptions.sold = sell;
exceptions.solemnified = solemnify;
exceptions.solidified = solidify;
exceptions.soothsaid = soothsay;
exceptions.sopped = sop;
exceptions.sopping = sop;
exceptions.sought = seek;
exceptions.sown = sow;
exceptions.spagged = spag;
exceptions.spagging = spag;
exceptions.spancelled = spancel;
exceptions.spancelling = spancel;
exceptions.spanned = span;
exceptions.spanning = span;
exceptions.sparred = spar;
exceptions.sparring = spar;
exceptions.spat = spit;
exceptions.spatted = spat;
exceptions.spatting = spat;
exceptions.specified = specify;
exceptions.sped = speed;
exceptions.speechified = speechify;
exceptions.spellbound = spellbind;
exceptions.spelt = spell;
exceptions.spent = spend;
exceptions.spied = spy;
exceptions.spilt = spill;
exceptions.spinning = spin;
exceptions.spiralled = spiral;
exceptions.spiralling = spiral;
exceptions.spitted = spit;
exceptions.spitting = spit;
exceptions.splitting = split;
exceptions.spoilt = spoil;
exceptions.spoke = speak;
exceptions.spoken = speak;
exceptions.spotlit = spotlight;
exceptions.spotted = spot;
exceptions.spotting = spot;
exceptions.sprang = spring;
exceptions.sprigged = sprig;
exceptions.sprigging = sprig;
exceptions.sprung = spring;
exceptions.spudded = spud;
exceptions.spudding = spud;
exceptions.spun = spin;
exceptions.spurred = spur;
exceptions.spurring = spur;
exceptions.squatted = squat;
exceptions.squatting = squat;
exceptions.squibbed = squib;
exceptions.squibbing = squib;
exceptions.squidded = squid;
exceptions.squidding = squid;
exceptions.squilgee = squeegee;
exceptions.stabbed = stab;
exceptions.stabbing = stab;
exceptions.stank = stink;
exceptions.starred = star;
exceptions.starring = star;
exceptions.steadied = steady;
exceptions.stellified = stellify;
exceptions.stemmed = stem;
exceptions.stemming = stem;
exceptions.stencilled = stencil;
exceptions.stencilling = stencil;
exceptions.stepped = step;
exceptions.stepping = step;
exceptions.stetted = stet;
exceptions.stetting = stet;
exceptions.stied = sty;
exceptions.stilettoeing = stiletto;
exceptions.stirred = stir;
exceptions.stirring = stir;
exceptions.stole = steal;
exceptions.stolen = steal;
exceptions.stood = stand;
exceptions.stopped = stop;
exceptions.stopping = stop;
exceptions.storied = story;
exceptions.stotted = stot;
exceptions.stotting = stot;
exceptions.stove = stave;
exceptions.strapped = strap;
exceptions.strapping = strap;
exceptions.stratified = stratify;
exceptions.strewn = strew;
exceptions.stridden = stride;
exceptions.stripped = strip;
exceptions.stripping = strip;
exceptions.striven = strive;
exceptions.strode = stride;
exceptions.stropped = strop;
exceptions.stropping = strop;
exceptions.strove = strive;
exceptions.strown = strow;
exceptions.stricken = strike;
exceptions.struck = strike;
exceptions.strummed = strum;
exceptions.strumming = strum;
exceptions.strung = string;
exceptions.strutted = strut;
exceptions.strutting = strut;
exceptions.stubbed = stub;
exceptions.stubbing = stub;
exceptions.stuck = stick;
exceptions.studded = stud;
exceptions.studding = stud;
exceptions.studied = study;
exceptions.stultified = stultify;
exceptions.stummed = stum;
exceptions.stumming = stum;
exceptions.stung = sting;
exceptions.stunk = stink;
exceptions.stunned = stun;
exceptions.stunning = stun;
exceptions.stupefied = stupefy;
exceptions.stymying = stymie;
exceptions.subbed = sub;
exceptions.subbing = sub;
exceptions.subjectified = subjectify;
exceptions.subletting = sublet;
exceptions.submitted = submit;
exceptions.submitting = submit;
exceptions.subtotalled = subtotal;
exceptions.subtotalling = subtotal;
exceptions.sullied = sully;
exceptions.sulphuretted = sulphuret;
exceptions.sulphuretting = sulphuret;
exceptions.summed = sum;
exceptions.summing = sum;
exceptions.sung = sing;
exceptions.sunk = sink;
exceptions.sunken = sink;
exceptions.sunned = sun;
exceptions.sunning = sun;
exceptions.supped = sup;
exceptions.supping = sup;
exceptions.supplied = supply;
exceptions.swabbed = swab;
exceptions.swabbing = swab;
exceptions.swagged = swag;
exceptions.swagging = swag;
exceptions.swam = swim;
exceptions.swapped = swap;
exceptions.swapping = swap;
exceptions.swatted = swat;
exceptions.swatting = swat;
exceptions.swept = sweep;
exceptions.swigged = swig;
exceptions.swigging = swig;
exceptions.swimming = swim;
exceptions.swivelled = swivel;
exceptions.swivelling = swivel;
exceptions.swollen = swell;
exceptions.swopped = swap;
exceptions.swopping = swap;
exceptions.swops = swap;
exceptions.swore = swear;
exceptions.sworn = swear;
exceptions.swotted = swot;
exceptions.swotting = swot;
exceptions.swum = swim;
exceptions.swung = swing;
exceptions.syllabified = syllabify;
exceptions.symbolled = symbol;
exceptions.symbolling = symbol;
exceptions.tabbed = tab;
exceptions.tabbing = tab;
exceptions.tagged = tag;
exceptions.tagging = tag;
exceptions.taken = take;
exceptions.talcked = talc;
exceptions.talcking = talc;
exceptions.tallied = tally;
exceptions.tammied = tammy;
exceptions.tanned = tan;
exceptions.tanning = tan;
exceptions.tapped = tap;
exceptions.tapping = tap;
exceptions.tarred = tar;
exceptions.tarried = tarry;
exceptions.tarring = tar;
exceptions.tasselled = tassel;
exceptions.tasselling = tassel;
exceptions.tatted = tat;
exceptions.tatting = tat;
exceptions.taught = teach;
exceptions.taxis = taxis;
exceptions.taxying = taxi;
exceptions.teaselled = teasel;
exceptions.teaselling = teasel;
exceptions.tedded = ted;
exceptions.tedding = ted;
exceptions.tepefied = tepefy;
exceptions.terrified = terrify;
exceptions.testes = testes;
exceptions.testified = testify;
exceptions.thinned = thin;
exceptions.thinning = thin;
exceptions.thought = think;
exceptions.threw = throw1;
exceptions.thriven = thrive;
exceptions.throbbed = throb;
exceptions.throbbing = throb;
exceptions.throve = thrive;
exceptions.thrown = throw1;
exceptions.thrummed = thrum;
exceptions.thrumming = thrum;
exceptions.thudded = thud;
exceptions.thudding = thud;
exceptions.tidied = tidy;
exceptions.tinned = tin;
exceptions.tinning = tin;
exceptions.tinselled = tinsel;
exceptions.tinselling = tinsel;
exceptions.tipped = tip;
exceptions.tipping = tip;
exceptions.tittupped = tittup;
exceptions.tittupping = tittup;
exceptions.toadied = toady;
exceptions.togged = tog;
exceptions.togging = tog;
exceptions.told = tell;
exceptions.took = take;
exceptions.topped = top;
exceptions.topping = top;
exceptions.tore = tear;
exceptions.torn = tear;
exceptions.torrefied = torrefy;
exceptions.torrify = torrefy;
exceptions.totalled = total;
exceptions.totalling = total;
exceptions.totted = tot;
exceptions.totting = tot;
exceptions.towelled = towel;
exceptions.towelling = towel;
exceptions.trafficked = traffic;
exceptions.trafficking = traffic;
exceptions.trameled = trammel;
exceptions.trameling = trammel;
exceptions.tramelled = trammel;
exceptions.tramelling = trammel;
exceptions.tramels = trammel;
exceptions.trammed = tram;
exceptions.tramming = tram;
exceptions.transferred = transfer;
exceptions.transferring = transfer;
exceptions.transfixt = transfix;
exceptions.tranship = transship;
exceptions.transhipped = tranship;
exceptions.transhipping = tranship;
exceptions.transmitted = transmit;
exceptions.transmitting = transmit;
exceptions.transmogrified = transmogrify;
exceptions.transshipped = transship;
exceptions.transshipping = transship;
exceptions.trapanned = trapan;
exceptions.trapanning = trapan;
exceptions.trapped = trap;
exceptions.trapping = trap;
exceptions.travelled = travel;
exceptions.travelling = travel;
exceptions.travestied = travesty;
exceptions.trekked = trek;
exceptions.trekking = trek;
exceptions.trepanned = trepan;
exceptions.trepanning = trepan;
exceptions.tried = try1;
exceptions.trigged = trig;
exceptions.trigging = trig;
exceptions.trimmed = trim;
exceptions.trimming = trim;
exceptions.tripped = trip;
exceptions.tripping = trip;
exceptions.trod = tread;
exceptions.trodden = tread;
exceptions.trogged = trog;
exceptions.trogging = trog;
exceptions.trotted = trot;
exceptions.trotting = trot;
exceptions.trowelled = trowel;
exceptions.trowelling = trowel;
exceptions.tugged = tug;
exceptions.tugging = tug;
exceptions.tumefied = tumefy;
exceptions.tunned = tun;
exceptions.tunnelled = tunnel;
exceptions.tunnelling = tunnel;
exceptions.tunning = tun;
exceptions.tupped = tup;
exceptions.tupping = tup;
exceptions.twigged = twig;
exceptions.twigging = twig;
exceptions.twinned = twin;
exceptions.twinning = twin;
exceptions.twitted = twit;
exceptions.twitting = twit;
exceptions.tying = tie;
exceptions.typesetting = typeset;
exceptions.typewritten = typewrite;
exceptions.typewrote = typewrite;
exceptions.typified = typify;
exceptions.uglified = uglify;
exceptions.unbarred = unbar;
exceptions.unbarring = unbar;
exceptions.unbent = unbend;
exceptions.unbound = unbind;
exceptions.uncapped = uncap;
exceptions.uncapping = uncap;
exceptions.unclad = unclothe;
exceptions.unclogged = unclog;
exceptions.unclogging = unclog;
exceptions.underbidding = underbid;
exceptions.underbought = underbuy;
exceptions.undercutting = undercut;
exceptions.underfed = underfeed;
exceptions.undergirt = undergird;
exceptions.undergone = undergo;
exceptions.underlaid = underlay;
exceptions.underlain = underlie;
exceptions.underlay = underlie;
exceptions.underletting = underlet;
exceptions.underlying = underlie;
exceptions.underpaid = underpay;
exceptions.underpinned = underpin;
exceptions.underpinning = underpin;
exceptions.underpropped = underprop;
exceptions.underpropping = underprop;
exceptions.undersetting = underset;
exceptions.undershot = undershoot;
exceptions.undersold = undersell;
exceptions.understood = understand;
exceptions.understudied = understudy;
exceptions.undertaken = undertake;
exceptions.undertook = undertake;
exceptions.underwent = undergo;
exceptions.underwritten = underwrite;
exceptions.underwrote = underwrite;
exceptions.undid = undo;
exceptions.undone = undo;
exceptions.unfitted = unfit;
exceptions.unfitting = unfit;
exceptions.unfroze = unfreeze;
exceptions.unfrozen = unfreeze;
exceptions.unified = unify;
exceptions.unkennelled = unkennel;
exceptions.unkennelling = unkennel;
exceptions.unknitted = unknit;
exceptions.unknitting = unknit;
exceptions.unlaid = unlay;
exceptions.unlearnt = unlearn;
exceptions.unmade = unmake;
exceptions.unmanned = unman;
exceptions.unmanning = unman;
exceptions.unpegged = unpeg;
exceptions.unpegging = unpeg;
exceptions.unpinned = unpin;
exceptions.unpinning = unpin;
exceptions.unplugged = unplug;
exceptions.unplugging = unplug;
exceptions.unravelled = unravel;
exceptions.unravelling = unravel;
exceptions.unrigged = unrig;
exceptions.unrigging = unrig;
exceptions.unripped = unrip;
exceptions.unripping = unrip;
exceptions.unrove = unreeve;
exceptions.unsaid = unsay;
exceptions.unshipped = unship;
exceptions.unshipping = unship;
exceptions.unslung = unsling;
exceptions.unsnapped = unsnap;
exceptions.unsnapping = unsnap;
exceptions.unspoke = unspeak;
exceptions.unspoken = unspeak;
exceptions.unsteadied = unsteady;
exceptions.unstepped = unstep;
exceptions.unstepping = unstep;
exceptions.unstopped = unstop;
exceptions.unstopping = unstop;
exceptions.unstrung = unstring;
exceptions.unstuck = unstick;
exceptions.unswore = unswear;
exceptions.unsworn = unswear;
exceptions.untaught = unteach;
exceptions.unthought = unthink;
exceptions.untidied = untidy;
exceptions.untrod = untread;
exceptions.untrodden = untread;
exceptions.untying = untie;
exceptions.unwound = unwind;
exceptions.unwrapped = unwrap;
exceptions.unwrapping = unwrap;
exceptions.unzipped = unzip;
exceptions.unzipping = unzip;
exceptions.upbuilt = upbuild;
exceptions.upheld = uphold;
exceptions.uphove = upheave;
exceptions.upped = up;
exceptions.uppercutting = uppercut;
exceptions.upping = up;
exceptions.uprisen = uprise;
exceptions.uprose = uprise;
exceptions.upsetting = upset;
exceptions.upsprang = upspring;
exceptions.upsprung = upspring;
exceptions.upswept = upsweep;
exceptions.upswollen = upswell;
exceptions.upswung = upswing;
exceptions.vagged = vag;
exceptions.vagging = vag;
exceptions.varied = vary;
exceptions.vatted = vat;
exceptions.vatting = vat;
exceptions.verbified = verbify;
exceptions.verified = verify;
exceptions.versified = versify;
exceptions.vetted = vet;
exceptions.vetting = vet;
exceptions.victualled = victual;
exceptions.victualling = victual;
exceptions.vilified = vilify;
exceptions.vitrified = vitrify;
exceptions.vitriolled = vitriol;
exceptions.vitriolling = vitriol;
exceptions.vivified = vivify;
exceptions.vying = vie;
exceptions.wadded = wad;
exceptions.waddied = waddy;
exceptions.wadding = wad;
exceptions.wadsetted = wadset;
exceptions.wadsetting = wadset;
exceptions.wagged = wag;
exceptions.wagging = wag;
exceptions.wanned = wan;
exceptions.wanning = wan;
exceptions.warred = war;
exceptions.warring = war;
exceptions.was = be;
exceptions.waylaid = waylay;
exceptions.wearied = weary;
exceptions.weatherstripped = weatherstrip;
exceptions.weatherstripping = weatherstrip;
exceptions.webbed = web;
exceptions.webbing = web;
exceptions.wedded = wed;
exceptions.wedding = wed;
exceptions.weed = weed;
exceptions.went = go;
exceptions.wept = weep;
exceptions.were = be;
exceptions.wetted = wet;
exceptions.wetting = wet;
exceptions.whammed = wham;
exceptions.whamming = wham;
exceptions.whapped = whap;
exceptions.whapping = whap;
exceptions.whetted = whet;
exceptions.whetting = whet;
exceptions.whinnied = whinny;
exceptions.whipped = whip;
exceptions.whipping = whip;
exceptions.whipsawn = whipsaw;
exceptions.whirred = whir;
exceptions.whirring = whir;
exceptions.whizzed = whiz;
exceptions.whizzes = whiz;
exceptions.whizzing = whiz;
exceptions.whopped = whop;
exceptions.whopping = whop;
exceptions.wigged = wig;
exceptions.wigging = wig;
exceptions.wigwagged = wigwag;
exceptions.wigwagging = wigwag;
exceptions.wildcatted = wildcat;
exceptions.wildcatting = wildcat;
exceptions.winning = win;
exceptions.winterfed = winterfeed;
exceptions.wiredrawn = wiredraw;
exceptions.wiredrew = wiredraw;
exceptions.withdrawn = withdraw;
exceptions.withdrew = withdraw;
exceptions.withheld = withhold;
exceptions.withstood = withstand;
exceptions.woke = wake;
exceptions.woken = wake;
exceptions.won = win;
exceptions.wonned = won;
exceptions.wonning = won;
exceptions.wore = wear;
exceptions.worn = wear;
exceptions.worried = worry;
exceptions.worshipped = worship;
exceptions.worshipping = worship;
exceptions.wound = wind;
exceptions.wove = weave;
exceptions.woven = weave;
exceptions.wrapped = wrap;
exceptions.wrapping = wrap;
exceptions.wried = wry;
exceptions.written = write;
exceptions.wrote = write;
exceptions.wrought = work;
exceptions.wrung = wring;
exceptions.would = will;
exceptions.yakked = yak;
exceptions.yakking = yak;
exceptions.yapped = yap;
exceptions.yapping = yap;
exceptions.ycleped = clepe;
exceptions.yclept = clepe;
exceptions.yenned = yen;
exceptions.yenning = yen;
exceptions.yodelled = yodel;
exceptions.yodelling = yodel;
exceptions.zapped = zap;
exceptions.zapping = zap;
exceptions.zigzagged = zigzag;
exceptions.zigzagging = zigzag;
exceptions.zipped = zip;
exceptions.zipping = zip;

module.exports = exceptions;

},{}],7:[function(require,module,exports){
//     wink-lexicon
//     English lexicon useful in NLP/NLU
//
//     Copyright (C) 2017-19  GRAYPE Systems Private Limited
//
//     This file is part of “wink-lexicon”.
//
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the "Software"),
//     to deal in the Software without restriction, including without limitation
//     the rights to use, copy, modify, merge, publish, distribute, sublicense,
//     and/or sell copies of the Software, and to permit persons to whom the
//     Software is furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included
//     in all copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//     OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
//     THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
//     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
//     DEALINGS IN THE SOFTWARE.

//
// This data is derived from the WordNet project of Princeton University. The
// Wordnet is copyright by Princeton University. It is sourced from
// http://wordnet.princeton.edu/; the license text can be accessed at
// http://wordnet.princeton.edu/wordnet/license/ URL.
// WordNet License:
// WordNet Release 3.0 This software and database is being provided to you,
// the LICENSEE, by Princeton University under the following license.
// By obtaining, using and/or copying this software and database,
// you agree that you have read, understood, and will comply with these terms
// and conditions.:
// Permission to use, copy, modify and distribute this software and database and
// its documentation for any purpose and without fee or royalty is hereby
// granted, provided that you agree to comply with the following copyright
// notice and statements, including the disclaimer, and that the same appear
// on ALL copies of the software, database and documentation, including
// modifications that you make for internal use or for distribution.
// WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
// THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY
// MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.
// BY WAY OF EXAMPLE, BUT NOT LIMITATION, PRINCETON UNIVERSITY MAKES NO
// REPRESENTATIONS OR WARRANTIES OF MERCHANT- ABILITY OR FITNESS FOR ANY
// PARTICULAR PURPOSE OR THAT THE USE OF THE LICENSED SOFTWARE, DATABASE OR
// DOCUMENTATION WILL NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS,
// TRADEMARKS OR OTHER RIGHTS. The name of Princeton University or Princeton
// may not be used in advertising or publicity pertaining to distribution of
// the software and/or database. Title to copyright in this software, database
// and any associated documentation shall at all times remain with
// Princeton University and LICENSEE agrees to preserve same.

/* eslint max-lines: ["error", {"max": 90000, "skipComments": true}] */
/* eslint-disable camelcase */

// Define various senses.
const s_26 = [ 26 ];
const s_15 = [ 15 ];
const s_32 = [ 32 ];
const s_20 = [ 20 ];
const s_18 = [ 18 ];
const s_17 = [ 17 ];
const s_5 = [ 5 ];
const s_14 = [ 14 ];
const s_10 = [ 10 ];
const s_6 = [ 6 ];
const s_20_27 = [ 20, 27 ];
const s_39 = [ 39 ];
const s_2 = [ 2 ];
const s_0 = [ 0 ];
const s_23 = [ 23 ];
const s_7_12_31_38_40 = [ 7, 12, 31, 38, 40 ];
const s_4 = [ 4 ];
const s_37 = [ 37 ];
const s_4_26 = [ 4, 26 ];
const s_12 = [ 12 ];
const s_1 = [ 1 ];
const s_30 = [ 30 ];
const s_4_11 = [ 4, 11 ];
const s_4_10 = [ 4, 10 ];
const s_9 = [ 9 ];
const s_10_18 = [ 10, 18 ];
const s_41 = [ 41 ];
const s_8 = [ 8 ];
const s_8_1 = [ 8, 1 ];
const s_7 = [ 7 ];
const s_8_0 = [ 8, 0 ];
const s_35 = [ 35 ];
const s_8_18 = [ 8, 18 ];
const s_14_18_0 = [ 14, 18, 0 ];
const s_18_0 = [ 18, 0 ];
const s_42 = [ 42 ];
const s_19_26 = [ 19, 26 ];
const s_31_42 = [ 31, 42 ];
const s_16 = [ 16 ];
const s_7_9 = [ 7, 9 ];
const s_19 = [ 19 ];
const s_11 = [ 11 ];
const s_14_18 = [ 14, 18 ];
const s_14_15_18_1 = [ 14, 15, 18, 1 ];
const s_10_18_1 = [ 10, 18, 1 ];
const s_34 = [ 34 ];
const s_4_22 = [ 4, 22 ];
const s_10_1_0 = [ 10, 1, 0 ];
const s_32_33_40 = [ 32, 33, 40 ];
const s_4_7_9_26 = [ 4, 7, 9, 26 ];
const s_6_15 = [ 6, 15 ];
const s_4_12_18 = [ 4, 12, 18 ];
const s_4_29_30 = [ 4, 29, 30 ];
const s_4_6 = [ 4, 6 ];
const s_6_0 = [ 6, 0 ];
const s_2_0 = [ 2, 0 ];
const s_10_2_0 = [ 10, 2, 0 ];
const s_6_27 = [ 6, 27 ];
const s_19_22_26 = [ 19, 22, 26 ];
const s_27_0 = [ 27, 0 ];
const s_27 = [ 27 ];
const s_38 = [ 38 ];
const s_4_38 = [ 4, 38 ];
const s_4_26_28 = [ 4, 26, 28 ];
const s_30_0 = [ 30, 0 ];
const s_13 = [ 13 ];
const s_13_20 = [ 13, 20 ];
const s_9_0 = [ 9, 0 ];
const s_9_14_26 = [ 9, 14, 26 ];
const s_18_1 = [ 18, 1 ];
const s_30_31_35_40_43 = [ 30, 31, 35, 40, 43 ];
const s_9_22 = [ 9, 22 ];
const s_34_41 = [ 34, 41 ];
const s_4_7 = [ 4, 7 ];
const s_9_10_31_32_40_0 = [ 9, 10, 31, 32, 40, 0 ];
const s_3_4_6_9 = [ 3, 4, 6, 9 ];
const s_6_9 = [ 6, 9 ];
const s_26_0 = [ 26, 0 ];
const s_7_10 = [ 7, 10 ];
const s_7_24 = [ 7, 24 ];
const s_4_10_30_32_41 = [ 4, 10, 30, 32, 41 ];
const s_1_0 = [ 1, 0 ];
const s_18_1_0 = [ 18, 1, 0 ];
const s_6_14 = [ 6, 14 ];
const s_25 = [ 25 ];
const s_10_0 = [ 10, 0 ];
const s_32_41 = [ 32, 41 ];
const s_28_2_0 = [ 28, 2, 0 ];
const s_4_7_28 = [ 4, 7, 28 ];
const s_10_26_32 = [ 10, 26, 32 ];
const s_0_1 = [ 0, 1 ];
const s_31_32_40_42 = [ 31, 32, 40, 42 ];
const s_4_7_9_10_21_26 = [ 4, 7, 9, 10, 21, 26 ];
const s_4_10_26 = [ 4, 10, 26 ];
const s_18_27 = [ 18, 27 ];
const s_4_6_7_10_38_40 = [ 4, 6, 7, 10, 38, 40 ];
const s_4_7_10_21_22_32 = [ 4, 7, 10, 21, 22, 32 ];
const s_6_18_0 = [ 6, 18, 0 ];
const s_10_32 = [ 10, 32 ];
const s_22 = [ 22 ];
const s_30_32_34_42 = [ 30, 32, 34, 42 ];
const s_4_6_9_10_11 = [ 4, 6, 9, 10, 11 ];
const s_4_7_10_11 = [ 4, 7, 10, 11 ];
const s_36_38_42 = [ 36, 38, 42 ];
const s_36_41 = [ 36, 41 ];
const s_4_9 = [ 4, 9 ];
const s_7_10_26_40_42 = [ 7, 10, 26, 40, 42 ];
const s_7_10_16_21_26_32_40_42 = [ 7, 10, 16, 21, 26, 32, 40, 42 ];
const s_4_9_10_21 = [ 4, 9, 10, 21 ];
const s_40 = [ 40 ];
const s_31_41 = [ 31, 41 ];
const s_21_22_23 = [ 21, 22, 23 ];
const s_30_40 = [ 30, 40 ];
const s_4_14_21_22 = [ 4, 14, 21, 22 ];
const s_6_18 = [ 6, 18 ];
const s_4_6_14_18_23_27_33_41_0 = [ 4, 6, 14, 18, 23, 27, 33, 41, 0 ];
const s_30_37 = [ 30, 37 ];
const s_30_39 = [ 30, 39 ];
const s_13_27 = [ 13, 27 ];
const s_14_18_1 = [ 14, 18, 1 ];
const s_26_37_39 = [ 26, 37, 39 ];
const s_10_14_18 = [ 10, 14, 18 ];
const s_6_27_0 = [ 6, 27, 0 ];
const s_8_20 = [ 8, 20 ];
const s_31_32 = [ 31, 32 ];
const s_10_26 = [ 10, 26 ];
const s_15_26 = [ 15, 26 ];
const s_6_1 = [ 6, 1 ];
const s_9_18_26 = [ 9, 18, 26 ];
const s_29_30_31_40_42 = [ 29, 30, 31, 40, 42 ];
const s_4_9_21 = [ 4, 9, 21 ];
const s_15_23 = [ 15, 23 ];
const s_21 = [ 21 ];
const s_3_10_29_33_36_41_42 = [ 3, 10, 29, 33, 36, 41, 42 ];
const s_4_0 = [ 4, 0 ];
const s_4_6_7_10_22_26_36_41 = [ 4, 6, 7, 10, 22, 26, 36, 41 ];
const s_4_15 = [ 4, 15 ];
const s_30_36 = [ 30, 36 ];
const s_18_24_27_0 = [ 18, 24, 27, 0 ];
const s_7_26 = [ 7, 26 ];
const s_4_7_22_26 = [ 4, 7, 22, 26 ];
const s_32_36 = [ 32, 36 ];
const s_36 = [ 36 ];
const s_5_20 = [ 5, 20 ];
const s_9_20 = [ 9, 20 ];
const s_4_10_2_0 = [ 4, 10, 2, 0 ];
const s_5_15 = [ 5, 15 ];
const s_17_18 = [ 17, 18 ];
const s_4_10_22 = [ 4, 10, 22 ];
const s_28 = [ 28 ];
const s_26_30_31_32_40_42 = [ 26, 30, 31, 32, 40, 42 ];
const s_5_6_18 = [ 5, 6, 18 ];
const s_18_34 = [ 18, 34 ];
const s_4_12_26 = [ 4, 12, 26 ];
const s_4_6_15_21_23 = [ 4, 6, 15, 21, 23 ];
const s_30_31 = [ 30, 31 ];
const s_7_10_15_30_32_33_34_40_41 = [ 7, 10, 15, 30, 32, 33, 34, 40, 41 ];
const s_27_35 = [ 27, 35 ];
const s_30_35_42 = [ 30, 35, 42 ];
const s_4_7_8_26 = [ 4, 7, 8, 26 ];
const s_10_0_1 = [ 10, 0, 1 ];
const s_30_35 = [ 30, 35 ];
const s_30_41 = [ 30, 41 ];
const s_10_17_18_0 = [ 10, 17, 18, 0 ];
const s_4_11_21_22 = [ 4, 11, 21, 22 ];
const s_5_18 = [ 5, 18 ];
const s_29_40_41 = [ 29, 40, 41 ];
const s_4_14_28 = [ 4, 14, 28 ];
const s_4_14 = [ 4, 14 ];
const s_4_12 = [ 4, 12 ];
const s_37_39 = [ 37, 39 ];
const s_4_7_10_21 = [ 4, 7, 10, 21 ];
const s_32_40_41_42 = [ 32, 40, 41, 42 ];
const s_4_6_26 = [ 4, 6, 26 ];
const s_26_28 = [ 26, 28 ];
const s_18_20 = [ 18, 20 ];
const s_30_31_36_40_41 = [ 30, 31, 36, 40, 41 ];
const s_36_41_42 = [ 36, 41, 42 ];
const s_22_27 = [ 22, 27 ];
const s_5_18_0 = [ 5, 18, 0 ];
const s_4_10_11_21_30_32_33_38_40_41_0 = [ 4, 10, 11, 21, 30, 32, 33, 38, 40, 41, 0 ];
const s_7_23_41 = [ 7, 23, 41 ];
const s_4_11_28 = [ 4, 11, 28 ];
const s_4_41 = [ 4, 41 ];
const s_10_1 = [ 10, 1 ];
const s_11_26 = [ 11, 26 ];
const s_10_32_39 = [ 10, 32, 39 ];
const s_18_32 = [ 18, 32 ];
const s_17_1 = [ 17, 1 ];
const s_4_17 = [ 4, 17 ];
const s_18_28 = [ 18, 28 ];
const s_4_6_0 = [ 4, 6, 0 ];
const s_15_17 = [ 15, 17 ];
const s_6_19 = [ 6, 19 ];
const s_15_17_0 = [ 15, 17, 0 ];
const s_9_0_1 = [ 9, 0, 1 ];
const s_29 = [ 29 ];
const s_14_26 = [ 14, 26 ];
const s_9_11 = [ 9, 11 ];
const s_9_11_26 = [ 9, 11, 26 ];
const s_12_29_30_32_37_42 = [ 12, 29, 30, 32, 37, 42 ];
const s_7_12 = [ 7, 12 ];
const s_14_18_41 = [ 14, 18, 41 ];
const s_7_19_24 = [ 7, 19, 24 ];
const s_10_35 = [ 10, 35 ];
const s_17_18_0 = [ 17, 18, 0 ];
const s_34_40_42 = [ 34, 40, 42 ];
const s_12_37 = [ 12, 37 ];
const s_4_32 = [ 4, 32 ];
const s_5_6_10_18_1 = [ 5, 6, 10, 18, 1 ];
const s_10_23_1 = [ 10, 23, 1 ];
const s_0_2 = [ 0, 2 ];
const s_12_19 = [ 12, 19 ];
const s_11_19 = [ 11, 19 ];
const s_10_28 = [ 10, 28 ];
const s_4_12_0 = [ 4, 12, 0 ];
const s_7_28_30 = [ 7, 28, 30 ];
const s_14_0 = [ 14, 0 ];
const s_22_0 = [ 22, 0 ];
const s_4_14_26 = [ 4, 14, 26 ];
const s_9_10 = [ 9, 10 ];
const s_10_17_18_27 = [ 10, 17, 18, 27 ];
const s_14_27_35_0 = [ 14, 27, 35, 0 ];
const s_35_0 = [ 35, 0 ];
const s_6_14_27_35_42_0 = [ 6, 14, 27, 35, 42, 0 ];
const s_33 = [ 33 ];
const s_4_7_12 = [ 4, 7, 12 ];
const s_37_41 = [ 37, 41 ];
const s_35_37_38_41 = [ 35, 37, 38, 41 ];
const s_24 = [ 24 ];
const s_31 = [ 31 ];
const s_18_0_1 = [ 18, 0, 1 ];
const s_6_8_18 = [ 6, 8, 18 ];
const s_12_26 = [ 12, 26 ];
const s_6_15_23 = [ 6, 15, 23 ];
const s_32_40_42 = [ 32, 40, 42 ];
const s_7_9_10_24_26 = [ 7, 9, 10, 24, 26 ];
const s_4_7_21_29_41 = [ 4, 7, 21, 29, 41 ];
const s_13_29 = [ 13, 29 ];
const s_4_9_15_31_32_33 = [ 4, 9, 15, 31, 32, 33 ];
const s_4_7_10_15_19_27_30_32_39 = [ 4, 7, 10, 15, 19, 27, 30, 32, 39 ];
const s_6_35 = [ 6, 35 ];
const s_15_18 = [ 15, 18 ];
const s_4_35 = [ 4, 35 ];
const s_6_8_15 = [ 6, 8, 15 ];
const s_5_8 = [ 5, 8 ];
const s_10_15_17_18 = [ 10, 15, 17, 18 ];
const s_7_27_1 = [ 7, 27, 1 ];
const s_27_1_0 = [ 27, 1, 0 ];
const s_6_10_12_32_37 = [ 6, 10, 12, 32, 37 ];
const s_5_13 = [ 5, 13 ];
const s_5_9 = [ 5, 9 ];
const s_6_10 = [ 6, 10 ];
const s_9_24 = [ 9, 24 ];
const s_16_26 = [ 16, 26 ];
const s_30_34 = [ 30, 34 ];
const s_10_26_32_0 = [ 10, 26, 32, 0 ];
const s_7_9_26 = [ 7, 9, 26 ];
const s_10_17 = [ 10, 17 ];
const s_10_2 = [ 10, 2 ];
const s_18_40_0 = [ 18, 40, 0 ];
const s_37_40 = [ 37, 40 ];
const s_38_0 = [ 38, 0 ];
const s_30_31_42 = [ 30, 31, 42 ];
const s_4_7_11_14 = [ 4, 7, 11, 14 ];
const s_13_34 = [ 13, 34 ];
const s_4_13 = [ 4, 13 ];
const s_23_0 = [ 23, 0 ];
const s_34_37 = [ 34, 37 ];
const s_10_28_2_0 = [ 10, 28, 2, 0 ];
const s_29_30 = [ 29, 30 ];
const s_4_10_14_24_26 = [ 4, 10, 14, 24, 26 ];
const s_5_27_30 = [ 5, 27, 30 ];
const s_4_21 = [ 4, 21 ];
const s_10_27 = [ 10, 27 ];
const s_31_32_40_41_42 = [ 31, 32, 40, 41, 42 ];
const s_4_7_21_40 = [ 4, 7, 21, 40 ];
const s_26_27_30 = [ 26, 27, 30 ];
const s_7_32 = [ 7, 32 ];
const s_4_7_9 = [ 4, 7, 9 ];
const s_17_19_22 = [ 17, 19, 22 ];
const s_5_6_27 = [ 5, 6, 27 ];
const s_10_11_0 = [ 10, 11, 0 ];
const s_5_18_1 = [ 5, 18, 1 ];
const s_29_30_36 = [ 29, 30, 36 ];
const s_18_30_31_41_0 = [ 18, 30, 31, 41, 0 ];
const s_7_24_25 = [ 7, 24, 25 ];
const s_7_10_18_0 = [ 7, 10, 18, 0 ];
const s_26_2 = [ 26, 2 ];
const s_6_18_27 = [ 6, 18, 27 ];
const s_14_27 = [ 14, 27 ];
const s_5_17_18 = [ 5, 17, 18 ];
const s_7_27_0 = [ 7, 27, 0 ];
const s_7_12_37 = [ 7, 12, 37 ];
const s_13_20_27 = [ 13, 20, 27 ];
const s_6_1_0 = [ 6, 1, 0 ];
const s_4_33 = [ 4, 33 ];
const s_30_32 = [ 30, 32 ];
const s_4_7_10 = [ 4, 7, 10 ];
const s_27_1 = [ 27, 1 ];
const s_6_10_27 = [ 6, 10, 27 ];
const s_4_10_26_32 = [ 4, 10, 26, 32 ];
const s_3_7_9_21_42 = [ 3, 7, 9, 21, 42 ];
const s_23_27 = [ 23, 27 ];
const s_5_6_1 = [ 5, 6, 1 ];
const s_11_22 = [ 11, 22 ];
const s_7_11 = [ 7, 11 ];
const s_6_8 = [ 6, 8 ];
const s_6_18_28 = [ 6, 18, 28 ];
const s_10_31 = [ 10, 31 ];
const s_7_0 = [ 7, 0 ];
const s_4_9_10 = [ 4, 9, 10 ];
const s_6_22 = [ 6, 22 ];
const s_31_35 = [ 31, 35 ];
const s_4_8_9 = [ 4, 8, 9 ];
const s_7_14 = [ 7, 14 ];
const s_6_9_18_35 = [ 6, 9, 18, 35 ];
const s_4_15_21_26 = [ 4, 15, 21, 26 ];
const s_17_18_20 = [ 17, 18, 20 ];
const s_20_26 = [ 20, 26 ];
const s_10_11 = [ 10, 11 ];
const s_4_12_26_37 = [ 4, 12, 26, 37 ];
const s_9_18_25_31_33_35_38 = [ 9, 18, 25, 31, 33, 35, 38 ];
const s_12_26_37 = [ 12, 26, 37 ];
const s_7_25 = [ 7, 25 ];
const s_3_0 = [ 3, 0 ];
const s_29_30_37_0 = [ 29, 30, 37, 0 ];
const s_4_7_26 = [ 4, 7, 26 ];
const s_13_15 = [ 13, 15 ];
const s_5_1 = [ 5, 1 ];
const s_6_35_40 = [ 6, 35, 40 ];
const s_4_9_12_18_26 = [ 4, 9, 12, 18, 26 ];
const s_10_20_0 = [ 10, 20, 0 ];
const s_20_25 = [ 20, 25 ];
const s_29_31 = [ 29, 31 ];
const s_15_18_26 = [ 15, 18, 26 ];
const s_5_26 = [ 5, 26 ];
const s_4_10_31_32_34_42 = [ 4, 10, 31, 32, 34, 42 ];
const s_4_12_24_26 = [ 4, 12, 24, 26 ];
const s_15_0 = [ 15, 0 ];
const s_21_33 = [ 21, 33 ];
const s_10_11_18_24_0 = [ 10, 11, 18, 24, 0 ];
const s_30_42 = [ 30, 42 ];
const s_5_6_7 = [ 5, 6, 7 ];
const s_4_29_0 = [ 4, 29, 0 ];
const s_30_31_32_37_41 = [ 30, 31, 32, 37, 41 ];
const s_9_12_26 = [ 9, 12, 26 ];
const s_9_12 = [ 9, 12 ];
const s_24_1 = [ 24, 1 ];
const s_6_18_30_40_0 = [ 6, 18, 30, 40, 0 ];
const s_6_7_28 = [ 6, 7, 28 ];
const s_22_26 = [ 22, 26 ];
const s_10_24 = [ 10, 24 ];
const s_5_18_32_42 = [ 5, 18, 32, 42 ];
const s_6_17 = [ 6, 17 ];
const s_15_28 = [ 15, 28 ];
const s_4_18 = [ 4, 18 ];
const s_11_0 = [ 11, 0 ];
const s_6_29 = [ 6, 29 ];
const s_4_9_11_18 = [ 4, 9, 11, 18 ];
const s_4_7_10_32_37_41 = [ 4, 7, 10, 32, 37, 41 ];
const s_30_36_39_41 = [ 30, 36, 39, 41 ];
const s_4_7_9_11 = [ 4, 7, 9, 11 ];
const s_32_34_37 = [ 32, 34, 37 ];
const s_32_35 = [ 32, 35 ];
const s_8_10 = [ 8, 10 ];
const s_10_13 = [ 10, 13 ];
const s_4_6_10 = [ 4, 6, 10 ];
const s_6_36 = [ 6, 36 ];
const s_32_34_35_40_41_42 = [ 32, 34, 35, 40, 41, 42 ];
const s_40_41 = [ 40, 41 ];
const s_4_6_14_18 = [ 4, 6, 14, 18 ];
const s_4_22_24 = [ 4, 22, 24 ];
const s_30_31_37_40 = [ 30, 31, 37, 40 ];
const s_31_35_37 = [ 31, 35, 37 ];
const s_4_9_12 = [ 4, 9, 12 ];
const s_18_31 = [ 18, 31 ];
const s_4_6_7_10_11_15_32_38_41_42 = [ 4, 6, 7, 10, 11, 15, 32, 38, 41, 42 ];
const s_4_7_11_0 = [ 4, 7, 11, 0 ];
const s_10_12 = [ 10, 12 ];
const s_31_40_0 = [ 31, 40, 0 ];
const s_4_10_12_26 = [ 4, 10, 12, 26 ];
const s_31_42_0 = [ 31, 42, 0 ];
const s_4_7_9_10 = [ 4, 7, 9, 10 ];
const s_7_13_20 = [ 7, 13, 20 ];
const s_5_17 = [ 5, 17 ];
const s_7_27 = [ 7, 27 ];
const s_6_38 = [ 6, 38 ];
const s_15_17_18 = [ 15, 17, 18 ];
const s_20_0_1 = [ 20, 0, 1 ];
const s_4_6_36 = [ 4, 6, 36 ];
const s_5_15_17 = [ 5, 15, 17 ];
const s_6_7 = [ 6, 7 ];
const s_5_8_1 = [ 5, 8, 1 ];
const s_4_40 = [ 4, 40 ];
const s_6_20 = [ 6, 20 ];
const s_19_25_38 = [ 19, 25, 38 ];
const s_6_8_25_38_0 = [ 6, 8, 25, 38, 0 ];
const s_28_0 = [ 28, 0 ];
const s_4_6_7_9 = [ 4, 6, 7, 9 ];
const s_6_15_0 = [ 6, 15, 0 ];
const s_6_7_8_9_15_26 = [ 6, 7, 8, 9, 15, 26 ];
const s_6_15_26 = [ 6, 15, 26 ];
const s_14_15 = [ 14, 15 ];
const s_29_30_38_41_42 = [ 29, 30, 38, 41, 42 ];
const s_9_1 = [ 9, 1 ];
const s_6_8_14_33_40 = [ 6, 8, 14, 33, 40 ];
const s_5_6_14_40 = [ 5, 6, 14, 40 ];
const s_20_1 = [ 20, 1 ];
const s_4_9_26 = [ 4, 9, 26 ];
const s_29_36_37_38 = [ 29, 36, 37, 38 ];
const s_29_31_32_35_36 = [ 29, 31, 32, 35, 36 ];
const s_4_7_9_10_14 = [ 4, 7, 9, 10, 14 ];
const s_6_10_14_31_35 = [ 6, 10, 14, 31, 35 ];
const s_21_26 = [ 21, 26 ];
const s_4_26_33_35_38 = [ 4, 26, 33, 35, 38 ];
const s_38_41 = [ 38, 41 ];
const s_4_6_9_10 = [ 4, 6, 9, 10 ];
const s_3 = [ 3 ];
const s_3_10_32 = [ 3, 10, 32 ];
const s_32_40_42_0 = [ 32, 40, 42, 0 ];
const s_4_8_10_25 = [ 4, 8, 10, 25 ];
const s_6_10_14 = [ 6, 10, 14 ];
const s_38_41_42 = [ 38, 41, 42 ];
const s_18_26_0 = [ 18, 26, 0 ];
const s_4_11_17 = [ 4, 11, 17 ];
const s_20_27_30 = [ 20, 27, 30 ];
const s_14_17 = [ 14, 17 ];
const s_32_41_42 = [ 32, 41, 42 ];
const s_7_9_24 = [ 7, 9, 24 ];
const s_10_29_32_35 = [ 10, 29, 32, 35 ];
const s_4_7_10_12 = [ 4, 7, 10, 12 ];
const s_4_5_8_18 = [ 4, 5, 8, 18 ];
const s_32_33 = [ 32, 33 ];
const s_4_5_32_33_41 = [ 4, 5, 32, 33, 41 ];
const s_4_9_10_27_31_41 = [ 4, 9, 10, 27, 31, 41 ];
const s_4_6_14 = [ 4, 6, 14 ];
const s_31_32_41 = [ 31, 32, 41 ];
const s_31_40 = [ 31, 40 ];
const s_4_7_9_21 = [ 4, 7, 9, 21 ];
const s_10_22 = [ 10, 22 ];
const s_31_34_40_41 = [ 31, 34, 40, 41 ];
const s_4_10_21 = [ 4, 10, 21 ];
const s_30_31_35 = [ 30, 31, 35 ];
const s_9_22_26 = [ 9, 22, 26 ];
const s_4_7_21 = [ 4, 7, 21 ];
const s_10_11_18_31_41_0 = [ 10, 11, 18, 31, 41, 0 ];
const s_4_9_14_22_24_26 = [ 4, 9, 14, 22, 24, 26 ];
const s_29_34_37 = [ 29, 34, 37 ];
const s_29_30_31_35_36_38_40_41 = [ 29, 30, 31, 35, 36, 38, 40, 41 ];
const s_4_7_9_10_11_28 = [ 4, 7, 9, 10, 11, 28 ];
const s_9_10_21 = [ 9, 10, 21 ];
const s_31_32_37 = [ 31, 32, 37 ];
const s_10_30 = [ 10, 30 ];
const s_17_25 = [ 17, 25 ];
const s_17_0 = [ 17, 0 ];
const s_15_27 = [ 15, 27 ];
const s_6_8_10_18 = [ 6, 8, 10, 18 ];
const s_6_10_23 = [ 6, 10, 23 ];
const s_7_15_17_23_26 = [ 7, 15, 17, 23, 26 ];
const s_30_33_35 = [ 30, 33, 35 ];
const s_11_26_29 = [ 11, 26, 29 ];
const s_35_40_41 = [ 35, 40, 41 ];
const s_4_6_10_12 = [ 4, 6, 10, 12 ];
const s_4_10_22_26_29_30_32_33 = [ 4, 10, 22, 26, 29, 30, 32, 33 ];
const s_38_40_41 = [ 38, 40, 41 ];
const s_39_41 = [ 39, 41 ];
const s_4_36_41 = [ 4, 36, 41 ];
const s_39_41_42 = [ 39, 41, 42 ];
const s_11_18_0 = [ 11, 18, 0 ];
const s_6_8_10_1 = [ 6, 8, 10, 1 ];
const s_4_7_9_24 = [ 4, 7, 9, 24 ];
const s_35_37 = [ 35, 37 ];
const s_9_18 = [ 9, 18 ];
const s_7_9_10_18_19 = [ 7, 9, 10, 18, 19 ];
const s_3_9_31 = [ 3, 9, 31 ];
const s_4_11_12_19_22 = [ 4, 11, 12, 19, 22 ];
const s_18_40 = [ 18, 40 ];
const s_10_14_26 = [ 10, 14, 26 ];
const s_6_7_10 = [ 6, 7, 10 ];
const s_4_21_31 = [ 4, 21, 31 ];
const s_4_9_36 = [ 4, 9, 36 ];
const s_4_10_11 = [ 4, 10, 11 ];
const s_7_19 = [ 7, 19 ];
const s_18_19_28 = [ 18, 19, 28 ];
const s_18_36 = [ 18, 36 ];
const s_7_9_10_14_18 = [ 7, 9, 10, 14, 18 ];
const s_9_14 = [ 9, 14 ];
const s_4_8 = [ 4, 8 ];
const s_4_39 = [ 4, 39 ];
const s_7_34_41 = [ 7, 34, 41 ];
const s_11_38 = [ 11, 38 ];
const s_44 = [ 44 ];
const s_9_24_31_41_42_0 = [ 9, 24, 31, 41, 42, 0 ];
const s_4_9_14 = [ 4, 9, 14 ];
const s_13_20_0 = [ 13, 20, 0 ];
const s_32_34_41 = [ 32, 34, 41 ];
const s_7_23 = [ 7, 23 ];
const s_29_0 = [ 29, 0 ];
const s_4_10_21_40 = [ 4, 10, 21, 40 ];
const s_6_30_35 = [ 6, 30, 35 ];
const s_6_8_9_14_20 = [ 6, 8, 9, 14, 20 ];
const s_7_30_0 = [ 7, 30, 0 ];
const s_11_32 = [ 11, 32 ];
const s_4_5_18_41 = [ 4, 5, 18, 41 ];
const s_4_18_0 = [ 4, 18, 0 ];
const s_10_18_42 = [ 10, 18, 42 ];
const s_18_42 = [ 18, 42 ];
const s_4_6_8_15_18_30_33_38_40_41_42_0_2 = [ 4, 6, 8, 15, 18, 30, 33, 38, 40, 41, 42, 0, 2 ];
const s_6_7_8_9 = [ 6, 7, 8, 9 ];
const s_4_11_30_39_41 = [ 4, 11, 30, 39, 41 ];
const s_6_7_9_11_26_30 = [ 6, 7, 9, 11, 26, 30 ];
const s_4_35_0 = [ 4, 35, 0 ];
const s_4_6_21 = [ 4, 6, 21 ];
const s_4_11_41 = [ 4, 11, 41 ];
const s_14_21_27_30 = [ 14, 21, 27, 30 ];
const s_31_38 = [ 31, 38 ];
const s_6_26 = [ 6, 26 ];
const s_8_15 = [ 8, 15 ];
const s_6_32 = [ 6, 32 ];
const s_6_2_0 = [ 6, 2, 0 ];
const s_4_6_18_33 = [ 4, 6, 18, 33 ];
const s_4_6_10_18_22 = [ 4, 6, 10, 18, 22 ];
const s_13_18 = [ 13, 18 ];
const s_7_0_2 = [ 7, 0, 2 ];
const s_9_10_35 = [ 9, 10, 35 ];
const s_5_18_32_37 = [ 5, 18, 32, 37 ];
const s_6_30_31_41 = [ 6, 30, 31, 41 ];
const s_4_5_6_18_23_35_40_42 = [ 4, 5, 6, 18, 23, 35, 40, 42 ];
const s_9_21_30_32_40_41 = [ 9, 21, 30, 32, 40, 41 ];
const s_9_15 = [ 9, 15 ];
const s_6_9_32_33_41 = [ 6, 9, 32, 33, 41 ];
const s_30_36_42 = [ 30, 36, 42 ];
const s_6_7_15_18_21_24_25_26_35_40_42 = [ 6, 7, 15, 18, 21, 24, 25, 26, 35, 40, 42 ];
const s_18_23 = [ 18, 23 ];
const s_6_15_35 = [ 6, 15, 35 ];
const s_4_6_9_15_41 = [ 4, 6, 9, 15, 41 ];
const s_4_6_8_11_14_18_25_35 = [ 4, 6, 8, 11, 14, 18, 25, 35 ];
const s_6_7_27_30 = [ 6, 7, 27, 30 ];
const s_9_19 = [ 9, 19 ];
const s_6_30_38 = [ 6, 30, 38 ];
const s_4_10_41 = [ 4, 10, 41 ];
const s_6_20_27 = [ 6, 20, 27 ];
const s_10_17_1 = [ 10, 17, 1 ];
const s_11_15 = [ 11, 15 ];
const s_10_23_32_41 = [ 10, 23, 32, 41 ];
const s_6_7_8_10_14_35 = [ 6, 7, 8, 10, 14, 35 ];
const s_6_29_35 = [ 6, 29, 35 ];
const s_32_33_0 = [ 32, 33, 0 ];
const s_4_8_11_12_35_38_39_2 = [ 4, 8, 11, 12, 35, 38, 39, 2 ];
const s_6_13 = [ 6, 13 ];
const s_4_11_0 = [ 4, 11, 0 ];
const s_4_6_14_17_21_31_35_38_40 = [ 4, 6, 14, 17, 21, 31, 35, 38, 40 ];
const s_21_40 = [ 21, 40 ];
const s_6_10_0 = [ 6, 10, 0 ];
const s_13_14_34 = [ 13, 14, 34 ];
const s_5_0 = [ 5, 0 ];
const s_4_6_7_10_14_17_23_32_35_41 = [ 4, 6, 7, 10, 14, 17, 23, 32, 35, 41 ];
const s_5_6_10_35 = [ 5, 6, 10, 35 ];
const s_6_13_30 = [ 6, 13, 30 ];
const s_18_29 = [ 18, 29 ];
const s_6_18_36 = [ 6, 18, 36 ];
const s_30_32_35_0 = [ 30, 32, 35, 0 ];
const s_27_29 = [ 27, 29 ];
const s_10_21_32_40 = [ 10, 21, 32, 40 ];
const s_6_10_18_0 = [ 6, 10, 18, 0 ];
const s_6_11_20_30_32_35 = [ 6, 11, 20, 30, 32, 35 ];
const s_6_23 = [ 6, 23 ];
const s_11_18 = [ 11, 18 ];
const s_15_21_26 = [ 15, 21, 26 ];
const s_7_28_1_0 = [ 7, 28, 1, 0 ];
const s_6_32_42 = [ 6, 32, 42 ];
const s_4_10_32 = [ 4, 10, 32 ];
const s_6_23_25_35 = [ 6, 23, 25, 35 ];
const s_6_33_35 = [ 6, 33, 35 ];
const s_6_9_17 = [ 6, 9, 17 ];
const s_6_9_10_14_15_17_23_24_25_27_31_34_42_0 = [ 6, 9, 10, 14, 15, 17, 23, 24, 25, 27, 31, 34, 42, 0 ];
const s_15_24 = [ 15, 24 ];
const s_11_35 = [ 11, 35 ];
const s_13_18_20 = [ 13, 18, 20 ];
const s_6_15_17_23 = [ 6, 15, 17, 23 ];
const s_4_6_23 = [ 4, 6, 23 ];
const s_5_6_7_10_13_18_0 = [ 5, 6, 7, 10, 13, 18, 0 ];
const s_5_30 = [ 5, 30 ];
const s_4_6_35 = [ 4, 6, 35 ];
const s_4_5_6_29_35 = [ 4, 5, 6, 29, 35 ];
const s_14_23_35 = [ 14, 23, 35 ];
const s_30_38_41 = [ 30, 38, 41 ];
const s_4_6_15_23 = [ 4, 6, 15, 23 ];
const s_4_29_35_38 = [ 4, 29, 35, 38 ];
const s_6_30 = [ 6, 30 ];
const s_14_23 = [ 14, 23 ];
const s_13_18_30_35 = [ 13, 18, 30, 35 ];
const s_6_9_15_41 = [ 6, 9, 15, 41 ];
const s_29_32 = [ 29, 32 ];
const s_5_6_11_17_20_32_0 = [ 5, 6, 11, 17, 20, 32, 0 ];
const s_17_38 = [ 17, 38 ];
const s_6_10_38_39 = [ 6, 10, 38, 39 ];
const s_6_25_35_36_42 = [ 6, 25, 35, 36, 42 ];
const s_5_8_20_35 = [ 5, 8, 20, 35 ];
const s_6_7_10_19_29_32_37_39_43 = [ 6, 7, 10, 19, 29, 32, 37, 39, 43 ];
const s_8_13_20_35 = [ 8, 13, 20, 35 ];
const s_5_18_29_31_35_36_40_41_42 = [ 5, 18, 29, 31, 35, 36, 40, 41, 42 ];
const s_5_8_18_20_42 = [ 5, 8, 18, 20, 42 ];
const s_6_7_15_24_0 = [ 6, 7, 15, 24, 0 ];
const s_3_18 = [ 3, 18 ];
const s_4_7_10_11_15_18_19_29_31_33_35_36_38_39_41_42_0 = [ 4, 7, 10, 11, 15, 18, 19, 29, 31, 33, 35, 36, 38, 39, 41, 42, 0 ];
const s_44_0 = [ 44, 0 ];
const s_32_37 = [ 32, 37 ];
const s_7_9_18 = [ 7, 9, 18 ];
const s_5_6_8_18_27_41 = [ 5, 6, 8, 18, 27, 41 ];
const s_10_38 = [ 10, 38 ];
const s_6_15_17_29_35_40 = [ 6, 15, 17, 29, 35, 40 ];
const s_31_37 = [ 31, 37 ];
const s_29_36 = [ 29, 36 ];
const s_9_17 = [ 9, 17 ];
const s_5_14 = [ 5, 14 ];
const s_5_10_13_32 = [ 5, 10, 13, 32 ];
const s_6_8_17 = [ 6, 8, 17 ];
const s_11_32_39 = [ 11, 32, 39 ];
const s_5_6_35_38_42_0 = [ 5, 6, 35, 38, 42, 0 ];
const s_31_34 = [ 31, 34 ];
const s_32_40 = [ 32, 40 ];
const s_18_40_42 = [ 18, 40, 42 ];
const s_18_30_32_41_42 = [ 18, 30, 32, 41, 42 ];
const s_4_9_11_15_28_0 = [ 4, 9, 11, 15, 28, 0 ];
const s_4_10_18 = [ 4, 10, 18 ];
const s_29_41 = [ 29, 41 ];
const s_8_2_0 = [ 8, 2, 0 ];
const s_3_26 = [ 3, 26 ];
const s_32_35_41 = [ 32, 35, 41 ];
const s_17_35 = [ 17, 35 ];
const s_33_37 = [ 33, 37 ];
const s_32_42 = [ 32, 42 ];
const s_4_10_0 = [ 4, 10, 0 ];
const s_6_11_18_25_28_35 = [ 6, 11, 18, 25, 28, 35 ];
const s_10_18_32 = [ 10, 18, 32 ];
const s_5_8_15_25_30 = [ 5, 8, 15, 25, 30 ];
const s_26_32 = [ 26, 32 ];
const s_40_42 = [ 40, 42 ];
const s_4_6_11_15_17_35_36 = [ 4, 6, 11, 15, 17, 35, 36 ];
const s_6_14_17_39_41 = [ 6, 14, 17, 39, 41 ];
const s_6_11_15_25_35_38 = [ 6, 11, 15, 25, 35, 38 ];
const s_4_7_11 = [ 4, 7, 11 ];
const s_13_18_1 = [ 13, 18, 1 ];
const s_7_10_21_40 = [ 7, 10, 21, 40 ];
const s_10_14_18_1 = [ 10, 14, 18, 1 ];
const s_30_35_37 = [ 30, 35, 37 ];
const s_9_15_20_0 = [ 9, 15, 20, 0 ];
const s_3_15 = [ 3, 15 ];
const s_6_15_18 = [ 6, 15, 18 ];
const s_13_18_20_35 = [ 13, 18, 20, 35 ];
const s_4_6_15_35_40 = [ 4, 6, 15, 35, 40 ];
const s_33_35_37 = [ 33, 35, 37 ];
const s_32_33_37 = [ 32, 33, 37 ];
const s_35_36 = [ 35, 36 ];
const s_4_18_33_0_2 = [ 4, 18, 33, 0, 2 ];
const s_4_21_31_32_33 = [ 4, 21, 31, 32, 33 ];
const s_31_39 = [ 31, 39 ];
const s_32_37_41 = [ 32, 37, 41 ];
const s_7_18_30_33_0_2 = [ 7, 18, 30, 33, 0, 2 ];
const s_4_11_26 = [ 4, 11, 26 ];
const s_9_25_31_33_0 = [ 9, 25, 31, 33, 0 ];
const s_6_34 = [ 6, 34 ];
const s_28_1 = [ 28, 1 ];
const s_4_10_32_40 = [ 4, 10, 32, 40 ];
const s_20_0 = [ 20, 0 ];
const s_30_42_0 = [ 30, 42, 0 ];
const s_4_25 = [ 4, 25 ];
const s_6_17_25_35 = [ 6, 17, 25, 35 ];
const s_6_27_30 = [ 6, 27, 30 ];
const s_4_5_6_10_21_32_40 = [ 4, 5, 6, 10, 21, 32, 40 ];
const s_4_6_10_42 = [ 4, 6, 10, 42 ];
const s_23_24_0 = [ 23, 24, 0 ];
const s_11_30_38 = [ 11, 30, 38 ];
const s_5_6 = [ 5, 6 ];
const s_10_15_18 = [ 10, 15, 18 ];
const s_6_10_23_35 = [ 6, 10, 23, 35 ];
const s_10_17_1_0 = [ 10, 17, 1, 0 ];
const s_9_29_30_32_35_41 = [ 9, 29, 30, 32, 35, 41 ];
const s_4_6_7_0 = [ 4, 6, 7, 0 ];
const s_4_34 = [ 4, 34 ];
const s_9_1_0 = [ 9, 1, 0 ];
const s_9_31 = [ 9, 31 ];
const s_17_26 = [ 17, 26 ];
const s_9_14_19 = [ 9, 14, 19 ];
const s_9_10_23_1 = [ 9, 10, 23, 1 ];
const s_6_20_35_0 = [ 6, 20, 35, 0 ];
const s_5_6_10_13_18_33 = [ 5, 6, 10, 13, 18, 33 ];
const s_6_23_35 = [ 6, 23, 35 ];
const s_27_38 = [ 27, 38 ];
const s_11_23_39 = [ 11, 23, 39 ];
const s_11_18_22_24_28_29 = [ 11, 18, 22, 24, 28, 29 ];
const s_7_21 = [ 7, 21 ];
const s_6_13_18 = [ 6, 13, 18 ];
const s_6_10_11_13_17_23_28 = [ 6, 10, 11, 13, 17, 23, 28 ];
const s_5_10_18_26_32 = [ 5, 10, 18, 26, 32 ];
const s_4_7_10_11_13_26_35_39 = [ 4, 7, 10, 11, 13, 26, 35, 39 ];
const s_7_9_13_39_2_0 = [ 7, 9, 13, 39, 2, 0 ];
const s_7_9_12 = [ 7, 9, 12 ];
const s_6_15_42 = [ 6, 15, 42 ];
const s_6_7_18_26_30_0 = [ 6, 7, 18, 26, 30, 0 ];
const s_13_20_35 = [ 13, 20, 35 ];
const s_13_26 = [ 13, 26 ];
const s_4_6_20_41 = [ 4, 6, 20, 41 ];
const s_18_41 = [ 18, 41 ];
const s_10_41 = [ 10, 41 ];
const s_4_40_41 = [ 4, 40, 41 ];
const s_9_11_26_28 = [ 9, 11, 26, 28 ];
const s_6_10_30_32 = [ 6, 10, 30, 32 ];
const s_6_8_13_17_18_20 = [ 6, 8, 13, 17, 18, 20 ];
const s_10_31_32_0 = [ 10, 31, 32, 0 ];
const s_6_10_41_0 = [ 6, 10, 41, 0 ];
const s_6_17_35_42_0 = [ 6, 17, 35, 42, 0 ];
const s_11_39 = [ 11, 39 ];
const s_4_10_11_19_30_32_33_35_36_38_39 = [ 4, 10, 11, 19, 30, 32, 33, 35, 36, 38, 39 ];
const s_32_0 = [ 32, 0 ];
const s_4_7_11_22_32_33_38_43 = [ 4, 7, 11, 22, 32, 33, 38, 43 ];
const s_4_7_27_30 = [ 4, 7, 27, 30 ];
const s_29_30_38_40 = [ 29, 30, 38, 40 ];
const s_7_30_35 = [ 7, 30, 35 ];
const s_4_10_11_30_35_42 = [ 4, 10, 11, 30, 35, 42 ];
const s_26_43 = [ 26, 43 ];
const s_6_10_14_30_39_0 = [ 6, 10, 14, 30, 39, 0 ];
const s_6_35_0 = [ 6, 35, 0 ];
const s_33_41 = [ 33, 41 ];
const s_4_29_39 = [ 4, 29, 39 ];
const s_6_10_35 = [ 6, 10, 35 ];
const s_8_20_26_30_32 = [ 8, 20, 26, 30, 32 ];
const s_14_19 = [ 14, 19 ];
const s_26_30 = [ 26, 30 ];
const s_25_35 = [ 25, 35 ];
const s_4_6_9_14_15_23_25_30_31_32_33_35_39_41 = [ 4, 6, 9, 14, 15, 23, 25, 30, 31, 32, 33, 35, 39, 41 ];
const s_4_6_33_35_41 = [ 4, 6, 33, 35, 41 ];
const s_7_18_0 = [ 7, 18, 0 ];
const s_7_8_14_18_35 = [ 7, 8, 14, 18, 35 ];
const s_30_0_2 = [ 30, 0, 2 ];
const s_19_20_22_26_28_30 = [ 19, 20, 22, 26, 28, 30 ];
const s_4_20 = [ 4, 20 ];
const s_20_28_30 = [ 20, 28, 30 ];
const s_4_7_35 = [ 4, 7, 35 ];
const s_7_36 = [ 7, 36 ];
const s_4_6_11_19_29_30_32_35_38_39_40_41_42_43 = [ 4, 6, 11, 19, 29, 30, 32, 35, 38, 39, 40, 41, 42, 43 ];
const s_6_10_11 = [ 6, 10, 11 ];
const s_7_27_29_32 = [ 7, 27, 29, 32 ];
const s_6_35_41 = [ 6, 35, 41 ];
const s_5_6_7_14_17_27_30_0 = [ 5, 6, 7, 14, 17, 27, 30, 0 ];
const s_10_15_20 = [ 10, 15, 20 ];
const s_6_9_36 = [ 6, 9, 36 ];
const s_4_10_17_32_33_0 = [ 4, 10, 17, 32, 33, 0 ];
const s_4_32_38_41 = [ 4, 32, 38, 41 ];
const s_30_35_39_0 = [ 30, 35, 39, 0 ];
const s_9_30_31_35_39 = [ 9, 30, 31, 35, 39 ];
const s_4_26_29_30 = [ 4, 26, 29, 30 ];
const s_10_19_26_29_32_43 = [ 10, 19, 26, 29, 32, 43 ];
const s_6_13_14_27_34_38_42 = [ 6, 13, 14, 27, 34, 38, 42 ];
const s_10_32_42 = [ 10, 32, 42 ];
const s_4_5_6_8_23_29_32_35_38 = [ 4, 5, 6, 8, 23, 29, 32, 35, 38 ];
const s_1_2_0 = [ 1, 2, 0 ];
const s_6_7_8_10_14_17_42 = [ 6, 7, 8, 10, 14, 17, 42 ];
const s_17_30 = [ 17, 30 ];
const s_6_18_23_35 = [ 6, 18, 23, 35 ];
const s_31_38_42 = [ 31, 38, 42 ];
const s_7_26_30_37_38 = [ 7, 26, 30, 37, 38 ];
const s_4_22_2 = [ 4, 22, 2 ];
const s_10_36 = [ 10, 36 ];
const s_10_20_27 = [ 10, 20, 27 ];
const s_4_6_19_30_34_35_38_2 = [ 4, 6, 19, 30, 34, 35, 38, 2 ];
const s_6_25 = [ 6, 25 ];
const s_6_11_33_41 = [ 6, 11, 33, 41 ];
const s_6_30_32_33_35 = [ 6, 30, 32, 33, 35 ];
const s_6_30_0 = [ 6, 30, 0 ];
const s_6_11_18 = [ 6, 11, 18 ];
const s_11_17 = [ 11, 17 ];
const s_6_7_18_19_21_24_27_35_40_41 = [ 6, 7, 18, 19, 21, 24, 27, 35, 40, 41 ];
const s_4_9_24 = [ 4, 9, 24 ];
const s_7_8_27_30_31_0 = [ 7, 8, 27, 30, 31, 0 ];
const s_9_21 = [ 9, 21 ];
const s_8_18_41 = [ 8, 18, 41 ];
const s_6_10_14_21_31_41 = [ 6, 10, 14, 21, 31, 41 ];
const s_6_11_26_30_35_39_43 = [ 6, 11, 26, 30, 35, 39, 43 ];
const s_4_6_38 = [ 4, 6, 38 ];
const s_4_7_30_35_38_41 = [ 4, 7, 30, 35, 38, 41 ];
const s_4_6_12_29_35 = [ 4, 6, 12, 29, 35 ];
const s_6_13_36_40_0 = [ 6, 13, 36, 40, 0 ];
const s_6_41 = [ 6, 41 ];
const s_10_14_35_38 = [ 10, 14, 35, 38 ];
const s_6_15_25_35_40_42 = [ 6, 15, 25, 35, 40, 42 ];
const s_6_7_11_18_35_37 = [ 6, 7, 11, 18, 35, 37 ];
const s_18_19 = [ 18, 19 ];
const s_4_6_8_9_26_35_39 = [ 4, 6, 8, 9, 26, 35, 39 ];
const s_6_18_35_0 = [ 6, 18, 35, 0 ];
const s_9_11_37_38_41 = [ 9, 11, 37, 38, 41 ];
const s_9_26 = [ 9, 26 ];
const s_6_23_35_40 = [ 6, 23, 35, 40 ];
const s_6_25_30_41 = [ 6, 25, 30, 41 ];
const s_6_8_15_17_28_31_35_40_0 = [ 6, 8, 15, 17, 28, 31, 35, 40, 0 ];
const s_4_7_11_35_38_40 = [ 4, 7, 11, 35, 38, 40 ];
const s_4_7_15_25_30_38_42_0 = [ 4, 7, 15, 25, 30, 38, 42, 0 ];
const s_7_15_25 = [ 7, 15, 25 ];
const s_6_7_21 = [ 6, 7, 21 ];
const s_13_14_18 = [ 13, 14, 18 ];
const s_5_1_0 = [ 5, 1, 0 ];
const s_4_6_10_25_32_36_38 = [ 4, 6, 10, 25, 32, 36, 38 ];
const s_4_6_23_25_33_35_38 = [ 4, 6, 23, 25, 33, 35, 38 ];
const s_4_6_20_23_25_26_35 = [ 4, 6, 20, 23, 25, 26, 35 ];
const s_6_10_14_23_29_35_37 = [ 6, 10, 14, 23, 29, 35, 37 ];
const s_6_10_14_31_32_35 = [ 6, 10, 14, 31, 32, 35 ];
const s_10_32_0 = [ 10, 32, 0 ];
const s_5_14_18 = [ 5, 14, 18 ];
const s_6_8_35_36 = [ 6, 8, 35, 36 ];
const s_8_9_13_18_35 = [ 8, 9, 13, 18, 35 ];
const s_6_14_20_38 = [ 6, 14, 20, 38 ];
const s_6_14_17_19_20_25_30 = [ 6, 14, 17, 19, 20, 25, 30 ];
const s_6_9_10_27_32_35_41 = [ 6, 9, 10, 27, 32, 35, 41 ];
const s_10_35_39 = [ 10, 35, 39 ];
const s_6_7_14_27 = [ 6, 7, 14, 27 ];
const s_6_40 = [ 6, 40 ];
const s_14_18_42_0 = [ 14, 18, 42, 0 ];
const s_4_11_32 = [ 4, 11, 32 ];
const s_11_29_30_32 = [ 11, 29, 30, 32 ];
const s_32_1_0 = [ 32, 1, 0 ];
const s_4_11_17_35_41 = [ 4, 11, 17, 35, 41 ];
const s_13_21_35 = [ 13, 21, 35 ];
const s_4_11_17_26_28_29_30_31_32_33_35_37_38_40_41_42 = [ 4, 11, 17, 26, 28, 29, 30, 31, 32, 33, 35, 37, 38, 40, 41, 42 ];
const s_4_21_23 = [ 4, 21, 23 ];
const s_4_9_11_22_26 = [ 4, 9, 11, 22, 26 ];
const s_5_13_35 = [ 5, 13, 35 ];
const s_5_8_13_33_38_42 = [ 5, 8, 13, 33, 38, 42 ];
const s_4_10_19_27_28 = [ 4, 10, 19, 27, 28 ];
const s_29_30_32_40_42 = [ 29, 30, 32, 40, 42 ];
const s_6_28 = [ 6, 28 ];
const s_9_14_29_35_36 = [ 9, 14, 29, 35, 36 ];
const s_4_7_0 = [ 4, 7, 0 ];
const s_4_19_38_43 = [ 4, 19, 38, 43 ];
const s_13_30_36 = [ 13, 30, 36 ];
const s_4_1 = [ 4, 1 ];
const s_4_6_8_24_35_38_42 = [ 4, 6, 8, 24, 35, 38, 42 ];
const s_4_6_32_35_37 = [ 4, 6, 32, 35, 37 ];
const s_14_33 = [ 14, 33 ];
const s_30_43 = [ 30, 43 ];
const s_6_30_42 = [ 6, 30, 42 ];
const s_13_27_30 = [ 13, 27, 30 ];
const s_30_32_35_36_37_38_40 = [ 30, 32, 35, 36, 37, 38, 40 ];
const s_5_6_31_38_42 = [ 5, 6, 31, 38, 42 ];
const s_13_0 = [ 13, 0 ];
const s_10_32_35 = [ 10, 32, 35 ];
const s_4_6_10_35_2_0 = [ 4, 6, 10, 35, 2, 0 ];
const s_5_27 = [ 5, 27 ];
const s_4_30_42 = [ 4, 30, 42 ];
const s_6_27_29_30_0 = [ 6, 27, 29, 30, 0 ];
const s_14_29_31_37_42 = [ 14, 29, 31, 37, 42 ];
const s_12_22_0 = [ 12, 22, 0 ];
const s_17_31 = [ 17, 31 ];
const s_6_20_35 = [ 6, 20, 35 ];
const s_12_14_24 = [ 12, 14, 24 ];
const s_6_7_18_30_0 = [ 6, 7, 18, 30, 0 ];
const s_4_10_14_34_35_40 = [ 4, 10, 14, 34, 35, 40 ];
const s_26_30_35_37 = [ 26, 30, 35, 37 ];
const s_4_5_6_11_14_30_35_38 = [ 4, 5, 6, 11, 14, 30, 35, 38 ];
const s_3_18_0 = [ 3, 18, 0 ];
const s_6_9_17_29_30_38_39 = [ 6, 9, 17, 29, 30, 38, 39 ];
const s_5_6_18_21_38_41 = [ 5, 6, 18, 21, 38, 41 ];
const s_6_25_30_35 = [ 6, 25, 30, 35 ];
const s_10_18_1_0 = [ 10, 18, 1, 0 ];
const s_20_30 = [ 20, 30 ];
const s_18_38 = [ 18, 38 ];
const s_21_31 = [ 21, 31 ];
const s_6_7_8_18_27_35_0 = [ 6, 7, 8, 18, 27, 35, 0 ];
const s_5_13_15_37 = [ 5, 13, 15, 37 ];
const s_6_15_27_30_35 = [ 6, 15, 27, 30, 35 ];
const s_6_13_35 = [ 6, 13, 35 ];
const s_5_6_26_37_39 = [ 5, 6, 26, 37, 39 ];
const s_6_20_36 = [ 6, 20, 36 ];
const s_7_8_30_31_36_41 = [ 7, 8, 30, 31, 36, 41 ];
const s_6_8_20_25 = [ 6, 8, 20, 25 ];
const s_25_30_38_42 = [ 25, 30, 38, 42 ];
const s_7_30 = [ 7, 30 ];
const s_4_5_10_15_18_30_32_40_41 = [ 4, 5, 10, 15, 18, 30, 32, 40, 41 ];
const s_5_33 = [ 5, 33 ];
const s_6_21 = [ 6, 21 ];
const s_18_32_37_0 = [ 18, 32, 37, 0 ];
const s_6_33 = [ 6, 33 ];
const s_8_18_40_42_0 = [ 8, 18, 40, 42, 0 ];
const s_32_38_41 = [ 32, 38, 41 ];
const s_11_25_26_35_38_40_41 = [ 11, 25, 26, 35, 38, 40, 41 ];
const s_14_35_38 = [ 14, 35, 38 ];
const s_6_14_21_29_35 = [ 6, 14, 21, 29, 35 ];
const s_4_29_41 = [ 4, 29, 41 ];
const s_6_10_38_40_41 = [ 6, 10, 38, 40, 41 ];
const s_6_35_38_40 = [ 6, 35, 38, 40 ];
const s_4_20_26_35 = [ 4, 20, 26, 35 ];
const s_10_32_35_38 = [ 10, 32, 35, 38 ];
const s_6_20_30 = [ 6, 20, 30 ];
const s_6_9_10_32_35 = [ 6, 9, 10, 32, 35 ];
const s_7_13_15 = [ 7, 13, 15 ];
const s_18_30_41 = [ 18, 30, 41 ];
const s_7_20_30 = [ 7, 20, 30 ];
const s_10_32_1 = [ 10, 32, 1 ];
const s_4_7_26_29_30_34_36_37_39_40_41_43 = [ 4, 7, 26, 29, 30, 34, 36, 37, 39, 40, 41, 43 ];
const s_4_22_26_0 = [ 4, 22, 26, 0 ];
const s_7_35 = [ 7, 35 ];
const s_4_29 = [ 4, 29 ];
const s_6_18_20_30 = [ 6, 18, 20, 30 ];
const s_4_11_30_37_38_42 = [ 4, 11, 30, 37, 38, 42 ];
const s_15_1 = [ 15, 1 ];
const s_31_35_39_41 = [ 31, 35, 39, 41 ];
const s_6_9_30_38 = [ 6, 9, 30, 38 ];
const s_8_14_15_18_20_40_0 = [ 8, 14, 15, 18, 20, 40, 0 ];
const s_23_30 = [ 23, 30 ];
const s_33_38_42 = [ 33, 38, 42 ];
const s_4_6_8_11_30_35_41_0 = [ 4, 6, 8, 11, 30, 35, 41, 0 ];
const s_41_0 = [ 41, 0 ];
const s_8_18_0 = [ 8, 18, 0 ];
const s_18_35 = [ 18, 35 ];
const s_6_8_18_20_35 = [ 6, 8, 18, 20, 35 ];
const s_13_18_35 = [ 13, 18, 35 ];
const s_4_5_32_35_38 = [ 4, 5, 32, 35, 38 ];
const s_6_8_10_20_35 = [ 6, 8, 10, 20, 35 ];
const s_21_31_40_42 = [ 21, 31, 40, 42 ];
const s_4_11_32_38_39_42 = [ 4, 11, 32, 38, 39, 42 ];
const s_6_8_32 = [ 6, 8, 32 ];
const s_9_14_31 = [ 9, 14, 31 ];
const s_13_20_21_40 = [ 13, 20, 21, 40 ];
const s_6_10_23_32_35 = [ 6, 10, 23, 32, 35 ];
const s_6_21_40 = [ 6, 21, 40 ];
const s_10_11_29_32 = [ 10, 11, 29, 32 ];
const s_18_33 = [ 18, 33 ];
const s_6_18_26_41 = [ 6, 18, 26, 41 ];
const s_5_10 = [ 5, 10 ];
const s_31_32_40 = [ 31, 32, 40 ];
const s_10_14_28_31 = [ 10, 14, 28, 31 ];
const s_5_8_27 = [ 5, 8, 27 ];
const s_6_31 = [ 6, 31 ];
const s_4_15_28 = [ 4, 15, 28 ];
const s_4_9_10_29_31_32_38_40_41_42 = [ 4, 9, 10, 29, 31, 32, 38, 40, 41, 42 ];
const s_10_14 = [ 10, 14 ];
const s_20_26_30 = [ 20, 26, 30 ];
const s_7_19_29_30_37_0 = [ 7, 19, 29, 30, 37, 0 ];
const s_7_12_26 = [ 7, 12, 26 ];
const s_29_35 = [ 29, 35 ];
const s_4_17_25_38 = [ 4, 17, 25, 38 ];
const s_18_28_1 = [ 18, 28, 1 ];
const s_4_6_7_39 = [ 4, 6, 7, 39 ];
const s_6_9_14_30_35_42_0 = [ 6, 9, 14, 30, 35, 42, 0 ];
const s_4_11_33_41 = [ 4, 11, 33, 41 ];
const s_6_8_10_23_30_41 = [ 6, 8, 10, 23, 30, 41 ];
const s_17_18_1 = [ 17, 18, 1 ];
const s_6_8_17_40 = [ 6, 8, 17, 40 ];
const s_5_7_18_0 = [ 5, 7, 18, 0 ];
const s_10_32_35_41_42 = [ 10, 32, 35, 41, 42 ];
const s_5_15_17_18_26 = [ 5, 15, 17, 18, 26 ];
const s_26_1 = [ 26, 1 ];
const s_6_23_39 = [ 6, 23, 39 ];
const s_13_39 = [ 13, 39 ];
const s_9_26_29 = [ 9, 26, 29 ];
const s_4_5_6_33 = [ 4, 5, 6, 33 ];
const s_10_17_18 = [ 10, 17, 18 ];
const s_6_10_17_38 = [ 6, 10, 17, 38 ];
const s_6_36_42 = [ 6, 36, 42 ];
const s_15_41_42 = [ 15, 41, 42 ];
const s_6_26_35 = [ 6, 26, 35 ];
const s_6_9_26_31_41 = [ 6, 9, 26, 31, 41 ];
const s_6_10_17_20_30_42 = [ 6, 10, 17, 20, 30, 42 ];
const s_4_7_9_19_23_26 = [ 4, 7, 9, 19, 23, 26 ];
const s_4_13_20_38 = [ 4, 13, 20, 38 ];
const s_6_8_1_0 = [ 6, 8, 1, 0 ];
const s_6_10_14_15_21_0 = [ 6, 10, 14, 15, 21, 0 ];
const s_30_31_36_40 = [ 30, 31, 36, 40 ];
const s_6_8_10_20_30_35 = [ 6, 8, 10, 20, 30, 35 ];
const s_10_40 = [ 10, 40 ];
const s_4_22_35_36_37_40 = [ 4, 22, 35, 36, 37, 40 ];
const s_8_25 = [ 8, 25 ];
const s_7_13_0 = [ 7, 13, 0 ];
const s_6_14_38 = [ 6, 14, 38 ];
const s_27_30_42 = [ 27, 30, 42 ];
const s_26_27 = [ 26, 27 ];
const s_6_10_18_27_31_35 = [ 6, 10, 18, 27, 31, 35 ];
const s_5_7_18_23_0 = [ 5, 7, 18, 23, 0 ];
const s_4_9_12_37_41 = [ 4, 9, 12, 37, 41 ];
const s_8_17 = [ 8, 17 ];
const s_5_44 = [ 5, 44 ];
const s_12_0 = [ 12, 0 ];
const s_30_31_36 = [ 30, 31, 36 ];
const s_7_20_0 = [ 7, 20, 0 ];
const s_4_10_36 = [ 4, 10, 36 ];
const s_4_11_35_38 = [ 4, 11, 35, 38 ];
const s_5_13_32 = [ 5, 13, 32 ];
const s_6_17_35_42 = [ 6, 17, 35, 42 ];
const s_5_6_14_18_19_27 = [ 5, 6, 14, 18, 19, 27 ];
const s_4_13_20 = [ 4, 13, 20 ];
const s_4_29_30_31_32_33_34_35_36_38_40_41_42 = [ 4, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 41, 42 ];
const s_4_6_21_38 = [ 4, 6, 21, 38 ];
const s_11_14_17_35_38 = [ 11, 14, 17, 35, 38 ];
const s_4_6_8_9_10_11_18_23_26_35_39 = [ 4, 6, 8, 9, 10, 11, 18, 23, 26, 35, 39 ];
const s_18_21_40 = [ 18, 21, 40 ];
const s_6_15_27 = [ 6, 15, 27 ];
const s_4_6_7_14_25_29_32_33_35_36_38_40_41 = [ 4, 6, 7, 14, 25, 29, 32, 33, 35, 36, 38, 40, 41 ];
const s_4_6_33 = [ 4, 6, 33 ];
const s_5_6_17 = [ 5, 6, 17 ];
const s_18_29_30 = [ 18, 29, 30 ];
const s_4_5_6_18_29_35 = [ 4, 5, 6, 18, 29, 35 ];
const s_10_31_36 = [ 10, 31, 36 ];
const s_11_19_26 = [ 11, 19, 26 ];
const s_10_13_18 = [ 10, 13, 18 ];
const s_4_6_7_10_17_18_23_29_30_31_33_35_36_37_38_39_40_41_43 = [ 4, 6, 7, 10, 17, 18, 23, 29, 30, 31, 33, 35, 36, 37, 38, 39, 40, 41, 43 ];
const s_14_41 = [ 14, 41 ];
const s_5_8_0 = [ 5, 8, 0 ];
const s_3_4_10_11_32_36 = [ 3, 4, 10, 11, 32, 36 ];
const s_7_9_10_32 = [ 7, 9, 10, 32 ];
const s_17_31_35 = [ 17, 31, 35 ];
const s_8_17_22_25 = [ 8, 17, 22, 25 ];
const s_28_42 = [ 28, 42 ];
const s_18_26 = [ 18, 26 ];
const s_3_6_14 = [ 3, 6, 14 ];
const s_10_27_0 = [ 10, 27, 0 ];
const s_8_27_35 = [ 8, 27, 35 ];
const s_18_31_41 = [ 18, 31, 41 ];
const s_21_23 = [ 21, 23 ];
const s_4_6_8_9_13_14_15_18_31_38_42_0 = [ 4, 6, 8, 9, 13, 14, 15, 18, 31, 38, 42, 0 ];
const s_6_8_9_13_15_31_38 = [ 6, 8, 9, 13, 15, 31, 38 ];
const s_23_28 = [ 23, 28 ];
const s_5_35 = [ 5, 35 ];
const s_13_20_1 = [ 13, 20, 1 ];
const s_32_40_41 = [ 32, 40, 41 ];
const s_10_15_17_27 = [ 10, 15, 17, 27 ];
const s_12_26_30_35_37_39 = [ 12, 26, 30, 35, 37, 39 ];
const s_6_27_32 = [ 6, 27, 32 ];
const s_6_14_17_18_23_35 = [ 6, 14, 17, 18, 23, 35 ];
const s_4_6_18_32_41 = [ 4, 6, 18, 32, 41 ];
const s_6_7_27_36 = [ 6, 7, 27, 36 ];
const s_6_8_14_42 = [ 6, 8, 14, 42 ];
const s_18_33_0 = [ 18, 33, 0 ];
const s_4_7_19_26_40_41_0 = [ 4, 7, 19, 26, 40, 41, 0 ];
const s_4_6_7_11_19_21_24_30_38_40 = [ 4, 6, 7, 11, 19, 21, 24, 30, 38, 40 ];
const s_4_6_8_10_17_25_35_38 = [ 4, 6, 8, 10, 17, 25, 35, 38 ];
const s_35_36_38 = [ 35, 36, 38 ];
const s_9_18_19_26 = [ 9, 18, 19, 26 ];
const s_6_17_18_25_30 = [ 6, 17, 18, 25, 30 ];
const s_10_11_14_28 = [ 10, 11, 14, 28 ];
const s_5_18_27_30_43 = [ 5, 18, 27, 30, 43 ];
const s_7_9_10_18_26_35 = [ 7, 9, 10, 18, 26, 35 ];
const s_7_9_10_0 = [ 7, 9, 10, 0 ];
const s_6_7_27_36_0 = [ 6, 7, 27, 36, 0 ];
const s_4_6_10_12_16_18_19_21_30_31_32_33_35_36_37_38_40_41 = [ 4, 6, 10, 12, 16, 18, 19, 21, 30, 31, 32, 33, 35, 36, 37, 38, 40, 41 ];
const s_4_7_14_20 = [ 4, 7, 14, 20 ];
const s_4_15_38 = [ 4, 15, 38 ];
const s_6_7_9_10_32_33_37_41 = [ 6, 7, 9, 10, 32, 33, 37, 41 ];
const s_6_10_31_36 = [ 6, 10, 31, 36 ];
const s_10_40_41 = [ 10, 40, 41 ];
const s_4_6_18_35_38_41 = [ 4, 6, 18, 35, 38, 41 ];
const s_5_10_32 = [ 5, 10, 32 ];
const s_10_11_32_35_39 = [ 10, 11, 32, 35, 39 ];
const s_4_18_20_33_41 = [ 4, 18, 20, 33, 41 ];
const s_4_6_7_9_10_21_26_30_31_32_33_36_38_40_41_42 = [ 4, 6, 7, 9, 10, 21, 26, 30, 31, 32, 33, 36, 38, 40, 41, 42 ];
const s_6_18_30_36 = [ 6, 18, 30, 36 ];
const s_4_11_33 = [ 4, 11, 33 ];
const s_4_6_28 = [ 4, 6, 28 ];
const s_7_8_10_32 = [ 7, 8, 10, 32 ];
const s_7_10_32_37 = [ 7, 10, 32, 37 ];
const s_13_20_35_42 = [ 13, 20, 35, 42 ];
const s_27_42_1 = [ 27, 42, 1 ];
const s_9_24_27 = [ 9, 24, 27 ];
const s_6_30_36 = [ 6, 30, 36 ];
const s_7_13_20_0 = [ 7, 13, 20, 0 ];
const s_5_7_13_20_0 = [ 5, 7, 13, 20, 0 ];
const s_4_13_34 = [ 4, 13, 34 ];
const s_4_6_14_32_33 = [ 4, 6, 14, 32, 33 ];
const s_5_11_13_18_0 = [ 5, 11, 13, 18, 0 ];
const s_22_1 = [ 22, 1 ];
const s_7_12_26_30_37 = [ 7, 12, 26, 30, 37 ];
const s_5_9_18 = [ 5, 9, 18 ];
const s_6_39 = [ 6, 39 ];
const s_8_10_38 = [ 8, 10, 38 ];
const s_11_17_18_30_35_39 = [ 11, 17, 18, 30, 35, 39 ];
const s_5_10_13_18_19 = [ 5, 10, 13, 18, 19 ];
const s_4_6_7_13_17_35 = [ 4, 6, 7, 13, 17, 35 ];
const s_11_32_36 = [ 11, 32, 36 ];
const s_6_35_2 = [ 6, 35, 2 ];
const s_7_13 = [ 7, 13 ];
const s_4_9_0 = [ 4, 9, 0 ];
const s_6_14_36 = [ 6, 14, 36 ];
const s_6_29_30_35_41 = [ 6, 29, 30, 35, 41 ];
const s_15_25 = [ 15, 25 ];
const s_8_12 = [ 8, 12 ];
const s_4_8_13_19_33_35_36_38 = [ 4, 8, 13, 19, 33, 35, 36, 38 ];
const s_4_6_8 = [ 4, 6, 8 ];
const s_10_25_30_36 = [ 10, 25, 30, 36 ];
const s_31_36 = [ 31, 36 ];
const s_10_29 = [ 10, 29 ];
const s_10_11_14_32_36 = [ 10, 11, 14, 32, 36 ];
const s_14_15_18 = [ 14, 15, 18 ];
const s_13_14 = [ 13, 14 ];
const s_5_13_14 = [ 5, 13, 14 ];
const s_27_30_35 = [ 27, 30, 35 ];
const s_9_10_24 = [ 9, 10, 24 ];
const s_6_13_29_35_40 = [ 6, 13, 29, 35, 40 ];
const s_14_23_31_35 = [ 14, 23, 31, 35 ];
const s_4_6_14_38 = [ 4, 6, 14, 38 ];
const s_6_35_38 = [ 6, 35, 38 ];
const s_4_6_31_35 = [ 4, 6, 31, 35 ];
const s_5_27_0 = [ 5, 27, 0 ];
const s_10_18_23_31_32 = [ 10, 18, 23, 31, 32 ];
const s_4_6_14_25_35_38 = [ 4, 6, 14, 25, 35, 38 ];
const s_4_6_14_15_38 = [ 4, 6, 14, 15, 38 ];
const s_30_32_38_41 = [ 30, 32, 38, 41 ];
const s_32_38 = [ 32, 38 ];
const s_4_10_11_19_23 = [ 4, 10, 11, 19, 23 ];
const s_4_28 = [ 4, 28 ];
const s_7_15 = [ 7, 15 ];
const s_4_5_6_14 = [ 4, 5, 6, 14 ];
const s_5_17_20 = [ 5, 17, 20 ];
const s_10_32_36 = [ 10, 32, 36 ];
const s_27_30 = [ 27, 30 ];
const s_7_14_22 = [ 7, 14, 22 ];
const s_13_30 = [ 13, 30 ];
const s_6_11_32_39 = [ 6, 11, 32, 39 ];
const s_4_7_10_32_40 = [ 4, 7, 10, 32, 40 ];
const s_5_13_21_35 = [ 5, 13, 21, 35 ];
const s_10_11_32_41 = [ 10, 11, 32, 41 ];
const s_6_32_35 = [ 6, 32, 35 ];
const s_11_26_29_32_35_38 = [ 11, 26, 29, 32, 35, 38 ];
const s_7_13_34 = [ 7, 13, 34 ];
const s_6_32_36_0 = [ 6, 32, 36, 0 ];
const s_4_11_26_32_35_42 = [ 4, 11, 26, 32, 35, 42 ];
const s_4_7_14_31 = [ 4, 7, 14, 31 ];
const s_5_6_32_35_38 = [ 5, 6, 32, 35, 38 ];
const s_6_32_39 = [ 6, 32, 39 ];
const s_8_18_27 = [ 8, 18, 27 ];
const s_4_29_30_35_42_0_2 = [ 4, 29, 30, 35, 42, 0, 2 ];
const s_15_26_30_31_32_38_39_40_41_43_0_2 = [ 15, 26, 30, 31, 32, 38, 39, 40, 41, 43, 0, 2 ];
const s_4_7_23 = [ 4, 7, 23 ];
const s_4_8_22_26 = [ 4, 8, 22, 26 ];
const s_17_25_0 = [ 17, 25, 0 ];
const s_10_14_35 = [ 10, 14, 35 ];
const s_4_6_10_11_31_32_35_38_39 = [ 4, 6, 10, 11, 31, 32, 35, 38, 39 ];
const s_4_10_11_26_30 = [ 4, 10, 11, 26, 30 ];
const s_4_11_17_30_38 = [ 4, 11, 17, 30, 38 ];
const s_6_18_20 = [ 6, 18, 20 ];
const s_4_6_32_35 = [ 4, 6, 32, 35 ];
const s_6_9_10 = [ 6, 9, 10 ];
const s_13_35_37 = [ 13, 35, 37 ];
const s_6_11_39 = [ 6, 11, 39 ];
const s_6_17_30 = [ 6, 17, 30 ];
const s_4_6_11_30_35_38 = [ 4, 6, 11, 30, 35, 38 ];
const s_6_35_39 = [ 6, 35, 39 ];
const s_21_35 = [ 21, 35 ];
const s_4_6_30_35_36 = [ 4, 6, 30, 35, 36 ];
const s_6_30_35_42 = [ 6, 30, 35, 42 ];
const s_6_14_18_36 = [ 6, 14, 18, 36 ];
const s_4_10_28_30_32_35_38_39_41_42_0_2 = [ 4, 10, 28, 30, 32, 35, 38, 39, 41, 42, 0, 2 ];
const s_18_2 = [ 18, 2 ];
const s_4_6_9_10_30 = [ 4, 6, 9, 10, 30 ];
const s_8_30 = [ 8, 30 ];
const s_29_35_41 = [ 29, 35, 41 ];
const s_14_17_19_26_30_35_37_38_39_43 = [ 14, 17, 19, 26, 30, 35, 37, 38, 39, 43 ];
const s_4_6_7_10_35 = [ 4, 6, 7, 10, 35 ];
const s_34_40 = [ 34, 40 ];
const s_6_14_35_41 = [ 6, 14, 35, 41 ];
const s_11_14_35_38_39 = [ 11, 14, 35, 38, 39 ];
const s_4_6_14_26_31_35 = [ 4, 6, 14, 26, 31, 35 ];
const s_10_26_30 = [ 10, 26, 30 ];
const s_6_18_32_38 = [ 6, 18, 32, 38 ];
const s_17_27_35_40_43 = [ 17, 27, 35, 40, 43 ];
const s_4_9_17_38 = [ 4, 9, 17, 38 ];
const s_5_6_29_35 = [ 5, 6, 29, 35 ];
const s_4_6_7 = [ 4, 6, 7 ];
const s_5_6_8_35_38 = [ 5, 6, 8, 35, 38 ];
const s_5_41 = [ 5, 41 ];
const s_5_13_35_38 = [ 5, 13, 35, 38 ];
const s_5_6_18_20 = [ 5, 6, 18, 20 ];
const s_5_35_38 = [ 5, 35, 38 ];
const s_5_13_20_32_2_0 = [ 5, 13, 20, 32, 2, 0 ];
const s_6_18_35 = [ 6, 18, 35 ];
const s_10_18_0 = [ 10, 18, 0 ];
const s_35_42 = [ 35, 42 ];
const s_6_8_29_35 = [ 6, 8, 29, 35 ];
const s_8_29 = [ 8, 29 ];
const s_6_25_35_36_38 = [ 6, 25, 35, 36, 38 ];
const s_21_36 = [ 21, 36 ];
const s_6_13_27_30 = [ 6, 13, 27, 30 ];
const s_7_9_26_0 = [ 7, 9, 26, 0 ];
const s_4_11_26_29_30_37_38 = [ 4, 11, 26, 29, 30, 37, 38 ];
const s_4_6_7_35 = [ 4, 6, 7, 35 ];
const s_21_0 = [ 21, 0 ];
const s_10_35_40_2_0 = [ 10, 35, 40, 2, 0 ];
const s_4_10_14 = [ 4, 10, 14 ];
const s_6_17_18 = [ 6, 17, 18 ];
const s_8_10_15_23 = [ 8, 10, 15, 23 ];
const s_7_9_27_30_32_36_41_0 = [ 7, 9, 27, 30, 32, 36, 41, 0 ];
const s_4_7_13 = [ 4, 7, 13 ];
const s_6_15_17 = [ 6, 15, 17 ];
const s_6_8_10_14_25 = [ 6, 8, 10, 14, 25 ];
const s_9_17_20 = [ 9, 17, 20 ];
const s_6_11_14_30_35_40_41_42 = [ 6, 11, 14, 30, 35, 40, 41, 42 ];
const s_30_37_43 = [ 30, 37, 43 ];
const s_4_22_26 = [ 4, 22, 26 ];
const s_8_30_31_38_39_42 = [ 8, 30, 31, 38, 39, 42 ];
const s_13_36 = [ 13, 36 ];
const s_4_6_12_26_29_37 = [ 4, 6, 12, 26, 29, 37 ];
const s_7_9_10_14_26_32_41_42 = [ 7, 9, 10, 14, 26, 32, 41, 42 ];
const s_4_10_14_21_26_41 = [ 4, 10, 14, 21, 26, 41 ];
const s_14_15_32 = [ 14, 15, 32 ];
const s_32_35_40 = [ 32, 35, 40 ];
const s_3_10_24 = [ 3, 10, 24 ];
const s_14_15_21_26 = [ 14, 15, 21, 26 ];
const s_4_30_38 = [ 4, 30, 38 ];
const s_6_10_35_0 = [ 6, 10, 35, 0 ];
const s_14_18_26_42 = [ 14, 18, 26, 42 ];
const s_7_31_32_42 = [ 7, 31, 32, 42 ];
const s_4_7_24 = [ 4, 7, 24 ];
const s_6_7_9_31_38_41 = [ 6, 7, 9, 31, 38, 41 ];
const s_37_0 = [ 37, 0 ];
const s_41_42 = [ 41, 42 ];
const s_40_41_42 = [ 40, 41, 42 ];
const s_4_21_22 = [ 4, 21, 22 ];
const s_4_11_18_24 = [ 4, 11, 18, 24 ];
const s_36_40 = [ 36, 40 ];
const s_7_9_10_14_23_27_30 = [ 7, 9, 10, 14, 23, 27, 30 ];
const s_30_32_33_41_0 = [ 30, 32, 33, 41, 0 ];
const s_6_9_12_27_0 = [ 6, 9, 12, 27, 0 ];
const s_7_9_14_30 = [ 7, 9, 14, 30 ];
const s_4_7_11_26 = [ 4, 7, 11, 26 ];
const s_6_9_24 = [ 6, 9, 24 ];
const s_31_36_37_42 = [ 31, 36, 37, 42 ];
const s_9_20_1_0 = [ 9, 20, 1, 0 ];
const s_4_6_7_10_27 = [ 4, 6, 7, 10, 27 ];
const s_6_9_27_30_35_36_40_0 = [ 6, 9, 27, 30, 35, 36, 40, 0 ];
const s_31_39_42 = [ 31, 39, 42 ];
const s_4_16 = [ 4, 16 ];
const s_4_10_18_31_41_2 = [ 4, 10, 18, 31, 41, 2 ];
const s_4_14_24_26 = [ 4, 14, 24, 26 ];
const s_7_10_12 = [ 7, 10, 12 ];
const s_29_31_36 = [ 29, 31, 36 ];
const s_9_13_27_30_31_38 = [ 9, 13, 27, 30, 31, 38 ];
const s_4_9_11 = [ 4, 9, 11 ];
const s_9_12_14_42 = [ 9, 12, 14, 42 ];
const s_30_32_37 = [ 30, 32, 37 ];
const s_31_32_42 = [ 31, 32, 42 ];
const s_4_9_10_11_28 = [ 4, 9, 10, 11, 28 ];
const s_4_9_11_13 = [ 4, 9, 11, 13 ];
const s_4_10_15_24_26_32_35_36_42 = [ 4, 10, 15, 24, 26, 32, 35, 36, 42 ];
const s_27_30_35_0 = [ 27, 30, 35, 0 ];
const s_4_11_17_22 = [ 4, 11, 17, 22 ];
const s_4_7_10_26 = [ 4, 7, 10, 26 ];
const s_29_38 = [ 29, 38 ];
const s_32_39_40_41 = [ 32, 39, 40, 41 ];
const s_19_27 = [ 19, 27 ];
const s_4_9_10_11_19_22 = [ 4, 9, 10, 11, 19, 22 ];
const s_9_10_26_29_30_32_41 = [ 9, 10, 26, 29, 30, 32, 41 ];
const s_4_6_18 = [ 4, 6, 18 ];
const s_4_7_36_38_41 = [ 4, 7, 36, 38, 41 ];
const s_6_8_20_25_35 = [ 6, 8, 20, 25, 35 ];
const s_4_13_36 = [ 4, 13, 36 ];
const s_4_6_13 = [ 4, 6, 13 ];
const s_10_14_15 = [ 10, 14, 15 ];
const s_18_41_0 = [ 18, 41, 0 ];
const s_9_10_12_26 = [ 9, 10, 12, 26 ];
const s_30_35_41_42 = [ 30, 35, 41, 42 ];
const s_30_31_32_41 = [ 30, 31, 32, 41 ];
const s_40_0 = [ 40, 0 ];
const s_43 = [ 43 ];
const s_4_7_10_12_24_26_41_42 = [ 4, 7, 10, 12, 24, 26, 41, 42 ];
const s_4_7_25 = [ 4, 7, 25 ];
const s_32_33_42 = [ 32, 33, 42 ];
const s_31_36_37 = [ 31, 36, 37 ];
const s_4_9_12_26 = [ 4, 9, 12, 26 ];
const s_4_10_38 = [ 4, 10, 38 ];
const s_4_6_32 = [ 4, 6, 32 ];
const s_4_6_13_32_38 = [ 4, 6, 13, 32, 38 ];
const s_3_5_27 = [ 3, 5, 27 ];
const s_11_25 = [ 11, 25 ];
const s_14_27_30_0 = [ 14, 27, 30, 0 ];
const s_11_14_25 = [ 11, 14, 25 ];
const s_13_15_17 = [ 13, 15, 17 ];
const s_25_1 = [ 25, 1 ];
const s_9_10_31 = [ 9, 10, 31 ];
const s_35_41 = [ 35, 41 ];
const s_27_30_32_0 = [ 27, 30, 32, 0 ];
const s_6_7_10_11_24_26 = [ 6, 7, 10, 11, 24, 26 ];
const s_31_32_36 = [ 31, 32, 36 ];
const s_8_29_30_35_38 = [ 8, 29, 30, 35, 38 ];
const s_31_32_35_41_42 = [ 31, 32, 35, 41, 42 ];
const s_24_26 = [ 24, 26 ];
const s_4_6_9_18_24_25_26 = [ 4, 6, 9, 18, 24, 25, 26 ];
const s_4_6_9_24_25 = [ 4, 6, 9, 24, 25 ];
const s_1_2 = [ 1, 2 ];
const s_30_33_40 = [ 30, 33, 40 ];
const s_7_12_16 = [ 7, 12, 16 ];
const s_32_41_0 = [ 32, 41, 0 ];
const s_7_11_19 = [ 7, 11, 19 ];
const s_13_30_40_42 = [ 13, 30, 40, 42 ];
const s_31_32_39 = [ 31, 32, 39 ];
const s_4_7_9_10_21 = [ 4, 7, 9, 10, 21 ];
const s_6_37 = [ 6, 37 ];
const s_14_18_38_41_42 = [ 14, 18, 38, 41, 42 ];
const s_9_10_14 = [ 9, 10, 14 ];
const s_9_23_0 = [ 9, 23, 0 ];
const s_30_38_42 = [ 30, 38, 42 ];
const s_6_9_10_18_24_0 = [ 6, 9, 10, 18, 24, 0 ];
const s_4_6_7_10 = [ 4, 6, 7, 10 ];
const s_4_0_1 = [ 4, 0, 1 ];
const s_30_38_40 = [ 30, 38, 40 ];
const s_30_35_41 = [ 30, 35, 41 ];
const s_4_9_11_25 = [ 4, 9, 11, 25 ];
const s_9_31_35_36 = [ 9, 31, 35, 36 ];
const s_31_34_35 = [ 31, 34, 35 ];
const s_36_0 = [ 36, 0 ];
const s_4_6_10_11_18_26_32_35 = [ 4, 6, 10, 11, 18, 26, 32, 35 ];
const s_10_11_26 = [ 10, 11, 26 ];
const s_33_41_42 = [ 33, 41, 42 ];
const s_4_6_9 = [ 4, 6, 9 ];
const s_4_26_27 = [ 4, 26, 27 ];
const s_32_33_41 = [ 32, 33, 41 ];
const s_6_9_10_14_23_24_26_34_37_0 = [ 6, 9, 10, 14, 23, 24, 26, 34, 37, 0 ];
const s_30_32_38_41_42 = [ 30, 32, 38, 41, 42 ];
const s_7_10_26 = [ 7, 10, 26 ];
const s_7_9_10_36 = [ 7, 9, 10, 36 ];
const s_4_10_29_30_32_35_41 = [ 4, 10, 29, 30, 32, 35, 41 ];
const s_24_0 = [ 24, 0 ];
const s_4_7_9_24_31_42 = [ 4, 7, 9, 24, 31, 42 ];
const s_4_6_7_9_10_18_24_26_31_35_37_41 = [ 4, 6, 7, 9, 10, 18, 24, 26, 31, 35, 37, 41 ];
const s_6_7_26 = [ 6, 7, 26 ];
const s_4_9_10_11_22 = [ 4, 9, 10, 11, 22 ];
const s_18_30_32_33 = [ 18, 30, 32, 33 ];
const s_6_21_0 = [ 6, 21, 0 ];
const s_32_35_38_40 = [ 32, 35, 38, 40 ];
const s_32_35_0 = [ 32, 35, 0 ];
const s_4_8_25 = [ 4, 8, 25 ];
const s_4_14_38 = [ 4, 14, 38 ];
const s_29_32_35_38 = [ 29, 32, 35, 38 ];
const s_18_30_36_41 = [ 18, 30, 36, 41 ];
const s_4_14_0 = [ 4, 14, 0 ];
const s_9_30_41_0 = [ 9, 30, 41, 0 ];
const s_18_35_40 = [ 18, 35, 40 ];
const s_5_7_18_21_27_35 = [ 5, 7, 18, 21, 27, 35 ];
const s_6_10_36 = [ 6, 10, 36 ];
const s_5_7_13_27_0 = [ 5, 7, 13, 27, 0 ];
const s_15_18_23 = [ 15, 18, 23 ];
const s_6_9_10_14_15_17_35 = [ 6, 9, 10, 14, 15, 17, 35 ];
const s_7_13_20_26_30_34 = [ 7, 13, 20, 26, 30, 34 ];
const s_6_15_17_25_26_38_41 = [ 6, 15, 17, 25, 26, 38, 41 ];
const s_5_10_1 = [ 5, 10, 1 ];
const s_6_8_19_20 = [ 6, 8, 19, 20 ];
const s_8_14 = [ 8, 14 ];
const s_8_14_21 = [ 8, 14, 21 ];
const s_8_27 = [ 8, 27 ];
const s_29_30_32_38_41_42_0 = [ 29, 30, 32, 38, 41, 42, 0 ];
const s_4_7_10_23 = [ 4, 7, 10, 23 ];
const s_9_31_42_0 = [ 9, 31, 42, 0 ];
const s_7_10_24 = [ 7, 10, 24 ];
const s_30_35_40_41_0 = [ 30, 35, 40, 41, 0 ];
const s_13_24 = [ 13, 24 ];
const s_17_20 = [ 17, 20 ];
const s_7_21_42 = [ 7, 21, 42 ];
const s_6_29_40 = [ 6, 29, 40 ];
const s_6_20_27_37 = [ 6, 20, 27, 37 ];
const s_26_29 = [ 26, 29 ];
const s_4_18_23_31_32_42 = [ 4, 18, 23, 31, 32, 42 ];
const s_4_6_10_18_32_41_2_0 = [ 4, 6, 10, 18, 32, 41, 2, 0 ];
const s_6_21_25_41_42 = [ 6, 21, 25, 41, 42 ];
const s_9_26_41 = [ 9, 26, 41 ];
const s_6_36_0 = [ 6, 36, 0 ];
const s_4_31_38 = [ 4, 31, 38 ];
const s_4_33_41 = [ 4, 33, 41 ];
const s_10_36_42 = [ 10, 36, 42 ];
const s_6_42 = [ 6, 42 ];
const s_14_17_23_35_41 = [ 14, 17, 23, 35, 41 ];
const s_10_23 = [ 10, 23 ];
const s_4_6_13_14_15_17_33_38_2 = [ 4, 6, 13, 14, 15, 17, 33, 38, 2 ];
const s_4_6_14_18_41 = [ 4, 6, 14, 18, 41 ];
const s_10_32_41 = [ 10, 32, 41 ];
const s_4_6_17_21_29_32_33_35_38_39_40_41_42 = [ 4, 6, 17, 21, 29, 32, 33, 35, 38, 39, 40, 41, 42 ];
const s_7_10_21 = [ 7, 10, 21 ];
const s_4_6_17 = [ 4, 6, 17 ];
const s_6_14_0 = [ 6, 14, 0 ];
const s_5_18_37 = [ 5, 18, 37 ];
const s_6_27_35 = [ 6, 27, 35 ];
const s_18_27_41 = [ 18, 27, 41 ];
const s_4_5_13_15_18_32_33_38 = [ 4, 5, 13, 15, 18, 32, 33, 38 ];
const s_4_6_7_10_11_17_25_26_30_32_35_37_39_41_0 = [ 4, 6, 7, 10, 11, 17, 25, 26, 30, 32, 35, 37, 39, 41, 0 ];
const s_4_11_22_0 = [ 4, 11, 22, 0 ];
const s_6_11_30_32_39_0 = [ 6, 11, 30, 32, 39, 0 ];
const s_11_27 = [ 11, 27 ];
const s_6_15_28_33_35_38_41 = [ 6, 15, 28, 33, 35, 38, 41 ];
const s_4_6_9_14_36 = [ 4, 6, 9, 14, 36 ];
const s_6_26_29_30_35 = [ 6, 26, 29, 30, 35 ];
const s_5_6_17_18_29 = [ 5, 6, 17, 18, 29 ];
const s_6_18_35_38_0 = [ 6, 18, 35, 38, 0 ];
const s_10_27_29 = [ 10, 27, 29 ];
const s_4_23 = [ 4, 23 ];
const s_4_11_29_30_35_38_39_42 = [ 4, 11, 29, 30, 35, 38, 39, 42 ];
const s_32_34 = [ 32, 34 ];
const s_4_38_42 = [ 4, 38, 42 ];
const s_7_9_26_30_37 = [ 7, 9, 26, 30, 37 ];
const s_6_13_14_30_35 = [ 6, 13, 14, 30, 35 ];
const s_4_6_11_17 = [ 4, 6, 11, 17 ];
const s_4_9_10_21_31_40 = [ 4, 9, 10, 21, 31, 40 ];
const s_4_6_11_18_38 = [ 4, 6, 11, 18, 38 ];
const s_5_18_20 = [ 5, 18, 20 ];
const s_6_25_40 = [ 6, 25, 40 ];
const s_6_13_27_35 = [ 6, 13, 27, 35 ];
const s_25_0 = [ 25, 0 ];
const s_5_6_15_38_42 = [ 5, 6, 15, 38, 42 ];
const s_4_6_10_35_40_41 = [ 4, 6, 10, 35, 40, 41 ];
const s_18_26_29 = [ 18, 26, 29 ];
const s_4_5_33 = [ 4, 5, 33 ];
const s_8_18_25_35 = [ 8, 18, 25, 35 ];
const s_7_29_0 = [ 7, 29, 0 ];
const s_25_30_35 = [ 25, 30, 35 ];
const s_13_30_35_0 = [ 13, 30, 35, 0 ];
const s_7_30_35_38_2_0 = [ 7, 30, 35, 38, 2, 0 ];
const s_9_10_32 = [ 9, 10, 32 ];
const s_10_30_32 = [ 10, 30, 32 ];
const s_6_10_27_35_38 = [ 6, 10, 27, 35, 38 ];
const s_6_18_25_38 = [ 6, 18, 25, 38 ];
const s_5_6_14_20_35_36 = [ 5, 6, 14, 20, 35, 36 ];
const s_4_33_35 = [ 4, 33, 35 ];
const s_4_5_6_7_26_35_36_38_41_42_0 = [ 4, 5, 6, 7, 26, 35, 36, 38, 41, 42, 0 ];
const s_4_6_15_17 = [ 4, 6, 15, 17 ];
const s_6_10_18_22 = [ 6, 10, 18, 22 ];
const s_6_7_10_25 = [ 6, 7, 10, 25 ];
const s_4_35_38 = [ 4, 35, 38 ];
const s_5_10_11_17_18_32 = [ 5, 10, 11, 17, 18, 32 ];
const s_14_38_42 = [ 14, 38, 42 ];
const s_6_8_10_15_20_21_30_35_41_42 = [ 6, 8, 10, 15, 20, 21, 30, 35, 41, 42 ];
const s_4_38_39 = [ 4, 38, 39 ];
const s_13_18_23_30_35 = [ 13, 18, 23, 30, 35 ];
const s_30_38 = [ 30, 38 ];
const s_30_33_39 = [ 30, 33, 39 ];
const s_30_35_38 = [ 30, 35, 38 ];
const s_4_11_26_30_32_34_35 = [ 4, 11, 26, 30, 32, 34, 35 ];
const s_4_12_14_27_30_33_35_37_41 = [ 4, 12, 14, 27, 30, 33, 35, 37, 41 ];
const s_7_17_30 = [ 7, 17, 30 ];
const s_10_11_29_32_34 = [ 10, 11, 29, 32, 34 ];
const s_6_17_27 = [ 6, 17, 27 ];
const s_9_17_19 = [ 9, 17, 19 ];
const s_5_18_29 = [ 5, 18, 29 ];
const s_6_20_23_25_31_35 = [ 6, 20, 23, 25, 31, 35 ];
const s_5_18_32 = [ 5, 18, 32 ];
const s_6_9_10_32 = [ 6, 9, 10, 32 ];
const s_9_35_40 = [ 9, 35, 40 ];
const s_4_10_15_28 = [ 4, 10, 15, 28 ];
const s_30_36_41 = [ 30, 36, 41 ];
const s_4_9_14_26_30 = [ 4, 9, 14, 26, 30 ];
const s_7_9_0 = [ 7, 9, 0 ];
const s_6_13_20_23_25_29_30 = [ 6, 13, 20, 23, 25, 29, 30 ];
const s_4_6_30_35_41 = [ 4, 6, 30, 35, 41 ];
const s_6_29_30 = [ 6, 29, 30 ];
const s_8_18_25_30_33_35_38 = [ 8, 18, 25, 30, 33, 35, 38 ];
const s_10_25 = [ 10, 25 ];
const s_11_14_19_0 = [ 11, 14, 19, 0 ];
const s_13_29_30_39 = [ 13, 29, 30, 39 ];
const s_10_11_26_32 = [ 10, 11, 26, 32 ];
const s_6_17_40 = [ 6, 17, 40 ];
const s_10_32_38 = [ 10, 32, 38 ];
const s_4_6_7_10_25_30_38_42 = [ 4, 6, 7, 10, 25, 30, 38, 42 ];
const s_4_9_21_0 = [ 4, 9, 21, 0 ];
const s_4_6_9_10_13_21_26_29_30_32_35_36_38_39_41_42_0 = [ 4, 6, 9, 10, 13, 21, 26, 29, 30, 32, 35, 36, 38, 39, 41, 42, 0 ];
const s_4_10_17_20_0 = [ 4, 10, 17, 20, 0 ];
const s_6_11_14_28_30_38 = [ 6, 11, 14, 28, 30, 38 ];
const s_8_26 = [ 8, 26 ];
const s_4_23_35 = [ 4, 23, 35 ];
const s_31_32_38_41 = [ 31, 32, 38, 41 ];
const s_5_6_23_35 = [ 5, 6, 23, 35 ];
const s_4_11_21_30 = [ 4, 11, 21, 30 ];
const s_6_18_36_1_0 = [ 6, 18, 36, 1, 0 ];
const s_7_32_2_0 = [ 7, 32, 2, 0 ];
const s_14_2_0 = [ 14, 2, 0 ];
const s_26_30_39_0 = [ 26, 30, 39, 0 ];
const s_4_10_11_14_36_38 = [ 4, 10, 11, 14, 36, 38 ];
const s_12_17 = [ 12, 17 ];
const s_35_38 = [ 35, 38 ];
const s_4_15_26 = [ 4, 15, 26 ];
const s_10_13_1 = [ 10, 13, 1 ];
const s_7_10_0 = [ 7, 10, 0 ];
const s_9_15_26_28_0 = [ 9, 15, 26, 28, 0 ];
const s_7_9_15_26 = [ 7, 9, 15, 26 ];
const s_6_7_35 = [ 6, 7, 35 ];
const s_4_7_10_11_30_35_37_38_41 = [ 4, 7, 10, 11, 30, 35, 37, 38, 41 ];
const s_13_14_18_28_31_41 = [ 13, 14, 18, 28, 31, 41 ];
const s_10_15_31 = [ 10, 15, 31 ];
const s_6_7_27_35 = [ 6, 7, 27, 35 ];
const s_11_28_30_31_42 = [ 11, 28, 30, 31, 42 ];
const s_18_26_28 = [ 18, 26, 28 ];
const s_9_36_41 = [ 9, 36, 41 ];
const s_19_28 = [ 19, 28 ];
const s_9_12_39 = [ 9, 12, 39 ];
const s_7_31_39 = [ 7, 31, 39 ];
const s_14_28_0_2 = [ 14, 28, 0, 2 ];
const s_7_20 = [ 7, 20 ];
const s_14_39_0 = [ 14, 39, 0 ];
const s_4_10_11_14_23_27_31_32_40_41 = [ 4, 10, 11, 14, 23, 27, 31, 32, 40, 41 ];
const s_4_24 = [ 4, 24 ];
const s_18_2_0 = [ 18, 2, 0 ];
const s_4_11_18_19_26_28 = [ 4, 11, 18, 19, 26, 28 ];
const s_10_31_32 = [ 10, 31, 32 ];
const s_10_21 = [ 10, 21 ];
const s_10_21_26 = [ 10, 21, 26 ];
const s_19_22_26_30 = [ 19, 22, 26, 30 ];
const s_11_30 = [ 11, 30 ];
const s_6_14_35_36_42 = [ 6, 14, 35, 36, 42 ];
const s_24_0_1 = [ 24, 0, 1 ];
const s_14_17_22_24 = [ 14, 17, 22, 24 ];
const s_10_15_17_26 = [ 10, 15, 17, 26 ];
const s_17_22_26_30_32_38_40 = [ 17, 22, 26, 30, 32, 38, 40 ];
const s_9_19_22_26 = [ 9, 19, 22, 26 ];
const s_29_30_35 = [ 29, 30, 35 ];
const s_35_36_41_42 = [ 35, 36, 41, 42 ];
const s_6_18_41 = [ 6, 18, 41 ];
const s_4_7_11_22_30 = [ 4, 7, 11, 22, 30 ];
const s_7_22 = [ 7, 22 ];
const s_10_21_0 = [ 10, 21, 0 ];
const s_3_10 = [ 3, 10 ];
const s_17_28_0_2 = [ 17, 28, 0, 2 ];
const s_4_9_21_40 = [ 4, 9, 21, 40 ];
const s_11_12_33_41 = [ 11, 12, 33, 41 ];
const s_7_26_41 = [ 7, 26, 41 ];
const s_4_6_10_14_22 = [ 4, 6, 10, 14, 22 ];
const s_7_21_23_26 = [ 7, 21, 23, 26 ];
const s_17_30_35 = [ 17, 30, 35 ];
const s_30_32_35 = [ 30, 32, 35 ];
const s_33_37_38_41 = [ 33, 37, 38, 41 ];
const s_18_30 = [ 18, 30 ];
const s_18_29_0 = [ 18, 29, 0 ];
const s_11_22_26 = [ 11, 22, 26 ];
const s_7_9_10_23_26 = [ 7, 9, 10, 23, 26 ];
const s_4_18_26 = [ 4, 18, 26 ];
const s_4_28_30_42 = [ 4, 28, 30, 42 ];
const s_4_10_11_22 = [ 4, 10, 11, 22 ];
const s_7_9_10 = [ 7, 9, 10 ];
const s_7_9_13 = [ 7, 9, 13 ];
const s_9_12_34_37 = [ 9, 12, 34, 37 ];
const s_32_35_36_42_0 = [ 32, 35, 36, 42, 0 ];
const s_29_32_35_40_41 = [ 29, 32, 35, 40, 41 ];
const s_10_17_25 = [ 10, 17, 25 ];
const s_19_23_30_32_35 = [ 19, 23, 30, 32, 35 ];
const s_4_9_10_22_26_32_42 = [ 4, 9, 10, 22, 26, 32, 42 ];
const s_13_15_17_27 = [ 13, 15, 17, 27 ];
const s_15_21 = [ 15, 21 ];
const s_28_40 = [ 28, 40 ];
const s_10_39 = [ 10, 39 ];
const s_33_34_36 = [ 33, 34, 36 ];
const s_31_32_39_41 = [ 31, 32, 39, 41 ];
const s_31_37_41 = [ 31, 37, 41 ];
const s_6_14_15 = [ 6, 14, 15 ];
const s_18_21_23 = [ 18, 21, 23 ];
const s_7_19_25_35 = [ 7, 19, 25, 35 ];
const s_8_22 = [ 8, 22 ];
const s_9_14_15 = [ 9, 14, 15 ];
const s_33_35 = [ 33, 35 ];
const s_35_40 = [ 35, 40 ];
const s_4_6_10_17_19_21_22_35_40 = [ 4, 6, 10, 17, 19, 21, 22, 35, 40 ];
const s_30_35_37_38 = [ 30, 35, 37, 38 ];
const s_4_12_17_24_25_26_28 = [ 4, 12, 17, 24, 25, 26, 28 ];
const s_4_7_9_10_15_22 = [ 4, 7, 9, 10, 15, 22 ];
const s_9_10_27_0 = [ 9, 10, 27, 0 ];
const s_30_31_40_42 = [ 30, 31, 40, 42 ];
const s_30_38_41_42 = [ 30, 38, 41, 42 ];
const s_4_7_11_14_17_24 = [ 4, 7, 11, 14, 17, 24 ];
const s_31_32_35 = [ 31, 32, 35 ];
const s_7_15_31_38_41 = [ 7, 15, 31, 38, 41 ];
const s_4_6_9_31_36 = [ 4, 6, 9, 31, 36 ];
const s_31_32_41_0 = [ 31, 32, 41, 0 ];
const s_7_12_26_37 = [ 7, 12, 26, 37 ];
const s_30_31_0 = [ 30, 31, 0 ];
const s_11_12_26 = [ 11, 12, 26 ];
const s_4_7_10_38 = [ 4, 7, 10, 38 ];
const s_9_10_15 = [ 9, 10, 15 ];
const s_11_18_26 = [ 11, 18, 26 ];
const s_33_35_36 = [ 33, 35, 36 ];
const s_4_11_12_14_26 = [ 4, 11, 12, 14, 26 ];
const s_9_10_14_24_31_32 = [ 9, 10, 14, 24, 31, 32 ];
const s_9_14_27_0 = [ 9, 14, 27, 0 ];
const s_9_10_0 = [ 9, 10, 0 ];
const s_4_10_16 = [ 4, 10, 16 ];
const s_4_19_22 = [ 4, 19, 22 ];
const s_6_10_23_26 = [ 6, 10, 23, 26 ];
const s_4_11_12_26 = [ 4, 11, 12, 26 ];
const s_29_30_31_32_33_35_36_39_42 = [ 29, 30, 31, 32, 33, 35, 36, 39, 42 ];
const s_4_10_11_15_22_26 = [ 4, 10, 11, 15, 22, 26 ];
const s_18_38_42_0 = [ 18, 38, 42, 0 ];
const s_10_18_36_37 = [ 10, 18, 36, 37 ];
const s_21_36_40 = [ 21, 36, 40 ];
const s_34_35_37 = [ 34, 35, 37 ];
const s_10_14_25_0 = [ 10, 14, 25, 0 ];
const s_6_31_32 = [ 6, 31, 32 ];
const s_9_24_1 = [ 9, 24, 1 ];
const s_6_21_25_27 = [ 6, 21, 25, 27 ];
const s_7_11_14 = [ 7, 11, 14 ];
const s_9_10_31_32_41 = [ 9, 10, 31, 32, 41 ];
const s_6_30_33_35_37_39 = [ 6, 30, 33, 35, 37, 39 ];
const s_4_13_14_34 = [ 4, 13, 14, 34 ];
const s_13_1 = [ 13, 1 ];
const s_7_10_11_23_24 = [ 7, 10, 11, 23, 24 ];
const s_6_7_9_1 = [ 6, 7, 9, 1 ];
const s_4_9_22 = [ 4, 9, 22 ];
const s_32_35_38_0 = [ 32, 35, 38, 0 ];
const s_4_7_11_22 = [ 4, 7, 11, 22 ];
const s_4_7_10_15_31_35_38_39_41 = [ 4, 7, 10, 15, 31, 35, 38, 39, 41 ];
const s_10_30_31_34 = [ 10, 30, 31, 34 ];
const s_8_23 = [ 8, 23 ];
const s_4_27 = [ 4, 27 ];
const s_30_39_0 = [ 30, 39, 0 ];
const s_7_9_30_32 = [ 7, 9, 30, 32 ];
const s_8_25_27_29_30 = [ 8, 25, 27, 29, 30 ];
const s_4_11_31_39 = [ 4, 11, 31, 39 ];
const s_7_11_39 = [ 7, 11, 39 ];
const s_39_2 = [ 39, 2 ];
const s_4_6_7_11_13_18_25_30_34_35_36_38_39_40 = [ 4, 6, 7, 11, 13, 18, 25, 30, 34, 35, 36, 38, 39, 40 ];
const s_31_32_33_36_38_41_0_2 = [ 31, 32, 33, 36, 38, 41, 0, 2 ];
const s_4_9_10_15_24 = [ 4, 9, 10, 15, 24 ];
const s_10_26_27_0 = [ 10, 26, 27, 0 ];
const s_14_20 = [ 14, 20 ];
const s_7_41 = [ 7, 41 ];
const s_4_9_10_12 = [ 4, 9, 10, 12 ];
const s_7_9_30 = [ 7, 9, 30 ];
const s_4_17_40 = [ 4, 17, 40 ];
const s_4_11_19_22_27_29_30_32_33_35_41 = [ 4, 11, 19, 22, 27, 29, 30, 32, 33, 35, 41 ];
const s_4_7_9_41 = [ 4, 7, 9, 41 ];
const s_32_39 = [ 32, 39 ];
const s_6_10_38 = [ 6, 10, 38 ];
const s_12_37_0 = [ 12, 37, 0 ];
const s_4_7_10_26_42 = [ 4, 7, 10, 26, 42 ];
const s_4_21_32_40 = [ 4, 21, 32, 40 ];
const s_4_10_12 = [ 4, 10, 12 ];
const s_31_32_36_39_40 = [ 31, 32, 36, 39, 40 ];
const s_26_31_32 = [ 26, 31, 32 ];
const s_31_39_41_0 = [ 31, 39, 41, 0 ];
const s_6_11 = [ 6, 11 ];
const s_10_12_32_37 = [ 10, 12, 32, 37 ];
const s_29_35_42 = [ 29, 35, 42 ];
const s_26_31 = [ 26, 31 ];
const s_26_32_37_41 = [ 26, 32, 37, 41 ];
const s_12_37_39 = [ 12, 37, 39 ];
const s_4_6_13_18_23_30_34 = [ 4, 6, 13, 18, 23, 30, 34 ];
const s_7_26_40_41 = [ 7, 26, 40, 41 ];
const s_9_37 = [ 9, 37 ];
const s_30_40_41 = [ 30, 40, 41 ];
const s_35_41_0 = [ 35, 41, 0 ];
const s_6_25_36 = [ 6, 25, 36 ];
const s_9_12_37 = [ 9, 12, 37 ];
const s_30_32_41 = [ 30, 32, 41 ];
const s_26_30_37 = [ 26, 30, 37 ];
const s_4_7_10_35_38_41 = [ 4, 7, 10, 35, 38, 41 ];
const s_30_32_35_38 = [ 30, 32, 35, 38 ];
const s_4_11_22 = [ 4, 11, 22 ];
const s_4_6_10_39_41 = [ 4, 6, 10, 39, 41 ];
const s_30_31_35_40 = [ 30, 31, 35, 40 ];
const s_4_9_31_32 = [ 4, 9, 31, 32 ];
const s_7_9_10_31_41 = [ 7, 9, 10, 31, 41 ];
const s_32_36_39 = [ 32, 36, 39 ];
const s_4_10_32_41 = [ 4, 10, 32, 41 ];
const s_34_38_42 = [ 34, 38, 42 ];
const s_30_31_41 = [ 30, 31, 41 ];
const s_10_30_37_38 = [ 10, 30, 37, 38 ];
const s_6_26_0 = [ 6, 26, 0 ];
const s_7_12_15_28_38_42 = [ 7, 12, 15, 28, 38, 42 ];
const s_4_6_12_26_36 = [ 4, 6, 12, 26, 36 ];
const s_7_9_10_26 = [ 7, 9, 10, 26 ];
const s_4_11_19_25 = [ 4, 11, 19, 25 ];
const s_4_12_26_37_41 = [ 4, 12, 26, 37, 41 ];
const s_32_35_38_40_41_42 = [ 32, 35, 38, 40, 41, 42 ];
const s_6_14_18 = [ 6, 14, 18 ];
const s_15_41 = [ 15, 41 ];
const s_7_9_31 = [ 7, 9, 31 ];
const s_6_17_35_38_40 = [ 6, 17, 35, 38, 40 ];
const s_26_37 = [ 26, 37 ];
const s_38_42 = [ 38, 42 ];
const s_15_26_31_35_38_41_42 = [ 15, 26, 31, 35, 38, 41, 42 ];
const s_18_35_39_0 = [ 18, 35, 39, 0 ];
const s_7_9_13_18 = [ 7, 9, 13, 18 ];
const s_4_9_10_14 = [ 4, 9, 10, 14 ];
const s_5_6_20_35_38_40 = [ 5, 6, 20, 35, 38, 40 ];
const s_4_18_29_30 = [ 4, 18, 29, 30 ];
const s_6_10_21_31_32 = [ 6, 10, 21, 31, 32 ];
const s_20_38 = [ 20, 38 ];
const s_4_9_10_32_38 = [ 4, 9, 10, 32, 38 ];
const s_5_6_13_18_38 = [ 5, 6, 13, 18, 38 ];
const s_4_11_33_36 = [ 4, 11, 33, 36 ];
const s_6_8_20 = [ 6, 8, 20 ];
const s_10_21_23 = [ 10, 21, 23 ];
const s_9_14_15_26 = [ 9, 14, 15, 26 ];
const s_6_8_25 = [ 6, 8, 25 ];
const s_4_7_22 = [ 4, 7, 22 ];
const s_7_19_26 = [ 7, 19, 26 ];
const s_8_10_0 = [ 8, 10, 0 ];
const s_14_15_26 = [ 14, 15, 26 ];
const s_10_17_18_29 = [ 10, 17, 18, 29 ];
const s_23_39 = [ 23, 39 ];
const s_11_28 = [ 11, 28 ];
const s_6_10_13_18_29_30_34 = [ 6, 10, 13, 18, 29, 30, 34 ];
const s_6_23_26_29_30 = [ 6, 23, 26, 29, 30 ];
const s_6_10_14_25_30_32_35_42 = [ 6, 10, 14, 25, 30, 32, 35, 42 ];
const s_37_42 = [ 37, 42 ];
const s_4_9_18_30_35_36_38_40_0_2 = [ 4, 9, 18, 30, 35, 36, 38, 40, 0, 2 ];
const s_4_6_29 = [ 4, 6, 29 ];
const s_13_21 = [ 13, 21 ];
const s_13_25 = [ 13, 25 ];
const s_30_35_38_42_43 = [ 30, 35, 38, 42, 43 ];
const s_5_10_13_17_18 = [ 5, 10, 13, 17, 18 ];
const s_13_18_0 = [ 13, 18, 0 ];
const s_4_5_8_17_18_30_33_34_35_38_0_2 = [ 4, 5, 8, 17, 18, 30, 33, 34, 35, 38, 0, 2 ];
const s_7_31 = [ 7, 31 ];
const s_11_17_2_0 = [ 11, 17, 2, 0 ];
const s_6_0_2 = [ 6, 0, 2 ];
const s_15_0_2 = [ 15, 0, 2 ];
const s_9_30_35_42 = [ 9, 30, 35, 42 ];
const s_4_6_7_10_13_19_21_33_36 = [ 4, 6, 7, 10, 13, 19, 21, 33, 36 ];
const s_4_6_7_9_19_30_32_34_35_38_42 = [ 4, 6, 7, 9, 19, 30, 32, 34, 35, 38, 42 ];
const s_4_6_30_34_38 = [ 4, 6, 30, 34, 38 ];
const s_7_10_11 = [ 7, 10, 11 ];
const s_4_6_7_13_19_36 = [ 4, 6, 7, 13, 19, 36 ];
const s_4_6_11_17_18_29_30_31_32_33_34_35_36_37_38_40_41_42 = [ 4, 6, 11, 17, 18, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42 ];
const s_9_12_26_36_39 = [ 9, 12, 26, 36, 39 ];
const s_30_34_43 = [ 30, 34, 43 ];
const s_6_29_30_35_36_38_0 = [ 6, 29, 30, 35, 36, 38, 0 ];
const s_4_6_11_13 = [ 4, 6, 11, 13 ];
const s_4_8_11_29_35_38 = [ 4, 8, 11, 29, 35, 38 ];
const s_6_9_17_19_22_30_35_38_42 = [ 6, 9, 17, 19, 22, 30, 35, 38, 42 ];
const s_4_5_6_31_35 = [ 4, 5, 6, 31, 35 ];
const s_4_13_17_31_34 = [ 4, 13, 17, 31, 34 ];
const s_6_11_35_38 = [ 6, 11, 35, 38 ];
const s_11_2 = [ 11, 2 ];
const s_4_6_7_26_32_33_34_35_36_38_41_42 = [ 4, 6, 7, 26, 32, 33, 34, 35, 36, 38, 41, 42 ];
const s_8_10_29 = [ 8, 10, 29 ];
const s_6_10_18 = [ 6, 10, 18 ];
const s_19_35_43 = [ 19, 35, 43 ];
const s_5_6_10_18_32_39 = [ 5, 6, 10, 18, 32, 39 ];
const s_8_10_29_37 = [ 8, 10, 29, 37 ];
const s_4_6_7_11_15_17_23_25_29_30_31_32_33_34_35_38_40_41_42 = [ 4, 6, 7, 11, 15, 17, 23, 25, 29, 30, 31, 32, 33, 34, 35, 38, 40, 41, 42 ];
const s_30_35_38_42 = [ 30, 35, 38, 42 ];
const s_6_29_34 = [ 6, 29, 34 ];
const s_5_6_11_25_31_36_39 = [ 5, 6, 11, 25, 31, 36, 39 ];
const s_18_30_0 = [ 18, 30, 0 ];
const s_9_32_41 = [ 9, 32, 41 ];
const s_5_6_13_23_32_38 = [ 5, 6, 13, 23, 32, 38 ];
const s_7_21_0_2 = [ 7, 21, 0, 2 ];
const s_4_10_14_23 = [ 4, 10, 14, 23 ];
const s_6_18_36_0 = [ 6, 18, 36, 0 ];
const s_6_10_15_22_35_38_40 = [ 6, 10, 15, 22, 35, 38, 40 ];
const s_5_7_30_32_37_0 = [ 5, 7, 30, 32, 37, 0 ];
const s_27_29_30 = [ 27, 29, 30 ];
const s_4_34_35 = [ 4, 34, 35 ];
const s_10_14_23 = [ 10, 14, 23 ];
const s_6_30_36_42_0 = [ 6, 30, 36, 42, 0 ];
const s_7_28 = [ 7, 28 ];
const s_28_30 = [ 28, 30 ];
const s_4_6_19 = [ 4, 6, 19 ];
const s_3_18_41_42 = [ 3, 18, 41, 42 ];
const s_16_0_1 = [ 16, 0, 1 ];
const s_5_10_21_23_33_35 = [ 5, 10, 21, 23, 33, 35 ];
const s_8_9_20 = [ 8, 9, 20 ];
const s_7_10_31 = [ 7, 10, 31 ];
const s_6_9_15_17_27_35_39 = [ 6, 9, 15, 17, 27, 35, 39 ];
const s_4_7_26_29_30_37_38 = [ 4, 7, 26, 29, 30, 37, 38 ];
const s_15_24_0_2 = [ 15, 24, 0, 2 ];
const s_19_2_0 = [ 19, 2, 0 ];
const s_24_2_0 = [ 24, 2, 0 ];
const s_30_34_37 = [ 30, 34, 37 ];
const s_11_22_30_33_38 = [ 11, 22, 30, 33, 38 ];
const s_6_14_26 = [ 6, 14, 26 ];
const s_4_7_10_18_32_39_42 = [ 4, 7, 10, 18, 32, 39, 42 ];
const s_11_39_42 = [ 11, 39, 42 ];
const s_4_7_9_14 = [ 4, 7, 9, 14 ];
const s_11_18_38 = [ 11, 18, 38 ];
const s_6_7_15_25_35_38_40 = [ 6, 7, 15, 25, 35, 38, 40 ];
const s_7_9_10_19_26_36_41 = [ 7, 9, 10, 19, 26, 36, 41 ];
const s_19_22_26_28 = [ 19, 22, 26, 28 ];
const s_5_8_13_35 = [ 5, 8, 13, 35 ];
const s_4_11_30 = [ 4, 11, 30 ];
const s_6_14_23_0 = [ 6, 14, 23, 0 ];
const s_8_29_32 = [ 8, 29, 32 ];
const s_29_35_38 = [ 29, 35, 38 ];
const s_30_32_36_0 = [ 30, 32, 36, 0 ];
const s_18_20_0 = [ 18, 20, 0 ];
const s_14_31_41_0 = [ 14, 31, 41, 0 ];
const s_6_9_15_25_26_27 = [ 6, 9, 15, 25, 26, 27 ];
const s_4_6_7_11_17_24_26 = [ 4, 6, 7, 11, 17, 24, 26 ];
const s_14_23_0 = [ 14, 23, 0 ];
const s_7_18 = [ 7, 18 ];
const s_29_30_31_33_42 = [ 29, 30, 31, 33, 42 ];
const s_32_38_42 = [ 32, 38, 42 ];
const s_4_11_27 = [ 4, 11, 27 ];
const s_29_30_0 = [ 29, 30, 0 ];
const s_7_11_12_26 = [ 7, 11, 12, 26 ];
const s_30_32_36_42 = [ 30, 32, 36, 42 ];
const s_4_9_18 = [ 4, 9, 18 ];
const s_4_26_31_35_42 = [ 4, 26, 31, 35, 42 ];
const s_7_21_27 = [ 7, 21, 27 ];
const s_6_11_26 = [ 6, 11, 26 ];
const s_4_11_22_27 = [ 4, 11, 22, 27 ];
const s_29_32_43 = [ 29, 32, 43 ];
const s_5_13_18 = [ 5, 13, 18 ];
const s_13_14_15 = [ 13, 14, 15 ];
const s_26_34_41 = [ 26, 34, 41 ];
const s_7_25_26 = [ 7, 25, 26 ];
const s_6_29_30_35_38_0 = [ 6, 29, 30, 35, 38, 0 ];
const s_15_1_0 = [ 15, 1, 0 ];
const s_5_23 = [ 5, 23 ];
const s_33_42 = [ 33, 42 ];
const s_6_8_27_36 = [ 6, 8, 27, 36 ];
const s_20_24 = [ 20, 24 ];
const s_4_6_15 = [ 4, 6, 15 ];
const s_4_6_10_17 = [ 4, 6, 10, 17 ];
const s_4_10_11_33_38_40_42 = [ 4, 10, 11, 33, 38, 40, 42 ];
const s_6_17_22 = [ 6, 17, 22 ];
const s_6_9_21 = [ 6, 9, 21 ];
const s_4_6_9_10_11_15_18_26_28_30_36_42 = [ 4, 6, 9, 10, 11, 15, 18, 26, 28, 30, 36, 42 ];
const s_20_26_0 = [ 20, 26, 0 ];
const s_4_10_11_28 = [ 4, 10, 11, 28 ];
const s_7_14_19_26 = [ 7, 14, 19, 26 ];
const s_4_42 = [ 4, 42 ];
const s_30_31_32_35_40_41 = [ 30, 31, 32, 35, 40, 41 ];
const s_4_10_11_14 = [ 4, 10, 11, 14 ];
const s_9_10_11_18_1 = [ 9, 10, 11, 18, 1 ];
const s_35_36_37 = [ 35, 36, 37 ];
const s_34_37_39 = [ 34, 37, 39 ];
const s_37_43 = [ 37, 43 ];
const s_4_6_10_26 = [ 4, 6, 10, 26 ];
const s_33_40 = [ 33, 40 ];
const s_23_2_0 = [ 23, 2, 0 ];
const s_4_21_40_42 = [ 4, 21, 40, 42 ];
const s_30_32_33_35_36_38_41_42 = [ 30, 32, 33, 35, 36, 38, 41, 42 ];
const s_4_7_14 = [ 4, 7, 14 ];
const s_5_0_1 = [ 5, 0, 1 ];
const s_4_6_11_29_37 = [ 4, 6, 11, 29, 37 ];
const s_4_6_7_13 = [ 4, 6, 7, 13 ];
const s_4_6_10_21 = [ 4, 6, 10, 21 ];
const s_6_7_17_25 = [ 6, 7, 17, 25 ];
const s_4_12_37 = [ 4, 12, 37 ];
const s_4_14_15_28 = [ 4, 14, 15, 28 ];
const s_18_30_42_0 = [ 18, 30, 42, 0 ];
const s_30_33 = [ 30, 33 ];
const s_6_0_1 = [ 6, 0, 1 ];
const s_9_22_25_26 = [ 9, 22, 25, 26 ];
const s_36_38_0 = [ 36, 38, 0 ];
const s_9_18_0 = [ 9, 18, 0 ];
const s_12_18 = [ 12, 18 ];
const s_4_7_9_10_11 = [ 4, 7, 9, 10, 11 ];
const s_5_13_36 = [ 5, 13, 36 ];
const s_4_6_11_20_30_32_38_41_42 = [ 4, 6, 11, 20, 30, 32, 38, 41, 42 ];
const s_4_18_38 = [ 4, 18, 38 ];
const s_31_40_41 = [ 31, 40, 41 ];
const s_6_9_10_27 = [ 6, 9, 10, 27 ];
const s_17_0_1 = [ 17, 0, 1 ];
const s_31_35_36_41 = [ 31, 35, 36, 41 ];
const s_4_6_9_14_22 = [ 4, 6, 9, 14, 22 ];
const s_14_21 = [ 14, 21 ];
const s_9_12_26_31 = [ 9, 12, 26, 31 ];
const s_4_9_10_31 = [ 4, 9, 10, 31 ];
const s_6_2 = [ 6, 2 ];
const s_30_35_36_39 = [ 30, 35, 36, 39 ];
const s_9_16 = [ 9, 16 ];
const s_29_30_38 = [ 29, 30, 38 ];
const s_28_30_35_0_2 = [ 28, 30, 35, 0, 2 ];
const s_3_19_26 = [ 3, 19, 26 ];
const s_30_35_0 = [ 30, 35, 0 ];
const s_32_36_37 = [ 32, 36, 37 ];
const s_5_10_18 = [ 5, 10, 18 ];
const s_4_14_15_26 = [ 4, 14, 15, 26 ];
const s_4_9_10_11 = [ 4, 9, 10, 11 ];
const s_35_39 = [ 35, 39 ];
const s_4_7_26_0 = [ 4, 7, 26, 0 ];
const s_4_6_10_19_30_40_41 = [ 4, 6, 10, 19, 30, 40, 41 ];
const s_21_30_35_40 = [ 21, 30, 35, 40 ];
const s_30_37_39 = [ 30, 37, 39 ];
const s_29_37 = [ 29, 37 ];
const s_9_10_12 = [ 9, 10, 12 ];
const s_32_36_41 = [ 32, 36, 41 ];
const s_4_21_26 = [ 4, 21, 26 ];
const s_4_11_29_31_34_41 = [ 4, 11, 29, 31, 34, 41 ];
const s_34_40_41 = [ 34, 40, 41 ];
const s_17_19 = [ 17, 19 ];
const s_6_27_29_30_34_40 = [ 6, 27, 29, 30, 34, 40 ];
const s_4_10_38_39_42 = [ 4, 10, 38, 39, 42 ];
const s_4_18_41 = [ 4, 18, 41 ];
const s_4_6_11_30_33_38 = [ 4, 6, 11, 30, 33, 38 ];
const s_30_32_38 = [ 30, 32, 38 ];
const s_7_17 = [ 7, 17 ];
const s_4_10_24 = [ 4, 10, 24 ];
const s_29_31_32 = [ 29, 31, 32 ];
const s_29_33_41 = [ 29, 33, 41 ];
const s_11_21_30 = [ 11, 21, 30 ];
const s_9_11_30_31_37_39 = [ 9, 11, 30, 31, 37, 39 ];
const s_4_9_41 = [ 4, 9, 41 ];
const s_29_30_42 = [ 29, 30, 42 ];
const s_30_31_32_35 = [ 30, 31, 32, 35 ];
const s_4_34_41 = [ 4, 34, 41 ];
const s_10_31_32_35_39 = [ 10, 31, 32, 35, 39 ];
const s_4_6_7_9_10_23_26 = [ 4, 6, 7, 9, 10, 23, 26 ];
const s_4_6_10_32_35_39_2_0 = [ 4, 6, 10, 32, 35, 39, 2, 0 ];
const s_4_7_10_22 = [ 4, 7, 10, 22 ];
const s_29_30_34_35_38_40_42 = [ 29, 30, 34, 35, 38, 40, 42 ];
const s_4_6_7_9_10_28 = [ 4, 6, 7, 9, 10, 28 ];
const s_30_35_36 = [ 30, 35, 36 ];
const s_6_10_18_2_0 = [ 6, 10, 18, 2, 0 ];
const s_10_27_30_31_35_36_40 = [ 10, 27, 30, 31, 35, 36, 40 ];
const s_22_26_27 = [ 22, 26, 27 ];
const s_7_15_0 = [ 7, 15, 0 ];
const s_8_15_26 = [ 8, 15, 26 ];
const s_6_8_9_15_39 = [ 6, 8, 9, 15, 39 ];
const s_8_39 = [ 8, 39 ];
const s_18_39 = [ 18, 39 ];
const s_6_7_8_10_15_18_32_33_35_38_39_42 = [ 6, 7, 8, 10, 15, 18, 32, 33, 35, 38, 39, 42 ];
const s_9_25 = [ 9, 25 ];
const s_4_8_1 = [ 4, 8, 1 ];
const s_4_19_26 = [ 4, 19, 26 ];
const s_9_10_26 = [ 9, 10, 26 ];
const s_8_9_11_18_23_31_40 = [ 8, 9, 11, 18, 23, 31, 40 ];
const s_6_18_29_41 = [ 6, 18, 29, 41 ];
const s_6_18_35_36 = [ 6, 18, 35, 36 ];
const s_30_37_40_41 = [ 30, 37, 40, 41 ];
const s_4_26_0 = [ 4, 26, 0 ];
const s_4_11_18_26 = [ 4, 11, 18, 26 ];
const s_11_29_0 = [ 11, 29, 0 ];
const s_4_14_35_0_2 = [ 4, 14, 35, 0, 2 ];
const s_4_6_18_32_36_41_0 = [ 4, 6, 18, 32, 36, 41, 0 ];
const s_4_7_11_17_28_30_35_38_40_41_42_43 = [ 4, 7, 11, 17, 28, 30, 35, 38, 40, 41, 42, 43 ];
const s_4_32_38_42 = [ 4, 32, 38, 42 ];
const s_6_18_30_35_38 = [ 6, 18, 30, 35, 38 ];
const s_9_12_36_37_0 = [ 9, 12, 36, 37, 0 ];
const s_9_10_36 = [ 9, 10, 36 ];
const s_14_0_2 = [ 14, 0, 2 ];
const s_10_13_30 = [ 10, 13, 30 ];
const s_9_13_18_21_34_42 = [ 9, 13, 18, 21, 34, 42 ];
const s_6_36_40_41 = [ 6, 36, 40, 41 ];
const s_22_29 = [ 22, 29 ];
const s_4_6_7_9_36 = [ 4, 6, 7, 9, 36 ];
const s_4_34_0_2 = [ 4, 34, 0, 2 ];
const s_7_8_27_34_0 = [ 7, 8, 27, 34, 0 ];
const s_11_18_26_32 = [ 11, 18, 26, 32 ];
const s_4_18_24 = [ 4, 18, 24 ];
const s_23_30_31 = [ 23, 30, 31 ];
const s_4_12_26_29 = [ 4, 12, 26, 29 ];
const s_4_7_11_17_26_32 = [ 4, 7, 11, 17, 26, 32 ];
const s_3_14 = [ 3, 14 ];
const s_4_6_7_9_12_31_41 = [ 4, 6, 7, 9, 12, 31, 41 ];
const s_5_7_29_32_38 = [ 5, 7, 29, 32, 38 ];
const s_11_13_14_34 = [ 11, 13, 14, 34 ];
const s_4_5_29_33_35 = [ 4, 5, 29, 33, 35 ];
const s_6_32_41 = [ 6, 32, 41 ];
const s_6_8_9_10_42 = [ 6, 8, 9, 10, 42 ];
const s_13_30_34_38_41 = [ 13, 30, 34, 38, 41 ];
const s_5_6_17_18 = [ 5, 6, 17, 18 ];
const s_4_7_9_26_29_31_35_37_39_40_42 = [ 4, 7, 9, 26, 29, 31, 35, 37, 39, 40, 42 ];
const s_5_7_10 = [ 5, 7, 10 ];
const s_3_9_26 = [ 3, 9, 26 ];
const s_4_36 = [ 4, 36 ];
const s_4_6_27_35_38_0 = [ 4, 6, 27, 35, 38, 0 ];
const s_14_21_26 = [ 14, 21, 26 ];
const s_17_23 = [ 17, 23 ];
const s_6_18_32_33_35_40 = [ 6, 18, 32, 33, 35, 40 ];
const s_4_6_27 = [ 4, 6, 27 ];
const s_22_26_27_30_37 = [ 22, 26, 27, 30, 37 ];
const s_5_31_33_38 = [ 5, 31, 33, 38 ];
const s_7_26_28 = [ 7, 26, 28 ];
const s_4_35_40 = [ 4, 35, 40 ];
const s_4_6_12 = [ 4, 6, 12 ];
const s_26_40 = [ 26, 40 ];
const s_6_7_8_13_27 = [ 6, 7, 8, 13, 27 ];
const s_6_7_8_27 = [ 6, 7, 8, 27 ];
const s_6_30_35_36_40_41 = [ 6, 30, 35, 36, 40, 41 ];
const s_12_38 = [ 12, 38 ];
const s_4_6_9_14_15_17_19_26_31_32_33 = [ 4, 6, 9, 14, 15, 17, 19, 26, 31, 32, 33 ];
const s_10_23_24_0 = [ 10, 23, 24, 0 ];
const s_21_23_0 = [ 21, 23, 0 ];
const s_10_13_14_20 = [ 10, 13, 14, 20 ];
const s_4_7_10_33_41 = [ 4, 7, 10, 33, 41 ];
const s_4_6_7_8_9_10_18_21_23_25_31_36_42 = [ 4, 6, 7, 8, 9, 10, 18, 21, 23, 25, 31, 36, 42 ];
const s_6_8_20_27 = [ 6, 8, 20, 27 ];
const s_6_10_14_32_35_38 = [ 6, 10, 14, 32, 35, 38 ];
const s_6_13_35_36 = [ 6, 13, 35, 36 ];
const s_4_10_17 = [ 4, 10, 17 ];
const s_23_27_30_34_41_42 = [ 23, 27, 30, 34, 41, 42 ];
const s_6_10_23_27 = [ 6, 10, 23, 27 ];
const s_6_8_13_35_36 = [ 6, 8, 13, 35, 36 ];
const s_4_6_13_22_27 = [ 4, 6, 13, 22, 27 ];
const s_6_10_32_36 = [ 6, 10, 32, 36 ];
const s_10_26_27 = [ 10, 26, 27 ];
const s_5_6_23_38_40 = [ 5, 6, 23, 38, 40 ];
const s_4_10_28 = [ 4, 10, 28 ];
const s_4_9_40 = [ 4, 9, 40 ];
const s_4_9_30_31_32_36_38_39_40 = [ 4, 9, 30, 31, 32, 36, 38, 39, 40 ];
const s_21_41_0_2 = [ 21, 41, 0, 2 ];
const s_6_8_23_32_35 = [ 6, 8, 23, 32, 35 ];
const s_7_10_36 = [ 7, 10, 36 ];
const s_4_7_9_11_15_26_28_30_34_35_42 = [ 4, 7, 9, 11, 15, 26, 28, 30, 34, 35, 42 ];
const s_18_32_41 = [ 18, 32, 41 ];
const s_4_6_10_11_12_22_27_30_33_36_37_38_40_41 = [ 4, 6, 10, 11, 12, 22, 27, 30, 33, 36, 37, 38, 40, 41 ];
const s_17_18_19 = [ 17, 18, 19 ];
const s_17_27 = [ 17, 27 ];
const s_10_19 = [ 10, 19 ];
const s_14_30_2_0 = [ 14, 30, 2, 0 ];
const s_4_6_10_23_24_28_0_2 = [ 4, 6, 10, 23, 24, 28, 0, 2 ];
const s_5_13_15_18_33_35 = [ 5, 13, 15, 18, 33, 35 ];
const s_8_17_25_30 = [ 8, 17, 25, 30 ];
const s_4_7_26_30_34_40_42_0 = [ 4, 7, 26, 30, 34, 40, 42, 0 ];
const s_4_6_11_0 = [ 4, 6, 11, 0 ];
const s_4_26_29_30_32_33_35_36_41 = [ 4, 26, 29, 30, 32, 33, 35, 36, 41 ];
const s_30_39_41 = [ 30, 39, 41 ];
const s_4_6_7_18 = [ 4, 6, 7, 18 ];
const s_11_42 = [ 11, 42 ];
const s_5_6_10_20_30_32_36_38 = [ 5, 6, 10, 20, 30, 32, 36, 38 ];
const s_5_35_1 = [ 5, 35, 1 ];
const s_7_9_25 = [ 7, 9, 25 ];
const s_17_18_19_35 = [ 17, 18, 19, 35 ];
const s_22_32_43 = [ 22, 32, 43 ];
const s_5_13_14_25_42 = [ 5, 13, 14, 25, 42 ];
const s_6_8_11_26_32_37_38 = [ 6, 8, 11, 26, 32, 37, 38 ];
const s_4_6_10_19_22_25_26_30_43 = [ 4, 6, 10, 19, 22, 25, 26, 30, 43 ];
const s_6_7_9_10_11_28_30_32_35_38_39_0 = [ 6, 7, 9, 10, 11, 28, 30, 32, 35, 38, 39, 0 ];
const s_7_15_26 = [ 7, 15, 26 ];
const s_6_10_17_0_2 = [ 6, 10, 17, 0, 2 ];
const s_9_26_39 = [ 9, 26, 39 ];
const s_7_17_35 = [ 7, 17, 35 ];
const s_29_36_41 = [ 29, 36, 41 ];
const s_5_6_27_35_40 = [ 5, 6, 27, 35, 40 ];
const s_10_18_29 = [ 10, 18, 29 ];
const s_14_30_38_0 = [ 14, 30, 38, 0 ];
const s_10_14_1 = [ 10, 14, 1 ];
const s_8_20_40 = [ 8, 20, 40 ];
const s_4_35_38_39 = [ 4, 35, 38, 39 ];
const s_4_25_26 = [ 4, 25, 26 ];
const s_10_11_30_35_38_39_43 = [ 10, 11, 30, 35, 38, 39, 43 ];
const s_4_5_11_38_39_43 = [ 4, 5, 11, 38, 39, 43 ];
const s_4_6_9_14_19_36_38_41 = [ 4, 6, 9, 14, 19, 36, 38, 41 ];
const s_4_35_38_40 = [ 4, 35, 38, 40 ];
const s_15_17_27_0 = [ 15, 17, 27, 0 ];
const s_4_13_30_31_35_38_39_0 = [ 4, 13, 30, 31, 35, 38, 39, 0 ];
const s_4_18_32_41 = [ 4, 18, 32, 41 ];
const s_5_6_13_21_28_30_31_35_38_41 = [ 5, 6, 13, 21, 28, 30, 31, 35, 38, 41 ];
const s_4_19 = [ 4, 19 ];
const s_10_17_18_21_26 = [ 10, 17, 18, 21, 26 ];
const s_14_23_38 = [ 14, 23, 38 ];
const s_4_6_11_19_23_30_35_40 = [ 4, 6, 11, 19, 23, 30, 35, 40 ];
const s_6_7_10_14_17_35_37 = [ 6, 7, 10, 14, 17, 35, 37 ];
const s_4_11_18_22_38_41_2 = [ 4, 11, 18, 22, 38, 41, 2 ];
const s_5_13_38_41 = [ 5, 13, 38, 41 ];
const s_13_30_35 = [ 13, 30, 35 ];
const s_10_30_35_40 = [ 10, 30, 35, 40 ];
const s_4_11_14_22_26_28_29_30_35_38_42 = [ 4, 11, 14, 22, 26, 28, 29, 30, 35, 38, 42 ];
const s_4_17_22 = [ 4, 17, 22 ];
const s_4_6_27_29_35_41 = [ 4, 6, 27, 29, 35, 41 ];
const s_5_6_19 = [ 5, 6, 19 ];
const s_4_19_37_38 = [ 4, 19, 37, 38 ];
const s_4_11_12_14_26_28_29_30_35_39_2_0 = [ 4, 11, 12, 14, 26, 28, 29, 30, 35, 39, 2, 0 ];
const s_7_37 = [ 7, 37 ];
const s_4_11_26_29_38 = [ 4, 11, 26, 29, 38 ];
const s_4_7_11_19_26_27_28_30_38 = [ 4, 7, 11, 19, 26, 27, 28, 30, 38 ];
const s_4_5_6_30_35_38_39_0 = [ 4, 5, 6, 30, 35, 38, 39, 0 ];
const s_5_29 = [ 5, 29 ];
const s_17_27_30 = [ 17, 27, 30 ];
const s_7_9_15_19_26_30_31_39 = [ 7, 9, 15, 19, 26, 30, 31, 39 ];
const s_13_18_34 = [ 13, 18, 34 ];
const s_9_19_26_39 = [ 9, 19, 26, 39 ];
const s_6_9_35_41_42 = [ 6, 9, 35, 41, 42 ];
const s_4_6_8_14_22_25_30_35_41 = [ 4, 6, 8, 14, 22, 25, 30, 35, 41 ];
const s_4_22_0 = [ 4, 22, 0 ];
const s_30_32_35_36_1_0 = [ 30, 32, 35, 36, 1, 0 ];
const s_4_6_22 = [ 4, 6, 22 ];
const s_30_31_36_38_39_40_41_42 = [ 30, 31, 36, 38, 39, 40, 41, 42 ];
const s_3_9_13 = [ 3, 9, 13 ];
const s_18_32_34_41 = [ 18, 32, 34, 41 ];
const s_4_5_6_8_10_14_15_18_23_31_38_40 = [ 4, 5, 6, 8, 10, 14, 15, 18, 23, 31, 38, 40 ];
const s_10_18_23 = [ 10, 18, 23 ];
const s_6_24_26 = [ 6, 24, 26 ];
const s_4_11_23 = [ 4, 11, 23 ];
const s_4_13_34_40 = [ 4, 13, 34, 40 ];
const s_4_7_14_18_19_32_35_36_38_41 = [ 4, 7, 14, 18, 19, 32, 35, 36, 38, 41 ];
const s_4_17_18_38 = [ 4, 17, 18, 38 ];
const s_8_33 = [ 8, 33 ];
const s_11_12_0 = [ 11, 12, 0 ];
const s_6_9_30 = [ 6, 9, 30 ];
const s_10_18_24 = [ 10, 18, 24 ];
const s_31_36_41 = [ 31, 36, 41 ];
const s_14_17_35 = [ 14, 17, 35 ];
const s_4_21_40_0 = [ 4, 21, 40, 0 ];
const s_6_36_38 = [ 6, 36, 38 ];
const s_4_6_8_25_30_33_35 = [ 4, 6, 8, 25, 30, 33, 35 ];
const s_3_6_7_8_9_10_14_26_30_36_41_42 = [ 3, 6, 7, 8, 9, 10, 14, 26, 30, 36, 41, 42 ];
const s_6_11_0 = [ 6, 11, 0 ];
const s_7_10_30_31_36 = [ 7, 10, 30, 31, 36 ];
const s_4_6_14_17_22 = [ 4, 6, 14, 17, 22 ];
const s_9_10_13 = [ 9, 10, 13 ];
const s_4_10_27 = [ 4, 10, 27 ];
const s_6_33_35_38 = [ 6, 33, 35, 38 ];
const s_6_7_10_0_2 = [ 6, 7, 10, 0, 2 ];
const s_17_2 = [ 17, 2 ];
const s_19_21_26 = [ 19, 21, 26 ];
const s_4_18_38_0_2 = [ 4, 18, 38, 0, 2 ];
const s_5_25 = [ 5, 25 ];
const s_18_32_41_0 = [ 18, 32, 41, 0 ];
const s_4_30_33_35_0 = [ 4, 30, 33, 35, 0 ];
const s_21_31_36_41_0 = [ 21, 31, 36, 41, 0 ];
const s_4_6_9_14_24 = [ 4, 6, 9, 14, 24 ];
const s_18_26_38_41 = [ 18, 26, 38, 41 ];
const s_10_15 = [ 10, 15 ];
const s_6_23_0 = [ 6, 23, 0 ];
const s_25_2_0 = [ 25, 2, 0 ];
const s_10_23_24_2_0 = [ 10, 23, 24, 2, 0 ];
const s_5_13_33 = [ 5, 13, 33 ];
const s_5_10_18_27_30_31_41 = [ 5, 10, 18, 27, 30, 31, 41 ];
const s_6_23_27_31 = [ 6, 23, 27, 31 ];
const s_4_17_26_29_30_36 = [ 4, 17, 26, 29, 30, 36 ];
const s_6_10_17_30 = [ 6, 10, 17, 30 ];
const s_4_11_22_26 = [ 4, 11, 22, 26 ];
const s_4_6_8_9_10_28_31_32_35_36_41_42 = [ 4, 6, 8, 9, 10, 28, 31, 32, 35, 36, 41, 42 ];
const s_6_7_9 = [ 6, 7, 9 ];
const s_7_10_14_41 = [ 7, 10, 14, 41 ];
const s_13_18_32_35_0 = [ 13, 18, 32, 35, 0 ];
const s_26_29_35 = [ 26, 29, 35 ];
const s_18_37 = [ 18, 37 ];
const s_14_30_32_35_36_40_41_0_2 = [ 14, 30, 32, 35, 36, 40, 41, 0, 2 ];
const s_6_38_42 = [ 6, 38, 42 ];
const s_4_19_22_29_30_38_43 = [ 4, 19, 22, 29, 30, 38, 43 ];
const s_4_6_21_35_38 = [ 4, 6, 21, 35, 38 ];
const s_10_18_35_1 = [ 10, 18, 35, 1 ];
const s_23_24_28 = [ 23, 24, 28 ];
const s_38_41_0 = [ 38, 41, 0 ];
const s_6_7_26_30_35_36_37_39_40 = [ 6, 7, 26, 30, 35, 36, 37, 39, 40 ];
const s_6_8_14_15_19_25_35_36 = [ 6, 8, 14, 15, 19, 25, 35, 36 ];
const s_26_35 = [ 26, 35 ];
const s_5_6_18_35 = [ 5, 6, 18, 35 ];
const s_6_9_14_15_18_19_26_33_42_0 = [ 6, 9, 14, 15, 18, 19, 26, 33, 42, 0 ];
const s_6_7_24 = [ 6, 7, 24 ];
const s_18_19_22_27_30_35 = [ 18, 19, 22, 27, 30, 35 ];
const s_17_29_30 = [ 17, 29, 30 ];
const s_20_22 = [ 20, 22 ];
const s_6_11_20_36 = [ 6, 11, 20, 36 ];
const s_18_30_41_42 = [ 18, 30, 41, 42 ];
const s_4_2_0 = [ 4, 2, 0 ];
const s_26_31_34 = [ 26, 31, 34 ];
const s_13_32_41 = [ 13, 32, 41 ];
const s_27_37_40 = [ 27, 37, 40 ];
const s_15_20 = [ 15, 20 ];
const s_34_36_42 = [ 34, 36, 42 ];
const s_4_18_33 = [ 4, 18, 33 ];
const s_27_30_32 = [ 27, 30, 32 ];
const s_4_33_35_38_41 = [ 4, 33, 35, 38, 41 ];
const s_19_29_37_39_43 = [ 19, 29, 37, 39, 43 ];
const s_4_7_10_11_14_24_33_35_42 = [ 4, 7, 10, 11, 14, 24, 33, 35, 42 ];
const s_14_21_40 = [ 14, 21, 40 ];
const s_6_8_9 = [ 6, 8, 9 ];
const s_9_11_0 = [ 9, 11, 0 ];
const s_10_18_26_38 = [ 10, 18, 26, 38 ];
const s_6_25_35 = [ 6, 25, 35 ];
const s_28_32_41 = [ 28, 32, 41 ];
const s_41_2_0 = [ 41, 2, 0 ];
const s_7_12_18_26 = [ 7, 12, 18, 26 ];
const s_6_30_33 = [ 6, 30, 33 ];
const s_4_10_11_26_37_41 = [ 4, 10, 11, 26, 37, 41 ];
const s_6_10_28_0_1 = [ 6, 10, 28, 0, 1 ];
const s_8_9_18_20 = [ 8, 9, 18, 20 ];
const s_6_26_38 = [ 6, 26, 38 ];
const s_6_10_29_32_35_39 = [ 6, 10, 29, 32, 35, 39 ];
const s_14_32 = [ 14, 32 ];
const s_7_21_23_29_30_33_38_40 = [ 7, 21, 23, 29, 30, 33, 38, 40 ];
const s_7_8_12_20_26_37_39 = [ 7, 8, 12, 20, 26, 37, 39 ];
const s_29_35_37 = [ 29, 35, 37 ];
const s_4_21_33_41 = [ 4, 21, 33, 41 ];
const s_4_5_6_9_13_23_28_33_0 = [ 4, 5, 6, 9, 13, 23, 28, 33, 0 ];
const s_6_14_33 = [ 6, 14, 33 ];
const s_19_26_29 = [ 19, 26, 29 ];
const s_4_6_7_10_17_35 = [ 4, 6, 7, 10, 17, 35 ];
const s_4_10_39_42 = [ 4, 10, 39, 42 ];
const s_6_14_36_0 = [ 6, 14, 36, 0 ];
const s_11_27_29_32 = [ 11, 27, 29, 32 ];
const s_6_10_15_18_36 = [ 6, 10, 15, 18, 36 ];
const s_6_13_36_40 = [ 6, 13, 36, 40 ];
const s_6_14_18_33 = [ 6, 14, 18, 33 ];
const s_6_26_27_32_33 = [ 6, 26, 27, 32, 33 ];
const s_4_6_26_35 = [ 4, 6, 26, 35 ];
const s_6_21_30_35_40 = [ 6, 21, 30, 35, 40 ];
const s_4_6_30_32_35_41 = [ 4, 6, 30, 32, 35, 41 ];
const s_6_7_24_30_31_32_35 = [ 6, 7, 24, 30, 31, 32, 35 ];
const s_23_32_38 = [ 23, 32, 38 ];
const s_6_27_29_30 = [ 6, 27, 29, 30 ];
const s_6_13_27 = [ 6, 13, 27 ];
const s_6_13_18_27 = [ 6, 13, 18, 27 ];
const s_10_30_35_36 = [ 10, 30, 35, 36 ];
const s_9_18_32_0 = [ 9, 18, 32, 0 ];
const s_4_11_14_28 = [ 4, 11, 14, 28 ];
const s_6_13_1_0 = [ 6, 13, 1, 0 ];
const s_35_37_41_0 = [ 35, 37, 41, 0 ];
const s_5_8_9 = [ 5, 8, 9 ];
const s_9_26_28 = [ 9, 26, 28 ];
const s_4_29_30_31_32_33_35_36_37_38_39_40 = [ 4, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40 ];
const s_9_10_18_36_37_38 = [ 9, 10, 18, 36, 37, 38 ];
const s_5_14_17_18_0 = [ 5, 14, 17, 18, 0 ];
const s_4_9_21_40_41 = [ 4, 9, 21, 40, 41 ];
const s_14_36 = [ 14, 36 ];
const s_5_20_23 = [ 5, 20, 23 ];
const s_26_38 = [ 26, 38 ];
const s_4_6_13_35 = [ 4, 6, 13, 35 ];
const s_7_13_20_39_0 = [ 7, 13, 20, 39, 0 ];
const s_6_8_35 = [ 6, 8, 35 ];
const s_7_29_30_31_32_34_35_36_38_40_41 = [ 7, 29, 30, 31, 32, 34, 35, 36, 38, 40, 41 ];
const s_4_7_26_29_39_43 = [ 4, 7, 26, 29, 39, 43 ];
const s_6_23_27_30_35_39_40 = [ 6, 23, 27, 30, 35, 39, 40 ];
const s_7_13_30_35_39_40 = [ 7, 13, 30, 35, 39, 40 ];
const s_7_11_30_39 = [ 7, 11, 30, 39 ];
const s_7_11_0 = [ 7, 11, 0 ];
const s_9_11_39 = [ 9, 11, 39 ];
const s_4_9_10_39 = [ 4, 9, 10, 39 ];
const s_7_39 = [ 7, 39 ];
const s_12_32_39 = [ 12, 32, 39 ];
const s_6_17_25 = [ 6, 17, 25 ];
const s_7_26_32 = [ 7, 26, 32 ];
const s_7_10_32_36 = [ 7, 10, 32, 36 ];
const s_7_12_19_26_37_39_43 = [ 7, 12, 19, 26, 37, 39, 43 ];
const s_19_0 = [ 19, 0 ];
const s_7_34_40 = [ 7, 34, 40 ];
const s_25_32_35 = [ 25, 32, 35 ];
const s_6_10_32_35_37 = [ 6, 10, 32, 35, 37 ];
const s_4_6_9_15 = [ 4, 6, 9, 15 ];
const s_5_15_18 = [ 5, 15, 18 ];
const s_8_14_18 = [ 8, 14, 18 ];
const s_11_32_34 = [ 11, 32, 34 ];
const s_6_18_29 = [ 6, 18, 29 ];
const s_7_21_27_0 = [ 7, 21, 27, 0 ];
const s_4_6_18_41 = [ 4, 6, 18, 41 ];
const s_6_7_0_2 = [ 6, 7, 0, 2 ];
const s_7_12_21 = [ 7, 12, 21 ];
const s_5_13_18_35 = [ 5, 13, 18, 35 ];
const s_4_6_8_18_35 = [ 4, 6, 8, 18, 35 ];
const s_8_17_34 = [ 8, 17, 34 ];
const s_9_10_1_0 = [ 9, 10, 1, 0 ];
const s_4_6_7_35_40 = [ 4, 6, 7, 35, 40 ];
const s_6_14_29 = [ 6, 14, 29 ];
const s_4_6_31_35_38_40 = [ 4, 6, 31, 35, 38, 40 ];
const s_7_10_18_26_28_36_42 = [ 7, 10, 18, 26, 28, 36, 42 ];
const s_5_7_9_10_14_23_26_31_35 = [ 5, 7, 9, 10, 14, 23, 26, 31, 35 ];
const s_4_8_35 = [ 4, 8, 35 ];
const s_7_13_17_20_23_27_30_35 = [ 7, 13, 17, 20, 23, 27, 30, 35 ];
const s_4_7_10_18_21_32_40 = [ 4, 7, 10, 18, 21, 32, 40 ];
const s_6_13_20 = [ 6, 13, 20 ];
const s_10_20 = [ 10, 20 ];
const s_4_6_35_41 = [ 4, 6, 35, 41 ];
const s_4_7_9_31_35 = [ 4, 7, 9, 31, 35 ];
const s_6_13_18_20_32_33_34_35 = [ 6, 13, 18, 20, 32, 33, 34, 35 ];
const s_6_11_35_37_40 = [ 6, 11, 35, 37, 40 ];
const s_6_10_28_35_0 = [ 6, 10, 28, 35, 0 ];
const s_27_31_35_37 = [ 27, 31, 35, 37 ];
const s_9_11_19 = [ 9, 11, 19 ];
const s_7_12_19 = [ 7, 12, 19 ];
const s_11_13 = [ 11, 13 ];
const s_5_6_7_14_18_23_30_0 = [ 5, 6, 7, 14, 18, 23, 30, 0 ];
const s_4_26_34_35 = [ 4, 26, 34, 35 ];
const s_26_27_35 = [ 26, 27, 35 ];
const s_6_7_13_15_17_18_30_0_1 = [ 6, 7, 13, 15, 17, 18, 30, 0, 1 ];
const s_5_6_7_14_18_30_0 = [ 5, 6, 7, 14, 18, 30, 0 ];
const s_6_30_32 = [ 6, 30, 32 ];
const s_4_7_18_30_35_36_38_41 = [ 4, 7, 18, 30, 35, 36, 38, 41 ];
const s_6_8_13 = [ 6, 8, 13 ];
const s_11_17_19 = [ 11, 17, 19 ];
const s_4_6_7_18_19_35_37 = [ 4, 6, 7, 18, 19, 35, 37 ];
const s_7_27_35 = [ 7, 27, 35 ];
const s_6_32_37 = [ 6, 32, 37 ];
const s_6_8_36 = [ 6, 8, 36 ];
const s_18_29_41 = [ 18, 29, 41 ];
const s_4_8_25_35 = [ 4, 8, 25, 35 ];
const s_4_35_41 = [ 4, 35, 41 ];
const s_21_23_40_0 = [ 21, 23, 40, 0 ];
const s_6_9_15_16_17_24_27_31_32_35_38 = [ 6, 9, 15, 16, 17, 24, 27, 31, 32, 35, 38 ];
const s_6_9_10_15_17 = [ 6, 9, 10, 15, 17 ];
const s_3_9_27_31_33 = [ 3, 9, 27, 31, 33 ];
const s_3_4_9 = [ 3, 4, 9 ];
const s_5_13_32_33 = [ 5, 13, 32, 33 ];
const s_29_30_36_42 = [ 29, 30, 36, 42 ];
const s_11_14_17_22_26 = [ 11, 14, 17, 22, 26 ];
const s_5_13_35_40 = [ 5, 13, 35, 40 ];
const s_10_11_32_39 = [ 10, 11, 32, 39 ];
const s_5_11_18_32 = [ 5, 11, 18, 32 ];
const s_10_21_32 = [ 10, 21, 32 ];
const s_4_6_7_14_18_33_41 = [ 4, 6, 7, 14, 18, 33, 41 ];
const s_9_10_31_32 = [ 9, 10, 31, 32 ];
const s_9_32 = [ 9, 32 ];
const s_34_39 = [ 34, 39 ];
const s_6_9_10_18_35_38_39_41 = [ 6, 9, 10, 18, 35, 38, 39, 41 ];
const s_5_15_18_21 = [ 5, 15, 18, 21 ];
const s_5_18_32_41 = [ 5, 18, 32, 41 ];
const s_4_32_34 = [ 4, 32, 34 ];
const s_8_13_20_27_29_30_34_35 = [ 8, 13, 20, 27, 29, 30, 34, 35 ];
const s_11_32_34_39 = [ 11, 32, 34, 39 ];
const s_10_11_32_35_38 = [ 10, 11, 32, 35, 38 ];
const s_6_8_17_35 = [ 6, 8, 17, 35 ];
const s_6_18_26_34_35_38_43 = [ 6, 18, 26, 34, 35, 38, 43 ];
const s_6_18_30_32 = [ 6, 18, 30, 32 ];
const s_4_6_9_22_29 = [ 4, 6, 9, 22, 29 ];
const s_5_6_18_29_30_33_35_41 = [ 5, 6, 18, 29, 30, 33, 35, 41 ];
const s_6_24 = [ 6, 24 ];
const s_10_17_19_32_42_43 = [ 10, 17, 19, 32, 42, 43 ];
const s_5_6_8_20_23 = [ 5, 6, 8, 20, 23 ];
const s_18_35_41_0 = [ 18, 35, 41, 0 ];
const s_23_28_0_2 = [ 23, 28, 0, 2 ];
const s_7_19_25 = [ 7, 19, 25 ];
const s_4_11_26_30_38_41_0 = [ 4, 11, 26, 30, 38, 41, 0 ];
const s_5_6_30_41 = [ 5, 6, 30, 41 ];
const s_13_18_36 = [ 13, 18, 36 ];
const s_4_6_8_35_36 = [ 4, 6, 8, 35, 36 ];
const s_8_29_37 = [ 8, 29, 37 ];
const s_4_5_6_8_9_10_14_15_18_23_38_40 = [ 4, 5, 6, 8, 9, 10, 14, 15, 18, 23, 38, 40 ];
const s_7_9_26_29_33 = [ 7, 9, 26, 29, 33 ];
const s_6_32_35_37_41 = [ 6, 32, 35, 37, 41 ];
const s_4_7_9_30_35_36_38_39_41_42 = [ 4, 7, 9, 30, 35, 36, 38, 39, 41, 42 ];
const s_6_15_37_39_40_42 = [ 6, 15, 37, 39, 40, 42 ];
const s_7_11_26 = [ 7, 11, 26 ];
const s_5_13_38 = [ 5, 13, 38 ];
const s_4_11_26_29 = [ 4, 11, 26, 29 ];
const s_7_9_1_0 = [ 7, 9, 1, 0 ];
const s_6_30_34_35_41 = [ 6, 30, 34, 35, 41 ];
const s_6_32_36 = [ 6, 32, 36 ];
const s_4_19_20_30_35 = [ 4, 19, 20, 30, 35 ];
const s_4_11_37 = [ 4, 11, 37 ];
const s_30_36_38_41 = [ 30, 36, 38, 41 ];
const s_4_15_18 = [ 4, 15, 18 ];
const s_4_6_29_40 = [ 4, 6, 29, 40 ];
const s_6_7_22_29_35_36 = [ 6, 7, 22, 29, 35, 36 ];
const s_15_37_38 = [ 15, 37, 38 ];
const s_18_29_30_32_34_35_36_39_40_41_42 = [ 18, 29, 30, 32, 34, 35, 36, 39, 40, 41, 42 ];
const s_8_20_32 = [ 8, 20, 32 ];
const s_5_6_18_29_33_40 = [ 5, 6, 18, 29, 33, 40 ];
const s_6_19_26_32_41 = [ 6, 19, 26, 32, 41 ];
const s_9_19_41_43 = [ 9, 19, 41, 43 ];
const s_4_5_6_8_9_10_11_14_15_17_18_19_20_23_26_35_38_41_42 = [ 4, 5, 6, 8, 9, 10, 11, 14, 15, 17, 18, 19, 20, 23, 26, 35, 38, 41, 42 ];
const s_6_10_15 = [ 6, 10, 15 ];
const s_10_32_40 = [ 10, 32, 40 ];
const s_11_23 = [ 11, 23 ];
const s_6_14_23_30_35_40 = [ 6, 14, 23, 30, 35, 40 ];
const s_23_2 = [ 23, 2 ];
const s_31_39_41 = [ 31, 39, 41 ];
const s_4_9_10_15_26_0 = [ 4, 9, 10, 15, 26, 0 ];
const s_6_7_8_9_12_13_15_25 = [ 6, 7, 8, 9, 12, 13, 15, 25 ];
const s_7_11_28 = [ 7, 11, 28 ];
const s_12_20 = [ 12, 20 ];
const s_6_7_9_11_19_26_30_37_40 = [ 6, 7, 9, 11, 19, 26, 30, 37, 40 ];
const s_4_11_29_30_32_35_38 = [ 4, 11, 29, 30, 32, 35, 38 ];
const s_9_18_0_2 = [ 9, 18, 0, 2 ];
const s_6_10_21_30_32_35 = [ 6, 10, 21, 30, 32, 35 ];
const s_9_41 = [ 9, 41 ];
const s_6_8_13_18_30_35_36_38 = [ 6, 8, 13, 18, 30, 35, 36, 38 ];
const s_5_6_25 = [ 5, 6, 25 ];
const s_4_9_11_15 = [ 4, 9, 11, 15 ];
const s_4_7_18_29_30_34_41_42 = [ 4, 7, 18, 29, 30, 34, 41, 42 ];
const s_6_10_32_35 = [ 6, 10, 32, 35 ];
const s_8_15_25 = [ 8, 15, 25 ];
const s_15_18_2_0 = [ 15, 18, 2, 0 ];
const s_28_2 = [ 28, 2 ];
const s_9_13_18 = [ 9, 13, 18 ];
const s_35_1 = [ 35, 1 ];
const s_8_10_11 = [ 8, 10, 11 ];
const s_5_27_30_35_39 = [ 5, 27, 30, 35, 39 ];
const s_6_7_14_15_26_0_2 = [ 6, 7, 14, 15, 26, 0, 2 ];
const s_7_24_29_30 = [ 7, 24, 29, 30 ];
const s_4_7_38 = [ 4, 7, 38 ];
const s_6_17_18_36 = [ 6, 17, 18, 36 ];
const s_33_41_0 = [ 33, 41, 0 ];
const s_10_23_32 = [ 10, 23, 32 ];
const s_8_20_25_0 = [ 8, 20, 25, 0 ];
const s_4_18_40_41 = [ 4, 18, 40, 41 ];
const s_10_11_32_38 = [ 10, 11, 32, 38 ];
const s_9_10_28 = [ 9, 10, 28 ];
const s_4_6_11_32_33_35_38_39_40_41 = [ 4, 6, 11, 32, 33, 35, 38, 39, 40, 41 ];
const s_4_6_9_26_28_35_38 = [ 4, 6, 9, 26, 28, 35, 38 ];
const s_6_14_17_35_38_40 = [ 6, 14, 17, 35, 38, 40 ];
const s_4_6_35_38_41 = [ 4, 6, 35, 38, 41 ];
const s_4_5_6 = [ 4, 5, 6 ];
const s_5_13_29_40 = [ 5, 13, 29, 40 ];
const s_5_18_40 = [ 5, 18, 40 ];
const s_4_6_7_9_26_28_29_31_32_33_34_35_36_37_38_40_41_42 = [ 4, 6, 7, 9, 26, 28, 29, 31, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42 ];
const s_6_8_17_25_26_35 = [ 6, 8, 17, 25, 26, 35 ];
const s_10_17_32 = [ 10, 17, 32 ];
const s_17_25_35_0 = [ 17, 25, 35, 0 ];
const s_14_15_26_1_0 = [ 14, 15, 26, 1, 0 ];
const s_6_14_15_26_38_41_0_1_2 = [ 6, 14, 15, 26, 38, 41, 0, 1, 2 ];
const s_4_5_18_23_33 = [ 4, 5, 18, 23, 33 ];
const s_6_21_30 = [ 6, 21, 30 ];
const s_13_18_39_0 = [ 13, 18, 39, 0 ];
const s_6_17_30_35_36 = [ 6, 17, 30, 35, 36 ];
const s_11_29_32_39 = [ 11, 29, 32, 39 ];
const s_5_8_18 = [ 5, 8, 18 ];
const s_7_10_26_40_41 = [ 7, 10, 26, 40, 41 ];
const s_5_6_14_17_18_35 = [ 5, 6, 14, 17, 18, 35 ];
const s_6_18_25_42 = [ 6, 18, 25, 42 ];
const s_5_36_38 = [ 5, 36, 38 ];
const s_4_6_9_25_32_33_34_35_36_40 = [ 4, 6, 9, 25, 32, 33, 34, 35, 36, 40 ];
const s_7_10_32 = [ 7, 10, 32 ];
const s_5_6_8 = [ 5, 6, 8 ];
const s_4_11_20_38 = [ 4, 11, 20, 38 ];
const s_7_9_12_18_31_37 = [ 7, 9, 12, 18, 31, 37 ];
const s_4_5_6_18 = [ 4, 5, 6, 18 ];
const s_5_6_10_27_35 = [ 5, 6, 10, 27, 35 ];
const s_6_12 = [ 6, 12 ];
const s_5_6_14_34 = [ 5, 6, 14, 34 ];
const s_5_17_2 = [ 5, 17, 2 ];
const s_4_21_26_28 = [ 4, 21, 26, 28 ];
const s_5_6_13_14_18_34 = [ 5, 6, 13, 14, 18, 34 ];
const s_4_7_12_26 = [ 4, 7, 12, 26 ];
const s_4_38_2 = [ 4, 38, 2 ];
const s_5_18_38 = [ 5, 18, 38 ];
const s_4_6_14_15_41_42 = [ 4, 6, 14, 15, 41, 42 ];
const s_4_5_10 = [ 4, 5, 10 ];
const s_10_14_38 = [ 10, 14, 38 ];
const s_26_29_34 = [ 26, 29, 34 ];
const s_6_18_42 = [ 6, 18, 42 ];
const s_6_15_18_20_30 = [ 6, 15, 18, 20, 30 ];
const s_11_14_26_32_39_42 = [ 11, 14, 26, 32, 39, 42 ];
const s_5_7 = [ 5, 7 ];
const s_7_8_10_12_32 = [ 7, 8, 10, 12, 32 ];
const s_25_35_38 = [ 25, 35, 38 ];
const s_5_18_26 = [ 5, 18, 26 ];
const s_4_9_38 = [ 4, 9, 38 ];
const s_7_26_34_39 = [ 7, 26, 34, 39 ];
const s_4_9_14_18_33_35_38 = [ 4, 9, 14, 18, 33, 35, 38 ];
const s_4_6_9_38 = [ 4, 6, 9, 38 ];
const s_4_32_35_38 = [ 4, 32, 35, 38 ];
const s_4_7_26_30_38 = [ 4, 7, 26, 30, 38 ];
const s_4_11_12_26_29_30_37_39_0 = [ 4, 11, 12, 26, 29, 30, 37, 39, 0 ];
const s_7_30_39 = [ 7, 30, 39 ];
const s_4_32_38_40 = [ 4, 32, 38, 40 ];
const s_5_9_10_0 = [ 5, 9, 10, 0 ];
const s_5_9_17_18 = [ 5, 9, 17, 18 ];
const s_9_18_22 = [ 9, 18, 22 ];
const s_6_13_17_21_27_30_35 = [ 6, 13, 17, 21, 27, 30, 35 ];
const s_13_17 = [ 13, 17 ];
const s_4_13_22 = [ 4, 13, 22 ];
const s_9_18_1_0 = [ 9, 18, 1, 0 ];
const s_4_7_9_10_26 = [ 4, 7, 9, 10, 26 ];
const s_26_35_41_0 = [ 26, 35, 41, 0 ];
const s_6_9_18 = [ 6, 9, 18 ];
const s_26_0_2 = [ 26, 0, 2 ];
const s_6_7_10_26 = [ 6, 7, 10, 26 ];
const s_6_7_9_10_14_18_36_39 = [ 6, 7, 9, 10, 14, 18, 36, 39 ];
const s_42_0 = [ 42, 0 ];
const s_36_42 = [ 36, 42 ];
const s_4_6_9_10_0 = [ 4, 6, 9, 10, 0 ];
const s_30_33_35_40 = [ 30, 33, 35, 40 ];
const s_29_33 = [ 29, 33 ];
const s_4_11_19_30_35 = [ 4, 11, 19, 30, 35 ];
const s_38_40 = [ 38, 40 ];
const s_4_24_0_1 = [ 4, 24, 0, 1 ];
const s_6_31_35 = [ 6, 31, 35 ];
const s_6_30_41 = [ 6, 30, 41 ];
const s_6_7_9_10_18_32_40 = [ 6, 7, 9, 10, 18, 32, 40 ];
const s_11_22_27 = [ 11, 22, 27 ];
const s_4_30_31_35_36_37 = [ 4, 30, 31, 35, 36, 37 ];
const s_4_6_7_9_10_25 = [ 4, 6, 7, 9, 10, 25 ];
const s_6_9_10_25_35_41 = [ 6, 9, 10, 25, 35, 41 ];
const s_4_7_11_12_16 = [ 4, 7, 11, 12, 16 ];
const s_36_42_0 = [ 36, 42, 0 ];
const s_4_10_18_28 = [ 4, 10, 18, 28 ];
const s_6_18_1_0 = [ 6, 18, 1, 0 ];
const s_9_27_37_39 = [ 9, 27, 37, 39 ];
const s_16_21 = [ 16, 21 ];
const s_23_38 = [ 23, 38 ];
const s_19_24 = [ 19, 24 ];
const s_11_26_0_1 = [ 11, 26, 0, 1 ];
const s_32_35_36 = [ 32, 35, 36 ];
const s_4_7_9_12_25 = [ 4, 7, 9, 12, 25 ];
const s_6_17_31_37_38_39_42 = [ 6, 17, 31, 37, 38, 39, 42 ];
const s_30_31_41_42 = [ 30, 31, 41, 42 ];
const s_4_17_24_26 = [ 4, 17, 24, 26 ];
const s_7_24_26 = [ 7, 24, 26 ];
const s_30_35_41_42_0 = [ 30, 35, 41, 42, 0 ];
const s_4_7_11_22_23_30 = [ 4, 7, 11, 22, 23, 30 ];
const s_4_22_28 = [ 4, 22, 28 ];
const s_35_38_0 = [ 35, 38, 0 ];
const s_10_32_35_36 = [ 10, 32, 35, 36 ];
const s_4_10_22_25 = [ 4, 10, 22, 25 ];
const s_10_25_32 = [ 10, 25, 32 ];
const s_11_15_26 = [ 11, 15, 26 ];
const s_8_10_24_31_40_41 = [ 8, 10, 24, 31, 40, 41 ];
const s_24_1_0 = [ 24, 1, 0 ];
const s_7_20_27_0 = [ 7, 20, 27, 0 ];
const s_29_30_31 = [ 29, 30, 31 ];
const s_4_9_11_19 = [ 4, 9, 11, 19 ];
const s_18_22 = [ 18, 22 ];
const s_18_34_37 = [ 18, 34, 37 ];
const s_29_31_41 = [ 29, 31, 41 ];
const s_7_10_11_22_26 = [ 7, 10, 11, 22, 26 ];
const s_9_11_15 = [ 9, 11, 15 ];
const s_29_37_43 = [ 29, 37, 43 ];
const s_10_11_24 = [ 10, 11, 24 ];
const s_4_7_9_18_19_31_32_41 = [ 4, 7, 9, 18, 19, 31, 32, 41 ];
const s_7_9_10_14 = [ 7, 9, 10, 14 ];
const s_7_19_0 = [ 7, 19, 0 ];
const s_4_22_27 = [ 4, 22, 27 ];
const s_6_9_13 = [ 6, 9, 13 ];
const s_6_27_1 = [ 6, 27, 1 ];
const s_29_34 = [ 29, 34 ];
const s_30_37_41 = [ 30, 37, 41 ];
const s_14_18_30_32_36_41 = [ 14, 18, 30, 32, 36, 41 ];
const s_29_30_32_34_35 = [ 29, 30, 32, 34, 35 ];
const s_29_30_37 = [ 29, 30, 37 ];
const s_8_27_30_32 = [ 8, 27, 30, 32 ];
const s_29_30_32 = [ 29, 30, 32 ];
const s_6_9_10_35 = [ 6, 9, 10, 35 ];
const s_4_6_10_30_32_35 = [ 4, 6, 10, 30, 32, 35 ];
const s_31_38_39 = [ 31, 38, 39 ];
const s_29_31_32_36_37 = [ 29, 31, 32, 36, 37 ];
const s_4_6_11 = [ 4, 6, 11 ];
const s_9_11_32 = [ 9, 11, 32 ];
const s_4_6_9_14 = [ 4, 6, 9, 14 ];
const s_4_6_10_18_32_36_40 = [ 4, 6, 10, 18, 32, 36, 40 ];
const s_6_7_14 = [ 6, 7, 14 ];
const s_29_40 = [ 29, 40 ];
const s_9_35_39 = [ 9, 35, 39 ];
const s_4_6_30_40 = [ 4, 6, 30, 40 ];
const s_4_7_9_14_21_37_42 = [ 4, 7, 9, 14, 21, 37, 42 ];
const s_4_6_10_11 = [ 4, 6, 10, 11 ];
const s_14_15_0 = [ 14, 15, 0 ];
const s_30_35_40 = [ 30, 35, 40 ];
const s_4_6_30_35 = [ 4, 6, 30, 35 ];
const s_4_28_36 = [ 4, 28, 36 ];
const s_27_32_0 = [ 27, 32, 0 ];
const s_10_24_0_1 = [ 10, 24, 0, 1 ];
const s_19_30_32 = [ 19, 30, 32 ];
const s_4_6_9_14_25 = [ 4, 6, 9, 14, 25 ];
const s_7_9_10_28 = [ 7, 9, 10, 28 ];
const s_30_41_42 = [ 30, 41, 42 ];
const s_18_32_0 = [ 18, 32, 0 ];
const s_6_13_0 = [ 6, 13, 0 ];
const s_9_26_31_42 = [ 9, 26, 31, 42 ];
const s_30_31_32_35_36_38 = [ 30, 31, 32, 35, 36, 38 ];
const s_9_30 = [ 9, 30 ];
const s_7_22_26 = [ 7, 22, 26 ];
const s_18_30_35 = [ 18, 30, 35 ];
const s_32_38_39_41 = [ 32, 38, 39, 41 ];
const s_19_23 = [ 19, 23 ];
const s_33_35_38_42 = [ 33, 35, 38, 42 ];
const s_18_29_41_0 = [ 18, 29, 41, 0 ];
const s_4_6_9_10_21_41 = [ 4, 6, 9, 10, 21, 41 ];
const s_4_10_11_19_22_26 = [ 4, 10, 11, 19, 22, 26 ];
const s_4_5_7_21 = [ 4, 5, 7, 21 ];
const s_10_32_35_37_41 = [ 10, 32, 35, 37, 41 ];
const s_4_9_24_26 = [ 4, 9, 24, 26 ];
const s_10_13_18_1 = [ 10, 13, 18, 1 ];
const s_6_27_35_0 = [ 6, 27, 35, 0 ];
const s_4_9_11_19_26 = [ 4, 9, 11, 19, 26 ];
const s_23_0_1 = [ 23, 0, 1 ];
const s_4_12_22_26 = [ 4, 12, 22, 26 ];
const s_7_24_28 = [ 7, 24, 28 ];
const s_4_6_9_10_11_18_19_21_30_32_41 = [ 4, 6, 9, 10, 11, 18, 19, 21, 30, 32, 41 ];
const s_9_12_26_37_39 = [ 9, 12, 26, 37, 39 ];
const s_6_9_10_24_2 = [ 6, 9, 10, 24, 2 ];
const s_5_6_13_18_23_33_35 = [ 5, 6, 13, 18, 23, 33, 35 ];
const s_6_13_29_35 = [ 6, 13, 29, 35 ];
const s_5_38 = [ 5, 38 ];
const s_5_7_18_27_29_0 = [ 5, 7, 18, 27, 29, 0 ];
const s_4_6_17_35 = [ 4, 6, 17, 35 ];
const s_4_13_14_26_32_35_38 = [ 4, 13, 14, 26, 32, 35, 38 ];
const s_6_15_36 = [ 6, 15, 36 ];
const s_6_11_23_35_37_38_42 = [ 6, 11, 23, 35, 37, 38, 42 ];
const s_7_26_29_30 = [ 7, 26, 29, 30 ];
const s_10_13_15 = [ 10, 13, 15 ];
const s_6_8_32_34 = [ 6, 8, 32, 34 ];
const s_8_32 = [ 8, 32 ];
const s_10_35_36 = [ 10, 35, 36 ];
const s_4_13_18_28_29_35_38 = [ 4, 13, 18, 28, 29, 35, 38 ];
const s_5_6_15 = [ 5, 6, 15 ];
const s_4_10_29_32 = [ 4, 10, 29, 32 ];
const s_6_11_19_27_35_38_0 = [ 6, 11, 19, 27, 35, 38, 0 ];
const s_6_38_41 = [ 6, 38, 41 ];
const s_10_38_42 = [ 10, 38, 42 ];
const s_4_6_10_38 = [ 4, 6, 10, 38 ];
const s_10_11_39 = [ 10, 11, 39 ];
const s_10_18_31_32 = [ 10, 18, 31, 32 ];
const s_4_6_10_18_26_40_41 = [ 4, 6, 10, 18, 26, 40, 41 ];
const s_4_25_32_35_38_42 = [ 4, 25, 32, 35, 38, 42 ];
const s_4_6_35_38 = [ 4, 6, 35, 38 ];
const s_14_25_35_41_42 = [ 14, 25, 35, 41, 42 ];
const s_6_8_13_25_35_40_42_0 = [ 6, 8, 13, 25, 35, 40, 42, 0 ];
const s_4_7_10_29_32 = [ 4, 7, 10, 29, 32 ];
const s_6_11_32_2_0 = [ 6, 11, 32, 2, 0 ];
const s_4_11_37_38 = [ 4, 11, 37, 38 ];
const s_6_10_21 = [ 6, 10, 21 ];
const s_11_33 = [ 11, 33 ];
const s_10_11_12 = [ 10, 11, 12 ];
const s_18_31_32_41 = [ 18, 31, 32, 41 ];
const s_6_23_30_41 = [ 6, 23, 30, 41 ];
const s_7_8_1 = [ 7, 8, 1 ];
const s_8_13_19_26 = [ 8, 13, 19, 26 ];
const s_13_35 = [ 13, 35 ];
const s_9_13_26_35_36_42 = [ 9, 13, 26, 35, 36, 42 ];
const s_4_10_11_30_31_33_38_42 = [ 4, 10, 11, 30, 31, 33, 38, 42 ];
const s_4_6_25_26 = [ 4, 6, 25, 26 ];
const s_11_25_26 = [ 11, 25, 26 ];
const s_6_27_40 = [ 6, 27, 40 ];
const s_4_13_34_38 = [ 4, 13, 34, 38 ];
const s_4_7_14_18 = [ 4, 7, 14, 18 ];
const s_4_25_42 = [ 4, 25, 42 ];
const s_13_20_21 = [ 13, 20, 21 ];
const s_6_8_25_38 = [ 6, 8, 25, 38 ];
const s_10_37_0 = [ 10, 37, 0 ];
const s_6_21_30_31_32_34_35_40_41_42 = [ 6, 21, 30, 31, 32, 34, 35, 40, 41, 42 ];
const s_6_18_40 = [ 6, 18, 40 ];
const s_6_17_23 = [ 6, 17, 23 ];
const s_6_7_9_10_15_17_18_20_23_30_31_35_40_0 = [ 6, 7, 9, 10, 15, 17, 18, 20, 23, 30, 31, 35, 40, 0 ];
const s_9_10_30_32 = [ 9, 10, 30, 32 ];
const s_4_9_10_11_12_32_33_34_35_38 = [ 4, 9, 10, 11, 12, 32, 33, 34, 35, 38 ];
const s_5_18_27_32 = [ 5, 18, 27, 32 ];
const s_4_5_30_34_35_37_39_41_42 = [ 4, 5, 30, 34, 35, 37, 39, 41, 42 ];
const s_5_9_18_26 = [ 5, 9, 18, 26 ];
const s_4_11_21_0 = [ 4, 11, 21, 0 ];
const s_6_18_26 = [ 6, 18, 26 ];
const s_9_18_25_26_30_35 = [ 9, 18, 25, 26, 30, 35 ];
const s_4_23_28_29 = [ 4, 23, 28, 29 ];
const s_4_13_35 = [ 4, 13, 35 ];
const s_5_6_40 = [ 5, 6, 40 ];
const s_5_6_21_38_40 = [ 5, 6, 21, 38, 40 ];
const s_5_21 = [ 5, 21 ];
const s_5_13_18_20 = [ 5, 13, 18, 20 ];
const s_6_35_36 = [ 6, 35, 36 ];
const s_4_9_11_32_35_39 = [ 4, 9, 11, 32, 35, 39 ];
const s_5_6_7_14_25_27_28_35_36 = [ 5, 6, 7, 14, 25, 27, 28, 35, 36 ];
const s_9_31_35 = [ 9, 31, 35 ];
const s_8_35 = [ 8, 35 ];
const s_14_1 = [ 14, 1 ];
const s_10_27_31_32_35 = [ 10, 27, 31, 32, 35 ];
const s_4_14_26_29_41 = [ 4, 14, 26, 29, 41 ];
const s_6_30_35_36 = [ 6, 30, 35, 36 ];
const s_35_37_0 = [ 35, 37, 0 ];
const s_26_42 = [ 26, 42 ];
const s_6_27_36 = [ 6, 27, 36 ];
const s_27_34 = [ 27, 34 ];
const s_6_11_26_30 = [ 6, 11, 26, 30 ];
const s_4_6_28_35_38_41 = [ 4, 6, 28, 35, 38, 41 ];
const s_5_13_18_29 = [ 5, 13, 18, 29 ];
const s_6_18_29_0 = [ 6, 18, 29, 0 ];
const s_10_32_37 = [ 10, 32, 37 ];
const s_4_14_15_17_18_21_26_30_38_40 = [ 4, 14, 15, 17, 18, 21, 26, 30, 38, 40 ];
const s_8_10_11_15 = [ 8, 10, 11, 15 ];
const s_6_9_15_36 = [ 6, 9, 15, 36 ];
const s_4_6_8_26_30_34_35_39_42 = [ 4, 6, 8, 26, 30, 34, 35, 39, 42 ];
const s_4_28_29_30_38_40 = [ 4, 28, 29, 30, 38, 40 ];
const s_13_32_36 = [ 13, 32, 36 ];
const s_4_5_38 = [ 4, 5, 38 ];
const s_4_6_8_35_38 = [ 4, 6, 8, 35, 38 ];
const s_4_6_11_23_24_28_42_0_2 = [ 4, 6, 11, 23, 24, 28, 42, 0, 2 ];
const s_17_18_26_29_30_35 = [ 17, 18, 26, 29, 30, 35 ];
const s_10_35_36_40_0 = [ 10, 35, 36, 40, 0 ];
const s_5_6_9_15_35 = [ 5, 6, 9, 15, 35 ];
const s_22_30_38 = [ 22, 30, 38 ];
const s_4_6_7_9_10_15_18_23_25_27_32_36_38_41_42 = [ 4, 6, 7, 9, 10, 15, 18, 23, 25, 27, 32, 36, 38, 41, 42 ];
const s_4_9_14_26 = [ 4, 9, 14, 26 ];
const s_6_10_20_29_38_39 = [ 6, 10, 20, 29, 38, 39 ];
const s_8_10_20 = [ 8, 10, 20 ];
const s_14_23_30 = [ 14, 23, 30 ];
const s_10_11_17_22_26_30_32 = [ 10, 11, 17, 22, 26, 30, 32 ];
const s_7_31_35_38_42_0 = [ 7, 31, 35, 38, 42, 0 ];
const s_4_7_9_12_0 = [ 4, 7, 9, 12, 0 ];
const s_4_7_11_30_38 = [ 4, 7, 11, 30, 38 ];
const s_10_21_28_40_41 = [ 10, 21, 28, 40, 41 ];
const s_4_6_23_35 = [ 4, 6, 23, 35 ];
const s_9_0_2 = [ 9, 0, 2 ];
const s_4_10_28_30_31_38_40_41_42 = [ 4, 10, 28, 30, 31, 38, 40, 41, 42 ];
const s_9_27_38 = [ 9, 27, 38 ];
const s_9_27 = [ 9, 27 ];
const s_15_18_0 = [ 15, 18, 0 ];
const s_7_10_39 = [ 7, 10, 39 ];
const s_4_6_8_14_15_0_2 = [ 4, 6, 8, 14, 15, 0, 2 ];
const s_4_6_8_13_25 = [ 4, 6, 8, 13, 25 ];
const s_18_21 = [ 18, 21 ];
const s_30_32_41_0 = [ 30, 32, 41, 0 ];
const s_6_7_9_13_20 = [ 6, 7, 9, 13, 20 ];
const s_6_8_10_20 = [ 6, 8, 10, 20 ];
const s_4_14_30_32_40_41 = [ 4, 14, 30, 32, 40, 41 ];
const s_10_18_36_40 = [ 10, 18, 36, 40 ];
const s_15_27_38 = [ 15, 27, 38 ];
const s_6_7_9_26_30_32_33_35_36_0 = [ 6, 7, 9, 26, 30, 32, 33, 35, 36, 0 ];
const s_4_7_19_40 = [ 4, 7, 19, 40 ];
const s_4_11_19 = [ 4, 11, 19 ];
const s_4_21_33_40 = [ 4, 21, 33, 40 ];
const s_10_26_41 = [ 10, 26, 41 ];
const s_4_10_26_41 = [ 4, 10, 26, 41 ];
const s_4_17_31_34_35 = [ 4, 17, 31, 34, 35 ];
const s_10_15_18_32_35_38_42 = [ 10, 15, 18, 32, 35, 38, 42 ];
const s_8_21 = [ 8, 21 ];
const s_3_7_9_10_16_18_19_26_28 = [ 3, 7, 9, 10, 16, 18, 19, 26, 28 ];
const s_7_8 = [ 7, 8 ];
const s_6_9_25 = [ 6, 9, 25 ];
const s_4_6_11_19_29_30_32_35_38_40_42 = [ 4, 6, 11, 19, 29, 30, 32, 35, 38, 40, 42 ];
const s_6_7_9_10_15_16_18_19_26_30_34_38_40_43_0_2 = [ 6, 7, 9, 10, 15, 16, 18, 19, 26, 30, 34, 38, 40, 43, 0, 2 ];
const s_30_32_35_37 = [ 30, 32, 35, 37 ];
const s_6_27_38 = [ 6, 27, 38 ];
const s_9_31_37_0 = [ 9, 31, 37, 0 ];
const s_6_8_15_20 = [ 6, 8, 15, 20 ];
const s_6_29_35_0 = [ 6, 29, 35, 0 ];
const s_13_20_27_35_38 = [ 13, 20, 27, 35, 38 ];
const s_7_15_23_28_30_32 = [ 7, 15, 23, 28, 30, 32 ];
const s_4_7_9_23_28 = [ 4, 7, 9, 23, 28 ];
const s_4_38_0 = [ 4, 38, 0 ];
const s_4_6_9_10_14_15_19_21_23_25_30_35_42 = [ 4, 6, 9, 10, 14, 15, 19, 21, 23, 25, 30, 35, 42 ];
const s_7_14_21_23_24 = [ 7, 14, 21, 23, 24 ];
const s_8_9 = [ 8, 9 ];
const s_6_10_23_24_25_26_31_35_42 = [ 6, 10, 23, 24, 25, 26, 31, 35, 42 ];
const s_4_6_7_24 = [ 4, 6, 7, 24 ];
const s_5_6_8_10_20 = [ 5, 6, 8, 10, 20 ];
const s_6_29_36 = [ 6, 29, 36 ];
const s_7_10_32_38_41 = [ 7, 10, 32, 38, 41 ];
const s_6_14_27_29_35_42 = [ 6, 14, 27, 29, 35, 42 ];
const s_23_0_2 = [ 23, 0, 2 ];
const s_31_42_0_2 = [ 31, 42, 0, 2 ];
const s_8_13_18_0 = [ 8, 13, 18, 0 ];
const s_9_14_21_26_1_0 = [ 9, 14, 21, 26, 1, 0 ];
const s_6_9_19_23_30_35_40 = [ 6, 9, 19, 23, 30, 35, 40 ];
const s_4_6_23_24 = [ 4, 6, 23, 24 ];
const s_13_42 = [ 13, 42 ];
const s_10_21_40 = [ 10, 21, 40 ];
const s_6_14_41 = [ 6, 14, 41 ];
const s_30_40_42 = [ 30, 40, 42 ];
const s_3_4_6 = [ 3, 4, 6 ];
const s_4_6_8_30_35_36_37_38 = [ 4, 6, 8, 30, 35, 36, 37, 38 ];
const s_6_14_18_32_35_42 = [ 6, 14, 18, 32, 35, 42 ];
const s_6_7_31_35_40 = [ 6, 7, 31, 35, 40 ];
const s_6_10_27_32_35 = [ 6, 10, 27, 32, 35 ];
const s_37_0_2 = [ 37, 0, 2 ];
const s_4_2 = [ 4, 2 ];
const s_4_7_26_29_31_32_39_41_42 = [ 4, 7, 26, 29, 31, 32, 39, 41, 42 ];
const s_4_6_15_18 = [ 4, 6, 15, 18 ];
const s_4_6_9_10_14_22_25_35_36_38 = [ 4, 6, 9, 10, 14, 22, 25, 35, 36, 38 ];
const s_30_35_41_0_2 = [ 30, 35, 41, 0, 2 ];
const s_30_33_37_39_40 = [ 30, 33, 37, 39, 40 ];
const s_4_7_11_21_22 = [ 4, 7, 11, 21, 22 ];
const s_6_14_15_18_23_26_40_41 = [ 6, 14, 15, 18, 23, 26, 40, 41 ];
const s_6_35_42 = [ 6, 35, 42 ];
const s_4_9_12_18_23_35_37 = [ 4, 9, 12, 18, 23, 35, 37 ];
const s_6_7_18_26_32_0_2 = [ 6, 7, 18, 26, 32, 0, 2 ];
const s_6_29_30_35_38 = [ 6, 29, 30, 35, 38 ];
const s_26_28_30_37 = [ 26, 28, 30, 37 ];
const s_6_27_35_38 = [ 6, 27, 35, 38 ];
const s_14_17_18_26_31_35 = [ 14, 17, 18, 26, 31, 35 ];
const s_4_11_33_38_42 = [ 4, 11, 33, 38, 42 ];
const s_6_7_9_32 = [ 6, 7, 9, 32 ];
const s_4_12_34 = [ 4, 12, 34 ];
const s_10_36_0_1 = [ 10, 36, 0, 1 ];
const s_10_13_18_27 = [ 10, 13, 18, 27 ];
const s_8_19 = [ 8, 19 ];
const s_7_9_12_26 = [ 7, 9, 12, 26 ];
const s_7_22_23 = [ 7, 22, 23 ];
const s_4_6_10_24 = [ 4, 6, 10, 24 ];
const s_18_28_0 = [ 18, 28, 0 ];
const s_6_10_14_32_35 = [ 6, 10, 14, 32, 35 ];
const s_6_17_0 = [ 6, 17, 0 ];
const s_31_32_34_40_42 = [ 31, 32, 34, 40, 42 ];
const s_9_18_31_0 = [ 9, 18, 31, 0 ];
const s_7_23_28 = [ 7, 23, 28 ];
const s_4_9_29_30_31_32_35_36_38_39_40_41_42 = [ 4, 9, 29, 30, 31, 32, 35, 36, 38, 39, 40, 41, 42 ];
const s_6_7_11 = [ 6, 7, 11 ];
const s_6_15_20 = [ 6, 15, 20 ];
const s_5_15_18_0 = [ 5, 15, 18, 0 ];
const s_13_44 = [ 13, 44 ];
const s_5_10_18_1 = [ 5, 10, 18, 1 ];
const s_5_6_15_18_33_41 = [ 5, 6, 15, 18, 33, 41 ];
const s_10_13_18_20 = [ 10, 13, 18, 20 ];
const s_4_10_15_32_41 = [ 4, 10, 15, 32, 41 ];
const s_4_9_33_38_41 = [ 4, 9, 33, 38, 41 ];
const s_10_30_32_0 = [ 10, 30, 32, 0 ];
const s_6_14_27_30_0 = [ 6, 14, 27, 30, 0 ];
const s_29_35_37_40_41 = [ 29, 35, 37, 40, 41 ];
const s_33_38_41 = [ 33, 38, 41 ];
const s_6_8_10_17_18_35_38 = [ 6, 8, 10, 17, 18, 35, 38 ];
const s_4_10_0_1 = [ 4, 10, 0, 1 ];
const s_6_24_30_31_36_42 = [ 6, 24, 30, 31, 36, 42 ];
const s_7_28_29_30 = [ 7, 28, 29, 30 ];
const s_4_10_14_15_28_35_38_41 = [ 4, 10, 14, 15, 28, 35, 38, 41 ];
const s_7_10_21_25 = [ 7, 10, 21, 25 ];
const s_4_7_9_10_18_23_30_31_32_35_39_41 = [ 4, 7, 9, 10, 18, 23, 30, 31, 32, 35, 39, 41 ];
const s_4_6_14_30_40 = [ 4, 6, 14, 30, 40 ];
const s_6_7_18_30_40_0 = [ 6, 7, 18, 30, 40, 0 ];
const s_8_9_13_20 = [ 8, 9, 13, 20 ];
const s_18_30_35_38 = [ 18, 30, 35, 38 ];
const s_18_29_35 = [ 18, 29, 35 ];
const s_13_27_30_32_35 = [ 13, 27, 30, 32, 35 ];
const s_4_6_14_35_39 = [ 4, 6, 14, 35, 39 ];
const s_4_6_14_32_39 = [ 4, 6, 14, 32, 39 ];
const s_4_7_10_14_17_23_38_0 = [ 4, 7, 10, 14, 17, 23, 38, 0 ];
const s_4_30 = [ 4, 30 ];
const s_4_29_35 = [ 4, 29, 35 ];
const s_6_18_31_33_41_0 = [ 6, 18, 31, 33, 41, 0 ];
const s_34_35 = [ 34, 35 ];
const s_6_7_10_17_30_35_0 = [ 6, 7, 10, 17, 30, 35, 0 ];
const s_6_9_11_14_18_23_30_33_35_40_42 = [ 6, 9, 11, 14, 18, 23, 30, 33, 35, 40, 42 ];
const s_4_6_13_18_20_23_33_35 = [ 4, 6, 13, 18, 20, 23, 33, 35 ];
const s_6_10_18_27_0 = [ 6, 10, 18, 27, 0 ];
const s_6_8_14_17_27 = [ 6, 8, 14, 17, 27 ];
const s_7_27_30_0 = [ 7, 27, 30, 0 ];
const s_3_7_9_10_42 = [ 3, 7, 9, 10, 42 ];
const s_29_30_32_0 = [ 29, 30, 32, 0 ];
const s_7_15_23_0 = [ 7, 15, 23, 0 ];
const s_20_28 = [ 20, 28 ];
const s_13_28 = [ 13, 28 ];
const s_9_31_32_42_0 = [ 9, 31, 32, 42, 0 ];
const s_4_17_38 = [ 4, 17, 38 ];
const s_3_4_6_10_30_31_42 = [ 3, 4, 6, 10, 30, 31, 42 ];
const s_9_13_20 = [ 9, 13, 20 ];
const s_4_6_9_17_22 = [ 4, 6, 9, 17, 22 ];
const s_10_13_21 = [ 10, 13, 21 ];
const s_32_42_0 = [ 32, 42, 0 ];
const s_4_6_9_29 = [ 4, 6, 9, 29 ];
const s_4_10_15_18_26_27_0 = [ 4, 10, 15, 18, 26, 27, 0 ];
const s_11_33_34_35_38_39_41_42_0 = [ 11, 33, 34, 35, 38, 39, 41, 42, 0 ];
const s_4_11_14_15 = [ 4, 11, 14, 15 ];
const s_8_12_26_0 = [ 8, 12, 26, 0 ];
const s_4_30_32 = [ 4, 30, 32 ];
const s_30_2_0 = [ 30, 2, 0 ];
const s_22_30 = [ 22, 30 ];
const s_8_14_18_24 = [ 8, 14, 18, 24 ];
const s_10_26_29_32_42 = [ 10, 26, 29, 32, 42 ];
const s_4_6_30 = [ 4, 6, 30 ];
const s_5_9_27 = [ 5, 9, 27 ];
const s_7_17_18_27 = [ 7, 17, 18, 27 ];
const s_15_26_1_0 = [ 15, 26, 1, 0 ];
const s_7_42 = [ 7, 42 ];
const s_4_6_9_11_23_30_35_41 = [ 4, 6, 9, 11, 23, 30, 35, 41 ];
const s_6_13_23_26_30_34 = [ 6, 13, 23, 26, 30, 34 ];
const s_27_35_0 = [ 27, 35, 0 ];
const s_6_7_10_23_30_35 = [ 6, 7, 10, 23, 30, 35 ];
const s_7_10_23 = [ 7, 10, 23 ];
const s_23_24_1_0 = [ 23, 24, 1, 0 ];
const s_5_11_32 = [ 5, 11, 32 ];
const s_4_15_17 = [ 4, 15, 17 ];
const s_6_19_30 = [ 6, 19, 30 ];
const s_8_9_15_28_35_0 = [ 8, 9, 15, 28, 35, 0 ];
const s_10_15_0 = [ 10, 15, 0 ];
const s_4_15_2_0 = [ 4, 15, 2, 0 ];
const s_4_11_14 = [ 4, 11, 14 ];
const s_20_22_30 = [ 20, 22, 30 ];
const s_7_21_24 = [ 7, 21, 24 ];
const s_14_0_1 = [ 14, 0, 1 ];
const s_8_13_17_30_34 = [ 8, 13, 17, 30, 34 ];
const s_4_6_18_30_35_38 = [ 4, 6, 18, 30, 35, 38 ];
const s_23_28_1 = [ 23, 28, 1 ];
const s_4_18_36 = [ 4, 18, 36 ];
const s_18_36_0 = [ 18, 36, 0 ];
const s_10_18_28 = [ 10, 18, 28 ];
const s_13_32_35_38 = [ 13, 32, 35, 38 ];
const s_9_18_31_32_41 = [ 9, 18, 31, 32, 41 ];
const s_6_33_34 = [ 6, 33, 34 ];
const s_35_41_42 = [ 35, 41, 42 ];
const s_15_23_0 = [ 15, 23, 0 ];
const s_18_31_0 = [ 18, 31, 0 ];
const s_7_14_28 = [ 7, 14, 28 ];
const s_6_13_20_23_36_0 = [ 6, 13, 20, 23, 36, 0 ];
const s_7_10_23_28_0 = [ 7, 10, 23, 28, 0 ];
const s_17_26_27_35_38_42 = [ 17, 26, 27, 35, 38, 42 ];
const s_6_9_32_43 = [ 6, 9, 32, 43 ];
const s_9_35 = [ 9, 35 ];
const s_4_33_36 = [ 4, 33, 36 ];
const s_10_11_18_31_32_35_37_38_39_42 = [ 10, 11, 18, 31, 32, 35, 37, 38, 39, 42 ];
const s_19_30_35_39 = [ 19, 30, 35, 39 ];
const s_4_30_34 = [ 4, 30, 34 ];
const s_4_11_13_30_35_41 = [ 4, 11, 13, 30, 35, 41 ];
const s_6_13_14 = [ 6, 13, 14 ];
const s_4_11_13_14_27 = [ 4, 11, 13, 14, 27 ];
const s_19_43 = [ 19, 43 ];
const s_14_38 = [ 14, 38 ];
const s_6_15_17_0 = [ 6, 15, 17, 0 ];
const s_7_13_27 = [ 7, 13, 27 ];
const s_4_32_0 = [ 4, 32, 0 ];
const s_4_6_9_18_36_39_0 = [ 4, 6, 9, 18, 36, 39, 0 ];
const s_18_30_32_41_0 = [ 18, 30, 32, 41, 0 ];
const s_4_6_11_24 = [ 4, 6, 11, 24 ];
const s_8_10_18 = [ 8, 10, 18 ];
const s_30_32_36 = [ 30, 32, 36 ];
const s_18_25 = [ 18, 25 ];
const s_8_0_1 = [ 8, 0, 1 ];
const s_6_7_13_20_22_25_27_30_31_35_36 = [ 6, 7, 13, 20, 22, 25, 27, 30, 31, 35, 36 ];
const s_5_6_7_13_18_23 = [ 5, 6, 7, 13, 18, 23 ];
const s_7_9_19_28 = [ 7, 9, 19, 28 ];
const s_5_23_27 = [ 5, 23, 27 ];
const s_5_6_18_39 = [ 5, 6, 18, 39 ];
const s_5_18_35 = [ 5, 18, 35 ];
const s_12_24_26 = [ 12, 24, 26 ];
const s_17_18_19_28_39_41 = [ 17, 18, 19, 28, 39, 41 ];
const s_19_41 = [ 19, 41 ];
const s_13_19_30 = [ 13, 19, 30 ];
const s_17_18_35 = [ 17, 18, 35 ];
const s_4_15_21 = [ 4, 15, 21 ];
const s_18_37_38 = [ 18, 37, 38 ];
const s_7_16 = [ 7, 16 ];
const s_18_0_2 = [ 18, 0, 2 ];
const s_10_11_28 = [ 10, 11, 28 ];
const s_13_23 = [ 13, 23 ];
const s_4_11_12_19 = [ 4, 11, 12, 19 ];
const s_6_9_10_26_1 = [ 6, 9, 10, 26, 1 ];
const s_9_18_27_29_41 = [ 9, 18, 27, 29, 41 ];
const s_33_0 = [ 33, 0 ];
const s_4_10_11_19_26_32 = [ 4, 10, 11, 19, 26, 32 ];
const s_3_4_26 = [ 3, 4, 26 ];
const s_3_6_10_0 = [ 3, 6, 10, 0 ];
const s_6_14_30_0 = [ 6, 14, 30, 0 ];
const s_6_17_38_0 = [ 6, 17, 38, 0 ];
const s_7_30_36 = [ 7, 30, 36 ];
const s_6_7_13_20_22_25_27_36 = [ 6, 7, 13, 20, 22, 25, 27, 36 ];
const s_4_6_14_17_36 = [ 4, 6, 14, 17, 36 ];
const s_4_5_6_17_30_35_36_38 = [ 4, 5, 6, 17, 30, 35, 36, 38 ];
const s_5_6_18_26_35_38 = [ 5, 6, 18, 26, 35, 38 ];
const s_6_13_29 = [ 6, 13, 29 ];
const s_6_8_10_17_18_32_35 = [ 6, 8, 10, 17, 18, 32, 35 ];
const s_4_29_30_32_33_36_37_38_40_41 = [ 4, 29, 30, 32, 33, 36, 37, 38, 40, 41 ];
const s_4_6_9_10_11_14_19_22 = [ 4, 6, 9, 10, 11, 14, 19, 22 ];
const s_27_30_35_38 = [ 27, 30, 35, 38 ];
const s_10_27_35 = [ 10, 27, 35 ];
const s_26_31_35 = [ 26, 31, 35 ];
const s_30_31_35_0 = [ 30, 31, 35, 0 ];
const s_4_6_41 = [ 4, 6, 41 ];
const s_6_8_18_23_40 = [ 6, 8, 18, 23, 40 ];
const s_21_40_41 = [ 21, 40, 41 ];
const s_15_17_31_39 = [ 15, 17, 31, 39 ];
const s_29_30_31_2 = [ 29, 30, 31, 2 ];
const s_7_18_20_0 = [ 7, 18, 20, 0 ];
const s_10_32_34 = [ 10, 32, 34 ];
const s_4_18_34 = [ 4, 18, 34 ];
const s_4_30_41 = [ 4, 30, 41 ];
const s_13_15_20 = [ 13, 15, 20 ];
const s_7_8_18_38 = [ 7, 8, 18, 38 ];
const s_18_27_1 = [ 18, 27, 1 ];
const s_9_18_31 = [ 9, 18, 31 ];
const s_4_10_13_17_38 = [ 4, 10, 13, 17, 38 ];
const s_13_19_20_30_35 = [ 13, 19, 20, 30, 35 ];
const s_7_13_17_0 = [ 7, 13, 17, 0 ];
const s_4_14_32_35 = [ 4, 14, 32, 35 ];
const s_6_18_39_0 = [ 6, 18, 39, 0 ];
const s_10_11_32 = [ 10, 11, 32 ];
const s_5_6_35_39_40 = [ 5, 6, 35, 39, 40 ];
const s_5_18_31_32_37 = [ 5, 18, 31, 32, 37 ];
const s_6_8_23_33_35_40_41 = [ 6, 8, 23, 33, 35, 40, 41 ];
const s_4_10_14_18_26_31_32_41 = [ 4, 10, 14, 18, 26, 31, 32, 41 ];
const s_13_17_18 = [ 13, 17, 18 ];
const s_4_6_7_28_29 = [ 4, 6, 7, 28, 29 ];
const s_4_13_18 = [ 4, 13, 18 ];
const s_6_18_1 = [ 6, 18, 1 ];
const s_18_32_37 = [ 18, 32, 37 ];
const s_17_30_31_0 = [ 17, 30, 31, 0 ];
const s_4_7_22_0 = [ 4, 7, 22, 0 ];
const s_8_10_1_0 = [ 8, 10, 1, 0 ];
const s_4_10_18_0 = [ 4, 10, 18, 0 ];
const s_7_9_17_18 = [ 7, 9, 17, 18 ];
const s_38_0_2 = [ 38, 0, 2 ];
const s_7_17_26_27 = [ 7, 17, 26, 27 ];
const s_6_8_13_17_35 = [ 6, 8, 13, 17, 35 ];
const s_3_17_26_34_42 = [ 3, 17, 26, 34, 42 ];
const s_6_20_32_35 = [ 6, 20, 32, 35 ];
const s_30_31_32_42 = [ 30, 31, 32, 42 ];
const s_4_7_9_26_31_41 = [ 4, 7, 9, 26, 31, 41 ];
const s_32_38_40_41 = [ 32, 38, 40, 41 ];
const s_17_18_42 = [ 17, 18, 42 ];
const s_14_15_23 = [ 14, 15, 23 ];
const s_7_8_37 = [ 7, 8, 37 ];
const s_6_14_15_17_35_42 = [ 6, 14, 15, 17, 35, 42 ];
const s_4_35_42 = [ 4, 35, 42 ];
const s_6_21_35_36_40_0 = [ 6, 21, 35, 36, 40, 0 ];
const s_20_37_39 = [ 20, 37, 39 ];
const s_6_14_32 = [ 6, 14, 32 ];
const s_10_29_0 = [ 10, 29, 0 ];
const s_30_33_35_41 = [ 30, 33, 35, 41 ];
const s_6_10_14_27 = [ 6, 10, 14, 27 ];
const s_14_24 = [ 14, 24 ];
const s_4_23_34_35 = [ 4, 23, 34, 35 ];
const s_6_25_26 = [ 6, 25, 26 ];
const s_4_6_7_29_30_35 = [ 4, 6, 7, 29, 30, 35 ];
const s_21_27_35 = [ 21, 27, 35 ];
const s_4_7_9_18_23_35 = [ 4, 7, 9, 18, 23, 35 ];
const s_23_32 = [ 23, 32 ];
const s_30_35_40_41 = [ 30, 35, 40, 41 ];
const s_7_14_26 = [ 7, 14, 26 ];
const s_4_10_29_32_38 = [ 4, 10, 29, 32, 38 ];
const s_6_8_15_20_25 = [ 6, 8, 15, 20, 25 ];
const s_8_17_20 = [ 8, 17, 20 ];
const s_7_9_10_11_39 = [ 7, 9, 10, 11, 39 ];
const s_4_28_2_0 = [ 4, 28, 2, 0 ];
const s_8_13 = [ 8, 13 ];
const s_7_23_26 = [ 7, 23, 26 ];
const s_15_18_24_0_2 = [ 15, 18, 24, 0, 2 ];
const s_15_24_2_0 = [ 15, 24, 2, 0 ];
const s_6_8_9_10_23_33_35_38_39 = [ 6, 8, 9, 10, 23, 33, 35, 38, 39 ];
const s_4_22_38 = [ 4, 22, 38 ];
const s_4_6_17_25_32_35 = [ 4, 6, 17, 25, 32, 35 ];
const s_7_10_21_26_32_39 = [ 7, 10, 21, 26, 32, 39 ];
const s_9_10_32_39 = [ 9, 10, 32, 39 ];
const s_9_17_25 = [ 9, 17, 25 ];
const s_42_1 = [ 42, 1 ];
const s_8_14_17 = [ 8, 14, 17 ];
const s_6_18_26_0 = [ 6, 18, 26, 0 ];
const s_4_32_35 = [ 4, 32, 35 ];
const s_39_0 = [ 39, 0 ];
const s_6_7_10_14_23_30_32_42 = [ 6, 7, 10, 14, 23, 30, 32, 42 ];
const s_31_32_0 = [ 31, 32, 0 ];
const s_18_29_34_37_41 = [ 18, 29, 34, 37, 41 ];
const s_4_7_32_34_41 = [ 4, 7, 32, 34, 41 ];
const s_6_8_18_20_23_35 = [ 6, 8, 18, 20, 23, 35 ];
const s_9_13_22 = [ 9, 13, 22 ];
const s_3_9_10_32_42 = [ 3, 9, 10, 32, 42 ];
const s_6_9_0_1 = [ 6, 9, 0, 1 ];
const s_32_40_41_0 = [ 32, 40, 41, 0 ];
const s_4_10_21_24_26 = [ 4, 10, 21, 24, 26 ];
const s_30_31_39_0 = [ 30, 31, 39, 0 ];
const s_35_39_41 = [ 35, 39, 41 ];
const s_4_6_9_26 = [ 4, 6, 9, 26 ];
const s_11_16_26_28_36 = [ 11, 16, 26, 28, 36 ];
const s_4_6_7_19_26 = [ 4, 6, 7, 19, 26 ];
const s_4_18_39_0 = [ 4, 18, 39, 0 ];
const s_31_33_40_41_42 = [ 31, 33, 40, 41, 42 ];
const s_41_0_2 = [ 41, 0, 2 ];
const s_4_12_14 = [ 4, 12, 14 ];
const s_4_10_31_32_39_40_41_42 = [ 4, 10, 31, 32, 39, 40, 41, 42 ];
const s_4_6_14_26 = [ 4, 6, 14, 26 ];
const s_17_28 = [ 17, 28 ];
const s_6_10_19_20_21_28_36_40_42 = [ 6, 10, 19, 20, 21, 28, 36, 40, 42 ];
const s_4_0_2 = [ 4, 0, 2 ];
const s_5_11_18 = [ 5, 11, 18 ];
const s_6_13_27_29_35 = [ 6, 13, 27, 29, 35 ];
const s_20_23 = [ 20, 23 ];
const s_10_32_2_0 = [ 10, 32, 2, 0 ];
const s_5_10_15_18 = [ 5, 10, 15, 18 ];
const s_4_9_22_26 = [ 4, 9, 22, 26 ];
const s_11_27_29_38 = [ 11, 27, 29, 38 ];
const s_42_43 = [ 42, 43 ];
const s_9_11_15_30_33_35_39_40_41_42_0 = [ 9, 11, 15, 30, 33, 35, 39, 40, 41, 42, 0 ];
const s_4_6_8_9_10_11_17_26_0 = [ 4, 6, 8, 9, 10, 11, 17, 26, 0 ];
const s_29_33_35_41 = [ 29, 33, 35, 41 ];
const s_18_24 = [ 18, 24 ];
const s_32_33_41_42 = [ 32, 33, 41, 42 ];
const s_10_18_24_0_2 = [ 10, 18, 24, 0, 2 ];
const s_4_14_18_24 = [ 4, 14, 18, 24 ];
const s_7_13_17_20_27_0 = [ 7, 13, 17, 20, 27, 0 ];
const s_8_25_38 = [ 8, 25, 38 ];
const s_7_8_15_26_38 = [ 7, 8, 15, 26, 38 ];
const s_4_7_10_14_26_30_31_32_41 = [ 4, 7, 10, 14, 26, 30, 31, 32, 41 ];
const s_9_30_41 = [ 9, 30, 41 ];
const s_6_8_10_14 = [ 6, 8, 10, 14 ];
const s_30_31_36_41 = [ 30, 31, 36, 41 ];
const s_15_30_32_39_42 = [ 15, 30, 32, 39, 42 ];
const s_7_9_11_14_15_22 = [ 7, 9, 11, 14, 15, 22 ];
const s_6_9_0 = [ 6, 9, 0 ];
const s_5_10_18_40 = [ 5, 10, 18, 40 ];
const s_6_14_18_1 = [ 6, 14, 18, 1 ];
const s_4_32_0_2 = [ 4, 32, 0, 2 ];
const s_10_32_33 = [ 10, 32, 33 ];
const s_15_2 = [ 15, 2 ];
const s_6_14_40 = [ 6, 14, 40 ];
const s_33_38 = [ 33, 38 ];
const s_11_17_22 = [ 11, 17, 22 ];
const s_8_11_19 = [ 8, 11, 19 ];
const s_9_10_15_32_36 = [ 9, 10, 15, 32, 36 ];
const s_4_10_11_17 = [ 4, 10, 11, 17 ];
const s_4_6_10_23_36 = [ 4, 6, 10, 23, 36 ];
const s_4_11_12_37_41 = [ 4, 11, 12, 37, 41 ];
const s_33_43 = [ 33, 43 ];
const s_29_42 = [ 29, 42 ];
const s_35_36_42 = [ 35, 36, 42 ];
const s_6_17_32_35 = [ 6, 17, 32, 35 ];
const s_4_6_26_35_43_0 = [ 4, 6, 26, 35, 43, 0 ];
const s_21_35_40 = [ 21, 35, 40 ];
const s_21_22 = [ 21, 22 ];
const s_6_26_34_41 = [ 6, 26, 34, 41 ];
const s_4_6_15_21_28_0_2 = [ 4, 6, 15, 21, 28, 0, 2 ];
const s_6_7_9_42 = [ 6, 7, 9, 42 ];
const s_31_38_41 = [ 31, 38, 41 ];
const s_15_31_39_42 = [ 15, 31, 39, 42 ];
const s_7_2_0 = [ 7, 2, 0 ];
const s_4_6_31_38_41_42 = [ 4, 6, 31, 38, 41, 42 ];
const s_4_31_33_38_42 = [ 4, 31, 33, 38, 42 ];
const s_39_42 = [ 39, 42 ];
const s_4_31_33 = [ 4, 31, 33 ];
const s_11_14 = [ 11, 14 ];
const s_19_34 = [ 19, 34 ];
const s_7_40 = [ 7, 40 ];
const s_33_37_38 = [ 33, 37, 38 ];
const s_4_31_41 = [ 4, 31, 41 ];
const s_4_30_31_32_38_41 = [ 4, 30, 31, 32, 38, 41 ];
const s_32_33_35_37 = [ 32, 33, 35, 37 ];
const s_9_13 = [ 9, 13 ];
const s_4_7_23_28_30_31_38 = [ 4, 7, 23, 28, 30, 31, 38 ];
const s_5_6_8_9 = [ 5, 6, 8, 9 ];
const s_17_1_0 = [ 17, 1, 0 ];
const s_36_37 = [ 36, 37 ];
const s_6_14_23_29_35_38_41_42 = [ 6, 14, 23, 29, 35, 38, 41, 42 ];
const s_6_10_14_35 = [ 6, 10, 14, 35 ];
const s_5_6_20_27_30_32_35_38 = [ 5, 6, 20, 27, 30, 32, 35, 38 ];
const s_6_35_38_41 = [ 6, 35, 38, 41 ];
const s_13_15_18 = [ 13, 15, 18 ];
const s_10_18_32_41 = [ 10, 18, 32, 41 ];
const s_9_12_18_26_29_37 = [ 9, 12, 18, 26, 29, 37 ];
const s_6_15_35_36 = [ 6, 15, 35, 36 ];
const s_14_23_35_41 = [ 14, 23, 35, 41 ];
const s_8_15_18_1 = [ 8, 15, 18, 1 ];
const s_6_29_0 = [ 6, 29, 0 ];
const s_6_12_29_30_34_35_37 = [ 6, 12, 29, 30, 34, 35, 37 ];
const s_8_10_20_23_35 = [ 8, 10, 20, 23, 35 ];
const s_29_1 = [ 29, 1 ];
const s_5_6_18_32_35_38 = [ 5, 6, 18, 32, 35, 38 ];
const s_6_14_31_36 = [ 6, 14, 31, 36 ];
const s_6_15_40 = [ 6, 15, 40 ];
const s_4_6_11_29_32 = [ 4, 6, 11, 29, 32 ];
const s_8_10_13 = [ 8, 10, 13 ];
const s_6_10_14_27_35 = [ 6, 10, 14, 27, 35 ];
const s_23_26_33 = [ 23, 26, 33 ];
const s_15_17_18_23_26 = [ 15, 17, 18, 23, 26 ];
const s_10_36_41 = [ 10, 36, 41 ];
const s_7_15_25_30_42_0 = [ 7, 15, 25, 30, 42, 0 ];
const s_9_10_11 = [ 9, 10, 11 ];
const s_4_6_14_15_35_41 = [ 4, 6, 14, 15, 35, 41 ];
const s_3_18_41 = [ 3, 18, 41 ];
const s_14_24_26 = [ 14, 24, 26 ];
const s_15_18_20 = [ 15, 18, 20 ];
const s_7_9_23_24_26 = [ 7, 9, 23, 24, 26 ];
const s_6_15_18_35_38 = [ 6, 15, 18, 35, 38 ];
const s_4_10_32_36 = [ 4, 10, 32, 36 ];
const s_4_32_33 = [ 4, 32, 33 ];
const s_4_6_8_9_10_15_17_21_24_35_38_41_2 = [ 4, 6, 8, 9, 10, 15, 17, 21, 24, 35, 38, 41, 2 ];
const s_10_17_27 = [ 10, 17, 27 ];
const s_9_10_24_0 = [ 9, 10, 24, 0 ];
const s_4_6_8_23_30_35 = [ 4, 6, 8, 23, 30, 35 ];
const s_18_40_41 = [ 18, 40, 41 ];
const s_10_14_24 = [ 10, 14, 24 ];
const s_11_14_18_41 = [ 11, 14, 18, 41 ];
const s_4_10_11_17_26_28_29_30_32_35_38_40_41_42_0 = [ 4, 10, 11, 17, 26, 28, 29, 30, 32, 35, 38, 40, 41, 42, 0 ];
const s_4_6_8_10_11 = [ 4, 6, 8, 10, 11 ];
const s_4_11_0_2 = [ 4, 11, 0, 2 ];
const s_7_9_12_16_26 = [ 7, 9, 12, 16, 26 ];
const s_10_28_0_2 = [ 10, 28, 0, 2 ];
const s_13_27_35 = [ 13, 27, 35 ];
const s_13_15_35 = [ 13, 15, 35 ];
const s_4_11_35_2_0 = [ 4, 11, 35, 2, 0 ];
const s_6_7_10_15_28_30_35_40 = [ 6, 7, 10, 15, 28, 30, 35, 40 ];
const s_10_30_40_41_0 = [ 10, 30, 40, 41, 0 ];
const s_4_24_26 = [ 4, 24, 26 ];
const s_4_14_41 = [ 4, 14, 41 ];
const s_4_10_14_32_34 = [ 4, 10, 14, 32, 34 ];
const s_10_11_39_43 = [ 10, 11, 39, 43 ];
const s_4_6_9_10_15_36_42 = [ 4, 6, 9, 10, 15, 36, 42 ];
const s_4_28_32_42 = [ 4, 28, 32, 42 ];
const s_5_8_35 = [ 5, 8, 35 ];
const s_4_6_18_21_40 = [ 4, 6, 18, 21, 40 ];
const s_21_31_32_40_41_42 = [ 21, 31, 32, 40, 41, 42 ];
const s_11_21 = [ 11, 21 ];
const s_10_12_26 = [ 10, 12, 26 ];
const s_7_13_18_20_32 = [ 7, 13, 18, 20, 32 ];
const s_6_15_23_25_26_28_38 = [ 6, 15, 23, 25, 26, 28, 38 ];
const s_13_18_20_0 = [ 13, 18, 20, 0 ];
const s_7_21_25_35 = [ 7, 21, 25, 35 ];
const s_23_32_34_35 = [ 23, 32, 34, 35 ];
const s_6_8_1 = [ 6, 8, 1 ];
const s_6_10_36_38_1 = [ 6, 10, 36, 38, 1 ];
const s_7_14_0 = [ 7, 14, 0 ];
const s_8_20_26 = [ 8, 20, 26 ];
const s_22_27_29 = [ 22, 27, 29 ];
const s_13_18_29_35 = [ 13, 18, 29, 35 ];
const s_4_11_30_32_39 = [ 4, 11, 30, 32, 39 ];
const s_6_8_10_30_35_41 = [ 6, 8, 10, 30, 35, 41 ];
const s_5_27_33_35_43 = [ 5, 27, 33, 35, 43 ];
const s_5_6_36 = [ 5, 6, 36 ];
const s_6_25_27_36 = [ 6, 25, 27, 36 ];
const s_31_35_38_41 = [ 31, 35, 38, 41 ];
const s_6_14_25 = [ 6, 14, 25 ];
const s_14_30_42 = [ 14, 30, 42 ];
const s_13_20_33_39 = [ 13, 20, 33, 39 ];
const s_9_2 = [ 9, 2 ];
const s_38_39 = [ 38, 39 ];
const s_21_24 = [ 21, 24 ];
const s_5_6_13_15_23_35_38 = [ 5, 6, 13, 15, 23, 35, 38 ];
const s_27_29_35_38 = [ 27, 29, 35, 38 ];
const s_24_30_0 = [ 24, 30, 0 ];
const s_6_9_29_39 = [ 6, 9, 29, 39 ];
const s_4_26_32_42 = [ 4, 26, 32, 42 ];
const s_10_22_28 = [ 10, 22, 28 ];
const s_5_13_20 = [ 5, 13, 20 ];
const s_21_29 = [ 21, 29 ];
const s_8_15_29 = [ 8, 15, 29 ];
const s_4_5_10_32_41 = [ 4, 5, 10, 32, 41 ];
const s_6_9_25_0 = [ 6, 9, 25, 0 ];
const s_3_8_10 = [ 3, 8, 10 ];
const s_30_37_38 = [ 30, 37, 38 ];
const s_4_7_11_19_26 = [ 4, 7, 11, 19, 26 ];
const s_18_30_32_41 = [ 18, 30, 32, 41 ];
const s_4_5_12_18_35_0 = [ 4, 5, 12, 18, 35, 0 ];
const s_17_22 = [ 17, 22 ];
const s_7_26_28_30_36 = [ 7, 26, 28, 30, 36 ];
const s_3_11 = [ 3, 11 ];
const s_14_1_0 = [ 14, 1, 0 ];
const s_7_8_12 = [ 7, 8, 12 ];
const s_5_18_23 = [ 5, 18, 23 ];
const s_15_17_18_20 = [ 15, 17, 18, 20 ];
const s_6_10_32 = [ 6, 10, 32 ];
const s_5_23_26 = [ 5, 23, 26 ];
const s_4_6_9_14_23_30_31_32_34_35_36_40 = [ 4, 6, 9, 14, 23, 30, 31, 32, 34, 35, 36, 40 ];
const s_4_6_14_18_35_41 = [ 4, 6, 14, 18, 35, 41 ];
const s_13_26_30 = [ 13, 26, 30 ];
const s_4_6_7_10_18 = [ 4, 6, 7, 10, 18 ];
const s_4_13_28_34 = [ 4, 13, 28, 34 ];
const s_6_9_10_26_36 = [ 6, 9, 10, 26, 36 ];
const s_27_29_42 = [ 27, 29, 42 ];
const s_6_7_10_11_13_17_21_28_30_34_35_36 = [ 6, 7, 10, 11, 13, 17, 21, 28, 30, 34, 35, 36 ];
const s_18_35_37_39 = [ 18, 35, 37, 39 ];
const s_10_29_32 = [ 10, 29, 32 ];
const s_5_6_18_29_34_42 = [ 5, 6, 18, 29, 34, 42 ];
const s_6_9_31_35 = [ 6, 9, 31, 35 ];
const s_4_30_35_38_2 = [ 4, 30, 35, 38, 2 ];
const s_5_6_13 = [ 5, 6, 13 ];
const s_6_8_14_21_23_35_38 = [ 6, 8, 14, 21, 23, 35, 38 ];
const s_23_26 = [ 23, 26 ];
const s_4_21_40 = [ 4, 21, 40 ];
const s_6_9_18_25 = [ 6, 9, 18, 25 ];
const s_6_9_10_18_38 = [ 6, 9, 10, 18, 38 ];
const s_6_8_10_11_33_35 = [ 6, 8, 10, 11, 33, 35 ];
const s_4_11_23_26_30_35_40 = [ 4, 11, 23, 26, 30, 35, 40 ];
const s_20_37 = [ 20, 37 ];
const s_11_17_32_35_39 = [ 11, 17, 32, 35, 39 ];
const s_5_6_30_35 = [ 5, 6, 30, 35 ];
const s_7_18_20_35_39_0 = [ 7, 18, 20, 35, 39, 0 ];
const s_6_15_26_38_42 = [ 6, 15, 26, 38, 42 ];
const s_6_7_28_40 = [ 6, 7, 28, 40 ];
const s_18_31_36 = [ 18, 31, 36 ];
const s_10_20_26_33_41 = [ 10, 20, 26, 33, 41 ];
const s_6_25_32_36_38 = [ 6, 25, 32, 36, 38 ];
const s_4_6_2 = [ 4, 6, 2 ];
const s_6_12_37 = [ 6, 12, 37 ];
const s_6_18_35_40 = [ 6, 18, 35, 40 ];
const s_5_15_17_18 = [ 5, 15, 17, 18 ];
const s_6_9_17_20_25_30_33_35 = [ 6, 9, 17, 20, 25, 30, 33, 35 ];
const s_4_7_10_15_27_30_33_35_38_40 = [ 4, 7, 10, 15, 27, 30, 33, 35, 38, 40 ];
const s_4_6_18_20_23 = [ 4, 6, 18, 20, 23 ];
const s_9_20_40 = [ 9, 20, 40 ];
const s_7_11_12_37 = [ 7, 11, 12, 37 ];
const s_4_6_18_38 = [ 4, 6, 18, 38 ];
const s_4_9_10_15_26_31_32_33_35_36_40_41_42 = [ 4, 9, 10, 15, 26, 31, 32, 33, 35, 36, 40, 41, 42 ];
const s_9_11_14_26_37_43 = [ 9, 11, 14, 26, 37, 43 ];
const s_6_17_32_0_2 = [ 6, 17, 32, 0, 2 ];
const s_6_9_31_36 = [ 6, 9, 31, 36 ];
const s_6_25_26_35_38_0 = [ 6, 25, 26, 35, 38, 0 ];
const s_10_27_34_35 = [ 10, 27, 34, 35 ];
const s_3_6_9_18_31_35_36_40 = [ 3, 6, 9, 18, 31, 35, 36, 40 ];
const s_6_14_21 = [ 6, 14, 21 ];
const s_8_26_27 = [ 8, 26, 27 ];
const s_6_27_29_35 = [ 6, 27, 29, 35 ];
const s_21_27_0 = [ 21, 27, 0 ];
const s_6_8_13_17_23_35 = [ 6, 8, 13, 17, 23, 35 ];
const s_4_7_10_11_26_28_29_31_33_34_35_36_38_41_42 = [ 4, 7, 10, 11, 26, 28, 29, 31, 33, 34, 35, 36, 38, 41, 42 ];
const s_12_15 = [ 12, 15 ];
const s_37_2 = [ 37, 2 ];
const s_10_13_18_21_32_34_40 = [ 10, 13, 18, 21, 32, 34, 40 ];
const s_7_23_2 = [ 7, 23, 2 ];
const s_11_13_35 = [ 11, 13, 35 ];
const s_11_35_38_2 = [ 11, 35, 38, 2 ];
const s_9_10_15_31_36 = [ 9, 10, 15, 31, 36 ];
const s_6_17_36_38 = [ 6, 17, 36, 38 ];
const s_6_32_36_38 = [ 6, 32, 36, 38 ];
const s_4_7_35_40 = [ 4, 7, 35, 40 ];
const s_5_6_10_13_30_32_35 = [ 5, 6, 10, 13, 30, 32, 35 ];
const s_4_13_20_2 = [ 4, 13, 20, 2 ];
const s_6_30_31_35_2_0 = [ 6, 30, 31, 35, 2, 0 ];
const s_5_6_25_29_30_35_36_37_40 = [ 5, 6, 25, 29, 30, 35, 36, 37, 40 ];
const s_11_31_34_35_38_2_0 = [ 11, 31, 34, 35, 38, 2, 0 ];
const s_4_11_30_31_35_38 = [ 4, 11, 30, 31, 35, 38 ];
const s_4_11_35_38_39_2 = [ 4, 11, 35, 38, 39, 2 ];
const s_6_34_35_38_41 = [ 6, 34, 35, 38, 41 ];
const s_6_8_14_19_21_25_40 = [ 6, 8, 14, 19, 21, 25, 40 ];
const s_6_14_20_29_30 = [ 6, 14, 20, 29, 30 ];
const s_6_7_9_10_15_17_21_23_24_25_26_28_30_32_33_35_38_42 = [ 6, 7, 9, 10, 15, 17, 21, 23, 24, 25, 26, 28, 30, 32, 33, 35, 38, 42 ];
const s_5_6_10 = [ 5, 6, 10 ];
const s_7_23_26_35_37_38 = [ 7, 23, 26, 35, 37, 38 ];
const s_7_27_29_30_35_41 = [ 7, 27, 29, 30, 35, 41 ];
const s_4_6_18_20_35_39 = [ 4, 6, 18, 20, 35, 39 ];
const s_6_9_15_18_23_30_35 = [ 6, 9, 15, 18, 23, 30, 35 ];
const s_7_10_26_27_30_35_1 = [ 7, 10, 26, 27, 30, 35, 1 ];
const s_4_5_8_9_35_41 = [ 4, 5, 8, 9, 35, 41 ];
const s_5_20_35 = [ 5, 20, 35 ];
const s_8_18_29 = [ 8, 18, 29 ];
const s_14_32_41 = [ 14, 32, 41 ];
const s_4_6_14_15_17_21_33_40 = [ 4, 6, 14, 15, 17, 21, 33, 40 ];
const s_6_10_18_27 = [ 6, 10, 18, 27 ];
const s_10_11_13_18_30_33_34_35_38_39_2_0 = [ 10, 11, 13, 18, 30, 33, 34, 35, 38, 39, 2, 0 ];
const s_4_9_14_23 = [ 4, 9, 14, 23 ];
const s_8_20_25_31 = [ 8, 20, 25, 31 ];
const s_6_13_15_30_34_35_38_0 = [ 6, 13, 15, 30, 34, 35, 38, 0 ];
const s_6_8_10 = [ 6, 8, 10 ];
const s_4_6_10_14 = [ 4, 6, 10, 14 ];
const s_4_6_13_21_24_26_40 = [ 4, 6, 13, 21, 24, 26, 40 ];
const s_4_7_31_32_35_39_41_42 = [ 4, 7, 31, 32, 35, 39, 41, 42 ];
const s_10_31_32_35 = [ 10, 31, 32, 35 ];
const s_4_7_9_10_15_26_35_38 = [ 4, 7, 9, 10, 15, 26, 35, 38 ];
const s_6_10_0_1 = [ 6, 10, 0, 1 ];
const s_3_4_7_15_16_26 = [ 3, 4, 7, 15, 16, 26 ];
const s_4_6_10_14_15_18_32_33_35_38_40_41 = [ 4, 6, 10, 14, 15, 18, 32, 33, 35, 38, 40, 41 ];
const s_21_1 = [ 21, 1 ];
const s_10_31_32_42 = [ 10, 31, 32, 42 ];
const s_7_9_39_41 = [ 7, 9, 39, 41 ];
const s_6_8_21_23_35 = [ 6, 8, 21, 23, 35 ];
const s_19_26_0 = [ 19, 26, 0 ];
const s_18_35_41 = [ 18, 35, 41 ];
const s_6_8_25_30_35 = [ 6, 8, 25, 30, 35 ];
const s_4_6_10_18_23_30_35_38 = [ 4, 6, 10, 18, 23, 30, 35, 38 ];
const s_38_40_43 = [ 38, 40, 43 ];
const s_5_10_29_42 = [ 5, 10, 29, 42 ];
const s_7_9_10_14_18_19_26_34 = [ 7, 9, 10, 14, 18, 19, 26, 34 ];
const s_10_14_32 = [ 10, 14, 32 ];
const s_4_9_31_36_41 = [ 4, 9, 31, 36, 41 ];
const s_4_29_36 = [ 4, 29, 36 ];
const s_32_38_41_42 = [ 32, 38, 41, 42 ];
const s_9_10_14_0 = [ 9, 10, 14, 0 ];
const s_27_30_35_36_38_43_0 = [ 27, 30, 35, 36, 38, 43, 0 ];
const s_7_11_19_22_23 = [ 7, 11, 19, 22, 23 ];
const s_9_10_30 = [ 9, 10, 30 ];
const s_10_18_27 = [ 10, 18, 27 ];
const s_30_34_42 = [ 30, 34, 42 ];
const s_31_0 = [ 31, 0 ];
const s_29_32_35 = [ 29, 32, 35 ];
const s_9_31_41 = [ 9, 31, 41 ];
const s_10_11_36_42 = [ 10, 11, 36, 42 ];
const s_10_36_0 = [ 10, 36, 0 ];
const s_4_9_10_26_27 = [ 4, 9, 10, 26, 27 ];
const s_30_31_36_39_41 = [ 30, 31, 36, 39, 41 ];
const s_31_37_40 = [ 31, 37, 40 ];
const s_11_12_32 = [ 11, 12, 32 ];
const s_4_7_9_15_18_26 = [ 4, 7, 9, 15, 18, 26 ];
const s_10_21_28_32_36_39_40_42_0 = [ 10, 21, 28, 32, 36, 39, 40, 42, 0 ];
const s_13_15_26_30_40_42 = [ 13, 15, 26, 30, 40, 42 ];
const s_4_6_10_14_26_32_33_35_36_38_41_42 = [ 4, 6, 10, 14, 26, 32, 33, 35, 36, 38, 41, 42 ];
const s_4_7_9_19_26_41 = [ 4, 7, 9, 19, 26, 41 ];
const s_29_31_32_41 = [ 29, 31, 32, 41 ];
const s_4_32_36_40_0 = [ 4, 32, 36, 40, 0 ];
const s_5_18_34 = [ 5, 18, 34 ];
const s_7_10_18_21_31_40 = [ 7, 10, 18, 21, 31, 40 ];
const s_4_8_18_25_35_37_38_39 = [ 4, 8, 18, 25, 35, 37, 38, 39 ];
const s_20_35_39 = [ 20, 35, 39 ];
const s_4_7_12_14_37 = [ 4, 7, 12, 14, 37 ];
const s_4_5_6_17_0 = [ 4, 5, 6, 17, 0 ];
const s_23_28_30_35_1_0 = [ 23, 28, 30, 35, 1, 0 ];
const s_18_21_0 = [ 18, 21, 0 ];
const s_31_35_36 = [ 31, 35, 36 ];
const s_6_21_31_35_40_0 = [ 6, 21, 31, 35, 40, 0 ];
const s_10_18_0_2 = [ 10, 18, 0, 2 ];
const s_4_10_41_42 = [ 4, 10, 41, 42 ];
const s_4_6_9_32_35 = [ 4, 6, 9, 32, 35 ];
const s_3_4_8_9_10_30_31_35_36_38_41 = [ 3, 4, 8, 9, 10, 30, 31, 35, 36, 38, 41 ];
const s_9_11_18 = [ 9, 11, 18 ];
const s_13_29_36_39 = [ 13, 29, 36, 39 ];
const s_6_9_14_19_27 = [ 6, 9, 14, 19, 27 ];
const s_4_6_10_23 = [ 4, 6, 10, 23 ];
const s_10_15_26_36 = [ 10, 15, 26, 36 ];
const s_7_21_40 = [ 7, 21, 40 ];
const s_4_9_10_32_36 = [ 4, 9, 10, 32, 36 ];
const s_4_11_30_38 = [ 4, 11, 30, 38 ];
const s_18_24_0 = [ 18, 24, 0 ];
const s_4_9_31_32_35_36_39_42 = [ 4, 9, 31, 32, 35, 36, 39, 42 ];
const s_4_6_9_10_19_22_25 = [ 4, 6, 9, 10, 19, 22, 25 ];
const s_4_6_11_38 = [ 4, 6, 11, 38 ];
const s_9_10_32_42 = [ 9, 10, 32, 42 ];
const s_10_32_36_0 = [ 10, 32, 36, 0 ];
const s_4_6_9_10_23_30_31_35_36_0 = [ 4, 6, 9, 10, 23, 30, 31, 35, 36, 0 ];
const s_29_32_35_38_40 = [ 29, 32, 35, 38, 40 ];
const s_4_10_19 = [ 4, 10, 19 ];
const s_6_7_9_15_21 = [ 6, 7, 9, 15, 21 ];
const s_7_24_25_30 = [ 7, 24, 25, 30 ];
const s_4_9_18_26_31_39 = [ 4, 9, 18, 26, 31, 39 ];
const s_30_35_38_0 = [ 30, 35, 38, 0 ];
const s_4_6_21_26 = [ 4, 6, 21, 26 ];
const s_14_18_1_0 = [ 14, 18, 1, 0 ];
const s_25_26 = [ 25, 26 ];
const s_31_32_36_38_41_42 = [ 31, 32, 36, 38, 41, 42 ];
const s_30_32_34_40_41_42 = [ 30, 32, 34, 40, 41, 42 ];
const s_4_7_15_26 = [ 4, 7, 15, 26 ];
const s_4_9_10_21_40 = [ 4, 9, 10, 21, 40 ];
const s_7_9_15 = [ 7, 9, 15 ];
const s_6_32_35_36_39 = [ 6, 32, 35, 36, 39 ];
const s_15_17_27_29_31_35_36_38 = [ 15, 17, 27, 29, 31, 35, 36, 38 ];
const s_4_6_10_13_19_29_30_32_34_37_0 = [ 4, 6, 10, 13, 19, 29, 30, 32, 34, 37, 0 ];
const s_18_27_29 = [ 18, 27, 29 ];
const s_4_6_7_19_26_29_30_33_35_38_41 = [ 4, 6, 7, 19, 26, 29, 30, 33, 35, 38, 41 ];
const s_29_30_38_42 = [ 29, 30, 38, 42 ];
const s_8_10_17_20_27_30_35 = [ 8, 10, 17, 20, 27, 30, 35 ];
const s_36_38 = [ 36, 38 ];
const s_11_13_28_36_38 = [ 11, 13, 28, 36, 38 ];
const s_6_8_32_33_35_38_40 = [ 6, 8, 32, 33, 35, 38, 40 ];
const s_4_6_11_30_32_35 = [ 4, 6, 11, 30, 32, 35 ];
const s_10_18_27_0 = [ 10, 18, 27, 0 ];
const s_4_6_23_33_35 = [ 4, 6, 23, 33, 35 ];
const s_4_19_21_40 = [ 4, 19, 21, 40 ];
const s_4_29_30_32_41 = [ 4, 29, 30, 32, 41 ];
const s_6_7_26_30_0 = [ 6, 7, 26, 30, 0 ];
const s_6_21_30_35 = [ 6, 21, 30, 35 ];
const s_35_38_41 = [ 35, 38, 41 ];
const s_18_44 = [ 18, 44 ];
const s_8_28 = [ 8, 28 ];
const s_4_6_7_19_32_35_38_40_41 = [ 4, 6, 7, 19, 32, 35, 38, 40, 41 ];
const s_4_31_32_34_35_36_39_40 = [ 4, 31, 32, 34, 35, 36, 39, 40 ];
const s_6_18_35_41 = [ 6, 18, 35, 41 ];
const s_6_10_31_37 = [ 6, 10, 31, 37 ];
const s_6_21_25_30_35_40 = [ 6, 21, 25, 30, 35, 40 ];
const s_4_10_1 = [ 4, 10, 1 ];
const s_6_17_20 = [ 6, 17, 20 ];
const s_11_18_29_32_0 = [ 11, 18, 29, 32, 0 ];
const s_9_10_1 = [ 9, 10, 1 ];
const s_9_14_30_0 = [ 9, 14, 30, 0 ];
const s_14_18_23 = [ 14, 18, 23 ];
const s_30_32_42 = [ 30, 32, 42 ];
const s_3_7_9 = [ 3, 7, 9 ];
const s_4_26_30 = [ 4, 26, 30 ];
const s_5_6_18_34 = [ 5, 6, 18, 34 ];
const s_4_6_15_18_21_23_24_28_31_35_41_42 = [ 4, 6, 15, 18, 21, 23, 24, 28, 31, 35, 41, 42 ];
const s_10_1_2 = [ 10, 1, 2 ];
const s_23_28_0 = [ 23, 28, 0 ];
const s_5_6_18_38_41 = [ 5, 6, 18, 38, 41 ];
const s_30_34_41_43 = [ 30, 34, 41, 43 ];
const s_4_9_32_38_40 = [ 4, 9, 32, 38, 40 ];
const s_8_10_14_38 = [ 8, 10, 14, 38 ];
const s_29_30_39 = [ 29, 30, 39 ];
const s_13_21_23 = [ 13, 21, 23 ];
const s_7_26_37_39_0_2 = [ 7, 26, 37, 39, 0, 2 ];
const s_14_30_0 = [ 14, 30, 0 ];
const s_33_38_40_41_42 = [ 33, 38, 40, 41, 42 ];
const s_4_6_12_26_38 = [ 4, 6, 12, 26, 38 ];
const s_23_24 = [ 23, 24 ];
const s_5_13_27_33 = [ 5, 13, 27, 33 ];
const s_6_11_14_19_33_38_41 = [ 6, 11, 14, 19, 33, 38, 41 ];
const s_4_6_11_13_29_35_36_37_38_40_41 = [ 4, 6, 11, 13, 29, 35, 36, 37, 38, 40, 41 ];
const s_4_6_9_11_35_39_41 = [ 4, 6, 9, 11, 35, 39, 41 ];
const s_30_37_39_42_43_0 = [ 30, 37, 39, 42, 43, 0 ];
const s_4_8_11_19_22_26 = [ 4, 8, 11, 19, 22, 26 ];
const s_10_18_23_27_0_1 = [ 10, 18, 23, 27, 0, 1 ];
const s_6_10_32_1 = [ 6, 10, 32, 1 ];
const s_6_7_8_15_25 = [ 6, 7, 8, 15, 25 ];
const s_6_23_36_38 = [ 6, 23, 36, 38 ];
const s_4_6_10_28_30_32_36_37 = [ 4, 6, 10, 28, 30, 32, 36, 37 ];
const s_9_12_26_37_42 = [ 9, 12, 26, 37, 42 ];
const s_4_35_38_40_41 = [ 4, 35, 38, 40, 41 ];
const s_5_6_32_33_35_38_40_42 = [ 5, 6, 32, 33, 35, 38, 40, 42 ];
const s_6_38_40_41 = [ 6, 38, 40, 41 ];
const s_7_19_27_43 = [ 7, 19, 27, 43 ];
const s_4_7_17_29_30_31_32_33_36_37_38_40_41 = [ 4, 7, 17, 29, 30, 31, 32, 33, 36, 37, 38, 40, 41 ];
const s_6_7_18_35_38_39_42 = [ 6, 7, 18, 35, 38, 39, 42 ];
const s_4_11_14_22_30_32_33_35 = [ 4, 11, 14, 22, 30, 32, 33, 35 ];
const s_5_6_15_18_35 = [ 5, 6, 15, 18, 35 ];
const s_4_7_11_25 = [ 4, 7, 11, 25 ];
const s_6_20_35_38_39_40_42 = [ 6, 20, 35, 38, 39, 40, 42 ];
const s_6_7_9_14_15_17_31_34_35_38_42 = [ 6, 7, 9, 14, 15, 17, 31, 34, 35, 38, 42 ];
const s_14_26_31_42_0 = [ 14, 26, 31, 42, 0 ];
const s_4_10_11_32_35_36_39 = [ 4, 10, 11, 32, 35, 36, 39 ];
const s_4_20_35_41 = [ 4, 20, 35, 41 ];
const s_14_26_0 = [ 14, 26, 0 ];
const s_10_13_20 = [ 10, 13, 20 ];
const s_5_6_18_32_35_41 = [ 5, 6, 18, 32, 35, 41 ];
const s_7_21_24_28_31_42 = [ 7, 21, 24, 28, 31, 42 ];
const s_13_21_40 = [ 13, 21, 40 ];
const s_30_31_32_40 = [ 30, 31, 32, 40 ];
const s_5_6_11_38_39 = [ 5, 6, 11, 38, 39 ];
const s_11_2_0 = [ 11, 2, 0 ];
const s_11_18_35 = [ 11, 18, 35 ];
const s_5_34_35 = [ 5, 34, 35 ];
const s_5_10_19_20_25_30_42_43 = [ 5, 10, 19, 20, 25, 30, 42, 43 ];
const s_4_7_9_15_32_33_35_38_40_41_42 = [ 4, 7, 9, 15, 32, 33, 35, 38, 40, 41, 42 ];
const s_4_9_19_22 = [ 4, 9, 19, 22 ];
const s_10_31_32_36_42 = [ 10, 31, 32, 36, 42 ];
const s_4_9_10_15 = [ 4, 9, 10, 15 ];
const s_26_30_36_0 = [ 26, 30, 36, 0 ];
const s_21_23_0_2 = [ 21, 23, 0, 2 ];
const s_31_36_40 = [ 31, 36, 40 ];
const s_7_9_14_26 = [ 7, 9, 14, 26 ];
const s_9_15_26 = [ 9, 15, 26 ];
const s_23_30_35 = [ 23, 30, 35 ];
const s_6_8_14_15_36_38_41_42_0 = [ 6, 8, 14, 15, 36, 38, 41, 42, 0 ];
const s_15_2_0 = [ 15, 2, 0 ];
const s_9_10_16_26_31_32 = [ 9, 10, 16, 26, 31, 32 ];
const s_6_21_35_40 = [ 6, 21, 35, 40 ];
const s_4_10_32_33 = [ 4, 10, 32, 33 ];
const s_4_9_10_31_32_40_41_42 = [ 4, 9, 10, 31, 32, 40, 41, 42 ];
const s_4_35_36_37_40 = [ 4, 35, 36, 37, 40 ];
const s_30_33_38 = [ 30, 33, 38 ];
const s_4_10_31_32 = [ 4, 10, 31, 32 ];
const s_30_31_32_34_35_39_40_41_42 = [ 30, 31, 32, 34, 35, 39, 40, 41, 42 ];
const s_4_6_17_25_26_30_35 = [ 4, 6, 17, 25, 26, 30, 35 ];
const s_4_14_25_26 = [ 4, 14, 25, 26 ];
const s_4_24_0 = [ 4, 24, 0 ];
const s_4_9_10_19_26 = [ 4, 9, 10, 19, 26 ];
const s_31_32_39_41_42 = [ 31, 32, 39, 41, 42 ];
const s_11_35_38_41 = [ 11, 35, 38, 41 ];
const s_30_31_32 = [ 30, 31, 32 ];
const s_4_9_10_28 = [ 4, 9, 10, 28 ];
const s_4_6_10_21_23_32_39 = [ 4, 6, 10, 21, 23, 32, 39 ];
const s_29_30_35_40 = [ 29, 30, 35, 40 ];
const s_29_36_37_41 = [ 29, 36, 37, 41 ];
const s_18_33_40_41 = [ 18, 33, 40, 41 ];
const s_29_30_40 = [ 29, 30, 40 ];
const s_34_38 = [ 34, 38 ];
const s_7_17_18_21_0 = [ 7, 17, 18, 21, 0 ];
const s_18_30_32 = [ 18, 30, 32 ];
const s_30_32_39 = [ 30, 32, 39 ];
const s_4_21_41 = [ 4, 21, 41 ];
const s_29_30_35_37_40_41 = [ 29, 30, 35, 37, 40, 41 ];
const s_6_15_17_30_38 = [ 6, 15, 17, 30, 38 ];
const s_9_29_39_43 = [ 9, 29, 39, 43 ];
const s_4_6_10_35_38 = [ 4, 6, 10, 35, 38 ];
const s_31_32_38_42 = [ 31, 32, 38, 42 ];
const s_18_32_33 = [ 18, 32, 33 ];
const s_4_9_10_36 = [ 4, 9, 10, 36 ];
const s_31_32_39_43 = [ 31, 32, 39, 43 ];
const s_6_7_9_10_19_24 = [ 6, 7, 9, 10, 19, 24 ];
const s_6_7_9_10_19 = [ 6, 7, 9, 10, 19 ];
const s_30_31_39 = [ 30, 31, 39 ];
const s_10_34_42 = [ 10, 34, 42 ];
const s_4_13_21 = [ 4, 13, 21 ];
const s_4_6_7_15 = [ 4, 6, 7, 15 ];
const s_27_32_40_41_42 = [ 27, 32, 40, 41, 42 ];
const s_4_9_10_12_26_31_39_42 = [ 4, 9, 10, 12, 26, 31, 39, 42 ];
const s_29_30_36_0 = [ 29, 30, 36, 0 ];
const s_8_9_15_23 = [ 8, 9, 15, 23 ];
const s_6_7_10_21_31_32_36_39_41 = [ 6, 7, 10, 21, 31, 32, 36, 39, 41 ];
const s_4_7_10_14 = [ 4, 7, 10, 14 ];
const s_4_9_29_30 = [ 4, 9, 29, 30 ];
const s_12_32_37 = [ 12, 32, 37 ];
const s_4_9_10_22_26_0 = [ 4, 9, 10, 22, 26, 0 ];
const s_29_32_34_38 = [ 29, 32, 34, 38 ];
const s_26_28_41_42 = [ 26, 28, 41, 42 ];
const s_6_7_30_38_41 = [ 6, 7, 30, 38, 41 ];
const s_9_31_32_40_41_42 = [ 9, 31, 32, 40, 41, 42 ];
const s_4_10_19_26 = [ 4, 10, 19, 26 ];
const s_10_12_0 = [ 10, 12, 0 ];
const s_31_32_41_42 = [ 31, 32, 41, 42 ];
const s_3_4_9_10_18 = [ 3, 4, 9, 10, 18 ];
const s_29_30_41 = [ 29, 30, 41 ];
const s_4_11_12_22 = [ 4, 11, 12, 22 ];
const s_4_6_11_14_32_35 = [ 4, 6, 11, 14, 32, 35 ];
const s_4_6_10_11_22_29_30_32_35_36_40_41 = [ 4, 6, 10, 11, 22, 29, 30, 32, 35, 36, 40, 41 ];
const s_4_6_11_12_18_21_26_28 = [ 4, 6, 11, 12, 18, 21, 26, 28 ];
const s_29_30_32_37_40_41 = [ 29, 30, 32, 37, 40, 41 ];
const s_9_12_13_37 = [ 9, 12, 13, 37 ];
const s_6_23_24_40 = [ 6, 23, 24, 40 ];
const s_4_32_41 = [ 4, 32, 41 ];
const s_4_6_29_30 = [ 4, 6, 29, 30 ];
const s_9_10_18 = [ 9, 10, 18 ];
const s_4_11_21 = [ 4, 11, 21 ];
const s_4_9_30_32_40_42 = [ 4, 9, 30, 32, 40, 42 ];
const s_5_34_35_38 = [ 5, 34, 35, 38 ];
const s_7_30_38_40_41 = [ 7, 30, 38, 40, 41 ];
const s_27_30_32_35_36_40 = [ 27, 30, 32, 35, 36, 40 ];
const s_4_14_15_41 = [ 4, 14, 15, 41 ];
const s_4_17_21_40_41 = [ 4, 17, 21, 40, 41 ];
const s_4_21_1 = [ 4, 21, 1 ];
const s_30_38_39 = [ 30, 38, 39 ];
const s_4_15_26_29_30_38_40 = [ 4, 15, 26, 29, 30, 38, 40 ];
const s_11_30_32_36_41 = [ 11, 30, 32, 36, 41 ];
const s_32_33_35_37_39 = [ 32, 33, 35, 37, 39 ];
const s_4_9_11_18_22 = [ 4, 9, 11, 18, 22 ];
const s_34_0 = [ 34, 0 ];
const s_4_6_7_10_22 = [ 4, 6, 7, 10, 22 ];
const s_9_10_11_32 = [ 9, 10, 11, 32 ];
const s_4_7_12_34_35_42 = [ 4, 7, 12, 34, 35, 42 ];
const s_30_32_36_41_42 = [ 30, 32, 36, 41, 42 ];
const s_4_6_7_9_10_14_26 = [ 4, 6, 7, 9, 10, 14, 26 ];
const s_30_31_35_41 = [ 30, 31, 35, 41 ];
const s_4_10_11_26_41_42 = [ 4, 10, 11, 26, 41, 42 ];
const s_18_31_32_0 = [ 18, 31, 32, 0 ];
const s_29_32_36 = [ 29, 32, 36 ];
const s_4_6_9_22 = [ 4, 6, 9, 22 ];
const s_17_18_1_0 = [ 17, 18, 1, 0 ];
const s_12_24 = [ 12, 24 ];
const s_10_33_35_37 = [ 10, 33, 35, 37 ];
const s_4_12_19 = [ 4, 12, 19 ];
const s_32_34_42 = [ 32, 34, 42 ];
const s_10_30_32_33_36 = [ 10, 30, 32, 33, 36 ];
const s_7_14_15_18_21_23_31_32_40_41 = [ 7, 14, 15, 18, 21, 23, 31, 32, 40, 41 ];
const s_4_30_35 = [ 4, 30, 35 ];
const s_21_24_1 = [ 21, 24, 1 ];
const s_24_27 = [ 24, 27 ];
const s_4_6_7_14_19_26 = [ 4, 6, 7, 14, 19, 26 ];
const s_4_7_9_10_11_19 = [ 4, 7, 9, 10, 11, 19 ];
const s_7_10_30_31_32_39 = [ 7, 10, 30, 31, 32, 39 ];
const s_4_7_15_38_41 = [ 4, 7, 15, 38, 41 ];
const s_7_9_21 = [ 7, 9, 21 ];
const s_4_7_9_12_26_31_41 = [ 4, 7, 9, 12, 26, 31, 41 ];
const s_4_11_26_28_42 = [ 4, 11, 26, 28, 42 ];
const s_4_7_10_19 = [ 4, 7, 10, 19 ];
const s_4_6_10_24_26_28_29_30_32_35_41_42 = [ 4, 6, 10, 24, 26, 28, 29, 30, 32, 35, 41, 42 ];
const s_4_6_26_28 = [ 4, 6, 26, 28 ];
const s_4_6_7_9_26 = [ 4, 6, 7, 9, 26 ];
const s_10_11_19_30_42 = [ 10, 11, 19, 30, 42 ];
const s_9_11_26_0 = [ 9, 11, 26, 0 ];
const s_10_30_32_41 = [ 10, 30, 32, 41 ];
const s_4_40_42_2 = [ 4, 40, 42, 2 ];
const s_31_40_41_42 = [ 31, 40, 41, 42 ];
const s_6_18_21 = [ 6, 18, 21 ];
const s_4_32_35_40 = [ 4, 32, 35, 40 ];
const s_18_30_42 = [ 18, 30, 42 ];
const s_4_7_9_17_28 = [ 4, 7, 9, 17, 28 ];
const s_35_41_42_0 = [ 35, 41, 42, 0 ];
const s_5_8_17 = [ 5, 8, 17 ];
const s_29_33_35_37_38_40_41 = [ 29, 33, 35, 37, 38, 40, 41 ];
const s_32_35_38 = [ 32, 35, 38 ];
const s_4_6_10_15_32_38 = [ 4, 6, 10, 15, 32, 38 ];
const s_31_35_40 = [ 31, 35, 40 ];
const s_4_6_30_35_40 = [ 4, 6, 30, 35, 40 ];
const s_32_38_0 = [ 32, 38, 0 ];
const s_30_32_38_0 = [ 30, 32, 38, 0 ];
const s_4_6_10_11_21_30_32_35_36_38_40_41 = [ 4, 6, 10, 11, 21, 30, 32, 35, 36, 38, 40, 41 ];
const s_30_38_39_42 = [ 30, 38, 39, 42 ];
const s_6_18_37 = [ 6, 18, 37 ];
const s_4_9_12_37 = [ 4, 9, 12, 37 ];
const s_4_6_11_24_30_31_32_0 = [ 4, 6, 11, 24, 30, 31, 32, 0 ];
const s_4_9_10_21_31_32 = [ 4, 9, 10, 21, 31, 32 ];
const s_4_37_39_41 = [ 4, 37, 39, 41 ];
const s_4_7_10_11_21_32_40_41 = [ 4, 7, 10, 11, 21, 32, 40, 41 ];
const s_8_25_1 = [ 8, 25, 1 ];
const s_4_7_10_28 = [ 4, 7, 10, 28 ];
const s_6_8_10_13_32_36 = [ 6, 8, 10, 13, 32, 36 ];
const s_6_10_17 = [ 6, 10, 17 ];
const s_14_26_29_35 = [ 14, 26, 29, 35 ];
const s_6_10_31_32_35 = [ 6, 10, 31, 32, 35 ];
const s_4_6_32_35_38_42 = [ 4, 6, 32, 35, 38, 42 ];
const s_6_8_17_25_30_35_36_42 = [ 6, 8, 17, 25, 30, 35, 36, 42 ];
const s_10_18_36_39 = [ 10, 18, 36, 39 ];
const s_4_11_35_38_39 = [ 4, 11, 35, 38, 39 ];
const s_4_6_30_35_40_41 = [ 4, 6, 30, 35, 40, 41 ];
const s_4_6_7_8_14_15_21_30_38_41_0_2 = [ 4, 6, 7, 8, 14, 15, 21, 30, 38, 41, 0, 2 ];
const s_6_25_38_40_42 = [ 6, 25, 38, 40, 42 ];
const s_10_27_36_42 = [ 10, 27, 36, 42 ];
const s_6_7_11_14_17_25_32_35_39 = [ 6, 7, 11, 14, 17, 25, 32, 35, 39 ];
const s_5_6_8_25 = [ 5, 6, 8, 25 ];
const s_4_27_29_35 = [ 4, 27, 29, 35 ];
const s_4_11_17_18_32_35_38_40 = [ 4, 11, 17, 18, 32, 35, 38, 40 ];
const s_4_10_32_38 = [ 4, 10, 32, 38 ];
const s_11_38_39 = [ 11, 38, 39 ];
const s_4_7_11_17_29_30_33_37_38_41_42 = [ 4, 7, 11, 17, 29, 30, 33, 37, 38, 41, 42 ];
const s_4_7_26_41 = [ 4, 7, 26, 41 ];
const s_18_33_42 = [ 18, 33, 42 ];
const s_5_6_8_35 = [ 5, 6, 8, 35 ];
const s_10_11_29_32_38 = [ 10, 11, 29, 32, 38 ];
const s_10_11_2_0 = [ 10, 11, 2, 0 ];
const s_9_13_30_32_0 = [ 9, 13, 30, 32, 0 ];
const s_4_10_13_17_18_27_38 = [ 4, 10, 13, 17, 18, 27, 38 ];
const s_6_10_20_35_38 = [ 6, 10, 20, 35, 38 ];
const s_5_6_8_23 = [ 5, 6, 8, 23 ];
const s_4_6_10_11_13_21_25_29_30_32_35_38_39_40_42 = [ 4, 6, 10, 11, 13, 21, 25, 29, 30, 32, 35, 38, 39, 40, 42 ];
const s_4_5_6_11 = [ 4, 5, 6, 11 ];
const s_7_10_26_32_37_41_1 = [ 7, 10, 26, 32, 37, 41, 1 ];
const s_4_11_18_33_38 = [ 4, 11, 18, 33, 38 ];
const s_6_10_17_35 = [ 6, 10, 17, 35 ];
const s_5_6_41 = [ 5, 6, 41 ];
const s_6_14_23_26_42 = [ 6, 14, 23, 26, 42 ];
const s_8_10_14_15_18_20_23_30_35_41_42 = [ 8, 10, 14, 15, 18, 20, 23, 30, 35, 41, 42 ];
const s_15_20_26 = [ 15, 20, 26 ];
const s_6_20_26 = [ 6, 20, 26 ];
const s_10_22_26_29_30 = [ 10, 22, 26, 29, 30 ];
const s_30_33_38_41 = [ 30, 33, 38, 41 ];
const s_4_7_11_24 = [ 4, 7, 11, 24 ];
const s_15_36_0_2 = [ 15, 36, 0, 2 ];
const s_6_27_35_36 = [ 6, 27, 35, 36 ];
const s_4_6_25 = [ 4, 6, 25 ];
const s_4_6_10_13_15_17_28_29_30_32_38_0_2 = [ 4, 6, 10, 13, 15, 17, 28, 29, 30, 32, 38, 0, 2 ];
const s_29_37_38 = [ 29, 37, 38 ];
const s_11_14_33_35 = [ 11, 14, 33, 35 ];
const s_6_15_38 = [ 6, 15, 38 ];
const s_4_6_7_10_14_17_38 = [ 4, 6, 7, 10, 14, 17, 38 ];
const s_5_6_1_0 = [ 5, 6, 1, 0 ];
const s_4_9_35_39 = [ 4, 9, 35, 39 ];
const s_6_11_27_30_0 = [ 6, 11, 27, 30, 0 ];
const s_10_27_32 = [ 10, 27, 32 ];
const s_14_25_35 = [ 14, 25, 35 ];
const s_6_12_13_20_37 = [ 6, 12, 13, 20, 37 ];
const s_4_5_6_8_33 = [ 4, 5, 6, 8, 33 ];
const s_4_6_35_37_38 = [ 4, 6, 35, 37, 38 ];
const s_4_6_11_22_26_30_35_40_41 = [ 4, 6, 11, 22, 26, 30, 35, 40, 41 ];
const s_6_9_10_26_28_30_31_32_36_41_42 = [ 6, 9, 10, 26, 28, 30, 31, 32, 36, 41, 42 ];
const s_4_13_0 = [ 4, 13, 0 ];
const s_4_6_11_32_39 = [ 4, 6, 11, 32, 39 ];
const s_4_26_35 = [ 4, 26, 35 ];
const s_5_8_13 = [ 5, 8, 13 ];
const s_4_7_11_14_17_23_26_28_30_33_35_36_38_40_41_42 = [ 4, 7, 11, 14, 17, 23, 26, 28, 30, 33, 35, 36, 38, 40, 41, 42 ];
const s_4_11_26_35 = [ 4, 11, 26, 35 ];
const s_4_11_12_18_20_30_33_36_38_0 = [ 4, 11, 12, 18, 20, 30, 33, 36, 38, 0 ];
const s_20_22_26_27_30_0 = [ 20, 22, 26, 27, 30, 0 ];
const s_11_39_40 = [ 11, 39, 40 ];
const s_4_25_26_35_42 = [ 4, 25, 26, 35, 42 ];
const s_10_12_18 = [ 10, 12, 18 ];
const s_5_6_7_27_0 = [ 5, 6, 7, 27, 0 ];
const s_8_18_20_25 = [ 8, 18, 20, 25 ];
const s_4_6_13_23_25_35_40_41 = [ 4, 6, 13, 23, 25, 35, 40, 41 ];
const s_4_11_21_35_40 = [ 4, 11, 21, 35, 40 ];
const s_5_6_13_17_32_35 = [ 5, 6, 13, 17, 32, 35 ];
const s_4_10_33_38 = [ 4, 10, 33, 38 ];
const s_4_6_15_26 = [ 4, 6, 15, 26 ];
const s_25_38 = [ 25, 38 ];
const s_20_30_0 = [ 20, 30, 0 ];
const s_5_7_13_17_0 = [ 5, 7, 13, 17, 0 ];
const s_9_10_13_27_30_35_39_0 = [ 9, 10, 13, 27, 30, 35, 39, 0 ];
const s_10_32_34_39 = [ 10, 32, 34, 39 ];
const s_4_21_35_41 = [ 4, 21, 35, 41 ];
const s_4_6_29_41 = [ 4, 6, 29, 41 ];
const s_4_10_20_38 = [ 4, 10, 20, 38 ];
const s_9_17_34 = [ 9, 17, 34 ];
const s_4_7_10_32_41 = [ 4, 7, 10, 32, 41 ];
const s_7_18_27_35 = [ 7, 18, 27, 35 ];
const s_6_30_32_35_41 = [ 6, 30, 32, 35, 41 ];
const s_19_35 = [ 19, 35 ];
const s_13_35_36 = [ 13, 35, 36 ];
const s_6_18_27_35_40 = [ 6, 18, 27, 35, 40 ];
const s_4_5 = [ 4, 5 ];
const s_5_13_27 = [ 5, 13, 27 ];
const s_6_17_18_32_0 = [ 6, 17, 18, 32, 0 ];
const s_4_12_21_26 = [ 4, 12, 21, 26 ];
const s_34_37_42 = [ 34, 37, 42 ];
const s_13_30_35_41 = [ 13, 30, 35, 41 ];
const s_13_30_0 = [ 13, 30, 0 ];
const s_18_32_33_0 = [ 18, 32, 33, 0 ];
const s_4_30_32_40_41 = [ 4, 30, 32, 40, 41 ];
const s_9_37_39 = [ 9, 37, 39 ];
const s_26_32_42 = [ 26, 32, 42 ];
const s_8_18_29_41 = [ 8, 18, 29, 41 ];
const s_4_26_30_32 = [ 4, 26, 30, 32 ];
const s_5_6_10_17_20_24_30_35_36_38_40_42 = [ 5, 6, 10, 17, 20, 24, 30, 35, 36, 38, 40, 42 ];
const s_5_13_25_30_33_35_36 = [ 5, 13, 25, 30, 33, 35, 36 ];
const s_8_30_40 = [ 8, 30, 40 ];
const s_4_6_31_32_35_38_39_42 = [ 4, 6, 31, 32, 35, 38, 39, 42 ];
const s_40_41_0 = [ 40, 41, 0 ];
const s_7_26_35 = [ 7, 26, 35 ];
const s_4_7_30_35_38 = [ 4, 7, 30, 35, 38 ];
const s_4_11_19_22_23 = [ 4, 11, 19, 22, 23 ];
const s_30_34_35 = [ 30, 34, 35 ];
const s_5_18_27 = [ 5, 18, 27 ];
const s_6_9_10_11_15_26 = [ 6, 9, 10, 11, 15, 26 ];
const s_7_9_29_39 = [ 7, 9, 29, 39 ];
const s_9_10_14_31 = [ 9, 10, 14, 31 ];
const s_26_1_0 = [ 26, 1, 0 ];
const s_4_18_35 = [ 4, 18, 35 ];
const s_6_9_14_28_38_41 = [ 6, 9, 14, 28, 38, 41 ];
const s_30_39_43 = [ 30, 39, 43 ];
const s_7_9_11_19 = [ 7, 9, 11, 19 ];
const s_5_13_30_33_35 = [ 5, 13, 30, 33, 35 ];
const s_6_10_23_25_33_35 = [ 6, 10, 23, 25, 33, 35 ];
const s_7_26_30 = [ 7, 26, 30 ];
const s_4_9_10_12_14_16_23_25_26_31_32_33_35_36 = [ 4, 9, 10, 12, 14, 16, 23, 25, 26, 31, 32, 33, 35, 36 ];
const s_13_25_35_41_1_0 = [ 13, 25, 35, 41, 1, 0 ];
const s_15_30_35 = [ 15, 30, 35 ];
const s_6_18_26_30_35_41 = [ 6, 18, 26, 30, 35, 41 ];
const s_4_30_35_38 = [ 4, 30, 35, 38 ];
const s_4_6_17_27_30_32_40 = [ 4, 6, 17, 27, 30, 32, 40 ];
const s_7_10_11_26_35_36_38 = [ 7, 10, 11, 26, 35, 36, 38 ];
const s_10_11_17 = [ 10, 11, 17 ];
const s_7_10_11_13_15_18_21_25_26_35_39_41 = [ 7, 10, 11, 13, 15, 18, 21, 25, 26, 35, 39, 41 ];
const s_4_5_10_18 = [ 4, 5, 10, 18 ];
const s_6_14_31_33_35_39_41 = [ 6, 14, 31, 33, 35, 39, 41 ];
const s_4_6_18_33_35 = [ 4, 6, 18, 33, 35 ];
const s_10_25_30 = [ 10, 25, 30 ];
const s_4_14_29_35_41_0 = [ 4, 14, 29, 35, 41, 0 ];
const s_11_35_39 = [ 11, 35, 39 ];
const s_9_12_23_32_37_42 = [ 9, 12, 23, 32, 37, 42 ];
const s_4_6_35_36 = [ 4, 6, 35, 36 ];
const s_6_32_33 = [ 6, 32, 33 ];
const s_17_19_23 = [ 17, 19, 23 ];
const s_5_6_10_18_27_31_33_35 = [ 5, 6, 10, 18, 27, 31, 33, 35 ];
const s_6_15_25_35 = [ 6, 15, 25, 35 ];
const s_4_9_22_31_35_39 = [ 4, 9, 22, 31, 35, 39 ];
const s_28_30_39 = [ 28, 30, 39 ];
const s_6_7_8_15_35_40_41_42 = [ 6, 7, 8, 15, 35, 40, 41, 42 ];
const s_24_0_2 = [ 24, 0, 2 ];
const s_14_24_28_0 = [ 14, 24, 28, 0 ];
const s_24_25 = [ 24, 25 ];
const s_4_6_10_18_23_24_28_41_0_2 = [ 4, 6, 10, 18, 23, 24, 28, 41, 0, 2 ];
const s_29_39 = [ 29, 39 ];
const s_4_6_9_10_13_14_15_17_23_35 = [ 4, 6, 9, 10, 13, 14, 15, 17, 23, 35 ];
const s_6_9_14_15_23_25 = [ 6, 9, 14, 15, 23, 25 ];
const s_32_35_40_0 = [ 32, 35, 40, 0 ];
const s_4_6_10_12_14_21_26 = [ 4, 6, 10, 12, 14, 21, 26 ];
const s_15_31_32_33_35_36_38_39_41 = [ 15, 31, 32, 33, 35, 36, 38, 39, 41 ];
const s_8_9_18_20_30_31_35_36_40 = [ 8, 9, 18, 20, 30, 31, 35, 36, 40 ];
const s_11_32_35_38_40_41 = [ 11, 32, 35, 38, 40, 41 ];
const s_30_37_42 = [ 30, 37, 42 ];
const s_6_17_35 = [ 6, 17, 35 ];
const s_18_30_35_41 = [ 18, 30, 35, 41 ];
const s_4_14_22 = [ 4, 14, 22 ];
const s_6_17_33 = [ 6, 17, 33 ];
const s_4_9_10_14_22 = [ 4, 9, 10, 14, 22 ];
const s_9_18_1 = [ 9, 18, 1 ];
const s_4_32_40_41_42 = [ 4, 32, 40, 41, 42 ];
const s_4_11_18 = [ 4, 11, 18 ];
const s_32_33_35_38_40 = [ 32, 33, 35, 38, 40 ];
const s_9_12_18_26 = [ 9, 12, 18, 26 ];
const s_9_10_31_39 = [ 9, 10, 31, 39 ];
const s_4_10_28_32 = [ 4, 10, 28, 32 ];
const s_6_10_30_31_35_38_41_42_0 = [ 6, 10, 30, 31, 35, 38, 41, 42, 0 ];
const s_4_7_11_15_26 = [ 4, 7, 11, 15, 26 ];
const s_5_7_27 = [ 5, 7, 27 ];
const s_14_28 = [ 14, 28 ];
const s_4_6_7_11_14_31_32 = [ 4, 6, 7, 11, 14, 31, 32 ];
const s_9_10_11_14_24 = [ 9, 10, 11, 14, 24 ];
const s_4_33_34_35_41_42 = [ 4, 33, 34, 35, 41, 42 ];
const s_4_6_7_14_18_30_35_41 = [ 4, 6, 7, 14, 18, 30, 35, 41 ];
const s_4_10_14_28 = [ 4, 10, 14, 28 ];
const s_4_6_9_11_14_18_22_28_29_30_31_32_33_35_36_38_0 = [ 4, 6, 9, 11, 14, 18, 22, 28, 29, 30, 31, 32, 33, 35, 36, 38, 0 ];
const s_6_30_31_32_33_35_38_40 = [ 6, 30, 31, 32, 33, 35, 38, 40 ];
const s_4_9_10_14_15 = [ 4, 9, 10, 14, 15 ];
const s_4_7_12_14_31_37 = [ 4, 7, 12, 14, 31, 37 ];
const s_6_7_9_10_23_26_30_35_36_43 = [ 6, 7, 9, 10, 23, 26, 30, 35, 36, 43 ];
const s_7_9_10_12_15_18_26_38_42_43 = [ 7, 9, 10, 12, 15, 18, 26, 38, 42, 43 ];
const s_5_6_8_10_19_33_40 = [ 5, 6, 8, 10, 19, 33, 40 ];
const s_4_6_17_27_38 = [ 4, 6, 17, 27, 38 ];
const s_4_10_13_27_29_30_32_37_38 = [ 4, 10, 13, 27, 29, 30, 32, 37, 38 ];
const s_4_11_1 = [ 4, 11, 1 ];
const s_17_30_0 = [ 17, 30, 0 ];
const s_6_18_32_36_0 = [ 6, 18, 32, 36, 0 ];
const s_11_12_26_33_37_41 = [ 11, 12, 26, 33, 37, 41 ];
const s_15_35 = [ 15, 35 ];
const s_4_5_6_8_13_35 = [ 4, 5, 6, 8, 13, 35 ];
const s_3_7_8_9_14_26_30_31_36 = [ 3, 7, 8, 9, 14, 26, 30, 31, 36 ];
const s_4_6_21_32_40_42 = [ 4, 6, 21, 32, 40, 42 ];
const s_4_10_24_0 = [ 4, 10, 24, 0 ];
const s_5_18_33_41 = [ 5, 18, 33, 41 ];
const s_6_10_0_2 = [ 6, 10, 0, 2 ];
const s_30_35_39 = [ 30, 35, 39 ];
const s_4_29_35_40 = [ 4, 29, 35, 40 ];
const s_6_19_30_35 = [ 6, 19, 30, 35 ];
const s_19_22 = [ 19, 22 ];
const s_38_2_0 = [ 38, 2, 0 ];
const s_6_10_17_25_35_43 = [ 6, 10, 17, 25, 35, 43 ];
const s_5_6_17_20_27_30_33_35_36 = [ 5, 6, 17, 20, 27, 30, 33, 35, 36 ];
const s_6_21_26_40_42 = [ 6, 21, 26, 40, 42 ];
const s_5_6_33_39 = [ 5, 6, 33, 39 ];
const s_4_6_11_14_17_28_30_32_38 = [ 4, 6, 11, 14, 17, 28, 30, 32, 38 ];
const s_11_42_43 = [ 11, 42, 43 ];
const s_4_6_11_36_38 = [ 4, 6, 11, 36, 38 ];
const s_8_10_13_38 = [ 8, 10, 13, 38 ];
const s_7_35_37_39_42_43 = [ 7, 35, 37, 39, 42, 43 ];
const s_5_17_26 = [ 5, 17, 26 ];
const s_9_14_1 = [ 9, 14, 1 ];
const s_6_11_35_39_41 = [ 6, 11, 35, 39, 41 ];
const s_7_10_18_22_23_27_29_32 = [ 7, 10, 18, 22, 23, 27, 29, 32 ];
const s_4_12_29_38 = [ 4, 12, 29, 38 ];
const s_4_18_35_38 = [ 4, 18, 35, 38 ];
const s_14_17_30 = [ 14, 17, 30 ];
const s_4_6_11_12_14_26_29_35_37 = [ 4, 6, 11, 12, 14, 26, 29, 35, 37 ];
const s_4_20_29_30_31_32_33_34_35_38_39_41_43 = [ 4, 20, 29, 30, 31, 32, 33, 34, 35, 38, 39, 41, 43 ];
const s_4_6_32_40_41 = [ 4, 6, 32, 40, 41 ];
const s_6_17_35_38_42 = [ 6, 17, 35, 38, 42 ];
const s_4_6_36_41_0_2 = [ 4, 6, 36, 41, 0, 2 ];
const s_4_6_9_10_18_23_26_0 = [ 4, 6, 9, 10, 18, 23, 26, 0 ];
const s_6_8_13_35 = [ 6, 8, 13, 35 ];
const s_4_10_31_32_33_36_38_39 = [ 4, 10, 31, 32, 33, 36, 38, 39 ];
const s_4_6_11_14_18_19_29_34_35_40_43 = [ 4, 6, 11, 14, 18, 19, 29, 34, 35, 40, 43 ];
const s_5_13_18_33 = [ 5, 13, 18, 33 ];
const s_18_30_38 = [ 18, 30, 38 ];
const s_6_8_38 = [ 6, 8, 38 ];
const s_4_35_38_0 = [ 4, 35, 38, 0 ];
const s_33_2 = [ 33, 2 ];
const s_14_29_0 = [ 14, 29, 0 ];
const s_29_37_39 = [ 29, 37, 39 ];
const s_6_8_9_10_11_13_14_15_17_33_0 = [ 6, 8, 9, 10, 11, 13, 14, 15, 17, 33, 0 ];
const s_4_6_15_41 = [ 4, 6, 15, 41 ];
const s_6_31_35_41 = [ 6, 31, 35, 41 ];
const s_31_35_38 = [ 31, 35, 38 ];
const s_4_9_10_23_39 = [ 4, 9, 10, 23, 39 ];
const s_6_10_11_15_24_26_32_35_41_0 = [ 6, 10, 11, 15, 24, 26, 32, 35, 41, 0 ];
const s_10_16_19_32_0 = [ 10, 16, 19, 32, 0 ];
const s_6_15_36_39 = [ 6, 15, 36, 39 ];
const s_6_7_21_27_30_35_0 = [ 6, 7, 21, 27, 30, 35, 0 ];
const s_4_7_10_18_24_41 = [ 4, 7, 10, 18, 24, 41 ];
const s_4_23_35_0 = [ 4, 23, 35, 0 ];
const s_6_14_23 = [ 6, 14, 23 ];
const s_4_10_32_38_0 = [ 4, 10, 32, 38, 0 ];
const s_6_17_22_30_35_38 = [ 6, 17, 22, 30, 35, 38 ];
const s_11_12 = [ 11, 12 ];
const s_5_6_35_38 = [ 5, 6, 35, 38 ];
const s_5_6_10_18 = [ 5, 6, 10, 18 ];
const s_33_35_38_39_41_42 = [ 33, 35, 38, 39, 41, 42 ];
const s_10_15_40 = [ 10, 15, 40 ];
const s_4_10_14_0 = [ 4, 10, 14, 0 ];
const s_7_26_27_30_31_35_0 = [ 7, 26, 27, 30, 31, 35, 0 ];
const s_11_30_32_37 = [ 11, 30, 32, 37 ];
const s_4_27_38 = [ 4, 27, 38 ];
const s_5_6_38 = [ 5, 6, 38 ];
const s_6_8_11_23 = [ 6, 8, 11, 23 ];
const s_10_17_31_35_38_39_0 = [ 10, 17, 31, 35, 38, 39, 0 ];
const s_5_6_8_13_18_26_35_38 = [ 5, 6, 8, 13, 18, 26, 35, 38 ];
const s_4_31_35_38_42 = [ 4, 31, 35, 38, 42 ];
const s_11_36_39 = [ 11, 36, 39 ];
const s_6_18_20_32_35_38_42 = [ 6, 18, 20, 32, 35, 38, 42 ];
const s_5_6_11_18_33 = [ 5, 6, 11, 18, 33 ];
const s_6_7_17_22_27_30_31_41_0 = [ 6, 7, 17, 22, 27, 30, 31, 41, 0 ];
const s_10_11_35_38 = [ 10, 11, 35, 38 ];
const s_7_9_31_38_42 = [ 7, 9, 31, 38, 42 ];
const s_4_11_35_2 = [ 4, 11, 35, 2 ];
const s_4_10_17_26_30_35_38 = [ 4, 10, 17, 26, 30, 35, 38 ];
const s_6_10_27_31_35_41 = [ 6, 10, 27, 31, 35, 41 ];
const s_4_11_30_35 = [ 4, 11, 30, 35 ];
const s_26_28_29_42 = [ 26, 28, 29, 42 ];
const s_4_6_13_17_21_26_33_35 = [ 4, 6, 13, 17, 21, 26, 33, 35 ];
const s_6_7_10_29_35_0 = [ 6, 7, 10, 29, 35, 0 ];
const s_4_6_10_11_38 = [ 4, 6, 10, 11, 38 ];
const s_4_5_18 = [ 4, 5, 18 ];
const s_4_31_0 = [ 4, 31, 0 ];
const s_6_13_35_38 = [ 6, 13, 35, 38 ];
const s_4_6_7_11_15_18_20_27_30_31_38_40 = [ 4, 6, 7, 11, 15, 18, 20, 27, 30, 31, 38, 40 ];
const s_6_8_17_25_35 = [ 6, 8, 17, 25, 35 ];
const s_17_30_41 = [ 17, 30, 41 ];
const s_10_13_27_34_35_38 = [ 10, 13, 27, 34, 35, 38 ];
const s_7_17_38 = [ 7, 17, 38 ];
const s_35_38_39 = [ 35, 38, 39 ];
const s_6_10_17_26_28_31 = [ 6, 10, 17, 26, 28, 31 ];
const s_4_5_7 = [ 4, 5, 7 ];
const s_7_18_38 = [ 7, 18, 38 ];
const s_17_26_29 = [ 17, 26, 29 ];
const s_4_5_6_13_18_21_23_35_41 = [ 4, 5, 6, 13, 18, 21, 23, 35, 41 ];
const s_6_30_38_43 = [ 6, 30, 38, 43 ];
const s_22_26_30_38 = [ 22, 26, 30, 38 ];
const s_7_10_30_32_36 = [ 7, 10, 30, 32, 36 ];
const s_27_35_39 = [ 27, 35, 39 ];
const s_4_6_9_11_34_35_39_2 = [ 4, 6, 9, 11, 34, 35, 39, 2 ];
const s_7_8_0_2 = [ 7, 8, 0, 2 ];
const s_26_39_0 = [ 26, 39, 0 ];
const s_4_11_30_33_35_37_38_40_2 = [ 4, 11, 30, 33, 35, 37, 38, 40, 2 ];
const s_9_23 = [ 9, 23 ];
const s_4_7_8_10_32_35 = [ 4, 7, 8, 10, 32, 35 ];
const s_4_7_9_26_31_39 = [ 4, 7, 9, 26, 31, 39 ];
const s_4_7_32_35 = [ 4, 7, 32, 35 ];
const s_4_6_7_10_19_22_34_43 = [ 4, 6, 7, 10, 19, 22, 34, 43 ];
const s_11_30_37 = [ 11, 30, 37 ];
const s_4_35_40_0 = [ 4, 35, 40, 0 ];
const s_19_26_35_42 = [ 19, 26, 35, 42 ];
const s_7_11_35 = [ 7, 11, 35 ];
const s_4_10_20_26_27_29_30 = [ 4, 10, 20, 26, 27, 29, 30 ];
const s_4_30_0 = [ 4, 30, 0 ];
const s_9_17_20_25_35_40 = [ 9, 17, 20, 25, 35, 40 ];
const s_5_6_17_18_38_42 = [ 5, 6, 17, 18, 38, 42 ];
const s_4_6_7_11_13_28_30_32_35_37_38_39 = [ 4, 6, 7, 11, 13, 28, 30, 32, 35, 37, 38, 39 ];
const s_5_6_13_18 = [ 5, 6, 13, 18 ];
const s_6_9_32_35 = [ 6, 9, 32, 35 ];
const s_9_10_30_32_35 = [ 9, 10, 30, 32, 35 ];
const s_4_8_10_35 = [ 4, 8, 10, 35 ];
const s_18_38_40_41_0 = [ 18, 38, 40, 41, 0 ];
const s_4_5_32_33 = [ 4, 5, 32, 33 ];
const s_18_32_40 = [ 18, 32, 40 ];
const s_4_29_32 = [ 4, 29, 32 ];
const s_4_11_29 = [ 4, 11, 29 ];
const s_10_29_32_34 = [ 10, 29, 32, 34 ];
const s_6_18_19_27_32_43 = [ 6, 18, 19, 27, 32, 43 ];
const s_6_13_20_30_35 = [ 6, 13, 20, 30, 35 ];
const s_5_19 = [ 5, 19 ];
const s_4_10_32_0 = [ 4, 10, 32, 0 ];
const s_4_6_23_27_29_39_0 = [ 4, 6, 23, 27, 29, 39, 0 ];
const s_4_22_30_34_35_40 = [ 4, 22, 30, 34, 35, 40 ];
const s_6_21_29 = [ 6, 21, 29 ];
const s_4_18_26_29 = [ 4, 18, 26, 29 ];
const s_17_18_27_35 = [ 17, 18, 27, 35 ];
const s_30_32_35_39_42 = [ 30, 32, 35, 39, 42 ];
const s_15_17_26_27_35 = [ 15, 17, 26, 27, 35 ];
const s_5_18_33 = [ 5, 18, 33 ];
const s_5_6_8_13_30_0 = [ 5, 6, 8, 13, 30, 0 ];
const s_25_26_27_0 = [ 25, 26, 27, 0 ];
const s_4_10_36_38_2_0 = [ 4, 10, 36, 38, 2, 0 ];
const s_4_9_10_14_27 = [ 4, 9, 10, 14, 27 ];
const s_8_18_20 = [ 8, 18, 20 ];
const s_4_10_11_14_21 = [ 4, 10, 11, 14, 21 ];
const s_4_10_13_30_35_40 = [ 4, 10, 13, 30, 35, 40 ];
const s_5_13_20_0 = [ 5, 13, 20, 0 ];
const s_9_12_26_37 = [ 9, 12, 26, 37 ];
const s_7_9_18_22_31_41 = [ 7, 9, 18, 22, 31, 41 ];
const s_3_4_10_12_18 = [ 3, 4, 10, 12, 18 ];
const s_7_9_10_11_17_19_30_32_39_0 = [ 7, 9, 10, 11, 17, 19, 30, 32, 39, 0 ];
const s_13_26_27_29 = [ 13, 26, 27, 29 ];
const s_7_9_13_30_39_0 = [ 7, 9, 13, 30, 39, 0 ];
const s_6_9_10_15_17_18_22_31_40 = [ 6, 9, 10, 15, 17, 18, 22, 31, 40 ];
const s_4_13_18_30_34_35 = [ 4, 13, 18, 30, 34, 35 ];
const s_5_32_35 = [ 5, 32, 35 ];
const s_3_6_10_15_25_28_38 = [ 3, 6, 10, 15, 25, 28, 38 ];
const s_10_13_32 = [ 10, 13, 32 ];
const s_4_6_7_23_28_42 = [ 4, 6, 7, 23, 28, 42 ];
const s_6_36_39 = [ 6, 36, 39 ];
const s_4_6_27_32_35_40 = [ 4, 6, 27, 32, 35, 40 ];
const s_4_6_34_40_41_0 = [ 4, 6, 34, 40, 41, 0 ];
const s_7_11_17_18_19_23_36_43 = [ 7, 11, 17, 18, 19, 23, 36, 43 ];
const s_7_11_30_43 = [ 7, 11, 30, 43 ];
const s_5_6_10_29_32_35_43 = [ 5, 6, 10, 29, 32, 35, 43 ];
const s_4_11_35_43 = [ 4, 11, 35, 43 ];
const s_5_29_36 = [ 5, 29, 36 ];
const s_6_14_18_41 = [ 6, 14, 18, 41 ];
const s_10_13_0 = [ 10, 13, 0 ];
const s_7_23_27_35 = [ 7, 23, 27, 35 ];
const s_4_6_7_24_28_30_38 = [ 4, 6, 7, 24, 28, 30, 38 ];
const s_10_26_28_30_32_36_41 = [ 10, 26, 28, 30, 32, 36, 41 ];
const s_29_32_37 = [ 29, 32, 37 ];
const s_6_9_15_25_26 = [ 6, 9, 15, 25, 26 ];
const s_7_13_27_30_39 = [ 7, 13, 27, 30, 39 ];
const s_6_11_20_30_35_41 = [ 6, 11, 20, 30, 35, 41 ];
const s_4_6_27_30_32_35_38 = [ 4, 6, 27, 30, 32, 35, 38 ];
const s_4_11_30_32_35_36_38 = [ 4, 11, 30, 32, 35, 36, 38 ];
const s_5_6_8_20_25 = [ 5, 6, 8, 20, 25 ];
const s_4_6_22_25_38_42_0 = [ 4, 6, 22, 25, 38, 42, 0 ];
const s_7_10_18_26_30 = [ 7, 10, 18, 26, 30 ];
const s_4_6_8_17_29_32_35_43 = [ 4, 6, 8, 17, 29, 32, 35, 43 ];
const s_4_7_11_23_26_35_38_39 = [ 4, 7, 11, 23, 26, 35, 38, 39 ];
const s_6_11_30_39 = [ 6, 11, 30, 39 ];
const s_11_23_35 = [ 11, 23, 35 ];
const s_6_30_38_0 = [ 6, 30, 38, 0 ];
const s_6_17_29 = [ 6, 17, 29 ];
const s_4_6_13_15_17_21_23_30_35_38_41_0 = [ 4, 6, 13, 15, 17, 21, 23, 30, 35, 38, 41, 0 ];
const s_4_10_39_40 = [ 4, 10, 39, 40 ];
const s_4_21_30_35_37_41 = [ 4, 21, 30, 35, 37, 41 ];
const s_4_22_23 = [ 4, 22, 23 ];
const s_5_18_27_35_40 = [ 5, 18, 27, 35, 40 ];
const s_9_18_37 = [ 9, 18, 37 ];
const s_4_10_18_38_42 = [ 4, 10, 18, 38, 42 ];
const s_4_6_7_10_15_23_26_30_35_39 = [ 4, 6, 7, 10, 15, 23, 26, 30, 35, 39 ];
const s_6_26_30 = [ 6, 26, 30 ];
const s_6_32_38 = [ 6, 32, 38 ];
const s_7_15_35_38 = [ 7, 15, 35, 38 ];
const s_6_11_23_27_35 = [ 6, 11, 23, 27, 35 ];
const s_4_6_7_10_11_13_32_35_38_42_0 = [ 4, 6, 7, 10, 11, 13, 32, 35, 38, 42, 0 ];
const s_4_6_7_15_17_28_29_32_38_42 = [ 4, 6, 7, 15, 17, 28, 29, 32, 38, 42 ];
const s_4_19_30_35_43 = [ 4, 19, 30, 35, 43 ];
const s_4_19_23 = [ 4, 19, 23 ];
const s_13_20_29_30 = [ 13, 20, 29, 30 ];
const s_20_29_30_0 = [ 20, 29, 30, 0 ];
const s_6_13_30_35 = [ 6, 13, 30, 35 ];
const s_6_10_20_25_35_37_41 = [ 6, 10, 20, 25, 35, 37, 41 ];
const s_10_11_29_30_32_38_39 = [ 10, 11, 29, 30, 32, 38, 39 ];
const s_18_32_39 = [ 18, 32, 39 ];
const s_5_6_13_0 = [ 5, 6, 13, 0 ];
const s_19_32_43 = [ 19, 32, 43 ];
const s_6_15_18_23_25_30_31_33_38_40_42_0_2 = [ 6, 15, 18, 23, 25, 30, 31, 33, 38, 40, 42, 0, 2 ];
const s_4_13_20_35 = [ 4, 13, 20, 35 ];
const s_4_23_35_42_0 = [ 4, 23, 35, 42, 0 ];
const s_4_11_39 = [ 4, 11, 39 ];
const s_4_11_18_21_26_35_38_40_41 = [ 4, 11, 18, 21, 26, 35, 38, 40, 41 ];
const s_6_10_30_35_38_39 = [ 6, 10, 30, 35, 38, 39 ];
const s_6_29_38 = [ 6, 29, 38 ];
const s_4_26_29_39_0 = [ 4, 26, 29, 39, 0 ];
const s_11_35_38 = [ 11, 35, 38 ];
const s_4_12_35 = [ 4, 12, 35 ];
const s_6_41_0 = [ 6, 41, 0 ];
const s_6_10_14_23_35 = [ 6, 10, 14, 23, 35 ];
const s_6_10_14_27_33 = [ 6, 10, 14, 27, 33 ];
const s_5_32_41 = [ 5, 32, 41 ];
const s_4_6_10_15_26_28_36 = [ 4, 6, 10, 15, 26, 28, 36 ];
const s_4_35_37_38 = [ 4, 35, 37, 38 ];
const s_4_7_10_26_27_30_35 = [ 4, 7, 10, 26, 27, 30, 35 ];
const s_6_10_21_33_35_41 = [ 6, 10, 21, 33, 35, 41 ];
const s_11_26_33 = [ 11, 26, 33 ];
const s_4_20_27_38 = [ 4, 20, 27, 38 ];
const s_4_6_11_30_38_41_42 = [ 4, 6, 11, 30, 38, 41, 42 ];
const s_6_10_14_21_25_30_31_35_36_38_39 = [ 6, 10, 14, 21, 25, 30, 31, 35, 36, 38, 39 ];
const s_4_11_38_41 = [ 4, 11, 38, 41 ];
const s_4_6_9_11_14_15_31_33_35_42 = [ 4, 6, 9, 11, 14, 15, 31, 33, 35, 42 ];
const s_6_9_10_21_23_0 = [ 6, 9, 10, 21, 23, 0 ];
const s_4_10_26_0 = [ 4, 10, 26, 0 ];
const s_9_10_17_18_25_30_36_42_0 = [ 9, 10, 17, 18, 25, 30, 36, 42, 0 ];
const s_6_38_0 = [ 6, 38, 0 ];
const s_36_39 = [ 36, 39 ];
const s_4_7_10_11_15_28_30_33_36_38_41_42 = [ 4, 7, 10, 11, 15, 28, 30, 33, 36, 38, 41, 42 ];
const s_4_6_13_18 = [ 4, 6, 13, 18 ];
const s_4_37_38 = [ 4, 37, 38 ];
const s_3_14_15_26_32 = [ 3, 14, 15, 26, 32 ];
const s_10_11_1_0 = [ 10, 11, 1, 0 ];
const s_6_7_15_26_33 = [ 6, 7, 15, 26, 33 ];
const s_6_10_30_40 = [ 6, 10, 30, 40 ];
const s_4_6_10_26_30_34_35_38_41_42 = [ 4, 6, 10, 26, 30, 34, 35, 38, 41, 42 ];
const s_18_30_35_0_2 = [ 18, 30, 35, 0, 2 ];
const s_4_21_33_38_40 = [ 4, 21, 33, 38, 40 ];
const s_27_30_35_37_38_43 = [ 27, 30, 35, 37, 38, 43 ];
const s_5_6_13_38 = [ 5, 6, 13, 38 ];
const s_30_33_41 = [ 30, 33, 41 ];
const s_6_18_30_33_35_41 = [ 6, 18, 30, 33, 35, 41 ];
const s_6_27_35_37 = [ 6, 27, 35, 37 ];
const s_5_10_38_41 = [ 5, 10, 38, 41 ];
const s_4_6_10_20_30_42 = [ 4, 6, 10, 20, 30, 42 ];
const s_8_14_25 = [ 8, 14, 25 ];
const s_4_6_10_11_23_26_30_35_38_40_41 = [ 4, 6, 10, 11, 23, 26, 30, 35, 38, 40, 41 ];
const s_6_8_18_0 = [ 6, 8, 18, 0 ];
const s_13_26_30_37 = [ 13, 26, 30, 37 ];
const s_4_6_8_13_20_31_32_35_36_38_42 = [ 4, 6, 8, 13, 20, 31, 32, 35, 36, 38, 42 ];
const s_6_10_20 = [ 6, 10, 20 ];
const s_8_18_0_2 = [ 8, 18, 0, 2 ];
const s_5_30_35 = [ 5, 30, 35 ];
const s_7_8_10_20 = [ 7, 8, 10, 20 ];
const s_6_7_30_37_0_2 = [ 6, 7, 30, 37, 0, 2 ];
const s_29_30_32_36_37_39 = [ 29, 30, 32, 36, 37, 39 ];
const s_4_26_32_35_37_39 = [ 4, 26, 32, 35, 37, 39 ];
const s_4_5_6_10_13 = [ 4, 5, 6, 10, 13 ];
const s_9_39_42 = [ 9, 39, 42 ];
const s_4_5_28_40 = [ 4, 5, 28, 40 ];
const s_4_12_26_35_36_37_38_39 = [ 4, 12, 26, 35, 36, 37, 38, 39 ];
const s_5_6_13_14_20_21_26_29_40_0 = [ 5, 6, 13, 14, 20, 21, 26, 29, 40, 0 ];
const s_8_12_31_34 = [ 8, 12, 31, 34 ];
const s_6_7_17_18_20_23_27_30_35_0 = [ 6, 7, 17, 18, 20, 23, 27, 30, 35, 0 ];
const s_18_29_36_38 = [ 18, 29, 36, 38 ];
const s_6_20_27_29_31_32 = [ 6, 20, 27, 29, 31, 32 ];
const s_4_6_10_11_15_26_30_33_35_38_41_42 = [ 4, 6, 10, 11, 15, 26, 30, 33, 35, 38, 41, 42 ];
const s_4_19_26_33_35_42_43 = [ 4, 19, 26, 33, 35, 42, 43 ];
const s_4_9_42 = [ 4, 9, 42 ];
const s_6_14_18_0_2 = [ 6, 14, 18, 0, 2 ];
const s_4_9_10_14_19_26_29_30_33_34_35_37 = [ 4, 9, 10, 14, 19, 26, 29, 30, 33, 34, 35, 37 ];
const s_17_26_0 = [ 17, 26, 0 ];
const s_6_9_15_17_27_38_40 = [ 6, 9, 15, 17, 27, 38, 40 ];
const s_6_29_30_35 = [ 6, 29, 30, 35 ];
const s_29_30_35_41 = [ 29, 30, 35, 41 ];
const s_6_7_27_35_0 = [ 6, 7, 27, 35, 0 ];
const s_5_32_38_0 = [ 5, 32, 38, 0 ];
const s_7_11_14_36_38 = [ 7, 11, 14, 36, 38 ];
const s_4_11_14_17_26_29_38_43 = [ 4, 11, 14, 17, 26, 29, 38, 43 ];
const s_6_10_19 = [ 6, 10, 19 ];
const s_19_44_0 = [ 19, 44, 0 ];
const s_10_19_26_32_37 = [ 10, 19, 26, 32, 37 ];
const s_4_6_7_17_28_29_30_35_38_42_0 = [ 4, 6, 7, 17, 28, 29, 30, 35, 38, 42, 0 ];
const s_30_1 = [ 30, 1 ];
const s_4_23_38 = [ 4, 23, 38 ];
const s_4_11_30_31_32_33_35_36_37_38_39_40_41_42 = [ 4, 11, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40, 41, 42 ];
const s_6_10_14_17_27_30_35_38 = [ 6, 10, 14, 17, 27, 30, 35, 38 ];
const s_4_6_10_17_29_30_35_40 = [ 4, 6, 10, 17, 29, 30, 35, 40 ];
const s_6_7_9_10_35 = [ 6, 7, 9, 10, 35 ];
const s_4_10_11_18_23_26_32_33_35 = [ 4, 10, 11, 18, 23, 26, 32, 33, 35 ];
const s_6_7_8_9_14_30 = [ 6, 7, 8, 9, 14, 30 ];
const s_6_10_17_29_30_35 = [ 6, 10, 17, 29, 30, 35 ];
const s_27_35_36 = [ 27, 35, 36 ];
const s_4_5_6_18_35_42 = [ 4, 5, 6, 18, 35, 42 ];
const s_4_6_9_10_18_31_39 = [ 4, 6, 9, 10, 18, 31, 39 ];
const s_6_7_9_10_21_27_30_34_35_38 = [ 6, 7, 9, 10, 21, 27, 30, 34, 35, 38 ];
const s_4_31_38_40 = [ 4, 31, 38, 40 ];
const s_6_8_20_30_31_33_38 = [ 6, 8, 20, 30, 31, 33, 38 ];
const s_4_5_36_41 = [ 4, 5, 36, 41 ];
const s_5_6_7_9_10_20_32_36 = [ 5, 6, 7, 9, 10, 20, 32, 36 ];
const s_6_13_40 = [ 6, 13, 40 ];
const s_4_6_10_14_15 = [ 4, 6, 10, 14, 15 ];
const s_30_33_37_41 = [ 30, 33, 37, 41 ];
const s_6_9_10_18_33_39_41_0 = [ 6, 9, 10, 18, 33, 39, 41, 0 ];
const s_27_30_38_0 = [ 27, 30, 38, 0 ];
const s_6_13_33_35_38_0 = [ 6, 13, 33, 35, 38, 0 ];
const s_31_32_33_40_41 = [ 31, 32, 33, 40, 41 ];
const s_10_18_30_31_0 = [ 10, 18, 30, 31, 0 ];
const s_4_7_24_26 = [ 4, 7, 24, 26 ];
const s_3_7_9_10_21_27 = [ 3, 7, 9, 10, 21, 27 ];
const s_30_31_36_42 = [ 30, 31, 36, 42 ];
const s_9_18_40_41_0 = [ 9, 18, 40, 41, 0 ];
const s_10_15_27 = [ 10, 15, 27 ];
const s_4_21_32 = [ 4, 21, 32 ];
const s_4_7_14_22 = [ 4, 7, 14, 22 ];
const s_4_34_35_38_39_42_43 = [ 4, 34, 35, 38, 39, 42, 43 ];
const s_4_19_29_38 = [ 4, 19, 29, 38 ];
const s_13_17_30_35 = [ 13, 17, 30, 35 ];
const s_29_30_31_37_39_42 = [ 29, 30, 31, 37, 39, 42 ];
const s_12_26_0 = [ 12, 26, 0 ];
const s_13_21_27_39 = [ 13, 21, 27, 39 ];
const s_4_9_10_23 = [ 4, 9, 10, 23 ];
const s_4_6_10_18_42 = [ 4, 6, 10, 18, 42 ];
const s_12_42 = [ 12, 42 ];
const s_18_32_35 = [ 18, 32, 35 ];
const s_6_9_14_21_32_42 = [ 6, 9, 14, 21, 32, 42 ];
const s_4_10_14_22 = [ 4, 10, 14, 22 ];
const s_14_15_26_38 = [ 14, 15, 26, 38 ];
const s_30_32_35_36 = [ 30, 32, 35, 36 ];
const s_17_18_19_28_29_39 = [ 17, 18, 19, 28, 29, 39 ];
const s_19_20 = [ 19, 20 ];
const s_11_19_28_0 = [ 11, 19, 28, 0 ];
const s_10_15_17_18_0 = [ 10, 15, 17, 18, 0 ];
const s_10_26_0 = [ 10, 26, 0 ];
const s_10_18_31_0 = [ 10, 18, 31, 0 ];
const s_6_7_10_35_40_42 = [ 6, 7, 10, 35, 40, 42 ];
const s_4_22_23_32_34_40_41 = [ 4, 22, 23, 32, 34, 40, 41 ];
const s_4_6_9_10_21_31_32_35_36_40_41_42 = [ 4, 6, 9, 10, 21, 31, 32, 35, 36, 40, 41, 42 ];
const s_21_32_35_36_38_40 = [ 21, 32, 35, 36, 38, 40 ];
const s_7_10_18_21 = [ 7, 10, 18, 21 ];
const s_11_30_35_38 = [ 11, 30, 35, 38 ];
const s_6_9_15_17_30_35_38_0 = [ 6, 9, 15, 17, 30, 35, 38, 0 ];
const s_4_7_26_34_40 = [ 4, 7, 26, 34, 40 ];
const s_4_11_12_31_33_41 = [ 4, 11, 12, 31, 33, 41 ];
const s_4_10_12_33_40 = [ 4, 10, 12, 33, 40 ];
const s_15_33_35 = [ 15, 33, 35 ];
const s_4_10_31_39 = [ 4, 10, 31, 39 ];
const s_4_6_11_26_27_28 = [ 4, 6, 11, 26, 27, 28 ];
const s_29_31_32_34_35_42 = [ 29, 31, 32, 34, 35, 42 ];
const s_6_21_38 = [ 6, 21, 38 ];
const s_4_18_29_32_38_0 = [ 4, 18, 29, 32, 38, 0 ];
const s_4_5_13_31_32_33_34_35 = [ 4, 5, 13, 31, 32, 33, 34, 35 ];
const s_17_26_35_43 = [ 17, 26, 35, 43 ];
const s_5_32_38 = [ 5, 32, 38 ];
const s_7_39_0 = [ 7, 39, 0 ];
const s_4_38_40 = [ 4, 38, 40 ];
const s_11_29_32_35_38 = [ 11, 29, 32, 35, 38 ];
const s_4_7_38_41 = [ 4, 7, 38, 41 ];
const s_4_8_19_26_29 = [ 4, 8, 19, 26, 29 ];
const s_4_6_7_11_18_33_35_38_42 = [ 4, 6, 7, 11, 18, 33, 35, 38, 42 ];
const s_7_9_13_18_0_2 = [ 7, 9, 13, 18, 0, 2 ];
const s_7_11_17_18_30_38_41_42_0 = [ 7, 11, 17, 18, 30, 38, 41, 42, 0 ];
const s_22_25_26 = [ 22, 25, 26 ];
const s_4_11_38 = [ 4, 11, 38 ];
const s_4_6_7_10_26_30_33_35_36_38_41_42 = [ 4, 6, 7, 10, 26, 30, 33, 35, 36, 38, 41, 42 ];
const s_11_39_0 = [ 11, 39, 0 ];
const s_4_6_11_30_35_40 = [ 4, 6, 11, 30, 35, 40 ];
const s_11_29 = [ 11, 29 ];
const s_4_10_35_38 = [ 4, 10, 35, 38 ];
const s_9_12_24 = [ 9, 12, 24 ];
const s_14_40_41 = [ 14, 40, 41 ];
const s_6_7_8_9_14_27 = [ 6, 7, 8, 9, 14, 27 ];
const s_6_13_14_17_36_42 = [ 6, 13, 14, 17, 36, 42 ];
const s_7_9_41_0 = [ 7, 9, 41, 0 ];
const s_4_6_15_30_35_36_38 = [ 4, 6, 15, 30, 35, 36, 38 ];
const s_4_6_18_33_35_41 = [ 4, 6, 18, 33, 35, 41 ];
const s_10_14_15_18 = [ 10, 14, 15, 18 ];
const s_4_6_10_32_35_36_38 = [ 4, 6, 10, 32, 35, 36, 38 ];
const s_5_6_8_18_25_28_35_38 = [ 5, 6, 8, 18, 25, 28, 35, 38 ];
const s_18_30_36 = [ 18, 30, 36 ];
const s_4_21_29_30_31_32_33_34_35_38_39_40_41_42 = [ 4, 21, 29, 30, 31, 32, 33, 34, 35, 38, 39, 40, 41, 42 ];
const s_4_10_13 = [ 4, 10, 13 ];
const s_4_10_32_33_42 = [ 4, 10, 32, 33, 42 ];
const s_30_32_0 = [ 30, 32, 0 ];
const s_7_24_26_29_30_0 = [ 7, 24, 26, 29, 30, 0 ];
const s_6_7_2 = [ 6, 7, 2 ];
const s_5_7_9_14 = [ 5, 7, 9, 14 ];
const s_9_17_35_42 = [ 9, 17, 35, 42 ];
const s_6_23_30_34_40 = [ 6, 23, 30, 34, 40 ];
const s_4_6_11_32_34_35_38_39_40 = [ 4, 6, 11, 32, 34, 35, 38, 39, 40 ];
const s_6_15_32_35 = [ 6, 15, 32, 35 ];
const s_6_7_25_30 = [ 6, 7, 25, 30 ];
const s_18_27_35 = [ 18, 27, 35 ];
const s_6_7_20_21 = [ 6, 7, 20, 21 ];
const s_6_9_10_15_18_33 = [ 6, 9, 10, 15, 18, 33 ];
const s_38_42_0 = [ 38, 42, 0 ];
const s_17_18_27 = [ 17, 18, 27 ];
const s_4_9_11_12_13_31_34_39 = [ 4, 9, 11, 12, 13, 31, 34, 39 ];
const s_4_7_36 = [ 4, 7, 36 ];
const s_4_6_10_36 = [ 4, 6, 10, 36 ];
const s_21_32_34_40 = [ 21, 32, 34, 40 ];
const s_13_14_20 = [ 13, 14, 20 ];
const s_5_7_0 = [ 5, 7, 0 ];
const s_4_8_17_29_35_38 = [ 4, 8, 17, 29, 35, 38 ];
const s_27_33 = [ 27, 33 ];
const s_4_18_29_32_35_37 = [ 4, 18, 29, 32, 35, 37 ];
const s_4_6_0_1 = [ 4, 6, 0, 1 ];
const s_18_31_32 = [ 18, 31, 32 ];
const s_7_12_30 = [ 7, 12, 30 ];
const s_7_9_12_15 = [ 7, 9, 12, 15 ];
const s_6_10_18_21_30_40_0 = [ 6, 10, 18, 21, 30, 40, 0 ];
const s_7_9_10_18_0 = [ 7, 9, 10, 18, 0 ];
const s_10_29_30_35_0 = [ 10, 29, 30, 35, 0 ];
const s_6_17_42 = [ 6, 17, 42 ];
const s_21_28_41 = [ 21, 28, 41 ];
const s_6_9_10_28_32 = [ 6, 9, 10, 28, 32 ];
const s_6_15_0_1 = [ 6, 15, 0, 1 ];
const s_4_10_11_15_28 = [ 4, 10, 11, 15, 28 ];
const s_6_9_15 = [ 6, 9, 15 ];
const s_6_14_17_30_40 = [ 6, 14, 17, 30, 40 ];
const s_14_18_0_1 = [ 14, 18, 0, 1 ];
const s_4_5_9_10_31_32_33_41_42 = [ 4, 5, 9, 10, 31, 32, 33, 41, 42 ];
const s_16_18 = [ 16, 18 ];
const s_6_8_18_27_35 = [ 6, 8, 18, 27, 35 ];
const s_11_19_22_30 = [ 11, 19, 22, 30 ];
const s_9_10_40 = [ 9, 10, 40 ];
const s_19_1_0 = [ 19, 1, 0 ];
const s_4_25_27_0 = [ 4, 25, 27, 0 ];
const s_29_30_0_2 = [ 29, 30, 0, 2 ];
const s_3_4_6_7_9_10_11_12_26 = [ 3, 4, 6, 7, 9, 10, 11, 12, 26 ];
const s_9_30_31_36 = [ 9, 30, 31, 36 ];
const s_4_6_10_23_24_2_0 = [ 4, 6, 10, 23, 24, 2, 0 ];
const s_9_10_20 = [ 9, 10, 20 ];
const s_6_9_17_35_38 = [ 6, 9, 17, 35, 38 ];
const s_10_18_26 = [ 10, 18, 26 ];
const s_6_9_25_28 = [ 6, 9, 25, 28 ];
const s_4_12_37_38_39 = [ 4, 12, 37, 38, 39 ];
const s_11_26_38_39 = [ 11, 26, 38, 39 ];
const s_4_6_11_26_31_32_35_36_37_38 = [ 4, 6, 11, 26, 31, 32, 35, 36, 37, 38 ];
const s_4_10_19_32_35_38_42 = [ 4, 10, 19, 32, 35, 38, 42 ];
const s_6_8_35_38_39 = [ 6, 8, 35, 38, 39 ];
const s_6_11_32_38_43 = [ 6, 11, 32, 38, 43 ];
const s_27_2 = [ 27, 2 ];
const s_5_6_10_11_31_35_39 = [ 5, 6, 10, 11, 31, 35, 39 ];
const s_7_10_40_41 = [ 7, 10, 40, 41 ];
const s_4_9_35_37_39 = [ 4, 9, 35, 37, 39 ];
const s_11_28_38 = [ 11, 28, 38 ];
const s_6_10_11_26_30_33_35_36_41 = [ 6, 10, 11, 26, 30, 33, 35, 36, 41 ];
const s_6_21_27_36 = [ 6, 21, 27, 36 ];
const s_6_18_20_29 = [ 6, 18, 20, 29 ];
const s_4_7_9_10_11_33_38 = [ 4, 7, 9, 10, 11, 33, 38 ];
const s_6_7_17_27 = [ 6, 7, 17, 27 ];
const s_3_7_11_28_30_31 = [ 3, 7, 11, 28, 30, 31 ];
const s_6_27_30_35 = [ 6, 27, 30, 35 ];
const s_6_7_10_27_30 = [ 6, 7, 10, 27, 30 ];
const s_7_23_30_32 = [ 7, 23, 30, 32 ];
const s_5_18_30_35_41 = [ 5, 18, 30, 35, 41 ];
const s_6_35_36_40 = [ 6, 35, 36, 40 ];
const s_7_23_27_30 = [ 7, 23, 27, 30 ];
const s_10_15_21_25_30_32_35_38_40 = [ 10, 15, 21, 25, 30, 32, 35, 38, 40 ];
const s_8_38_2_0 = [ 8, 38, 2, 0 ];
const s_15_26_0 = [ 15, 26, 0 ];
const s_6_29_37_40 = [ 6, 29, 37, 40 ];
const s_8_27_36 = [ 8, 27, 36 ];
const s_7_10_26_32 = [ 7, 10, 26, 32 ];
const s_13_18_30_34 = [ 13, 18, 30, 34 ];
const s_6_8_35_38 = [ 6, 8, 35, 38 ];
const s_6_10_35_40 = [ 6, 10, 35, 40 ];
const s_7_11_21_39_40 = [ 7, 11, 21, 39, 40 ];
const s_7_9_10_26_29_30_32 = [ 7, 9, 10, 26, 29, 30, 32 ];
const s_6_8_10_13_17_25_35_36 = [ 6, 8, 10, 13, 17, 25, 35, 36 ];
const s_6_10_13_0_1 = [ 6, 10, 13, 0, 1 ];
const s_4_8_29 = [ 4, 8, 29 ];
const s_4_6_8_18_36_38_40 = [ 4, 6, 8, 18, 36, 38, 40 ];
const s_4_5_6_8 = [ 4, 5, 6, 8 ];
const s_6_7_15_26_28_30_35_38_40_42_0 = [ 6, 7, 15, 26, 28, 30, 35, 38, 40, 42, 0 ];
const s_4_11_12_26_29_37 = [ 4, 11, 12, 26, 29, 37 ];
const s_5_6_13_18_33 = [ 5, 6, 13, 18, 33 ];
const s_11_19_23 = [ 11, 19, 23 ];
const s_19_25 = [ 19, 25 ];
const s_4_12_26_29_37 = [ 4, 12, 26, 29, 37 ];
const s_18_23_32 = [ 18, 23, 32 ];
const s_6_9_30_32_42_0 = [ 6, 9, 30, 32, 42, 0 ];
const s_4_7_9_10_11_23_26_30_31_32_34_35_37_39_41_42 = [ 4, 7, 9, 10, 11, 23, 26, 30, 31, 32, 34, 35, 37, 39, 41, 42 ];
const s_4_28_38 = [ 4, 28, 38 ];
const s_6_25_42 = [ 6, 25, 42 ];
const s_5_6_29_35_41 = [ 5, 6, 29, 35, 41 ];
const s_6_10_23_31_35_36_38_39 = [ 6, 10, 23, 31, 35, 36, 38, 39 ];
const s_4_6_9_10_17_36_38_39 = [ 4, 6, 9, 10, 17, 36, 38, 39 ];
const s_8_10_15 = [ 8, 10, 15 ];
const s_4_14_19_40_42 = [ 4, 14, 19, 40, 42 ];
const s_7_10_32_35 = [ 7, 10, 32, 35 ];
const s_4_10_14_40 = [ 4, 10, 14, 40 ];
const s_6_11_14_29_31_32_33_35_38_41 = [ 6, 11, 14, 29, 31, 32, 33, 35, 38, 41 ];
const s_11_29_38 = [ 11, 29, 38 ];
const s_9_26_37 = [ 9, 26, 37 ];
const s_4_6_10_22 = [ 4, 6, 10, 22 ];
const s_4_9_10_18_30_35_38_40_41 = [ 4, 9, 10, 18, 30, 35, 38, 40, 41 ];
const s_4_10_11_24 = [ 4, 10, 11, 24 ];
const s_29_38_40 = [ 29, 38, 40 ];
const s_4_10_11_30 = [ 4, 10, 11, 30 ];
const s_30_31_32_35_38_42 = [ 30, 31, 32, 35, 38, 42 ];
const s_4_10_11_22_24 = [ 4, 10, 11, 22, 24 ];
const s_4_6_10_11_23 = [ 4, 6, 10, 11, 23 ];
const s_6_7_19 = [ 6, 7, 19 ];
const s_4_8_30_35_38_42 = [ 4, 8, 30, 35, 38, 42 ];
const s_4_6_22_26_35_37_38 = [ 4, 6, 22, 26, 35, 37, 38 ];
const s_4_6_14_21 = [ 4, 6, 14, 21 ];
const s_14_30_36_38 = [ 14, 30, 36, 38 ];
const s_4_6_8_9_35_41 = [ 4, 6, 8, 9, 35, 41 ];
const s_8_17_25 = [ 8, 17, 25 ];
const s_6_10_14_27_32_40 = [ 6, 10, 14, 27, 32, 40 ];
const s_4_26_41 = [ 4, 26, 41 ];
const s_4_6_32_38_42 = [ 4, 6, 32, 38, 42 ];
const s_4_6_35_38_40 = [ 4, 6, 35, 38, 40 ];
const s_6_14_21_37_40 = [ 6, 14, 21, 37, 40 ];
const s_6_14_18_21 = [ 6, 14, 18, 21 ];
const s_11_13_29_30_31_32_34_40_41 = [ 11, 13, 29, 30, 31, 32, 34, 40, 41 ];
const s_7_30_32_0 = [ 7, 30, 32, 0 ];
const s_18_20_25_30_33_35_38 = [ 18, 20, 25, 30, 33, 35, 38 ];
const s_4_11_26_38 = [ 4, 11, 26, 38 ];
const s_6_17_35_41 = [ 6, 17, 35, 41 ];
const s_9_15_38 = [ 9, 15, 38 ];
const s_4_38_41 = [ 4, 38, 41 ];
const s_31_41_1 = [ 31, 41, 1 ];
const s_28_35 = [ 28, 35 ];
const s_4_18_28_41 = [ 4, 18, 28, 41 ];
const s_6_9_13_31_41_42 = [ 6, 9, 13, 31, 41, 42 ];
const s_4_6_33_36 = [ 4, 6, 33, 36 ];
const s_4_6_24_26_30_35_36_42_0 = [ 4, 6, 24, 26, 30, 35, 36, 42, 0 ];
const s_4_6_11_26_34_36_38 = [ 4, 6, 11, 26, 34, 36, 38 ];
const s_4_9_14_30_35_0 = [ 4, 9, 14, 30, 35, 0 ];
const s_11_12_32_33_37 = [ 11, 12, 32, 33, 37 ];
const s_4_6_10_18_32_33_36_38 = [ 4, 6, 10, 18, 32, 33, 36, 38 ];
const s_4_10_18_38 = [ 4, 10, 18, 38 ];
const s_4_9_11_12_26_29_37_41 = [ 4, 9, 11, 12, 26, 29, 37, 41 ];
const s_6_17_21_25 = [ 6, 17, 21, 25 ];
const s_32_33_35 = [ 32, 33, 35 ];
const s_7_30_0_2 = [ 7, 30, 0, 2 ];
const s_6_32_33_39 = [ 6, 32, 33, 39 ];
const s_30_31_40_0 = [ 30, 31, 40, 0 ];
const s_5_6_8_20 = [ 5, 6, 8, 20 ];
const s_7_9_14_21_26_31_37_40_41 = [ 7, 9, 14, 21, 26, 31, 37, 40, 41 ];
const s_7_9_10_18_26 = [ 7, 9, 10, 18, 26 ];
const s_4_29_30_34_37_41 = [ 4, 29, 30, 34, 37, 41 ];
const s_6_8_25_35_38_40 = [ 6, 8, 25, 35, 38, 40 ];
const s_6_7_13_35 = [ 6, 7, 13, 35 ];
const s_4_29_30_31_35_38 = [ 4, 29, 30, 31, 35, 38 ];
const s_4_7_10_30 = [ 4, 7, 10, 30 ];
const s_6_17_35_38 = [ 6, 17, 35, 38 ];
const s_8_1_0 = [ 8, 1, 0 ];
const s_15_17_35 = [ 15, 17, 35 ];
const s_5_11_13_15_18 = [ 5, 11, 13, 15, 18 ];
const s_10_15_18_1 = [ 10, 15, 18, 1 ];
const s_4_10_11_25_28_29_30_32_33_35_36_38_40_41_42 = [ 4, 10, 11, 25, 28, 29, 30, 32, 33, 35, 36, 38, 40, 41, 42 ];
const s_4_6_9_28 = [ 4, 6, 9, 28 ];
const s_4_7_13_24 = [ 4, 7, 13, 24 ];
const s_5_6_33_38 = [ 5, 6, 33, 38 ];
const s_5_27_30_35 = [ 5, 27, 30, 35 ];
const s_7_11_32_35_39 = [ 7, 11, 32, 35, 39 ];
const s_20_30_31 = [ 20, 30, 31 ];
const s_19_26_28_0 = [ 19, 26, 28, 0 ];
const s_6_17_18_29_30_35_42_0 = [ 6, 17, 18, 29, 30, 35, 42, 0 ];
const s_9_12_35_39 = [ 9, 12, 35, 39 ];
const s_7_11_39_43 = [ 7, 11, 39, 43 ];
const s_4_25_38 = [ 4, 25, 38 ];
const s_4_8_10_11_25_26_29_30_32_35_38_42 = [ 4, 8, 10, 11, 25, 26, 29, 30, 32, 35, 38, 42 ];
const s_13_19 = [ 13, 19 ];
const s_4_18_32 = [ 4, 18, 32 ];
const s_26_29_35_38 = [ 26, 29, 35, 38 ];
const s_6_9_10_14_18_31_32 = [ 6, 9, 10, 14, 18, 31, 32 ];
const s_26_37_42 = [ 26, 37, 42 ];
const s_29_30_35_38 = [ 29, 30, 35, 38 ];
const s_29_35_40 = [ 29, 35, 40 ];
const s_32_35_39 = [ 32, 35, 39 ];
const s_7_8_15 = [ 7, 8, 15 ];
const s_5_6_35 = [ 5, 6, 35 ];
const s_4_6_13_27_35_40 = [ 4, 6, 13, 27, 35, 40 ];
const s_6_14_2_0 = [ 6, 14, 2, 0 ];
const s_6_34_35_38 = [ 6, 34, 35, 38 ];
const s_33_36 = [ 33, 36 ];
const s_35_36_41 = [ 35, 36, 41 ];
const s_26_29_30 = [ 26, 29, 30 ];
const s_30_38_42_0 = [ 30, 38, 42, 0 ];
const s_39_40 = [ 39, 40 ];
const s_30_35_38_39 = [ 30, 35, 38, 39 ];
const s_6_40_0 = [ 6, 40, 0 ];
const s_4_6_11_14_15_22_26_0 = [ 4, 6, 11, 14, 15, 22, 26, 0 ];
const s_3_9_14_17_23_24 = [ 3, 9, 14, 17, 23, 24 ];
const s_6_9_10_0 = [ 6, 9, 10, 0 ];
const s_10_15_18_0 = [ 10, 15, 18, 0 ];
const s_4_10_30_32 = [ 4, 10, 30, 32 ];
const s_4_6_7_9_10_17_30_31_41 = [ 4, 6, 7, 9, 10, 17, 30, 31, 41 ];
const s_17_2_0 = [ 17, 2, 0 ];
const s_6_11_37_38 = [ 6, 11, 37, 38 ];
const s_29_38_42 = [ 29, 38, 42 ];
const s_4_6_26_30_33_35_37_38_0 = [ 4, 6, 26, 30, 33, 35, 37, 38, 0 ];
const s_6_33_38_41_0_2 = [ 6, 33, 38, 41, 0, 2 ];
const s_12_16_32 = [ 12, 16, 32 ];
const s_4_7_22_34_41 = [ 4, 7, 22, 34, 41 ];
const s_4_6_7_10_14_23_0 = [ 4, 6, 7, 10, 14, 23, 0 ];
const s_4_28_42 = [ 4, 28, 42 ];
const s_6_15_25_26_35 = [ 6, 15, 25, 26, 35 ];
const s_17_18_38_0 = [ 17, 18, 38, 0 ];
const s_7_9_21_28_31_40 = [ 7, 9, 21, 28, 31, 40 ];
const s_6_10_18_30_32_35_36 = [ 6, 10, 18, 30, 32, 35, 36 ];
const s_9_13_20_1_0 = [ 9, 13, 20, 1, 0 ];
const s_6_7_12 = [ 6, 7, 12 ];
const s_9_10_17_0 = [ 9, 10, 17, 0 ];
const s_9_11_14_0 = [ 9, 11, 14, 0 ];
const s_4_6_9_10_11_18_19_22_25 = [ 4, 6, 9, 10, 11, 18, 19, 22, 25 ];
const s_5_9_17_25 = [ 5, 9, 17, 25 ];
const s_4_8_14_22 = [ 4, 8, 14, 22 ];
const s_6_10_17_27 = [ 6, 10, 17, 27 ];
const s_6_8_20_30_35 = [ 6, 8, 20, 30, 35 ];
const s_5_8_10_17_20_36 = [ 5, 8, 10, 17, 20, 36 ];
const s_12_27 = [ 12, 27 ];
const s_4_5_6_17_30_32 = [ 4, 5, 6, 17, 30, 32 ];
const s_30_32_38_39 = [ 30, 32, 38, 39 ];
const s_4_21_32_41 = [ 4, 21, 32, 41 ];
const s_6_7_10_25_42 = [ 6, 7, 10, 25, 42 ];
const s_6_24_0_1 = [ 6, 24, 0, 1 ];
const s_6_29_40_41 = [ 6, 29, 40, 41 ];
const s_18_29_39_41 = [ 18, 29, 39, 41 ];
const s_4_7_32_41 = [ 4, 7, 32, 41 ];
const s_31_32_35_37 = [ 31, 32, 35, 37 ];
const s_37_38_39_42 = [ 37, 38, 39, 42 ];
const s_13_34_40 = [ 13, 34, 40 ];
const s_4_6_7_9_10_15_31_39 = [ 4, 6, 7, 9, 10, 15, 31, 39 ];
const s_5_10_26 = [ 5, 10, 26 ];
const s_4_14_30_32_38_41_42 = [ 4, 14, 30, 32, 38, 41, 42 ];
const s_30_36_39 = [ 30, 36, 39 ];
const s_10_27_32_39 = [ 10, 27, 32, 39 ];
const s_4_7_10_11_18_24_32 = [ 4, 7, 10, 11, 18, 24, 32 ];
const s_25_26_29_30_41_0 = [ 25, 26, 29, 30, 41, 0 ];
const s_4_32_33_35_38 = [ 4, 32, 33, 35, 38 ];
const s_6_7_10_23 = [ 6, 7, 10, 23 ];
const s_4_6_27_29 = [ 4, 6, 27, 29 ];
const s_6_9_14_32 = [ 6, 9, 14, 32 ];
const s_4_7_9_14_41 = [ 4, 7, 9, 14, 41 ];
const s_13_23_27_35 = [ 13, 23, 27, 35 ];
const s_6_38_43 = [ 6, 38, 43 ];
const s_21_41 = [ 21, 41 ];
const s_4_21_32_33 = [ 4, 21, 32, 33 ];
const s_4_28_31_41_42 = [ 4, 28, 31, 41, 42 ];
const s_4_11_15_19_29_32_37 = [ 4, 11, 15, 19, 29, 32, 37 ];
const s_4_6_7_33_38_41 = [ 4, 6, 7, 33, 38, 41 ];
const s_6_8_17_26_33 = [ 6, 8, 17, 26, 33 ];
const s_4_19_33_35 = [ 4, 19, 33, 35 ];
const s_11_17_34_37_38 = [ 11, 17, 34, 37, 38 ];
const s_4_10_11_38 = [ 4, 10, 11, 38 ];
const s_12_17_26_31_34_35_37_42 = [ 12, 17, 26, 31, 34, 35, 37, 42 ];
const s_18_29_32_34_40_42_0 = [ 18, 29, 32, 34, 40, 42, 0 ];
const s_4_26_33 = [ 4, 26, 33 ];
const s_5_32 = [ 5, 32 ];
const s_6_15_18_33 = [ 6, 15, 18, 33 ];
const s_19_22_0 = [ 19, 22, 0 ];
const s_6_11_25_26_30_32 = [ 6, 11, 25, 26, 30, 32 ];
const s_14_15_17_18 = [ 14, 15, 17, 18 ];
const s_4_6_17_19_22_29_30_35_38_42 = [ 4, 6, 17, 19, 22, 29, 30, 35, 38, 42 ];
const s_18_22_25 = [ 18, 22, 25 ];
const s_13_34_41 = [ 13, 34, 41 ];
const s_4_7_15_27_29_30_34_35_38_40_0 = [ 4, 7, 15, 27, 29, 30, 34, 35, 38, 40, 0 ];
const s_4_6_18_28_32_39_41 = [ 4, 6, 18, 28, 32, 39, 41 ];
const s_6_13_17_27_29_30_40 = [ 6, 13, 17, 27, 29, 30, 40 ];
const s_4_6_27_36 = [ 4, 6, 27, 36 ];
const s_4_11_15 = [ 4, 11, 15 ];
const s_6_8_20_35_36 = [ 6, 8, 20, 35, 36 ];
const s_4_8_10_11_18_19_25_29_32_35_38 = [ 4, 8, 10, 11, 18, 19, 25, 29, 32, 35, 38 ];
const s_4_18_32_38_42 = [ 4, 18, 32, 38, 42 ];
const s_4_6_7_9_15_21_23_26_2 = [ 4, 6, 7, 9, 15, 21, 23, 26, 2 ];
const s_7_21_26 = [ 7, 21, 26 ];
const s_4_6_26_29_30_35_42 = [ 4, 6, 26, 29, 30, 35, 42 ];
const s_19_30_38_42_0 = [ 19, 30, 38, 42, 0 ];
const s_6_35_36_38 = [ 6, 35, 36, 38 ];
const s_5_6_14_17_36 = [ 5, 6, 14, 17, 36 ];
const s_28_41_0 = [ 28, 41, 0 ];
const s_6_10_13_25_35 = [ 6, 10, 13, 25, 35 ];
const s_28_29_0 = [ 28, 29, 0 ];
const s_6_7_12_23_31_35 = [ 6, 7, 12, 23, 31, 35 ];
const s_10_26_32_35_40_0 = [ 10, 26, 32, 35, 40, 0 ];
const s_6_18_20_30_35 = [ 6, 18, 20, 30, 35 ];
const s_6_10_38_0_2 = [ 6, 10, 38, 0, 2 ];
const s_5_10_18_41_1 = [ 5, 10, 18, 41, 1 ];
const s_6_26_30_35 = [ 6, 26, 30, 35 ];
const s_26_31_38 = [ 26, 31, 38 ];
const s_26_29_30_0 = [ 26, 29, 30, 0 ];
const s_4_11_35 = [ 4, 11, 35 ];
const s_6_7_38 = [ 6, 7, 38 ];
const s_4_9_29 = [ 4, 9, 29 ];
const s_4_5_19_32_34_35_38_39 = [ 4, 5, 19, 32, 34, 35, 38, 39 ];
const s_10_32_38_39 = [ 10, 32, 38, 39 ];
const s_4_6_7_13_18_32_33_35_38 = [ 4, 6, 7, 13, 18, 32, 33, 35, 38 ];
const s_4_11_25_38 = [ 4, 11, 25, 38 ];
const s_5_23_40 = [ 5, 23, 40 ];
const s_6_10_11_32_38_39 = [ 6, 10, 11, 32, 38, 39 ];
const s_6_7_13_17_18_30_0 = [ 6, 7, 13, 17, 18, 30, 0 ];
const s_19_30_35 = [ 19, 30, 35 ];
const s_4_6_11_32_35_39 = [ 4, 6, 11, 32, 35, 39 ];
const s_11_18_39 = [ 11, 18, 39 ];
const s_18_38_39 = [ 18, 38, 39 ];
const s_3_9_0_2 = [ 3, 9, 0, 2 ];
const s_4_40_2_0 = [ 4, 40, 2, 0 ];
const s_18_32_35_41 = [ 18, 32, 35, 41 ];
const s_15_26_0_2 = [ 15, 26, 0, 2 ];
const s_5_6_18_0 = [ 5, 6, 18, 0 ];
const s_7_15_17_26 = [ 7, 15, 17, 26 ];
const s_9_10_31_32_40 = [ 9, 10, 31, 32, 40 ];
const s_11_21_33_40_41 = [ 11, 21, 33, 40, 41 ];
const s_4_10_29_38 = [ 4, 10, 29, 38 ];
const s_4_6_10_19_35_38_39_42 = [ 4, 6, 10, 19, 35, 38, 39, 42 ];
const s_6_17_28 = [ 6, 17, 28 ];
const s_5_6_13_14_15_18_38 = [ 5, 6, 13, 14, 15, 18, 38 ];
const s_4_10_28_29_39 = [ 4, 10, 28, 29, 39 ];
const s_5_13_35_39_43 = [ 5, 13, 35, 39, 43 ];
const s_4_30_31_35_38 = [ 4, 30, 31, 35, 38 ];
const s_6_10_15_30_32_35_40 = [ 6, 10, 15, 30, 32, 35, 40 ];
const s_9_10_12_32_37 = [ 9, 10, 12, 32, 37 ];
const s_30_32_35_37_38_40_41 = [ 30, 32, 35, 37, 38, 40, 41 ];
const s_10_18_39 = [ 10, 18, 39 ];
const s_9_11_12_31_32 = [ 9, 11, 12, 31, 32 ];
const s_6_14_18_27 = [ 6, 14, 18, 27 ];
const s_10_18_23_32 = [ 10, 18, 23, 32 ];
const s_4_6_9_19_29_30_31_34_35_36_37_38_39_41_42 = [ 4, 6, 9, 19, 29, 30, 31, 34, 35, 36, 37, 38, 39, 41, 42 ];
const s_5_9_14_17_0 = [ 5, 9, 14, 17, 0 ];
const s_5_6_10_18_38 = [ 5, 6, 10, 18, 38 ];
const s_9_12_35_37_42 = [ 9, 12, 35, 37, 42 ];
const s_4_12_37_42 = [ 4, 12, 37, 42 ];
const s_4_7_11_33_0_2 = [ 4, 7, 11, 33, 0, 2 ];
const s_7_18_23_0 = [ 7, 18, 23, 0 ];
const s_4_11_12_26_29_37_0 = [ 4, 11, 12, 26, 29, 37, 0 ];
const s_10_37 = [ 10, 37 ];
const s_5_11_35 = [ 5, 11, 35 ];
const s_6_11_26_35 = [ 6, 11, 26, 35 ];
const s_6_11_26_29_35_38 = [ 6, 11, 26, 29, 35, 38 ];
const s_11_35_40 = [ 11, 35, 40 ];
const s_9_25_30_35 = [ 9, 25, 30, 35 ];
const s_4_7_41_0_2 = [ 4, 7, 41, 0, 2 ];
const s_8_23_0 = [ 8, 23, 0 ];
const s_11_38_42 = [ 11, 38, 42 ];
const s_4_29_42 = [ 4, 29, 42 ];
const s_12_23_37 = [ 12, 23, 37 ];
const s_4_6_21_23_30_32_33_35_36_38_40_42 = [ 4, 6, 21, 23, 30, 32, 33, 35, 36, 38, 40, 42 ];
const s_6_14_23_26_35 = [ 6, 14, 23, 26, 35 ];
const s_5_14_18_0 = [ 5, 14, 18, 0 ];
const s_7_14_18_26_28 = [ 7, 14, 18, 26, 28 ];
const s_11_30_33_35_37 = [ 11, 30, 33, 35, 37 ];
const s_6_9_14 = [ 6, 9, 14 ];
const s_6_9_23_30_1_0 = [ 6, 9, 23, 30, 1, 0 ];
const s_7_12_39 = [ 7, 12, 39 ];
const s_25_38_2_0 = [ 25, 38, 2, 0 ];
const s_6_7_10_23_35_38 = [ 6, 7, 10, 23, 35, 38 ];
const s_8_15_30_41 = [ 8, 15, 30, 41 ];

// Create `wordIndex2Sense` map.
const wordIndex2Sense = [
  s_26,
  s_15,
  s_32,
  s_15,
  s_20,
  s_15,
  s_18,
  s_17,
  s_5,
  s_5,
  s_17,
  s_15,
  s_18,
  s_14,
  s_10,
  s_10,
  s_6,
  s_20_27,
  s_39,
  s_2,
  s_0,
  s_6,
  s_15,
  s_2,
  s_5,
  s_23,
  s_23,
  s_7_12_31_38_40,
  s_0,
  s_4,
  s_26,
  s_37,
  s_4_26,
  s_37,
  s_0,
  s_12,
  s_26,
  s_1,
  s_0,
  s_30,
  s_4_11,
  s_1,
  s_6,
  s_18,
  s_6,
  s_6,
  s_0,
  s_2,
  s_6,
  s_14,
  s_15,
  s_1,
  s_18,
  s_18,
  s_6,
  s_18,
  s_30,
  s_0,
  s_4_10,
  s_18,
  s_9,
  s_23,
  s_9,
  s_10_18,
  s_0,
  s_41,
  s_10,
  s_18,
  s_8,
  s_8_1,
  s_4,
  s_4,
  s_0,
  s_7,
  s_1,
  s_32,
  s_8,
  s_8_0,
  s_35,
  s_0,
  s_4,
  s_8_18,
  s_2,
  s_14_18_0,
  s_10,
  s_2,
  s_18,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_15,
  s_15,
  s_1,
  s_26,
  s_26,
  s_18_0,
  s_42,
  s_19_26,
  s_41,
  s_26,
  s_10,
  s_10,
  s_18,
  s_18,
  s_26,
  s_0,
  s_23,
  s_23,
  s_37,
  s_12,
  s_0,
  s_18,
  s_4,
  s_31_42,
  s_0,
  s_15,
  s_16,
  s_1,
  s_20,
  s_17,
  s_15,
  s_7_9,
  s_19,
  s_1,
  s_18,
  s_11,
  s_0,
  s_26,
  s_2,
  s_10,
  s_32,
  s_18,
  s_14_18,
  s_10_18,
  s_14_15_18_1,
  s_15,
  s_10_18_1,
  s_34,
  s_4_22,
  s_30,
  s_0,
  s_4_22,
  s_10_1_0,
  s_10,
  s_0,
  s_0,
  s_4,
  s_26,
  s_4,
  s_0,
  s_10,
  s_4,
  s_0,
  s_2,
  s_6,
  s_10_18_1,
  s_32_33_40,
  s_4_10,
  s_18,
  s_0,
  s_26,
  s_4_7_9_26,
  s_2,
  s_2,
  s_26,
  s_6_15,
  s_23,
  s_41,
  s_0,
  s_4,
  s_4,
  s_1,
  s_9,
  s_18,
  s_1,
  s_5,
  s_0,
  s_2,
  s_37,
  s_4_12_18,
  s_18,
  s_10,
  s_2,
  s_0,
  s_18_0,
  s_18,
  s_4_29_30,
  s_4_6,
  s_6_0,
  s_4_11,
  s_18,
  s_0,
  s_2,
  s_5,
  s_26,
  s_0,
  s_42,
  s_0,
  s_2_0,
  s_10_2_0,
  s_2_0,
  s_0,
  s_10,
  s_26,
  s_6_27,
  s_35,
  s_6,
  s_18,
  s_5,
  s_0,
  s_0,
  s_0,
  s_35,
  s_19_22_26,
  s_27_0,
  s_7,
  s_37,
  s_4,
  s_2_0,
  s_30,
  s_0,
  s_10,
  s_18,
  s_10,
  s_0,
  s_2_0,
  s_5,
  s_5,
  s_41,
  s_4,
  s_18,
  s_20,
  s_0,
  s_4,
  s_2,
  s_7,
  s_15,
  s_27,
  s_26,
  s_0,
  s_35,
  s_9,
  s_4_22,
  s_38,
  s_18,
  s_4,
  s_4_38,
  s_18,
  s_4_26_28,
  s_30_0,
  s_18,
  s_4,
  s_2,
  s_0,
  s_2,
  s_9,
  s_13,
  s_13_20,
  s_9_0,
  s_2,
  s_7,
  s_4_26,
  s_9_14_26,
  s_18_1,
  s_1,
  s_32,
  s_0,
  s_18,
  s_0,
  s_30_31_35_40_43,
  s_0,
  s_7,
  s_27,
  s_0,
  s_0,
  s_7,
  s_27_0,
  s_27,
  s_0,
  s_23,
  s_9_22,
  s_0,
  s_7,
  s_38,
  s_34_41,
  s_18,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_4_7,
  s_18_0,
  s_9_10_31_32_40_0,
  s_0,
  s_2,
  s_9,
  s_18,
  s_3_4_6_9,
  s_6_9,
  s_18_0,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_2,
  s_7_9,
  s_9,
  s_26_0,
  s_7_10,
  s_2,
  s_10,
  s_5,
  s_15,
  s_17,
  s_26,
  s_0,
  s_7_24,
  s_0,
  s_2,
  s_4_10_30_32_41,
  s_0,
  s_18,
  s_0,
  s_2,
  s_35,
  s_20,
  s_6_15,
  s_18,
  s_0,
  s_23,
  s_23,
  s_41,
  s_15,
  s_41,
  s_17,
  s_17,
  s_0,
  s_2,
  s_17,
  s_1_0,
  s_15,
  s_5,
  s_20,
  s_14,
  s_14,
  s_18_1_0,
  s_2,
  s_18,
  s_4,
  s_7,
  s_7,
  s_6_14,
  s_15,
  s_18,
  s_20,
  s_25,
  s_20,
  s_8,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_8,
  s_26,
  s_0,
  s_26,
  s_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_1,
  s_0,
  s_5,
  s_5,
  s_20,
  s_26,
  s_1,
  s_1,
  s_1,
  s_15,
  s_27,
  s_26,
  s_26,
  s_27,
  s_5,
  s_5,
  s_26,
  s_5,
  s_5,
  s_26,
  s_26,
  s_0,
  s_0,
  s_0,
  s_5,
  s_8,
  s_10_0,
  s_26,
  s_26,
  s_16,
  s_0,
  s_0,
  s_0,
  s_14,
  s_32_41,
  s_28_2_0,
  s_30,
  s_0,
  s_4_7_28,
  s_0,
  s_6_27,
  s_0,
  s_6,
  s_10_26_32,
  s_0,
  s_4,
  s_5,
  s_0_1,
  s_32,
  s_4_10,
  s_31_32_40_42,
  s_7,
  s_0,
  s_7,
  s_2,
  s_4_7_9_10_21_26,
  s_0,
  s_4_10_26,
  s_0,
  s_0,
  s_0,
  s_18_27,
  s_4_6_7_10_38_40,
  s_18_0,
  s_7,
  s_0,
  s_4_7_10_21_22_32,
  s_1,
  s_0,
  s_6_18_0,
  s_15,
  s_10,
  s_9,
  s_11,
  s_10_0,
  s_2,
  s_5,
  s_5,
  s_5,
  s_1,
  s_10_32,
  s_10,
  s_30,
  s_22,
  s_22,
  s_30,
  s_22,
  s_30,
  s_0,
  s_17,
  s_10,
  s_30_32_34_42,
  s_0,
  s_2,
  s_4_6_9_10_11,
  s_1,
  s_0,
  s_18,
  s_0,
  s_4_7_10_11,
  s_18,
  s_36_38_42,
  s_0,
  s_18,
  s_18,
  s_36_41,
  s_0,
  s_0,
  s_4_9,
  s_7_10_26_40_42,
  s_4_10,
  s_0,
  s_0,
  s_2,
  s_6,
  s_18,
  s_32,
  s_22,
  s_18,
  s_18,
  s_7_10_16_21_26_32_40_42,
  s_7,
  s_0,
  s_4,
  s_18,
  s_4,
  s_4_9_10_21,
  s_40,
  s_0,
  s_6,
  s_40,
  s_0,
  s_6,
  s_15,
  s_31_41,
  s_4,
  s_0,
  s_30,
  s_21_22_23,
  s_0,
  s_0,
  s_27,
  s_4,
  s_30_40,
  s_0,
  s_4,
  s_30,
  s_4_9,
  s_1,
  s_1,
  s_0,
  s_30_40,
  s_0,
  s_4_14_21_22,
  s_0,
  s_6_18,
  s_7,
  s_0,
  s_2,
  s_32,
  s_0,
  s_0,
  s_10,
  s_10,
  s_10_1_0,
  s_1,
  s_0,
  s_32,
  s_18,
  s_18,
  s_0,
  s_2,
  s_0,
  s_30,
  s_0,
  s_4_6_14_18_23_27_33_41_0,
  s_6,
  s_4,
  s_0,
  s_1_0,
  s_26,
  s_26,
  s_0,
  s_26,
  s_20,
  s_20,
  s_0,
  s_0,
  s_30_37,
  s_0,
  s_7,
  s_13_20,
  s_0,
  s_1,
  s_20,
  s_0,
  s_8,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_6,
  s_6,
  s_6_27,
  s_1,
  s_30_39,
  s_27,
  s_27,
  s_26,
  s_1,
  s_26,
  s_6,
  s_0,
  s_0,
  s_6,
  s_13_27,
  s_27,
  s_30,
  s_22,
  s_27,
  s_27,
  s_1,
  s_1,
  s_30,
  s_30,
  s_15,
  s_14_18_1,
  s_18,
  s_26_37_39,
  s_20,
  s_1,
  s_17,
  s_0,
  s_5,
  s_0,
  s_18,
  s_5,
  s_26,
  s_0,
  s_41,
  s_4,
  s_18,
  s_20,
  s_18,
  s_20,
  s_26_0,
  s_20,
  s_0,
  s_26,
  s_1,
  s_5,
  s_26,
  s_10_14_18,
  s_17,
  s_0_1,
  s_26,
  s_1,
  s_26,
  s_20,
  s_7,
  s_0,
  s_7,
  s_8,
  s_1,
  s_30,
  s_7,
  s_30,
  s_0,
  s_7,
  s_0,
  s_0,
  s_6,
  s_0,
  s_26,
  s_17,
  s_0,
  s_1,
  s_6_27_0,
  s_26,
  s_0,
  s_22,
  s_30_39,
  s_1,
  s_4,
  s_7_9,
  s_5,
  s_5,
  s_0,
  s_0,
  s_5,
  s_26,
  s_1,
  s_39,
  s_0,
  s_0,
  s_9,
  s_0,
  s_1,
  s_1,
  s_5,
  s_20,
  s_1,
  s_1,
  s_8_20,
  s_5,
  s_5,
  s_13,
  s_31_32,
  s_0,
  s_0,
  s_10_26,
  s_10_26,
  s_14,
  s_15_26,
  s_26,
  s_0,
  s_1,
  s_5,
  s_20,
  s_20,
  s_0,
  s_18,
  s_17,
  s_20,
  s_20,
  s_20,
  s_26,
  s_15,
  s_20,
  s_20,
  s_26,
  s_6_1,
  s_1,
  s_2,
  s_18,
  s_26,
  s_9,
  s_32,
  s_9_18_26,
  s_26,
  s_0,
  s_32,
  s_10_26,
  s_0,
  s_0,
  s_29_30_31_40_42,
  s_0,
  s_9,
  s_14_18,
  s_4,
  s_4_9_21,
  s_0,
  s_7,
  s_32_41,
  s_4,
  s_10,
  s_0,
  s_15,
  s_20,
  s_15_23,
  s_7,
  s_21,
  s_0,
  s_5,
  s_5,
  s_7_9,
  s_7,
  s_5,
  s_6,
  s_0,
  s_7,
  s_5,
  s_0,
  s_26,
  s_26,
  s_18,
  s_5,
  s_0,
  s_4,
  s_20,
  s_0,
  s_20,
  s_1,
  s_5,
  s_26,
  s_20,
  s_20,
  s_26,
  s_5,
  s_20,
  s_1,
  s_1,
  s_27,
  s_26,
  s_0,
  s_26,
  s_26,
  s_26,
  s_8,
  s_26,
  s_26,
  s_10,
  s_1,
  s_1,
  s_0,
  s_26,
  s_0,
  s_10,
  s_6,
  s_5,
  s_0,
  s_8,
  s_2,
  s_10,
  s_20,
  s_27,
  s_27,
  s_6_27,
  s_27,
  s_3_10_29_33_36_41_42,
  s_0,
  s_20,
  s_8,
  s_5,
  s_6,
  s_27,
  s_0,
  s_5,
  s_4_0,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_27,
  s_20,
  s_20,
  s_20,
  s_7,
  s_27,
  s_27_0,
  s_27,
  s_20,
  s_6,
  s_1,
  s_1,
  s_4,
  s_0,
  s_0,
  s_5,
  s_5,
  s_1,
  s_5,
  s_5,
  s_1,
  s_6,
  s_26,
  s_1,
  s_5,
  s_5,
  s_27,
  s_5,
  s_5,
  s_4,
  s_5,
  s_5,
  s_4_6_7_10_22_26_36_41,
  s_0,
  s_5,
  s_4_15,
  s_6,
  s_30_36,
  s_0,
  s_4_0,
  s_4_22,
  s_27,
  s_18_24_27_0,
  s_2,
  s_7_26,
  s_6,
  s_9,
  s_18_0,
  s_0,
  s_4_7_22_26,
  s_27,
  s_18,
  s_18,
  s_10,
  s_0,
  s_4,
  s_32_36,
  s_26,
  s_4,
  s_32_36,
  s_2,
  s_1,
  s_18,
  s_36,
  s_0,
  s_0,
  s_4,
  s_6,
  s_0,
  s_9,
  s_6,
  s_5,
  s_1,
  s_1,
  s_5_20,
  s_9_20,
  s_30_0,
  s_4,
  s_4,
  s_10_0,
  s_2,
  s_7_9,
  s_0,
  s_6,
  s_27,
  s_22,
  s_27,
  s_27,
  s_26,
  s_26,
  s_1,
  s_26,
  s_18,
  s_10,
  s_4_10_2_0,
  s_5_15,
  s_6_18,
  s_7,
  s_27_0,
  s_1_0,
  s_2,
  s_17_18,
  s_15,
  s_20,
  s_18,
  s_5,
  s_6,
  s_30,
  s_7,
  s_0,
  s_4_10_22,
  s_0,
  s_0,
  s_0,
  s_6_18,
  s_22,
  s_0,
  s_6,
  s_28,
  s_0,
  s_2,
  s_26_30_31_32_40_42,
  s_0,
  s_5,
  s_23,
  s_10,
  s_5_6_18,
  s_0,
  s_18_34,
  s_0,
  s_4_12_26,
  s_0,
  s_4_6_15_21_23,
  s_0,
  s_2,
  s_6_0,
  s_30_31,
  s_0,
  s_0,
  s_18,
  s_0,
  s_7_10_15_30_32_33_34_40_41,
  s_0,
  s_0,
  s_18,
  s_6,
  s_32,
  s_0,
  s_18,
  s_10,
  s_27_35,
  s_0,
  s_4,
  s_0,
  s_8,
  s_13,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_15,
  s_20,
  s_18,
  s_27,
  s_26,
  s_20,
  s_26,
  s_1,
  s_8,
  s_8_1,
  s_1_0,
  s_4,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_27,
  s_26,
  s_5,
  s_5,
  s_18_0,
  s_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_27,
  s_27,
  s_8,
  s_26,
  s_30_35_42,
  s_4_7,
  s_18_0,
  s_4_7_8_26,
  s_27_0,
  s_7,
  s_14,
  s_0,
  s_20,
  s_20,
  s_16,
  s_1,
  s_10,
  s_17,
  s_10,
  s_0,
  s_7,
  s_7,
  s_7,
  s_17,
  s_6,
  s_18,
  s_18,
  s_7,
  s_0,
  s_1,
  s_2,
  s_10_0_1,
  s_2,
  s_30_35,
  s_30_41,
  s_4,
  s_32,
  s_31_41,
  s_4,
  s_1,
  s_18,
  s_1,
  s_10_17_18_0,
  s_4,
  s_0,
  s_10,
  s_0,
  s_32,
  s_30_31,
  s_0,
  s_0,
  s_18,
  s_0,
  s_4_11_21_22,
  s_18,
  s_5_18,
  s_6_0,
  s_20,
  s_18,
  s_14,
  s_40,
  s_29_40_41,
  s_0,
  s_41,
  s_4_14_28,
  s_1,
  s_2,
  s_18,
  s_4,
  s_7,
  s_0,
  s_7,
  s_2,
  s_5_18,
  s_4_14,
  s_4_12,
  s_37_39,
  s_0,
  s_18,
  s_2,
  s_7,
  s_0,
  s_4_7_10_21,
  s_0,
  s_32_40_41_42,
  s_0,
  s_4_7,
  s_2,
  s_0,
  s_30,
  s_4_6_26,
  s_32,
  s_18,
  s_0,
  s_10,
  s_10,
  s_0,
  s_0,
  s_8,
  s_1,
  s_10,
  s_4,
  s_6_27,
  s_13,
  s_30,
  s_26_28,
  s_18_1_0,
  s_10_1_0,
  s_18_20,
  s_30_31_36_40_41,
  s_0,
  s_0,
  s_18,
  s_18,
  s_4,
  s_0,
  s_7,
  s_0,
  s_7,
  s_2,
  s_4_12,
  s_37,
  s_0,
  s_18,
  s_0,
  s_2,
  s_36_41_42,
  s_0,
  s_4_6,
  s_4,
  s_22_27,
  s_0,
  s_6,
  s_8_1,
  s_4,
  s_8,
  s_8,
  s_11,
  s_6_1,
  s_1,
  s_0,
  s_8,
  s_0,
  s_8,
  s_27,
  s_18,
  s_15,
  s_15,
  s_17,
  s_2_0,
  s_0,
  s_2,
  s_9,
  s_0,
  s_0,
  s_0,
  s_35,
  s_0,
  s_27_0,
  s_27_0,
  s_22,
  s_0,
  s_32,
  s_10,
  s_18,
  s_0,
  s_5_18_0,
  s_27_0,
  s_30_0,
  s_0,
  s_0,
  s_4_26,
  s_18_27,
  s_18,
  s_18,
  s_0,
  s_0,
  s_2,
  s_4,
  s_26_28,
  s_32,
  s_6_9,
  s_0,
  s_0,
  s_4_10_11_21_30_32_33_38_40_41_0,
  s_0,
  s_4_10,
  s_18,
  s_0,
  s_7_23_41,
  s_0,
  s_2,
  s_7,
  s_38,
  s_22,
  s_1,
  s_4_11_28,
  s_9,
  s_18,
  s_8,
  s_1,
  s_0,
  s_0,
  s_4_41,
  s_18,
  s_0,
  s_18,
  s_7,
  s_1,
  s_0,
  s_7,
  s_10,
  s_10_1,
  s_2,
  s_18,
  s_0,
  s_0,
  s_2,
  s_11_26,
  s_10_32_39,
  s_9,
  s_9,
  s_0,
  s_2,
  s_32,
  s_0,
  s_10,
  s_18,
  s_4_10,
  s_32,
  s_10,
  s_18,
  s_10,
  s_10,
  s_10,
  s_6,
  s_7,
  s_0,
  s_32,
  s_0,
  s_2,
  s_18,
  s_9,
  s_18,
  s_18,
  s_10_0,
  s_4,
  s_18_32,
  s_18,
  s_7,
  s_7,
  s_0,
  s_6,
  s_6,
  s_15,
  s_15,
  s_14,
  s_1,
  s_20,
  s_20,
  s_5,
  s_15,
  s_17_1,
  s_20,
  s_20,
  s_5_15,
  s_11,
  s_4_6,
  s_18,
  s_4_17,
  s_4_17,
  s_5,
  s_5,
  s_5,
  s_18,
  s_10,
  s_18,
  s_15,
  s_14_18_1,
  s_10,
  s_15,
  s_0,
  s_18,
  s_18_28,
  s_1_0,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_30_39,
  s_0,
  s_4_22,
  s_6,
  s_4_6_0,
  s_18,
  s_2,
  s_20,
  s_15_17,
  s_1,
  s_0,
  s_30,
  s_5,
  s_4,
  s_5,
  s_0,
  s_4,
  s_19,
  s_0,
  s_26,
  s_6,
  s_1_0,
  s_9,
  s_26,
  s_6,
  s_6,
  s_10,
  s_10,
  s_17,
  s_1,
  s_1,
  s_9,
  s_1,
  s_9,
  s_1,
  s_9,
  s_18,
  s_1,
  s_1,
  s_9,
  s_4,
  s_1,
  s_4,
  s_18,
  s_0,
  s_0,
  s_20,
  s_6,
  s_6_19,
  s_35,
  s_0,
  s_35,
  s_0,
  s_15,
  s_6,
  s_15_17_0,
  s_1,
  s_18,
  s_20,
  s_1,
  s_18,
  s_20,
  s_18,
  s_18,
  s_9,
  s_9,
  s_18,
  s_9_0_1,
  s_0,
  s_2,
  s_18,
  s_9,
  s_0,
  s_29,
  s_14_26,
  s_10_18,
  s_20,
  s_20,
  s_1,
  s_1,
  s_18,
  s_9_11,
  s_5,
  s_2,
  s_0,
  s_0,
  s_1,
  s_7,
  s_0,
  s_7,
  s_2,
  s_9_11_26,
  s_26,
  s_4_9,
  s_12_29_30_32_37_42,
  s_4,
  s_0,
  s_2,
  s_4_7,
  s_0,
  s_2,
  s_12,
  s_0,
  s_0,
  s_2,
  s_7_12,
  s_0,
  s_5,
  s_8_0,
  s_32,
  s_18,
  s_10,
  s_14_18_41,
  s_0,
  s_4_26,
  s_0,
  s_18_1_0,
  s_0,
  s_7_19_24,
  s_31_32,
  s_0,
  s_4_10,
  s_10_0,
  s_2,
  s_7,
  s_0,
  s_5,
  s_18,
  s_10_35,
  s_1,
  s_4_9,
  s_0,
  s_1,
  s_9,
  s_30_37,
  s_0,
  s_11_26,
  s_0,
  s_26,
  s_17_18_0,
  s_34_40_42,
  s_0,
  s_35,
  s_4,
  s_41,
  s_4_10,
  s_10,
  s_10,
  s_10,
  s_12_37,
  s_4_32,
  s_4,
  s_5_6_10_18_1,
  s_10_23_1,
  s_15,
  s_18_1,
  s_26,
  s_18,
  s_2,
  s_0,
  s_14,
  s_14,
  s_0,
  s_0,
  s_27,
  s_6,
  s_0,
  s_0,
  s_0,
  s_2_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_27,
  s_0,
  s_20,
  s_10,
  s_2,
  s_17,
  s_18_1,
  s_5,
  s_10_1,
  s_18,
  s_18_1,
  s_6,
  s_8,
  s_10,
  s_20,
  s_5,
  s_14,
  s_0_2,
  s_2_0,
  s_8,
  s_6,
  s_4,
  s_27,
  s_6,
  s_19_26,
  s_12_19,
  s_9,
  s_28,
  s_11_19,
  s_0,
  s_10_28,
  s_26,
  s_10,
  s_13,
  s_9,
  s_5,
  s_0,
  s_11,
  s_9,
  s_6_9,
  s_2,
  s_2,
  s_9,
  s_10,
  s_2,
  s_6,
  s_26,
  s_26,
  s_20,
  s_5,
  s_18,
  s_20,
  s_0,
  s_5,
  s_5,
  s_26,
  s_22,
  s_0,
  s_0,
  s_20,
  s_4_12_0,
  s_5,
  s_27,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_20,
  s_27,
  s_6,
  s_20,
  s_20,
  s_20,
  s_0,
  s_20,
  s_18,
  s_7_28_30,
  s_14_0,
  s_7,
  s_18,
  s_22_0,
  s_4,
  s_5,
  s_0,
  s_7,
  s_0,
  s_4_14_26,
  s_9_10,
  s_10,
  s_27,
  s_22,
  s_22,
  s_30,
  s_30,
  s_10_17_18_27,
  s_1,
  s_7,
  s_20,
  s_20,
  s_10_18,
  s_14_27_35_0,
  s_0,
  s_4_14,
  s_0,
  s_6,
  s_35_0,
  s_22,
  s_0,
  s_27,
  s_27,
  s_35,
  s_32,
  s_4,
  s_32,
  s_4,
  s_30_37,
  s_0,
  s_0,
  s_2,
  s_4_12,
  s_18,
  s_6_14_27_35_42_0,
  s_0,
  s_4_14,
  s_0,
  s_18,
  s_33,
  s_4_7_12,
  s_0,
  s_2,
  s_7_12,
  s_18,
  s_37_41,
  s_4,
  s_33,
  s_10,
  s_28,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4,
  s_22_0,
  s_21,
  s_21,
  s_4,
  s_35_37_38_41,
  s_0,
  s_0,
  s_4_12_26,
  s_0,
  s_18,
  s_10,
  s_5,
  s_18,
  s_20,
  s_20,
  s_0,
  s_6,
  s_0,
  s_0,
  s_8,
  s_18_0,
  s_5,
  s_5,
  s_0,
  s_24,
  s_18,
  s_31,
  s_31,
  s_10,
  s_26,
  s_18_0_1,
  s_0,
  s_9,
  s_2_0,
  s_0,
  s_4,
  s_1,
  s_1,
  s_0,
  s_5,
  s_37,
  s_0,
  s_0,
  s_6_8_18,
  s_1_0,
  s_0,
  s_37,
  s_0,
  s_0,
  s_2,
  s_5,
  s_12_26,
  s_6_15_23,
  s_26,
  s_0,
  s_5,
  s_15,
  s_1,
  s_26,
  s_26,
  s_10,
  s_26,
  s_1,
  s_0,
  s_32_40_42,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_7_9_10_24_26,
  s_0,
  s_4,
  s_18,
  s_1_0,
  s_18,
  s_4_14,
  s_18,
  s_15,
  s_20,
  s_20,
  s_5,
  s_18,
  s_18,
  s_5,
  s_1,
  s_1,
  s_9,
  s_1,
  s_1,
  s_9,
  s_16,
  s_1,
  s_1,
  s_18,
  s_9,
  s_20,
  s_20,
  s_20,
  s_0_2,
  s_4,
  s_1,
  s_5,
  s_13,
  s_10_26,
  s_20,
  s_0,
  s_18,
  s_2_0,
  s_10,
  s_10,
  s_1,
  s_2_0,
  s_2_0,
  s_6,
  s_18,
  s_20,
  s_18,
  s_15,
  s_14,
  s_4_7_21_29_41,
  s_18,
  s_0,
  s_18,
  s_18,
  s_26,
  s_15,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_4,
  s_13_29,
  s_20,
  s_6,
  s_18,
  s_0,
  s_26,
  s_26,
  s_5,
  s_5,
  s_5,
  s_4_9_15_31_32_33,
  s_0,
  s_2,
  s_7,
  s_0,
  s_13,
  s_4_7_10_15_19_27_30_32_39,
  s_0,
  s_6,
  s_6_35,
  s_11,
  s_6,
  s_6,
  s_18,
  s_18,
  s_14,
  s_18,
  s_6,
  s_6,
  s_4,
  s_17,
  s_0,
  s_5,
  s_21,
  s_6,
  s_11,
  s_6,
  s_14,
  s_6,
  s_38,
  s_6,
  s_15_18,
  s_0,
  s_2,
  s_7,
  s_4_10,
  s_0,
  s_4_35,
  s_0,
  s_6,
  s_6,
  s_6,
  s_10_32,
  s_6,
  s_18,
  s_9,
  s_6,
  s_6,
  s_10,
  s_7,
  s_6,
  s_6,
  s_0,
  s_26,
  s_15,
  s_28,
  s_19,
  s_6,
  s_38,
  s_0,
  s_10,
  s_6_8_15,
  s_18,
  s_26,
  s_0,
  s_0,
  s_6,
  s_13,
  s_5,
  s_20,
  s_5,
  s_0,
  s_18,
  s_20,
  s_15,
  s_10,
  s_8,
  s_8,
  s_13_20,
  s_15,
  s_5,
  s_10,
  s_14,
  s_18,
  s_18,
  s_2_0,
  s_0,
  s_26,
  s_26,
  s_15,
  s_10,
  s_15,
  s_15,
  s_15,
  s_10,
  s_13,
  s_5_8,
  s_10_15_17_18,
  s_18,
  s_18,
  s_7_27_1,
  s_1,
  s_0,
  s_7,
  s_18,
  s_26,
  s_4,
  s_27,
  s_27_1_0,
  s_18,
  s_6_10_12_32_37,
  s_0,
  s_0,
  s_2,
  s_10,
  s_18,
  s_10,
  s_0,
  s_2,
  s_15,
  s_18_1,
  s_26,
  s_0,
  s_0,
  s_5,
  s_5,
  s_6,
  s_5_13,
  s_15,
  s_10_18_1,
  s_15,
  s_20,
  s_5_9,
  s_24,
  s_18,
  s_18,
  s_18,
  s_15,
  s_18,
  s_0,
  s_14,
  s_1,
  s_9,
  s_1,
  s_1,
  s_26,
  s_1,
  s_18,
  s_1,
  s_15,
  s_27,
  s_1,
  s_20,
  s_20,
  s_15,
  s_20,
  s_20,
  s_8,
  s_20,
  s_5,
  s_5,
  s_6_10,
  s_13_27,
  s_27,
  s_27,
  s_1,
  s_26,
  s_1,
  s_15,
  s_6,
  s_5,
  s_18,
  s_27,
  s_10,
  s_18,
  s_0,
  s_27,
  s_26,
  s_6,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_1,
  s_30,
  s_18,
  s_1,
  s_1,
  s_30,
  s_9_24,
  s_18,
  s_5,
  s_18,
  s_13_27,
  s_18_0,
  s_30,
  s_16_26,
  s_30_34,
  s_18,
  s_6,
  s_5,
  s_5,
  s_18,
  s_27,
  s_17,
  s_27,
  s_1,
  s_20,
  s_5,
  s_18,
  s_1,
  s_1,
  s_27,
  s_27,
  s_6,
  s_27,
  s_27,
  s_26,
  s_20,
  s_13,
  s_0,
  s_20,
  s_5,
  s_18,
  s_20,
  s_5,
  s_5,
  s_2,
  s_20,
  s_6,
  s_6,
  s_6,
  s_15,
  s_10,
  s_5,
  s_15,
  s_10_26_32_0,
  s_10_26,
  s_2,
  s_7_9_26,
  s_20,
  s_20,
  s_27,
  s_1,
  s_10_14_18,
  s_18_1,
  s_15,
  s_6,
  s_5_13,
  s_18_20,
  s_20,
  s_15,
  s_18_1,
  s_10,
  s_27,
  s_26,
  s_18_1,
  s_5,
  s_5,
  s_13_20,
  s_20,
  s_20,
  s_18,
  s_2_0,
  s_5,
  s_5,
  s_1,
  s_20,
  s_20,
  s_20,
  s_9,
  s_1,
  s_1,
  s_2,
  s_18,
  s_18,
  s_15,
  s_18_1,
  s_15,
  s_5,
  s_0,
  s_26,
  s_15,
  s_27,
  s_1,
  s_10_17,
  s_12,
  s_1,
  s_9,
  s_6,
  s_1,
  s_1,
  s_4,
  s_10_18_1,
  s_10_18,
  s_10_18_1,
  s_10_18_1,
  s_12,
  s_26,
  s_0,
  s_9_10,
  s_9,
  s_0,
  s_18,
  s_18,
  s_6,
  s_18,
  s_18,
  s_10_2,
  s_10_32,
  s_6,
  s_6,
  s_18_40_0,
  s_0,
  s_7,
  s_37_40,
  s_0,
  s_0,
  s_4_12_26,
  s_18,
  s_18,
  s_7_9,
  s_18,
  s_18,
  s_0,
  s_38_0,
  s_30_31_42,
  s_0,
  s_0,
  s_4_7_11_14,
  s_0_2,
  s_7,
  s_13_34,
  s_0,
  s_0,
  s_4_13,
  s_1,
  s_21,
  s_30,
  s_14,
  s_0,
  s_23,
  s_23_0,
  s_14,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_0,
  s_7_26,
  s_4_10,
  s_27,
  s_27,
  s_27,
  s_1,
  s_26,
  s_0,
  s_27,
  s_0,
  s_30,
  s_4,
  s_0,
  s_30,
  s_7,
  s_30,
  s_26,
  s_30,
  s_27,
  s_30,
  s_27,
  s_27,
  s_1,
  s_26,
  s_1,
  s_26,
  s_27,
  s_20,
  s_27,
  s_26,
  s_27,
  s_6,
  s_18,
  s_27,
  s_27,
  s_27,
  s_27,
  s_1,
  s_27,
  s_0_2,
  s_18,
  s_20,
  s_1,
  s_0,
  s_5,
  s_0,
  s_34_37,
  s_18,
  s_10,
  s_32,
  s_0,
  s_2,
  s_10,
  s_17,
  s_17,
  s_4_7,
  s_0,
  s_0,
  s_0,
  s_2,
  s_30_31,
  s_18,
  s_30_31,
  s_18,
  s_10,
  s_10_28_2_0,
  s_10_28_2_0,
  s_8,
  s_1,
  s_8,
  s_1,
  s_13,
  s_18,
  s_15,
  s_27,
  s_1,
  s_1_0,
  s_18,
  s_9,
  s_26,
  s_6,
  s_29_30,
  s_0,
  s_4_12,
  s_0,
  s_6_18,
  s_0,
  s_6,
  s_6,
  s_20,
  s_28,
  s_28,
  s_20,
  s_1_0,
  s_4_10_14_24_26,
  s_20,
  s_5,
  s_1_0,
  s_14,
  s_5_27_30,
  s_0,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5,
  s_36,
  s_10,
  s_0,
  s_2,
  s_18,
  s_20,
  s_5,
  s_27,
  s_0,
  s_0,
  s_40,
  s_4_21,
  s_18,
  s_0,
  s_0,
  s_10,
  s_1,
  s_11,
  s_0,
  s_8,
  s_10,
  s_1,
  s_11,
  s_1,
  s_1,
  s_9,
  s_10_27,
  s_1,
  s_1,
  s_4,
  s_0,
  s_26,
  s_10,
  s_1,
  s_6,
  s_5,
  s_5,
  s_40,
  s_4_21,
  s_27,
  s_1,
  s_1,
  s_19,
  s_19,
  s_0,
  s_0,
  s_31_32_40_41_42,
  s_0,
  s_2,
  s_4_7_21_40,
  s_26_27_30,
  s_0,
  s_13_20,
  s_32,
  s_7_32,
  s_4_7_9,
  s_0,
  s_10,
  s_0,
  s_7,
  s_1,
  s_19,
  s_17_19_22,
  s_17,
  s_14_18_41,
  s_27,
  s_1,
  s_10,
  s_27,
  s_27,
  s_15,
  s_18_0,
  s_13_20,
  s_18,
  s_18,
  s_2,
  s_4,
  s_18,
  s_4,
  s_27,
  s_20,
  s_20,
  s_20,
  s_20,
  s_6,
  s_2,
  s_10,
  s_2_0,
  s_7,
  s_2,
  s_2,
  s_18,
  s_2_0,
  s_7_12,
  s_26,
  s_1,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_2,
  s_17,
  s_5_6_27,
  s_15,
  s_6,
  s_0,
  s_10_11_0,
  s_9_10,
  s_0_1,
  s_0_1,
  s_2,
  s_4,
  s_30,
  s_0,
  s_18,
  s_4,
  s_30_40,
  s_0,
  s_18,
  s_1,
  s_1,
  s_1,
  s_1,
  s_10,
  s_5,
  s_1_0,
  s_20,
  s_4,
  s_18,
  s_6,
  s_17,
  s_2,
  s_2_0,
  s_26,
  s_15,
  s_15,
  s_5_18_1,
  s_2,
  s_20,
  s_5,
  s_20,
  s_20,
  s_20,
  s_24,
  s_6,
  s_10_18_1,
  s_17,
  s_6,
  s_6,
  s_6,
  s_29_30_36,
  s_7,
  s_0,
  s_4_11,
  s_0,
  s_32,
  s_10,
  s_0,
  s_4,
  s_20,
  s_18_30_31_41_0,
  s_2,
  s_0,
  s_4,
  s_9_0,
  s_2,
  s_6,
  s_20,
  s_20,
  s_6,
  s_0,
  s_7_24_25,
  s_1,
  s_0,
  s_7_10_18_0,
  s_17,
  s_26_2,
  s_18,
  s_15,
  s_17,
  s_0,
  s_7,
  s_18,
  s_0,
  s_2,
  s_5,
  s_1,
  s_6_18_27,
  s_20,
  s_27,
  s_27,
  s_0,
  s_35,
  s_27,
  s_35,
  s_1,
  s_27,
  s_18,
  s_18,
  s_20,
  s_27,
  s_6,
  s_10_1,
  s_0,
  s_26,
  s_8,
  s_1,
  s_2,
  s_20,
  s_5,
  s_26,
  s_5,
  s_18,
  s_18,
  s_2,
  s_14_27,
  s_35_0,
  s_0,
  s_4,
  s_1,
  s_18,
  s_20,
  s_18,
  s_20,
  s_20,
  s_1_0,
  s_20,
  s_13_20,
  s_13,
  s_15,
  s_20,
  s_20,
  s_30_40,
  s_26,
  s_18,
  s_18_0,
  s_0,
  s_2,
  s_9,
  s_9,
  s_6_18,
  s_0,
  s_12,
  s_0,
  s_20,
  s_20,
  s_26,
  s_1,
  s_31,
  s_0,
  s_12,
  s_0,
  s_2,
  s_5_17_18,
  s_5,
  s_10,
  s_4,
  s_0,
  s_18,
  s_1,
  s_4,
  s_18,
  s_7_27_0,
  s_20,
  s_20,
  s_5,
  s_27,
  s_5,
  s_15_26,
  s_7,
  s_0,
  s_7,
  s_15_26,
  s_0,
  s_7_10,
  s_0,
  s_2,
  s_7,
  s_7_12_37,
  s_0,
  s_0,
  s_2,
  s_7,
  s_12,
  s_12,
  s_0,
  s_7,
  s_0,
  s_4_38,
  s_18,
  s_5,
  s_27,
  s_26,
  s_1,
  s_5,
  s_6,
  s_20,
  s_18,
  s_13_20_27,
  s_20,
  s_0,
  s_1_0,
  s_1,
  s_5,
  s_6,
  s_0,
  s_38,
  s_4,
  s_6_1_0,
  s_4_33,
  s_4_33,
  s_18,
  s_5,
  s_5,
  s_5,
  s_26,
  s_5,
  s_1,
  s_26,
  s_1,
  s_26,
  s_1,
  s_1,
  s_18,
  s_5,
  s_5,
  s_20,
  s_26,
  s_30,
  s_0,
  s_4,
  s_0,
  s_0,
  s_8,
  s_22,
  s_18,
  s_7,
  s_0,
  s_7,
  s_30_32,
  s_0,
  s_0,
  s_0,
  s_4_10,
  s_4_21,
  s_26,
  s_21,
  s_7,
  s_26,
  s_1,
  s_1,
  s_26,
  s_1,
  s_1,
  s_20,
  s_0,
  s_9,
  s_20,
  s_0,
  s_41,
  s_21,
  s_0,
  s_15_17,
  s_10_18_1,
  s_6,
  s_22,
  s_30,
  s_4_7_10,
  s_22,
  s_30,
  s_27,
  s_10_1,
  s_18,
  s_1,
  s_0,
  s_0,
  s_6,
  s_27_0,
  s_1,
  s_26,
  s_26,
  s_0,
  s_6,
  s_18,
  s_10_1,
  s_5,
  s_7_12,
  s_0,
  s_7,
  s_2,
  s_20,
  s_7_12,
  s_0,
  s_7_12,
  s_2,
  s_27,
  s_6,
  s_2_0,
  s_2,
  s_18,
  s_5,
  s_27,
  s_1,
  s_27_1,
  s_26,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_27,
  s_6,
  s_27,
  s_6,
  s_18,
  s_18,
  s_2_0,
  s_22,
  s_1,
  s_6,
  s_7_26,
  s_15,
  s_6,
  s_27,
  s_1,
  s_6,
  s_20,
  s_5,
  s_5,
  s_27,
  s_27_1,
  s_1,
  s_30,
  s_1,
  s_22,
  s_30,
  s_17,
  s_1,
  s_27,
  s_26,
  s_17,
  s_5,
  s_6_10_27,
  s_9,
  s_18_0,
  s_18_1_0,
  s_1,
  s_4_10_26_32,
  s_1,
  s_4,
  s_4,
  s_5,
  s_1,
  s_5,
  s_5,
  s_5,
  s_1,
  s_6,
  s_5,
  s_1,
  s_26,
  s_1,
  s_5,
  s_5,
  s_26,
  s_1,
  s_1,
  s_2_0,
  s_18,
  s_13,
  s_18,
  s_18,
  s_9,
  s_18,
  s_7,
  s_2,
  s_18,
  s_1,
  s_0,
  s_2,
  s_12,
  s_20,
  s_20,
  s_0,
  s_0,
  s_4,
  s_40,
  s_4,
  s_40,
  s_10_18,
  s_3_7_9_21_42,
  s_26,
  s_6,
  s_6,
  s_10,
  s_23_27,
  s_19,
  s_23,
  s_10,
  s_6,
  s_5,
  s_5_6_1,
  s_0,
  s_0_1,
  s_27,
  s_5,
  s_27,
  s_10,
  s_10,
  s_10,
  s_20,
  s_20,
  s_14,
  s_5,
  s_26,
  s_10,
  s_11_22,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_0,
  s_0,
  s_0,
  s_5_18,
  s_5,
  s_5,
  s_0,
  s_6,
  s_6,
  s_1,
  s_1,
  s_0,
  s_5,
  s_5,
  s_6,
  s_1,
  s_0,
  s_6,
  s_6,
  s_0,
  s_7,
  s_4_7,
  s_6,
  s_30_32,
  s_7_11,
  s_2,
  s_6,
  s_6,
  s_6,
  s_6_8,
  s_1,
  s_1,
  s_35,
  s_4_26,
  s_18,
  s_18,
  s_6,
  s_20,
  s_20,
  s_15,
  s_2_0,
  s_6,
  s_18,
  s_18,
  s_17,
  s_10,
  s_32_41,
  s_0,
  s_4_12,
  s_0,
  s_2,
  s_0,
  s_8,
  s_20,
  s_0,
  s_27,
  s_1,
  s_27_0,
  s_0,
  s_4,
  s_20,
  s_27,
  s_0,
  s_27,
  s_27_0,
  s_0,
  s_26,
  s_22,
  s_1,
  s_27,
  s_26,
  s_26,
  s_26,
  s_6,
  s_26,
  s_14_18,
  s_5,
  s_9,
  s_18,
  s_5,
  s_0,
  s_26,
  s_1,
  s_0_1,
  s_22,
  s_5,
  s_5,
  s_20,
  s_20,
  s_0,
  s_6_18_28,
  s_0,
  s_2,
  s_0,
  s_0,
  s_26,
  s_1,
  s_10,
  s_1,
  s_10,
  s_5,
  s_20,
  s_20,
  s_10,
  s_0,
  s_26,
  s_1_0,
  s_5,
  s_0,
  s_0,
  s_26,
  s_6_1_0,
  s_29,
  s_18,
  s_29,
  s_20,
  s_5,
  s_6,
  s_1,
  s_1,
  s_22,
  s_1,
  s_1,
  s_18,
  s_9,
  s_1,
  s_1,
  s_10_31,
  s_1,
  s_1,
  s_31,
  s_31,
  s_4,
  s_20,
  s_15,
  s_0_1,
  s_26,
  s_10,
  s_10,
  s_6_0,
  s_26,
  s_6_0,
  s_0,
  s_7_0,
  s_0,
  s_31,
  s_18,
  s_31,
  s_0,
  s_2,
  s_7_0,
  s_4_9,
  s_18,
  s_18_0_1,
  s_9,
  s_18,
  s_31,
  s_6,
  s_4_9_10,
  s_18,
  s_0_1,
  s_0,
  s_2,
  s_7,
  s_0,
  s_31,
  s_0,
  s_6,
  s_9_10,
  s_1,
  s_1,
  s_6_22,
  s_6_22,
  s_13_20,
  s_18,
  s_10,
  s_1,
  s_10,
  s_1,
  s_20,
  s_22,
  s_1,
  s_10,
  s_10,
  s_1,
  s_12,
  s_0,
  s_1,
  s_26,
  s_26,
  s_26,
  s_1,
  s_4,
  s_6,
  s_5,
  s_5,
  s_17_18,
  s_0,
  s_0,
  s_2,
  s_9,
  s_18,
  s_1,
  s_26,
  s_5,
  s_5,
  s_26,
  s_5,
  s_5,
  s_26,
  s_1,
  s_18,
  s_5,
  s_5,
  s_22,
  s_20,
  s_6,
  s_0_1,
  s_35,
  s_8,
  s_1,
  s_5,
  s_10,
  s_4,
  s_10_18,
  s_4,
  s_32,
  s_4,
  s_32,
  s_32,
  s_32,
  s_5,
  s_15,
  s_10,
  s_1,
  s_10_1,
  s_2,
  s_35,
  s_18,
  s_31_35,
  s_4_8_9,
  s_5,
  s_27,
  s_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_1_0,
  s_18,
  s_7_14,
  s_6_9_18_35,
  s_4_15_21_26,
  s_18,
  s_0,
  s_18,
  s_18,
  s_5_13,
  s_20,
  s_26,
  s_18_0,
  s_2,
  s_7,
  s_14,
  s_0,
  s_5,
  s_17,
  s_5,
  s_29,
  s_5,
  s_5,
  s_15,
  s_15,
  s_1,
  s_10_28_2_0,
  s_0,
  s_1,
  s_20,
  s_18,
  s_18,
  s_17,
  s_27,
  s_20,
  s_6,
  s_15,
  s_18_1,
  s_27,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_18,
  s_18,
  s_5,
  s_20,
  s_27,
  s_22,
  s_1,
  s_1,
  s_1,
  s_22,
  s_7,
  s_18,
  s_0_1,
  s_7,
  s_6,
  s_17_18_20,
  s_26,
  s_20,
  s_27,
  s_20,
  s_18,
  s_0,
  s_1_0,
  s_10,
  s_0,
  s_0,
  s_18,
  s_0,
  s_5,
  s_29,
  s_20_26,
  s_1_0,
  s_1,
  s_4,
  s_6,
  s_1,
  s_1,
  s_4,
  s_5_20,
  s_20,
  s_0,
  s_20,
  s_26,
  s_1,
  s_1,
  s_26,
  s_26,
  s_6_1,
  s_26,
  s_18,
  s_9,
  s_6_1_0,
  s_29,
  s_18,
  s_29,
  s_6,
  s_1,
  s_0_1,
  s_26,
  s_26,
  s_20,
  s_1,
  s_26,
  s_27,
  s_26,
  s_1,
  s_1,
  s_26,
  s_1,
  s_1,
  s_2,
  s_0,
  s_14,
  s_17,
  s_10,
  s_17_18,
  s_5,
  s_1_0,
  s_13_20,
  s_1_0,
  s_2,
  s_20,
  s_20,
  s_9,
  s_10_11,
  s_4_12_26_37,
  s_0,
  s_18,
  s_18,
  s_26,
  s_26,
  s_1,
  s_1,
  s_1,
  s_6,
  s_20,
  s_1,
  s_1,
  s_26,
  s_22,
  s_6,
  s_4,
  s_26,
  s_18,
  s_9,
  s_26,
  s_1,
  s_26,
  s_4,
  s_20,
  s_26,
  s_6,
  s_20,
  s_20,
  s_1,
  s_26,
  s_6,
  s_6,
  s_9_18_25_31_33_35_38,
  s_0,
  s_6,
  s_5_18,
  s_5,
  s_15,
  s_15,
  s_5,
  s_5,
  s_15,
  s_10,
  s_18_1,
  s_9,
  s_22,
  s_30,
  s_4_10,
  s_22,
  s_30,
  s_4,
  s_9,
  s_18,
  s_18,
  s_12,
  s_1,
  s_18,
  s_12,
  s_1,
  s_15,
  s_18_1,
  s_18,
  s_5_15,
  s_20,
  s_20,
  s_20,
  s_2,
  s_26,
  s_0,
  s_12,
  s_23,
  s_5,
  s_5_15,
  s_18_1,
  s_5,
  s_5,
  s_5,
  s_1,
  s_5,
  s_12_26_37,
  s_0,
  s_0_1,
  s_7_25,
  s_30_0,
  s_4,
  s_5_18,
  s_5,
  s_26,
  s_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_26,
  s_0,
  s_5,
  s_1_0,
  s_20,
  s_20_27,
  s_0,
  s_27,
  s_9,
  s_10,
  s_32,
  s_3_0,
  s_5,
  s_5,
  s_5,
  s_4,
  s_30_36,
  s_7_9,
  s_1,
  s_7,
  s_4_6,
  s_30_36,
  s_29_30_37_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_4_7_26,
  s_9,
  s_1,
  s_18,
  s_9,
  s_10_27,
  s_30,
  s_9,
  s_18_1,
  s_1,
  s_30,
  s_12,
  s_12,
  s_17,
  s_27_1,
  s_13_20,
  s_13,
  s_26,
  s_1,
  s_13,
  s_8,
  s_1,
  s_1,
  s_1,
  s_22,
  s_0,
  s_26,
  s_1,
  s_5,
  s_5,
  s_0,
  s_2,
  s_7,
  s_13_15,
  s_15,
  s_8,
  s_8,
  s_6,
  s_6,
  s_6,
  s_26,
  s_5,
  s_5,
  s_29,
  s_26,
  s_1,
  s_8,
  s_23,
  s_15,
  s_18,
  s_1,
  s_10,
  s_15,
  s_10_18,
  s_10,
  s_15,
  s_17_18,
  s_18,
  s_30,
  s_4,
  s_5_1,
  s_5,
  s_1,
  s_6_35_40,
  s_8,
  s_1,
  s_4,
  s_1,
  s_6,
  s_5,
  s_30,
  s_0,
  s_0,
  s_4_11,
  s_0,
  s_18,
  s_28,
  s_13,
  s_20,
  s_20,
  s_32_36,
  s_4,
  s_4_10,
  s_18,
  s_32,
  s_0,
  s_10,
  s_18,
  s_37,
  s_4_9_12_18_26,
  s_0,
  s_18,
  s_4_0,
  s_2,
  s_10_20_0,
  s_2,
  s_8,
  s_18,
  s_21,
  s_32_41,
  s_0,
  s_0,
  s_0,
  s_6,
  s_4_26,
  s_20_25,
  s_28,
  s_32,
  s_10_28,
  s_6,
  s_1,
  s_9,
  s_9,
  s_14,
  s_5,
  s_5,
  s_1,
  s_6,
  s_1,
  s_30,
  s_30,
  s_5,
  s_6_0,
  s_20,
  s_1,
  s_26,
  s_26,
  s_20,
  s_29_31,
  s_18,
  s_4,
  s_4,
  s_5,
  s_5,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_0,
  s_2,
  s_26,
  s_15_18_26,
  s_5_26,
  s_0,
  s_7_26,
  s_5,
  s_7_26,
  s_2,
  s_10,
  s_26,
  s_0,
  s_2,
  s_1,
  s_5,
  s_5_1,
  s_26,
  s_5,
  s_6,
  s_26,
  s_26,
  s_26,
  s_1,
  s_18_0,
  s_26,
  s_18_0,
  s_0,
  s_26,
  s_0,
  s_27,
  s_1,
  s_26,
  s_26,
  s_1,
  s_26,
  s_1_0,
  s_5,
  s_0,
  s_18,
  s_9,
  s_6,
  s_22,
  s_26,
  s_1,
  s_26,
  s_1,
  s_18,
  s_8,
  s_6,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1_0,
  s_18,
  s_4_10_31_32_34_42,
  s_7,
  s_0,
  s_7,
  s_18,
  s_0,
  s_5,
  s_6,
  s_27_0,
  s_37_41,
  s_4_12_24_26,
  s_6_8_18,
  s_0,
  s_2,
  s_37_41,
  s_15,
  s_15,
  s_15,
  s_15,
  s_15,
  s_15_0,
  s_17,
  s_17,
  s_5,
  s_21_33,
  s_5,
  s_0,
  s_42,
  s_7,
  s_7,
  s_10_11_18_24_0,
  s_2,
  s_6,
  s_1,
  s_30_42,
  s_1,
  s_18_1_0,
  s_5,
  s_5,
  s_6,
  s_5,
  s_0,
  s_0,
  s_0,
  s_5_6_7,
  s_1,
  s_20,
  s_5,
  s_1,
  s_1,
  s_0,
  s_10,
  s_10,
  s_10_0,
  s_8_0,
  s_7,
  s_2,
  s_0,
  s_6,
  s_6_0,
  s_6_0,
  s_10,
  s_20,
  s_20,
  s_5,
  s_0,
  s_20,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_22,
  s_5,
  s_17,
  s_20,
  s_20,
  s_20,
  s_20,
  s_36,
  s_18,
  s_36,
  s_10,
  s_5,
  s_18,
  s_0,
  s_0,
  s_27,
  s_20,
  s_5,
  s_5,
  s_27,
  s_1,
  s_26,
  s_26,
  s_20,
  s_1,
  s_1,
  s_1,
  s_9,
  s_9,
  s_22,
  s_1,
  s_1,
  s_22,
  s_5_18_0,
  s_0,
  s_5,
  s_4,
  s_1,
  s_18,
  s_9,
  s_1,
  s_1,
  s_4,
  s_0,
  s_31,
  s_9,
  s_31,
  s_0,
  s_18,
  s_1,
  s_18,
  s_4,
  s_9,
  s_20,
  s_5,
  s_20,
  s_18_0,
  s_27,
  s_1,
  s_6_0,
  s_9,
  s_1,
  s_6,
  s_0,
  s_6_1,
  s_17,
  s_14,
  s_6_1,
  s_0,
  s_27,
  s_4_29_0,
  s_1,
  s_27,
  s_6_0,
  s_6,
  s_18,
  s_18_0,
  s_30_31_32_37_41,
  s_0,
  s_9_12_26,
  s_0,
  s_18,
  s_0,
  s_0_1,
  s_1,
  s_10_11,
  s_0,
  s_0_2,
  s_6,
  s_4,
  s_1,
  s_6,
  s_26,
  s_1,
  s_6,
  s_6,
  s_6,
  s_6,
  s_10,
  s_5,
  s_1,
  s_6,
  s_0,
  s_17,
  s_6,
  s_6,
  s_9,
  s_9,
  s_4,
  s_18,
  s_1,
  s_19,
  s_0,
  s_6,
  s_27,
  s_6_1,
  s_27,
  s_1,
  s_18,
  s_5,
  s_18,
  s_10,
  s_15,
  s_18_1,
  s_0,
  s_18,
  s_6,
  s_6,
  s_27_0,
  s_0,
  s_17,
  s_15,
  s_5,
  s_5,
  s_10,
  s_10,
  s_5,
  s_6,
  s_0,
  s_6,
  s_27,
  s_17,
  s_6,
  s_6_0,
  s_6_0,
  s_0,
  s_1,
  s_1,
  s_0,
  s_27,
  s_17,
  s_6,
  s_6,
  s_6_1,
  s_17,
  s_17,
  s_15,
  s_10,
  s_18_1,
  s_9,
  s_10,
  s_15,
  s_27,
  s_0,
  s_17,
  s_13,
  s_0,
  s_0,
  s_9_12,
  s_0,
  s_6,
  s_0,
  s_10,
  s_10_1,
  s_10_1,
  s_10,
  s_10,
  s_24_1,
  s_24,
  s_1,
  s_15,
  s_1,
  s_18,
  s_17,
  s_6,
  s_6,
  s_6,
  s_4,
  s_6_0,
  s_18_1,
  s_17,
  s_18,
  s_30,
  s_0,
  s_6_18_30_40_0,
  s_6_7_28,
  s_22,
  s_20,
  s_1,
  s_1,
  s_9,
  s_22_26,
  s_6_0,
  s_29,
  s_8,
  s_0,
  s_6,
  s_10,
  s_1,
  s_0,
  s_6,
  s_0,
  s_17,
  s_10_24,
  s_0,
  s_0,
  s_2,
  s_1,
  s_0,
  s_27,
  s_19,
  s_19,
  s_0,
  s_1,
  s_1,
  s_6,
  s_9,
  s_1,
  s_1,
  s_27,
  s_27,
  s_6,
  s_6_1,
  s_5,
  s_0,
  s_17,
  s_5,
  s_15,
  s_18,
  s_18,
  s_18,
  s_10,
  s_0,
  s_24,
  s_0,
  s_5,
  s_8,
  s_0,
  s_18,
  s_15,
  s_15,
  s_18,
  s_18,
  s_18,
  s_5,
  s_5_1,
  s_26,
  s_1,
  s_26,
  s_1,
  s_0,
  s_8,
  s_15,
  s_6_8,
  s_12_26,
  s_6_1,
  s_0,
  s_2,
  s_12_26,
  s_2_0,
  s_2,
  s_2,
  s_2,
  s_2,
  s_2,
  s_2,
  s_18,
  s_15,
  s_10,
  s_1,
  s_8,
  s_1,
  s_1,
  s_26,
  s_5,
  s_5,
  s_2,
  s_10_18,
  s_6,
  s_17,
  s_21,
  s_5,
  s_2_0,
  s_10,
  s_6,
  s_0,
  s_2,
  s_7_12,
  s_27,
  s_5,
  s_5,
  s_5,
  s_6,
  s_5_18_32_42,
  s_15,
  s_0,
  s_17,
  s_18,
  s_10,
  s_5,
  s_6_0,
  s_0,
  s_13,
  s_6_17,
  s_4,
  s_0,
  s_15,
  s_22,
  s_1,
  s_26,
  s_26,
  s_18_1,
  s_27,
  s_1,
  s_26,
  s_18_1_0,
  s_5,
  s_15,
  s_4_22,
  s_1,
  s_22,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_0,
  s_32,
  s_10,
  s_18,
  s_1_0,
  s_32,
  s_0,
  s_5,
  s_12,
  s_6_0,
  s_0,
  s_18,
  s_5,
  s_20,
  s_20,
  s_20,
  s_0,
  s_15,
  s_20,
  s_1,
  s_1,
  s_18,
  s_6,
  s_0,
  s_0,
  s_1,
  s_4,
  s_18,
  s_5,
  s_2,
  s_20,
  s_5,
  s_0,
  s_6,
  s_20,
  s_0,
  s_0,
  s_5,
  s_5,
  s_0,
  s_26,
  s_20,
  s_27,
  s_1,
  s_5,
  s_5,
  s_7,
  s_5,
  s_5,
  s_26,
  s_1,
  s_1,
  s_15,
  s_10_11,
  s_1_0,
  s_0,
  s_0,
  s_0,
  s_10,
  s_0,
  s_10,
  s_1_0,
  s_20,
  s_1,
  s_20,
  s_0,
  s_0,
  s_5,
  s_5,
  s_0,
  s_5,
  s_5,
  s_0,
  s_27,
  s_1,
  s_1,
  s_1,
  s_22,
  s_1,
  s_15_28,
  s_5,
  s_5,
  s_5,
  s_15,
  s_5,
  s_0,
  s_18,
  s_18,
  s_0,
  s_2,
  s_9,
  s_10,
  s_32,
  s_18,
  s_32,
  s_10,
  s_9_10,
  s_15,
  s_20,
  s_1_0,
  s_1,
  s_22,
  s_6,
  s_8,
  s_1,
  s_1,
  s_10,
  s_1,
  s_9,
  s_10,
  s_1,
  s_8_20,
  s_1,
  s_1,
  s_1,
  s_26,
  s_19,
  s_20,
  s_15,
  s_10,
  s_1,
  s_4_26,
  s_18_0,
  s_32,
  s_32,
  s_18,
  s_4,
  s_1,
  s_1,
  s_10,
  s_1,
  s_32,
  s_32,
  s_18,
  s_1,
  s_20,
  s_10,
  s_1_0,
  s_1,
  s_31,
  s_4_18,
  s_31,
  s_31,
  s_0,
  s_37,
  s_15,
  s_18_1,
  s_17,
  s_37,
  s_0,
  s_11_0,
  s_2,
  s_5,
  s_21,
  s_18,
  s_6_8,
  s_6_29,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4_9_11_18,
  s_0,
  s_4_7_10_32_37_41,
  s_0,
  s_0,
  s_2,
  s_7,
  s_30_36_39_41,
  s_4_7_9_11,
  s_4,
  s_0,
  s_32_34_37,
  s_4,
  s_18,
  s_0,
  s_18_1,
  s_1,
  s_10,
  s_10_1_0,
  s_32_35,
  s_6_8,
  s_0,
  s_0,
  s_4,
  s_4,
  s_26,
  s_6,
  s_1,
  s_5,
  s_8_10,
  s_5,
  s_39,
  s_9,
  s_0,
  s_42,
  s_12,
  s_12,
  s_0,
  s_13,
  s_0,
  s_7,
  s_12,
  s_1,
  s_13,
  s_0,
  s_7,
  s_32,
  s_0,
  s_18,
  s_10,
  s_13_20,
  s_6_9,
  s_13,
  s_20,
  s_10_13,
  s_10,
  s_15_18,
  s_20,
  s_6,
  s_24,
  s_0,
  s_18,
  s_4_6_10,
  s_0,
  s_6,
  s_0,
  s_0,
  s_6_18,
  s_6_36,
  s_32_34_35_40_41_42,
  s_10,
  s_40_41,
  s_0,
  s_18,
  s_0_1,
  s_4_6_14_18,
  s_40,
  s_0,
  s_0,
  s_4,
  s_4,
  s_0,
  s_35,
  s_0,
  s_7,
  s_4_22_24,
  s_1,
  s_1,
  s_2,
  s_4_9_10,
  s_31,
  s_18,
  s_0,
  s_0,
  s_2,
  s_30_31_37_40,
  s_0,
  s_4_9_10,
  s_0,
  s_2,
  s_12,
  s_18,
  s_31_35_37,
  s_0,
  s_18,
  s_0,
  s_4_9_12,
  s_0,
  s_2,
  s_12,
  s_18_31,
  s_0,
  s_4,
  s_0,
  s_10,
  s_30_32,
  s_30_32,
  s_26,
  s_4_6_7_10_11_15_32_38_41_42,
  s_7,
  s_0,
  s_4_7_11_0,
  s_31_32,
  s_10_12,
  s_0,
  s_0,
  s_0,
  s_31_40_0,
  s_2,
  s_7,
  s_4_21,
  s_1,
  s_18,
  s_4_10_12_26,
  s_31_32,
  s_0,
  s_18,
  s_4_0,
  s_2,
  s_31_42_0,
  s_2,
  s_4_7_9_10,
  s_0,
  s_6,
  s_0,
  s_28,
  s_0,
  s_26,
  s_0,
  s_6,
  s_7_13_20,
  s_28,
  s_6_15,
  s_0_2,
  s_6,
  s_1,
  s_6,
  s_18,
  s_0,
  s_5,
  s_0,
  s_0,
  s_5,
  s_5,
  s_5,
  s_9,
  s_1,
  s_2,
  s_7,
  s_15,
  s_5_17,
  s_15,
  s_7,
  s_1,
  s_4,
  s_6,
  s_7_27,
  s_18,
  s_26,
  s_0,
  s_6_38,
  s_6,
  s_15_17_18,
  s_20_0_1,
  s_4,
  s_4_6_36,
  s_13,
  s_6,
  s_0_1,
  s_1,
  s_4,
  s_17,
  s_1,
  s_20,
  s_5_15_17,
  s_20,
  s_20,
  s_0,
  s_18,
  s_15,
  s_15,
  s_5_17,
  s_5_18,
  s_6_7,
  s_15,
  s_5_18_1,
  s_10_1,
  s_20,
  s_7,
  s_20,
  s_18,
  s_0,
  s_20,
  s_1,
  s_20,
  s_5,
  s_5,
  s_1,
  s_5_8_1,
  s_26,
  s_18,
  s_15_18,
  s_27,
  s_17,
  s_17,
  s_13,
  s_20,
  s_20,
  s_20,
  s_15,
  s_18_1,
  s_10_1,
  s_5,
  s_18_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_1,
  s_5,
  s_10,
  s_10_18,
  s_10_18,
  s_17,
  s_20,
  s_6,
  s_17,
  s_17,
  s_20,
  s_20,
  s_20,
  s_6,
  s_10_18,
  s_10_18_1,
  s_18,
  s_17,
  s_18,
  s_6,
  s_6,
  s_18,
  s_0,
  s_4_40,
  s_18,
  s_18,
  s_1,
  s_4,
  s_2,
  s_7,
  s_0,
  s_32,
  s_4_10,
  s_1,
  s_1,
  s_18,
  s_4,
  s_6_20,
  s_0,
  s_1,
  s_0_1,
  s_0,
  s_0,
  s_0,
  s_6,
  s_1,
  s_4,
  s_18,
  s_0,
  s_30,
  s_18,
  s_30,
  s_4,
  s_1,
  s_5,
  s_20,
  s_6,
  s_5,
  s_20,
  s_19_25_38,
  s_5,
  s_6,
  s_15,
  s_18_0,
  s_10,
  s_0,
  s_10,
  s_24,
  s_24,
  s_24,
  s_24,
  s_23,
  s_0,
  s_5,
  s_5,
  s_20,
  s_6_8_25_38_0,
  s_0,
  s_5,
  s_5,
  s_5,
  s_1,
  s_1,
  s_18,
  s_9,
  s_5,
  s_5,
  s_5,
  s_28_0,
  s_0,
  s_10,
  s_30,
  s_10,
  s_18,
  s_1,
  s_30,
  s_18_20,
  s_1,
  s_1,
  s_18,
  s_15,
  s_18,
  s_15,
  s_1,
  s_15,
  s_1,
  s_18,
  s_15,
  s_18,
  s_28_0,
  s_1_0,
  s_1,
  s_1,
  s_20,
  s_5,
  s_5,
  s_1,
  s_1,
  s_18,
  s_9,
  s_5,
  s_28_0,
  s_1,
  s_15_18,
  s_5,
  s_4,
  s_20,
  s_1,
  s_20,
  s_0,
  s_9,
  s_0,
  s_5,
  s_5,
  s_1,
  s_26,
  s_5,
  s_1,
  s_20_27,
  s_5,
  s_18,
  s_18,
  s_23,
  s_0,
  s_8,
  s_1,
  s_17,
  s_18,
  s_1,
  s_9,
  s_1,
  s_2,
  s_4_6_7_9,
  s_5,
  s_6,
  s_1,
  s_6_35,
  s_10,
  s_18,
  s_2,
  s_7,
  s_5,
  s_5,
  s_5,
  s_5_1,
  s_18,
  s_6,
  s_5,
  s_0,
  s_23,
  s_0,
  s_24,
  s_24,
  s_23,
  s_24,
  s_24,
  s_24,
  s_24,
  s_6_15_0,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_17,
  s_0,
  s_8,
  s_14,
  s_5,
  s_23,
  s_5,
  s_15,
  s_0,
  s_2,
  s_20,
  s_12,
  s_12,
  s_26,
  s_0,
  s_2,
  s_7,
  s_23,
  s_6_7_8_9_15_26,
  s_1,
  s_6,
  s_20,
  s_20,
  s_20,
  s_26,
  s_6_15_26,
  s_0,
  s_5_20,
  s_5,
  s_5,
  s_18,
  s_20,
  s_1,
  s_8,
  s_1,
  s_1,
  s_18,
  s_14_15,
  s_15,
  s_20,
  s_18,
  s_17,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_27_0,
  s_1,
  s_0,
  s_5_15,
  s_5_1,
  s_18_1,
  s_5,
  s_5,
  s_27,
  s_1,
  s_27,
  s_0,
  s_27,
  s_27,
  s_5,
  s_5,
  s_18_1,
  s_17,
  s_27,
  s_5_18,
  s_5,
  s_5,
  s_4,
  s_27,
  s_15,
  s_14,
  s_10,
  s_0,
  s_2,
  s_32,
  s_18,
  s_32,
  s_10,
  s_9_10,
  s_9_10,
  s_0,
  s_2,
  s_17,
  s_5_18,
  s_5,
  s_6,
  s_6,
  s_5,
  s_20,
  s_20,
  s_27,
  s_6,
  s_5,
  s_20,
  s_18,
  s_18,
  s_15,
  s_10,
  s_18,
  s_15,
  s_9,
  s_18,
  s_18,
  s_18,
  s_10_18,
  s_0,
  s_7_26,
  s_26,
  s_15_17_18,
  s_10,
  s_2,
  s_5,
  s_10_18,
  s_20,
  s_0,
  s_0,
  s_5,
  s_20,
  s_5,
  s_0,
  s_10,
  s_20,
  s_20,
  s_29_30_38_41_42,
  s_20,
  s_5,
  s_17_18,
  s_27,
  s_14,
  s_18,
  s_0,
  s_0,
  s_2,
  s_20,
  s_20,
  s_20,
  s_27,
  s_18,
  s_18_1,
  s_20,
  s_18_1,
  s_9,
  s_1,
  s_18,
  s_9,
  s_9_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_5_18,
  s_5_15,
  s_18,
  s_18,
  s_18,
  s_6,
  s_18,
  s_15_17,
  s_18,
  s_21,
  s_15,
  s_6_8_14_33_40,
  s_14,
  s_5,
  s_5,
  s_5,
  s_4_15,
  s_13,
  s_4_6,
  s_14,
  s_6,
  s_6_10,
  s_6,
  s_0,
  s_15,
  s_10_18_1,
  s_20,
  s_6,
  s_23,
  s_6,
  s_6,
  s_18,
  s_6,
  s_20,
  s_20,
  s_1,
  s_18,
  s_4,
  s_18_1,
  s_9,
  s_18,
  s_26,
  s_0,
  s_6,
  s_0,
  s_6,
  s_5_6_14_40,
  s_20,
  s_0,
  s_14_18,
  s_1,
  s_6_9,
  s_5_6_14_40,
  s_0,
  s_14_18,
  s_6_9,
  s_8,
  s_6,
  s_6,
  s_18,
  s_14,
  s_5,
  s_14,
  s_15,
  s_6_20,
  s_17,
  s_18,
  s_20,
  s_20_1,
  s_7_9,
  s_4,
  s_1_0,
  s_39,
  s_39,
  s_18,
  s_2,
  s_4_9_26,
  s_29_36_37_38,
  s_0,
  s_18,
  s_18,
  s_10,
  s_23,
  s_6,
  s_13,
  s_32_41,
  s_10,
  s_29_31_32_35_36,
  s_0,
  s_4_7_9_10_14,
  s_18,
  s_4,
  s_0,
  s_6,
  s_6_10_14_31_35,
  s_0,
  s_21_26,
  s_4_26_33_35_38,
  s_6,
  s_0,
  s_20,
  s_18,
  s_26,
  s_0,
  s_0,
  s_4_18,
  s_38_41,
  s_10,
  s_18,
  s_18,
  s_23,
  s_7,
  s_0,
  s_2,
  s_40,
  s_4,
  s_18,
  s_6_10,
  s_6,
  s_20_27,
  s_18,
  s_5,
  s_17,
  s_8,
  s_8,
  s_6,
  s_27,
  s_27,
  s_27_1,
  s_27,
  s_1,
  s_27,
  s_27,
  s_4,
  s_18,
  s_4_6_9_10,
  s_5,
  s_5,
  s_18,
  s_3,
  s_1,
  s_5,
  s_18,
  s_20,
  s_8,
  s_1,
  s_30,
  s_30,
  s_26,
  s_26,
  s_6,
  s_4,
  s_8,
  s_1,
  s_8,
  s_26,
  s_26,
  s_1,
  s_1,
  s_26,
  s_6_8,
  s_0,
  s_0,
  s_2,
  s_7,
  s_26,
  s_1,
  s_18_0,
  s_26,
  s_4,
  s_4,
  s_6,
  s_4,
  s_8,
  s_1,
  s_26,
  s_4,
  s_5,
  s_5,
  s_1,
  s_1,
  s_1,
  s_20,
  s_6,
  s_4,
  s_20,
  s_1,
  s_1,
  s_18,
  s_1,
  s_13_20,
  s_3_10_32,
  s_0,
  s_1,
  s_1,
  s_32_40_42_0,
  s_0,
  s_2,
  s_7,
  s_8,
  s_4_8_10_25,
  s_1,
  s_8_18,
  s_1,
  s_3,
  s_1,
  s_4,
  s_18,
  s_0,
  s_7,
  s_2,
  s_6_10_14,
  s_18,
  s_5_1,
  s_5,
  s_1,
  s_18,
  s_18,
  s_18,
  s_1_0,
  s_2,
  s_9,
  s_0,
  s_2,
  s_7,
  s_20,
  s_15,
  s_9,
  s_10,
  s_10,
  s_0,
  s_15,
  s_20,
  s_5,
  s_10,
  s_20,
  s_1,
  s_20,
  s_20,
  s_18,
  s_5,
  s_18_1,
  s_8,
  s_8,
  s_28,
  s_27,
  s_27,
  s_15,
  s_14,
  s_15,
  s_10,
  s_7,
  s_18,
  s_2,
  s_20,
  s_28,
  s_20,
  s_1,
  s_27,
  s_26,
  s_5,
  s_5,
  s_26,
  s_5,
  s_5,
  s_5,
  s_38_41_42,
  s_0,
  s_26,
  s_26,
  s_18_26_0,
  s_26,
  s_26,
  s_18_26_0,
  s_10_18,
  s_0,
  s_4_0,
  s_4_11_28,
  s_1,
  s_0,
  s_4_11_17,
  s_31_32,
  s_0,
  s_0,
  s_4,
  s_18_1_0,
  s_1_0,
  s_2,
  s_4_7_9,
  s_18,
  s_5,
  s_5,
  s_5,
  s_10,
  s_26,
  s_1,
  s_20,
  s_20,
  s_1,
  s_20,
  s_18,
  s_20,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_20,
  s_5,
  s_20,
  s_1,
  s_1,
  s_6,
  s_0,
  s_31,
  s_9,
  s_20,
  s_6,
  s_2,
  s_14,
  s_22_26,
  s_0,
  s_0,
  s_7,
  s_2,
  s_9,
  s_20_27_30,
  s_0,
  s_2,
  s_6,
  s_13,
  s_6,
  s_18,
  s_0,
  s_15,
  s_18,
  s_18,
  s_15,
  s_6,
  s_2,
  s_15,
  s_18,
  s_18,
  s_6,
  s_15_18,
  s_18,
  s_0,
  s_14_17,
  s_18_1,
  s_18_1,
  s_10_2,
  s_5,
  s_20,
  s_18,
  s_28,
  s_0,
  s_7,
  s_5,
  s_32_41_42,
  s_2_0,
  s_0,
  s_18,
  s_2_0,
  s_10,
  s_18,
  s_10,
  s_2_0,
  s_0_2,
  s_0,
  s_15,
  s_15,
  s_0,
  s_5,
  s_15,
  s_20,
  s_20,
  s_6,
  s_27,
  s_13_20,
  s_13,
  s_7_9_24,
  s_1,
  s_20,
  s_23,
  s_6,
  s_20,
  s_20,
  s_26,
  s_20,
  s_7,
  s_32,
  s_4_10,
  s_6,
  s_20,
  s_27_35,
  s_1,
  s_0,
  s_0,
  s_20,
  s_20,
  s_20,
  s_20,
  s_26,
  s_30_35,
  s_1,
  s_0,
  s_4_26,
  s_6,
  s_13,
  s_5,
  s_5,
  s_20,
  s_5,
  s_15,
  s_18_0,
  s_10_29_32_35,
  s_4_7_10_12,
  s_6,
  s_31,
  s_18,
  s_6,
  s_0,
  s_5,
  s_20,
  s_20,
  s_0,
  s_4_5_8_18,
  s_6,
  s_32_33,
  s_7,
  s_0,
  s_18,
  s_15,
  s_10_18_1,
  s_18,
  s_32_41,
  s_0,
  s_4_10,
  s_18,
  s_4_5_32_33_41,
  s_18,
  s_0,
  s_4_9_10_27_31_41,
  s_18,
  s_6,
  s_4_6_14,
  s_36_41,
  s_10,
  s_4,
  s_4_6_14,
  s_18,
  s_18,
  s_10_32,
  s_18,
  s_0,
  s_10,
  s_31_32_41,
  s_0,
  s_0,
  s_18,
  s_0,
  s_10,
  s_0,
  s_2,
  s_7,
  s_31_40,
  s_0,
  s_18,
  s_4_7_9_21,
  s_18,
  s_7,
  s_21,
  s_32,
  s_10,
  s_18,
  s_8_18,
  s_30_32,
  s_10_22,
  s_7,
  s_0,
  s_2,
  s_7,
  s_31_34_40_41,
  s_0,
  s_4,
  s_0,
  s_18,
  s_4,
  s_4_10_21,
  s_18,
  s_0,
  s_30_31_35,
  s_0,
  s_9_22_26,
  s_0,
  s_18,
  s_0,
  s_4_41,
  s_4_7_21,
  s_18_0,
  s_0,
  s_0,
  s_10,
  s_14,
  s_7,
  s_0,
  s_7,
  s_10_11_18_31_41_0,
  s_4,
  s_4_9_14_22_24_26,
  s_1,
  s_9,
  s_0,
  s_0,
  s_32,
  s_10,
  s_0,
  s_42,
  s_31_41,
  s_0,
  s_4_14,
  s_15,
  s_29_34_37,
  s_12,
  s_15,
  s_0,
  s_29_30_31_35_36_38_40_41,
  s_0,
  s_0,
  s_4_7_9_10_11_28,
  s_0,
  s_15,
  s_9_10_21,
  s_18,
  s_31_32_37,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_15,
  s_10_18,
  s_9,
  s_5,
  s_5,
  s_5,
  s_18,
  s_15,
  s_18,
  s_26,
  s_0,
  s_27,
  s_8_20,
  s_20,
  s_26,
  s_1,
  s_20,
  s_8,
  s_10_30,
  s_0,
  s_17_25,
  s_1,
  s_2,
  s_0,
  s_17_0,
  s_1,
  s_5,
  s_17_18,
  s_26,
  s_0,
  s_26,
  s_17,
  s_26,
  s_26,
  s_18_0,
  s_0,
  s_26,
  s_26,
  s_20,
  s_0,
  s_1,
  s_0,
  s_0,
  s_31,
  s_0,
  s_0,
  s_2,
  s_12,
  s_18,
  s_31,
  s_0,
  s_0,
  s_2,
  s_6_8,
  s_1,
  s_8_20,
  s_15_27,
  s_1,
  s_20,
  s_26,
  s_2,
  s_20,
  s_2,
  s_30_35,
  s_9,
  s_7_9,
  s_6_0,
  s_9,
  s_8,
  s_1,
  s_6,
  s_9,
  s_38,
  s_18,
  s_8,
  s_6,
  s_4,
  s_18,
  s_1,
  s_18,
  s_9,
  s_20,
  s_9,
  s_18,
  s_1,
  s_1,
  s_9,
  s_4,
  s_20,
  s_18,
  s_1_0,
  s_1_0,
  s_2,
  s_9,
  s_1,
  s_18,
  s_9,
  s_5,
  s_5,
  s_0,
  s_2,
  s_9,
  s_0,
  s_15,
  s_2_0,
  s_15,
  s_18,
  s_18,
  s_28,
  s_18,
  s_15,
  s_6,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_25,
  s_1,
  s_2,
  s_24,
  s_0,
  s_24,
  s_26,
  s_0,
  s_10,
  s_26,
  s_1,
  s_26,
  s_26,
  s_6,
  s_1,
  s_10_18,
  s_10,
  s_27,
  s_6_0,
  s_6,
  s_7,
  s_0,
  s_12,
  s_18,
  s_11,
  s_18,
  s_0,
  s_26,
  s_1,
  s_26,
  s_10,
  s_18,
  s_26,
  s_26,
  s_1,
  s_5,
  s_6,
  s_26,
  s_18,
  s_6,
  s_14,
  s_10_18,
  s_10_18,
  s_9,
  s_18,
  s_6,
  s_10_18,
  s_10_18,
  s_27,
  s_9,
  s_18_1,
  s_1_0,
  s_1_0,
  s_18,
  s_18,
  s_6_14,
  s_5_18,
  s_6_14,
  s_18_1,
  s_15,
  s_5,
  s_5,
  s_6,
  s_26,
  s_8,
  s_1,
  s_1,
  s_26,
  s_1,
  s_5,
  s_26,
  s_15,
  s_5,
  s_0,
  s_18,
  s_1_0,
  s_7,
  s_4_11,
  s_6,
  s_15,
  s_20,
  s_2,
  s_20,
  s_20,
  s_0,
  s_6,
  s_4_15,
  s_17_1,
  s_18,
  s_9,
  s_6_8_10_18,
  s_6_10_23,
  s_6,
  s_7_15_17_23_26,
  s_1,
  s_1,
  s_11,
  s_13,
  s_17,
  s_27,
  s_0_1,
  s_4,
  s_30_33_35,
  s_6,
  s_9,
  s_0,
  s_0,
  s_4,
  s_30_33_35,
  s_6,
  s_18,
  s_0,
  s_10,
  s_1,
  s_10,
  s_2,
  s_37_41,
  s_4_21,
  s_26,
  s_0_1,
  s_26,
  s_26,
  s_2,
  s_26,
  s_26,
  s_26,
  s_6,
  s_0,
  s_27,
  s_0,
  s_27,
  s_26,
  s_18,
  s_1,
  s_5,
  s_5,
  s_1,
  s_0,
  s_20,
  s_6_8,
  s_0,
  s_2,
  s_7,
  s_4_7,
  s_20,
  s_26,
  s_1,
  s_0,
  s_11_26_29,
  s_5,
  s_6,
  s_18,
  s_6,
  s_10_18,
  s_10,
  s_10_18,
  s_35_40_41,
  s_0,
  s_6_18,
  s_0,
  s_4_6_10_12,
  s_4_10_22_26_29_30_32_33,
  s_18,
  s_0,
  s_38_40_41,
  s_26,
  s_0,
  s_26,
  s_4,
  s_0,
  s_4_9,
  s_39_41,
  s_20,
  s_27,
  s_30,
  s_4_36_41,
  s_0,
  s_18,
  s_39_41_42,
  s_4_14_28,
  s_11_18_0,
  s_0,
  s_18,
  s_18,
  s_4_9,
  s_4_7_9,
  s_1,
  s_0,
  s_2,
  s_7_9,
  s_30_0,
  s_0,
  s_7_11,
  s_6,
  s_32,
  s_18,
  s_10,
  s_18,
  s_0,
  s_18,
  s_18,
  s_6_8_10_1,
  s_15,
  s_5,
  s_18,
  s_8,
  s_6_29,
  s_0,
  s_4_7_9_24,
  s_1,
  s_41,
  s_41,
  s_18,
  s_31,
  s_18,
  s_4,
  s_28,
  s_35_37,
  s_0,
  s_9_18,
  s_7_9_10_18_19,
  s_0,
  s_2,
  s_7,
  s_9_18,
  s_0,
  s_3_9_31,
  s_9,
  s_0,
  s_2,
  s_0,
  s_4_11_12_19_22,
  s_1,
  s_30,
  s_0,
  s_0,
  s_26,
  s_2,
  s_6,
  s_13_20,
  s_0,
  s_14,
  s_18,
  s_15,
  s_4_40,
  s_18_40,
  s_1,
  s_20,
  s_0,
  s_2,
  s_7,
  s_7,
  s_5,
  s_18,
  s_1,
  s_7,
  s_4_0,
  s_7,
  s_2,
  s_10_14_26,
  s_18_1,
  s_6_7_10,
  s_6,
  s_6,
  s_9,
  s_6,
  s_1,
  s_4_9,
  s_6,
  s_6_1,
  s_4_21_31,
  s_4_9_36,
  s_1,
  s_18,
  s_6,
  s_1,
  s_18,
  s_28,
  s_0,
  s_18,
  s_23,
  s_6,
  s_23,
  s_27,
  s_1,
  s_30,
  s_4_10_11,
  s_0,
  s_0,
  s_6,
  s_18_32,
  s_11,
  s_28_0,
  s_15,
  s_1,
  s_18,
  s_18,
  s_18,
  s_5,
  s_5,
  s_5,
  s_0,
  s_5,
  s_5,
  s_14,
  s_18,
  s_18,
  s_18,
  s_7_26,
  s_1,
  s_2,
  s_0,
  s_18,
  s_20,
  s_7_19,
  s_6,
  s_1,
  s_8,
  s_8_20,
  s_1,
  s_8,
  s_20,
  s_20,
  s_20,
  s_0,
  s_0,
  s_1,
  s_0,
  s_0,
  s_30,
  s_17,
  s_5,
  s_6,
  s_5,
  s_18_19_28,
  s_1,
  s_1,
  s_6,
  s_1,
  s_6,
  s_39,
  s_4,
  s_1,
  s_18,
  s_30_32,
  s_11,
  s_4,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_27,
  s_1,
  s_0,
  s_2,
  s_7,
  s_7,
  s_4_15,
  s_15,
  s_23_0,
  s_15,
  s_1,
  s_15_17,
  s_10_18_1,
  s_5_1,
  s_5,
  s_15,
  s_18_1,
  s_20,
  s_15,
  s_10_18_1,
  s_20,
  s_8,
  s_1,
  s_1,
  s_1,
  s_14_26,
  s_0,
  s_1_0,
  s_26,
  s_18,
  s_0,
  s_2,
  s_31,
  s_0,
  s_4_10,
  s_18,
  s_7,
  s_18_36,
  s_18,
  s_1,
  s_4_7_10,
  s_32_41,
  s_0,
  s_18,
  s_18_0,
  s_14,
  s_0,
  s_2,
  s_14,
  s_7_9_10_14_18,
  s_4_7_10,
  s_32_41,
  s_0,
  s_18,
  s_4,
  s_9,
  s_0,
  s_6,
  s_27,
  s_6,
  s_18,
  s_1,
  s_1,
  s_10,
  s_6,
  s_22,
  s_1,
  s_18,
  s_0,
  s_0,
  s_0,
  s_7,
  s_6_29,
  s_8,
  s_9_14,
  s_18,
  s_0,
  s_2,
  s_6,
  s_18,
  s_1,
  s_0,
  s_0,
  s_4,
  s_4,
  s_19,
  s_0,
  s_6,
  s_0,
  s_0,
  s_11,
  s_19,
  s_1,
  s_0,
  s_4,
  s_0,
  s_19,
  s_6,
  s_8,
  s_10_32,
  s_0,
  s_1,
  s_6,
  s_0,
  s_1,
  s_26,
  s_6,
  s_4,
  s_6,
  s_0,
  s_0,
  s_22,
  s_1,
  s_14,
  s_6,
  s_30,
  s_0,
  s_6_0,
  s_2,
  s_4_6_26,
  s_30,
  s_4,
  s_30,
  s_6_18,
  s_0,
  s_5,
  s_6_38,
  s_18,
  s_1_0,
  s_26,
  s_0,
  s_0,
  s_26,
  s_20,
  s_1,
  s_6_9,
  s_1,
  s_4_8,
  s_4_39,
  s_6,
  s_1,
  s_22,
  s_22,
  s_0,
  s_4,
  s_1,
  s_8,
  s_6,
  s_4,
  s_1,
  s_9,
  s_1,
  s_35,
  s_35,
  s_4,
  s_20,
  s_1,
  s_6_22,
  s_1,
  s_22,
  s_28,
  s_0,
  s_15,
  s_22,
  s_1,
  s_18_0,
  s_27,
  s_1,
  s_5,
  s_5,
  s_7_34_41,
  s_7,
  s_0,
  s_7,
  s_11_38,
  s_18,
  s_18,
  s_20,
  s_4_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_1,
  s_18,
  s_1,
  s_1,
  s_20,
  s_33,
  s_44,
  s_18,
  s_20,
  s_6,
  s_27,
  s_4_6,
  s_32,
  s_9_24_31_41_42_0,
  s_7_26,
  s_10,
  s_20,
  s_18,
  s_0,
  s_4_12,
  s_1,
  s_38_41,
  s_0,
  s_0,
  s_4,
  s_5,
  s_10,
  s_10_1,
  s_1,
  s_30,
  s_30,
  s_6,
  s_38,
  s_4_9_14,
  s_18,
  s_18,
  s_18,
  s_18,
  s_20,
  s_20,
  s_0,
  s_12,
  s_2,
  s_12,
  s_14,
  s_1,
  s_1,
  s_15,
  s_1,
  s_9,
  s_0,
  s_26,
  s_1,
  s_23,
  s_13_20_0,
  s_4,
  s_1,
  s_5,
  s_18,
  s_32_34_41,
  s_0,
  s_4,
  s_7_23,
  s_15_17,
  s_32,
  s_10,
  s_32,
  s_10,
  s_0,
  s_2,
  s_18,
  s_38,
  s_4_11,
  s_1,
  s_31,
  s_0,
  s_29_0,
  s_29_31,
  s_0,
  s_4,
  s_4_10_21_40,
  s_4,
  s_0,
  s_9,
  s_0,
  s_0_2,
  s_26,
  s_12_37,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0_2,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7_9,
  s_6,
  s_0,
  s_20,
  s_20,
  s_0,
  s_6,
  s_0,
  s_0,
  s_0,
  s_18_0,
  s_2_0,
  s_6_30_35,
  s_0,
  s_27,
  s_1_0,
  s_2,
  s_20,
  s_1,
  s_8,
  s_1,
  s_1,
  s_9,
  s_10,
  s_1_0,
  s_1,
  s_2,
  s_6_8_9_14_20,
  s_6,
  s_6,
  s_8,
  s_5,
  s_8,
  s_1,
  s_8,
  s_20,
  s_18,
  s_20,
  s_18,
  s_10,
  s_15,
  s_5,
  s_5,
  s_10,
  s_6,
  s_20,
  s_27,
  s_20,
  s_20,
  s_6,
  s_20,
  s_20,
  s_15,
  s_10_18_1,
  s_15,
  s_14,
  s_27,
  s_1,
  s_25,
  s_1,
  s_6,
  s_1,
  s_0,
  s_27,
  s_20,
  s_20,
  s_0,
  s_0,
  s_15,
  s_26,
  s_27,
  s_26,
  s_1,
  s_1,
  s_26,
  s_6,
  s_18,
  s_10,
  s_6,
  s_7_30_0,
  s_27,
  s_0,
  s_0,
  s_26,
  s_11_32,
  s_18,
  s_18,
  s_13,
  s_18,
  s_20,
  s_27_35,
  s_4,
  s_10_32_39,
  s_5_18,
  s_10,
  s_18,
  s_4_6,
  s_0,
  s_5,
  s_4,
  s_5,
  s_5,
  s_5,
  s_13,
  s_18,
  s_5,
  s_1,
  s_18,
  s_6,
  s_4_5_18_41,
  s_26_28,
  s_0,
  s_15,
  s_15,
  s_10_18_1,
  s_18,
  s_5,
  s_41,
  s_18,
  s_4,
  s_10,
  s_20,
  s_10,
  s_4,
  s_1_0,
  s_4_18_0,
  s_4,
  s_0,
  s_18,
  s_18,
  s_1,
  s_20,
  s_0,
  s_18,
  s_0,
  s_0,
  s_6,
  s_10_18_42,
  s_18_42,
  s_18,
  s_26_28,
  s_5,
  s_1_0,
  s_5,
  s_1_0,
  s_0,
  s_5,
  s_6,
  s_4_6_8_15_18_30_33_38_40_41_42_0_2,
  s_26,
  s_6,
  s_10,
  s_6,
  s_18,
  s_4,
  s_32,
  s_18,
  s_11,
  s_6,
  s_6_7_8_9,
  s_0,
  s_10,
  s_6,
  s_35,
  s_41,
  s_4_6_10,
  s_10,
  s_6,
  s_0,
  s_18,
  s_14,
  s_4_11_30_39_41,
  s_11,
  s_11,
  s_4,
  s_6_7_9_11_26_30,
  s_10,
  s_22,
  s_4_35_0,
  s_0,
  s_4,
  s_6,
  s_4_6_21,
  s_4_11_41,
  s_0,
  s_6,
  s_14_21_27_30,
  s_0,
  s_6_38,
  s_18,
  s_4,
  s_31_38,
  s_6,
  s_6,
  s_6,
  s_6,
  s_30,
  s_6_18,
  s_6_26,
  s_21,
  s_8_15,
  s_41,
  s_18,
  s_30,
  s_18,
  s_4,
  s_6_32,
  s_6,
  s_11,
  s_6_2_0,
  s_0,
  s_6_0,
  s_6,
  s_6_35,
  s_4_6_18_33,
  s_4_38,
  s_18,
  s_0,
  s_5,
  s_6,
  s_10,
  s_38,
  s_4_6_10_18_22,
  s_0_2,
  s_9,
  s_2,
  s_11_19,
  s_15_17,
  s_15,
  s_18,
  s_6,
  s_13_18,
  s_26,
  s_1,
  s_5,
  s_27,
  s_26,
  s_1,
  s_2,
  s_0,
  s_6_27,
  s_26,
  s_5,
  s_1,
  s_1,
  s_1,
  s_1,
  s_18,
  s_9,
  s_22,
  s_1,
  s_5,
  s_1,
  s_1,
  s_22,
  s_27,
  s_1,
  s_30,
  s_5,
  s_30,
  s_5_1,
  s_5,
  s_1,
  s_5,
  s_0,
  s_7_0_2,
  s_10_18,
  s_27,
  s_18,
  s_10,
  s_9_10_35,
  s_5_18_32_37,
  s_18,
  s_4,
  s_10,
  s_15_17,
  s_2,
  s_4,
  s_32,
  s_7,
  s_18,
  s_10_18,
  s_6_30_31_41,
  s_14_0,
  s_9,
  s_0,
  s_4_5_6_18_23_35_40_42,
  s_26,
  s_27,
  s_26,
  s_4_6_10,
  s_15,
  s_13,
  s_23,
  s_6_18,
  s_18,
  s_6_18,
  s_6,
  s_0,
  s_15,
  s_18,
  s_6,
  s_6,
  s_18,
  s_13,
  s_13,
  s_18_1,
  s_9,
  s_15,
  s_18_1,
  s_10,
  s_15,
  s_18_1,
  s_15,
  s_18,
  s_23,
  s_10,
  s_10,
  s_17,
  s_9_21_30_32_40_41,
  s_0,
  s_18,
  s_6_18,
  s_18,
  s_4,
  s_9_15,
  s_4,
  s_18,
  s_5,
  s_18,
  s_5,
  s_15,
  s_18,
  s_23,
  s_28,
  s_6_9_32_33_41,
  s_4,
  s_23,
  s_6,
  s_30_36_42,
  s_20,
  s_0,
  s_6,
  s_27,
  s_18,
  s_15,
  s_6,
  s_6,
  s_4_0,
  s_13,
  s_21,
  s_21,
  s_21,
  s_15,
  s_18,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_6,
  s_6_7_15_18_21_24_25_26_35_40_42,
  s_0,
  s_5_18,
  s_18,
  s_4,
  s_5,
  s_26,
  s_26,
  s_5,
  s_18,
  s_27,
  s_20,
  s_17,
  s_18_23,
  s_6,
  s_0,
  s_6,
  s_30_0,
  s_6,
  s_18,
  s_10,
  s_18,
  s_0,
  s_2,
  s_26,
  s_5_18,
  s_18,
  s_6,
  s_6,
  s_13_18,
  s_18,
  s_6_15_35,
  s_27,
  s_11,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_15,
  s_20,
  s_10,
  s_5,
  s_5,
  s_4_6_9_15_41,
  s_18,
  s_41,
  s_41,
  s_15_17,
  s_18,
  s_7,
  s_0,
  s_15,
  s_0,
  s_4_6_8_11_14_18_25_35,
  s_10,
  s_10,
  s_18,
  s_6_7_27_30,
  s_6,
  s_6,
  s_18,
  s_4_10,
  s_1,
  s_18,
  s_9,
  s_4_26,
  s_6,
  s_1,
  s_9_19,
  s_27,
  s_10,
  s_6,
  s_8,
  s_6_30_38,
  s_5,
  s_4,
  s_18,
  s_4_10_41,
  s_20,
  s_4,
  s_4,
  s_6_7,
  s_6,
  s_18,
  s_6,
  s_6,
  s_4,
  s_0,
  s_10_32,
  s_37,
  s_6_27,
  s_2,
  s_26,
  s_6,
  s_0,
  s_10,
  s_10,
  s_20,
  s_6_20_27,
  s_1,
  s_20,
  s_20,
  s_20,
  s_1,
  s_18,
  s_18,
  s_10_17_1,
  s_15,
  s_10,
  s_6,
  s_6,
  s_6,
  s_18,
  s_1,
  s_11_15,
  s_15,
  s_18,
  s_20,
  s_32,
  s_20,
  s_20,
  s_10_23_32_41,
  s_0,
  s_10,
  s_13_20,
  s_0,
  s_6_7_8_10_14_35,
  s_6_29_35,
  s_0,
  s_4,
  s_6,
  s_6,
  s_6,
  s_6,
  s_0,
  s_6,
  s_6,
  s_6,
  s_18,
  s_5,
  s_6_7,
  s_18,
  s_4,
  s_18,
  s_6,
  s_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_6,
  s_5,
  s_15,
  s_6_9,
  s_23,
  s_32_33_0,
  s_8,
  s_26,
  s_20,
  s_0,
  s_2,
  s_15,
  s_4_8_11_12_35_38_39_2,
  s_15,
  s_6_13,
  s_5,
  s_4_11_0,
  s_15,
  s_10,
  s_15,
  s_18_1,
  s_6,
  s_15,
  s_5,
  s_15,
  s_6_20,
  s_38_41,
  s_4_26,
  s_6,
  s_6,
  s_15,
  s_4_6_14_17_21_31_35_38_40,
  s_0,
  s_21,
  s_18,
  s_18,
  s_5,
  s_4,
  s_21,
  s_21_40,
  s_18_40_0,
  s_4_26,
  s_18,
  s_20,
  s_0,
  s_6_10_0,
  s_18,
  s_2,
  s_10,
  s_6_18,
  s_13,
  s_4,
  s_10,
  s_13_14_34,
  s_4,
  s_6,
  s_18,
  s_18,
  s_5_0,
  s_18,
  s_5,
  s_10_32,
  s_0,
  s_2,
  s_5_18,
  s_1,
  s_10_18_1,
  s_6_20,
  s_10,
  s_20,
  s_13,
  s_20,
  s_32,
  s_0,
  s_20,
  s_4,
  s_1,
  s_18,
  s_6,
  s_1,
  s_6,
  s_14,
  s_32,
  s_0,
  s_4_6_7_10_14_17_23_32_35_41,
  s_18,
  s_5,
  s_18,
  s_5_6_10_35,
  s_6,
  s_18_1,
  s_15,
  s_20,
  s_18_0,
  s_0,
  s_4,
  s_30,
  s_4,
  s_4_7,
  s_4,
  s_30,
  s_18,
  s_0,
  s_2,
  s_7,
  s_15,
  s_20,
  s_0,
  s_6_13_30,
  s_0,
  s_4,
  s_0,
  s_5,
  s_6,
  s_0,
  s_6_13_30,
  s_18_29,
  s_20,
  s_6,
  s_5,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_5,
  s_15,
  s_6,
  s_10,
  s_10,
  s_15,
  s_6_18_36,
  s_36,
  s_18,
  s_1,
  s_4,
  s_30_32_35_0,
  s_2_0,
  s_2_0,
  s_6,
  s_4,
  s_0,
  s_0,
  s_2,
  s_2_0,
  s_2_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7_26,
  s_27_29,
  s_10_21_32_40,
  s_18,
  s_10,
  s_6_38,
  s_18,
  s_6,
  s_18,
  s_15,
  s_1,
  s_20,
  s_4,
  s_10,
  s_27,
  s_6_10_18_0,
  s_27,
  s_6_11_20_30_32_35,
  s_18,
  s_18,
  s_5_18,
  s_18,
  s_0,
  s_13_20,
  s_13_20,
  s_27,
  s_18,
  s_18,
  s_13,
  s_0,
  s_6_23,
  s_5,
  s_11_18,
  s_6,
  s_23,
  s_33,
  s_18,
  s_18,
  s_6,
  s_6,
  s_1,
  s_6,
  s_1,
  s_1,
  s_18,
  s_14,
  s_5,
  s_18,
  s_18,
  s_4_14,
  s_10_26,
  s_41,
  s_41,
  s_6,
  s_0,
  s_15_21_26,
  s_7_28_1_0,
  s_7,
  s_8,
  s_5,
  s_5,
  s_6,
  s_6,
  s_6_32_42,
  s_4,
  s_5,
  s_5,
  s_4_10_32,
  s_5,
  s_15,
  s_18,
  s_18,
  s_4,
  s_0,
  s_6_23_25_35,
  s_0,
  s_5,
  s_23,
  s_6,
  s_0,
  s_23,
  s_15_0,
  s_7_26,
  s_20,
  s_6,
  s_6,
  s_6_33_35,
  s_0,
  s_33,
  s_18,
  s_6_9_17,
  s_4,
  s_15,
  s_18,
  s_6,
  s_6_23,
  s_23,
  s_18,
  s_6,
  s_15,
  s_18,
  s_18,
  s_4_40,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_15,
  s_13_18,
  s_18,
  s_20,
  s_5,
  s_10_18,
  s_5,
  s_15,
  s_23,
  s_17,
  s_18,
  s_27,
  s_27,
  s_1,
  s_18,
  s_0,
  s_27,
  s_1,
  s_6,
  s_6_9_10_14_15_17_23_24_25_27_31_34_42_0,
  s_4_6,
  s_6,
  s_0,
  s_0,
  s_15,
  s_0,
  s_15_24,
  s_2,
  s_6,
  s_7,
  s_5,
  s_11_35,
  s_0,
  s_2,
  s_12,
  s_15,
  s_6_10_0,
  s_2,
  s_9_10,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_0,
  s_30,
  s_13_18_20,
  s_1,
  s_1,
  s_18,
  s_6,
  s_1,
  s_15,
  s_5,
  s_5_6_18,
  s_6_15_17_23,
  s_1,
  s_0,
  s_6,
  s_23,
  s_0,
  s_9_24,
  s_0,
  s_35_37,
  s_4_6_23,
  s_4_6,
  s_18,
  s_23,
  s_18,
  s_4,
  s_18,
  s_15,
  s_8,
  s_8,
  s_7,
  s_1,
  s_18,
  s_10_18,
  s_15,
  s_5_6_7_10_13_18_0,
  s_5,
  s_5,
  s_5,
  s_5_30,
  s_15,
  s_20,
  s_20,
  s_6,
  s_18,
  s_10_18,
  s_6,
  s_18,
  s_20,
  s_18_20,
  s_6_18_0,
  s_4,
  s_32_41,
  s_0,
  s_4_10,
  s_32_41,
  s_0,
  s_0,
  s_26,
  s_6_30_35,
  s_6_18,
  s_6,
  s_4_6_35,
  s_4_6,
  s_6_14,
  s_0,
  s_27,
  s_27,
  s_6,
  s_10,
  s_15,
  s_4_5_6_29_35,
  s_10,
  s_4,
  s_14_23_35,
  s_30_38_41,
  s_0,
  s_5,
  s_35,
  s_4_6_15_23,
  s_4_29_35_38,
  s_18,
  s_0,
  s_6,
  s_4,
  s_27,
  s_27,
  s_1,
  s_1,
  s_6,
  s_10_12,
  s_6,
  s_6,
  s_18,
  s_6,
  s_1,
  s_5,
  s_5,
  s_6,
  s_1,
  s_1,
  s_4,
  s_6,
  s_6,
  s_6,
  s_6,
  s_20,
  s_6_30,
  s_20,
  s_6,
  s_18,
  s_15,
  s_5,
  s_6,
  s_5,
  s_5_1,
  s_5,
  s_10,
  s_5,
  s_0,
  s_18,
  s_18,
  s_14_23,
  s_6_35,
  s_13_18_30_35,
  s_13,
  s_0,
  s_4,
  s_4_6_14,
  s_4_6,
  s_4_33,
  s_4_6,
  s_15,
  s_15,
  s_0,
  s_15,
  s_6,
  s_0,
  s_18,
  s_6,
  s_6,
  s_6,
  s_4,
  s_0,
  s_6_0,
  s_6_10,
  s_23,
  s_18,
  s_9,
  s_20,
  s_6_9_15_41,
  s_18,
  s_18,
  s_27,
  s_1,
  s_15,
  s_18_1,
  s_21,
  s_18,
  s_2,
  s_7,
  s_10,
  s_10_0,
  s_6,
  s_29_32,
  s_18,
  s_4,
  s_5_6_11_17_20_32_0,
  s_5,
  s_18,
  s_10,
  s_20,
  s_6,
  s_6,
  s_18,
  s_1,
  s_17,
  s_6_35,
  s_15,
  s_17,
  s_15,
  s_4_6,
  s_6,
  s_23,
  s_6,
  s_23,
  s_6,
  s_2,
  s_27,
  s_17_38,
  s_6,
  s_18,
  s_17,
  s_4_15,
  s_6,
  s_6_10_38_39,
  s_6_25_35_36_42,
  s_0,
  s_6,
  s_18,
  s_0,
  s_6,
  s_18,
  s_6,
  s_0,
  s_5,
  s_4,
  s_5_8_20_35,
  s_0,
  s_6,
  s_0,
  s_0,
  s_6_7_10_19_29_32_37_39_43,
  s_0,
  s_0,
  s_0,
  s_8_13_20_35,
  s_6,
  s_4,
  s_4,
  s_14,
  s_6,
  s_4,
  s_20,
  s_15,
  s_6,
  s_5_18_29_31_35_36_40_41_42,
  s_0,
  s_20,
  s_5,
  s_5_8_18_20_42,
  s_0,
  s_0,
  s_0,
  s_18,
  s_6_7_15_24_0,
  s_0,
  s_13,
  s_6_27,
  s_20,
  s_3_18,
  s_7,
  s_2_0,
  s_4_7_10_11_15_18_19_29_31_33_35_36_38_39_41_42_0,
  s_0,
  s_44_0,
  s_6_18,
  s_0,
  s_4_26,
  s_0,
  s_32_37,
  s_4,
  s_10_26,
  s_14,
  s_18,
  s_14,
  s_18,
  s_14,
  s_18,
  s_5,
  s_13,
  s_15_18,
  s_20,
  s_9,
  s_0,
  s_7,
  s_18,
  s_4,
  s_0,
  s_2,
  s_30_36_42,
  s_7_9_18,
  s_18,
  s_5_6_8_18_27_41,
  s_18,
  s_10_38,
  s_30,
  s_0,
  s_13,
  s_30,
  s_37_41,
  s_18,
  s_10,
  s_6_18,
  s_18,
  s_15,
  s_32_37,
  s_39,
  s_30_42,
  s_0,
  s_2,
  s_7,
  s_18,
  s_6_15_17_29_35_40,
  s_18,
  s_32,
  s_35,
  s_0,
  s_39,
  s_39,
  s_5,
  s_6,
  s_6,
  s_6,
  s_0,
  s_20,
  s_6,
  s_18,
  s_36,
  s_18,
  s_31_37,
  s_4,
  s_30,
  s_0,
  s_0,
  s_18,
  s_6,
  s_15,
  s_38,
  s_36,
  s_30,
  s_0,
  s_29_36,
  s_6_26,
  s_18,
  s_0,
  s_18,
  s_6,
  s_6,
  s_30,
  s_0,
  s_4,
  s_0,
  s_0,
  s_9_17,
  s_6,
  s_6,
  s_15,
  s_6,
  s_6,
  s_26,
  s_6,
  s_6,
  s_6,
  s_20,
  s_28,
  s_18,
  s_18,
  s_5_14,
  s_20,
  s_27,
  s_20,
  s_0,
  s_18,
  s_13,
  s_20,
  s_5_10_13_32,
  s_5,
  s_13,
  s_6,
  s_18,
  s_13,
  s_20,
  s_0,
  s_6_8_17,
  s_18,
  s_4,
  s_15,
  s_18,
  s_11_32_39,
  s_6,
  s_13,
  s_18,
  s_0,
  s_27_35,
  s_13_20,
  s_10_18,
  s_1,
  s_5_6_35_38_42_0,
  s_20,
  s_0,
  s_13_20,
  s_30,
  s_42,
  s_0,
  s_2,
  s_39,
  s_0,
  s_32_41,
  s_10,
  s_2,
  s_2_0,
  s_30,
  s_0,
  s_26,
  s_41,
  s_31_34,
  s_0,
  s_9,
  s_32_40,
  s_29,
  s_18,
  s_18_40_42,
  s_0,
  s_18,
  s_20,
  s_18,
  s_10_26,
  s_10,
  s_36,
  s_18_30_32_41_42,
  s_18,
  s_4_9_11_15_28_0,
  s_20,
  s_20,
  s_0,
  s_35,
  s_0,
  s_37,
  s_37_41,
  s_0,
  s_4_7,
  s_18,
  s_0,
  s_4_10_18,
  s_18,
  s_4_7,
  s_29_41,
  s_4_7_26,
  s_1,
  s_9,
  s_18_1,
  s_1,
  s_4_7_26,
  s_1,
  s_9,
  s_18_1,
  s_1,
  s_35,
  s_0,
  s_4,
  s_18,
  s_10,
  s_8_2_0,
  s_2_0,
  s_18,
  s_9,
  s_39,
  s_0,
  s_18,
  s_9,
  s_42,
  s_42,
  s_18,
  s_18,
  s_7_0,
  s_13,
  s_13,
  s_15,
  s_3_26,
  s_26,
  s_15,
  s_15,
  s_36,
  s_18_23,
  s_32_35_41,
  s_32_35_41,
  s_20,
  s_15,
  s_10_1,
  s_0,
  s_2,
  s_15,
  s_17_35,
  s_4_29_30,
  s_4,
  s_18,
  s_18,
  s_33_37,
  s_4,
  s_15,
  s_5,
  s_1,
  s_5,
  s_5,
  s_15,
  s_6,
  s_18_1,
  s_15,
  s_15,
  s_15,
  s_32_42,
  s_9,
  s_7,
  s_0,
  s_2,
  s_31,
  s_18,
  s_9,
  s_2,
  s_2,
  s_18,
  s_30_32,
  s_0,
  s_4_10_0,
  s_15,
  s_6_11_18_25_28_35,
  s_6_20,
  s_6_18,
  s_18,
  s_5,
  s_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_20,
  s_18,
  s_0,
  s_7,
  s_7,
  s_0,
  s_7_12,
  s_4_12,
  s_18_0,
  s_2,
  s_10,
  s_15,
  s_18,
  s_20,
  s_18,
  s_18,
  s_10_18_32,
  s_18,
  s_10,
  s_6,
  s_6,
  s_5_18,
  s_20,
  s_5_8_15_25_30,
  s_26_32,
  s_18,
  s_6,
  s_8,
  s_7,
  s_0,
  s_29,
  s_0,
  s_6,
  s_40_42,
  s_12,
  s_21,
  s_5,
  s_15,
  s_18,
  s_5,
  s_18_0,
  s_2,
  s_0,
  s_6,
  s_18,
  s_4_6_11_15_17_35_36,
  s_0,
  s_6,
  s_0,
  s_0,
  s_6,
  s_5,
  s_6_20,
  s_6,
  s_15,
  s_35,
  s_5,
  s_32,
  s_32,
  s_37,
  s_0,
  s_9,
  s_17,
  s_6,
  s_6_14_17_39_41,
  s_18,
  s_10,
  s_6_11_15_25_35_38,
  s_7,
  s_0,
  s_36,
  s_0,
  s_4_6,
  s_4_7_11,
  s_27,
  s_26,
  s_2,
  s_18,
  s_18,
  s_13_18_1,
  s_4_10,
  s_1,
  s_1,
  s_41,
  s_4_21,
  s_18,
  s_18,
  s_0,
  s_21_40,
  s_0,
  s_7_12,
  s_0,
  s_0,
  s_2,
  s_10_18_1,
  s_30,
  s_22,
  s_7_10_21_40,
  s_14,
  s_18,
  s_4_7_12,
  s_1_0,
  s_2,
  s_30,
  s_15,
  s_10_14_18_1,
  s_15,
  s_30_35_37,
  s_0,
  s_0,
  s_7,
  s_0,
  s_2,
  s_4_7,
  s_2,
  s_15,
  s_18_1,
  s_10,
  s_18_27,
  s_20,
  s_20,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_6,
  s_15,
  s_13,
  s_18_20,
  s_9_15_20_0,
  s_1,
  s_18,
  s_1,
  s_1,
  s_3_15,
  s_18,
  s_27,
  s_1,
  s_6,
  s_39,
  s_0,
  s_20,
  s_6,
  s_27,
  s_1,
  s_27,
  s_27,
  s_6,
  s_6,
  s_27,
  s_1,
  s_20_27,
  s_27,
  s_27,
  s_27,
  s_1,
  s_6,
  s_15,
  s_18,
  s_35,
  s_40,
  s_21,
  s_32,
  s_10,
  s_10_18,
  s_20,
  s_20,
  s_14,
  s_10,
  s_13,
  s_40,
  s_18_0,
  s_26,
  s_0,
  s_6,
  s_17_18,
  s_5,
  s_20,
  s_15,
  s_20,
  s_18,
  s_18,
  s_18,
  s_26,
  s_18,
  s_4,
  s_4,
  s_18,
  s_15_18,
  s_27,
  s_15,
  s_17,
  s_18,
  s_6_15_18,
  s_18,
  s_18,
  s_6_17,
  s_15,
  s_18_1,
  s_15,
  s_18,
  s_15,
  s_18,
  s_15,
  s_18,
  s_18,
  s_18,
  s_18,
  s_5,
  s_18,
  s_6,
  s_0,
  s_13_18_20_35,
  s_1,
  s_18_0,
  s_18,
  s_20,
  s_4_6_15_35_40,
  s_20,
  s_18,
  s_18,
  s_5,
  s_27,
  s_27,
  s_18,
  s_32,
  s_0,
  s_2,
  s_42,
  s_33_35_37,
  s_32,
  s_2,
  s_32_33_37,
  s_0,
  s_18,
  s_4,
  s_35,
  s_32_35,
  s_6,
  s_39,
  s_0,
  s_35_36,
  s_35,
  s_32,
  s_35,
  s_0,
  s_0,
  s_0,
  s_35,
  s_0,
  s_30,
  s_18,
  s_18,
  s_20,
  s_20,
  s_4_18_33_0_2,
  s_0,
  s_30,
  s_4_7,
  s_30,
  s_2,
  s_10,
  s_38,
  s_40,
  s_4_21,
  s_18,
  s_4_21,
  s_35,
  s_38,
  s_10,
  s_0,
  s_4_21_31_32_33,
  s_10_20_0,
  s_27,
  s_6,
  s_20,
  s_17,
  s_10,
  s_18,
  s_6,
  s_31_39,
  s_15,
  s_18,
  s_30,
  s_2,
  s_4,
  s_32,
  s_32_37_41,
  s_4_7,
  s_18,
  s_32,
  s_4_10,
  s_18_0,
  s_7_18_30_33_0_2,
  s_0,
  s_4_11_26,
  s_0,
  s_5,
  s_5,
  s_18,
  s_20,
  s_20,
  s_1,
  s_2,
  s_8,
  s_2,
  s_6,
  s_6_35,
  s_13,
  s_18,
  s_18,
  s_14,
  s_32,
  s_31,
  s_40,
  s_0,
  s_31_37,
  s_0,
  s_2,
  s_2,
  s_9,
  s_32_37,
  s_0,
  s_7,
  s_0,
  s_2,
  s_9,
  s_32,
  s_6,
  s_18,
  s_2,
  s_21,
  s_6,
  s_4,
  s_21,
  s_28,
  s_28,
  s_18,
  s_10,
  s_4,
  s_6,
  s_15,
  s_15,
  s_18_1,
  s_18,
  s_13,
  s_13,
  s_0,
  s_2,
  s_9_25_31_33_0,
  s_0,
  s_0,
  s_1,
  s_1,
  s_1,
  s_1,
  s_6_34,
  s_0,
  s_10,
  s_0,
  s_1,
  s_18,
  s_1,
  s_1,
  s_10,
  s_1,
  s_4,
  s_7,
  s_1,
  s_18,
  s_1,
  s_18,
  s_1,
  s_18,
  s_18,
  s_14,
  s_1,
  s_1,
  s_1,
  s_9,
  s_18,
  s_5,
  s_0,
  s_0,
  s_1,
  s_27,
  s_28_1,
  s_28_1,
  s_0,
  s_0,
  s_8,
  s_27,
  s_27,
  s_1,
  s_0,
  s_1,
  s_10_32,
  s_10,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_6_0,
  s_0,
  s_6,
  s_0,
  s_0,
  s_0,
  s_8_0,
  s_0,
  s_6_38,
  s_18,
  s_0,
  s_4,
  s_18,
  s_1,
  s_4_10_32_40,
  s_15,
  s_0,
  s_18,
  s_10,
  s_5,
  s_42,
  s_20,
  s_0,
  s_6,
  s_0,
  s_1,
  s_20_0,
  s_2,
  s_6,
  s_18,
  s_0,
  s_0,
  s_4_35,
  s_0,
  s_1,
  s_1,
  s_0,
  s_6,
  s_0,
  s_0,
  s_30_42_0,
  s_0,
  s_4_25,
  s_0_2,
  s_18,
  s_0,
  s_4_26,
  s_20,
  s_0,
  s_0,
  s_5,
  s_18,
  s_0,
  s_6,
  s_0,
  s_26,
  s_0,
  s_0,
  s_7,
  s_5_17,
  s_6_17_25_35,
  s_0,
  s_7,
  s_20,
  s_20,
  s_1,
  s_20,
  s_13,
  s_18,
  s_0,
  s_9,
  s_10,
  s_18,
  s_15,
  s_10,
  s_6,
  s_6_38,
  s_18,
  s_14,
  s_6_15,
  s_10_1,
  s_0,
  s_0,
  s_7,
  s_7,
  s_2,
  s_13_20,
  s_5,
  s_8,
  s_17,
  s_6_27_30,
  s_6,
  s_10,
  s_0,
  s_26,
  s_26,
  s_1,
  s_20,
  s_0,
  s_18_0,
  s_9,
  s_18,
  s_2,
  s_1_0,
  s_7_26,
  s_27,
  s_38_40_41,
  s_4_5_6_10_21_32_40,
  s_17,
  s_6,
  s_0,
  s_4_6_10_42,
  s_5,
  s_6,
  s_6,
  s_1,
  s_4,
  s_10,
  s_15,
  s_10,
  s_23_0,
  s_18,
  s_23_24_0,
  s_11_30_38,
  s_0,
  s_0,
  s_5_6,
  s_23,
  s_23,
  s_6,
  s_0,
  s_0,
  s_0,
  s_15,
  s_0,
  s_0,
  s_10_15_18,
  s_20,
  s_13,
  s_0,
  s_18,
  s_28,
  s_0,
  s_27_0,
  s_1_0,
  s_21,
  s_18,
  s_1,
  s_28,
  s_1,
  s_28,
  s_20,
  s_0,
  s_1,
  s_10_2_0,
  s_1,
  s_0,
  s_6_10_23_35,
  s_10_17_1_0,
  s_0,
  s_0,
  s_2,
  s_9_29_30_32_35_41,
  s_0,
  s_6_27,
  s_6,
  s_4_6_7_0,
  s_20,
  s_20,
  s_18,
  s_23,
  s_4_34,
  s_18,
  s_15,
  s_4,
  s_4,
  s_6,
  s_1,
  s_6,
  s_9_1_0,
  s_0,
  s_5,
  s_0,
  s_0,
  s_0,
  s_6,
  s_9_31,
  s_4,
  s_27,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_6,
  s_1,
  s_9,
  s_4,
  s_4,
  s_0,
  s_30,
  s_7,
  s_19,
  s_9,
  s_9,
  s_9,
  s_27,
  s_4_22,
  s_1,
  s_1_0,
  s_1,
  s_4,
  s_1,
  s_1,
  s_9,
  s_18,
  s_1,
  s_1,
  s_10,
  s_17_26,
  s_15,
  s_1,
  s_0_1,
  s_2,
  s_4,
  s_18,
  s_1,
  s_9_14_19,
  s_19,
  s_0,
  s_7_27,
  s_14,
  s_1,
  s_9,
  s_9,
  s_9,
  s_1_0,
  s_9,
  s_1,
  s_1,
  s_9,
  s_3,
  s_18,
  s_9,
  s_4,
  s_9,
  s_4_9,
  s_26,
  s_9,
  s_6,
  s_15,
  s_9,
  s_22,
  s_1,
  s_1,
  s_9,
  s_9,
  s_14,
  s_9,
  s_9,
  s_4,
  s_1,
  s_27,
  s_27,
  s_1,
  s_14,
  s_1,
  s_0,
  s_6,
  s_0,
  s_0,
  s_0,
  s_0,
  s_5_0,
  s_0,
  s_7,
  s_0,
  s_0,
  s_6,
  s_0_1,
  s_6,
  s_23,
  s_9_10_23_1,
  s_0,
  s_0,
  s_2,
  s_0,
  s_6_20_35_0,
  s_6,
  s_0,
  s_5_6_10_13_18_33,
  s_6,
  s_18,
  s_6,
  s_6_10,
  s_18,
  s_6,
  s_6,
  s_6_23_35,
  s_27_38,
  s_17_35,
  s_4,
  s_13,
  s_10,
  s_33,
  s_19,
  s_1,
  s_6,
  s_13,
  s_0,
  s_38,
  s_38,
  s_4,
  s_15,
  s_6,
  s_11_23_39,
  s_6,
  s_11_18_22_24_28_29,
  s_28,
  s_22,
  s_7,
  s_15,
  s_28,
  s_7_21,
  s_20,
  s_20,
  s_13,
  s_18,
  s_15,
  s_13,
  s_20,
  s_19,
  s_35,
  s_4,
  s_1,
  s_0,
  s_18_0,
  s_4_7,
  s_15,
  s_6_13_18,
  s_15,
  s_4,
  s_15,
  s_15_18,
  s_1,
  s_13,
  s_27,
  s_1,
  s_1,
  s_5,
  s_1,
  s_13,
  s_15,
  s_27,
  s_1,
  s_27,
  s_1,
  s_6,
  s_1,
  s_0,
  s_6_10_11_13_17_23_28,
  s_27,
  s_5_10_18_26_32,
  s_4,
  s_7,
  s_0,
  s_4_7_10_11_13_26_35_39,
  s_6,
  s_18,
  s_6,
  s_15,
  s_0,
  s_2,
  s_5,
  s_6,
  s_13,
  s_6,
  s_6_35,
  s_5,
  s_7_9_13_39_2_0,
  s_20,
  s_0,
  s_2,
  s_5,
  s_7_9_12,
  s_20,
  s_20,
  s_13,
  s_20_0,
  s_20,
  s_20,
  s_6,
  s_0,
  s_0,
  s_6,
  s_27,
  s_1,
  s_30,
  s_30,
  s_1,
  s_1,
  s_0_1,
  s_5_0,
  s_0,
  s_5,
  s_1,
  s_6_15_42,
  s_4,
  s_10_2_0,
  s_2_0,
  s_4,
  s_0,
  s_7,
  s_19,
  s_18,
  s_1,
  s_14,
  s_14,
  s_32,
  s_18_32,
  s_18,
  s_0,
  s_0,
  s_5,
  s_6_7_18_26_30_0,
  s_4_41,
  s_18,
  s_5,
  s_13_20_35,
  s_5,
  s_6,
  s_17,
  s_5,
  s_5,
  s_5_20,
  s_5,
  s_27,
  s_30,
  s_0,
  s_4,
  s_6,
  s_5,
  s_5,
  s_10_18,
  s_18,
  s_18_32,
  s_0,
  s_8,
  s_13_26,
  s_27,
  s_0,
  s_4_6_20_41,
  s_35,
  s_18_41,
  s_10_41,
  s_4_40_41,
  s_18,
  s_7_26,
  s_9_11_26_28,
  s_5,
  s_15,
  s_15,
  s_20,
  s_18,
  s_18,
  s_5,
  s_5,
  s_20,
  s_27_35,
  s_27,
  s_6_10_30_32,
  s_26,
  s_20,
  s_6_8,
  s_1,
  s_5,
  s_20,
  s_20,
  s_5,
  s_1,
  s_6_8_13_17_18_20,
  s_1_0,
  s_0,
  s_0,
  s_20,
  s_10,
  s_12,
  s_26,
  s_18,
  s_18,
  s_0,
  s_10_31_32_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_26,
  s_26,
  s_0,
  s_13,
  s_29_30,
  s_0,
  s_13,
  s_0,
  s_20,
  s_32,
  s_4_10,
  s_2,
  s_7,
  s_6_10_41_0,
  s_6_17_35_42_0,
  s_0,
  s_2,
  s_26,
  s_5,
  s_15,
  s_11_39,
  s_5,
  s_11_0,
  s_10_32,
  s_0,
  s_32,
  s_18,
  s_0,
  s_2,
  s_4_10,
  s_4_10_11_19_30_32_33_35_36_38_39,
  s_0,
  s_8,
  s_1,
  s_1,
  s_1,
  s_18,
  s_0,
  s_5,
  s_20,
  s_20,
  s_5,
  s_5,
  s_1,
  s_5,
  s_8,
  s_26,
  s_5,
  s_1,
  s_1,
  s_20,
  s_5,
  s_4,
  s_9_22,
  s_1,
  s_26,
  s_5,
  s_1,
  s_20,
  s_20,
  s_26,
  s_1,
  s_1,
  s_5,
  s_1,
  s_5,
  s_1,
  s_5,
  s_1,
  s_32,
  s_7,
  s_0,
  s_2,
  s_32_0,
  s_10_32,
  s_10,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4,
  s_4_7_11_22_32_33_38_43,
  s_6,
  s_22_0,
  s_6_36,
  s_6,
  s_4_7_27_30,
  s_0,
  s_18,
  s_6,
  s_0,
  s_2,
  s_26,
  s_30_0,
  s_0,
  s_11_32,
  s_8,
  s_0,
  s_0,
  s_20,
  s_20,
  s_29_30_38_40,
  s_18,
  s_26,
  s_11_39,
  s_7_30_35,
  s_0,
  s_29,
  s_4_10_11_30_35_42,
  s_27,
  s_0,
  s_6,
  s_4,
  s_4,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_26,
  s_26,
  s_20,
  s_18,
  s_32_40,
  s_0,
  s_2,
  s_26,
  s_4_10_26,
  s_0,
  s_10_32,
  s_20,
  s_20,
  s_13,
  s_20,
  s_15,
  s_18,
  s_20,
  s_26_43,
  s_0,
  s_18,
  s_15,
  s_6_18,
  s_0,
  s_6_10_14_30_39_0,
  s_0,
  s_6,
  s_6_35_0,
  s_0,
  s_0,
  s_2,
  s_26,
  s_33_41,
  s_5,
  s_6,
  s_13,
  s_4_29_39,
  s_6_10_35,
  s_4_0,
  s_20,
  s_13,
  s_13,
  s_13,
  s_10_11,
  s_26,
  s_0,
  s_2,
  s_26,
  s_5,
  s_8_20_26_30_32,
  s_22_0,
  s_0,
  s_0,
  s_2,
  s_12,
  s_32,
  s_0,
  s_10,
  s_4_33,
  s_4_33,
  s_18,
  s_18,
  s_14_19,
  s_26_30,
  s_13,
  s_25_35,
  s_14,
  s_6,
  s_18,
  s_4_6_9_14_15_23_25_30_31_32_33_35_39_41,
  s_4_6_33_35_41,
  s_0,
  s_0,
  s_4_6_26,
  s_4_6,
  s_0,
  s_6_18,
  s_18,
  s_0,
  s_6,
  s_4,
  s_0,
  s_0,
  s_15,
  s_10_32,
  s_18,
  s_18,
  s_18,
  s_20,
  s_7_18_0,
  s_7_18_0,
  s_7,
  s_7_8_14_18_35,
  s_4,
  s_20,
  s_0,
  s_0,
  s_26,
  s_0,
  s_5,
  s_2,
  s_7_26,
  s_20,
  s_0,
  s_2,
  s_4,
  s_7_14,
  s_12,
  s_6,
  s_20,
  s_4,
  s_0,
  s_7,
  s_0,
  s_14,
  s_27,
  s_8,
  s_5,
  s_0,
  s_7,
  s_0,
  s_5,
  s_20,
  s_30_0_2,
  s_19_20_22_26_28_30,
  s_4_20,
  s_20,
  s_6,
  s_18,
  s_22_0,
  s_15,
  s_15,
  s_4,
  s_20_28_30,
  s_22,
  s_4_7_35,
  s_7_36,
  s_0,
  s_0,
  s_10_27,
  s_0,
  s_6,
  s_32,
  s_4_6_11_19_29_30_32_35_38_39_40_41_42_43,
  s_10_11,
  s_20,
  s_5_6,
  s_5_13,
  s_5,
  s_6,
  s_18,
  s_6_8,
  s_22,
  s_4,
  s_6,
  s_0,
  s_4_11,
  s_6,
  s_0,
  s_6,
  s_6,
  s_6_10_11,
  s_0,
  s_0,
  s_13,
  s_29,
  s_7_27_29_32,
  s_18,
  s_0,
  s_6_18,
  s_6_35_41,
  s_18,
  s_5_6_7_14_17_27_30_0,
  s_18,
  s_20,
  s_13_20,
  s_5,
  s_5,
  s_6_20,
  s_5_20,
  s_18,
  s_5_13,
  s_5_13,
  s_5,
  s_10_15_20,
  s_5,
  s_22_27,
  s_0,
  s_18,
  s_7,
  s_18,
  s_5_13,
  s_6_9_36,
  s_10_26,
  s_20,
  s_18,
  s_27,
  s_5,
  s_5,
  s_26,
  s_20,
  s_5,
  s_4_10_17_32_33_0,
  s_18,
  s_2,
  s_7,
  s_22_27,
  s_0,
  s_4_32_38_41,
  s_6,
  s_18,
  s_30_35_39_0,
  s_0,
  s_2,
  s_7,
  s_9_30_31_35_39,
  s_10,
  s_0,
  s_7,
  s_0,
  s_32,
  s_4_26_29_30,
  s_6_20,
  s_0,
  s_0,
  s_10_19_26_29_32_43,
  s_18,
  s_0,
  s_0,
  s_0,
  s_14,
  s_10,
  s_22,
  s_10,
  s_10,
  s_5_6,
  s_18,
  s_5,
  s_6_13_14_27_34_38_42,
  s_18,
  s_4_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_5,
  s_5,
  s_10_32_42,
  s_18,
  s_0,
  s_2,
  s_7,
  s_10,
  s_6_38,
  s_5,
  s_18,
  s_6_18,
  s_6,
  s_4,
  s_23,
  s_18,
  s_9,
  s_18,
  s_6,
  s_4_5_6_8_23_29_32_35_38,
  s_6,
  s_6,
  s_4_41,
  s_18,
  s_6,
  s_6,
  s_18,
  s_5,
  s_6,
  s_5,
  s_6_38,
  s_4,
  s_6,
  s_5_0,
  s_0,
  s_5,
  s_18,
  s_4,
  s_4,
  s_4,
  s_20,
  s_18,
  s_13,
  s_8,
  s_0,
  s_18,
  s_32,
  s_6,
  s_17,
  s_41,
  s_18,
  s_6,
  s_0,
  s_0,
  s_1_2_0,
  s_12,
  s_6,
  s_10_18,
  s_6_7_8_10_14_17_42,
  s_18,
  s_4,
  s_14_18,
  s_0,
  s_36,
  s_4_6,
  s_18,
  s_18,
  s_9,
  s_20,
  s_18,
  s_15,
  s_1,
  s_18,
  s_18,
  s_13,
  s_18,
  s_0,
  s_17_30,
  s_18,
  s_1,
  s_20,
  s_6_18_23_35,
  s_18,
  s_31_38_42,
  s_0,
  s_6_18,
  s_20,
  s_15,
  s_0,
  s_6_18,
  s_14_15,
  s_18_1_0,
  s_4,
  s_18,
  s_18,
  s_27,
  s_5,
  s_7_26_30_37_38,
  s_0,
  s_6,
  s_6_10,
  s_6,
  s_4_22_2,
  s_15,
  s_0,
  s_2,
  s_7_26,
  s_10,
  s_10,
  s_10,
  s_6,
  s_10,
  s_20,
  s_10_0,
  s_10_36,
  s_2,
  s_7,
  s_10_20_27,
  s_4_6_10,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_19,
  s_18,
  s_18_23,
  s_4_15,
  s_18_1,
  s_23,
  s_20,
  s_6,
  s_41,
  s_6_8,
  s_41,
  s_5,
  s_14,
  s_6,
  s_13_15,
  s_6,
  s_6,
  s_1,
  s_6,
  s_1,
  s_10,
  s_18_1,
  s_30,
  s_14,
  s_18_1,
  s_1,
  s_30,
  s_18,
  s_18_0,
  s_6_30_35,
  s_4_6_19_30_34_35_38_2,
  s_5,
  s_20,
  s_18,
  s_6_25,
  s_15,
  s_20,
  s_6_11_33_41,
  s_20,
  s_6_30_32_33_35,
  s_18,
  s_4_10,
  s_6,
  s_10,
  s_0,
  s_2,
  s_20,
  s_15,
  s_6,
  s_6_13_18,
  s_6,
  s_39,
  s_11,
  s_5,
  s_39,
  s_11,
  s_4,
  s_6,
  s_6_30_0,
  s_6_11_18,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_15,
  s_11_17,
  s_18,
  s_5,
  s_20,
  s_13,
  s_8,
  s_6_7_18_19_21_24_27_35_40_41,
  s_0,
  s_4_26,
  s_35,
  s_35,
  s_18,
  s_4_9_24,
  s_18,
  s_18,
  s_18,
  s_18,
  s_20,
  s_18,
  s_7_8_27_30_31_0,
  s_0,
  s_5,
  s_18,
  s_0,
  s_0,
  s_8,
  s_0,
  s_27,
  s_4,
  s_6,
  s_20,
  s_18,
  s_6,
  s_17,
  s_0,
  s_11,
  s_11_39,
  s_5_6,
  s_12,
  s_18,
  s_7,
  s_18,
  s_7,
  s_5_13,
  s_35,
  s_0,
  s_15,
  s_6_29,
  s_5,
  s_18,
  s_0,
  s_2,
  s_0,
  s_5,
  s_20,
  s_18,
  s_9_21,
  s_5,
  s_0_1,
  s_7,
  s_0,
  s_10_32,
  s_8_18_41,
  s_14,
  s_5_18,
  s_4_21,
  s_8_18,
  s_18,
  s_10_38,
  s_6_10_14_21_31_41,
  s_0,
  s_18,
  s_6,
  s_4,
  s_6,
  s_14,
  s_18,
  s_0,
  s_6,
  s_18,
  s_4_14,
  s_18,
  s_4,
  s_0,
  s_7,
  s_18,
  s_4,
  s_10,
  s_5,
  s_18,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6,
  s_10,
  s_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_18,
  s_1,
  s_6_11_26_30_35_39_43,
  s_18,
  s_4_6_38,
  s_0,
  s_26_0,
  s_15,
  s_4_41,
  s_18,
  s_18,
  s_0,
  s_2,
  s_7,
  s_4_7_30_35_38_41,
  s_6_18,
  s_4_6_12_29_35,
  s_18,
  s_14,
  s_0,
  s_6,
  s_17,
  s_6_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_13_36_40_0,
  s_18,
  s_4,
  s_0,
  s_32,
  s_18,
  s_0,
  s_18,
  s_6_41,
  s_21,
  s_20,
  s_13_34,
  s_18,
  s_4,
  s_0,
  s_10_14_35_38,
  s_4,
  s_1,
  s_13_20,
  s_20,
  s_20,
  s_20,
  s_27,
  s_1,
  s_27,
  s_13_15,
  s_13,
  s_6,
  s_6_15_25_35_40_42,
  s_0,
  s_18,
  s_15,
  s_15_0,
  s_6_7_11_18_35_37,
  s_1_0,
  s_18_19,
  s_20,
  s_0,
  s_12,
  s_5_6,
  s_18,
  s_18,
  s_1,
  s_4_0,
  s_2,
  s_7,
  s_18_0,
  s_18,
  s_15,
  s_27,
  s_18,
  s_4,
  s_27,
  s_1,
  s_27,
  s_15,
  s_5,
  s_40,
  s_18,
  s_4,
  s_13,
  s_13,
  s_13,
  s_13,
  s_13,
  s_6,
  s_13,
  s_5,
  s_5,
  s_13,
  s_18,
  s_18,
  s_5,
  s_10,
  s_4,
  s_14,
  s_1,
  s_0,
  s_15,
  s_1,
  s_4_6_8_9_26_35_39,
  s_0,
  s_0,
  s_17,
  s_17,
  s_6_18_35_0,
  s_4,
  s_0,
  s_15,
  s_18,
  s_18,
  s_18,
  s_20,
  s_5,
  s_6,
  s_1,
  s_6_1,
  s_31,
  s_18,
  s_31,
  s_9_14,
  s_5,
  s_4_41,
  s_0,
  s_18,
  s_0,
  s_5,
  s_0,
  s_9_11_37_38_41,
  s_9_26,
  s_0,
  s_0,
  s_5,
  s_5,
  s_0,
  s_0,
  s_27,
  s_20,
  s_1,
  s_1,
  s_15,
  s_1,
  s_18,
  s_6_23_35_40,
  s_6,
  s_6,
  s_34,
  s_23,
  s_6_25_30_41,
  s_5,
  s_14,
  s_6_8_15_17_28_31_35_40_0,
  s_0,
  s_17,
  s_0,
  s_7,
  s_0,
  s_0,
  s_27,
  s_1,
  s_5,
  s_5,
  s_26,
  s_27,
  s_13,
  s_6,
  s_6,
  s_8_0,
  s_10,
  s_20,
  s_15_18,
  s_20,
  s_20,
  s_0,
  s_0,
  s_0,
  s_13,
  s_13,
  s_15_17,
  s_0,
  s_0,
  s_6,
  s_6,
  s_18,
  s_18,
  s_6,
  s_4_7_11_35_38_40,
  s_18,
  s_7,
  s_11_0,
  s_0,
  s_4_7_15_25_30_38_42_0,
  s_7_15_25,
  s_0,
  s_7,
  s_0,
  s_18,
  s_0,
  s_0,
  s_2,
  s_7,
  s_15,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_6_7_21,
  s_6_7,
  s_13_14_18,
  s_6,
  s_18_0,
  s_14,
  s_30,
  s_15,
  s_13,
  s_9_15,
  s_9_15,
  s_6,
  s_20,
  s_35,
  s_10,
  s_1,
  s_4_11_28,
  s_20,
  s_6,
  s_6,
  s_4,
  s_10,
  s_5_1,
  s_5,
  s_5,
  s_5_1_0,
  s_5,
  s_13,
  s_4_6_10_25_32_36_38,
  s_18,
  s_18,
  s_4,
  s_30,
  s_18,
  s_4,
  s_4,
  s_30,
  s_18,
  s_0,
  s_8,
  s_0,
  s_15,
  s_6_35,
  s_5,
  s_15_0,
  s_5,
  s_0,
  s_5,
  s_18,
  s_20,
  s_4_10_0,
  s_6,
  s_4_6_23_25_33_35_38,
  s_17,
  s_8_0,
  s_0,
  s_6_18,
  s_23,
  s_6,
  s_4,
  s_4,
  s_18,
  s_35,
  s_6,
  s_6,
  s_6,
  s_4_6_20_23_25_26_35,
  s_13_20,
  s_6,
  s_23,
  s_0,
  s_5_18,
  s_6,
  s_6,
  s_5,
  s_23,
  s_4,
  s_0,
  s_20,
  s_20,
  s_0,
  s_18,
  s_4_41,
  s_18,
  s_28,
  s_0,
  s_2,
  s_7,
  s_20,
  s_18,
  s_2_0,
  s_4,
  s_13_20,
  s_1,
  s_15,
  s_18,
  s_26,
  s_7,
  s_28,
  s_28,
  s_6,
  s_32,
  s_6_10_14_23_29_35_37,
  s_0,
  s_6,
  s_6,
  s_18,
  s_6,
  s_1,
  s_38_0,
  s_4,
  s_5,
  s_5_1,
  s_5,
  s_1,
  s_25,
  s_18_0,
  s_7,
  s_7,
  s_20,
  s_20,
  s_0,
  s_0,
  s_26,
  s_0,
  s_0,
  s_26,
  s_0,
  s_20,
  s_5,
  s_5,
  s_1,
  s_6_0,
  s_20,
  s_6_10_14_31_32_35,
  s_0,
  s_7,
  s_20,
  s_1,
  s_1,
  s_1,
  s_1,
  s_20,
  s_20,
  s_6_35,
  s_6,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_26,
  s_5,
  s_5,
  s_17,
  s_10_32_0,
  s_15,
  s_18,
  s_18,
  s_10,
  s_18_0,
  s_18,
  s_10_0,
  s_0,
  s_18,
  s_18,
  s_5_18,
  s_5_14_18,
  s_10,
  s_9_14,
  s_17,
  s_10,
  s_5_14_18,
  s_1,
  s_1,
  s_9_14,
  s_10_18,
  s_10_18,
  s_6_8_35_36,
  s_0,
  s_6,
  s_6_33_35,
  s_10_18_32,
  s_8_9_13_18_35,
  s_8,
  s_6,
  s_18,
  s_0,
  s_0,
  s_8,
  s_9,
  s_0,
  s_8,
  s_9_31,
  s_4,
  s_31_32,
  s_0,
  s_4,
  s_9_19,
  s_18,
  s_0,
  s_30,
  s_0,
  s_4,
  s_6_14_20_38,
  s_18,
  s_6,
  s_0,
  s_0,
  s_5,
  s_18,
  s_20,
  s_5,
  s_0,
  s_5,
  s_13_27,
  s_6_14_17_19_20_25_30,
  s_0,
  s_5,
  s_1,
  s_0,
  s_4_0,
  s_5,
  s_5,
  s_5_1,
  s_5,
  s_5_1,
  s_1,
  s_5,
  s_5,
  s_5,
  s_0,
  s_20,
  s_0,
  s_18,
  s_6_9_10_27_32_35_41,
  s_0,
  s_15,
  s_4,
  s_10_35_39,
  s_35,
  s_18,
  s_13,
  s_13,
  s_13,
  s_5,
  s_5,
  s_18,
  s_20,
  s_0,
  s_2,
  s_7,
  s_6,
  s_15,
  s_15,
  s_15,
  s_6_7_14_27,
  s_6,
  s_20,
  s_0,
  s_6,
  s_20,
  s_20,
  s_20,
  s_6,
  s_6,
  s_1,
  s_1_0,
  s_13_18,
  s_15,
  s_6_40,
  s_0,
  s_39,
  s_15,
  s_0,
  s_13,
  s_18,
  s_15,
  s_10,
  s_14_18_42_0,
  s_2,
  s_7,
  s_7_12,
  s_10_18_32,
  s_9,
  s_0,
  s_4_11_32,
  s_18,
  s_7,
  s_7,
  s_0,
  s_11_29_30_32,
  s_35,
  s_32_1_0,
  s_2,
  s_7,
  s_6,
  s_13_15,
  s_18_1,
  s_20,
  s_17,
  s_15,
  s_4_11_17_35_41,
  s_13_21_35,
  s_6_8_15,
  s_6,
  s_6,
  s_13,
  s_13_20,
  s_14,
  s_20,
  s_13,
  s_13,
  s_7_9,
  s_2,
  s_2,
  s_18,
  s_4_11_17_26_28_29_30_31_32_33_35_37_38_40_41_42,
  s_7,
  s_6_0,
  s_7,
  s_4_21_23,
  s_4_0,
  s_20,
  s_20,
  s_4_9_11_22_26,
  s_6_11_18,
  s_11,
  s_13_34,
  s_4,
  s_0,
  s_4,
  s_20,
  s_4_9,
  s_4_11,
  s_6,
  s_5_13_35,
  s_5_8_13_33_38_42,
  s_8,
  s_0,
  s_34,
  s_0,
  s_6,
  s_6,
  s_4_38,
  s_18,
  s_6,
  s_4_10_19_27_28,
  s_41,
  s_6,
  s_41,
  s_6,
  s_29_30_32_40_42,
  s_0,
  s_6_28,
  s_4_0,
  s_0,
  s_2,
  s_26,
  s_0,
  s_27,
  s_30_35,
  s_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_0,
  s_6,
  s_6,
  s_9_14_29_35_36,
  s_18,
  s_4_7_0,
  s_4_19_38_43,
  s_2,
  s_7_26,
  s_0,
  s_8,
  s_1,
  s_15,
  s_15,
  s_15,
  s_6,
  s_5,
  s_15,
  s_15,
  s_15,
  s_15,
  s_14,
  s_10_18,
  s_18,
  s_18,
  s_10,
  s_10_41,
  s_10,
  s_6,
  s_5,
  s_7_10,
  s_5,
  s_13_30_36,
  s_13,
  s_18,
  s_6,
  s_4,
  s_6,
  s_18,
  s_6_20,
  s_5,
  s_20,
  s_20,
  s_0,
  s_0,
  s_21_40,
  s_18,
  s_4,
  s_6_18,
  s_10_17,
  s_20,
  s_6,
  s_6,
  s_18,
  s_4,
  s_0,
  s_0,
  s_6,
  s_6,
  s_4,
  s_6,
  s_4_1,
  s_18,
  s_13,
  s_18,
  s_18,
  s_4_6_8_24_35_38_42,
  s_0,
  s_15,
  s_15,
  s_18,
  s_18,
  s_15,
  s_6,
  s_4_6_32_35_37,
  s_6,
  s_13,
  s_10_32_0,
  s_6,
  s_10,
  s_0,
  s_2,
  s_7,
  s_6,
  s_20,
  s_20,
  s_20,
  s_0,
  s_6,
  s_14_33,
  s_18,
  s_18,
  s_6,
  s_6,
  s_0_2,
  s_30_43,
  s_2,
  s_7_9,
  s_15,
  s_18,
  s_18,
  s_18,
  s_5,
  s_7_9,
  s_7,
  s_0,
  s_6,
  s_2,
  s_6_30_42,
  s_0,
  s_0,
  s_1,
  s_0,
  s_27,
  s_0,
  s_15,
  s_0,
  s_0,
  s_13_27_30,
  s_30_32_35_36_37_38_40,
  s_4,
  s_7,
  s_20,
  s_7_15_25,
  s_10,
  s_18,
  s_17_0,
  s_7,
  s_13,
  s_20,
  s_27,
  s_6,
  s_6,
  s_4,
  s_19,
  s_1,
  s_15,
  s_30_0,
  s_30,
  s_13,
  s_2,
  s_7,
  s_5_13,
  s_4,
  s_5_6_31_38_42,
  s_0,
  s_20,
  s_0,
  s_5,
  s_7,
  s_0,
  s_15,
  s_5_18,
  s_15,
  s_1,
  s_6,
  s_4,
  s_10,
  s_18_1,
  s_18,
  s_4_10,
  s_18_1,
  s_18,
  s_5,
  s_10,
  s_15,
  s_18,
  s_13_0,
  s_20,
  s_7,
  s_15,
  s_6_32,
  s_0,
  s_18_0,
  s_6,
  s_6,
  s_1,
  s_5,
  s_10_32_35,
  s_6_18,
  s_10,
  s_6,
  s_30,
  s_4_22,
  s_0,
  s_6_0,
  s_2,
  s_7,
  s_0,
  s_10,
  s_4_6_10_35_2_0,
  s_6,
  s_5_27,
  s_15,
  s_2,
  s_9,
  s_1_0,
  s_18,
  s_6_36,
  s_0,
  s_27,
  s_13_20,
  s_6,
  s_10,
  s_5,
  s_18,
  s_20,
  s_6,
  s_18,
  s_6,
  s_36,
  s_4_30_42,
  s_0,
  s_6_13,
  s_4,
  s_0,
  s_0,
  s_0,
  s_12,
  s_18_40,
  s_6_14,
  s_6,
  s_30,
  s_15,
  s_20,
  s_20,
  s_20,
  s_20,
  s_27,
  s_1,
  s_10_27,
  s_1_0,
  s_30,
  s_27,
  s_27,
  s_20,
  s_5,
  s_1,
  s_1,
  s_8,
  s_26,
  s_0,
  s_26,
  s_5,
  s_6,
  s_26,
  s_6,
  s_1,
  s_4,
  s_8,
  s_5,
  s_18,
  s_18,
  s_5,
  s_5,
  s_15,
  s_6_27_29_30_0,
  s_0,
  s_0,
  s_6_35,
  s_14_29_31_37_42,
  s_6,
  s_12_22_0,
  s_5,
  s_5_0,
  s_17_31,
  s_18,
  s_17,
  s_20,
  s_15,
  s_18,
  s_20,
  s_6_20_35,
  s_20,
  s_6,
  s_20,
  s_5,
  s_13,
  s_6,
  s_18,
  s_12_14_24,
  s_0,
  s_0_2,
  s_5,
  s_5,
  s_6,
  s_4_11,
  s_20,
  s_8_15,
  s_20,
  s_32_37,
  s_6_7_18_30_0,
  s_18,
  s_0,
  s_13_18,
  s_4_18,
  s_0,
  s_7,
  s_26,
  s_18,
  s_6_27,
  s_15,
  s_5,
  s_4_10_14_34_35_40,
  s_10_18,
  s_4_10,
  s_18,
  s_5,
  s_26,
  s_18,
  s_5,
  s_5,
  s_27,
  s_20,
  s_18,
  s_18,
  s_18,
  s_15,
  s_20,
  s_5,
  s_26_30_35_37,
  s_18,
  s_0,
  s_32,
  s_18,
  s_28,
  s_0,
  s_15_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_4,
  s_13_34,
  s_15,
  s_18_1,
  s_18,
  s_18_0,
  s_18_0,
  s_20,
  s_18,
  s_15,
  s_18,
  s_18,
  s_15,
  s_7,
  s_15,
  s_4_5_6_11_14_30_35_38,
  s_0,
  s_4,
  s_0,
  s_4,
  s_14_27,
  s_9,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_15,
  s_0,
  s_0,
  s_4_26,
  s_30_41,
  s_4_7,
  s_4_26,
  s_30_41,
  s_2,
  s_3_18_0,
  s_0,
  s_2,
  s_18,
  s_15,
  s_4,
  s_20,
  s_20,
  s_20,
  s_15_18,
  s_20,
  s_18,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_5,
  s_5,
  s_10,
  s_20,
  s_10,
  s_26,
  s_23,
  s_1,
  s_5,
  s_6_9_17_29_30_38_39,
  s_6,
  s_6,
  s_7,
  s_0,
  s_13_0,
  s_18,
  s_5_26,
  s_1,
  s_5,
  s_0_1,
  s_18_42,
  s_4,
  s_5,
  s_5,
  s_8,
  s_5,
  s_5,
  s_5,
  s_18,
  s_15,
  s_15,
  s_6,
  s_20,
  s_18,
  s_5_6_18_21_38_41,
  s_18,
  s_20,
  s_6,
  s_18,
  s_6_23_35,
  s_23,
  s_18_20,
  s_6_25_30_35,
  s_6,
  s_20,
  s_27,
  s_6_30_0,
  s_6,
  s_0,
  s_6,
  s_5_27,
  s_6,
  s_20,
  s_8,
  s_13_20,
  s_27,
  s_10_18_1_0,
  s_15,
  s_20_30,
  s_15,
  s_18,
  s_9_14,
  s_18_1,
  s_1,
  s_22_0,
  s_20,
  s_18,
  s_18_38,
  s_5,
  s_5,
  s_5,
  s_21_31,
  s_1,
  s_5,
  s_5,
  s_6_7_8_18_27_35_0,
  s_5_13_15_37,
  s_5_13,
  s_6_15_27_30_35,
  s_6,
  s_6_13_35,
  s_0,
  s_11,
  s_5,
  s_18,
  s_4,
  s_0,
  s_5,
  s_5,
  s_5_6_26_37_39,
  s_9_18,
  s_15,
  s_20,
  s_9_18,
  s_0,
  s_18_41,
  s_4,
  s_26,
  s_6_0,
  s_6_20_36,
  s_18,
  s_20,
  s_20,
  s_18,
  s_9,
  s_6,
  s_7_8_30_31_36_41,
  s_18_27,
  s_4_6_14,
  s_4_10_22,
  s_0,
  s_0,
  s_15,
  s_18,
  s_15,
  s_6_8_20_25,
  s_1,
  s_1,
  s_1,
  s_20,
  s_20,
  s_0,
  s_0,
  s_5,
  s_15,
  s_10_18_1,
  s_25_30_38_42,
  s_13,
  s_7,
  s_0,
  s_13,
  s_0,
  s_26,
  s_26,
  s_18_1,
  s_7_30,
  s_6,
  s_7,
  s_0,
  s_4_5_10_15_18_30_32_40_41,
  s_6_8,
  s_20,
  s_0,
  s_5,
  s_20,
  s_5_33,
  s_35,
  s_6,
  s_4_6,
  s_8,
  s_10_32,
  s_30_0,
  s_6,
  s_18,
  s_4,
  s_5_18,
  s_5,
  s_5,
  s_0,
  s_7,
  s_6,
  s_6_21,
  s_0,
  s_0,
  s_6,
  s_5,
  s_0,
  s_6,
  s_6,
  s_20,
  s_10_32,
  s_13,
  s_5,
  s_18_32_37_0,
  s_18,
  s_4_0,
  s_37,
  s_20,
  s_20,
  s_18,
  s_6_33,
  s_8_18_40_42_0,
  s_32_38_41,
  s_5,
  s_18,
  s_0,
  s_6,
  s_20,
  s_10,
  s_26,
  s_11_25_26_35_38_40_41,
  s_6,
  s_10,
  s_7,
  s_18,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_13,
  s_27,
  s_11,
  s_14_35_38,
  s_20,
  s_18,
  s_20,
  s_0,
  s_4_41,
  s_10,
  s_14,
  s_6_14_21_29_35,
  s_4_10,
  s_11,
  s_6_35_40,
  s_1,
  s_6,
  s_5,
  s_6,
  s_6_8,
  s_4_29_41,
  s_0,
  s_18,
  s_0,
  s_0,
  s_26,
  s_6_10_38_40_41,
  s_6_35_38_40,
  s_18,
  s_4,
  s_10,
  s_5_18,
  s_8,
  s_6_18,
  s_4_20_26_35,
  s_27,
  s_18,
  s_5_6,
  s_18,
  s_18,
  s_5,
  s_5,
  s_10_32_35_38,
  s_7_12,
  s_0,
  s_2,
  s_20,
  s_6_20_30,
  s_10,
  s_18,
  s_18,
  s_6,
  s_39,
  s_0,
  s_0,
  s_5,
  s_6_9_10_32_35,
  s_0,
  s_0,
  s_0,
  s_7,
  s_20,
  s_6_14,
  s_14,
  s_18,
  s_1,
  s_2,
  s_14,
  s_6,
  s_6,
  s_15,
  s_30,
  s_13_18,
  s_18,
  s_15,
  s_18,
  s_18,
  s_1,
  s_41,
  s_41,
  s_0,
  s_4,
  s_41,
  s_18,
  s_13,
  s_18,
  s_20,
  s_18,
  s_7_13_15,
  s_5,
  s_5,
  s_4_11,
  s_0,
  s_6,
  s_18,
  s_6,
  s_18_30_41,
  s_0,
  s_7_20_30,
  s_6,
  s_0,
  s_10_32_1,
  s_15,
  s_0,
  s_15,
  s_20,
  s_20,
  s_5,
  s_10_18_1,
  s_4_7_26_29_30_34_36_37_39_40_41_43,
  s_7,
  s_0,
  s_0,
  s_6,
  s_18,
  s_18,
  s_4_22_26_0,
  s_7_35,
  s_0,
  s_6,
  s_6,
  s_6,
  s_18,
  s_8_18,
  s_0,
  s_4_11,
  s_4_29,
  s_4,
  s_6,
  s_6_18_20_30,
  s_20,
  s_0,
  s_5,
  s_13,
  s_1,
  s_5,
  s_18,
  s_17_38,
  s_0,
  s_8_15,
  s_1,
  s_18,
  s_21,
  s_20,
  s_20,
  s_0,
  s_26,
  s_4_11_30_37_38_42,
  s_6,
  s_18,
  s_6_35,
  s_13_18,
  s_15_1,
  s_18_1,
  s_5,
  s_31_35_39_41,
  s_4,
  s_6_9_30_38,
  s_6,
  s_18,
  s_6,
  s_8_14_15_18_20_40_0,
  s_5,
  s_5,
  s_0,
  s_23_30,
  s_10,
  s_6,
  s_18,
  s_18,
  s_5,
  s_33_38_42,
  s_18,
  s_0,
  s_0,
  s_2,
  s_4_9_14,
  s_0,
  s_18,
  s_14,
  s_14,
  s_18,
  s_18,
  s_36,
  s_18,
  s_6,
  s_23,
  s_18,
  s_6,
  s_6,
  s_4_35,
  s_4_6_8_11_30_35_41_0,
  s_5,
  s_0,
  s_18,
  s_6,
  s_4_6_38,
  s_0,
  s_0,
  s_41_0,
  s_0,
  s_18,
  s_26,
  s_4,
  s_2,
  s_6,
  s_27,
  s_27,
  s_27,
  s_27,
  s_23,
  s_6,
  s_8_18_0,
  s_18_35,
  s_5,
  s_4,
  s_0,
  s_4_6,
  s_20,
  s_27,
  s_5,
  s_5_1,
  s_18,
  s_6_8_18_20_35,
  s_15_17,
  s_13_18_35,
  s_5_18,
  s_13,
  s_20,
  s_13,
  s_20,
  s_27,
  s_18,
  s_0,
  s_18,
  s_5_13,
  s_20,
  s_4_5_32_35_38,
  s_5,
  s_13,
  s_13_20,
  s_13,
  s_20,
  s_20,
  s_6_0,
  s_18,
  s_8,
  s_8,
  s_6_8_10_20_35,
  s_0,
  s_6_41,
  s_6,
  s_0,
  s_20,
  s_0,
  s_6_30,
  s_0,
  s_6,
  s_35,
  s_13,
  s_23,
  s_27,
  s_30,
  s_27,
  s_1,
  s_1,
  s_27,
  s_20,
  s_0,
  s_2,
  s_7,
  s_20,
  s_21_31_40_42,
  s_4,
  s_18,
  s_10,
  s_4,
  s_4,
  s_4_11_32_38_39_42,
  s_5,
  s_6,
  s_0,
  s_10,
  s_6,
  s_6,
  s_15,
  s_5,
  s_15,
  s_10,
  s_15,
  s_15,
  s_10_18,
  s_28_0,
  s_10,
  s_10,
  s_6_8_32,
  s_0,
  s_6,
  s_4,
  s_6_19,
  s_18,
  s_6,
  s_6,
  s_6,
  s_18,
  s_5,
  s_18,
  s_23,
  s_6,
  s_10,
  s_21,
  s_18_1_0,
  s_9,
  s_15,
  s_6,
  s_6_38,
  s_9_14_31,
  s_9_10,
  s_4_9,
  s_18,
  s_0,
  s_6,
  s_4_6,
  s_6,
  s_5,
  s_13_20_21_40,
  s_5,
  s_9_10,
  s_9_10,
  s_18,
  s_18,
  s_18,
  s_6,
  s_13,
  s_4,
  s_6_35,
  s_6_14,
  s_18,
  s_4,
  s_4,
  s_4_6,
  s_6_10_23_32_35,
  s_10,
  s_18,
  s_27,
  s_20,
  s_20,
  s_14,
  s_6,
  s_18,
  s_4_7,
  s_6,
  s_15,
  s_5,
  s_20,
  s_20,
  s_5,
  s_5,
  s_6_21_40,
  s_1,
  s_6_10,
  s_26,
  s_26,
  s_17,
  s_29,
  s_10,
  s_13,
  s_5,
  s_5,
  s_32,
  s_10_11_29_32,
  s_5,
  s_0,
  s_18,
  s_1,
  s_18,
  s_1,
  s_27,
  s_1,
  s_16,
  s_26,
  s_1,
  s_9,
  s_10,
  s_5,
  s_5,
  s_0,
  s_0,
  s_7_11,
  s_20,
  s_20,
  s_0,
  s_10_18,
  s_10,
  s_1,
  s_10,
  s_8,
  s_1,
  s_27,
  s_1_0,
  s_18_33,
  s_0,
  s_5,
  s_10_18,
  s_10,
  s_6_33,
  s_7_10,
  s_0,
  s_7,
  s_0,
  s_10,
  s_18,
  s_4,
  s_40,
  s_18,
  s_15,
  s_27,
  s_18,
  s_5,
  s_14,
  s_1,
  s_10,
  s_0,
  s_1,
  s_5,
  s_5_1,
  s_5,
  s_8,
  s_17,
  s_22,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_18,
  s_15,
  s_4_1,
  s_4_1,
  s_14,
  s_9,
  s_27,
  s_0,
  s_10_28,
  s_1,
  s_6,
  s_6,
  s_6,
  s_27,
  s_27,
  s_1,
  s_26,
  s_18,
  s_18,
  s_6,
  s_6_18_26_41,
  s_18,
  s_0,
  s_2,
  s_18,
  s_18,
  s_6,
  s_0,
  s_10_18,
  s_10,
  s_5,
  s_20,
  s_20,
  s_18,
  s_22,
  s_18,
  s_5,
  s_5_10,
  s_1,
  s_27,
  s_15,
  s_6,
  s_18_0,
  s_28,
  s_20,
  s_32,
  s_10,
  s_2,
  s_18,
  s_10_18,
  s_6_13_35,
  s_8,
  s_4_38,
  s_20,
  s_20,
  s_6_20,
  s_20,
  s_15,
  s_20,
  s_20,
  s_20,
  s_15,
  s_20,
  s_13,
  s_13,
  s_27,
  s_20,
  s_20,
  s_0,
  s_11,
  s_5_20,
  s_6,
  s_0,
  s_20,
  s_20,
  s_18,
  s_18,
  s_6,
  s_1,
  s_8,
  s_1,
  s_0,
  s_27,
  s_1,
  s_20,
  s_1,
  s_6,
  s_1,
  s_0,
  s_27,
  s_1,
  s_1,
  s_22_26,
  s_0,
  s_30,
  s_6_35,
  s_22,
  s_30,
  s_27,
  s_1,
  s_8,
  s_27,
  s_0,
  s_31_32_40,
  s_0,
  s_0,
  s_2,
  s_4_9,
  s_0,
  s_6_18,
  s_1,
  s_9_17,
  s_15,
  s_1,
  s_18,
  s_17,
  s_18,
  s_6,
  s_18,
  s_6,
  s_6,
  s_15,
  s_0,
  s_7,
  s_0,
  s_0,
  s_10_14_28_31,
  s_6_35,
  s_0,
  s_1,
  s_1,
  s_20,
  s_5_8_27,
  s_27,
  s_15,
  s_15,
  s_7,
  s_30_31_35,
  s_44,
  s_4,
  s_7,
  s_27,
  s_6_1_0,
  s_1,
  s_5,
  s_5,
  s_18,
  s_15,
  s_18_1,
  s_27,
  s_0,
  s_18,
  s_6_31,
  s_18,
  s_4_15_28,
  s_20,
  s_1,
  s_4,
  s_6_29_35,
  s_6,
  s_4_9_10_29_31_32_38_40_41_42,
  s_20,
  s_0,
  s_18,
  s_10_14,
  s_10,
  s_18_0,
  s_20,
  s_5,
  s_36,
  s_18,
  s_1,
  s_1,
  s_18,
  s_10,
  s_5,
  s_5,
  s_4,
  s_5,
  s_6_18,
  s_5,
  s_20,
  s_6_31,
  s_5,
  s_5,
  s_0,
  s_0,
  s_20,
  s_5,
  s_20,
  s_4,
  s_17,
  s_5,
  s_5,
  s_10_14,
  s_1,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_4,
  s_7_26,
  s_4,
  s_30_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_26,
  s_20,
  s_20_26_30,
  s_7_19_29_30_37_0,
  s_4,
  s_2,
  s_7_12_26,
  s_20,
  s_20,
  s_20,
  s_27,
  s_15,
  s_17,
  s_20,
  s_20,
  s_1,
  s_23,
  s_0,
  s_0,
  s_6,
  s_1,
  s_4,
  s_5,
  s_20,
  s_6,
  s_6,
  s_15,
  s_10,
  s_20,
  s_20,
  s_6,
  s_32,
  s_10,
  s_0,
  s_0,
  s_2,
  s_4_10,
  s_13,
  s_8,
  s_11_15,
  s_20,
  s_29_35,
  s_18,
  s_22,
  s_9,
  s_18_1,
  s_1,
  s_1,
  s_18,
  s_27,
  s_20,
  s_20,
  s_1,
  s_1,
  s_1,
  s_5_20,
  s_1,
  s_20,
  s_1,
  s_1,
  s_5_20,
  s_5,
  s_18_20,
  s_5,
  s_20,
  s_1,
  s_20,
  s_20,
  s_6_17,
  s_20,
  s_6,
  s_7,
  s_14,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_4_17_25_38,
  s_1,
  s_8_20,
  s_15,
  s_18_1,
  s_15,
  s_18_28_1,
  s_6,
  s_6_15,
  s_6,
  s_15,
  s_5,
  s_6,
  s_20,
  s_5,
  s_20,
  s_20,
  s_5,
  s_15,
  s_26,
  s_5,
  s_13,
  s_6,
  s_6,
  s_18,
  s_15,
  s_18_1,
  s_15,
  s_6,
  s_6,
  s_6,
  s_15,
  s_6,
  s_6,
  s_20,
  s_14,
  s_20,
  s_4_6_7_39,
  s_0,
  s_6_9_14_30_35_42_0,
  s_4_11_33_41,
  s_18,
  s_4,
  s_25,
  s_15,
  s_6,
  s_20,
  s_20,
  s_20,
  s_1,
  s_1,
  s_1,
  s_18,
  s_20,
  s_15,
  s_5,
  s_6_18,
  s_0,
  s_11,
  s_15,
  s_27,
  s_1,
  s_30,
  s_0,
  s_1,
  s_20,
  s_4,
  s_20,
  s_18,
  s_15,
  s_5,
  s_15,
  s_6,
  s_20,
  s_15,
  s_0,
  s_20,
  s_5,
  s_0,
  s_6,
  s_18,
  s_20,
  s_6_8_10_23_30_41,
  s_15,
  s_10_18,
  s_10,
  s_5,
  s_15,
  s_17_18_1,
  s_20,
  s_20,
  s_6_8_17_40,
  s_1,
  s_0,
  s_8,
  s_4,
  s_40,
  s_4,
  s_40,
  s_20,
  s_20,
  s_13,
  s_15,
  s_10,
  s_18,
  s_15,
  s_5_7_18_0,
  s_4,
  s_20,
  s_27,
  s_15,
  s_4,
  s_10_32_35_41_42,
  s_0,
  s_0,
  s_4_10,
  s_0,
  s_0,
  s_5_15_17_18_26,
  s_0,
  s_20,
  s_5,
  s_26_1,
  s_15,
  s_23,
  s_6,
  s_6,
  s_20,
  s_0,
  s_0,
  s_0,
  s_20,
  s_4,
  s_18,
  s_4,
  s_26,
  s_2,
  s_7,
  s_0,
  s_6_23_39,
  s_20,
  s_19,
  s_18,
  s_28,
  s_20,
  s_6,
  s_4,
  s_7,
  s_6,
  s_6,
  s_6,
  s_20,
  s_7_9,
  s_7_9,
  s_13_39,
  s_13,
  s_18,
  s_20,
  s_20,
  s_6_20_35,
  s_14,
  s_5,
  s_20,
  s_20,
  s_0,
  s_18,
  s_4,
  s_23,
  s_6,
  s_17,
  s_1,
  s_28,
  s_5,
  s_5,
  s_5_8_1,
  s_6,
  s_5,
  s_13_20,
  s_6,
  s_9_26_29,
  s_0,
  s_20,
  s_5,
  s_20,
  s_20,
  s_27,
  s_6_20,
  s_20,
  s_4,
  s_0,
  s_13,
  s_6,
  s_15,
  s_18,
  s_0,
  s_34,
  s_4,
  s_1,
  s_34,
  s_6,
  s_2,
  s_6,
  s_4_5_6_33,
  s_4_33,
  s_6,
  s_18,
  s_6,
  s_0,
  s_35,
  s_4,
  s_4,
  s_35,
  s_4,
  s_35,
  s_0,
  s_6_38,
  s_18,
  s_13,
  s_10_17_18,
  s_1_0,
  s_1_0,
  s_2,
  s_4,
  s_32,
  s_0,
  s_18_1,
  s_4,
  s_32,
  s_0,
  s_35,
  s_0,
  s_17,
  s_6_35,
  s_0,
  s_6_10_17_38,
  s_0,
  s_18,
  s_20,
  s_13_20,
  s_13_20,
  s_0,
  s_2,
  s_10,
  s_0,
  s_6,
  s_4_38,
  s_15,
  s_44,
  s_20,
  s_8,
  s_10,
  s_10,
  s_6_36_42,
  s_32,
  s_4,
  s_6,
  s_10,
  s_15_41_42,
  s_1,
  s_10,
  s_6,
  s_18,
  s_0,
  s_18,
  s_35,
  s_4,
  s_4,
  s_4,
  s_18,
  s_6_26_35,
  s_5,
  s_6_9_26_31_41,
  s_18,
  s_10,
  s_17,
  s_17,
  s_27,
  s_6_10_17_20_30_42,
  s_7_9_26,
  s_0,
  s_7_9,
  s_2,
  s_0,
  s_7_9,
  s_6_19,
  s_30_32,
  s_1,
  s_6,
  s_4_7_9_19_23_26,
  s_6_36,
  s_0,
  s_6_17,
  s_18,
  s_5,
  s_5,
  s_5_17,
  s_4_13_20_38,
  s_5,
  s_5,
  s_18,
  s_18_1,
  s_20,
  s_23,
  s_5,
  s_19,
  s_6_8_1_0,
  s_6_10_14_15_21_0,
  s_4_10,
  s_30_31_36_40,
  s_14,
  s_18_0_1,
  s_0_1,
  s_4_10,
  s_30_31_36_40,
  s_8_0,
  s_21,
  s_6,
  s_5,
  s_1,
  s_1,
  s_33,
  s_4_10,
  s_20,
  s_5,
  s_5,
  s_18,
  s_5_13,
  s_18,
  s_29,
  s_29,
  s_4,
  s_6,
  s_6,
  s_15,
  s_1,
  s_20,
  s_20,
  s_0,
  s_13,
  s_13,
  s_5_18,
  s_5,
  s_5,
  s_15,
  s_10,
  s_12,
  s_0,
  s_2,
  s_7,
  s_15_17_18,
  s_5,
  s_17,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_4_38,
  s_5,
  s_5,
  s_5,
  s_27,
  s_20,
  s_20,
  s_5,
  s_5,
  s_38,
  s_11,
  s_6,
  s_6_9,
  s_1,
  s_35_0,
  s_0,
  s_6_8_10_20_30_35,
  s_30_35,
  s_30_35,
  s_18_41,
  s_4,
  s_4,
  s_10_40,
  s_0,
  s_2,
  s_37,
  s_0,
  s_0,
  s_2,
  s_12_26,
  s_18_0,
  s_26,
  s_6,
  s_18,
  s_4_22_35_36_37_40,
  s_18,
  s_5_6,
  s_13_20,
  s_8_25,
  s_5,
  s_6,
  s_5,
  s_5,
  s_18,
  s_6,
  s_18,
  s_5,
  s_5,
  s_15,
  s_6,
  s_38,
  s_20,
  s_5,
  s_6,
  s_6,
  s_20,
  s_5,
  s_13_20,
  s_7_13_0,
  s_30,
  s_30,
  s_5,
  s_20,
  s_20,
  s_5_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_23,
  s_18,
  s_6_14_38,
  s_4,
  s_6,
  s_6,
  s_13_20,
  s_27,
  s_27,
  s_27,
  s_6,
  s_18,
  s_1,
  s_27,
  s_1,
  s_27,
  s_6,
  s_6_27,
  s_1,
  s_13_27,
  s_13,
  s_27_30_42,
  s_0,
  s_22,
  s_15,
  s_1,
  s_28_1,
  s_22,
  s_30,
  s_22,
  s_30,
  s_1,
  s_27_1,
  s_1,
  s_27,
  s_27_1,
  s_30,
  s_1,
  s_6,
  s_26_27,
  s_0,
  s_0,
  s_35,
  s_6,
  s_6,
  s_30,
  s_30,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_1,
  s_26,
  s_26,
  s_1,
  s_26,
  s_6_10_18_27_31_35,
  s_20,
  s_13_20,
  s_13_20,
  s_13,
  s_27_0,
  s_6,
  s_6,
  s_18,
  s_6,
  s_8,
  s_1,
  s_15,
  s_5_6,
  s_5,
  s_5_7_18_23_0,
  s_4_14,
  s_5,
  s_23,
  s_4,
  s_10,
  s_6,
  s_1,
  s_4,
  s_25,
  s_1,
  s_18,
  s_9,
  s_26,
  s_26,
  s_26,
  s_1,
  s_1,
  s_4,
  s_20,
  s_1,
  s_26,
  s_5,
  s_6,
  s_13_20,
  s_6,
  s_4,
  s_18,
  s_18,
  s_18,
  s_5,
  s_5,
  s_6,
  s_20,
  s_4_9_12_37_41,
  s_4_38,
  s_4_38,
  s_4,
  s_18,
  s_0,
  s_7_12,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_2,
  s_4_7,
  s_10_18,
  s_4_35,
  s_4,
  s_10,
  s_18,
  s_5,
  s_18,
  s_0,
  s_20,
  s_21,
  s_23,
  s_6,
  s_18,
  s_5,
  s_5,
  s_10_18,
  s_15_17,
  s_5,
  s_15,
  s_5,
  s_20,
  s_20,
  s_10_32,
  s_18,
  s_22,
  s_4_6,
  s_18,
  s_8_17,
  s_1,
  s_5_44,
  s_44,
  s_12_0,
  s_4_10_18,
  s_0,
  s_20,
  s_35,
  s_4,
  s_37,
  s_20,
  s_14_23,
  s_18,
  s_18,
  s_15,
  s_18,
  s_14,
  s_18_1,
  s_18,
  s_6_0,
  s_7_30_0,
  s_4,
  s_1_0,
  s_30,
  s_12,
  s_30_31_36,
  s_27,
  s_2,
  s_0,
  s_7_20_0,
  s_20,
  s_18,
  s_20,
  s_27,
  s_30,
  s_4,
  s_5,
  s_5,
  s_0_1,
  s_5,
  s_5,
  s_18,
  s_27,
  s_13_20,
  s_6,
  s_4_10_36,
  s_1,
  s_18,
  s_15,
  s_15,
  s_1,
  s_4,
  s_18_1,
  s_18,
  s_18,
  s_18,
  s_4_11_35_38,
  s_27,
  s_26,
  s_27,
  s_18,
  s_1,
  s_27,
  s_4,
  s_4_41,
  s_6,
  s_18,
  s_0,
  s_5_13_32,
  s_8_1,
  s_17,
  s_20,
  s_1,
  s_0,
  s_17,
  s_18_41,
  s_20,
  s_4,
  s_18,
  s_6_17_35_42,
  s_6_1_0,
  s_18,
  s_0,
  s_0,
  s_6,
  s_20,
  s_5,
  s_20,
  s_10,
  s_20,
  s_20,
  s_5,
  s_5,
  s_0,
  s_20,
  s_6,
  s_20,
  s_1,
  s_1,
  s_8,
  s_6,
  s_5,
  s_27,
  s_27,
  s_5,
  s_6,
  s_6_18,
  s_6,
  s_18,
  s_6_7,
  s_6,
  s_5_6_14_18_19_27,
  s_5,
  s_20,
  s_18,
  s_4_13_20,
  s_18,
  s_1,
  s_6,
  s_4_29_30_31_32_33_34_35_36_38_40_41_42,
  s_6,
  s_6,
  s_0,
  s_18,
  s_6_35,
  s_4,
  s_15,
  s_10,
  s_14,
  s_18,
  s_18_1,
  s_15,
  s_18_1,
  s_20,
  s_5,
  s_18_1,
  s_18,
  s_8,
  s_26,
  s_1_0,
  s_4,
  s_23,
  s_18,
  s_1,
  s_1,
  s_4,
  s_6_23,
  s_23,
  s_10_36,
  s_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_4_6_21_38,
  s_18,
  s_20,
  s_8,
  s_8,
  s_1,
  s_1,
  s_1,
  s_1,
  s_18,
  s_35,
  s_0,
  s_6,
  s_0,
  s_18,
  s_4_6,
  s_20,
  s_6,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_13,
  s_15,
  s_18,
  s_18,
  s_20,
  s_15,
  s_6,
  s_11_14_17_35_38,
  s_17,
  s_20,
  s_20,
  s_4_6_8_9_10_11_18_23_26_35_39,
  s_30,
  s_10_0,
  s_0,
  s_23,
  s_6_27,
  s_6,
  s_0,
  s_6,
  s_4,
  s_18,
  s_5,
  s_18_21_40,
  s_0,
  s_6,
  s_21,
  s_0,
  s_13_20,
  s_18_41,
  s_6_15_27,
  s_6,
  s_4_6,
  s_6_23,
  s_6_35,
  s_23,
  s_5,
  s_18,
  s_27,
  s_15,
  s_17,
  s_6,
  s_6,
  s_6,
  s_18,
  s_13,
  s_20_27,
  s_6_13,
  s_6,
  s_20,
  s_20,
  s_4,
  s_20,
  s_17_18,
  s_18,
  s_13,
  s_10_18,
  s_27,
  s_18,
  s_6,
  s_0,
  s_5,
  s_4_6_7_14_25_29_32_33_35_36_38_40_41,
  s_20,
  s_6,
  s_20,
  s_20,
  s_18,
  s_14_26,
  s_0,
  s_0,
  s_6_18,
  s_32_41,
  s_4_10,
  s_15,
  s_10,
  s_15,
  s_20,
  s_20,
  s_18,
  s_4_6,
  s_4_6_33,
  s_0,
  s_4,
  s_5_6_17,
  s_5,
  s_5,
  s_18_29_30,
  s_0,
  s_4,
  s_18,
  s_15,
  s_18,
  s_9,
  s_0,
  s_2,
  s_7,
  s_11_18,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_5,
  s_18,
  s_1,
  s_1,
  s_9,
  s_4_5_6_18_29_35,
  s_0,
  s_22,
  s_0_1,
  s_30,
  s_22,
  s_30,
  s_5,
  s_10,
  s_1,
  s_1,
  s_0,
  s_11_19,
  s_0,
  s_0,
  s_6,
  s_0,
  s_0,
  s_6,
  s_6,
  s_10_18_1,
  s_27,
  s_1,
  s_10_0,
  s_26,
  s_18_1,
  s_10,
  s_10_31_36,
  s_18,
  s_10_31_36,
  s_18,
  s_15,
  s_20,
  s_5,
  s_30,
  s_22,
  s_18_27,
  s_1,
  s_2,
  s_30,
  s_6,
  s_22,
  s_1,
  s_18,
  s_5,
  s_5,
  s_20,
  s_26,
  s_1,
  s_9,
  s_22,
  s_1,
  s_6,
  s_20,
  s_11,
  s_6,
  s_1,
  s_6,
  s_6_35,
  s_1,
  s_1,
  s_17_26,
  s_26,
  s_1,
  s_5_0,
  s_0,
  s_20,
  s_11_19_26,
  s_0,
  s_2,
  s_26,
  s_1,
  s_10_13_18,
  s_5,
  s_6,
  s_20,
  s_10_32,
  s_4_6_7_10_17_18_23_29_30_31_33_35_36_37_38_39_40_41_43,
  s_6,
  s_4_18,
  s_20,
  s_4_0,
  s_6,
  s_0,
  s_10,
  s_20,
  s_10,
  s_0,
  s_20,
  s_4,
  s_1,
  s_1,
  s_27,
  s_32,
  s_10,
  s_1,
  s_18,
  s_1,
  s_32,
  s_27,
  s_20,
  s_18,
  s_10,
  s_0,
  s_10,
  s_1,
  s_1_0,
  s_1_0,
  s_2,
  s_4_9_14,
  s_31,
  s_0,
  s_4_9_14,
  s_31,
  s_0,
  s_9_14,
  s_14,
  s_25,
  s_35,
  s_35_0,
  s_34,
  s_0,
  s_18,
  s_4,
  s_5_6,
  s_11_32,
  s_5_13,
  s_6_20,
  s_20,
  s_5,
  s_20,
  s_14,
  s_9,
  s_14,
  s_4,
  s_5,
  s_6_0,
  s_5,
  s_5,
  s_15,
  s_20,
  s_29,
  s_1,
  s_6,
  s_6_1,
  s_18,
  s_18,
  s_6,
  s_4,
  s_30,
  s_4,
  s_30,
  s_16,
  s_6,
  s_1,
  s_18_1_0,
  s_30,
  s_9,
  s_7_9,
  s_30,
  s_6,
  s_18,
  s_6,
  s_17,
  s_1,
  s_20,
  s_1,
  s_6,
  s_20,
  s_4_29,
  s_20,
  s_1,
  s_1,
  s_9,
  s_5,
  s_5,
  s_5,
  s_5,
  s_17,
  s_13,
  s_20,
  s_5,
  s_18,
  s_23,
  s_7,
  s_0,
  s_5,
  s_18,
  s_6,
  s_20,
  s_23_0,
  s_18,
  s_6,
  s_15,
  s_10_18_1_0,
  s_1,
  s_0,
  s_15_17,
  s_14_41,
  s_8,
  s_1_2_0,
  s_2,
  s_5,
  s_5_8_0,
  s_0,
  s_20,
  s_8,
  s_6,
  s_0,
  s_13_20,
  s_0,
  s_27_35,
  s_0,
  s_27,
  s_20,
  s_4,
  s_0,
  s_26,
  s_24,
  s_2,
  s_4,
  s_0,
  s_3_4_10_11_32_36,
  s_0,
  s_10,
  s_6_35_40,
  s_4,
  s_27_0,
  s_2,
  s_6,
  s_4,
  s_30,
  s_4,
  s_30,
  s_4_6,
  s_7_9_10_32,
  s_0,
  s_14_0,
  s_2,
  s_7,
  s_14,
  s_18_0,
  s_2,
  s_5,
  s_14,
  s_18,
  s_17_31_35,
  s_10,
  s_18,
  s_18,
  s_18,
  s_17_35,
  s_0,
  s_6,
  s_5,
  s_13,
  s_13,
  s_5,
  s_10_32,
  s_18,
  s_18,
  s_0,
  s_8_17_22_25,
  s_38,
  s_8,
  s_5,
  s_11_32,
  s_18,
  s_17,
  s_13_20,
  s_5,
  s_10_18,
  s_5,
  s_5,
  s_4,
  s_19,
  s_0,
  s_14,
  s_14,
  s_27,
  s_28_42,
  s_0,
  s_2,
  s_7,
  s_5,
  s_15,
  s_10_18,
  s_10,
  s_5,
  s_5,
  s_1,
  s_5,
  s_26,
  s_5_20,
  s_20,
  s_8,
  s_20,
  s_5,
  s_0,
  s_20,
  s_40,
  s_23,
  s_10,
  s_4,
  s_20,
  s_20,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_20,
  s_20,
  s_11,
  s_6_7_10,
  s_0,
  s_20,
  s_20,
  s_20,
  s_15,
  s_18,
  s_41,
  s_0,
  s_18,
  s_4_11,
  s_18,
  s_1,
  s_6,
  s_18_26,
  s_6,
  s_13_20,
  s_7,
  s_13_20,
  s_6,
  s_1_0,
  s_27,
  s_1,
  s_4_26,
  s_18_0,
  s_4,
  s_26,
  s_4,
  s_3_6_14,
  s_6,
  s_6_21,
  s_6,
  s_6,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6,
  s_0_1,
  s_26,
  s_8,
  s_26,
  s_10_27_0,
  s_27,
  s_27,
  s_1,
  s_8,
  s_8,
  s_20,
  s_18,
  s_18,
  s_10_1,
  s_20,
  s_13_20,
  s_6,
  s_8_27_35,
  s_27,
  s_1,
  s_8,
  s_15,
  s_20,
  s_18,
  s_1,
  s_1,
  s_22,
  s_1,
  s_6,
  s_28_1,
  s_39,
  s_6,
  s_18_31_41,
  s_0,
  s_1,
  s_4,
  s_0,
  s_4,
  s_0,
  s_10_26_32,
  s_4_32,
  s_21_23,
  s_23,
  s_23,
  s_23,
  s_17_18,
  s_20,
  s_20,
  s_17,
  s_20,
  s_23,
  s_18_0,
  s_28_1,
  s_28_1,
  s_2,
  s_4_6_8_9_13_14_15_18_31_38_42_0,
  s_6,
  s_0,
  s_4_6,
  s_18,
  s_10,
  s_4_9,
  s_25,
  s_6_9,
  s_1_0,
  s_23,
  s_4,
  s_1,
  s_9,
  s_23,
  s_23,
  s_21_23,
  s_23,
  s_23,
  s_23,
  s_5,
  s_23,
  s_6_0,
  s_4,
  s_30,
  s_0,
  s_0,
  s_9,
  s_1,
  s_1,
  s_7,
  s_4,
  s_30,
  s_0,
  s_0,
  s_2,
  s_20,
  s_5,
  s_5,
  s_6_8_9_13_15_31_38,
  s_6,
  s_10,
  s_6_9,
  s_6,
  s_0,
  s_0,
  s_0,
  s_38,
  s_22,
  s_6_38,
  s_8,
  s_0,
  s_5,
  s_9,
  s_18_0,
  s_5,
  s_15,
  s_1,
  s_20,
  s_8,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_8,
  s_1,
  s_20,
  s_0,
  s_8,
  s_20,
  s_18,
  s_23_28,
  s_18,
  s_26,
  s_20,
  s_5,
  s_5,
  s_6,
  s_26,
  s_1,
  s_26,
  s_5,
  s_5,
  s_5,
  s_6,
  s_26,
  s_4,
  s_5_1,
  s_5,
  s_1,
  s_5,
  s_6,
  s_6,
  s_20,
  s_20,
  s_20,
  s_6,
  s_20,
  s_17_18,
  s_5,
  s_9,
  s_5,
  s_6_1,
  s_18,
  s_4,
  s_18,
  s_5,
  s_5,
  s_5,
  s_20,
  s_6,
  s_27,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5,
  s_20,
  s_18,
  s_5,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5_35,
  s_13_20_1,
  s_1,
  s_8,
  s_0_1,
  s_2,
  s_31,
  s_9,
  s_26,
  s_1,
  s_1,
  s_8,
  s_6,
  s_6,
  s_11_0,
  s_2,
  s_1_0,
  s_2,
  s_7,
  s_4_11,
  s_17_18,
  s_27,
  s_20,
  s_1,
  s_13_20,
  s_7_0,
  s_27,
  s_6,
  s_0,
  s_5,
  s_1,
  s_20,
  s_7,
  s_0,
  s_2,
  s_7_9,
  s_5,
  s_5,
  s_0,
  s_10_21_32_40,
  s_0,
  s_4_10,
  s_0,
  s_0,
  s_32_40_41,
  s_10,
  s_9,
  s_7_0,
  s_27,
  s_1,
  s_27,
  s_27,
  s_18,
  s_1,
  s_26,
  s_5,
  s_5,
  s_1,
  s_8,
  s_5,
  s_5,
  s_4_1,
  s_4_1,
  s_27,
  s_0,
  s_11,
  s_4,
  s_6,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5_1,
  s_1,
  s_13,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_27,
  s_17,
  s_18,
  s_15,
  s_1,
  s_27,
  s_18,
  s_27,
  s_18,
  s_8,
  s_23,
  s_9_14,
  s_27,
  s_27,
  s_13_15,
  s_5,
  s_6_18,
  s_5,
  s_10_15_17_27,
  s_6,
  s_6,
  s_18_1,
  s_10,
  s_20,
  s_6,
  s_20,
  s_20,
  s_5,
  s_4,
  s_5,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_1,
  s_12_26_30_35_37_39,
  s_0,
  s_20,
  s_6_27_32,
  s_32_40,
  s_5,
  s_1,
  s_20,
  s_1_0,
  s_12,
  s_10,
  s_18,
  s_10,
  s_10,
  s_12_37,
  s_0,
  s_10,
  s_6_14_17_18_23_35,
  s_0,
  s_0,
  s_6,
  s_6,
  s_4_6_18_32_41,
  s_6,
  s_18_41,
  s_4,
  s_18,
  s_18,
  s_6,
  s_28,
  s_5,
  s_5_20,
  s_26,
  s_27,
  s_14_15,
  s_27,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_27,
  s_5,
  s_15,
  s_18_1,
  s_15,
  s_18_1,
  s_18_1,
  s_23,
  s_6,
  s_6,
  s_6_7_27_36,
  s_6,
  s_6,
  s_27,
  s_1_0,
  s_13,
  s_10_26_32,
  s_0,
  s_18,
  s_0,
  s_6,
  s_4,
  s_1,
  s_27,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5_17,
  s_5,
  s_5,
  s_20,
  s_6_8_14_42,
  s_0,
  s_18,
  s_18,
  s_6,
  s_18,
  s_6,
  s_5_17_18,
  s_6_35,
  s_6,
  s_27,
  s_5_27,
  s_20,
  s_27,
  s_18_34,
  s_13_15,
  s_15_17,
  s_4,
  s_18_33_0,
  s_4_11_26,
  s_17_18,
  s_0,
  s_18,
  s_20,
  s_20,
  s_4_7_19_26_40_41_0,
  s_0,
  s_6,
  s_6,
  s_18,
  s_4,
  s_4_15,
  s_6_14,
  s_26,
  s_26,
  s_1,
  s_1,
  s_0,
  s_6,
  s_4_38,
  s_18,
  s_18,
  s_6,
  s_6,
  s_17,
  s_15,
  s_4_6_7_11_19_21_24_30_38_40,
  s_7,
  s_0,
  s_7,
  s_0,
  s_0,
  s_7,
  s_0,
  s_7,
  s_18,
  s_11,
  s_6_18,
  s_0,
  s_17,
  s_17,
  s_4_6_8_10_17_25_35_38,
  s_4,
  s_35_36_38,
  s_4,
  s_35_36_38,
  s_10,
  s_5,
  s_28,
  s_28,
  s_4,
  s_10_32,
  s_20,
  s_0,
  s_6,
  s_20,
  s_10,
  s_4,
  s_0,
  s_6_21,
  s_10,
  s_28,
  s_28,
  s_9_18_19_26,
  s_1_0,
  s_2,
  s_6_17_18_25_30,
  s_14,
  s_13,
  s_13,
  s_6,
  s_4_6,
  s_18,
  s_18_38,
  s_18_38,
  s_0,
  s_6,
  s_18,
  s_4,
  s_4,
  s_6,
  s_0,
  s_18,
  s_18,
  s_0,
  s_10_11_14_28,
  s_6,
  s_4,
  s_5_18_27_30_43,
  s_5,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_7_9_10_18_26_35,
  s_10,
  s_32_42,
  s_7_9_10_0,
  s_2,
  s_4_10,
  s_32_42,
  s_0,
  s_4_10,
  s_4,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6_7_27_36_0,
  s_18,
  s_6,
  s_13_20,
  s_13_20,
  s_4_6_10_12_16_18_19_21_30_31_32_33_35_36_37_38_40_41,
  s_0,
  s_0,
  s_18,
  s_5_6,
  s_17,
  s_2,
  s_5,
  s_7,
  s_6_38,
  s_17_18,
  s_7,
  s_0,
  s_0_1,
  s_7,
  s_2,
  s_4_7_14_20,
  s_10,
  s_18,
  s_4,
  s_18,
  s_15,
  s_17_18,
  s_4_15_38,
  s_15,
  s_20,
  s_13_15,
  s_15,
  s_6_7_9_10_32_33_37_41,
  s_0,
  s_18,
  s_0,
  s_2,
  s_6_0,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_6_10_31_36,
  s_1,
  s_10_40_41,
  s_0,
  s_6,
  s_9,
  s_18,
  s_0,
  s_15,
  s_7_13_0,
  s_18,
  s_0,
  s_11,
  s_4_6_18_35_38_41,
  s_18,
  s_13_18,
  s_18,
  s_1,
  s_14,
  s_9,
  s_17,
  s_4_38,
  s_18,
  s_1,
  s_14,
  s_9,
  s_6_8,
  s_0,
  s_2,
  s_30_32,
  s_7,
  s_10,
  s_32,
  s_4_10,
  s_4_7,
  s_6,
  s_5_10_32,
  s_6,
  s_13_18,
  s_6_18,
  s_5,
  s_0,
  s_10,
  s_17,
  s_4_15,
  s_21,
  s_10_11_32_35_39,
  s_18_20,
  s_5_18,
  s_11,
  s_2,
  s_0,
  s_18,
  s_18_38,
  s_18,
  s_20,
  s_20,
  s_5,
  s_4_7,
  s_18,
  s_1_0,
  s_18,
  s_13_34,
  s_18,
  s_0,
  s_30,
  s_18_0,
  s_2,
  s_7,
  s_18,
  s_4_18_20_33_41,
  s_18,
  s_20,
  s_4_0,
  s_18,
  s_10_18_1,
  s_15,
  s_15,
  s_4_6_7_9_10_21_26_30_31_32_33_36_38_40_41_42,
  s_21,
  s_0,
  s_6_18_30_36,
  s_13_20,
  s_20,
  s_6,
  s_0,
  s_4,
  s_10,
  s_4_11_33,
  s_4_6_28,
  s_15,
  s_6,
  s_6,
  s_35,
  s_9,
  s_4,
  s_13_15,
  s_7_8_10_32,
  s_8,
  s_2,
  s_7,
  s_6,
  s_0,
  s_11_32,
  s_7_10_32_37,
  s_18,
  s_0,
  s_2,
  s_7_12,
  s_2,
  s_10_0,
  s_10,
  s_32,
  s_18,
  s_0,
  s_2,
  s_12,
  s_0,
  s_13_20_35_42,
  s_6,
  s_13,
  s_6_13,
  s_6,
  s_20,
  s_0,
  s_18,
  s_0,
  s_0,
  s_5,
  s_18,
  s_5,
  s_18,
  s_20,
  s_26,
  s_26,
  s_26,
  s_20,
  s_18,
  s_18,
  s_5_18,
  s_27_42_1,
  s_1,
  s_22,
  s_5,
  s_1,
  s_5,
  s_1,
  s_1,
  s_20,
  s_5,
  s_1,
  s_26,
  s_20,
  s_5,
  s_5,
  s_5_1,
  s_5,
  s_5,
  s_15,
  s_5,
  s_5,
  s_10,
  s_10,
  s_1,
  s_27_1,
  s_2,
  s_19,
  s_1,
  s_6,
  s_35,
  s_22,
  s_0,
  s_18,
  s_9_24_27,
  s_15,
  s_9,
  s_1,
  s_8,
  s_26,
  s_22,
  s_0,
  s_4,
  s_22,
  s_4,
  s_1,
  s_1,
  s_4,
  s_15,
  s_5,
  s_5,
  s_6,
  s_15,
  s_20,
  s_20,
  s_20,
  s_18,
  s_21_40,
  s_21,
  s_6_30_36,
  s_0,
  s_15,
  s_10_18,
  s_10_18,
  s_15,
  s_13,
  s_13_20,
  s_37,
  s_0,
  s_5,
  s_15,
  s_10_18,
  s_6,
  s_7_13_20_0,
  s_5_13,
  s_27,
  s_1,
  s_18,
  s_0,
  s_18,
  s_13_20,
  s_4_20,
  s_6,
  s_6,
  s_6_8,
  s_15,
  s_6_18,
  s_18,
  s_5_7_13_20_0,
  s_0,
  s_5,
  s_23,
  s_18,
  s_5,
  s_15,
  s_13,
  s_6_10,
  s_5,
  s_37,
  s_37,
  s_4_13_34,
  s_18,
  s_0,
  s_18,
  s_4,
  s_5,
  s_0,
  s_10_15_18,
  s_10_26,
  s_1,
  s_13,
  s_6,
  s_8,
  s_8,
  s_1,
  s_1,
  s_1,
  s_10,
  s_7_0,
  s_4_15,
  s_4_6_14_32_33,
  s_4,
  s_18,
  s_6,
  s_10_18,
  s_7_18_0,
  s_20,
  s_5_18,
  s_5,
  s_4,
  s_10_18,
  s_5_11_13_18_0,
  s_21,
  s_33,
  s_0,
  s_26,
  s_10,
  s_5,
  s_13_20,
  s_20,
  s_27,
  s_7,
  s_18,
  s_13_20,
  s_20,
  s_32,
  s_10,
  s_18_0,
  s_2,
  s_18,
  s_4,
  s_4,
  s_6,
  s_6,
  s_5,
  s_5,
  s_20,
  s_8,
  s_5,
  s_5_15,
  s_26,
  s_0,
  s_26,
  s_18,
  s_22_1,
  s_26,
  s_22,
  s_4,
  s_26_28,
  s_0,
  s_2,
  s_7,
  s_0,
  s_26,
  s_0,
  s_0,
  s_30,
  s_13_15,
  s_18_1,
  s_13,
  s_23,
  s_9,
  s_18,
  s_1,
  s_7_12_26_30_37,
  s_4,
  s_13,
  s_7,
  s_22_0,
  s_13_0,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_18,
  s_5_9_18,
  s_5,
  s_18,
  s_20,
  s_10_18,
  s_17,
  s_6_39,
  s_9_18,
  s_1,
  s_1,
  s_1_0,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_18,
  s_20,
  s_5,
  s_5,
  s_10,
  s_8_10_38,
  s_6_15,
  s_20,
  s_4_18,
  s_6,
  s_13,
  s_5,
  s_20,
  s_5_6_27,
  s_5,
  s_5,
  s_20,
  s_0,
  s_5_13_35,
  s_10_18_1,
  s_10,
  s_11_17_18_30_35_39,
  s_13,
  s_0,
  s_0,
  s_6,
  s_6,
  s_5_10_13_18_19,
  s_10,
  s_6,
  s_13_20,
  s_6,
  s_2,
  s_0,
  s_20,
  s_20,
  s_15,
  s_4_6_7_13_17_35,
  s_27,
  s_10_18,
  s_5,
  s_13,
  s_13,
  s_18_1,
  s_0,
  s_10_18,
  s_10,
  s_10,
  s_4,
  s_13,
  s_26,
  s_18,
  s_32,
  s_5,
  s_10,
  s_9,
  s_39,
  s_18,
  s_9,
  s_1,
  s_17_18,
  s_5,
  s_5,
  s_18,
  s_9,
  s_4,
  s_18,
  s_5,
  s_5,
  s_11_32_36,
  s_2,
  s_7,
  s_1_0,
  s_32,
  s_11_32,
  s_6_35_41,
  s_0,
  s_18,
  s_18,
  s_10,
  s_15,
  s_28,
  s_10_18,
  s_10_32,
  s_27,
  s_1,
  s_13,
  s_13,
  s_5_6,
  s_15,
  s_20,
  s_32,
  s_13,
  s_20,
  s_0,
  s_0,
  s_2,
  s_7_9,
  s_10,
  s_20,
  s_13_20,
  s_37,
  s_37,
  s_10,
  s_0,
  s_5,
  s_5_26,
  s_5,
  s_1,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_6_20,
  s_26,
  s_6,
  s_6,
  s_6,
  s_20,
  s_20,
  s_27,
  s_6,
  s_5,
  s_20,
  s_6,
  s_27,
  s_29_30,
  s_4_22,
  s_27,
  s_23,
  s_20,
  s_27,
  s_27,
  s_27,
  s_27,
  s_5,
  s_5,
  s_27,
  s_6_29,
  s_5,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_1,
  s_5,
  s_5,
  s_27,
  s_20,
  s_27,
  s_6,
  s_26,
  s_6,
  s_1,
  s_20,
  s_6,
  s_27,
  s_6,
  s_6,
  s_5,
  s_5,
  s_13,
  s_6_35_2,
  s_0,
  s_0,
  s_7_13,
  s_10_18,
  s_5,
  s_4_9_0,
  s_7,
  s_6_14_36,
  s_18,
  s_18,
  s_6_29_30_35_41,
  s_20,
  s_0,
  s_27,
  s_4_7,
  s_15_25,
  s_6_18,
  s_6,
  s_4_26,
  s_6_0,
  s_4,
  s_26,
  s_27,
  s_4,
  s_26,
  s_8,
  s_26,
  s_4,
  s_8_12,
  s_26,
  s_1,
  s_0,
  s_26,
  s_27,
  s_27,
  s_27,
  s_0,
  s_27,
  s_20,
  s_5,
  s_4_34,
  s_4,
  s_18,
  s_23,
  s_5,
  s_5,
  s_30,
  s_27,
  s_8,
  s_17,
  s_0,
  s_26,
  s_26,
  s_26,
  s_17,
  s_5,
  s_15,
  s_31,
  s_18,
  s_0,
  s_0,
  s_4_8_13_19_33_35_36_38,
  s_0,
  s_6,
  s_10_18,
  s_6,
  s_0,
  s_4_6_8,
  s_26,
  s_0,
  s_13,
  s_6,
  s_1,
  s_18,
  s_10_1,
  s_10,
  s_2,
  s_10_25_30_36,
  s_1,
  s_5,
  s_5,
  s_5_1,
  s_5,
  s_26,
  s_5,
  s_6,
  s_20,
  s_4,
  s_26,
  s_31_36,
  s_18,
  s_1,
  s_4_10,
  s_1,
  s_18,
  s_5,
  s_26,
  s_5,
  s_1,
  s_26,
  s_5,
  s_18,
  s_5,
  s_20,
  s_13,
  s_8,
  s_10_29,
  s_10_11_14_32_36,
  s_14_15_18,
  s_13_14,
  s_5,
  s_33,
  s_5_13_14,
  s_13,
  s_13,
  s_10,
  s_6,
  s_6,
  s_18,
  s_15,
  s_20,
  s_32,
  s_14,
  s_4,
  s_18_0_1,
  s_15,
  s_11,
  s_30,
  s_9_14,
  s_11,
  s_30,
  s_0,
  s_18,
  s_0,
  s_0,
  s_0,
  s_28,
  s_20,
  s_28,
  s_28,
  s_1,
  s_9,
  s_18,
  s_7,
  s_9,
  s_27,
  s_0_1,
  s_2,
  s_7,
  s_8,
  s_8,
  s_1,
  s_7_26,
  s_6,
  s_1,
  s_1,
  s_2,
  s_22,
  s_27_30_35,
  s_9,
  s_27,
  s_27,
  s_26,
  s_27,
  s_10,
  s_27,
  s_20,
  s_1,
  s_8,
  s_17,
  s_0,
  s_2,
  s_10_32,
  s_18,
  s_6,
  s_1,
  s_2,
  s_30,
  s_30,
  s_9_10_24,
  s_6,
  s_5,
  s_6,
  s_5,
  s_20,
  s_5,
  s_6,
  s_5,
  s_20,
  s_27,
  s_5,
  s_5,
  s_20,
  s_27,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_27,
  s_20,
  s_20,
  s_20,
  s_4,
  s_27,
  s_0,
  s_0,
  s_5,
  s_7,
  s_0,
  s_6_13_29_35_40,
  s_17,
  s_10_29,
  s_5,
  s_6,
  s_20,
  s_29,
  s_0,
  s_11_39,
  s_10_18,
  s_6_28,
  s_28,
  s_5_6_18,
  s_7,
  s_0,
  s_18,
  s_5,
  s_15,
  s_14_23_31_35,
  s_9,
  s_0,
  s_6,
  s_4_6_14_38,
  s_18,
  s_0,
  s_15_18,
  s_1,
  s_0,
  s_18,
  s_18,
  s_15,
  s_6,
  s_18,
  s_0,
  s_2,
  s_6_35_38,
  s_0,
  s_32,
  s_0,
  s_0,
  s_6_38,
  s_13,
  s_7,
  s_7,
  s_18,
  s_10_18,
  s_1,
  s_8,
  s_1,
  s_1,
  s_1,
  s_1,
  s_26,
  s_27,
  s_1,
  s_27,
  s_27,
  s_20,
  s_20,
  s_20,
  s_14,
  s_6,
  s_10,
  s_18,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_35,
  s_26,
  s_35,
  s_20,
  s_18_23,
  s_18,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_14,
  s_13,
  s_6,
  s_6,
  s_6,
  s_6,
  s_5,
  s_6,
  s_13_20,
  s_1,
  s_1,
  s_5,
  s_5_1_0,
  s_0,
  s_5,
  s_5,
  s_5,
  s_5_8,
  s_14,
  s_18,
  s_5_17,
  s_6,
  s_5,
  s_5,
  s_20,
  s_0,
  s_4_6_31_35,
  s_20,
  s_27,
  s_15,
  s_18,
  s_5,
  s_5,
  s_6,
  s_17,
  s_18,
  s_6_10,
  s_1,
  s_36,
  s_36,
  s_18,
  s_4,
  s_20,
  s_6,
  s_1,
  s_8,
  s_5_27_0,
  s_27,
  s_20,
  s_13_20,
  s_23,
  s_6_20,
  s_14,
  s_10_18_23_31_32,
  s_6,
  s_6,
  s_14,
  s_1,
  s_20,
  s_5,
  s_10_14_18,
  s_18,
  s_0,
  s_17,
  s_4_6_14_25_35_38,
  s_6_25,
  s_4_6_14_15_38,
  s_0,
  s_6,
  s_10_0,
  s_4,
  s_32_38_41,
  s_7,
  s_4,
  s_30_32_38_41,
  s_2,
  s_32_38,
  s_0,
  s_4_10_11_19_23,
  s_1,
  s_1,
  s_38,
  s_0,
  s_35,
  s_4_28,
  s_4,
  s_7_15,
  s_0,
  s_0,
  s_10,
  s_38,
  s_10,
  s_0,
  s_0,
  s_38,
  s_4,
  s_0,
  s_30_35,
  s_0,
  s_4,
  s_0,
  s_7_9,
  s_2,
  s_9_11_26,
  s_21_26,
  s_0,
  s_2,
  s_32,
  s_33,
  s_32_33,
  s_4,
  s_42,
  s_4,
  s_38,
  s_4_5_6_14,
  s_20,
  s_17,
  s_26,
  s_20,
  s_5,
  s_5,
  s_5,
  s_17,
  s_17,
  s_5_17_20,
  s_20,
  s_14,
  s_0,
  s_7_14,
  s_5_13,
  s_1,
  s_0,
  s_0,
  s_20,
  s_18,
  s_6_8,
  s_8,
  s_5,
  s_8,
  s_20,
  s_6,
  s_5_10,
  s_10_32_36,
  s_5,
  s_5,
  s_6,
  s_6,
  s_0,
  s_30,
  s_18,
  s_14,
  s_7_26,
  s_15,
  s_6,
  s_13_20,
  s_27_30,
  s_1,
  s_27,
  s_27,
  s_13_20,
  s_20,
  s_20,
  s_1,
  s_27,
  s_20,
  s_13_20,
  s_6,
  s_14_15,
  s_0,
  s_6_9,
  s_0,
  s_20,
  s_5,
  s_1,
  s_9,
  s_6,
  s_0_1,
  s_18_0,
  s_7_14_22,
  s_30_41,
  s_0,
  s_4_7,
  s_7_14_22,
  s_30_41,
  s_0,
  s_2,
  s_6,
  s_26,
  s_13_30,
  s_6_11_32_39,
  s_0,
  s_6,
  s_14,
  s_9,
  s_20,
  s_25,
  s_20,
  s_20,
  s_20,
  s_5,
  s_20,
  s_6,
  s_4_7_10_32_40,
  s_18,
  s_10,
  s_18_0,
  s_5_13_21_35,
  s_0,
  s_5,
  s_1,
  s_13,
  s_4_38,
  s_2,
  s_26,
  s_0,
  s_20,
  s_10_11_32_41,
  s_10,
  s_0,
  s_2,
  s_10_32,
  s_10,
  s_6_32_35,
  s_4,
  s_21,
  s_5_6,
  s_14,
  s_0,
  s_11_39,
  s_4,
  s_0,
  s_11_39,
  s_11,
  s_0,
  s_11_39,
  s_5,
  s_11_39,
  s_0,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_11_26_29_32_35_38,
  s_27_35,
  s_6_8_18,
  s_6,
  s_32_35,
  s_6,
  s_10,
  s_10,
  s_14,
  s_6,
  s_7_13_34,
  s_4_10,
  s_30_32,
  s_0,
  s_6,
  s_18,
  s_18,
  s_6_32_36_0,
  s_7,
  s_18,
  s_15,
  s_6,
  s_20,
  s_4_11_26_32_35_42,
  s_0,
  s_4_6_35,
  s_4_7_14_31,
  s_6_18_0,
  s_10_0_1,
  s_9,
  s_2,
  s_30,
  s_9,
  s_18,
  s_1,
  s_30,
  s_9,
  s_0,
  s_4_9_14,
  s_1,
  s_10_0,
  s_10_18,
  s_31_41,
  s_0,
  s_18,
  s_6,
  s_4,
  s_0,
  s_17,
  s_0,
  s_20,
  s_0,
  s_20,
  s_11_39,
  s_0,
  s_26,
  s_18,
  s_1,
  s_10,
  s_18,
  s_18,
  s_26,
  s_0,
  s_8,
  s_20,
  s_32,
  s_20,
  s_6,
  s_20,
  s_8,
  s_6,
  s_26,
  s_5_6_32_35_38,
  s_4,
  s_0,
  s_26,
  s_6,
  s_0,
  s_6_32_39,
  s_8_18_27,
  s_0,
  s_6,
  s_27,
  s_20,
  s_6,
  s_4_29_30_35_42_0_2,
  s_0,
  s_6_18,
  s_6,
  s_4,
  s_7_26,
  s_2_0,
  s_26,
  s_29_30,
  s_6,
  s_4_0,
  s_18,
  s_4_10_21,
  s_15_26_30_31_32_38_39_40_41_43_0_2,
  s_4_7_23,
  s_7,
  s_0,
  s_0,
  s_4_15,
  s_2,
  s_7,
  s_6,
  s_6,
  s_20,
  s_6_35_40,
  s_6,
  s_0,
  s_4_8_22_26,
  s_35,
  s_6,
  s_20,
  s_10,
  s_17_25_0,
  s_5,
  s_5,
  s_20,
  s_20,
  s_1,
  s_1,
  s_11,
  s_20,
  s_20,
  s_18,
  s_4_26,
  s_18,
  s_0,
  s_13_20,
  s_4_6_35,
  s_0,
  s_20,
  s_18,
  s_6,
  s_6,
  s_14,
  s_18,
  s_18,
  s_1_0,
  s_10,
  s_18,
  s_5,
  s_5,
  s_10,
  s_14,
  s_18_41,
  s_4,
  s_4,
  s_20,
  s_20,
  s_5,
  s_15_18,
  s_0,
  s_2,
  s_7_9,
  s_6,
  s_10_14_35,
  s_6,
  s_10,
  s_20,
  s_10,
  s_0,
  s_15,
  s_4_6_10_11_31_32_35_38_39,
  s_6_18,
  s_24,
  s_14,
  s_17,
  s_10_11,
  s_20,
  s_28,
  s_0,
  s_26,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_4_10_11_26_30,
  s_4_11_17_30_38,
  s_0,
  s_6_18_20,
  s_11,
  s_26,
  s_4_6_32_35,
  s_0,
  s_6_9_10,
  s_18,
  s_13_35_37,
  s_6,
  s_5,
  s_13,
  s_6_10_14,
  s_1_0,
  s_2,
  s_18,
  s_5,
  s_5,
  s_6_11_39,
  s_6_17_30,
  s_0,
  s_26,
  s_26,
  s_26,
  s_6,
  s_20,
  s_6,
  s_0,
  s_15_18,
  s_20,
  s_18,
  s_6,
  s_4_6_11_30_35_38,
  s_6,
  s_0,
  s_6,
  s_4_10,
  s_14,
  s_0,
  s_2,
  s_7,
  s_8,
  s_20,
  s_1,
  s_20,
  s_1,
  s_4,
  s_8,
  s_39,
  s_18,
  s_20,
  s_6_8,
  s_6_35_39,
  s_0,
  s_18,
  s_6,
  s_21_35,
  s_18,
  s_6,
  s_6_30,
  s_28,
  s_18,
  s_20,
  s_18,
  s_0_2,
  s_6,
  s_14_18,
  s_0,
  s_6,
  s_6,
  s_4_6_30_35_36,
  s_0,
  s_0,
  s_0,
  s_6_0,
  s_6_30_35_42,
  s_0,
  s_0,
  s_6,
  s_6,
  s_6,
  s_38,
  s_14,
  s_1,
  s_6_14_18_36,
  s_1,
  s_6,
  s_4,
  s_26,
  s_11_39,
  s_11,
  s_27,
  s_4_10_28_30_32_35_38_39_41_42_0_2,
  s_0,
  s_4,
  s_0,
  s_0,
  s_2,
  s_0,
  s_7_12,
  s_4,
  s_18_2,
  s_2,
  s_6_35,
  s_6,
  s_4_10_0,
  s_5,
  s_5,
  s_4_6_9_10_30,
  s_8_30,
  s_20,
  s_6,
  s_29_35_41,
  s_0,
  s_6,
  s_6,
  s_6_18,
  s_0,
  s_6,
  s_6,
  s_6,
  s_18,
  s_6,
  s_18,
  s_0,
  s_22,
  s_10_30,
  s_14_17_19_26_30_35_37_38_39_43,
  s_20,
  s_19,
  s_0,
  s_7_26,
  s_22,
  s_0,
  s_7,
  s_0,
  s_0,
  s_4_6_7_10_35,
  s_13_20,
  s_0,
  s_20,
  s_6,
  s_20,
  s_18,
  s_14,
  s_18_29,
  s_4_10,
  s_0,
  s_0,
  s_34_40,
  s_0,
  s_2,
  s_6,
  s_6,
  s_1,
  s_6_14_35_41,
  s_0,
  s_0,
  s_26,
  s_0,
  s_0,
  s_26,
  s_0,
  s_6,
  s_6,
  s_6,
  s_11_32,
  s_11,
  s_10_35,
  s_0,
  s_5,
  s_11_14_35_38_39,
  s_11,
  s_2,
  s_7_9,
  s_0,
  s_27,
  s_11_39,
  s_11,
  s_0,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_14_35_38,
  s_0,
  s_14,
  s_4_6_14_26_31_35,
  s_4,
  s_10_26_30,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_17,
  s_5,
  s_5,
  s_4,
  s_18,
  s_19,
  s_19,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_20,
  s_5,
  s_15,
  s_15,
  s_14,
  s_8,
  s_18,
  s_6_18_32_38,
  s_18,
  s_4,
  s_18,
  s_5_20,
  s_41,
  s_4,
  s_18,
  s_0,
  s_27,
  s_27,
  s_30_0,
  s_0,
  s_22,
  s_27,
  s_8,
  s_15,
  s_17_27_35_40_43,
  s_6,
  s_30_35,
  s_0,
  s_4,
  s_4,
  s_0,
  s_0,
  s_15,
  s_15,
  s_6,
  s_4_14_26,
  s_18,
  s_6,
  s_6,
  s_35,
  s_0,
  s_7_11,
  s_0,
  s_2,
  s_30_35,
  s_0,
  s_7_10,
  s_4_9_17_38,
  s_0_1,
  s_6_18,
  s_14,
  s_18,
  s_17,
  s_15,
  s_2,
  s_2_0,
  s_5_6_29_35,
  s_6,
  s_0,
  s_6,
  s_5,
  s_4_6_7,
  s_6,
  s_6,
  s_6,
  s_18,
  s_6_32,
  s_0,
  s_18,
  s_0,
  s_10_0,
  s_2,
  s_5_13,
  s_27,
  s_27,
  s_27,
  s_18,
  s_6_30_35,
  s_13_18,
  s_8_10,
  s_6_35,
  s_4,
  s_5,
  s_5,
  s_13_20,
  s_10,
  s_5,
  s_6,
  s_0,
  s_6_18_20,
  s_6,
  s_6,
  s_29,
  s_29,
  s_27,
  s_1,
  s_5,
  s_5,
  s_5,
  s_26,
  s_26,
  s_26,
  s_5,
  s_5,
  s_5,
  s_0,
  s_5,
  s_5,
  s_20,
  s_5,
  s_1,
  s_8,
  s_5,
  s_10_18,
  s_5,
  s_5_27,
  s_18,
  s_8,
  s_1,
  s_20,
  s_5,
  s_18,
  s_5_6_8_35_38,
  s_6,
  s_9,
  s_0,
  s_0,
  s_5,
  s_5,
  s_5,
  s_18,
  s_5,
  s_18,
  s_28,
  s_5_41,
  s_5,
  s_0,
  s_11,
  s_4,
  s_6,
  s_7,
  s_5_13_35_38,
  s_20,
  s_20,
  s_6,
  s_6,
  s_10_18_1,
  s_6,
  s_5,
  s_5_6_18_20,
  s_20,
  s_20,
  s_18,
  s_0,
  s_9,
  s_13,
  s_4,
  s_0,
  s_20,
  s_13,
  s_13,
  s_20,
  s_18,
  s_31,
  s_13_20,
  s_5_35_38,
  s_4,
  s_10_18,
  s_10_18,
  s_20,
  s_20,
  s_6_18,
  s_13_20,
  s_13_20,
  s_18,
  s_18,
  s_20,
  s_17,
  s_5_13_20_32_2_0,
  s_10,
  s_20,
  s_30_41,
  s_18,
  s_10_32_35,
  s_18,
  s_6,
  s_18,
  s_18,
  s_10,
  s_5_13,
  s_18,
  s_20,
  s_10,
  s_4_10,
  s_0,
  s_30,
  s_4,
  s_5,
  s_27,
  s_6,
  s_10,
  s_18,
  s_41,
  s_4,
  s_0,
  s_23,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_20,
  s_20,
  s_8,
  s_5,
  s_6,
  s_18,
  s_1,
  s_1,
  s_27,
  s_0,
  s_41,
  s_4,
  s_0,
  s_5,
  s_5,
  s_0,
  s_18_0,
  s_14,
  s_42,
  s_26,
  s_0,
  s_0,
  s_7,
  s_0,
  s_27,
  s_20,
  s_7_13_20,
  s_20,
  s_13,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_35,
  s_18,
  s_6_18_35,
  s_7_24,
  s_0,
  s_0,
  s_38,
  s_0,
  s_31,
  s_9,
  s_1_0,
  s_13,
  s_10_18_0,
  s_24,
  s_0,
  s_9,
  s_0,
  s_31,
  s_3,
  s_1,
  s_2,
  s_0,
  s_9,
  s_0,
  s_31,
  s_10,
  s_18,
  s_0,
  s_6,
  s_42,
  s_4,
  s_18,
  s_35_42,
  s_7_26,
  s_7_26,
  s_0,
  s_2,
  s_19_22_26,
  s_0,
  s_7_26,
  s_18,
  s_5_13,
  s_5_13,
  s_14,
  s_20,
  s_20,
  s_6_8_29_35,
  s_29,
  s_18,
  s_18,
  s_8_29,
  s_6,
  s_6,
  s_20,
  s_6_25_35_36_38,
  s_0,
  s_0,
  s_21_36,
  s_4_10_21,
  s_30_42,
  s_7_11,
  s_0,
  s_0,
  s_2,
  s_2,
  s_0,
  s_18,
  s_21,
  s_40,
  s_20,
  s_1,
  s_4,
  s_4,
  s_6_13_27_30,
  s_17,
  s_13_20,
  s_6,
  s_5,
  s_13,
  s_20,
  s_6,
  s_20,
  s_15,
  s_7_9_26_0,
  s_35,
  s_6,
  s_0,
  s_12,
  s_2,
  s_7_9,
  s_36,
  s_13_20,
  s_5,
  s_5,
  s_18,
  s_1,
  s_1,
  s_13,
  s_18,
  s_20,
  s_20,
  s_26,
  s_0,
  s_20,
  s_15,
  s_5,
  s_5,
  s_6,
  s_26,
  s_41,
  s_4,
  s_4,
  s_18,
  s_0,
  s_18,
  s_6_14,
  s_8,
  s_27,
  s_1,
  s_1,
  s_0,
  s_4_11_26_29_30_37_38,
  s_0,
  s_4_6_7_35,
  s_8,
  s_20,
  s_13,
  s_1,
  s_31_35,
  s_21_0,
  s_32,
  s_4_13,
  s_18,
  s_10_35_40_2_0,
  s_6_0,
  s_44_0,
  s_2,
  s_6_0,
  s_4,
  s_4_10_14,
  s_14_0,
  s_2,
  s_4,
  s_41,
  s_0,
  s_9_14,
  s_18_0,
  s_0,
  s_4,
  s_41,
  s_0,
  s_6_17_18,
  s_18,
  s_6_14,
  s_1,
  s_18,
  s_1,
  s_5,
  s_5,
  s_6,
  s_35_42,
  s_6,
  s_5,
  s_18,
  s_6,
  s_31,
  s_9_26,
  s_30,
  s_4,
  s_6,
  s_0,
  s_13_18,
  s_20,
  s_20,
  s_10_11,
  s_5,
  s_31_42,
  s_4_10,
  s_27,
  s_32,
  s_27,
  s_1,
  s_2,
  s_0,
  s_10,
  s_2,
  s_10_14,
  s_10,
  s_10,
  s_31,
  s_9_10,
  s_0,
  s_35,
  s_6,
  s_26,
  s_5,
  s_20,
  s_6_15,
  s_15,
  s_18_1,
  s_15,
  s_8_10_15_23,
  s_18,
  s_18_1_0,
  s_4,
  s_18,
  s_4_1,
  s_4,
  s_30_41,
  s_0,
  s_18,
  s_18,
  s_4,
  s_30_41,
  s_0,
  s_18,
  s_6,
  s_0,
  s_6,
  s_4,
  s_14_15,
  s_6,
  s_27,
  s_7_9_27_30_32_36_41_0,
  s_18,
  s_20,
  s_15_17,
  s_4_7,
  s_4_18,
  s_10_32,
  s_1,
  s_0,
  s_0,
  s_0,
  s_6,
  s_1,
  s_1,
  s_4,
  s_4_7_13,
  s_30,
  s_18,
  s_30,
  s_0,
  s_7,
  s_6,
  s_15,
  s_0,
  s_6,
  s_18,
  s_10,
  s_18,
  s_4,
  s_8,
  s_7_9_27_30_32_36_41_0,
  s_4_7,
  s_10,
  s_0,
  s_0,
  s_4_7_13,
  s_30,
  s_30,
  s_0,
  s_7,
  s_6,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_5_6,
  s_27,
  s_6,
  s_0,
  s_20,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5_17,
  s_6,
  s_6,
  s_6_15_17,
  s_1,
  s_5,
  s_5,
  s_20,
  s_27,
  s_27,
  s_20,
  s_15_18,
  s_25,
  s_6_8_10_14_25,
  s_0,
  s_20,
  s_0,
  s_7,
  s_0,
  s_18,
  s_0,
  s_20,
  s_5,
  s_20,
  s_9_17_20,
  s_0,
  s_10_18,
  s_20,
  s_0,
  s_1_0,
  s_9,
  s_5,
  s_5,
  s_5,
  s_4_5_6_29_35,
  s_4_33,
  s_18_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_6_11_18,
  s_0,
  s_4_14,
  s_0,
  s_0,
  s_0,
  s_0,
  s_6_11_14_30_35_40_41_42,
  s_0,
  s_4,
  s_4_11,
  s_14,
  s_20,
  s_20,
  s_0,
  s_0,
  s_30_37_43,
  s_7,
  s_27_0,
  s_7,
  s_4_22_26,
  s_0,
  s_8_30_31_38_39_42,
  s_4_10,
  s_18,
  s_18,
  s_8,
  s_4,
  s_10,
  s_7,
  s_0,
  s_18,
  s_18,
  s_13_0,
  s_17,
  s_1,
  s_1,
  s_11,
  s_11,
  s_13_36,
  s_4_6_12_26_29_37,
  s_0,
  s_12_26,
  s_2,
  s_0,
  s_6_18,
  s_0,
  s_2,
  s_0,
  s_21,
  s_13_20,
  s_0,
  s_18_1_0,
  s_0,
  s_7,
  s_2,
  s_4_7_0,
  s_4,
  s_26,
  s_5_10,
  s_7_9_10_14_26_32_41_42,
  s_18,
  s_35,
  s_18,
  s_4,
  s_4,
  s_0,
  s_9_10,
  s_14_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_31,
  s_1,
  s_10_11,
  s_17_1,
  s_30_36,
  s_4_11_28,
  s_32_36,
  s_2_0,
  s_10,
  s_5_1,
  s_24,
  s_2,
  s_0,
  s_0,
  s_24,
  s_10_32,
  s_10,
  s_32,
  s_18,
  s_4_10_14,
  s_10_0_1,
  s_4,
  s_30,
  s_0,
  s_4,
  s_4,
  s_30_34,
  s_0,
  s_2,
  s_18,
  s_32,
  s_10,
  s_0,
  s_30_35,
  s_30,
  s_20,
  s_37,
  s_10_12,
  s_0,
  s_18,
  s_13,
  s_6,
  s_4_10_14_21_26_41,
  s_18,
  s_0,
  s_18,
  s_4,
  s_8,
  s_32_40_41,
  s_4_7_10,
  s_4,
  s_0,
  s_7,
  s_14,
  s_18,
  s_18,
  s_35,
  s_4,
  s_6,
  s_0,
  s_7,
  s_6,
  s_18,
  s_15_0,
  s_21,
  s_7_14,
  s_14,
  s_18,
  s_2,
  s_7_26,
  s_10_0,
  s_7,
  s_14_15,
  s_0,
  s_0,
  s_0,
  s_7,
  s_14_15,
  s_4_11_26,
  s_35_37,
  s_1_0,
  s_40,
  s_4,
  s_40,
  s_2,
  s_14_15_32,
  s_0,
  s_18,
  s_32_35_40,
  s_10,
  s_3_10_24,
  s_0,
  s_9,
  s_0_1,
  s_7,
  s_18,
  s_0,
  s_4_10_14,
  s_10,
  s_4,
  s_30,
  s_9_14,
  s_18_1,
  s_1,
  s_14_15_21_26,
  s_4,
  s_30,
  s_7,
  s_0,
  s_30,
  s_4_10,
  s_0,
  s_6,
  s_4_30_38,
  s_6_18,
  s_4,
  s_15,
  s_0,
  s_10,
  s_6_10_35_0,
  s_4_11,
  s_2,
  s_7,
  s_18_42,
  s_7,
  s_0,
  s_7,
  s_0,
  s_26,
  s_6,
  s_14_18_26_42,
  s_7,
  s_0,
  s_2,
  s_10_0_1,
  s_2,
  s_7_31_32_42,
  s_4,
  s_4_7_24,
  s_35,
  s_6,
  s_0,
  s_4_26,
  s_30,
  s_0,
  s_4_26,
  s_30,
  s_0,
  s_0,
  s_6_7_9_31_38_41,
  s_7_12,
  s_37_0,
  s_2,
  s_12,
  s_7_12,
  s_0,
  s_2,
  s_18,
  s_18,
  s_41_42,
  s_0,
  s_0,
  s_10,
  s_0,
  s_40_41_42,
  s_0,
  s_4_21_22,
  s_18_41,
  s_33,
  s_7,
  s_7,
  s_0,
  s_2,
  s_4_11_18_24,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_4_10,
  s_36_40,
  s_10_18,
  s_4,
  s_12,
  s_12,
  s_0,
  s_2,
  s_32,
  s_18,
  s_18,
  s_0,
  s_2,
  s_10_26,
  s_0,
  s_7,
  s_0,
  s_42,
  s_7_9_10_14_23_27_30,
  s_0,
  s_24,
  s_7_0,
  s_7_24,
  s_30_32_33_41_0,
  s_0,
  s_2,
  s_7_26,
  s_0,
  s_4,
  s_6_9_12_27_0,
  s_18,
  s_30,
  s_7_9_14_30,
  s_7,
  s_2,
  s_7,
  s_4_7,
  s_7,
  s_0,
  s_30,
  s_0,
  s_7,
  s_4_7_11_26,
  s_26,
  s_10_32,
  s_0,
  s_10,
  s_28,
  s_28,
  s_31,
  s_41,
  s_6_9_24,
  s_41,
  s_7,
  s_31_36_37_42,
  s_0,
  s_2,
  s_18,
  s_4_7,
  s_20,
  s_9_20_1_0,
  s_7,
  s_4_6_7_10_27,
  s_0,
  s_18,
  s_27_30,
  s_7,
  s_13,
  s_6_9_27_30_35_36_40_0,
  s_0,
  s_4,
  s_31_39_42,
  s_0,
  s_0,
  s_7,
  s_0,
  s_9_24,
  s_10_0,
  s_2,
  s_9_26,
  s_6_35,
  s_0,
  s_7,
  s_0,
  s_4,
  s_4_11,
  s_6,
  s_42,
  s_4_10_32,
  s_18,
  s_0,
  s_5,
  s_18,
  s_20,
  s_18,
  s_4,
  s_4_16,
  s_18_0,
  s_2,
  s_7,
  s_7,
  s_2,
  s_0,
  s_12,
  s_0,
  s_4_9,
  s_1,
  s_2,
  s_31,
  s_6_18,
  s_36_40,
  s_4,
  s_36_40,
  s_4_9,
  s_18,
  s_7,
  s_0,
  s_7,
  s_7,
  s_18,
  s_4,
  s_18,
  s_9,
  s_4_10_18_31_41_2,
  s_20,
  s_15,
  s_30_35,
  s_4_14_24_26,
  s_0,
  s_2,
  s_7,
  s_7_25,
  s_39,
  s_0,
  s_4_0,
  s_4_6_26,
  s_32_33_40,
  s_10,
  s_7_10_12,
  s_0,
  s_2,
  s_7,
  s_26,
  s_0,
  s_26,
  s_2,
  s_29_31_36,
  s_18,
  s_31,
  s_9_13_27_30_31_38,
  s_0,
  s_4_7_9_11,
  s_31,
  s_0,
  s_0,
  s_7,
  s_15,
  s_9,
  s_4_9_11,
  s_0,
  s_0,
  s_0,
  s_4_9,
  s_36,
  s_9,
  s_1,
  s_9,
  s_4_9,
  s_36,
  s_2,
  s_5,
  s_9_12_14_42,
  s_0,
  s_2,
  s_10_32_36,
  s_0,
  s_6_38,
  s_18,
  s_36,
  s_36,
  s_10,
  s_10,
  s_18,
  s_18,
  s_1,
  s_5,
  s_8,
  s_5,
  s_18,
  s_4,
  s_18,
  s_0,
  s_30_32_37,
  s_4_10_26,
  s_0,
  s_18,
  s_0,
  s_0,
  s_2,
  s_10,
  s_10,
  s_14,
  s_31_32_42,
  s_0,
  s_0,
  s_4_9_10_11_28,
  s_0,
  s_2,
  s_7,
  s_35_36,
  s_4_9_11_13,
  s_7,
  s_11_0,
  s_4_10_15_24_26_32_35_36_42,
  s_10_26,
  s_0,
  s_10,
  s_4_6_14,
  s_27_30_35_0,
  s_2,
  s_7,
  s_4_11_17_22,
  s_30,
  s_9,
  s_1,
  s_30_31,
  s_4,
  s_18,
  s_12,
  s_0,
  s_30_32,
  s_4_7_10_26,
  s_4_10,
  s_0,
  s_2,
  s_0,
  s_29_38,
  s_11,
  s_32_39_40_41,
  s_0,
  s_4_10_26,
  s_0,
  s_0,
  s_19_27,
  s_4_9_10_11_19_22,
  s_30,
  s_6,
  s_4,
  s_32_41,
  s_0,
  s_2,
  s_7,
  s_7_10,
  s_0,
  s_13,
  s_9_10_26_29_30_32_41,
  s_0,
  s_26,
  s_2,
  s_0,
  s_4_6_18,
  s_9,
  s_19_26,
  s_6,
  s_37,
  s_10,
  s_0,
  s_6,
  s_6,
  s_4,
  s_32,
  s_5,
  s_18,
  s_41,
  s_0,
  s_4_7_36_38_41,
  s_19,
  s_4,
  s_19,
  s_0,
  s_19,
  s_6_18_27,
  s_18,
  s_6,
  s_1,
  s_8,
  s_8,
  s_5,
  s_6_8_20_25_35,
  s_20,
  s_1,
  s_5,
  s_5,
  s_20,
  s_6,
  s_5,
  s_10_32,
  s_32_36,
  s_9_10,
  s_13_36,
  s_4_13_36,
  s_6,
  s_18,
  s_4_6_13,
  s_10_14_15,
  s_18_41_0,
  s_4_14_26,
  s_0,
  s_32_40,
  s_18,
  s_10_14,
  s_4,
  s_4,
  s_18,
  s_5,
  s_32,
  s_2,
  s_4_10,
  s_6,
  s_18,
  s_6,
  s_18,
  s_18,
  s_32_40,
  s_9_10_12_26,
  s_0,
  s_0,
  s_9_26,
  s_2,
  s_2,
  s_0,
  s_2,
  s_7_9,
  s_1,
  s_9,
  s_36,
  s_0,
  s_30_35_41_42,
  s_0,
  s_4_26,
  s_7,
  s_0,
  s_30_31_32_41,
  s_0,
  s_4_9_10,
  s_0,
  s_0,
  s_0,
  s_0,
  s_40_0,
  s_4,
  s_13,
  s_13,
  s_43,
  s_11,
  s_30,
  s_4_7_10_12_24_26_41_42,
  s_0,
  s_4_15,
  s_17_0,
  s_4,
  s_30_42,
  s_0,
  s_2,
  s_7,
  s_4_7_25,
  s_0,
  s_9,
  s_18_0,
  s_4_7_9_10,
  s_31,
  s_0,
  s_2,
  s_0,
  s_18,
  s_32_33_42,
  s_4_10,
  s_1,
  s_18_1,
  s_9,
  s_18,
  s_18,
  s_0,
  s_31_36_37,
  s_0,
  s_2,
  s_9,
  s_0,
  s_2,
  s_4_9_12_26,
  s_0,
  s_9_10,
  s_0,
  s_31,
  s_18,
  s_4_10_38,
  s_4_6_32,
  s_30,
  s_0,
  s_22,
  s_4_6_13_32_38,
  s_22,
  s_5,
  s_3_5_27,
  s_5_1,
  s_1,
  s_1,
  s_0,
  s_7,
  s_2,
  s_7,
  s_0,
  s_5,
  s_14,
  s_35,
  s_0,
  s_26,
  s_1,
  s_23,
  s_30,
  s_11_25,
  s_30,
  s_14_27_30_0,
  s_11_14_25,
  s_35,
  s_4_22,
  s_13_15_17,
  s_18_1,
  s_13,
  s_32_37,
  s_10,
  s_10,
  s_0,
  s_18,
  s_38,
  s_4,
  s_4_14,
  s_1,
  s_9,
  s_18_1,
  s_4_14,
  s_1,
  s_18,
  s_18,
  s_18,
  s_5,
  s_7,
  s_0,
  s_7,
  s_0,
  s_7,
  s_25_1,
  s_1,
  s_2,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_0,
  s_5,
  s_27,
  s_20,
  s_20,
  s_0,
  s_2,
  s_9_10_31,
  s_35_41,
  s_0,
  s_0,
  s_2,
  s_1,
  s_2,
  s_27_30_32_0,
  s_0,
  s_4_14_24_26,
  s_0,
  s_6_7_10_11_24_26,
  s_8,
  s_1,
  s_10_0,
  s_26,
  s_11,
  s_4_9_10,
  s_31_32_36,
  s_18,
  s_9,
  s_18,
  s_9,
  s_8_29_30_35_38,
  s_20,
  s_38,
  s_20,
  s_20,
  s_0,
  s_0,
  s_31_32_35_41_42,
  s_0,
  s_24_26,
  s_6,
  s_15_17,
  s_18,
  s_4_6_9_18_24_25_26,
  s_6_10_0,
  s_7,
  s_6,
  s_4_6_9_24_25,
  s_26,
  s_10,
  s_31_41,
  s_0,
  s_5,
  s_18,
  s_9,
  s_18,
  s_18,
  s_9_10,
  s_0,
  s_0,
  s_32,
  s_1_2,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_25,
  s_20,
  s_20,
  s_18,
  s_30_33_40,
  s_0,
  s_4,
  s_18,
  s_4,
  s_18,
  s_18,
  s_20,
  s_0,
  s_0,
  s_0,
  s_24,
  s_7_12_16,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_2,
  s_9,
  s_18_33,
  s_4,
  s_32_41_0,
  s_0,
  s_4,
  s_2_0,
  s_2,
  s_0,
  s_26,
  s_10_32,
  s_0,
  s_0,
  s_0,
  s_7_11_19,
  s_0,
  s_0,
  s_2,
  s_2,
  s_4_14,
  s_4_9_11,
  s_18,
  s_9,
  s_18_0,
  s_2,
  s_9,
  s_18,
  s_6,
  s_18,
  s_6_14,
  s_13_30_40_42,
  s_0,
  s_13,
  s_31_32_39,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_4_7_9_10_21,
  s_0,
  s_40,
  s_18,
  s_18,
  s_4_6,
  s_18,
  s_42,
  s_7,
  s_7_26,
  s_0,
  s_2,
  s_14,
  s_41,
  s_0,
  s_4_12,
  s_0,
  s_6_37,
  s_20,
  s_30,
  s_0,
  s_4_11_17,
  s_0,
  s_0,
  s_2,
  s_13,
  s_7_10,
  s_10_0,
  s_0_1,
  s_39,
  s_14_18_38_41_42,
  s_14,
  s_5_1,
  s_10,
  s_0,
  s_2,
  s_7_26,
  s_9_10_14,
  s_1,
  s_18,
  s_1,
  s_31,
  s_18,
  s_14,
  s_14_17,
  s_7_9,
  s_9_23_0,
  s_27,
  s_15,
  s_15_18,
  s_14_15,
  s_2,
  s_9,
  s_30_38_42,
  s_9_17,
  s_37,
  s_12,
  s_29_30,
  s_0,
  s_4_26,
  s_14,
  s_6_9_10_18_24_0,
  s_36_41_42,
  s_0,
  s_4_6_7_10,
  s_4_0_1,
  s_30,
  s_9_14,
  s_18,
  s_30_38_40,
  s_2,
  s_0,
  s_30_35_41,
  s_0,
  s_2,
  s_0,
  s_4_6_26,
  s_30_35,
  s_0,
  s_0,
  s_4_9_11_25,
  s_0,
  s_5,
  s_30,
  s_10,
  s_9_31_35_36,
  s_4_6_9_10,
  s_0,
  s_2,
  s_7,
  s_14,
  s_18,
  s_18,
  s_31,
  s_1,
  s_30,
  s_9,
  s_4,
  s_10,
  s_10,
  s_18,
  s_1,
  s_6,
  s_4,
  s_32,
  s_4,
  s_18,
  s_4_10,
  s_0,
  s_0,
  s_0,
  s_0,
  s_31_34_35,
  s_18,
  s_4_9,
  s_0,
  s_36_0,
  s_0,
  s_4,
  s_4_22_26,
  s_18_0,
  s_4_6_10_11_18_26_32_35,
  s_18,
  s_10_11_26,
  s_0,
  s_2,
  s_33_41_42,
  s_0,
  s_6,
  s_23,
  s_35,
  s_35,
  s_6,
  s_4_6_9,
  s_27,
  s_30,
  s_0,
  s_0,
  s_4_26_27,
  s_0,
  s_37,
  s_31_39,
  s_4_9,
  s_18_0,
  s_7,
  s_7,
  s_0,
  s_2,
  s_7,
  s_14,
  s_18_0,
  s_31_42,
  s_31_42,
  s_4_7_10_12,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_32_33_41,
  s_18,
  s_6_9_10_14_23_24_26_34_37_0,
  s_0,
  s_2,
  s_26,
  s_4_10,
  s_0,
  s_7,
  s_12,
  s_10_14,
  s_0,
  s_4_11_32,
  s_0,
  s_18,
  s_10,
  s_44,
  s_18,
  s_18,
  s_10_26,
  s_1,
  s_9,
  s_2,
  s_7,
  s_0,
  s_7,
  s_7,
  s_7,
  s_15_17_0,
  s_0_1,
  s_11,
  s_11_26,
  s_14_0,
  s_0,
  s_2,
  s_4_28,
  s_10_0,
  s_4_7_9_10,
  s_10,
  s_30_32_38_41_42,
  s_0,
  s_0,
  s_7_10_26,
  s_10,
  s_0,
  s_2,
  s_7,
  s_28,
  s_23,
  s_5,
  s_35,
  s_0,
  s_4_25,
  s_18,
  s_7_9_10_36,
  s_18,
  s_6_0,
  s_18,
  s_6_0,
  s_6,
  s_4,
  s_6_0,
  s_0,
  s_4_10_29_30_32_35_41,
  s_0,
  s_0,
  s_0,
  s_7,
  s_4,
  s_4_10_11,
  s_8_18,
  s_1,
  s_2,
  s_4,
  s_4_38,
  s_31_32_42,
  s_10_24,
  s_2,
  s_24,
  s_24_0,
  s_9,
  s_31,
  s_6,
  s_17,
  s_32,
  s_10,
  s_0,
  s_10_18_0,
  s_6,
  s_0_1,
  s_18,
  s_18,
  s_24,
  s_2,
  s_7,
  s_0,
  s_2,
  s_24_0,
  s_14,
  s_4_7_9_24_31_42,
  s_0,
  s_2,
  s_0,
  s_0,
  s_32_41,
  s_4,
  s_4_38,
  s_4,
  s_40_41,
  s_0,
  s_4_21,
  s_0,
  s_18,
  s_0,
  s_0,
  s_2,
  s_12,
  s_12,
  s_4_6_9,
  s_36,
  s_0,
  s_18,
  s_4_6_7_9_10_18_24_26_31_35_37_41,
  s_0,
  s_0,
  s_6_18,
  s_4,
  s_0,
  s_0,
  s_18,
  s_2,
  s_10,
  s_31_32,
  s_0,
  s_2,
  s_4,
  s_0,
  s_2,
  s_10,
  s_35,
  s_4_26,
  s_10,
  s_15,
  s_5,
  s_29,
  s_22,
  s_18_0,
  s_20,
  s_20,
  s_38,
  s_22,
  s_6,
  s_32_38,
  s_18,
  s_6_7_26,
  s_21,
  s_0,
  s_2,
  s_4,
  s_6_14,
  s_6_14,
  s_4_7_9_10_14,
  s_0,
  s_4,
  s_30,
  s_0,
  s_7,
  s_7_9,
  s_4,
  s_30_36,
  s_0,
  s_2,
  s_18,
  s_0,
  s_30_38_42,
  s_4_9_11,
  s_4_9,
  s_0,
  s_4,
  s_9,
  s_9,
  s_0,
  s_10,
  s_0,
  s_18,
  s_2,
  s_18,
  s_10_32_0,
  s_2,
  s_4_9_10_11_22,
  s_18,
  s_18_30_32_33,
  s_6,
  s_7,
  s_6_21_0,
  s_6,
  s_0,
  s_7_25,
  s_2,
  s_7,
  s_32_35_38_40,
  s_0,
  s_4_6_10,
  s_18,
  s_4,
  s_6_18,
  s_4,
  s_6_18,
  s_18_32,
  s_5,
  s_4_9,
  s_32,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_4_7,
  s_2,
  s_4_14,
  s_32,
  s_32_35_0,
  s_0,
  s_4_8_25,
  s_35,
  s_20,
  s_20,
  s_4_14_38,
  s_29_32_35_38,
  s_11_26,
  s_0,
  s_2,
  s_5,
  s_20,
  s_11_32,
  s_42,
  s_0,
  s_18_30_36_41,
  s_10,
  s_18,
  s_0,
  s_6,
  s_4,
  s_6,
  s_6,
  s_10_13_18,
  s_4,
  s_13,
  s_6,
  s_6,
  s_13_18,
  s_7_30_0,
  s_27,
  s_6_13,
  s_0,
  s_18,
  s_18,
  s_6_22,
  s_2,
  s_7_12,
  s_20,
  s_18,
  s_5_18,
  s_5,
  s_5,
  s_6,
  s_20,
  s_6,
  s_18_36,
  s_41,
  s_4,
  s_4_14_0,
  s_2,
  s_7,
  s_18,
  s_15,
  s_9_30_41_0,
  s_0,
  s_2,
  s_0,
  s_4_9_24,
  s_0,
  s_18,
  s_17,
  s_5,
  s_5,
  s_5,
  s_18_35_40,
  s_0,
  s_27,
  s_27,
  s_27,
  s_27,
  s_18,
  s_14,
  s_0,
  s_6_41,
  s_23,
  s_10,
  s_15,
  s_5,
  s_5,
  s_0,
  s_20,
  s_17_18,
  s_0,
  s_0,
  s_6_9,
  s_6,
  s_18,
  s_6,
  s_0,
  s_2,
  s_7,
  s_0,
  s_18,
  s_18,
  s_27,
  s_30,
  s_30,
  s_4,
  s_5_7_18_21_27_35,
  s_5,
  s_6_10,
  s_18,
  s_6,
  s_0,
  s_14,
  s_18,
  s_13,
  s_20,
  s_20,
  s_26,
  s_17,
  s_17,
  s_4,
  s_4,
  s_14,
  s_18,
  s_10_1,
  s_20,
  s_10,
  s_1,
  s_35,
  s_4,
  s_10_0,
  s_1,
  s_6_10_36,
  s_10,
  s_18,
  s_31,
  s_21,
  s_6,
  s_4,
  s_18,
  s_31,
  s_18,
  s_10_40,
  s_0,
  s_18,
  s_32,
  s_4,
  s_18_32,
  s_0,
  s_2,
  s_6_13,
  s_18,
  s_20,
  s_5,
  s_5,
  s_5,
  s_6,
  s_5,
  s_20,
  s_5_7_13_27_0,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_6_40,
  s_44,
  s_18,
  s_6,
  s_5,
  s_20,
  s_6_23_35,
  s_6_23,
  s_20,
  s_20,
  s_20,
  s_6,
  s_0,
  s_18,
  s_0,
  s_20,
  s_20,
  s_13_0,
  s_7,
  s_2,
  s_27,
  s_0,
  s_6,
  s_26,
  s_1,
  s_15_18_23,
  s_6_10_14,
  s_15_18,
  s_27,
  s_6,
  s_6_36,
  s_6,
  s_27,
  s_5,
  s_20,
  s_5,
  s_6_9_10_14_15_17_35,
  s_24,
  s_0,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_18,
  s_20,
  s_6,
  s_18,
  s_6,
  s_5,
  s_0,
  s_13_20,
  s_20,
  s_6,
  s_15,
  s_18_1,
  s_8,
  s_5,
  s_5,
  s_6_15_27_30_35,
  s_21,
  s_27,
  s_0,
  s_6_10,
  s_0,
  s_6_38,
  s_20,
  s_0,
  s_20,
  s_5,
  s_1,
  s_1,
  s_7_13_20_26_30_34,
  s_20,
  s_13,
  s_15,
  s_5,
  s_6,
  s_8,
  s_1,
  s_0,
  s_18,
  s_20,
  s_27,
  s_18,
  s_0,
  s_6_15_17_25_26_38_41,
  s_18,
  s_0,
  s_6_9,
  s_6,
  s_5,
  s_18,
  s_8,
  s_15,
  s_27,
  s_20,
  s_20,
  s_18,
  s_4_14,
  s_6_40,
  s_5_10_1,
  s_18,
  s_18,
  s_13,
  s_13,
  s_20,
  s_20,
  s_20,
  s_27,
  s_8,
  s_7_10,
  s_20,
  s_15,
  s_18,
  s_0,
  s_20,
  s_20,
  s_9_11,
  s_6_8_19_20,
  s_10,
  s_6,
  s_26_1,
  s_41,
  s_11,
  s_18,
  s_5_6,
  s_0,
  s_20,
  s_8,
  s_17,
  s_18,
  s_20,
  s_14,
  s_18_0,
  s_7,
  s_1_0,
  s_8_14,
  s_7,
  s_18_1,
  s_0,
  s_7,
  s_19,
  s_14,
  s_8,
  s_7,
  s_7,
  s_0,
  s_8_14_21,
  s_8_27,
  s_1,
  s_35,
  s_6_35,
  s_22,
  s_29_30_32_38_41_42_0,
  s_0,
  s_0,
  s_4_7_10_23,
  s_0,
  s_4_14,
  s_7,
  s_6_0,
  s_2,
  s_7,
  s_18,
  s_4,
  s_9_31_42_0,
  s_0,
  s_9_24,
  s_1,
  s_9_0,
  s_24,
  s_32_42,
  s_7_10_24,
  s_18_0,
  s_0,
  s_2,
  s_6,
  s_6,
  s_17,
  s_10,
  s_10,
  s_0,
  s_0,
  s_31_32_42,
  s_10,
  s_0,
  s_0,
  s_30,
  s_0,
  s_5,
  s_22,
  s_22_26,
  s_27_0,
  s_35,
  s_0,
  s_4_25,
  s_30_35_40_41_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_4_7_22_26,
  s_0,
  s_2,
  s_7_26,
  s_6,
  s_6_18,
  s_15,
  s_6,
  s_6_29,
  s_15,
  s_1,
  s_6,
  s_20,
  s_27,
  s_14,
  s_18,
  s_8,
  s_18,
  s_1,
  s_2,
  s_0,
  s_0,
  s_20,
  s_0,
  s_0,
  s_0,
  s_27,
  s_27,
  s_27,
  s_8,
  s_8,
  s_20,
  s_20,
  s_20,
  s_27,
  s_27,
  s_13,
  s_27,
  s_27,
  s_0,
  s_30_43,
  s_9_11,
  s_4,
  s_6,
  s_5,
  s_1,
  s_5_17,
  s_20,
  s_5,
  s_5_20,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_1,
  s_5,
  s_5,
  s_20,
  s_5,
  s_20,
  s_5,
  s_5,
  s_26,
  s_13_24,
  s_5,
  s_24,
  s_24,
  s_0,
  s_0,
  s_6_35,
  s_0,
  s_32_41,
  s_18_0,
  s_18,
  s_2,
  s_24,
  s_26,
  s_20,
  s_6_0,
  s_2,
  s_18,
  s_18,
  s_4,
  s_1_0,
  s_5,
  s_5,
  s_1,
  s_9,
  s_1,
  s_1,
  s_9,
  s_18,
  s_18,
  s_6_9,
  s_4,
  s_1,
  s_1,
  s_18,
  s_9,
  s_18,
  s_18_0,
  s_18,
  s_17_20,
  s_6,
  s_40,
  s_23,
  s_18,
  s_41,
  s_7_21_42,
  s_8,
  s_1,
  s_26,
  s_10_18,
  s_0,
  s_18,
  s_5,
  s_26,
  s_4,
  s_0,
  s_0,
  s_7,
  s_0,
  s_13_20,
  s_26,
  s_21,
  s_6_29_40,
  s_0,
  s_18,
  s_18,
  s_20,
  s_6_0,
  s_6,
  s_15,
  s_24,
  s_24,
  s_6,
  s_18,
  s_14,
  s_0,
  s_2,
  s_27,
  s_4_11,
  s_4_11,
  s_5,
  s_5,
  s_20,
  s_20,
  s_15,
  s_15,
  s_5,
  s_15,
  s_6,
  s_18,
  s_6_18,
  s_6_18,
  s_5,
  s_18,
  s_6_20_27_37,
  s_5,
  s_20,
  s_5,
  s_20,
  s_5,
  s_20,
  s_0,
  s_5,
  s_20,
  s_5,
  s_20,
  s_0,
  s_0,
  s_5,
  s_6_32,
  s_0,
  s_6,
  s_18,
  s_5,
  s_26_29,
  s_26,
  s_6,
  s_18_23,
  s_6,
  s_6,
  s_27,
  s_20,
  s_14,
  s_18,
  s_4,
  s_18,
  s_4,
  s_18,
  s_10_18_32,
  s_10,
  s_10,
  s_18,
  s_4,
  s_18,
  s_4,
  s_4_18_23_31_32_42,
  s_0,
  s_4,
  s_7_8_10_32,
  s_4_6_10_18_32_41_2_0,
  s_41,
  s_4,
  s_0,
  s_2,
  s_10,
  s_4_33,
  s_10,
  s_6_21_25_41_42,
  s_0,
  s_10,
  s_4,
  s_4,
  s_6,
  s_32,
  s_30,
  s_4_10,
  s_9_26_41,
  s_4_32,
  s_0_2,
  s_4,
  s_9,
  s_4_11,
  s_4,
  s_18,
  s_4,
  s_9,
  s_0,
  s_7,
  s_6_36_0,
  s_18,
  s_4,
  s_10,
  s_19,
  s_4,
  s_1,
  s_4,
  s_0,
  s_2,
  s_6,
  s_18,
  s_10_32,
  s_4_31_38,
  s_4,
  s_4_33_41,
  s_4,
  s_4,
  s_10,
  s_6,
  s_6_9,
  s_18,
  s_9,
  s_4,
  s_10,
  s_9_31,
  s_10_36_42,
  s_6_42,
  s_0,
  s_6,
  s_42,
  s_0,
  s_10,
  s_4,
  s_26,
  s_4,
  s_18_0_1,
  s_18,
  s_4,
  s_10_32,
  s_10,
  s_6_35,
  s_18,
  s_27,
  s_33,
  s_4,
  s_4,
  s_10_18_0,
  s_1,
  s_9,
  s_18_1,
  s_6,
  s_9,
  s_41_42,
  s_6_42,
  s_18,
  s_18,
  s_4,
  s_6,
  s_0,
  s_7,
  s_0,
  s_14_15,
  s_0,
  s_14,
  s_18,
  s_21,
  s_15,
  s_0,
  s_18,
  s_15,
  s_0,
  s_4,
  s_6,
  s_18,
  s_14_17_23_35_41,
  s_0,
  s_6,
  s_10_23,
  s_4_6,
  s_9_10,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_20,
  s_18,
  s_13_20,
  s_18,
  s_5,
  s_4_6_13_14_15_17_33_38_2,
  s_5_18,
  s_4,
  s_4,
  s_4_6_14_18_41,
  s_6,
  s_0,
  s_2,
  s_18,
  s_4_7_10,
  s_6,
  s_18,
  s_10,
  s_7,
  s_0,
  s_6,
  s_10,
  s_6,
  s_13,
  s_18,
  s_0,
  s_18,
  s_26_0,
  s_0,
  s_0,
  s_4,
  s_18,
  s_4,
  s_13,
  s_7,
  s_7,
  s_1,
  s_9,
  s_0,
  s_9,
  s_17,
  s_14,
  s_10_32_41,
  s_15_26,
  s_4_6_17_21_29_32_33_35_38_39_40_41_42,
  s_7_10_21,
  s_6,
  s_0,
  s_4_6_17,
  s_6,
  s_6_14_0,
  s_2,
  s_26,
  s_37,
  s_0,
  s_0,
  s_2,
  s_4_7_12,
  s_14,
  s_20,
  s_5_18_37,
  s_20,
  s_18,
  s_7,
  s_7,
  s_0,
  s_6,
  s_6,
  s_13_20,
  s_5,
  s_18,
  s_6,
  s_38,
  s_5,
  s_18,
  s_18,
  s_20,
  s_18,
  s_6_27_35,
  s_6,
  s_6_35,
  s_0,
  s_8,
  s_6,
  s_18,
  s_13_20,
  s_4,
  s_18,
  s_27,
  s_18,
  s_26,
  s_18,
  s_5,
  s_5,
  s_5,
  s_6,
  s_27,
  s_20,
  s_15,
  s_18_27_41,
  s_8,
  s_5_6_18,
  s_5,
  s_18,
  s_0,
  s_5,
  s_2,
  s_7,
  s_20,
  s_5_18,
  s_5,
  s_40_41,
  s_4,
  s_2,
  s_26,
  s_6_0,
  s_18,
  s_10,
  s_4,
  s_28,
  s_6,
  s_4_5_13_15_18_32_33_38,
  s_13_20,
  s_0,
  s_7,
  s_7,
  s_0,
  s_20,
  s_13,
  s_26,
  s_0,
  s_5,
  s_4_6_7_10_11_17_25_26_30_32_35_37_39_41_0,
  s_0,
  s_4,
  s_0,
  s_6_13_18,
  s_20,
  s_6_18,
  s_0,
  s_4_11_22_0,
  s_6_11_30_32_39_0,
  s_6,
  s_11_27,
  s_13,
  s_18,
  s_18,
  s_15,
  s_5,
  s_5,
  s_6_15_28_33_35_38_41,
  s_4_10,
  s_4_6_9_14_36,
  s_18,
  s_2,
  s_7_9,
  s_18,
  s_9,
  s_0,
  s_17,
  s_0,
  s_0,
  s_0,
  s_18,
  s_18,
  s_5,
  s_30_31_35,
  s_20,
  s_10_14_18,
  s_6_26_29_30_35,
  s_20,
  s_0,
  s_5,
  s_6,
  s_6,
  s_23,
  s_13_20,
  s_35,
  s_5_6_17_18_29,
  s_20,
  s_5,
  s_5,
  s_1,
  s_5,
  s_5,
  s_18,
  s_9,
  s_6,
  s_1,
  s_1,
  s_9,
  s_4,
  s_8,
  s_6_18_35_38_0,
  s_6,
  s_7,
  s_6,
  s_0,
  s_0,
  s_17_25,
  s_10_27_29,
  s_5,
  s_6_13_35,
  s_4,
  s_6,
  s_5_13,
  s_0,
  s_4_23,
  s_4,
  s_18,
  s_4,
  s_0,
  s_0,
  s_4_11_29_30_35_38_39_42,
  s_18,
  s_0,
  s_20,
  s_0,
  s_7,
  s_7,
  s_5,
  s_20,
  s_20,
  s_20,
  s_6_23_35,
  s_23,
  s_17,
  s_20,
  s_17,
  s_35,
  s_6,
  s_32_34,
  s_0,
  s_18_0,
  s_7,
  s_12,
  s_5,
  s_5_13,
  s_5,
  s_5_13_32,
  s_18,
  s_4_38_42,
  s_5_18,
  s_4,
  s_15,
  s_5,
  s_5_13,
  s_6_36,
  s_7_9_26_30_37,
  s_0,
  s_2,
  s_4_9_26,
  s_18_0,
  s_20,
  s_11_39,
  s_2,
  s_11,
  s_2,
  s_0,
  s_6_13_14_30_35,
  s_20,
  s_6,
  s_6,
  s_7,
  s_0,
  s_6_25_30_35,
  s_0,
  s_1,
  s_20,
  s_36_41,
  s_27,
  s_27,
  s_4_6_11_17,
  s_9,
  s_0,
  s_2,
  s_9,
  s_9,
  s_18,
  s_3_18,
  s_6,
  s_4,
  s_7,
  s_1,
  s_6_9,
  s_10,
  s_10,
  s_0,
  s_10,
  s_6,
  s_7,
  s_0,
  s_7,
  s_2,
  s_4_9_10_21_31_40,
  s_0,
  s_2,
  s_0,
  s_18,
  s_10,
  s_7,
  s_0,
  s_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_10_18,
  s_9_10,
  s_1,
  s_17_18,
  s_6,
  s_4_6_11_18_38,
  s_5_18_20,
  s_9,
  s_4,
  s_12_26,
  s_0,
  s_6,
  s_8,
  s_30,
  s_4,
  s_6,
  s_6,
  s_15,
  s_0,
  s_0,
  s_25,
  s_25,
  s_6_25_40,
  s_40,
  s_4_6,
  s_40,
  s_4_6,
  s_6_25,
  s_0,
  s_0,
  s_10_18_1,
  s_30,
  s_18,
  s_27,
  s_27_30,
  s_6_13_27_35,
  s_20,
  s_39,
  s_11,
  s_28,
  s_0,
  s_28,
  s_7_30_0,
  s_25_0,
  s_20,
  s_27,
  s_13_20,
  s_0,
  s_5_6_15_38_42,
  s_0,
  s_0,
  s_28_1,
  s_18,
  s_15,
  s_18,
  s_26,
  s_0,
  s_6,
  s_17,
  s_17_25,
  s_14_33,
  s_6,
  s_6,
  s_18,
  s_5,
  s_4_6_10_35_40_41,
  s_4,
  s_5,
  s_5,
  s_18,
  s_18_26_29,
  s_4_5_33,
  s_18,
  s_18,
  s_4,
  s_15,
  s_18_0,
  s_4,
  s_41,
  s_26,
  s_26,
  s_4,
  s_41,
  s_2,
  s_26,
  s_32,
  s_0,
  s_0,
  s_1,
  s_18,
  s_9,
  s_8_18_25_35,
  s_6_18,
  s_7_29_0,
  s_38,
  s_0,
  s_6,
  s_15,
  s_25_30_35,
  s_0,
  s_20,
  s_0,
  s_5_1,
  s_5,
  s_6,
  s_13_18,
  s_18_29_30,
  s_0,
  s_0,
  s_11_26,
  s_13_30_35_0,
  s_0,
  s_30,
  s_18,
  s_7,
  s_2,
  s_7_10,
  s_0,
  s_7_30_35_38_2_0,
  s_0,
  s_6,
  s_27,
  s_11,
  s_0,
  s_9_10,
  s_0,
  s_11,
  s_23,
  s_18,
  s_0_1,
  s_26,
  s_2,
  s_26,
  s_32_33,
  s_9_10,
  s_32_33,
  s_9_10_32,
  s_5,
  s_18,
  s_6,
  s_6,
  s_10_30_32,
  s_5_13,
  s_10,
  s_0,
  s_18,
  s_15,
  s_18_1,
  s_5,
  s_6_36,
  s_4_6,
  s_6_10_27_35_38,
  s_0,
  s_6,
  s_6,
  s_0,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_20,
  s_5,
  s_18,
  s_6,
  s_18,
  s_18,
  s_13,
  s_6,
  s_6,
  s_18,
  s_1,
  s_20,
  s_18,
  s_32,
  s_18,
  s_18,
  s_4,
  s_18,
  s_6_18_25_38,
  s_18_0,
  s_0,
  s_0,
  s_2,
  s_7_25,
  s_18,
  s_13,
  s_32,
  s_18,
  s_4,
  s_5_6_14_20_35_36,
  s_0,
  s_18,
  s_4_33_35,
  s_13,
  s_23,
  s_18,
  s_10,
  s_4_5_6_7_26_35_36_38_41_42_0,
  s_6,
  s_6,
  s_6,
  s_18,
  s_5,
  s_10,
  s_6,
  s_0,
  s_5_35,
  s_4,
  s_4_9,
  s_4_11,
  s_6_15_35,
  s_6,
  s_0,
  s_4_10,
  s_9,
  s_7_36,
  s_0,
  s_6_10,
  s_10,
  s_4_6_15_17,
  s_6,
  s_2,
  s_7_12,
  s_5,
  s_5,
  s_6_10_18_22,
  s_18,
  s_6,
  s_6,
  s_9_14_26,
  s_33,
  s_11,
  s_6,
  s_2_0,
  s_6,
  s_6,
  s_2,
  s_19,
  s_0_2,
  s_10,
  s_20,
  s_20,
  s_5,
  s_5,
  s_8,
  s_5,
  s_8_25,
  s_6_7_10_25,
  s_7,
  s_0,
  s_20,
  s_5,
  s_5,
  s_20,
  s_20,
  s_4_35_38,
  s_5_26,
  s_5,
  s_18,
  s_1,
  s_18,
  s_13,
  s_5_10_11_17_18_32,
  s_5,
  s_6,
  s_20,
  s_14_38_42,
  s_0,
  s_26,
  s_20,
  s_10_0,
  s_6_8_10_15_20_21_30_35_41_42,
  s_20,
  s_0,
  s_0,
  s_0,
  s_6,
  s_10,
  s_27,
  s_6,
  s_0,
  s_26,
  s_2,
  s_0,
  s_6,
  s_20,
  s_20,
  s_1,
  s_4_6,
  s_4_11,
  s_0,
  s_32_37_41,
  s_26_27,
  s_0,
  s_27_0,
  s_2,
  s_7_26,
  s_13,
  s_7_26,
  s_0,
  s_2,
  s_7,
  s_4_7_12,
  s_6,
  s_4_38_39,
  s_6,
  s_18,
  s_13,
  s_13_18_23_30_35,
  s_30_38,
  s_7,
  s_0,
  s_6,
  s_0,
  s_30_33_39,
  s_13,
  s_30_35_38,
  s_0,
  s_4_11_26_30_32_34_35,
  s_6,
  s_1,
  s_8,
  s_4_33_41,
  s_18,
  s_6,
  s_4_12_14_27_30_33_35_37_41,
  s_0,
  s_6,
  s_4_0,
  s_2,
  s_7_17_30,
  s_5,
  s_5_1,
  s_1,
  s_1,
  s_0,
  s_0,
  s_1,
  s_0,
  s_4_6,
  s_10_17,
  s_10_11_29_32_34,
  s_26,
  s_18,
  s_26,
  s_4_0,
  s_26,
  s_26,
  s_9,
  s_4_6,
  s_27,
  s_1,
  s_9,
  s_9,
  s_27,
  s_6,
  s_1,
  s_9,
  s_26,
  s_26,
  s_6,
  s_6,
  s_4,
  s_6,
  s_5,
  s_9,
  s_18,
  s_1,
  s_9,
  s_0,
  s_0,
  s_2,
  s_26,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_20,
  s_20,
  s_20,
  s_1,
  s_1,
  s_10,
  s_20,
  s_20,
  s_6_10,
  s_18,
  s_1,
  s_1,
  s_2,
  s_4_9,
  s_1,
  s_1,
  s_18,
  s_9,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_26,
  s_26,
  s_5,
  s_5,
  s_6_17_27,
  s_30_31,
  s_0,
  s_30_31,
  s_0,
  s_0,
  s_19,
  s_30_31,
  s_0,
  s_17,
  s_9_17_19,
  s_30_31,
  s_0,
  s_19,
  s_18,
  s_9,
  s_14,
  s_14,
  s_28,
  s_14,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_5,
  s_5,
  s_5_18_29,
  s_15,
  s_18_1,
  s_6,
  s_6,
  s_6_20_23_25_31_35,
  s_6_20,
  s_0,
  s_0_1,
  s_0,
  s_7,
  s_6,
  s_0,
  s_14,
  s_18_1,
  s_1,
  s_23,
  s_1,
  s_6,
  s_8,
  s_25_0,
  s_0,
  s_18_41,
  s_26,
  s_4,
  s_5_18_32,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_13_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_1,
  s_13,
  s_27,
  s_4_35,
  s_0,
  s_4,
  s_0,
  s_6,
  s_6_35,
  s_20,
  s_6_9_10_32,
  s_6_35,
  s_6,
  s_6,
  s_18,
  s_13,
  s_6,
  s_13,
  s_6,
  s_18,
  s_20,
  s_6,
  s_4,
  s_15,
  s_5,
  s_15,
  s_5,
  s_1,
  s_9_35_40,
  s_6,
  s_6,
  s_20,
  s_30_38_41,
  s_4_10_15_28,
  s_6,
  s_26,
  s_0,
  s_26,
  s_2,
  s_18,
  s_9_14,
  s_4,
  s_18,
  s_0,
  s_20,
  s_0,
  s_30_36_41,
  s_0,
  s_4_22_26,
  s_6_18,
  s_1_0,
  s_2,
  s_14,
  s_4_9_14_26_30,
  s_0,
  s_9,
  s_6,
  s_6,
  s_8,
  s_15,
  s_27,
  s_35,
  s_17_18,
  s_0,
  s_7,
  s_15,
  s_0,
  s_20,
  s_13_20,
  s_20,
  s_6,
  s_18,
  s_20,
  s_30,
  s_14,
  s_0,
  s_2,
  s_0,
  s_17,
  s_0,
  s_14_17,
  s_4,
  s_4,
  s_18,
  s_1,
  s_0,
  s_10_1,
  s_25,
  s_5,
  s_5,
  s_4,
  s_4,
  s_7_9_0,
  s_18,
  s_2,
  s_20,
  s_8_18,
  s_5,
  s_6_13_20_23_25_29_30,
  s_18,
  s_6,
  s_13,
  s_6,
  s_20,
  s_23,
  s_10_18,
  s_7,
  s_0,
  s_6,
  s_13,
  s_13,
  s_4,
  s_20,
  s_20,
  s_1,
  s_6,
  s_27,
  s_27,
  s_1,
  s_0,
  s_0,
  s_5_20,
  s_17,
  s_5_18,
  s_7,
  s_0,
  s_7,
  s_13_15,
  s_13,
  s_4,
  s_18,
  s_18,
  s_27,
  s_5,
  s_18,
  s_6_0,
  s_18,
  s_1,
  s_4,
  s_4_6_30_35_41,
  s_6,
  s_6,
  s_6,
  s_5,
  s_20,
  s_13,
  s_30,
  s_0,
  s_22,
  s_6_29_30,
  s_0,
  s_6,
  s_4,
  s_6,
  s_4,
  s_10_28,
  s_14,
  s_18_23,
  s_4,
  s_22,
  s_6,
  s_10,
  s_6_9,
  s_0,
  s_2,
  s_7_9,
  s_15,
  s_27,
  s_8_18_25_30_33_35_38,
  s_0,
  s_6,
  s_5,
  s_10_25,
  s_7,
  s_4_0,
  s_0,
  s_18,
  s_0,
  s_20,
  s_13_20,
  s_5,
  s_7_21,
  s_11_14_19_0,
  s_2,
  s_7,
  s_1,
  s_10,
  s_18,
  s_0,
  s_2,
  s_13_29_30_39,
  s_6_35,
  s_10_11_26_32,
  s_0,
  s_2,
  s_10_0,
  s_2,
  s_6,
  s_0,
  s_2,
  s_5,
  s_0,
  s_0,
  s_0,
  s_30,
  s_4_7,
  s_6_17_40,
  s_0,
  s_0,
  s_0,
  s_6,
  s_18,
  s_20,
  s_18,
  s_2,
  s_7,
  s_10_38,
  s_10_32_38,
  s_0,
  s_2,
  s_7,
  s_7_26,
  s_4_6_7_10_25_30_38_42,
  s_0,
  s_4_38,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_15,
  s_5,
  s_20,
  s_5,
  s_13_20,
  s_18,
  s_6_35,
  s_0,
  s_6,
  s_0,
  s_10,
  s_0,
  s_5_13,
  s_6_8,
  s_0,
  s_0,
  s_0,
  s_8,
  s_0,
  s_0,
  s_0,
  s_6,
  s_6,
  s_10_18_32,
  s_0,
  s_2,
  s_7,
  s_13,
  s_18,
  s_0,
  s_18,
  s_4,
  s_4_26,
  s_4_9_21_0,
  s_2,
  s_0,
  s_18,
  s_6,
  s_30_36,
  s_30_36,
  s_21,
  s_6,
  s_4_6_9_10_13_21_26_29_30_32_35_36_38_39_41_42_0,
  s_1,
  s_1,
  s_6,
  s_4,
  s_20,
  s_0,
  s_2,
  s_7,
  s_5,
  s_5,
  s_5_8,
  s_5,
  s_1,
  s_27,
  s_30,
  s_8,
  s_6,
  s_6,
  s_5,
  s_18,
  s_6,
  s_13,
  s_6_23,
  s_6,
  s_18,
  s_0,
  s_6_18,
  s_18_0,
  s_4_10_17_20_0,
  s_2,
  s_5,
  s_5,
  s_6,
  s_5,
  s_18,
  s_15,
  s_26,
  s_17,
  s_23,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_20,
  s_5,
  s_7_0,
  s_27,
  s_27,
  s_27,
  s_27,
  s_5,
  s_1,
  s_5,
  s_27,
  s_27,
  s_0,
  s_0,
  s_27,
  s_5,
  s_5,
  s_1,
  s_26,
  s_27,
  s_20,
  s_20,
  s_18,
  s_6,
  s_6,
  s_4,
  s_9,
  s_36,
  s_4,
  s_18,
  s_1,
  s_9,
  s_26,
  s_10_18,
  s_26,
  s_6,
  s_4,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_14_15,
  s_20,
  s_6_11_14_28_30_38,
  s_0_1,
  s_0,
  s_7,
  s_4,
  s_5,
  s_18,
  s_6,
  s_27,
  s_25_0,
  s_0,
  s_20,
  s_1,
  s_19_26,
  s_1,
  s_1,
  s_27,
  s_10,
  s_1,
  s_10,
  s_5,
  s_20,
  s_26,
  s_6,
  s_5_18,
  s_5,
  s_5,
  s_6,
  s_6,
  s_19,
  s_20,
  s_5,
  s_5,
  s_5,
  s_6_36,
  s_26,
  s_1,
  s_6,
  s_20,
  s_13,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5_17,
  s_6_25,
  s_0,
  s_0,
  s_7,
  s_7,
  s_6,
  s_6,
  s_5,
  s_6,
  s_6,
  s_18,
  s_20,
  s_20,
  s_20,
  s_27,
  s_20,
  s_6,
  s_0,
  s_10,
  s_15,
  s_18,
  s_20,
  s_20,
  s_20,
  s_18,
  s_18,
  s_0,
  s_2,
  s_12,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_26,
  s_5,
  s_4_15,
  s_5,
  s_9_10,
  s_18,
  s_18,
  s_5,
  s_20,
  s_20,
  s_10_18_23_31_32,
  s_20,
  s_5,
  s_5,
  s_20,
  s_20,
  s_18_1_0,
  s_5_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_5,
  s_18_1,
  s_18_1,
  s_20,
  s_20,
  s_6,
  s_15,
  s_18,
  s_20,
  s_20,
  s_10_1,
  s_20,
  s_18,
  s_8_26,
  s_27,
  s_1,
  s_27,
  s_26,
  s_26,
  s_17,
  s_26,
  s_5,
  s_26,
  s_20,
  s_18,
  s_27,
  s_20,
  s_1,
  s_7,
  s_1,
  s_7,
  s_27,
  s_22,
  s_1,
  s_1,
  s_18,
  s_9,
  s_22,
  s_27,
  s_22,
  s_1,
  s_27,
  s_8,
  s_1,
  s_1,
  s_18,
  s_9,
  s_27,
  s_22,
  s_1,
  s_0,
  s_5,
  s_8,
  s_0,
  s_26,
  s_6,
  s_1,
  s_2,
  s_4,
  s_8,
  s_1,
  s_1,
  s_2,
  s_8,
  s_1,
  s_27,
  s_8,
  s_8,
  s_8,
  s_5,
  s_1,
  s_23,
  s_27,
  s_18,
  s_18,
  s_1,
  s_1,
  s_18,
  s_10_18_1,
  s_18,
  s_15,
  s_18_1,
  s_18,
  s_15,
  s_4_23_35,
  s_10,
  s_38_41,
  s_0,
  s_5_18,
  s_5,
  s_20,
  s_15,
  s_5,
  s_5,
  s_6,
  s_6,
  s_5,
  s_5,
  s_27,
  s_1,
  s_5,
  s_18,
  s_4,
  s_6,
  s_20,
  s_20,
  s_20,
  s_20,
  s_8,
  s_26,
  s_8,
  s_8_10,
  s_1,
  s_20,
  s_20,
  s_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_18,
  s_14_18,
  s_14,
  s_18,
  s_6_35_40,
  s_18_0,
  s_18,
  s_18,
  s_10,
  s_20,
  s_10,
  s_0,
  s_2,
  s_26,
  s_6_23,
  s_20,
  s_18,
  s_18,
  s_14,
  s_20,
  s_6_10,
  s_6,
  s_18,
  s_18,
  s_18,
  s_6,
  s_10,
  s_13_20,
  s_20,
  s_15,
  s_15,
  s_20,
  s_14,
  s_10_2_0,
  s_18,
  s_18,
  s_2,
  s_7,
  s_13_0,
  s_13,
  s_15,
  s_6,
  s_4,
  s_18,
  s_18,
  s_6,
  s_6,
  s_20,
  s_20,
  s_1,
  s_20,
  s_15,
  s_18,
  s_4,
  s_10_15_18,
  s_23,
  s_23,
  s_20,
  s_17,
  s_20,
  s_18,
  s_10,
  s_18,
  s_15,
  s_15,
  s_4,
  s_18,
  s_20,
  s_31_32_38_41,
  s_6,
  s_15,
  s_5_18_1,
  s_20,
  s_18,
  s_26,
  s_5_6_23_35,
  s_5,
  s_4_11_21_30,
  s_0,
  s_21,
  s_0,
  s_5,
  s_27,
  s_6_18_36_1_0,
  s_15,
  s_6_0,
  s_18,
  s_18,
  s_27,
  s_18,
  s_27,
  s_7_32_2_0,
  s_0,
  s_2,
  s_10_26,
  s_0,
  s_14_2_0,
  s_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_27,
  s_18,
  s_26_30_39_0,
  s_30_39,
  s_6,
  s_4,
  s_4_6,
  s_0,
  s_2,
  s_26,
  s_18,
  s_5,
  s_5,
  s_13,
  s_18,
  s_20,
  s_5,
  s_5,
  s_17,
  s_5,
  s_4_10_11_14_36_38,
  s_0,
  s_18,
  s_4,
  s_20,
  s_12_17,
  s_0,
  s_29,
  s_2,
  s_35_38,
  s_17_26,
  s_6_18_0,
  s_0,
  s_7,
  s_18,
  s_20,
  s_10,
  s_4_15_26,
  s_0,
  s_2,
  s_7,
  s_10,
  s_35_42,
  s_20,
  s_4,
  s_10_18,
  s_10_13_1,
  s_0,
  s_26,
  s_15,
  s_18,
  s_18,
  s_18,
  s_1,
  s_1,
  s_18,
  s_18,
  s_17,
  s_15,
  s_9,
  s_18_20,
  s_5,
  s_0,
  s_7,
  s_7_30,
  s_0,
  s_17,
  s_6,
  s_23,
  s_10,
  s_18,
  s_4_15,
  s_18,
  s_18,
  s_10,
  s_10_32_41,
  s_18_0,
  s_7,
  s_7,
  s_15,
  s_10,
  s_6,
  s_7_10_0,
  s_2,
  s_13,
  s_9_15_26_28_0,
  s_30_35,
  s_0,
  s_4_0,
  s_0,
  s_0,
  s_2,
  s_7_9_15_26,
  s_6,
  s_17_18_0,
  s_20,
  s_20,
  s_27,
  s_6_7_35,
  s_0,
  s_20,
  s_18,
  s_4,
  s_14,
  s_18,
  s_9,
  s_4_6_38,
  s_6,
  s_5,
  s_6,
  s_4,
  s_6,
  s_15_18,
  s_18_1,
  s_9,
  s_5,
  s_4_7_10_11_30_35_37_38_41,
  s_6,
  s_0,
  s_13_20,
  s_6,
  s_0,
  s_2,
  s_5,
  s_18_0,
  s_7,
  s_0,
  s_5,
  s_5,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_14,
  s_10,
  s_0,
  s_13_14_18_28_31_41,
  s_0,
  s_0,
  s_0,
  s_10_15_31,
  s_31,
  s_4,
  s_10,
  s_6,
  s_9,
  s_20,
  s_6_7_27_35,
  s_5,
  s_5,
  s_18,
  s_4,
  s_20,
  s_15,
  s_18,
  s_0,
  s_18,
  s_37,
  s_0,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_18,
  s_20,
  s_20,
  s_6_15,
  s_18,
  s_20,
  s_18,
  s_6,
  s_18,
  s_18,
  s_5,
  s_4,
  s_38,
  s_18,
  s_4,
  s_18,
  s_11_28_30_31_42,
  s_28,
  s_15,
  s_18_26_28,
  s_18,
  s_6,
  s_6_21,
  s_18,
  s_28,
  s_4,
  s_9_36_41,
  s_18,
  s_9,
  s_20,
  s_5,
  s_18,
  s_19_28,
  s_20,
  s_2_0,
  s_6,
  s_28,
  s_28,
  s_17,
  s_28,
  s_15,
  s_9_12_39,
  s_0,
  s_2,
  s_7_31_39,
  s_0,
  s_0,
  s_2,
  s_10,
  s_10,
  s_14,
  s_18,
  s_6,
  s_6,
  s_10,
  s_27,
  s_14,
  s_40,
  s_18,
  s_18,
  s_30,
  s_4,
  s_14_28_0_2,
  s_18,
  s_6,
  s_30_35,
  s_0,
  s_4_0,
  s_6_18,
  s_6_18,
  s_6,
  s_28,
  s_7,
  s_26,
  s_0,
  s_2_0,
  s_7,
  s_2_0,
  s_7_20,
  s_40,
  s_14_39_0,
  s_30_39,
  s_0,
  s_0,
  s_26,
  s_4_10_11_14_23_27_31_32_40_41,
  s_14_18,
  s_14,
  s_5,
  s_22,
  s_4,
  s_4_24,
  s_30,
  s_22,
  s_22,
  s_30,
  s_18,
  s_4_6,
  s_4,
  s_18_2_0,
  s_18,
  s_18,
  s_2,
  s_7,
  s_7_26,
  s_18,
  s_4_11_18_19_26_28,
  s_6_28,
  s_4,
  s_0,
  s_0,
  s_2_0,
  s_28,
  s_6,
  s_5,
  s_18,
  s_11_19,
  s_32_41,
  s_38,
  s_4,
  s_4_26,
  s_30_41,
  s_0,
  s_4_26,
  s_18,
  s_0,
  s_0,
  s_10_31_32,
  s_18,
  s_4_41,
  s_0,
  s_18,
  s_18,
  s_4,
  s_10_21,
  s_0,
  s_30,
  s_0,
  s_0,
  s_11,
  s_0,
  s_26,
  s_21_40,
  s_18,
  s_0,
  s_0,
  s_30,
  s_0,
  s_0,
  s_30_38,
  s_4,
  s_32,
  s_10,
  s_27,
  s_18,
  s_10_21_26,
  s_18,
  s_30,
  s_10,
  s_32,
  s_4,
  s_18,
  s_4_10_36,
  s_18,
  s_15_28,
  s_23_28,
  s_26,
  s_26,
  s_18_0,
  s_27,
  s_13,
  s_40,
  s_25,
  s_23,
  s_25,
  s_6,
  s_22,
  s_30,
  s_4_6,
  s_19,
  s_0,
  s_23,
  s_23,
  s_10,
  s_23,
  s_23,
  s_38,
  s_4,
  s_38,
  s_4,
  s_6,
  s_35,
  s_0,
  s_4,
  s_5,
  s_5,
  s_5,
  s_40,
  s_30,
  s_30,
  s_27,
  s_30,
  s_22,
  s_30,
  s_30,
  s_0,
  s_10,
  s_11,
  s_15_18,
  s_19_22_26_30,
  s_0,
  s_0,
  s_11_30,
  s_18_0,
  s_18,
  s_4_7_10,
  s_0,
  s_2,
  s_7,
  s_32_41,
  s_18,
  s_2,
  s_30,
  s_4_7_28,
  s_28,
  s_7,
  s_28,
  s_28,
  s_0_2,
  s_22,
  s_2,
  s_4,
  s_30,
  s_0,
  s_0,
  s_4_22,
  s_30,
  s_0,
  s_0,
  s_4_10,
  s_0,
  s_2,
  s_7,
  s_40,
  s_41,
  s_40,
  s_23,
  s_31,
  s_0,
  s_2,
  s_9_0,
  s_8,
  s_0,
  s_23,
  s_9,
  s_23,
  s_23,
  s_23_0,
  s_4,
  s_30,
  s_4,
  s_30,
  s_30,
  s_4,
  s_23,
  s_23,
  s_31_32,
  s_0,
  s_2,
  s_0,
  s_18,
  s_4,
  s_4_7_9_11,
  s_0,
  s_2,
  s_7,
  s_18,
  s_6_14_35_36_42,
  s_6_18,
  s_18,
  s_6,
  s_0,
  s_32,
  s_10,
  s_0,
  s_0,
  s_10,
  s_24_0_1,
  s_0,
  s_32_40_41,
  s_0,
  s_18,
  s_4,
  s_0,
  s_41,
  s_30,
  s_14_17_22_24,
  s_10_15_17_26,
  s_17_22_26_30_32_38_40,
  s_6,
  s_0,
  s_17,
  s_6,
  s_30,
  s_14,
  s_6,
  s_30,
  s_22,
  s_32,
  s_6_18,
  s_4,
  s_30,
  s_35,
  s_6,
  s_0,
  s_4,
  s_41,
  s_4,
  s_41,
  s_30,
  s_30,
  s_30,
  s_30,
  s_30,
  s_30,
  s_40,
  s_0,
  s_30,
  s_9_19_22_26,
  s_0,
  s_0,
  s_29_30_35,
  s_4,
  s_4,
  s_30,
  s_6,
  s_32,
  s_0,
  s_32,
  s_9,
  s_9,
  s_1,
  s_14,
  s_30,
  s_4,
  s_41,
  s_6,
  s_35_36_41_42,
  s_0,
  s_4_6_10,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_2,
  s_7,
  s_30_35,
  s_4,
  s_7,
  s_4_6,
  s_30_31_35,
  s_6_18_41,
  s_4_7_11_22_30,
  s_0,
  s_0,
  s_10_31_32,
  s_0,
  s_7_22,
  s_0,
  s_30,
  s_11,
  s_26,
  s_7_30_0,
  s_4,
  s_41,
  s_4,
  s_41,
  s_32,
  s_32,
  s_4,
  s_7,
  s_20,
  s_20,
  s_0,
  s_0,
  s_38_0,
  s_8,
  s_10,
  s_31_32_41,
  s_0,
  s_4_7_10_11,
  s_30,
  s_0,
  s_22,
  s_31_32,
  s_0,
  s_31_40,
  s_10_21_0,
  s_4_9_21,
  s_0_1,
  s_3_10,
  s_6,
  s_4,
  s_31,
  s_17_28_0_2,
  s_30,
  s_22_0,
  s_6,
  s_2,
  s_7_9,
  s_5,
  s_20,
  s_18,
  s_5,
  s_27,
  s_6,
  s_4,
  s_35,
  s_4,
  s_40,
  s_4_21,
  s_18,
  s_4_10,
  s_0,
  s_32,
  s_18,
  s_30,
  s_40,
  s_4_9_21_40,
  s_18,
  s_0,
  s_11_12_33_41,
  s_14_0,
  s_12,
  s_18,
  s_29,
  s_22,
  s_18,
  s_7_26_41,
  s_4_26,
  s_0,
  s_2,
  s_26,
  s_18,
  s_29,
  s_29,
  s_4_6_10_14_22,
  s_2_0,
  s_2,
  s_7,
  s_32_33_41,
  s_0,
  s_18,
  s_18,
  s_0,
  s_35,
  s_4,
  s_4_6_10_14_22,
  s_2_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_9_0,
  s_2,
  s_7,
  s_32_42,
  s_4_7,
  s_0,
  s_0,
  s_2,
  s_4,
  s_4_26,
  s_30,
  s_11,
  s_1,
  s_4_7_10,
  s_0,
  s_2,
  s_41,
  s_4,
  s_6,
  s_40,
  s_7_26,
  s_0,
  s_7_21_23_26,
  s_6,
  s_17_30_35,
  s_0,
  s_26,
  s_18,
  s_0,
  s_32_42,
  s_0,
  s_22,
  s_0,
  s_2,
  s_7,
  s_7_10,
  s_0,
  s_30_43,
  s_22,
  s_30_32_35,
  s_0,
  s_4_22,
  s_0,
  s_21,
  s_33_37_38_41,
  s_4_7_11_26,
  s_0,
  s_6,
  s_4_7_11,
  s_4,
  s_30_35,
  s_18,
  s_30,
  s_27,
  s_30_0,
  s_0,
  s_4_22,
  s_5,
  s_30,
  s_4_26,
  s_30_35,
  s_4_11,
  s_1,
  s_0,
  s_7_26,
  s_41,
  s_18,
  s_40,
  s_4,
  s_4,
  s_41,
  s_30,
  s_6,
  s_0,
  s_2,
  s_9,
  s_0,
  s_26,
  s_33,
  s_4,
  s_32_42,
  s_0,
  s_18_30,
  s_30,
  s_22,
  s_7_26,
  s_18_29_0,
  s_11_22_26,
  s_0,
  s_36,
  s_4,
  s_38,
  s_38,
  s_4_26,
  s_30_35_37,
  s_0,
  s_18,
  s_0,
  s_40,
  s_7_9_10_23_26,
  s_0,
  s_34,
  s_4,
  s_30,
  s_19,
  s_0,
  s_30,
  s_4,
  s_30_37,
  s_0,
  s_4,
  s_30_37,
  s_0,
  s_6,
  s_30,
  s_30,
  s_0,
  s_22_26,
  s_30,
  s_27,
  s_30,
  s_6,
  s_10_1,
  s_0,
  s_4_18_26,
  s_30_31,
  s_41,
  s_17,
  s_5,
  s_5,
  s_40,
  s_18,
  s_9,
  s_18_1,
  s_1,
  s_18,
  s_9,
  s_37,
  s_0,
  s_2,
  s_12,
  s_26_27,
  s_13,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_18,
  s_4,
  s_18,
  s_20,
  s_6,
  s_10_15_17_18,
  s_18,
  s_18,
  s_4_28_30_42,
  s_0,
  s_18,
  s_18,
  s_7,
  s_0,
  s_4_12,
  s_4_14_26,
  s_18_41,
  s_4,
  s_4_14,
  s_30_32_35,
  s_0,
  s_4_10_11_22,
  s_6,
  s_6,
  s_15,
  s_6,
  s_32_0,
  s_2,
  s_7,
  s_7_9_10,
  s_0,
  s_18,
  s_0,
  s_7_9_13,
  s_0,
  s_2,
  s_6_13,
  s_5,
  s_13_0,
  s_2,
  s_7,
  s_9_12_34_37,
  s_0,
  s_2,
  s_0,
  s_2,
  s_18,
  s_31_42,
  s_31_42,
  s_15,
  s_0,
  s_32_35_36_42_0,
  s_0,
  s_4_6_10,
  s_0,
  s_4_7_21,
  s_18_0,
  s_30,
  s_0,
  s_11,
  s_0,
  s_2,
  s_26,
  s_40,
  s_18,
  s_29_32_35_40_41,
  s_6_1,
  s_4,
  s_18,
  s_4_10_11,
  s_18,
  s_17,
  s_40,
  s_20,
  s_18,
  s_30,
  s_15,
  s_1,
  s_1_0,
  s_5,
  s_5,
  s_20,
  s_5_17,
  s_10_17_25,
  s_27,
  s_8_0,
  s_41,
  s_19_23_30_32_35,
  s_4_9_26,
  s_0,
  s_0,
  s_2,
  s_0,
  s_0,
  s_35,
  s_22,
  s_30_32,
  s_22,
  s_30_32,
  s_18,
  s_1,
  s_1,
  s_18,
  s_10,
  s_10,
  s_4_9_10_22_26_32_42,
  s_18,
  s_0,
  s_2,
  s_27,
  s_31,
  s_9_15,
  s_4,
  s_29,
  s_29,
  s_30,
  s_30,
  s_20,
  s_15,
  s_37,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_2,
  s_26,
  s_26,
  s_13_15_17_27,
  s_7_10,
  s_6,
  s_15_21,
  s_18,
  s_18,
  s_13,
  s_18,
  s_6,
  s_33,
  s_33,
  s_18,
  s_18,
  s_14,
  s_22_26,
  s_30,
  s_22_26,
  s_30,
  s_28_40,
  s_10,
  s_30,
  s_6,
  s_6_13,
  s_18,
  s_10_39,
  s_33,
  s_4,
  s_33,
  s_4,
  s_33,
  s_9_14,
  s_18,
  s_0_1,
  s_2,
  s_4,
  s_41,
  s_4,
  s_41,
  s_18,
  s_0,
  s_35,
  s_10,
  s_6,
  s_18,
  s_18,
  s_9_1,
  s_18,
  s_9,
  s_5_18,
  s_33_34_36,
  s_0,
  s_4,
  s_4_11,
  s_18,
  s_4,
  s_30,
  s_4,
  s_30,
  s_18_1,
  s_1,
  s_2,
  s_0,
  s_10,
  s_30,
  s_9,
  s_10,
  s_30,
  s_4,
  s_7,
  s_0,
  s_2,
  s_31_32_39_41,
  s_0,
  s_4_10,
  s_10_0,
  s_2,
  s_7,
  s_18,
  s_4_12_26,
  s_37_41,
  s_0,
  s_0,
  s_4_12_26,
  s_31_37_41,
  s_0,
  s_0,
  s_18,
  s_1,
  s_41,
  s_10_1_0,
  s_4,
  s_18,
  s_6_0,
  s_6,
  s_30,
  s_10_32,
  s_0,
  s_2,
  s_7,
  s_4_21,
  s_10,
  s_4_10,
  s_36,
  s_26,
  s_30,
  s_10,
  s_30,
  s_0,
  s_10,
  s_30,
  s_0,
  s_6_14_15,
  s_17,
  s_0,
  s_4,
  s_30,
  s_4,
  s_30,
  s_30,
  s_30,
  s_27,
  s_30,
  s_0,
  s_0,
  s_0,
  s_22,
  s_30,
  s_20,
  s_5,
  s_0,
  s_8,
  s_1,
  s_5,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_0,
  s_0,
  s_5,
  s_9,
  s_20,
  s_17,
  s_17,
  s_26,
  s_0,
  s_4_10_22,
  s_18_21_23,
  s_32,
  s_0,
  s_4_10,
  s_0,
  s_0,
  s_6,
  s_5,
  s_30,
  s_5_18,
  s_15,
  s_20,
  s_20,
  s_32,
  s_10_14,
  s_1_0,
  s_9,
  s_2,
  s_23,
  s_9_10,
  s_0,
  s_10,
  s_32,
  s_0,
  s_10_11,
  s_32_41,
  s_10,
  s_0,
  s_2,
  s_7_9,
  s_11,
  s_6,
  s_6,
  s_4,
  s_7,
  s_7_19_25_35,
  s_10_1,
  s_20,
  s_0,
  s_0,
  s_5,
  s_0,
  s_6,
  s_8_27,
  s_8_27,
  s_18,
  s_9,
  s_8_22,
  s_6,
  s_18,
  s_30_0,
  s_4,
  s_30,
  s_0,
  s_0,
  s_10,
  s_0,
  s_0,
  s_15,
  s_32_40,
  s_20,
  s_6,
  s_39,
  s_39,
  s_6,
  s_39,
  s_22,
  s_30,
  s_30,
  s_27,
  s_27,
  s_6,
  s_40,
  s_27,
  s_27,
  s_27,
  s_18,
  s_20,
  s_38_41_42,
  s_18_0,
  s_18,
  s_9_14_15,
  s_1,
  s_2,
  s_4_11,
  s_31_42,
  s_7,
  s_0,
  s_7,
  s_2,
  s_26,
  s_18_0,
  s_26,
  s_15_26,
  s_18_0,
  s_4_26,
  s_30,
  s_4_26,
  s_30,
  s_32_36,
  s_0,
  s_9,
  s_4_6_9_10,
  s_0,
  s_7,
  s_29,
  s_4_26,
  s_6,
  s_6_27_0,
  s_0,
  s_38,
  s_0,
  s_34,
  s_0,
  s_4_26,
  s_0,
  s_2,
  s_32,
  s_33_35,
  s_4,
  s_35,
  s_35_40,
  s_6,
  s_19,
  s_30,
  s_19,
  s_30,
  s_32,
  s_18,
  s_30,
  s_0,
  s_26,
  s_41,
  s_4,
  s_18,
  s_7,
  s_32_41,
  s_18,
  s_4_6_10_17_19_21_22_35_40,
  s_6,
  s_4_10_22,
  s_18,
  s_6,
  s_6,
  s_7,
  s_41,
  s_0,
  s_4_7,
  s_32,
  s_0,
  s_4_10,
  s_0,
  s_2,
  s_0,
  s_30_32,
  s_0,
  s_4_10_21,
  s_0,
  s_18,
  s_0,
  s_4_11,
  s_30_35_37_38,
  s_6_0,
  s_0,
  s_0,
  s_2,
  s_4_12_17_24_25_26_28,
  s_18,
  s_6_8,
  s_30,
  s_30,
  s_4_7_26,
  s_30_40,
  s_0,
  s_7_9_26,
  s_15,
  s_4_14,
  s_41,
  s_41,
  s_41,
  s_18,
  s_35_41,
  s_4,
  s_38,
  s_11,
  s_18,
  s_30_37,
  s_0,
  s_4_26,
  s_30,
  s_6,
  s_41,
  s_41,
  s_41,
  s_4,
  s_4,
  s_6_18_0,
  s_4_7,
  s_40,
  s_41,
  s_32,
  s_4_10,
  s_0,
  s_2,
  s_2,
  s_0,
  s_0,
  s_4_7_9_10_15_22,
  s_0,
  s_9_10_27_0,
  s_30_31_40_42,
  s_0,
  s_10,
  s_8,
  s_4,
  s_5,
  s_1,
  s_5,
  s_26,
  s_5,
  s_25,
  s_9,
  s_1,
  s_1,
  s_18,
  s_9,
  s_6,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_5,
  s_1,
  s_8,
  s_5,
  s_5,
  s_5,
  s_32,
  s_4_10,
  s_0,
  s_0,
  s_6,
  s_18,
  s_8,
  s_6,
  s_20,
  s_27,
  s_18,
  s_6_27,
  s_40,
  s_30,
  s_22,
  s_22,
  s_30,
  s_22,
  s_30,
  s_30,
  s_35,
  s_10_32_36,
  s_18,
  s_30_38_41_42,
  s_18_0,
  s_14,
  s_18_0,
  s_10_18,
  s_0,
  s_26,
  s_4_7_11_14_17_24,
  s_0,
  s_31_32_35,
  s_0,
  s_9_10,
  s_0,
  s_2,
  s_9,
  s_9_10,
  s_39,
  s_20,
  s_32_41,
  s_0,
  s_4,
  s_0,
  s_41,
  s_4,
  s_22,
  s_30_39,
  s_0,
  s_22,
  s_30_39,
  s_0,
  s_7_15_31_38_41,
  s_0,
  s_18,
  s_22,
  s_4,
  s_42,
  s_0,
  s_2,
  s_0,
  s_7,
  s_29,
  s_29_38,
  s_29_38,
  s_26,
  s_27,
  s_30_0,
  s_0,
  s_22_26,
  s_17,
  s_4_6_9_31_36,
  s_31_32_41_0,
  s_4_10,
  s_0,
  s_10,
  s_0,
  s_2,
  s_18,
  s_4_0,
  s_6,
  s_7,
  s_0,
  s_7,
  s_7_12_26_37,
  s_0,
  s_0,
  s_34,
  s_6,
  s_0,
  s_18,
  s_6_15,
  s_20,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_30_31_0,
  s_2,
  s_11_12_26,
  s_30,
  s_22,
  s_12_26_37,
  s_0,
  s_2,
  s_4_7_10_38,
  s_18,
  s_18_0,
  s_2,
  s_7_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_12,
  s_37,
  s_0,
  s_12,
  s_4_12,
  s_0,
  s_2,
  s_35_40,
  s_4,
  s_0,
  s_18,
  s_4,
  s_18,
  s_4,
  s_37,
  s_12,
  s_12,
  s_0,
  s_2,
  s_18,
  s_1_0,
  s_1,
  s_14_26,
  s_29,
  s_19,
  s_13,
  s_23,
  s_23,
  s_23,
  s_4,
  s_30,
  s_4_11,
  s_30,
  s_40,
  s_22,
  s_30,
  s_22,
  s_30,
  s_9_10_15,
  s_31_32,
  s_0,
  s_11_18_26,
  s_0,
  s_26,
  s_30,
  s_33_35_36,
  s_0,
  s_0,
  s_6_18,
  s_36,
  s_7,
  s_0,
  s_4_11_26,
  s_0,
  s_2,
  s_7,
  s_26,
  s_40,
  s_40,
  s_0,
  s_24,
  s_30,
  s_24,
  s_30,
  s_24,
  s_6,
  s_35_38,
  s_0,
  s_0,
  s_4_11_12_14_26,
  s_9_10_14_24_31_32,
  s_0,
  s_10,
  s_10,
  s_30_41,
  s_18,
  s_26,
  s_39,
  s_0,
  s_0,
  s_4,
  s_4_9_10,
  s_18,
  s_6,
  s_6,
  s_4,
  s_4_26,
  s_32,
  s_35,
  s_7,
  s_7,
  s_6_27_0,
  s_29_30,
  s_22_26,
  s_10,
  s_0,
  s_9_14_27_0,
  s_0,
  s_7,
  s_4_7_9,
  s_9_10_0,
  s_31_32,
  s_0,
  s_2,
  s_9_10,
  s_0,
  s_9,
  s_18,
  s_0,
  s_4_10_16,
  s_9_0,
  s_0,
  s_37,
  s_0,
  s_2,
  s_12,
  s_0,
  s_30,
  s_41,
  s_4,
  s_40,
  s_30,
  s_4_11,
  s_0,
  s_6,
  s_6_38,
  s_6_29,
  s_30,
  s_4,
  s_29_30,
  s_30,
  s_4_10,
  s_0,
  s_18,
  s_38,
  s_30,
  s_30,
  s_4,
  s_30,
  s_4,
  s_30,
  s_11,
  s_0,
  s_2,
  s_4_19_22,
  s_27,
  s_15,
  s_22,
  s_30,
  s_6_10_23_26,
  s_0,
  s_2,
  s_26,
  s_0,
  s_27,
  s_20,
  s_20,
  s_20,
  s_17,
  s_10,
  s_15,
  s_23,
  s_20,
  s_30,
  s_4,
  s_30,
  s_0,
  s_10,
  s_30,
  s_0,
  s_4_11_12_26,
  s_40,
  s_29_30_31_32_33_35_36_39_42,
  s_0,
  s_6_18,
  s_22_0,
  s_4_10_11_15_22_26,
  s_1,
  s_2,
  s_18,
  s_4_26,
  s_18_0,
  s_18_38_42_0,
  s_4_7_9_11,
  s_4,
  s_18,
  s_4_6_10,
  s_9,
  s_10_18_36_37,
  s_5,
  s_30,
  s_2_0,
  s_2,
  s_30,
  s_4,
  s_4,
  s_4,
  s_20,
  s_0,
  s_2,
  s_7,
  s_4,
  s_21_36_40,
  s_18,
  s_18,
  s_4,
  s_18,
  s_4,
  s_30,
  s_4,
  s_30,
  s_30,
  s_32,
  s_0,
  s_4,
  s_4_22,
  s_29_40_41,
  s_4,
  s_5_15,
  s_28,
  s_15,
  s_31_32_40,
  s_0,
  s_2,
  s_12,
  s_18,
  s_4_12,
  s_4_0,
  s_34_35_37,
  s_18,
  s_0,
  s_0,
  s_2,
  s_7,
  s_18,
  s_27,
  s_6_18,
  s_13_20,
  s_25,
  s_18,
  s_1,
  s_8,
  s_0,
  s_27,
  s_6,
  s_27,
  s_0,
  s_9,
  s_0,
  s_2,
  s_0,
  s_7,
  s_27,
  s_26,
  s_27,
  s_0,
  s_11,
  s_0,
  s_0,
  s_0,
  s_27,
  s_0,
  s_2,
  s_14,
  s_15,
  s_20,
  s_15,
  s_20,
  s_18,
  s_17,
  s_20,
  s_20,
  s_10_18,
  s_15,
  s_5,
  s_6,
  s_6,
  s_14,
  s_0,
  s_6,
  s_26,
  s_18_1_0,
  s_4,
  s_0,
  s_0,
  s_2,
  s_30,
  s_9,
  s_18,
  s_30,
  s_20,
  s_6,
  s_0,
  s_9,
  s_10_0,
  s_0,
  s_6,
  s_5,
  s_0,
  s_10,
  s_18,
  s_6,
  s_0,
  s_31,
  s_4,
  s_4,
  s_1_0,
  s_18,
  s_9,
  s_10_14_25_0,
  s_9,
  s_30,
  s_1,
  s_9,
  s_30,
  s_2,
  s_6_36,
  s_0,
  s_0,
  s_2,
  s_4,
  s_22,
  s_6_31_32,
  s_10,
  s_1,
  s_9_24_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_9,
  s_5,
  s_10,
  s_10,
  s_30,
  s_4,
  s_30,
  s_6,
  s_7,
  s_27,
  s_1,
  s_19,
  s_6,
  s_1,
  s_7_25,
  s_1,
  s_1_0,
  s_1_0,
  s_2,
  s_27,
  s_6_21_25_27,
  s_5,
  s_18,
  s_0,
  s_20,
  s_6,
  s_19,
  s_20,
  s_20,
  s_20,
  s_6,
  s_0,
  s_5,
  s_6,
  s_22,
  s_6_1,
  s_6_8,
  s_1,
  s_1,
  s_8,
  s_17,
  s_5,
  s_5,
  s_14,
  s_18,
  s_26,
  s_0,
  s_0,
  s_0,
  s_26,
  s_0,
  s_0,
  s_0,
  s_8,
  s_6_10,
  s_18,
  s_5,
  s_7_11_14,
  s_26,
  s_8,
  s_11,
  s_1,
  s_22,
  s_4,
  s_26,
  s_5,
  s_1,
  s_27,
  s_5,
  s_0,
  s_10,
  s_18,
  s_6,
  s_1,
  s_27,
  s_30,
  s_6,
  s_6,
  s_6_35,
  s_18,
  s_10,
  s_5,
  s_5,
  s_5,
  s_5,
  s_10,
  s_6,
  s_5,
  s_5,
  s_5,
  s_1,
  s_6_33_35,
  s_20,
  s_6,
  s_5,
  s_0,
  s_27,
  s_27,
  s_27,
  s_20,
  s_4,
  s_31,
  s_4,
  s_31,
  s_0,
  s_2,
  s_14,
  s_19,
  s_26,
  s_26,
  s_18,
  s_27,
  s_1_0,
  s_26,
  s_26,
  s_26,
  s_8_18,
  s_10_18,
  s_1,
  s_40,
  s_6_0,
  s_5,
  s_18,
  s_6,
  s_18,
  s_20,
  s_20,
  s_6_0,
  s_5,
  s_0,
  s_6,
  s_20,
  s_20,
  s_20,
  s_20,
  s_0,
  s_6,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_20,
  s_6,
  s_9_10_31_32_41,
  s_0,
  s_10,
  s_18,
  s_1_0,
  s_2,
  s_14,
  s_10,
  s_10,
  s_20,
  s_10,
  s_20,
  s_5,
  s_1,
  s_8,
  s_6,
  s_5,
  s_5,
  s_0,
  s_0,
  s_2,
  s_10,
  s_4,
  s_6,
  s_29,
  s_35_41,
  s_23,
  s_23,
  s_23,
  s_23,
  s_5,
  s_5,
  s_6,
  s_6,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6_30_33_35_37_39,
  s_26,
  s_20,
  s_10_18,
  s_18,
  s_27,
  s_22,
  s_18,
  s_8,
  s_10,
  s_20,
  s_6_18,
  s_18,
  s_10,
  s_6,
  s_0,
  s_0,
  s_26,
  s_26,
  s_4_13_14_34,
  s_13_1,
  s_18,
  s_1,
  s_1,
  s_9,
  s_6,
  s_6,
  s_27,
  s_27,
  s_18,
  s_4,
  s_18,
  s_18,
  s_32_42,
  s_7_10_11_23_24,
  s_0,
  s_7,
  s_1_0,
  s_6_7_9_1,
  s_2,
  s_30_31,
  s_0,
  s_4_9_22,
  s_18,
  s_2,
  s_0,
  s_7,
  s_4_7_9_26,
  s_12,
  s_0,
  s_2,
  s_5,
  s_38,
  s_19,
  s_32_35_38_0,
  s_0,
  s_2,
  s_7,
  s_6,
  s_0,
  s_4_7_11_22,
  s_0,
  s_6,
  s_6,
  s_4_7_10_15_31_35_38_39_41,
  s_19,
  s_10_30_31_34,
  s_6,
  s_7,
  s_0,
  s_7,
  s_9_22,
  s_27_1,
  s_6_18,
  s_4,
  s_6,
  s_0,
  s_8_23,
  s_0_1,
  s_27,
  s_20_27,
  s_4,
  s_30,
  s_4,
  s_29_30,
  s_2,
  s_20,
  s_0,
  s_2,
  s_5_0,
  s_9,
  s_30,
  s_6,
  s_9,
  s_30,
  s_6,
  s_6,
  s_0,
  s_30_41,
  s_0,
  s_18,
  s_7_26,
  s_6,
  s_10,
  s_10,
  s_32_38,
  s_4_10,
  s_0,
  s_6,
  s_5,
  s_6,
  s_27,
  s_15,
  s_20,
  s_6_18_35,
  s_6,
  s_30_36,
  s_0,
  s_22_26,
  s_4_26,
  s_30_32,
  s_6,
  s_4_10,
  s_6_8,
  s_7,
  s_0,
  s_6,
  s_6,
  s_9,
  s_18_0,
  s_0,
  s_0,
  s_4_7,
  s_0,
  s_2,
  s_13_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_42,
  s_6,
  s_27,
  s_27,
  s_30_0,
  s_0,
  s_4_27,
  s_1,
  s_1,
  s_30_39_0,
  s_18,
  s_15,
  s_6_21,
  s_6,
  s_7_9_30_32,
  s_1_0,
  s_7,
  s_0,
  s_27,
  s_6,
  s_6,
  s_27,
  s_5,
  s_30,
  s_0,
  s_0,
  s_7_0,
  s_4_10_22,
  s_10_0,
  s_7,
  s_6,
  s_2,
  s_0,
  s_6,
  s_7_26,
  s_20,
  s_1,
  s_19,
  s_20,
  s_1,
  s_26,
  s_8_25_27_29_30,
  s_18,
  s_4_11_31_39,
  s_23,
  s_18,
  s_34,
  s_6_18,
  s_21,
  s_18,
  s_6,
  s_7_11_39,
  s_18,
  s_39_2,
  s_26_30,
  s_6,
  s_2,
  s_26,
  s_17,
  s_5,
  s_0,
  s_4,
  s_4_14,
  s_10,
  s_6,
  s_6_0,
  s_13_14,
  s_28,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4,
  s_18_1,
  s_15,
  s_18,
  s_6,
  s_5,
  s_5,
  s_0,
  s_0,
  s_0,
  s_0,
  s_18,
  s_27,
  s_5,
  s_20,
  s_4,
  s_1,
  s_18,
  s_18,
  s_20,
  s_18,
  s_23,
  s_23,
  s_18,
  s_6,
  s_27,
  s_20,
  s_20,
  s_20,
  s_6,
  s_27,
  s_27,
  s_4_6_7_11_13_18_25_30_34_35_36_38_39_40,
  s_6,
  s_6,
  s_26,
  s_10,
  s_32,
  s_32,
  s_5,
  s_20,
  s_26,
  s_5,
  s_5,
  s_5_0,
  s_26,
  s_10,
  s_7_10,
  s_18,
  s_18,
  s_0_1,
  s_0,
  s_2,
  s_18,
  s_26,
  s_5,
  s_20,
  s_20,
  s_22,
  s_5,
  s_5,
  s_5,
  s_20,
  s_1,
  s_6_17,
  s_0,
  s_5_6_17,
  s_14,
  s_20,
  s_20,
  s_16,
  s_18,
  s_5,
  s_6,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5,
  s_20,
  s_1,
  s_20,
  s_6,
  s_5,
  s_15_1,
  s_18,
  s_20,
  s_0,
  s_31_32_33_36_38_41_0_2,
  s_0,
  s_0,
  s_4_9_10_15_24,
  s_1_0,
  s_7,
  s_0,
  s_10_0,
  s_7,
  s_7,
  s_2,
  s_7,
  s_18,
  s_14,
  s_4,
  s_10,
  s_0,
  s_2,
  s_10,
  s_23,
  s_6_0,
  s_6,
  s_6,
  s_10_26_27_0,
  s_2,
  s_7_26,
  s_35_0,
  s_4,
  s_18,
  s_14_20,
  s_26,
  s_29_30,
  s_14_0,
  s_26,
  s_0,
  s_32,
  s_0,
  s_27,
  s_27,
  s_42,
  s_7_41,
  s_0,
  s_0,
  s_2,
  s_37,
  s_0,
  s_7_12,
  s_10,
  s_30,
  s_32_42,
  s_0,
  s_7,
  s_2,
  s_7_10_26,
  s_32,
  s_32,
  s_10,
  s_10,
  s_30_39,
  s_4_11,
  s_4,
  s_37,
  s_0,
  s_2,
  s_0,
  s_2,
  s_4_12,
  s_10,
  s_4_9_10_12,
  s_31_32,
  s_0,
  s_2,
  s_33_37,
  s_4,
  s_18,
  s_4_0,
  s_30_35,
  s_0,
  s_26,
  s_7_9_30,
  s_0,
  s_35,
  s_36,
  s_4,
  s_41,
  s_26,
  s_4_11_26,
  s_0,
  s_2,
  s_32,
  s_0,
  s_10,
  s_38,
  s_4,
  s_41,
  s_4,
  s_9,
  s_31,
  s_0,
  s_2,
  s_30_35,
  s_35,
  s_4_21,
  s_40,
  s_4_21,
  s_18,
  s_6_25,
  s_0,
  s_0,
  s_10,
  s_4_17_40,
  s_0,
  s_29,
  s_10,
  s_39,
  s_7,
  s_0,
  s_0,
  s_0,
  s_7_9,
  s_35,
  s_4_11_19_22_27_29_30_32_33_35_41,
  s_0,
  s_0,
  s_20,
  s_18,
  s_4,
  s_0,
  s_18,
  s_1_0,
  s_4_7_9_41,
  s_0,
  s_32,
  s_10,
  s_0,
  s_32_39,
  s_0,
  s_10,
  s_6_10_38,
  s_5,
  s_5,
  s_10,
  s_0,
  s_0,
  s_30,
  s_4_7,
  s_30,
  s_30,
  s_30,
  s_4_7,
  s_30,
  s_31_37,
  s_0,
  s_12,
  s_37,
  s_14_0,
  s_12,
  s_12_26,
  s_41,
  s_37,
  s_0,
  s_7_12,
  s_20,
  s_20,
  s_1,
  s_37,
  s_0,
  s_0,
  s_2,
  s_12,
  s_12,
  s_0,
  s_7_35,
  s_0,
  s_26,
  s_4_7_26,
  s_0,
  s_2,
  s_12,
  s_12_37_0,
  s_0,
  s_2,
  s_12,
  s_12,
  s_4,
  s_4,
  s_30_42,
  s_0,
  s_26,
  s_0,
  s_4_7_10_26_42,
  s_4_7,
  s_0,
  s_2,
  s_0,
  s_6,
  s_4_21_32_40,
  s_31_37,
  s_6,
  s_32_37,
  s_0,
  s_4_10_12,
  s_0,
  s_2,
  s_10_32,
  s_0,
  s_2,
  s_4_7_10,
  s_31_32_36_39_40,
  s_0,
  s_0,
  s_18,
  s_4_9_10,
  s_26_31_32,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7_9,
  s_7_11,
  s_0,
  s_0,
  s_26,
  s_7_9_26,
  s_0,
  s_0,
  s_0,
  s_31_39_41_0,
  s_0,
  s_4_9,
  s_0,
  s_18,
  s_0,
  s_0,
  s_2,
  s_7,
  s_6_11,
  s_32,
  s_18,
  s_10,
  s_10_12_32_37,
  s_0,
  s_2,
  s_7,
  s_26,
  s_0,
  s_38,
  s_4,
  s_4,
  s_40,
  s_11,
  s_0,
  s_40,
  s_30,
  s_4,
  s_42,
  s_30,
  s_37,
  s_0,
  s_0,
  s_9,
  s_35,
  s_41,
  s_0,
  s_4,
  s_30_35,
  s_4,
  s_29_35_42,
  s_0,
  s_4,
  s_18,
  s_26,
  s_30,
  s_4,
  s_26_31,
  s_9_26_41,
  s_9_26_41,
  s_4_7,
  s_35,
  s_0,
  s_4_7,
  s_9,
  s_30,
  s_4,
  s_41,
  s_0,
  s_4,
  s_26,
  s_29_35,
  s_4,
  s_26_32_37_41,
  s_0,
  s_0,
  s_2,
  s_7,
  s_37,
  s_0,
  s_12,
  s_4_6_7_39,
  s_0,
  s_12_37_39,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_6_13_18_23_30_34,
  s_26,
  s_0,
  s_30,
  s_7,
  s_6,
  s_37,
  s_0,
  s_0,
  s_10_12,
  s_0,
  s_35,
  s_0,
  s_0,
  s_23,
  s_0,
  s_2,
  s_4_7,
  s_7_26_40_41,
  s_0,
  s_7,
  s_2,
  s_0,
  s_7_26_40_41,
  s_0,
  s_7,
  s_2,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_18,
  s_4,
  s_27,
  s_0,
  s_9_37,
  s_0,
  s_0,
  s_9,
  s_36,
  s_16,
  s_7_12,
  s_31,
  s_0,
  s_29,
  s_6_0,
  s_4,
  s_40,
  s_4,
  s_22,
  s_10,
  s_0,
  s_2,
  s_7,
  s_40,
  s_4,
  s_0,
  s_0,
  s_30,
  s_11_22_26,
  s_0,
  s_41,
  s_9,
  s_0,
  s_2,
  s_9,
  s_4,
  s_30_40_41,
  s_4,
  s_42,
  s_35,
  s_0,
  s_35_41_0,
  s_0,
  s_2,
  s_26,
  s_0,
  s_4_26,
  s_0,
  s_26,
  s_6_25_36,
  s_6,
  s_0,
  s_0,
  s_9_12_37,
  s_0,
  s_30,
  s_0,
  s_4_11_26,
  s_35_38,
  s_4,
  s_4,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_30_36,
  s_0,
  s_4,
  s_4,
  s_12_37,
  s_0,
  s_0,
  s_35,
  s_11,
  s_30_32_41,
  s_4_10,
  s_0,
  s_0,
  s_4_10,
  s_0,
  s_4_38,
  s_18,
  s_15,
  s_4_7,
  s_0,
  s_2,
  s_41,
  s_32_41,
  s_0,
  s_26_30_37,
  s_0,
  s_7_26,
  s_0,
  s_4_26,
  s_41,
  s_0,
  s_4_26,
  s_41,
  s_0,
  s_39,
  s_39,
  s_9,
  s_0,
  s_0,
  s_32_40,
  s_10,
  s_10,
  s_32,
  s_4_10,
  s_18,
  s_0,
  s_2,
  s_0,
  s_7,
  s_7,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4_7_10_35_38_41,
  s_18,
  s_38,
  s_7,
  s_0,
  s_7,
  s_6,
  s_4_21,
  s_29_40_41,
  s_0,
  s_6_18,
  s_4,
  s_30_32_35_38,
  s_0,
  s_4_7_11,
  s_0,
  s_37,
  s_0,
  s_2,
  s_12,
  s_0,
  s_38_41,
  s_4_11_22,
  s_4_6_10_39_41,
  s_37,
  s_0,
  s_0,
  s_2,
  s_12,
  s_35_40,
  s_38_41,
  s_6_0,
  s_4_6_7,
  s_30_31_35_40,
  s_0,
  s_4_7_9,
  s_40,
  s_0,
  s_4_9,
  s_4,
  s_38,
  s_4_9,
  s_25,
  s_0,
  s_0,
  s_2,
  s_31,
  s_18,
  s_0,
  s_18,
  s_10,
  s_0,
  s_2,
  s_0,
  s_4_10_32,
  s_0,
  s_4_7,
  s_0,
  s_30_32,
  s_0,
  s_7_12_37,
  s_0,
  s_0,
  s_2,
  s_12,
  s_10,
  s_18,
  s_4_9_31_32,
  s_0,
  s_2,
  s_2,
  s_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_26,
  s_7_9_10_31_41,
  s_0,
  s_2,
  s_29,
  s_30_32,
  s_0,
  s_4_11_26,
  s_0,
  s_2,
  s_32,
  s_12,
  s_0,
  s_0,
  s_37,
  s_31_35,
  s_0,
  s_4_9,
  s_32_36_39,
  s_18,
  s_4_10,
  s_32,
  s_4_7_10,
  s_0,
  s_18,
  s_10_26,
  s_4_10_32_41,
  s_18,
  s_0,
  s_0,
  s_0,
  s_32,
  s_10,
  s_4,
  s_41,
  s_10,
  s_18_0,
  s_11,
  s_0,
  s_0,
  s_7,
  s_30,
  s_22,
  s_7,
  s_39,
  s_4,
  s_0,
  s_18,
  s_34_38_42,
  s_0,
  s_4_11,
  s_0,
  s_30_31_41,
  s_4_22_26,
  s_0,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_22,
  s_0,
  s_10_30_37_38,
  s_0,
  s_27,
  s_27,
  s_22,
  s_7_9_26,
  s_0,
  s_30_39,
  s_32,
  s_10,
  s_0,
  s_10,
  s_7,
  s_6_26_0,
  s_0,
  s_2,
  s_7_12_15_28_38_42,
  s_0,
  s_2,
  s_12,
  s_0,
  s_2,
  s_7,
  s_4_6_12_26_36,
  s_30,
  s_0,
  s_4_26,
  s_4_26,
  s_23,
  s_29_30,
  s_29_30,
  s_27,
  s_22_27,
  s_18,
  s_6,
  s_22,
  s_0,
  s_7_9_10_26,
  s_0,
  s_2,
  s_7,
  s_2,
  s_7_26,
  s_31_32_39,
  s_0,
  s_0,
  s_26,
  s_30_32_35,
  s_0,
  s_0,
  s_4_11_19_25,
  s_18,
  s_37,
  s_0,
  s_2,
  s_4_9,
  s_40,
  s_4,
  s_0,
  s_0,
  s_4_12_26_37_41,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_17,
  s_32_35_38_40_41_42,
  s_0,
  s_6_18,
  s_4_7_9,
  s_1,
  s_0,
  s_2,
  s_6_14_18,
  s_15_41,
  s_7_9_31,
  s_0,
  s_2,
  s_7,
  s_30_35_37,
  s_4_11_26,
  s_0,
  s_18,
  s_0,
  s_2,
  s_6,
  s_30,
  s_4,
  s_35_41,
  s_0,
  s_26,
  s_26,
  s_0,
  s_0,
  s_10,
  s_10,
  s_20,
  s_6_17_35_38_40,
  s_20,
  s_26_37,
  s_22,
  s_10,
  s_1,
  s_20,
  s_10_32,
  s_10,
  s_26,
  s_6,
  s_6,
  s_0,
  s_18,
  s_32,
  s_4_10,
  s_1,
  s_6_10_14,
  s_35_42,
  s_4,
  s_4_6_38,
  s_5_18,
  s_38_42,
  s_4_7_9_11,
  s_4_9,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_26,
  s_0,
  s_30,
  s_4,
  s_0,
  s_18,
  s_7,
  s_38_40_41,
  s_0,
  s_26,
  s_26,
  s_26,
  s_10,
  s_0,
  s_2,
  s_30_40_41,
  s_4_10,
  s_0,
  s_15_26_31_35_38_41_42,
  s_0,
  s_21_23,
  s_6_18,
  s_9_10,
  s_0,
  s_18_35_39_0,
  s_2,
  s_18,
  s_4_11,
  s_7_9_13_18,
  s_7,
  s_0,
  s_4_9_10_14,
  s_1_0,
  s_0,
  s_23,
  s_4_41,
  s_0,
  s_18,
  s_4,
  s_17,
  s_32,
  s_10,
  s_10,
  s_21,
  s_6_10_14,
  s_18,
  s_6_15,
  s_14,
  s_15,
  s_29,
  s_1,
  s_1,
  s_2,
  s_26,
  s_30_0,
  s_15,
  s_15,
  s_15,
  s_18_1,
  s_18,
  s_18,
  s_18,
  s_23,
  s_23,
  s_23,
  s_26,
  s_10,
  s_10,
  s_15,
  s_27,
  s_15,
  s_17,
  s_15,
  s_0,
  s_5,
  s_5,
  s_23,
  s_15,
  s_5,
  s_5,
  s_14_18,
  s_18,
  s_9,
  s_0,
  s_7,
  s_5_6_20_35_38_40,
  s_4_6_21,
  s_18,
  s_9_10_32,
  s_18,
  s_4,
  s_15,
  s_18,
  s_15,
  s_4_18_29_30,
  s_1,
  s_10,
  s_5,
  s_1,
  s_18,
  s_10,
  s_18_0,
  s_1,
  s_2,
  s_9,
  s_10,
  s_6_10_21_31_32,
  s_1,
  s_10_1_0,
  s_4_10,
  s_0,
  s_14,
  s_20_38,
  s_18,
  s_0,
  s_0,
  s_4,
  s_25,
  s_25,
  s_15,
  s_4_9_10_32_38,
  s_6,
  s_13_18,
  s_4_10,
  s_18,
  s_0,
  s_5_18,
  s_15,
  s_20,
  s_5_14,
  s_14,
  s_18,
  s_6_27,
  s_35,
  s_5_6_13_18_38,
  s_20,
  s_6,
  s_18,
  s_4_11_33_36,
  s_18,
  s_5,
  s_0,
  s_2,
  s_7,
  s_10,
  s_5,
  s_0,
  s_2,
  s_5,
  s_6_9,
  s_5,
  s_6_25,
  s_0,
  s_9_10,
  s_1_0,
  s_0,
  s_2,
  s_32,
  s_9,
  s_18,
  s_32,
  s_18,
  s_10,
  s_6_38,
  s_6_8_20,
  s_4,
  s_28,
  s_20,
  s_5,
  s_10,
  s_15,
  s_14,
  s_6,
  s_4,
  s_14,
  s_14,
  s_14_23,
  s_0,
  s_0,
  s_18,
  s_2,
  s_19_26,
  s_4_21,
  s_0,
  s_2,
  s_12,
  s_18_0,
  s_7,
  s_7,
  s_0,
  s_0,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_6_18,
  s_10_21_23,
  s_5,
  s_6,
  s_23,
  s_6,
  s_6,
  s_13,
  s_6,
  s_6,
  s_27,
  s_1,
  s_12,
  s_0,
  s_12,
  s_0,
  s_5,
  s_5_13,
  s_18,
  s_0,
  s_2,
  s_9_14_15_26,
  s_20,
  s_20,
  s_6_8_25,
  s_0,
  s_18_0_1,
  s_2,
  s_30,
  s_0,
  s_4_7_22,
  s_30,
  s_4_7,
  s_30,
  s_6_15_42,
  s_1,
  s_41_42,
  s_6,
  s_7_19_26,
  s_8_10_0,
  s_41_42,
  s_0,
  s_0,
  s_4_26,
  s_18,
  s_18,
  s_18,
  s_37,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_15,
  s_1,
  s_18_1,
  s_5,
  s_28,
  s_18,
  s_14_15_26,
  s_5,
  s_6_18,
  s_4,
  s_4,
  s_18,
  s_18,
  s_10_17_18_29,
  s_10,
  s_18,
  s_40,
  s_18,
  s_4_21,
  s_9,
  s_18_1,
  s_18,
  s_15,
  s_15,
  s_0,
  s_18,
  s_15,
  s_15,
  s_23_39,
  s_6,
  s_18,
  s_6,
  s_5_10,
  s_4,
  s_18,
  s_18,
  s_18,
  s_1,
  s_1,
  s_0,
  s_18,
  s_13,
  s_20,
  s_6,
  s_20,
  s_6_36,
  s_5_6,
  s_18,
  s_6,
  s_6,
  s_18,
  s_11_32,
  s_14_0,
  s_11_28,
  s_6_7,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_6,
  s_6,
  s_6,
  s_18,
  s_6_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_27,
  s_27,
  s_27,
  s_6_10_13_18_29_30_34,
  s_0,
  s_0,
  s_18,
  s_23,
  s_18,
  s_0,
  s_17,
  s_5,
  s_14_18_1,
  s_10_1,
  s_6,
  s_15_18,
  s_18,
  s_5,
  s_6,
  s_4_26,
  s_0,
  s_6,
  s_0,
  s_28,
  s_6,
  s_5,
  s_0,
  s_20,
  s_20,
  s_0,
  s_2,
  s_4,
  s_0,
  s_2,
  s_8,
  s_15,
  s_5_6,
  s_5,
  s_20,
  s_10_14,
  s_6_23,
  s_6_23_26_29_30,
  s_0,
  s_6,
  s_6,
  s_4,
  s_29,
  s_6,
  s_6,
  s_18,
  s_6,
  s_10,
  s_18,
  s_1,
  s_18,
  s_1,
  s_18,
  s_6_10_14_25_30_32_35_42,
  s_28,
  s_18,
  s_37_42,
  s_0,
  s_5,
  s_0,
  s_5,
  s_2,
  s_27,
  s_0,
  s_15,
  s_4_9_18_30_35_36_38_40_0_2,
  s_0,
  s_4,
  s_6,
  s_4,
  s_10,
  s_6,
  s_9,
  s_23,
  s_6,
  s_4_22,
  s_21,
  s_2,
  s_7_9_31,
  s_18,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_2,
  s_2,
  s_4_6_29,
  s_13_21,
  s_13_18,
  s_13_25,
  s_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_20,
  s_20,
  s_2,
  s_5,
  s_30_35_38_42_43,
  s_4,
  s_5_10_13_17_18,
  s_6,
  s_5,
  s_15,
  s_6_42,
  s_0,
  s_9,
  s_20,
  s_18,
  s_2,
  s_7,
  s_18,
  s_13_18_0,
  s_6,
  s_4,
  s_21_40,
  s_0,
  s_0,
  s_21,
  s_5,
  s_18,
  s_4_5_8_17_18_30_33_34_35_38_0_2,
  s_10,
  s_0,
  s_6_0,
  s_19,
  s_6,
  s_11_19,
  s_2_0,
  s_7_31,
  s_0,
  s_12,
  s_11_17_2_0,
  s_7,
  s_18,
  s_0,
  s_40,
  s_0,
  s_30_32,
  s_19,
  s_2_0,
  s_7,
  s_2,
  s_0,
  s_4,
  s_9,
  s_30_41,
  s_4,
  s_17,
  s_4,
  s_6_0_2,
  s_0,
  s_0_2,
  s_0_2,
  s_10,
  s_4,
  s_4,
  s_28,
  s_15_0_2,
  s_0,
  s_4,
  s_2_0,
  s_2,
  s_2,
  s_2_0,
  s_0,
  s_21,
  s_9_30_35_42,
  s_6_18,
  s_9,
  s_6,
  s_6,
  s_10,
  s_6,
  s_18,
  s_6,
  s_18,
  s_18,
  s_6,
  s_6,
  s_4_29,
  s_23_0,
  s_23,
  s_6,
  s_0,
  s_10,
  s_10,
  s_15,
  s_7_0,
  s_20,
  s_2,
  s_7,
  s_20,
  s_20,
  s_20,
  s_23,
  s_23,
  s_5_17_18,
  s_20,
  s_1,
  s_20,
  s_18_20,
  s_26,
  s_5,
  s_5_20,
  s_4_6_7_10_13_19_21_33_36,
  s_18,
  s_18,
  s_4,
  s_18,
  s_4,
  s_18,
  s_0,
  s_4_6_7_9_19_30_32_34_35_38_42,
  s_6_13,
  s_6_18,
  s_0,
  s_2,
  s_30,
  s_0,
  s_6_14,
  s_18,
  s_5_17_18,
  s_5,
  s_5,
  s_20,
  s_18_41,
  s_6,
  s_4_6_30_34_38,
  s_4,
  s_6,
  s_0,
  s_0,
  s_6,
  s_6,
  s_5_18,
  s_23,
  s_7_10_11,
  s_6,
  s_0_1,
  s_2,
  s_4_10,
  s_4,
  s_32_36,
  s_18,
  s_4,
  s_32_36,
  s_1,
  s_1,
  s_10,
  s_13,
  s_6_7_35,
  s_0,
  s_18,
  s_6,
  s_0,
  s_2,
  s_4_6_7_13_19_36,
  s_4,
  s_18,
  s_0,
  s_10_18,
  s_10,
  s_4_6_11_17_18_29_30_31_32_33_34_35_36_37_38_40_41_42,
  s_7,
  s_6,
  s_6,
  s_18,
  s_6_18,
  s_6,
  s_4_6_10,
  s_6,
  s_10_32,
  s_18,
  s_0,
  s_6,
  s_6,
  s_6,
  s_6,
  s_5,
  s_12_37_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_8,
  s_6,
  s_6,
  s_9_12_26_36_39,
  s_0,
  s_18,
  s_2,
  s_2,
  s_12,
  s_9,
  s_9,
  s_0,
  s_0,
  s_9,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_6,
  s_6_35,
  s_6,
  s_23,
  s_17,
  s_18,
  s_5,
  s_30_34_43,
  s_0,
  s_4,
  s_5,
  s_5,
  s_15,
  s_6_29_30_35_36_38_0,
  s_4,
  s_0,
  s_6_18,
  s_4_6_11_13,
  s_18,
  s_4,
  s_0,
  s_18,
  s_17,
  s_18,
  s_23,
  s_4_8_11_29_35_38,
  s_18,
  s_4,
  s_23,
  s_0,
  s_6_27,
  s_6_9_17_19_22_30_35_38_42,
  s_11,
  s_18,
  s_5,
  s_4_0,
  s_27,
  s_4_5_6_31_35,
  s_0,
  s_4,
  s_2,
  s_20,
  s_4_13_17_31_34,
  s_13_0,
  s_18,
  s_4,
  s_6_11_35_38,
  s_0,
  s_11,
  s_2,
  s_7,
  s_11_2,
  s_13,
  s_0,
  s_6_27,
  s_4_6_7_26_32_33_34_35_36_38_41_42,
  s_8_10_29,
  s_18,
  s_0,
  s_6_10_18,
  s_6,
  s_6,
  s_4_0,
  s_6,
  s_19_35_43,
  s_0,
  s_0,
  s_14,
  s_4,
  s_6_10,
  s_0,
  s_4_10,
  s_5,
  s_5,
  s_5,
  s_6,
  s_5,
  s_6,
  s_5_6_10_18_32_39,
  s_10,
  s_8_10_29_37,
  s_18,
  s_25_30_38_42,
  s_0,
  s_2,
  s_0,
  s_4_6_7_11_15_17_23_25_29_30_31_32_33_34_35_38_40_41_42,
  s_36,
  s_4_35,
  s_18,
  s_23,
  s_10,
  s_18,
  s_6,
  s_0,
  s_27,
  s_20,
  s_0,
  s_26,
  s_20,
  s_20,
  s_6,
  s_6,
  s_5,
  s_5,
  s_20,
  s_27,
  s_26_28,
  s_26_28,
  s_6_14,
  s_18,
  s_30_35_38_42,
  s_4_29,
  s_2,
  s_26,
  s_0,
  s_0,
  s_35,
  s_4_11,
  s_18_41,
  s_4,
  s_0,
  s_6_29_34,
  s_0,
  s_6,
  s_4,
  s_18,
  s_0,
  s_6,
  s_18,
  s_9,
  s_5_6_11_25_31_36_39,
  s_4_10_11,
  s_18,
  s_4,
  s_5,
  s_6_0,
  s_17,
  s_18,
  s_4,
  s_6_13,
  s_18_0,
  s_18,
  s_0,
  s_2,
  s_4_26,
  s_1,
  s_20,
  s_20,
  s_18,
  s_26,
  s_9,
  s_18,
  s_18_30_0,
  s_18,
  s_20,
  s_20,
  s_18,
  s_6_35,
  s_6,
  s_6,
  s_2,
  s_5,
  s_20,
  s_20,
  s_7_26,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_6,
  s_27,
  s_6,
  s_14,
  s_26,
  s_23,
  s_0,
  s_9,
  s_18,
  s_1,
  s_7_14,
  s_9_32_41,
  s_15,
  s_27,
  s_6,
  s_9,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_15,
  s_18,
  s_27,
  s_13,
  s_15,
  s_15,
  s_18,
  s_18,
  s_1,
  s_21,
  s_18,
  s_18,
  s_18,
  s_15,
  s_5_6_13_23_32_38,
  s_5_0,
  s_6,
  s_4,
  s_5_13,
  s_6,
  s_4,
  s_20,
  s_18,
  s_6_8_20,
  s_0,
  s_7,
  s_7,
  s_1,
  s_8,
  s_8,
  s_11_18_0,
  s_18,
  s_6,
  s_12,
  s_6,
  s_7_21_0_2,
  s_4_33,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_4_10_14_23,
  s_10_14,
  s_13,
  s_6,
  s_18,
  s_6,
  s_18,
  s_5,
  s_5,
  s_5,
  s_6,
  s_18,
  s_18,
  s_15_26,
  s_0,
  s_6,
  s_39,
  s_6,
  s_18,
  s_39,
  s_30_35_39_0,
  s_18,
  s_0,
  s_18,
  s_7_9,
  s_2,
  s_5,
  s_15,
  s_2,
  s_14,
  s_18,
  s_0,
  s_18,
  s_6_18,
  s_31,
  s_0,
  s_0,
  s_2,
  s_9,
  s_0,
  s_0,
  s_6,
  s_6,
  s_5,
  s_0,
  s_0,
  s_6_18_36_0,
  s_6_10_15_22_35_38_40,
  s_6,
  s_6,
  s_7,
  s_4,
  s_13,
  s_13,
  s_26,
  s_15,
  s_6,
  s_1_0,
  s_18,
  s_5_7_30_32_37_0,
  s_18,
  s_18,
  s_0,
  s_0,
  s_18,
  s_17,
  s_27_29_30,
  s_6,
  s_6,
  s_14_26,
  s_4_34_35,
  s_18,
  s_18,
  s_4_15,
  s_14,
  s_4_15_26,
  s_5,
  s_5,
  s_10_14_23,
  s_23_0,
  s_1,
  s_8,
  s_10,
  s_6,
  s_18_32,
  s_4,
  s_0,
  s_6_30_0,
  s_7,
  s_0,
  s_0,
  s_6_30_36_42_0,
  s_4_6,
  s_6,
  s_5,
  s_0,
  s_4_10,
  s_8,
  s_7,
  s_0,
  s_6,
  s_27,
  s_1,
  s_27,
  s_20,
  s_26,
  s_15,
  s_18,
  s_18,
  s_7_28,
  s_24,
  s_15,
  s_15,
  s_6,
  s_18,
  s_7,
  s_18,
  s_5_15,
  s_13_20,
  s_20,
  s_20,
  s_18,
  s_20,
  s_20,
  s_18,
  s_15,
  s_20,
  s_15,
  s_18,
  s_15,
  s_5,
  s_28_30,
  s_7_26,
  s_0,
  s_15,
  s_27_35,
  s_6,
  s_6,
  s_6,
  s_4_6_19,
  s_26,
  s_0,
  s_18,
  s_6,
  s_6_23,
  s_23,
  s_6,
  s_10,
  s_0,
  s_10_18_1,
  s_18,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_21,
  s_18,
  s_6,
  s_6,
  s_18,
  s_3_18_41_42,
  s_0,
  s_7,
  s_26,
  s_18,
  s_31_32_42,
  s_18,
  s_6,
  s_30,
  s_11_0,
  s_23,
  s_1,
  s_14,
  s_18,
  s_18,
  s_27_30,
  s_0,
  s_4,
  s_18,
  s_27,
  s_20,
  s_27,
  s_28_0,
  s_10,
  s_6_18_35,
  s_18,
  s_16_0_1,
  s_0,
  s_2,
  s_9,
  s_30,
  s_7_9,
  s_6_30,
  s_18,
  s_18,
  s_30,
  s_6,
  s_6,
  s_6,
  s_18,
  s_1,
  s_14,
  s_23,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_5,
  s_26,
  s_26,
  s_0,
  s_26,
  s_1,
  s_9,
  s_26,
  s_26,
  s_18_0,
  s_26,
  s_18_1_0,
  s_26,
  s_0,
  s_26,
  s_26,
  s_26,
  s_26,
  s_18_0,
  s_26,
  s_26,
  s_10,
  s_0,
  s_26,
  s_12,
  s_0,
  s_26,
  s_1,
  s_26,
  s_0,
  s_0,
  s_26,
  s_0,
  s_0,
  s_27,
  s_26,
  s_26,
  s_10_26,
  s_0_1,
  s_26,
  s_26,
  s_5,
  s_15,
  s_5,
  s_2_0,
  s_5,
  s_18,
  s_11_0,
  s_2,
  s_7_12,
  s_5_10_21_23_33_35,
  s_5,
  s_11,
  s_18,
  s_8_9_20,
  s_26,
  s_6,
  s_8,
  s_0,
  s_6,
  s_10,
  s_18,
  s_18,
  s_6,
  s_15_26,
  s_0,
  s_2_0,
  s_2_0,
  s_7,
  s_8,
  s_0_2,
  s_0,
  s_7_10_31,
  s_6,
  s_40,
  s_0,
  s_18,
  s_21_0,
  s_2,
  s_7_12,
  s_21,
  s_6,
  s_6,
  s_6,
  s_15,
  s_6,
  s_15,
  s_0,
  s_6_9_15_17_27_35_39,
  s_20,
  s_0,
  s_0,
  s_1,
  s_6,
  s_4,
  s_0,
  s_18,
  s_0,
  s_18,
  s_13_20,
  s_11_26,
  s_0,
  s_20,
  s_20,
  s_6,
  s_5,
  s_1_0,
  s_27,
  s_5,
  s_10,
  s_4_7_26_29_30_37_38,
  s_0,
  s_6,
  s_4_7,
  s_2,
  s_4_7_12,
  s_4_11,
  s_15_24_0_2,
  s_0,
  s_19_28,
  s_19_2_0,
  s_0,
  s_18,
  s_0,
  s_28,
  s_18,
  s_0,
  s_0,
  s_24_2_0,
  s_2,
  s_0_2,
  s_0,
  s_7,
  s_30_34_37,
  s_13_0,
  s_13,
  s_13_18,
  s_6,
  s_4,
  s_13,
  s_6,
  s_39,
  s_18,
  s_11_22_30_33_38,
  s_22,
  s_11,
  s_20,
  s_20,
  s_18_1,
  s_23,
  s_21,
  s_18,
  s_24,
  s_26,
  s_0,
  s_10,
  s_30,
  s_27,
  s_30,
  s_7_20_0,
  s_1,
  s_17,
  s_24,
  s_7,
  s_0,
  s_2,
  s_10,
  s_22,
  s_20,
  s_5,
  s_4,
  s_20,
  s_10,
  s_18_0,
  s_2,
  s_7_25,
  s_22_26,
  s_18,
  s_10,
  s_18_1,
  s_1,
  s_2,
  s_4_9,
  s_10,
  s_9,
  s_4,
  s_0,
  s_26,
  s_0,
  s_18,
  s_22,
  s_22,
  s_8,
  s_10,
  s_6_14_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_6,
  s_20,
  s_4_7_10_18_32_39_42,
  s_10,
  s_6,
  s_4,
  s_10,
  s_6,
  s_4,
  s_6,
  s_4,
  s_0,
  s_0,
  s_4_10,
  s_0,
  s_0,
  s_4,
  s_5,
  s_0,
  s_18,
  s_18,
  s_13,
  s_26,
  s_7_10,
  s_18_0,
  s_9,
  s_18,
  s_11_39_42,
  s_22,
  s_15,
  s_10,
  s_4,
  s_10,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9_26,
  s_1,
  s_18,
  s_9,
  s_18,
  s_1_0,
  s_1_0,
  s_2,
  s_9,
  s_40,
  s_18,
  s_18,
  s_40,
  s_18,
  s_4_7_9_14,
  s_14,
  s_14,
  s_4,
  s_4,
  s_10,
  s_5_13,
  s_7,
  s_6_26,
  s_0,
  s_2,
  s_4,
  s_26,
  s_26,
  s_5,
  s_5,
  s_1,
  s_1,
  s_18,
  s_0,
  s_7,
  s_5,
  s_7,
  s_1,
  s_5,
  s_8_27,
  s_5,
  s_5,
  s_5,
  s_0,
  s_5_1,
  s_5,
  s_26,
  s_15,
  s_18,
  s_18_1,
  s_0,
  s_0,
  s_10,
  s_10,
  s_10_14,
  s_26,
  s_0,
  s_7_26,
  s_13,
  s_5,
  s_5,
  s_10,
  s_10_13,
  s_18,
  s_20,
  s_11_18_38,
  s_6,
  s_20,
  s_26,
  s_0,
  s_9_15,
  s_0,
  s_5,
  s_5_0,
  s_0,
  s_0,
  s_18,
  s_18,
  s_6_7_15_25_35_38_40,
  s_0,
  s_0,
  s_6_18,
  s_2,
  s_2,
  s_12,
  s_6,
  s_0,
  s_7,
  s_13_0,
  s_7,
  s_10,
  s_9,
  s_6,
  s_0,
  s_32,
  s_0,
  s_15,
  s_15,
  s_18,
  s_30_32,
  s_0,
  s_10,
  s_9_10_14,
  s_10_18,
  s_10_1,
  s_32,
  s_18,
  s_32,
  s_2,
  s_4,
  s_15,
  s_5,
  s_5,
  s_15_18,
  s_22,
  s_6,
  s_6,
  s_27,
  s_31_41,
  s_0,
  s_18,
  s_4_7_9_14,
  s_1_0,
  s_18,
  s_2,
  s_18,
  s_0,
  s_18,
  s_30_36,
  s_39,
  s_4,
  s_18,
  s_18_1,
  s_18,
  s_18,
  s_18,
  s_14,
  s_10,
  s_5_13,
  s_15,
  s_5,
  s_20,
  s_0,
  s_5,
  s_5,
  s_0,
  s_2,
  s_7,
  s_0,
  s_35,
  s_30_35_37,
  s_0,
  s_4_22,
  s_7_9_10_19_26_36_41,
  s_0,
  s_18,
  s_0,
  s_2,
  s_7,
  s_7,
  s_8_18,
  s_21,
  s_0,
  s_7,
  s_2,
  s_7,
  s_36,
  s_4,
  s_7,
  s_0,
  s_7,
  s_30,
  s_30,
  s_18,
  s_8_0,
  s_30,
  s_7_22,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_9_24,
  s_0,
  s_2,
  s_6,
  s_4,
  s_30,
  s_19_22_26_28,
  s_0,
  s_22,
  s_27_0,
  s_27,
  s_22,
  s_4,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_7,
  s_0,
  s_30_38,
  s_4_10,
  s_0,
  s_2,
  s_7,
  s_5,
  s_18_0,
  s_9,
  s_26,
  s_26,
  s_18,
  s_20,
  s_29,
  s_5_8_13_35,
  s_5,
  s_6,
  s_6,
  s_5,
  s_13,
  s_18,
  s_13,
  s_13_20,
  s_13,
  s_13,
  s_17,
  s_6,
  s_6,
  s_20,
  s_18,
  s_9_12,
  s_18_0,
  s_7,
  s_7_9,
  s_18,
  s_0,
  s_0,
  s_16,
  s_18,
  s_7_12,
  s_18,
  s_0,
  s_0,
  s_2,
  s_41,
  s_0,
  s_4_11_30,
  s_4,
  s_5,
  s_5,
  s_14,
  s_15,
  s_10_18_1,
  s_18,
  s_9,
  s_15,
  s_7,
  s_18,
  s_18,
  s_23,
  s_23,
  s_20,
  s_18,
  s_5,
  s_5_6,
  s_0,
  s_7,
  s_18,
  s_18,
  s_9,
  s_6_14_23_0,
  s_23_0,
  s_24_0,
  s_23,
  s_0,
  s_23_24_0,
  s_28,
  s_24_0,
  s_21,
  s_0,
  s_4_14,
  s_7,
  s_23_0,
  s_18,
  s_5,
  s_5,
  s_15,
  s_18,
  s_1,
  s_27,
  s_18,
  s_5,
  s_15,
  s_10,
  s_18,
  s_18,
  s_18,
  s_4,
  s_2,
  s_8_29_32,
  s_10_22,
  s_18,
  s_29_35_38,
  s_4,
  s_6_18,
  s_10,
  s_18,
  s_14,
  s_30_32_36_0,
  s_0,
  s_2,
  s_7,
  s_4_7_10_11,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_15,
  s_10_18,
  s_10,
  s_7_12,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_38,
  s_44,
  s_5,
  s_5,
  s_19,
  s_27,
  s_6_0,
  s_0,
  s_7,
  s_0,
  s_8,
  s_27,
  s_6,
  s_26,
  s_37,
  s_0,
  s_5,
  s_5,
  s_5,
  s_0,
  s_12_26,
  s_6,
  s_17,
  s_5_6_8_35_38,
  s_4,
  s_28,
  s_18_20_0,
  s_13_20,
  s_14_0,
  s_4,
  s_18_0,
  s_9,
  s_0,
  s_20,
  s_14_31_41_0,
  s_0,
  s_4_9_26,
  s_41,
  s_4_10,
  s_4_0,
  s_18,
  s_1_0,
  s_14,
  s_18,
  s_6_1_0,
  s_1,
  s_2,
  s_18,
  s_12_19,
  s_4,
  s_30_37,
  s_0,
  s_10,
  s_6,
  s_1,
  s_4,
  s_4,
  s_1,
  s_9,
  s_41,
  s_4,
  s_18,
  s_6,
  s_22,
  s_6,
  s_10,
  s_6,
  s_1,
  s_6,
  s_18,
  s_4_22,
  s_27,
  s_6_1,
  s_6,
  s_1,
  s_9,
  s_9_19,
  s_1,
  s_6,
  s_1,
  s_10,
  s_6,
  s_4,
  s_17,
  s_0,
  s_7,
  s_0,
  s_1,
  s_2,
  s_9,
  s_22,
  s_1,
  s_5,
  s_5_6,
  s_6_35,
  s_18,
  s_0,
  s_10,
  s_6,
  s_4,
  s_9,
  s_1,
  s_2,
  s_9,
  s_4,
  s_18,
  s_4,
  s_27,
  s_0,
  s_7,
  s_0,
  s_2,
  s_1_0,
  s_36,
  s_18,
  s_36,
  s_10,
  s_6_9_15_25_26_27,
  s_1_0,
  s_2,
  s_1_0,
  s_19,
  s_20,
  s_20,
  s_5,
  s_5_10,
  s_26,
  s_5,
  s_0,
  s_20,
  s_5,
  s_20,
  s_20,
  s_5,
  s_30_38_41,
  s_6_0,
  s_4_6_7_11_17_24_26,
  s_6,
  s_14_23_0,
  s_24_0,
  s_7_18,
  s_1_0,
  s_0,
  s_0,
  s_18,
  s_18,
  s_31_36_37,
  s_9,
  s_0,
  s_31,
  s_7,
  s_0,
  s_18,
  s_29_30_31_33_42,
  s_4_9_22,
  s_17,
  s_4,
  s_27,
  s_5,
  s_18,
  s_4,
  s_15,
  s_9_22,
  s_14_0,
  s_9,
  s_18,
  s_13_27,
  s_6,
  s_18,
  s_18_1,
  s_5,
  s_5,
  s_20,
  s_6,
  s_15,
  s_18,
  s_18,
  s_25,
  s_22,
  s_25_0,
  s_0,
  s_0,
  s_0,
  s_7,
  s_18,
  s_18,
  s_28,
  s_20,
  s_15,
  s_20,
  s_14,
  s_32,
  s_10,
  s_1_0,
  s_18,
  s_20,
  s_30_0,
  s_0,
  s_4_6_7,
  s_38,
  s_4,
  s_5,
  s_5,
  s_10,
  s_0,
  s_2,
  s_15,
  s_2,
  s_20,
  s_6,
  s_27,
  s_31_32,
  s_10,
  s_0,
  s_32_38_42,
  s_4,
  s_28,
  s_4,
  s_0,
  s_7,
  s_35,
  s_22,
  s_5_13,
  s_19,
  s_6,
  s_0,
  s_20,
  s_1_0,
  s_9,
  s_5,
  s_30,
  s_0,
  s_7,
  s_10_32,
  s_29_30,
  s_4_11_27,
  s_41,
  s_0,
  s_4,
  s_18,
  s_0,
  s_18,
  s_0,
  s_29_30_0,
  s_0,
  s_4_7,
  s_40,
  s_18,
  s_4,
  s_42,
  s_6,
  s_10_41,
  s_30_38_41,
  s_4,
  s_4,
  s_37_41,
  s_0,
  s_0,
  s_2,
  s_7_11_12_26,
  s_18,
  s_6_14,
  s_36_40,
  s_0,
  s_17,
  s_33_35,
  s_0,
  s_30_32_36_42,
  s_4_6_10,
  s_17,
  s_5,
  s_5,
  s_40,
  s_0,
  s_4,
  s_18,
  s_5,
  s_5,
  s_5,
  s_37,
  s_26,
  s_36,
  s_6_10,
  s_0,
  s_0,
  s_0,
  s_4_9_18,
  s_42,
  s_37,
  s_0,
  s_4,
  s_1,
  s_26_28,
  s_26,
  s_7_0,
  s_35,
  s_0,
  s_6_10,
  s_20,
  s_6,
  s_35,
  s_4_26_31_35_42,
  s_4,
  s_4,
  s_30,
  s_6,
  s_30,
  s_29,
  s_6,
  s_32_36,
  s_18,
  s_18,
  s_6_10,
  s_42,
  s_0,
  s_26,
  s_30,
  s_5_20,
  s_0,
  s_18,
  s_9,
  s_0,
  s_0,
  s_0,
  s_18_41,
  s_4,
  s_18,
  s_30,
  s_4,
  s_0,
  s_7_21_27,
  s_30_38_42,
  s_4_11,
  s_6_11_26,
  s_0,
  s_0,
  s_18_0,
  s_4_11,
  s_18,
  s_27,
  s_6,
  s_4,
  s_6,
  s_6,
  s_19,
  s_10,
  s_18,
  s_30,
  s_4,
  s_18,
  s_18,
  s_18,
  s_20,
  s_8_26,
  s_0,
  s_2,
  s_18,
  s_4_15,
  s_18,
  s_4_11_22_27,
  s_29_32_43,
  s_6,
  s_20,
  s_27,
  s_13,
  s_13,
  s_13,
  s_13,
  s_20,
  s_5,
  s_26,
  s_0,
  s_10,
  s_6_0,
  s_21,
  s_37,
  s_10,
  s_12,
  s_0_1,
  s_7,
  s_7,
  s_2,
  s_0,
  s_2,
  s_7_12,
  s_0,
  s_35,
  s_31_41,
  s_0,
  s_2,
  s_0,
  s_31,
  s_31,
  s_12,
  s_18,
  s_6,
  s_5_13_18,
  s_20,
  s_20,
  s_7_10_26,
  s_32,
  s_0,
  s_32,
  s_0,
  s_4,
  s_0,
  s_2,
  s_26,
  s_1,
  s_13_14_15,
  s_0_1,
  s_0_1,
  s_2,
  s_4_9,
  s_18,
  s_6,
  s_35,
  s_4_6,
  s_38,
  s_26_34_41,
  s_18_0,
  s_0,
  s_18,
  s_18,
  s_4_26,
  s_6,
  s_41,
  s_0,
  s_4,
  s_18,
  s_7_25_26,
  s_18,
  s_6_29_30_35_38_0,
  s_4,
  s_30,
  s_0,
  s_26,
  s_1_0,
  s_15_1_0,
  s_5_23,
  s_33_42,
  s_4_9_12,
  s_18,
  s_1_0,
  s_2,
  s_27,
  s_30,
  s_6_27,
  s_5,
  s_30,
  s_0,
  s_36_41,
  s_4_10,
  s_6,
  s_10,
  s_6_8_27_36,
  s_6,
  s_27,
  s_37,
  s_0,
  s_12,
  s_37,
  s_26,
  s_26,
  s_27,
  s_27,
  s_24,
  s_8,
  s_18_0,
  s_0,
  s_20_24,
  s_6,
  s_6,
  s_42,
  s_4_6_15,
  s_30_35,
  s_22_26,
  s_35,
  s_0,
  s_4,
  s_6,
  s_0,
  s_20,
  s_20,
  s_20,
  s_26,
  s_26,
  s_6_10,
  s_4,
  s_26,
  s_26,
  s_8,
  s_26,
  s_35,
  s_0,
  s_32_37,
  s_0,
  s_18,
  s_0,
  s_2,
  s_9_12_26,
  s_18,
  s_13,
  s_10,
  s_26,
  s_32,
  s_35,
  s_0,
  s_4,
  s_0,
  s_15,
  s_30_35_42,
  s_0,
  s_4,
  s_4_6_10_17,
  s_29,
  s_32,
  s_4,
  s_5,
  s_0,
  s_10,
  s_42,
  s_0,
  s_26,
  s_26,
  s_4_32,
  s_4_10_11_33_38_40_42,
  s_32_37_41,
  s_0,
  s_4_10_12,
  s_0,
  s_2,
  s_30,
  s_38_41,
  s_18,
  s_0,
  s_4_11,
  s_30_35,
  s_6_17_22,
  s_0,
  s_32,
  s_4,
  s_4,
  s_35,
  s_0,
  s_6_9_21,
  s_20,
  s_10_0,
  s_10,
  s_0,
  s_9,
  s_18,
  s_10,
  s_0,
  s_9,
  s_18,
  s_1,
  s_4_6_9_10_11_15_18_26_28_30_36_42,
  s_9,
  s_5,
  s_5,
  s_5,
  s_32_42,
  s_0,
  s_26,
  s_4,
  s_26,
  s_37,
  s_0,
  s_2,
  s_4,
  s_4_41,
  s_4_41,
  s_18,
  s_0,
  s_20_26_0,
  s_0,
  s_7,
  s_0,
  s_1,
  s_1,
  s_11,
  s_18,
  s_4_10_11_28,
  s_13_20,
  s_0,
  s_2,
  s_7,
  s_5,
  s_26,
  s_8,
  s_20,
  s_0,
  s_26,
  s_8,
  s_1,
  s_8_1,
  s_18,
  s_9,
  s_5,
  s_9,
  s_1,
  s_9,
  s_18,
  s_0,
  s_0,
  s_0,
  s_26,
  s_20,
  s_0,
  s_0,
  s_0_1,
  s_2,
  s_19,
  s_8,
  s_1,
  s_26,
  s_26,
  s_8,
  s_18,
  s_0,
  s_7,
  s_20,
  s_8,
  s_27,
  s_5,
  s_1,
  s_8,
  s_5,
  s_27,
  s_32_41,
  s_4_10,
  s_18,
  s_6,
  s_1,
  s_4,
  s_8,
  s_20,
  s_20,
  s_8,
  s_1,
  s_8,
  s_0,
  s_0,
  s_27,
  s_1,
  s_40_41,
  s_0,
  s_4_9_21,
  s_5_1,
  s_0,
  s_8,
  s_15,
  s_41,
  s_0,
  s_7_26,
  s_31_39_42,
  s_0,
  s_2,
  s_7,
  s_2,
  s_2,
  s_24,
  s_4,
  s_14_18,
  s_0,
  s_2,
  s_8,
  s_29_30,
  s_6_18,
  s_0,
  s_29_30,
  s_6_18,
  s_4_0,
  s_7_14_19_26,
  s_30_37,
  s_0,
  s_0,
  s_4_7_11,
  s_18,
  s_10,
  s_30,
  s_11,
  s_0,
  s_40,
  s_10,
  s_4_42,
  s_6,
  s_35,
  s_4,
  s_41,
  s_0,
  s_0,
  s_4,
  s_18,
  s_41,
  s_0,
  s_4_7_26,
  s_30_31_32_35_40_41,
  s_0,
  s_4_10_11_14,
  s_0,
  s_2,
  s_20,
  s_18,
  s_29_36,
  s_36,
  s_6_19,
  s_18_31,
  s_4_6_9,
  s_6,
  s_15,
  s_9_10_11_18_1,
  s_18,
  s_18,
  s_34,
  s_34,
  s_0,
  s_4_26,
  s_35,
  s_9,
  s_5,
  s_5,
  s_35_36_37,
  s_0,
  s_18,
  s_4_6,
  s_31,
  s_0,
  s_0,
  s_7_9,
  s_31_35,
  s_30,
  s_0,
  s_4,
  s_9,
  s_0,
  s_5,
  s_15,
  s_9_10,
  s_0,
  s_0,
  s_2,
  s_4_15,
  s_10,
  s_10,
  s_32,
  s_10,
  s_10,
  s_34_37_39,
  s_0,
  s_7,
  s_2,
  s_18,
  s_4_7_12,
  s_6,
  s_27,
  s_18,
  s_18,
  s_37_43,
  s_0,
  s_26,
  s_35,
  s_30_32,
  s_0,
  s_4_6_10_26,
  s_6,
  s_31_32,
  s_14_0,
  s_0,
  s_9_14_26,
  s_18,
  s_33_40,
  s_18,
  s_4,
  s_4_28,
  s_30_37,
  s_0,
  s_17,
  s_0,
  s_35,
  s_0,
  s_12_26,
  s_23,
  s_41,
  s_4_26,
  s_0,
  s_12,
  s_27,
  s_1,
  s_18,
  s_9,
  s_18,
  s_4_7,
  s_0,
  s_2,
  s_7,
  s_14,
  s_23_2_0,
  s_32,
  s_6,
  s_38,
  s_31_32,
  s_18,
  s_2,
  s_4_9_10,
  s_37,
  s_0,
  s_12,
  s_37,
  s_0,
  s_30_40,
  s_4_21,
  s_29_35,
  s_41,
  s_41,
  s_18,
  s_4_14,
  s_4,
  s_35,
  s_6_14,
  s_20,
  s_35_37,
  s_35,
  s_0,
  s_6_10_18,
  s_13,
  s_40,
  s_5,
  s_32,
  s_41,
  s_4_26,
  s_35_41,
  s_35,
  s_0,
  s_0,
  s_42,
  s_0,
  s_31_32,
  s_6,
  s_4_21_40_42,
  s_9,
  s_20,
  s_35_42,
  s_0,
  s_6,
  s_25,
  s_15,
  s_20,
  s_26,
  s_5,
  s_10_14,
  s_30_32_33_35_36_38_41_42,
  s_1,
  s_1,
  s_5,
  s_4_11,
  s_26,
  s_5,
  s_5,
  s_26,
  s_5,
  s_8,
  s_27,
  s_17,
  s_26,
  s_20,
  s_8,
  s_26,
  s_26,
  s_26,
  s_4,
  s_4,
  s_26,
  s_27,
  s_5,
  s_4_7_14,
  s_18,
  s_0,
  s_2,
  s_7,
  s_31_37_41,
  s_0,
  s_18,
  s_0,
  s_2,
  s_4,
  s_7,
  s_37,
  s_37,
  s_0,
  s_0,
  s_2,
  s_12,
  s_41,
  s_11,
  s_11,
  s_11,
  s_32_37,
  s_7_9_12,
  s_18,
  s_0,
  s_2,
  s_32,
  s_4_7_9,
  s_0,
  s_5_0,
  s_2,
  s_26,
  s_26,
  s_32_41,
  s_0,
  s_7,
  s_3,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_41,
  s_11,
  s_8,
  s_1,
  s_1,
  s_18,
  s_9,
  s_0,
  s_26,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_14,
  s_5_0_1,
  s_0,
  s_5,
  s_8,
  s_38,
  s_4_6_11_29_37,
  s_0,
  s_12,
  s_6,
  s_0,
  s_6_18,
  s_35_41,
  s_4,
  s_32,
  s_2,
  s_10,
  s_13,
  s_4_6_7_13,
  s_13,
  s_35_41,
  s_0,
  s_6,
  s_6_15,
  s_18,
  s_1_0,
  s_6,
  s_5,
  s_7,
  s_40,
  s_4_6_10_21,
  s_6,
  s_10,
  s_10,
  s_35_36,
  s_30,
  s_4,
  s_18,
  s_0,
  s_32,
  s_4_10,
  s_18,
  s_32,
  s_10,
  s_0,
  s_22,
  s_35,
  s_6_7_17_25,
  s_0,
  s_4,
  s_30_37,
  s_0,
  s_2,
  s_0,
  s_2,
  s_12,
  s_35,
  s_15_26,
  s_1,
  s_4_9,
  s_18,
  s_2,
  s_15,
  s_36,
  s_36,
  s_0,
  s_9,
  s_10,
  s_10_18,
  s_4_12_37,
  s_35,
  s_0,
  s_0,
  s_1,
  s_27,
  s_18,
  s_9,
  s_28,
  s_5,
  s_18,
  s_10,
  s_6,
  s_28_1,
  s_0,
  s_18_28,
  s_1_0,
  s_5,
  s_18,
  s_27,
  s_26,
  s_8,
  s_8,
  s_26,
  s_1,
  s_14,
  s_20,
  s_20,
  s_10,
  s_10,
  s_10,
  s_10,
  s_18,
  s_1,
  s_15,
  s_6,
  s_6,
  s_6,
  s_6,
  s_8,
  s_10,
  s_1,
  s_6,
  s_23,
  s_23,
  s_20,
  s_20,
  s_27,
  s_28,
  s_5_0,
  s_7,
  s_7,
  s_5,
  s_5,
  s_5,
  s_10,
  s_5,
  s_5,
  s_5,
  s_18_1,
  s_10,
  s_5,
  s_14_15,
  s_5,
  s_5,
  s_10,
  s_10_1_0,
  s_1,
  s_20,
  s_1,
  s_8,
  s_8,
  s_8,
  s_20,
  s_1,
  s_18_0,
  s_15,
  s_15,
  s_8,
  s_26,
  s_8,
  s_18,
  s_18,
  s_18_1_0,
  s_9,
  s_7,
  s_18,
  s_25,
  s_1,
  s_1,
  s_25,
  s_0,
  s_0,
  s_11_0,
  s_1,
  s_1,
  s_18,
  s_9,
  s_20,
  s_20,
  s_1,
  s_1,
  s_8,
  s_6,
  s_8,
  s_26,
  s_26_1,
  s_20,
  s_1,
  s_8,
  s_22,
  s_8,
  s_26,
  s_18,
  s_18,
  s_10,
  s_0,
  s_10,
  s_9,
  s_4,
  s_5,
  s_29,
  s_4_22,
  s_6,
  s_26,
  s_18_1,
  s_1,
  s_20,
  s_10,
  s_10,
  s_20,
  s_18,
  s_0,
  s_5,
  s_8,
  s_8,
  s_20,
  s_28,
  s_11_28,
  s_19,
  s_10,
  s_20,
  s_1,
  s_1,
  s_8,
  s_20,
  s_1,
  s_0,
  s_10,
  s_20,
  s_15,
  s_20,
  s_26,
  s_14,
  s_1,
  s_18_1,
  s_9,
  s_4_14_15_28,
  s_4,
  s_6_10_11,
  s_0,
  s_2,
  s_27,
  s_26,
  s_20,
  s_22,
  s_26,
  s_9,
  s_1,
  s_1,
  s_18,
  s_9,
  s_10,
  s_0,
  s_0,
  s_10,
  s_10,
  s_22,
  s_10,
  s_1,
  s_1,
  s_26,
  s_8,
  s_10,
  s_9_10,
  s_42,
  s_42,
  s_27,
  s_5_1,
  s_0,
  s_5,
  s_0,
  s_28,
  s_0,
  s_18,
  s_10,
  s_1,
  s_1,
  s_22,
  s_10,
  s_27_35,
  s_6,
  s_10,
  s_18,
  s_5,
  s_5,
  s_0,
  s_2,
  s_18_30_42_0,
  s_4,
  s_30_33,
  s_6,
  s_18,
  s_9,
  s_7_26,
  s_4,
  s_30_33,
  s_4_6,
  s_2,
  s_6,
  s_7,
  s_0,
  s_7,
  s_30_31_42,
  s_4,
  s_4_10_26,
  s_15_25,
  s_6_0_1,
  s_18,
  s_18_1,
  s_5,
  s_0,
  s_5,
  s_5,
  s_0,
  s_9,
  s_25_0,
  s_30_42,
  s_4,
  s_42,
  s_9_22_25_26,
  s_42,
  s_5_1,
  s_15_1,
  s_15_28,
  s_30_40,
  s_6,
  s_6,
  s_25,
  s_0,
  s_0,
  s_0,
  s_4,
  s_0,
  s_0,
  s_20,
  s_20,
  s_20,
  s_20,
  s_0,
  s_2,
  s_4,
  s_7_21,
  s_7_26,
  s_7_9_0,
  s_0,
  s_2,
  s_7,
  s_32,
  s_4_7_10,
  s_18,
  s_5,
  s_10_28,
  s_0,
  s_30_36,
  s_11,
  s_18,
  s_20,
  s_20,
  s_0,
  s_30_32_35,
  s_6,
  s_1,
  s_18,
  s_9,
  s_4_10,
  s_18,
  s_18,
  s_27,
  s_20,
  s_18,
  s_36_38_0,
  s_0,
  s_4,
  s_4_6_26,
  s_2,
  s_7,
  s_18,
  s_1_0,
  s_1_0,
  s_7,
  s_18,
  s_18,
  s_26,
  s_5,
  s_5,
  s_5,
  s_10,
  s_23,
  s_2,
  s_27,
  s_0,
  s_7,
  s_6,
  s_1,
  s_9,
  s_27,
  s_27,
  s_20_26,
  s_27,
  s_1,
  s_26,
  s_1,
  s_4,
  s_20,
  s_20,
  s_20,
  s_20,
  s_17,
  s_15_17_18,
  s_20,
  s_5,
  s_15,
  s_5,
  s_5,
  s_20,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_18,
  s_9_18_0,
  s_0,
  s_5,
  s_15,
  s_18_1,
  s_15,
  s_23,
  s_18,
  s_5_27,
  s_5,
  s_5,
  s_18,
  s_30,
  s_0,
  s_22,
  s_20,
  s_0,
  s_5,
  s_12_18,
  s_0,
  s_22_26,
  s_0,
  s_18_0,
  s_4,
  s_2,
  s_12_26,
  s_30,
  s_12_26,
  s_31_38,
  s_7,
  s_4,
  s_0,
  s_0,
  s_2,
  s_10,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_7_9_10_11,
  s_0,
  s_9_0,
  s_10,
  s_2,
  s_2_0,
  s_28,
  s_20,
  s_29,
  s_4_26,
  s_0,
  s_2,
  s_9,
  s_9,
  s_30_37_43,
  s_11_26,
  s_0_1,
  s_18,
  s_5,
  s_20,
  s_20,
  s_20,
  s_26,
  s_20,
  s_20,
  s_20,
  s_26,
  s_1,
  s_20,
  s_27,
  s_8,
  s_26,
  s_5,
  s_6,
  s_8,
  s_27,
  s_26,
  s_1,
  s_27,
  s_6,
  s_20,
  s_22,
  s_1,
  s_27,
  s_20,
  s_20,
  s_20,
  s_18,
  s_18,
  s_14,
  s_4_38,
  s_18,
  s_30,
  s_4,
  s_6_10,
  s_5_13_36,
  s_4,
  s_4_6_11_20_30_32_38_41_42,
  s_0,
  s_18,
  s_6,
  s_4,
  s_18,
  s_18,
  s_9,
  s_13,
  s_13,
  s_6,
  s_6_17,
  s_20,
  s_8,
  s_1,
  s_2,
  s_18,
  s_9,
  s_28,
  s_21,
  s_5,
  s_32,
  s_5,
  s_5,
  s_20,
  s_5,
  s_4_18_38,
  s_6,
  s_21,
  s_23,
  s_6,
  s_24,
  s_15,
  s_6,
  s_27,
  s_17,
  s_10_18,
  s_4,
  s_6,
  s_5,
  s_9,
  s_1,
  s_26,
  s_6,
  s_8,
  s_0,
  s_10,
  s_26,
  s_5,
  s_10,
  s_6,
  s_13,
  s_6,
  s_15,
  s_20,
  s_0,
  s_2,
  s_10,
  s_10,
  s_4,
  s_4,
  s_6,
  s_15,
  s_4,
  s_31_40_41,
  s_13,
  s_7,
  s_39,
  s_18,
  s_10_18,
  s_18,
  s_4_28,
  s_4_10_41,
  s_18,
  s_18,
  s_10_18,
  s_15,
  s_6_9_10_27,
  s_18_1,
  s_17_0_1,
  s_7,
  s_2,
  s_7,
  s_15,
  s_27,
  s_28,
  s_31_35_36_41,
  s_0,
  s_4_6_9_14_22,
  s_9,
  s_9,
  s_6,
  s_14_21,
  s_6,
  s_9_12_26_31,
  s_0,
  s_27,
  s_30,
  s_10_18,
  s_9,
  s_9,
  s_18,
  s_9_0_1,
  s_0,
  s_2,
  s_18,
  s_9,
  s_15,
  s_10,
  s_0,
  s_4_9_10_31,
  s_4_9_10,
  s_18,
  s_0,
  s_29,
  s_14_26,
  s_15,
  s_10_1,
  s_10,
  s_27,
  s_13_20,
  s_37_41,
  s_0,
  s_12_26,
  s_0,
  s_5,
  s_27,
  s_27,
  s_1,
  s_27,
  s_27,
  s_0,
  s_26,
  s_1,
  s_1,
  s_17,
  s_7_26,
  s_0,
  s_10_14,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_2,
  s_30_35_36_39,
  s_0,
  s_18,
  s_4_6,
  s_6,
  s_0,
  s_30,
  s_30,
  s_2,
  s_30,
  s_26_28,
  s_30_42,
  s_21,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_18,
  s_18,
  s_27,
  s_6_10_27,
  s_1_0,
  s_30,
  s_30,
  s_30,
  s_29,
  s_29,
  s_6,
  s_9_10,
  s_0_1,
  s_2,
  s_18,
  s_9,
  s_18,
  s_9_16,
  s_15,
  s_18_1,
  s_8,
  s_18,
  s_18_0,
  s_0,
  s_2,
  s_7,
  s_1,
  s_9,
  s_18,
  s_1,
  s_1,
  s_9,
  s_1,
  s_1,
  s_18,
  s_9,
  s_14,
  s_6,
  s_18,
  s_9,
  s_7,
  s_6,
  s_6,
  s_6,
  s_6,
  s_27,
  s_27,
  s_27,
  s_29_30_0,
  s_0,
  s_4_7,
  s_1,
  s_1,
  s_18,
  s_9_11,
  s_10,
  s_6_15,
  s_6,
  s_18,
  s_5,
  s_15,
  s_18,
  s_10,
  s_6,
  s_1,
  s_31_32,
  s_18,
  s_31_32,
  s_10,
  s_9_10,
  s_10,
  s_5,
  s_20,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_1,
  s_4,
  s_1,
  s_4,
  s_5,
  s_18,
  s_1,
  s_1,
  s_18,
  s_26,
  s_1,
  s_26,
  s_18,
  s_1,
  s_9,
  s_5,
  s_6,
  s_5,
  s_15_18,
  s_20,
  s_1,
  s_9,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_18,
  s_32,
  s_18,
  s_0,
  s_10,
  s_32,
  s_10,
  s_5,
  s_5,
  s_18,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5,
  s_18,
  s_26,
  s_20,
  s_20,
  s_5,
  s_5,
  s_32,
  s_10,
  s_0,
  s_2,
  s_32,
  s_1,
  s_1,
  s_0,
  s_6,
  s_0,
  s_9,
  s_20,
  s_20,
  s_27,
  s_12,
  s_6_0,
  s_0,
  s_12,
  s_5,
  s_17,
  s_18,
  s_10,
  s_5,
  s_4,
  s_0,
  s_4,
  s_0,
  s_5,
  s_18_1,
  s_17,
  s_18_1,
  s_1,
  s_15_27,
  s_4,
  s_4,
  s_18,
  s_23,
  s_10,
  s_1,
  s_9,
  s_21,
  s_23,
  s_5,
  s_5,
  s_17,
  s_10,
  s_14_17,
  s_18_1,
  s_22,
  s_30,
  s_22,
  s_30,
  s_27,
  s_1,
  s_14,
  s_20,
  s_20,
  s_5_18,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4,
  s_4,
  s_18,
  s_0,
  s_20,
  s_18,
  s_20,
  s_5,
  s_27,
  s_18_20,
  s_4,
  s_9,
  s_5,
  s_5_1,
  s_5,
  s_1,
  s_22,
  s_0,
  s_29_30_38,
  s_4_22,
  s_18,
  s_32_38_41,
  s_31,
  s_4_9,
  s_0,
  s_18,
  s_30,
  s_11,
  s_0,
  s_10,
  s_1_0,
  s_9,
  s_30_32,
  s_10,
  s_18,
  s_1_0,
  s_30_32,
  s_18,
  s_15,
  s_0,
  s_30,
  s_0,
  s_22,
  s_1,
  s_27,
  s_6,
  s_4_10,
  s_0,
  s_2,
  s_7,
  s_18_28,
  s_28_30_35_0_2,
  s_28,
  s_0,
  s_2,
  s_28,
  s_6,
  s_18,
  s_10_18,
  s_2,
  s_7_24,
  s_10_28,
  s_3_19_26,
  s_0,
  s_28,
  s_26,
  s_0,
  s_11,
  s_2,
  s_42,
  s_2,
  s_17,
  s_17,
  s_20_0,
  s_20_0,
  s_2,
  s_7,
  s_2,
  s_20,
  s_18,
  s_4_7,
  s_18_38,
  s_4,
  s_0,
  s_0,
  s_7,
  s_18,
  s_2,
  s_2,
  s_35,
  s_4,
  s_9_10_32,
  s_0,
  s_0,
  s_0,
  s_1_0,
  s_2,
  s_4_7_0,
  s_18,
  s_4,
  s_2,
  s_7,
  s_32,
  s_30_35_0,
  s_4,
  s_0,
  s_9,
  s_0,
  s_32_36_37,
  s_0,
  s_22,
  s_2,
  s_1,
  s_9,
  s_18,
  s_30_36,
  s_5_10_18,
  s_10_18,
  s_6,
  s_23,
  s_23,
  s_30_37,
  s_0,
  s_4,
  s_32_0,
  s_4,
  s_0,
  s_4,
  s_7,
  s_2,
  s_7,
  s_20,
  s_5,
  s_32_41,
  s_0,
  s_2,
  s_4_10,
  s_30_32_37,
  s_4_14_15_26,
  s_0,
  s_0,
  s_10,
  s_9,
  s_4_9_10,
  s_31_32_39_41,
  s_18,
  s_18,
  s_4_9_10_11,
  s_0,
  s_26,
  s_26,
  s_18,
  s_15,
  s_30_37,
  s_0,
  s_0,
  s_2,
  s_4_12,
  s_0,
  s_23,
  s_23,
  s_6,
  s_35_39,
  s_4_6_15,
  s_6_18,
  s_33_42,
  s_7,
  s_0,
  s_2,
  s_42,
  s_7_9,
  s_9_18,
  s_0,
  s_2,
  s_27,
  s_31_32,
  s_9_10,
  s_0,
  s_0,
  s_2,
  s_10_31,
  s_10,
  s_4_7_26_0,
  s_0,
  s_2,
  s_7,
  s_4_6_10_19_30_40_41,
  s_7,
  s_0,
  s_0,
  s_18,
  s_21,
  s_21_30_35_40,
  s_18,
  s_4_10,
  s_7_9,
  s_0,
  s_7,
  s_6_0,
  s_4_26,
  s_0,
  s_0,
  s_30_37_39,
  s_0,
  s_2,
  s_4_12_26,
  s_0,
  s_2,
  s_32,
  s_10,
  s_10,
  s_0,
  s_31_32_35_41_42,
  s_4_9_26,
  s_10_0,
  s_2,
  s_7,
  s_31_36,
  s_9,
  s_0,
  s_18,
  s_32_41,
  s_4_26,
  s_32_35,
  s_10_26,
  s_27,
  s_8_25,
  s_1,
  s_27,
  s_29,
  s_22,
  s_22_27,
  s_1,
  s_29_37,
  s_0,
  s_2,
  s_4_26,
  s_32,
  s_0,
  s_4_10,
  s_0,
  s_4,
  s_18,
  s_0,
  s_10,
  s_0,
  s_2,
  s_0,
  s_9_10_32,
  s_0,
  s_18,
  s_14,
  s_0,
  s_32_37,
  s_9_10_12,
  s_7,
  s_0,
  s_18,
  s_32_36_41,
  s_0,
  s_4,
  s_4_10_22,
  s_18,
  s_14_18_1,
  s_18,
  s_18,
  s_10,
  s_18,
  s_1,
  s_1,
  s_9,
  s_0,
  s_9_10,
  s_32_42,
  s_0,
  s_32_41_0,
  s_4_21_26,
  s_30,
  s_4,
  s_4_11_29_31_34_41,
  s_6,
  s_4,
  s_6,
  s_0,
  s_34_40_41,
  s_4,
  s_38,
  s_30_35,
  s_17_19,
  s_4_27,
  s_29,
  s_6_27_29_30_34_40,
  s_0,
  s_0,
  s_0,
  s_4_11_26,
  s_0,
  s_2,
  s_4_10_38_39_42,
  s_4_14,
  s_18,
  s_4_10,
  s_18,
  s_0,
  s_18,
  s_37,
  s_0,
  s_0,
  s_12,
  s_32,
  s_10,
  s_0,
  s_0,
  s_4,
  s_41,
  s_11_26,
  s_0,
  s_7,
  s_0,
  s_4_18_41,
  s_1,
  s_42,
  s_17_26,
  s_0,
  s_1_0,
  s_9,
  s_18_1,
  s_0,
  s_4_6_11_30_33_38,
  s_5,
  s_9,
  s_20,
  s_0,
  s_6,
  s_5,
  s_8_1,
  s_5,
  s_10,
  s_5,
  s_9,
  s_1,
  s_9,
  s_18,
  s_4_10,
  s_0,
  s_0,
  s_0,
  s_26,
  s_20,
  s_0,
  s_0,
  s_26,
  s_27,
  s_32,
  s_0,
  s_4_26,
  s_0,
  s_27,
  s_26,
  s_5,
  s_7,
  s_0,
  s_2,
  s_35,
  s_18,
  s_9,
  s_18,
  s_35,
  s_10,
  s_8,
  s_17,
  s_26,
  s_0,
  s_27,
  s_0,
  s_0,
  s_0,
  s_7,
  s_7,
  s_7,
  s_27,
  s_26,
  s_30_32_38,
  s_0,
  s_0,
  s_0,
  s_7_17,
  s_0,
  s_0,
  s_4_10_24,
  s_9,
  s_1,
  s_0,
  s_2,
  s_7,
  s_7_23,
  s_18,
  s_32,
  s_10,
  s_18_30_41,
  s_4,
  s_29_31_32,
  s_0,
  s_9_12,
  s_0,
  s_2,
  s_9_12_26,
  s_0,
  s_7_26,
  s_6,
  s_29_30,
  s_4_22,
  s_6_18,
  s_7,
  s_7,
  s_4_0,
  s_2,
  s_41,
  s_4_7_14,
  s_0,
  s_0,
  s_2,
  s_7,
  s_29_33_41,
  s_22,
  s_34_40,
  s_0,
  s_18,
  s_4,
  s_4_21,
  s_11_21_30,
  s_0,
  s_2,
  s_7,
  s_9_11_30_31_37_39,
  s_0,
  s_0,
  s_1_0,
  s_4_9_41,
  s_1_0,
  s_9,
  s_2,
  s_4_9,
  s_18,
  s_18_0,
  s_9,
  s_2,
  s_9,
  s_0,
  s_41,
  s_4_21,
  s_1,
  s_1,
  s_4_11_28,
  s_1,
  s_29_30_42,
  s_0,
  s_11_28,
  s_32,
  s_0,
  s_10,
  s_10,
  s_9_10,
  s_0,
  s_10,
  s_0,
  s_10,
  s_32,
  s_10,
  s_0,
  s_2,
  s_7,
  s_30_31_32_35,
  s_0,
  s_4_34_41,
  s_4,
  s_0,
  s_0,
  s_0,
  s_18,
  s_0,
  s_4_9,
  s_0,
  s_0,
  s_31,
  s_10_18,
  s_4_10_11,
  s_6_0,
  s_2,
  s_14,
  s_10_18,
  s_24_1,
  s_2,
  s_4,
  s_6_35_40,
  s_0,
  s_4_6,
  s_18,
  s_4,
  s_10_31_32_35_39,
  s_0,
  s_32,
  s_10_14,
  s_0,
  s_18,
  s_0,
  s_32,
  s_10,
  s_4_6_7_9_10_23_26,
  s_32,
  s_18,
  s_10,
  s_4_6_10_32_35_39_2_0,
  s_4,
  s_0,
  s_0,
  s_4_7_10_22,
  s_14,
  s_18_1,
  s_1,
  s_0,
  s_0,
  s_2,
  s_7,
  s_2,
  s_6,
  s_35,
  s_4,
  s_4,
  s_4,
  s_35,
  s_4,
  s_30,
  s_0,
  s_4,
  s_18,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_29,
  s_30,
  s_0,
  s_0,
  s_2,
  s_2,
  s_0,
  s_2_0,
  s_4,
  s_36,
  s_4,
  s_36_41,
  s_29_30_34_35_38_40_42,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_4_6_7_9_10_28,
  s_0,
  s_0,
  s_2,
  s_7,
  s_8,
  s_7_26,
  s_32,
  s_0,
  s_4_10,
  s_15_0,
  s_4,
  s_30,
  s_4,
  s_30_38,
  s_0,
  s_35_36,
  s_0,
  s_4_11,
  s_18,
  s_18,
  s_9_0,
  s_4_9,
  s_30_31,
  s_7,
  s_4_9,
  s_30_31,
  s_2,
  s_9,
  s_1,
  s_8,
  s_0,
  s_0,
  s_4_9_11_22_26,
  s_30_43,
  s_0,
  s_0,
  s_6,
  s_4,
  s_0,
  s_30_35_36,
  s_4,
  s_32,
  s_18,
  s_10,
  s_36_40,
  s_4_21,
  s_0,
  s_2,
  s_18,
  s_18,
  s_6_10_18_2_0,
  s_1,
  s_10_27_30_31_35_36_40,
  s_0,
  s_0,
  s_4_7_22,
  s_6,
  s_0,
  s_41,
  s_4,
  s_25,
  s_1,
  s_1,
  s_0,
  s_0,
  s_1,
  s_0,
  s_0,
  s_0,
  s_24,
  s_0,
  s_2,
  s_7,
  s_0,
  s_31_32,
  s_9,
  s_0,
  s_11,
  s_1,
  s_18_1,
  s_0,
  s_4_7,
  s_7,
  s_0,
  s_2,
  s_4,
  s_29_30_35,
  s_22_26_27,
  s_7,
  s_0,
  s_18_0,
  s_0,
  s_0,
  s_7_15_0,
  s_2,
  s_7,
  s_9,
  s_18_0,
  s_8_15_26,
  s_15_23,
  s_0,
  s_35,
  s_4,
  s_0,
  s_1,
  s_10,
  s_0,
  s_7,
  s_0,
  s_18_0,
  s_0,
  s_0,
  s_0,
  s_36,
  s_4_25,
  s_0,
  s_7_12,
  s_0,
  s_2,
  s_32,
  s_27_29,
  s_11_27,
  s_29_32,
  s_32_37,
  s_0,
  s_2,
  s_10_12,
  s_0,
  s_2,
  s_15,
  s_8,
  s_1,
  s_29,
  s_5,
  s_18,
  s_6_8_9_15_39,
  s_8_39,
  s_6,
  s_8,
  s_5_6,
  s_0,
  s_7,
  s_4_23,
  s_4_18,
  s_6,
  s_6,
  s_6,
  s_18,
  s_8,
  s_0,
  s_26,
  s_6,
  s_8,
  s_0,
  s_6,
  s_6,
  s_6,
  s_9,
  s_6,
  s_6,
  s_15,
  s_9,
  s_7,
  s_7,
  s_26,
  s_8,
  s_6,
  s_18_39,
  s_5,
  s_17,
  s_15_17,
  s_23,
  s_15_17,
  s_18,
  s_10_18,
  s_10,
  s_18,
  s_10_18,
  s_15,
  s_10_18,
  s_14,
  s_0,
  s_20,
  s_18,
  s_18_1_0,
  s_20,
  s_9,
  s_10,
  s_0,
  s_6_7,
  s_36,
  s_0,
  s_4_10,
  s_18,
  s_18,
  s_0,
  s_2,
  s_6_10,
  s_6_7_8_10_15_18_32_33_35_38_39_42,
  s_0,
  s_0,
  s_4,
  s_6,
  s_9,
  s_9_25,
  s_0,
  s_0,
  s_2,
  s_7,
  s_8,
  s_4_8_1,
  s_2,
  s_0,
  s_30_36_42,
  s_4_19_26,
  s_0,
  s_18,
  s_0,
  s_4_6_7_9,
  s_4_6,
  s_6_32,
  s_9_10_26,
  s_14,
  s_0,
  s_0,
  s_10,
  s_8_9_11_18_23_31_40,
  s_9_1,
  s_9,
  s_9,
  s_31,
  s_9,
  s_31,
  s_6,
  s_18,
  s_1_0,
  s_7,
  s_2,
  s_7,
  s_19,
  s_0_1,
  s_9_14,
  s_9,
  s_2,
  s_0,
  s_2,
  s_18,
  s_0,
  s_4_29_30,
  s_0,
  s_11,
  s_11,
  s_10,
  s_6,
  s_1,
  s_17,
  s_27,
  s_9_18,
  s_15,
  s_10,
  s_9_18,
  s_18,
  s_6_18_29_41,
  s_20,
  s_20,
  s_0,
  s_6_18_35_36,
  s_6,
  s_18,
  s_20,
  s_6_18_35_36,
  s_6,
  s_20,
  s_18,
  s_18_1,
  s_6,
  s_30_37_40_41,
  s_4_26_0,
  s_6,
  s_4_11_18_26,
  s_2_0,
  s_7,
  s_0,
  s_11_29_0,
  s_0,
  s_7,
  s_2,
  s_7_12,
  s_4_14_35_0_2,
  s_18,
  s_15,
  s_0,
  s_6,
  s_2,
  s_7_9,
  s_15,
  s_18,
  s_9,
  s_10,
  s_18,
  s_15,
  s_4_9_14,
  s_14_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4_6_18_32_36_41_0,
  s_18,
  s_18,
  s_4,
  s_18,
  s_13,
  s_4,
  s_14,
  s_18,
  s_0,
  s_20,
  s_6,
  s_0,
  s_5,
  s_5_33,
  s_18,
  s_5,
  s_5,
  s_1,
  s_9,
  s_6,
  s_18,
  s_4_7_11_17_28_30_35_38_40_41_42_43,
  s_18,
  s_0,
  s_7,
  s_9,
  s_6,
  s_4,
  s_6,
  s_0,
  s_18,
  s_7,
  s_0,
  s_0,
  s_22,
  s_18,
  s_18,
  s_18,
  s_19_27,
  s_17_0,
  s_17_20,
  s_0_2,
  s_4_10,
  s_2,
  s_7_26,
  s_7_0,
  s_6,
  s_0,
  s_4_9,
  s_18,
  s_30_31_32_41,
  s_4,
  s_10_26,
  s_18,
  s_1,
  s_4_32_38_42,
  s_4_0,
  s_2,
  s_26,
  s_0,
  s_1_0,
  s_18_0,
  s_9,
  s_32,
  s_0,
  s_0,
  s_4_7_9,
  s_9,
  s_32,
  s_0,
  s_0,
  s_2,
  s_14_18,
  s_11_26,
  s_34,
  s_0,
  s_26,
  s_6,
  s_0,
  s_2,
  s_18,
  s_6_18_30_35_38,
  s_5,
  s_18_0,
  s_0,
  s_2,
  s_9,
  s_9,
  s_0,
  s_18,
  s_0,
  s_2,
  s_30,
  s_9_12_36_37_0,
  s_6,
  s_4,
  s_14,
  s_10,
  s_5_10,
  s_1,
  s_6,
  s_6,
  s_6,
  s_0,
  s_0,
  s_8,
  s_0,
  s_6,
  s_4,
  s_10,
  s_36,
  s_18,
  s_36,
  s_9_18,
  s_18,
  s_0,
  s_0,
  s_2,
  s_9_10_36,
  s_26,
  s_20,
  s_20,
  s_14,
  s_10,
  s_18,
  s_18,
  s_14_0_2,
  s_23,
  s_18,
  s_4,
  s_0,
  s_7,
  s_14,
  s_10_13_30,
  s_0,
  s_2,
  s_9,
  s_9_13_18_21_34_42,
  s_4_10,
  s_13,
  s_0,
  s_15,
  s_13,
  s_0,
  s_20,
  s_6_36_40_41,
  s_18,
  s_18,
  s_18,
  s_6,
  s_4_0,
  s_15,
  s_15_17,
  s_6,
  s_6_21,
  s_6,
  s_7,
  s_4,
  s_15,
  s_10,
  s_14,
  s_18,
  s_18,
  s_18,
  s_22_29,
  s_22,
  s_0,
  s_10_18,
  s_0,
  s_9_26,
  s_4_29,
  s_2_0,
  s_0,
  s_2_0,
  s_21,
  s_6,
  s_4,
  s_4,
  s_26,
  s_10,
  s_6_8,
  s_8_10,
  s_26,
  s_10,
  s_8,
  s_37_42,
  s_0,
  s_0,
  s_2,
  s_7_12_26,
  s_5,
  s_26,
  s_5,
  s_26,
  s_5,
  s_26,
  s_9,
  s_18_1,
  s_18,
  s_1,
  s_4_6_7_9_36,
  s_0,
  s_2,
  s_0,
  s_4,
  s_18,
  s_4_34_0_2,
  s_4,
  s_30_35,
  s_0,
  s_6_18,
  s_4_6,
  s_2,
  s_2,
  s_0,
  s_2,
  s_7,
  s_0,
  s_4,
  s_13,
  s_6_7,
  s_7_8_27_34_0,
  s_14,
  s_0,
  s_9,
  s_18_1,
  s_1,
  s_7_11,
  s_2,
  s_13,
  s_11_18_26_32,
  s_0,
  s_0,
  s_2,
  s_18,
  s_0,
  s_18_29,
  s_4_18_24,
  s_15,
  s_0,
  s_0,
  s_7,
  s_0,
  s_23_30_31,
  s_0,
  s_6,
  s_7,
  s_4_12_26_29,
  s_0,
  s_6,
  s_10,
  s_10,
  s_18,
  s_18,
  s_4,
  s_0,
  s_7,
  s_18,
  s_34,
  s_0,
  s_0,
  s_7,
  s_0,
  s_4,
  s_18_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_10,
  s_15,
  s_1,
  s_8,
  s_6,
  s_6,
  s_18,
  s_4_7_11_17_26_32,
  s_18,
  s_10_0,
  s_2,
  s_26,
  s_17,
  s_0,
  s_2,
  s_7,
  s_0,
  s_18,
  s_3_14,
  s_18,
  s_18,
  s_18,
  s_1,
  s_18,
  s_6,
  s_18,
  s_14,
  s_18,
  s_0,
  s_0,
  s_26,
  s_4_6_7_9_12_31_41,
  s_0,
  s_7,
  s_2,
  s_0,
  s_9_18_0,
  s_4_9,
  s_4_6_7_9_12_31_41,
  s_0,
  s_7,
  s_2,
  s_9_18_0,
  s_4_9,
  s_26,
  s_18,
  s_5_7_29_32_38,
  s_18,
  s_0,
  s_6_32,
  s_18,
  s_15,
  s_37,
  s_0,
  s_14,
  s_14,
  s_14,
  s_14,
  s_14,
  s_18,
  s_7,
  s_12_37,
  s_0,
  s_2,
  s_7_12,
  s_0,
  s_2,
  s_7_12,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_11_13_14_34,
  s_4,
  s_4,
  s_4_5_29_33_35,
  s_6_32_41,
  s_4,
  s_0,
  s_0,
  s_6,
  s_0,
  s_20,
  s_7,
  s_4,
  s_0,
  s_0,
  s_20,
  s_18,
  s_0,
  s_6_8_9_10_42,
  s_0,
  s_0,
  s_28,
  s_26,
  s_6,
  s_1,
  s_26,
  s_28,
  s_1,
  s_17,
  s_27,
  s_18,
  s_0,
  s_2,
  s_7,
  s_27,
  s_26,
  s_0,
  s_0,
  s_29_30,
  s_11,
  s_7_9_26,
  s_14_18,
  s_14,
  s_13,
  s_18_0_1,
  s_4_26,
  s_30,
  s_9,
  s_18,
  s_4_26,
  s_30,
  s_2,
  s_30_0,
  s_0,
  s_4_14,
  s_20,
  s_6,
  s_21_40,
  s_0,
  s_0,
  s_9,
  s_7_26,
  s_2,
  s_13_30_34_38_41,
  s_10_22,
  s_6,
  s_5_6_17_18,
  s_4,
  s_6,
  s_27,
  s_4_7_9_26_29_31_35_37_39_40_42,
  s_5_7_10,
  s_3_9_26,
  s_2,
  s_12,
  s_2,
  s_18,
  s_32_36,
  s_0,
  s_4_10,
  s_13_20,
  s_4_36,
  s_5,
  s_0,
  s_13,
  s_6,
  s_27,
  s_20,
  s_32,
  s_10,
  s_0,
  s_2,
  s_7,
  s_7_26,
  s_5,
  s_5,
  s_5_1,
  s_5,
  s_4_6_27_35_38_0,
  s_18,
  s_18,
  s_18,
  s_39,
  s_4,
  s_4,
  s_18,
  s_18,
  s_6,
  s_18_23,
  s_14_21_26,
  s_6,
  s_18_26,
  s_0,
  s_4,
  s_27,
  s_6_30_35,
  s_0,
  s_6,
  s_20,
  s_14,
  s_5_18_0,
  s_7,
  s_10_0,
  s_7,
  s_7,
  s_22,
  s_30,
  s_4_9,
  s_18_1,
  s_22,
  s_30,
  s_1,
  s_8,
  s_9,
  s_23,
  s_23,
  s_28,
  s_23,
  s_8,
  s_17_23,
  s_6_18_32_33_35_40,
  s_0,
  s_18,
  s_18,
  s_4_6_27,
  s_33_41,
  s_6,
  s_6,
  s_8,
  s_1,
  s_4_7,
  s_15,
  s_17,
  s_13_20,
  s_10,
  s_6,
  s_18,
  s_6,
  s_13_20,
  s_5,
  s_21,
  s_6,
  s_0,
  s_18,
  s_18,
  s_6,
  s_27,
  s_4_28,
  s_1,
  s_0,
  s_18,
  s_7_10,
  s_22_26_27_30_37,
  s_1,
  s_22_26,
  s_22,
  s_18,
  s_18_23,
  s_17,
  s_27,
  s_20,
  s_0,
  s_0,
  s_0,
  s_0,
  s_20,
  s_0,
  s_2,
  s_7,
  s_7,
  s_15,
  s_5_31_33_38,
  s_1,
  s_27,
  s_19,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_1,
  s_19,
  s_1,
  s_6,
  s_4_6_38,
  s_6,
  s_4,
  s_18,
  s_0,
  s_11,
  s_29_30,
  s_27,
  s_7_26_28,
  s_0,
  s_11,
  s_29_30,
  s_27,
  s_6,
  s_12,
  s_0,
  s_2,
  s_0,
  s_2,
  s_12,
  s_12_26,
  s_12_26,
  s_15,
  s_20,
  s_6,
  s_6,
  s_0,
  s_26_29,
  s_8_22,
  s_30,
  s_26,
  s_4_28,
  s_0,
  s_4,
  s_6_36,
  s_6,
  s_10,
  s_20,
  s_6,
  s_1,
  s_4_35_40,
  s_0,
  s_4_11_41,
  s_20,
  s_4_6,
  s_4_9,
  s_4,
  s_0,
  s_7,
  s_4_6_12,
  s_4_9,
  s_18,
  s_30,
  s_5,
  s_9,
  s_4,
  s_27,
  s_9,
  s_6,
  s_4,
  s_6_35,
  s_20,
  s_0,
  s_26_40,
  s_13,
  s_13,
  s_5,
  s_4_33,
  s_1,
  s_14,
  s_1,
  s_30,
  s_2,
  s_18_1_0,
  s_12_26,
  s_0,
  s_20,
  s_1_0,
  s_2,
  s_26,
  s_0,
  s_20,
  s_14_0,
  s_0,
  s_0,
  s_7,
  s_0,
  s_18,
  s_6_15,
  s_14,
  s_14,
  s_18,
  s_18,
  s_11,
  s_10,
  s_10_32,
  s_18,
  s_4,
  s_6_7_8_13_27,
  s_6,
  s_27,
  s_1,
  s_10,
  s_6,
  s_6_7_8_27,
  s_6,
  s_27,
  s_1,
  s_10,
  s_27,
  s_29,
  s_4_26,
  s_1,
  s_27,
  s_27,
  s_27,
  s_27,
  s_22,
  s_27,
  s_1,
  s_26,
  s_8,
  s_1,
  s_8,
  s_1,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_7,
  s_0,
  s_7,
  s_8,
  s_21,
  s_5,
  s_6,
  s_0,
  s_7,
  s_1_0,
  s_10,
  s_1_0,
  s_4_10,
  s_30_36,
  s_4_10,
  s_30_36,
  s_0,
  s_2,
  s_0,
  s_20,
  s_6_30_35_36_40_41,
  s_20,
  s_20,
  s_18,
  s_6,
  s_0,
  s_7,
  s_12_38,
  s_12,
  s_0,
  s_1_0,
  s_18_1,
  s_18,
  s_21,
  s_14_15,
  s_4_6_9_14_15_17_19_26_31_32_33,
  s_18,
  s_5,
  s_18,
  s_4_18,
  s_5,
  s_18,
  s_18,
  s_27,
  s_6,
  s_18,
  s_18,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_2,
  s_7,
  s_0,
  s_11,
  s_6,
  s_4,
  s_23_0,
  s_24_0,
  s_10_23_24_0,
  s_2,
  s_28,
  s_24_0,
  s_21_23_0,
  s_10_13_14_20,
  s_5,
  s_4_7_10_33_41,
  s_6_18,
  s_4_0,
  s_9,
  s_0,
  s_4,
  s_0,
  s_2,
  s_4_6_7_8_9_10_18_21_23_25_31_36_42,
  s_0,
  s_6_18,
  s_18,
  s_6,
  s_9,
  s_20,
  s_15,
  s_10_18_1,
  s_15,
  s_27,
  s_20,
  s_6,
  s_6_8_20_27,
  s_0,
  s_0,
  s_1,
  s_20,
  s_5_20,
  s_1,
  s_26,
  s_1,
  s_5,
  s_6,
  s_13_20,
  s_40,
  s_6_10_14_32_35_38,
  s_5,
  s_10,
  s_18,
  s_6_13_35_36,
  s_0_1,
  s_31,
  s_7_24,
  s_4_18_41,
  s_18,
  s_20,
  s_4_18,
  s_20,
  s_20,
  s_0,
  s_6_36,
  s_4_10_17,
  s_10_18_1,
  s_23_27_30_34_41_42,
  s_6,
  s_18,
  s_44_0,
  s_6_10_23_27,
  s_6_8_13_35_36,
  s_4_6_13_22_27,
  s_9,
  s_18,
  s_5,
  s_6_10_32_36,
  s_0,
  s_14,
  s_0,
  s_4,
  s_18,
  s_0,
  s_5,
  s_5,
  s_23,
  s_6_35_38,
  s_10_26_27,
  s_2,
  s_7_26,
  s_0,
  s_27_35,
  s_4_22,
  s_8,
  s_8,
  s_0,
  s_5_6_23_38_40,
  s_0,
  s_41,
  s_18,
  s_10_11_0,
  s_4_10_28,
  s_4,
  s_30,
  s_18,
  s_7,
  s_4,
  s_30,
  s_2,
  s_4_9_40,
  s_21,
  s_1,
  s_2,
  s_18_41,
  s_4,
  s_5,
  s_14,
  s_5,
  s_4_9_30_31_32_36_38_39_40,
  s_6_18,
  s_4_17,
  s_14,
  s_21_41_0_2,
  s_0,
  s_35,
  s_2,
  s_7,
  s_0,
  s_6,
  s_0,
  s_7,
  s_6_8_23_32_35,
  s_6_10,
  s_23,
  s_0,
  s_20,
  s_4,
  s_0,
  s_0,
  s_5,
  s_7,
  s_8,
  s_6,
  s_10,
  s_10,
  s_7_10_36,
  s_4,
  s_20,
  s_32,
  s_10,
  s_6,
  s_8,
  s_6,
  s_0,
  s_0,
  s_4_28,
  s_4_7_9_11_15_26_28_30_34_35_42,
  s_0,
  s_5_6_18,
  s_4_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_18_32_41,
  s_15,
  s_18,
  s_13,
  s_18,
  s_10,
  s_10_1,
  s_13,
  s_17,
  s_6,
  s_20,
  s_4_6_10_11_12_22_27_30_33_36_37_38_40_41,
  s_6,
  s_17_18_19,
  s_6,
  s_5,
  s_6,
  s_6_33,
  s_6,
  s_18_27,
  s_5,
  s_15,
  s_6,
  s_5_18,
  s_27,
  s_6,
  s_0,
  s_27,
  s_6,
  s_18,
  s_18,
  s_5,
  s_6_15,
  s_6,
  s_19,
  s_27,
  s_6,
  s_4_18,
  s_15,
  s_6,
  s_6,
  s_7,
  s_30_0,
  s_6,
  s_6_15,
  s_17_27,
  s_10_19,
  s_20,
  s_6,
  s_4_6,
  s_13,
  s_20,
  s_27,
  s_6,
  s_4,
  s_6_23,
  s_14_30_2_0,
  s_15,
  s_1,
  s_20,
  s_2,
  s_7,
  s_10,
  s_4_6_10_23_24_28_0_2,
  s_18_0,
  s_2_0,
  s_2,
  s_17_18,
  s_10,
  s_21,
  s_1,
  s_2,
  s_18,
  s_5_13_15_18_33_35,
  s_5,
  s_6_26,
  s_5_18,
  s_18,
  s_6,
  s_1,
  s_6,
  s_6,
  s_2,
  s_4,
  s_18,
  s_6,
  s_13,
  s_6,
  s_17,
  s_30,
  s_18,
  s_5,
  s_1_0,
  s_0,
  s_22,
  s_0,
  s_7_22,
  s_0,
  s_5,
  s_5,
  s_8_17_25_30,
  s_5,
  s_5,
  s_8,
  s_4_33,
  s_23,
  s_4,
  s_23,
  s_8_26,
  s_0,
  s_5,
  s_5,
  s_0,
  s_20,
  s_20,
  s_1_0,
  s_4_7_26_30_34_40_42_0,
  s_5,
  s_0,
  s_2,
  s_7,
  s_2,
  s_6,
  s_7_26,
  s_44,
  s_18_0,
  s_4_6_11_0,
  s_2,
  s_7,
  s_18,
  s_6_14_23_0,
  s_0,
  s_21,
  s_21,
  s_4,
  s_14_23,
  s_4_26_29_30_32_33_35_36_41,
  s_30_39_41,
  s_4_9_26,
  s_6_27,
  s_0,
  s_2,
  s_7_26,
  s_6_18_27,
  s_4_6,
  s_6_13,
  s_7,
  s_4_6_7_18,
  s_6,
  s_13_30,
  s_0,
  s_11_42,
  s_0,
  s_17,
  s_8,
  s_31,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_7,
  s_6_10_18,
  s_20,
  s_20,
  s_5_6_10_20_30_32_36_38,
  s_18,
  s_5,
  s_5_35_1,
  s_1,
  s_4,
  s_5_6,
  s_6_13,
  s_5,
  s_6_14_0,
  s_0,
  s_6,
  s_6,
  s_0,
  s_2,
  s_20,
  s_6,
  s_6_15,
  s_6,
  s_6,
  s_6_35_38,
  s_7_9_25,
  s_6_10_18,
  s_17_18_19_35,
  s_1_0,
  s_7_26,
  s_1_0,
  s_36,
  s_6,
  s_7,
  s_20_0,
  s_2,
  s_22_32_43,
  s_5,
  s_20,
  s_18,
  s_4_10,
  s_0,
  s_6,
  s_22_0,
  s_5,
  s_18,
  s_7,
  s_0,
  s_20,
  s_13,
  s_15,
  s_6,
  s_5_13_14_25_42,
  s_18,
  s_6,
  s_20,
  s_6,
  s_6_8_11_26_32_37_38,
  s_13,
  s_13,
  s_18,
  s_11,
  s_6,
  s_4_6_10_19_22_25_26_30_43,
  s_0,
  s_6_7_9_10_11_28_30_32_35_38_39_0,
  s_10_11,
  s_6,
  s_6,
  s_6,
  s_10,
  s_6_18,
  s_19,
  s_6,
  s_2,
  s_7,
  s_6_11,
  s_6,
  s_19,
  s_7_15_26,
  s_0,
  s_6_23,
  s_23,
  s_6_10_17_0_2,
  s_6,
  s_6,
  s_0,
  s_0,
  s_13,
  s_13,
  s_6,
  s_5_13,
  s_8_18,
  s_0,
  s_5,
  s_6,
  s_6,
  s_2,
  s_18,
  s_7_9_10,
  s_6,
  s_30,
  s_0,
  s_32,
  s_18,
  s_0,
  s_10,
  s_6_8,
  s_10_26,
  s_26,
  s_0,
  s_4,
  s_6,
  s_6,
  s_5,
  s_18,
  s_10_39,
  s_0,
  s_18,
  s_27,
  s_5,
  s_5,
  s_27,
  s_27,
  s_9_26_39,
  s_13,
  s_0,
  s_13,
  s_0,
  s_7,
  s_0,
  s_0,
  s_7,
  s_9_26_39,
  s_13,
  s_0,
  s_13,
  s_0,
  s_7,
  s_0,
  s_0,
  s_7,
  s_26_30,
  s_0,
  s_0,
  s_2,
  s_26,
  s_20_27,
  s_27,
  s_0,
  s_27,
  s_35,
  s_5,
  s_6,
  s_20,
  s_6,
  s_20,
  s_6,
  s_7_17_35,
  s_0,
  s_11_26,
  s_29_36_41,
  s_0,
  s_0,
  s_5_18_0,
  s_5_18_0,
  s_38,
  s_5_6_27_35_40,
  s_0,
  s_0,
  s_10_18_29,
  s_14_30_38_0,
  s_0,
  s_7,
  s_2,
  s_7,
  s_18,
  s_10_14_1,
  s_40,
  s_8_20_40,
  s_7,
  s_0,
  s_1_0,
  s_14,
  s_18,
  s_4_35_38_39,
  s_6,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_4_11_26,
  s_8,
  s_0,
  s_4_25_26,
  s_18,
  s_10_11_30_35_38_39_43,
  s_4_5_11_38_39_43,
  s_0,
  s_5,
  s_10_18,
  s_15,
  s_4_6_9_14_19_36_38_41,
  s_0,
  s_7,
  s_0,
  s_0,
  s_4,
  s_2,
  s_7,
  s_27_0,
  s_4_38,
  s_14_18,
  s_20,
  s_20,
  s_20,
  s_4_35_38_40,
  s_15_17_27_0,
  s_5,
  s_6,
  s_27,
  s_1_0,
  s_4_13_30_31_35_38_39_0,
  s_7,
  s_0,
  s_2,
  s_5_6,
  s_4_18_32_41,
  s_4,
  s_0,
  s_2,
  s_4,
  s_4_38,
  s_13,
  s_38,
  s_14,
  s_5_6_13_21_28_30_31_35_38_41,
  s_4_19,
  s_10_17_18_21_26,
  s_4_0,
  s_6,
  s_0,
  s_27,
  s_0,
  s_42,
  s_22,
  s_27,
  s_0,
  s_14_23_38,
  s_4_15,
  s_17,
  s_35,
  s_18,
  s_4,
  s_4_6_11_19_23_30_35_40,
  s_0,
  s_6_9,
  s_19,
  s_4,
  s_6_30,
  s_0,
  s_0,
  s_17,
  s_6_7_10_14_17_35_37,
  s_6,
  s_0,
  s_6_27,
  s_4,
  s_18,
  s_18,
  s_18,
  s_4_11_18_22_38_41_2,
  s_6,
  s_6_0,
  s_3_14,
  s_1_0,
  s_28,
  s_15,
  s_18_1,
  s_22,
  s_20,
  s_18,
  s_1,
  s_4,
  s_0,
  s_15,
  s_18,
  s_7,
  s_2,
  s_7,
  s_10,
  s_23,
  s_18,
  s_6_18,
  s_18,
  s_6_29,
  s_0,
  s_4_19,
  s_6,
  s_6,
  s_4_6_38,
  s_5_13_38_41,
  s_13_30_35,
  s_10_30_35_40,
  s_0,
  s_0,
  s_32,
  s_18,
  s_4_11_14_22_26_28_29_30_35_38_42,
  s_4_17_22,
  s_10,
  s_20_28_30,
  s_6,
  s_0,
  s_20,
  s_22_0,
  s_0,
  s_6,
  s_1_0,
  s_11_0,
  s_6,
  s_26,
  s_4_41,
  s_30_38,
  s_0,
  s_7_11,
  s_6,
  s_6,
  s_7_9_10,
  s_0,
  s_2,
  s_4_6_27_29_35_41,
  s_7,
  s_0,
  s_6,
  s_27_0,
  s_7,
  s_7,
  s_23,
  s_23,
  s_5_6_19,
  s_0,
  s_0,
  s_6_17,
  s_10_13,
  s_31,
  s_35_38,
  s_6,
  s_4_41,
  s_18,
  s_18,
  s_27,
  s_27,
  s_39,
  s_27,
  s_27,
  s_19,
  s_6_0,
  s_30,
  s_4,
  s_27,
  s_4,
  s_30,
  s_4,
  s_30,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_4,
  s_26,
  s_6,
  s_27,
  s_27,
  s_6,
  s_6,
  s_6,
  s_6,
  s_4_19_37_38,
  s_4_11_12_14_26_28_29_30_35_39_2_0,
  s_0,
  s_7_37,
  s_0,
  s_6_35,
  s_6,
  s_18,
  s_4_11_26_29_38,
  s_11,
  s_6,
  s_1,
  s_4_7_11_19_26_27_28_30_38,
  s_11,
  s_6,
  s_4_5_6_30_35_38_39_0,
  s_0,
  s_0,
  s_6,
  s_5,
  s_10_18,
  s_33,
  s_4_0,
  s_10,
  s_4_6,
  s_27,
  s_4,
  s_27_0,
  s_6,
  s_6,
  s_6,
  s_15,
  s_18,
  s_6,
  s_4,
  s_14,
  s_5_29,
  s_17_27_30,
  s_20,
  s_7,
  s_0,
  s_0,
  s_6_41,
  s_1_0,
  s_4_22,
  s_30_31_42,
  s_4_22,
  s_30_31_42,
  s_2,
  s_7_9_15_19_26_30_31_39,
  s_0,
  s_4_9,
  s_0,
  s_9,
  s_13_18_34,
  s_18,
  s_19,
  s_18,
  s_20,
  s_1,
  s_0,
  s_9,
  s_4,
  s_27,
  s_9,
  s_6,
  s_4,
  s_5,
  s_9_19_26_39,
  s_19,
  s_0,
  s_18,
  s_0,
  s_7_26,
  s_0,
  s_6_10,
  s_6,
  s_10,
  s_18,
  s_0,
  s_19,
  s_6_7,
  s_6_9_35_41_42,
  s_0,
  s_4,
  s_30_32,
  s_27,
  s_27,
  s_4_6_8_14_22_25_30_35_41,
  s_0,
  s_0,
  s_6_10,
  s_6,
  s_10,
  s_4_22_0,
  s_10,
  s_1_0,
  s_6_20,
  s_0,
  s_30_32_35_36_1_0,
  s_1_0,
  s_4_6_22,
  s_26,
  s_6_10,
  s_0,
  s_0,
  s_17,
  s_10_14,
  s_9,
  s_14,
  s_10,
  s_0,
  s_10,
  s_8,
  s_1,
  s_26,
  s_10,
  s_30_31_36_38_39_40_41_42,
  s_18,
  s_14,
  s_4_14_0,
  s_4_6,
  s_4_7_9,
  s_29_41,
  s_4_27,
  s_18,
  s_20,
  s_17,
  s_18,
  s_18,
  s_0,
  s_18,
  s_13,
  s_35,
  s_18,
  s_4,
  s_2,
  s_7_12,
  s_13,
  s_13,
  s_6_10,
  s_8,
  s_8,
  s_18,
  s_4,
  s_18,
  s_3_9_13,
  s_18,
  s_0,
  s_6_13,
  s_18_32_34_41,
  s_4,
  s_7,
  s_0,
  s_0,
  s_0,
  s_2,
  s_4_7_9,
  s_30_0,
  s_10,
  s_4_5_6_8_10_14_15_18_23_31_38_40,
  s_6_21,
  s_4_6,
  s_18,
  s_6,
  s_6,
  s_6,
  s_23,
  s_0,
  s_7,
  s_10_18_23,
  s_11,
  s_4,
  s_6,
  s_17,
  s_4_6_15,
  s_6_24_26,
  s_41_42,
  s_0,
  s_6,
  s_0,
  s_6,
  s_0,
  s_18,
  s_10,
  s_10_36,
  s_18,
  s_6,
  s_6,
  s_7_10,
  s_11,
  s_6,
  s_38,
  s_18,
  s_0,
  s_6,
  s_4_11_23,
  s_6,
  s_0,
  s_17,
  s_6,
  s_4,
  s_18,
  s_0,
  s_7,
  s_4_13_34_40,
  s_18,
  s_4,
  s_5,
  s_8,
  s_5,
  s_5,
  s_4_35_40,
  s_18_42,
  s_4_7,
  s_0,
  s_32_41,
  s_4_10,
  s_0,
  s_10_0,
  s_2,
  s_4_7_14_18_19_32_35_36_38_41,
  s_44_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_13,
  s_6,
  s_0,
  s_2,
  s_1,
  s_4_17_18_38,
  s_0,
  s_13,
  s_4,
  s_6_0_2,
  s_8_33,
  s_18,
  s_32,
  s_11_12_0,
  s_8,
  s_10_31_32,
  s_18,
  s_10,
  s_6,
  s_40_41,
  s_4,
  s_6,
  s_30,
  s_6,
  s_6,
  s_32,
  s_18,
  s_41,
  s_8,
  s_5,
  s_9_15,
  s_41,
  s_40_41_42,
  s_0,
  s_0,
  s_6_9_30,
  s_22,
  s_4_0,
  s_0,
  s_8,
  s_0,
  s_18,
  s_7,
  s_31,
  s_10,
  s_18,
  s_17,
  s_5,
  s_5,
  s_5_8,
  s_18,
  s_4,
  s_6,
  s_8,
  s_2_0,
  s_18,
  s_10,
  s_28,
  s_0,
  s_4,
  s_31,
  s_0,
  s_9,
  s_15,
  s_5,
  s_18,
  s_4,
  s_13,
  s_10_18_24,
  s_6,
  s_31_36_41,
  s_0,
  s_32,
  s_9_0,
  s_13,
  s_11,
  s_17,
  s_30,
  s_32,
  s_7_9,
  s_0,
  s_7,
  s_0,
  s_7,
  s_8,
  s_14_17_35,
  s_6,
  s_41,
  s_4,
  s_6,
  s_0,
  s_18,
  s_20,
  s_9,
  s_40_41,
  s_9,
  s_32,
  s_9_10,
  s_9,
  s_0,
  s_11,
  s_5_6,
  s_2,
  s_2,
  s_32,
  s_10,
  s_5,
  s_18,
  s_10,
  s_4_21_40_0,
  s_0,
  s_4_21,
  s_41,
  s_0,
  s_5,
  s_5,
  s_41,
  s_6_36_38,
  s_0,
  s_18,
  s_4_6,
  s_31,
  s_0,
  s_2,
  s_9,
  s_0,
  s_4,
  s_0,
  s_2,
  s_32_41,
  s_4_12,
  s_18,
  s_0,
  s_2,
  s_7,
  s_40_41_42,
  s_4,
  s_0,
  s_23,
  s_4_6_8_25_30_33_35,
  s_0,
  s_4_25,
  s_6,
  s_0,
  s_2,
  s_12,
  s_3_6_7_8_9_10_14_26_30_36_41_42,
  s_6_11_0,
  s_27,
  s_27,
  s_4,
  s_41,
  s_1_0,
  s_4_9,
  s_1,
  s_11,
  s_4_7_11,
  s_4,
  s_41,
  s_1_0,
  s_2,
  s_7,
  s_6,
  s_7_10_30_31_36,
  s_4_6_14_17_22,
  s_10_0,
  s_10,
  s_0,
  s_24_0,
  s_2,
  s_1,
  s_5_6,
  s_5,
  s_5,
  s_17,
  s_38,
  s_26,
  s_5,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_27,
  s_15,
  s_10_1,
  s_9_10_13,
  s_0,
  s_32,
  s_32,
  s_10_1,
  s_32_36,
  s_0,
  s_4_10_27,
  s_17,
  s_35,
  s_4,
  s_18,
  s_18,
  s_8,
  s_2,
  s_2,
  s_2,
  s_31,
  s_4,
  s_18,
  s_2,
  s_32,
  s_4,
  s_20,
  s_6_33_35_38,
  s_6,
  s_6_7_10_0_2,
  s_0,
  s_17_2,
  s_0,
  s_26,
  s_2_0,
  s_2,
  s_7,
  s_2,
  s_28,
  s_24_0,
  s_4_6_9,
  s_0,
  s_30_33_35,
  s_10_2_0,
  s_7,
  s_28,
  s_2_0,
  s_10,
  s_6,
  s_0,
  s_2,
  s_7,
  s_11,
  s_18,
  s_0,
  s_2,
  s_19_21_26,
  s_20,
  s_18,
  s_10,
  s_23_0,
  s_6_14,
  s_4_18_38_0_2,
  s_4,
  s_7,
  s_2,
  s_27,
  s_6,
  s_18,
  s_5_25,
  s_6,
  s_17_18_1,
  s_1,
  s_4_22,
  s_30,
  s_0,
  s_18,
  s_4_22,
  s_30,
  s_0,
  s_9,
  s_0,
  s_18_32_41_0,
  s_4_10,
  s_4_10,
  s_18,
  s_20,
  s_6,
  s_18,
  s_4_30_33_35_0,
  s_6,
  s_0,
  s_2,
  s_5,
  s_7_26,
  s_5,
  s_21_31_36_41_0,
  s_4_6_9_14_24,
  s_18_26_38_41,
  s_11,
  s_4,
  s_18,
  s_18,
  s_6,
  s_6_10,
  s_6_17,
  s_10_15,
  s_20,
  s_20,
  s_6_23_0,
  s_2_0,
  s_1,
  s_18,
  s_21,
  s_0,
  s_23_0,
  s_14_23,
  s_25_2_0,
  s_23_0,
  s_24_0,
  s_10_23_24_2_0,
  s_2,
  s_8,
  s_5_13_33,
  s_18,
  s_5_10_18_27_30_31_41,
  s_20,
  s_20,
  s_6,
  s_5,
  s_4_33,
  s_2,
  s_9,
  s_20,
  s_4_38,
  s_0,
  s_6,
  s_6,
  s_14,
  s_10,
  s_9,
  s_6_23_27_31,
  s_0,
  s_35,
  s_4_22,
  s_0,
  s_2,
  s_7,
  s_4_17_26_29_30_36,
  s_6,
  s_20,
  s_0,
  s_7,
  s_6_10_17_30,
  s_0,
  s_0,
  s_4_11_22_26,
  s_0,
  s_30,
  s_30,
  s_18,
  s_7_9,
  s_7,
  s_0,
  s_6_23_0,
  s_26,
  s_7_26,
  s_6,
  s_26,
  s_26,
  s_20,
  s_4_6_8_9_10_28_31_32_35_36_41_42,
  s_0,
  s_18,
  s_6_7_9,
  s_4_6,
  s_23,
  s_15_18,
  s_7_10_14_41,
  s_18_1,
  s_5,
  s_27,
  s_18,
  s_18,
  s_20,
  s_18,
  s_18,
  s_18,
  s_7,
  s_0,
  s_7,
  s_13,
  s_20,
  s_20,
  s_13_18_32_35_0,
  s_18_26,
  s_15,
  s_15,
  s_13,
  s_27,
  s_1,
  s_18,
  s_5,
  s_2,
  s_7,
  s_0,
  s_2,
  s_30_35,
  s_13,
  s_20,
  s_14,
  s_5,
  s_0_1,
  s_2,
  s_4,
  s_41,
  s_14,
  s_4,
  s_41,
  s_4_18,
  s_10,
  s_4_18,
  s_4_7_10,
  s_0,
  s_2,
  s_0,
  s_10,
  s_20,
  s_20,
  s_4_35,
  s_0,
  s_18,
  s_26_29_35,
  s_18_37,
  s_0,
  s_2,
  s_7,
  s_0,
  s_8_30,
  s_0,
  s_15,
  s_4_15,
  s_15,
  s_14_30_32_35_36_40_41_0_2,
  s_21,
  s_21,
  s_18,
  s_0,
  s_18,
  s_26,
  s_18,
  s_0,
  s_0,
  s_0,
  s_21,
  s_18,
  s_4,
  s_18_41_0,
  s_18,
  s_40,
  s_18,
  s_2,
  s_10,
  s_18,
  s_18,
  s_14_26,
  s_20,
  s_0,
  s_13,
  s_11,
  s_5,
  s_18,
  s_9,
  s_15,
  s_10,
  s_6,
  s_6_38_42,
  s_18,
  s_0,
  s_0,
  s_18,
  s_4_19_22_29_30_38_43,
  s_6,
  s_22,
  s_5,
  s_5,
  s_4_6_21_35_38,
  s_4_21,
  s_6,
  s_18,
  s_20,
  s_20,
  s_10_18_35_1,
  s_30,
  s_18,
  s_18,
  s_0,
  s_2,
  s_0,
  s_2,
  s_26,
  s_27,
  s_28,
  s_23_24_28,
  s_38_41_0,
  s_10,
  s_18,
  s_2,
  s_4_6_36,
  s_0_2,
  s_29_30,
  s_6,
  s_18,
  s_11,
  s_2,
  s_18_0,
  s_7_9_26,
  s_27,
  s_18,
  s_15,
  s_34,
  s_6_7_26_30_35_36_37_39_40,
  s_0,
  s_2,
  s_12,
  s_6,
  s_1_0,
  s_6,
  s_18,
  s_18_1,
  s_18,
  s_18,
  s_18,
  s_18,
  s_15,
  s_28,
  s_7,
  s_0,
  s_18,
  s_6,
  s_13,
  s_13_30,
  s_10_0,
  s_18,
  s_4_19_26,
  s_1,
  s_1,
  s_28,
  s_6,
  s_0,
  s_18,
  s_13,
  s_18,
  s_18,
  s_0,
  s_7,
  s_7_12,
  s_14_0,
  s_26,
  s_13,
  s_13,
  s_5,
  s_15,
  s_6,
  s_6,
  s_18,
  s_18,
  s_12_37,
  s_37,
  s_0,
  s_4_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7,
  s_0,
  s_20,
  s_13_20,
  s_20,
  s_20,
  s_6_8,
  s_0,
  s_0,
  s_28,
  s_6_8_14_15_19_25_35_36,
  s_0,
  s_20,
  s_5,
  s_5,
  s_0,
  s_6,
  s_6,
  s_18,
  s_15,
  s_10_18_1,
  s_4_35_38,
  s_2,
  s_7,
  s_4,
  s_0,
  s_12,
  s_20,
  s_5_20,
  s_13,
  s_13_34,
  s_10,
  s_10,
  s_41,
  s_4_6_7,
  s_0,
  s_2,
  s_7,
  s_26_35,
  s_30_35,
  s_0,
  s_0,
  s_18,
  s_6_29,
  s_18,
  s_20,
  s_5_6_18_35,
  s_20,
  s_5,
  s_5,
  s_18,
  s_35_38,
  s_5,
  s_4_38,
  s_0,
  s_0,
  s_7,
  s_20,
  s_6_9_14_15_18_19_26_33_42_0,
  s_6_7_24,
  s_6_1_0,
  s_2,
  s_18,
  s_9_15,
  s_18,
  s_18,
  s_6,
  s_6,
  s_0,
  s_6,
  s_2,
  s_2,
  s_0,
  s_18_19_22_27_30_35,
  s_26,
  s_0,
  s_0,
  s_1,
  s_2,
  s_7,
  s_13,
  s_20,
  s_20,
  s_0,
  s_17_29_30,
  s_2,
  s_7,
  s_0,
  s_0,
  s_4,
  s_18,
  s_0,
  s_10_29,
  s_0,
  s_2,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_14,
  s_28,
  s_20_22,
  s_29_30,
  s_27,
  s_26,
  s_0,
  s_7,
  s_2,
  s_7,
  s_6_11_20_36,
  s_20,
  s_13_18,
  s_18,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_4_7_26,
  s_0,
  s_2,
  s_7_9,
  s_20,
  s_20,
  s_0,
  s_13,
  s_18,
  s_2,
  s_0,
  s_2,
  s_0,
  s_15,
  s_37_41,
  s_0,
  s_0,
  s_4_12,
  s_0,
  s_25,
  s_1,
  s_1,
  s_18_30_41_42,
  s_18,
  s_13,
  s_4,
  s_6,
  s_14,
  s_27,
  s_14,
  s_23,
  s_14,
  s_10_40,
  s_5,
  s_5,
  s_18,
  s_20,
  s_4_35,
  s_18,
  s_18,
  s_4_2_0,
  s_4_18,
  s_5,
  s_5,
  s_26_31_34,
  s_0,
  s_13_32_41,
  s_15,
  s_27_37_40,
  s_0,
  s_4,
  s_18,
  s_26,
  s_0,
  s_7,
  s_7,
  s_1,
  s_2,
  s_18,
  s_0,
  s_18_0,
  s_18,
  s_0,
  s_6,
  s_13,
  s_10_26,
  s_15_20,
  s_15,
  s_15,
  s_10,
  s_10,
  s_15,
  s_10,
  s_10_18,
  s_18,
  s_10_18,
  s_18,
  s_18,
  s_6,
  s_34_36_42,
  s_34_36_42,
  s_0,
  s_4_12,
  s_4_12,
  s_0,
  s_0,
  s_5,
  s_0,
  s_0,
  s_0,
  s_5,
  s_28_30_35_0_2,
  s_4_18_33,
  s_18,
  s_27,
  s_7_26,
  s_2,
  s_5,
  s_5,
  s_0,
  s_27_30_32,
  s_4_10,
  s_0,
  s_2,
  s_7_10,
  s_18,
  s_6,
  s_20,
  s_20,
  s_4_33_35_38_41,
  s_18,
  s_0,
  s_19_29_37_39_43,
  s_0,
  s_20,
  s_27,
  s_20,
  s_27,
  s_39,
  s_4,
  s_6_18,
  s_20,
  s_4_7_10,
  s_15,
  s_4,
  s_18,
  s_4_7_10_11_14_24_33_35_42,
  s_0_1,
  s_9,
  s_18,
  s_7,
  s_2,
  s_18,
  s_22_0,
  s_14_21_40,
  s_6_8_9,
  s_9_11_0,
  s_9,
  s_18_1,
  s_1,
  s_2,
  s_9,
  s_0,
  s_4_21,
  s_40,
  s_11_18,
  s_21,
  s_5,
  s_8,
  s_11,
  s_1,
  s_0,
  s_4_15,
  s_1,
  s_20,
  s_5,
  s_7,
  s_6_0,
  s_1,
  s_6,
  s_1,
  s_1,
  s_20,
  s_1,
  s_20,
  s_6_1,
  s_26,
  s_8_20,
  s_10_18_26_38,
  s_20,
  s_20,
  s_0,
  s_6_25_35,
  s_10,
  s_2,
  s_10,
  s_10_0,
  s_11,
  s_14,
  s_5_6_27,
  s_27,
  s_27,
  s_6,
  s_35,
  s_30,
  s_25,
  s_5,
  s_27,
  s_27,
  s_27,
  s_0,
  s_2,
  s_7,
  s_30,
  s_0,
  s_0,
  s_23,
  s_28_32_41,
  s_6,
  s_5,
  s_5,
  s_40,
  s_0,
  s_4_6,
  s_6,
  s_18,
  s_4_9,
  s_4_9,
  s_6,
  s_0,
  s_18,
  s_6_26,
  s_6_25_35,
  s_0,
  s_0,
  s_41_2_0,
  s_4_10,
  s_2,
  s_0,
  s_2_0,
  s_0,
  s_2,
  s_7,
  s_26,
  s_26,
  s_7_12_18_26,
  s_20,
  s_6,
  s_20,
  s_7,
  s_20,
  s_0,
  s_6_30_33,
  s_0,
  s_6,
  s_6,
  s_0,
  s_0,
  s_6,
  s_18,
  s_4_33,
  s_4_9_11_22_26,
  s_4_10_11_26_37_41,
  s_2,
  s_7_12,
  s_18,
  s_0,
  s_6_10,
  s_35,
  s_0,
  s_0,
  s_2,
  s_7,
  s_6,
  s_6_10_28_0_1,
  s_0,
  s_9_14,
  s_18_1,
  s_1,
  s_9,
  s_7_28,
  s_9,
  s_6,
  s_6,
  s_8_9_18_20,
  s_0,
  s_7,
  s_0,
  s_14,
  s_14,
  s_10_32,
  s_27,
  s_6,
  s_6,
  s_10_32,
  s_27,
  s_0,
  s_6,
  s_10,
  s_6_18,
  s_0,
  s_15,
  s_18_1,
  s_18,
  s_18,
  s_15,
  s_18,
  s_15,
  s_6_26_38,
  s_10_18,
  s_18,
  s_18,
  s_6,
  s_5_18,
  s_6,
  s_18,
  s_6,
  s_5,
  s_5,
  s_5,
  s_27,
  s_27,
  s_15,
  s_5,
  s_18,
  s_18,
  s_10_1,
  s_6,
  s_4,
  s_18,
  s_6,
  s_15,
  s_6_10_29_32_35_39,
  s_0,
  s_18,
  s_6_33,
  s_14_32,
  s_18,
  s_18,
  s_18,
  s_18,
  s_12,
  s_20,
  s_2,
  s_7_21_23_29_30_33_38_40,
  s_4_18,
  s_15,
  s_0,
  s_2,
  s_7,
  s_2,
  s_0,
  s_32,
  s_18,
  s_18,
  s_4_28,
  s_6,
  s_18,
  s_18_23,
  s_4,
  s_27,
  s_1_0,
  s_26,
  s_27,
  s_26,
  s_22,
  s_5,
  s_18,
  s_17,
  s_20,
  s_13,
  s_15,
  s_18,
  s_15,
  s_18,
  s_10,
  s_20,
  s_14_20,
  s_27,
  s_18,
  s_5,
  s_20,
  s_19,
  s_20,
  s_20,
  s_18,
  s_27,
  s_5,
  s_20,
  s_5,
  s_15,
  s_14,
  s_15,
  s_10,
  s_18_1,
  s_17_18_1,
  s_15,
  s_18,
  s_20,
  s_20,
  s_7_8_12_20_26_37_39,
  s_27,
  s_18_0,
  s_2,
  s_4_7,
  s_18,
  s_20,
  s_8,
  s_0,
  s_6,
  s_5,
  s_6_14,
  s_6,
  s_5,
  s_15,
  s_13,
  s_1,
  s_1,
  s_14,
  s_10,
  s_5,
  s_14,
  s_5,
  s_5,
  s_1,
  s_5,
  s_0,
  s_5,
  s_5,
  s_5,
  s_27,
  s_38,
  s_23,
  s_4_38,
  s_6,
  s_5_15,
  s_6,
  s_17,
  s_15,
  s_5_6,
  s_18,
  s_18,
  s_0,
  s_6,
  s_18,
  s_18,
  s_38,
  s_18,
  s_1_0,
  s_4_22,
  s_29_35_37,
  s_18,
  s_0,
  s_4_19,
  s_4_22,
  s_29_35_37,
  s_18,
  s_0,
  s_6,
  s_15,
  s_15,
  s_1,
  s_14,
  s_6,
  s_5,
  s_15,
  s_18_1,
  s_18,
  s_4_10,
  s_4_21_33_41,
  s_18,
  s_4,
  s_7_27,
  s_4_38,
  s_6,
  s_5,
  s_4_5_6_9_13_23_28_33_0,
  s_6,
  s_6,
  s_5_18,
  s_18,
  s_14,
  s_2,
  s_26,
  s_7,
  s_20,
  s_8,
  s_8,
  s_20,
  s_22,
  s_20,
  s_20,
  s_0,
  s_18,
  s_18,
  s_7,
  s_4,
  s_10_18_23,
  s_13,
  s_26,
  s_0,
  s_0,
  s_18,
  s_6,
  s_7_10,
  s_0,
  s_18,
  s_15,
  s_5,
  s_18,
  s_1,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6_14_33,
  s_6,
  s_14,
  s_18,
  s_17,
  s_14,
  s_0,
  s_8,
  s_8,
  s_0,
  s_6,
  s_19_26_29,
  s_0,
  s_6,
  s_18,
  s_18,
  s_6,
  s_6_20,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_15,
  s_6,
  s_4_6_10,
  s_6,
  s_6,
  s_17_18,
  s_14,
  s_6_41,
  s_18,
  s_4,
  s_18,
  s_4_6_7_10_17_35,
  s_4_10_39_42,
  s_0,
  s_5,
  s_6_40,
  s_13_20,
  s_6,
  s_6,
  s_6_29,
  s_6_10_27,
  s_18,
  s_13_20,
  s_0,
  s_32,
  s_0,
  s_18,
  s_6,
  s_26,
  s_9,
  s_20,
  s_0,
  s_6_14_36_0,
  s_18,
  s_20,
  s_4,
  s_18,
  s_18,
  s_18,
  s_5,
  s_5,
  s_18,
  s_0,
  s_20,
  s_11_27_29_32,
  s_6,
  s_26,
  s_20,
  s_6_18,
  s_0,
  s_2,
  s_7,
  s_6_10_15_18_36,
  s_13_20,
  s_1,
  s_6_29,
  s_0,
  s_0,
  s_18,
  s_6_35_40,
  s_27,
  s_18,
  s_27,
  s_6_13_36_40,
  s_18_40,
  s_10,
  s_17,
  s_6_35,
  s_5,
  s_6,
  s_18,
  s_6_14_18_33,
  s_6_35,
  s_18,
  s_6_35,
  s_18,
  s_5,
  s_7,
  s_0,
  s_2,
  s_7,
  s_5,
  s_6_35,
  s_18,
  s_15,
  s_6_26_27_32_33,
  s_6_18,
  s_15,
  s_10_32,
  s_15,
  s_0,
  s_7,
  s_15,
  s_4_6_26_35,
  s_17,
  s_22,
  s_0,
  s_30,
  s_18,
  s_6,
  s_5,
  s_19,
  s_18,
  s_6,
  s_27,
  s_27,
  s_27,
  s_6,
  s_4_29,
  s_18,
  s_4_22,
  s_0,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_4,
  s_1,
  s_8,
  s_26,
  s_20,
  s_8,
  s_20,
  s_1,
  s_26,
  s_18,
  s_9,
  s_4,
  s_1,
  s_4,
  s_1,
  s_20,
  s_4,
  s_20,
  s_20,
  s_18,
  s_1,
  s_1,
  s_4_13,
  s_5,
  s_5,
  s_5,
  s_6,
  s_4,
  s_4,
  s_5,
  s_22,
  s_6,
  s_6,
  s_6_21_30_35_40,
  s_13,
  s_18,
  s_10,
  s_6,
  s_18,
  s_6,
  s_18,
  s_6,
  s_4_6_30_32_35_41,
  s_44,
  s_18,
  s_4_6_14,
  s_10,
  s_18,
  s_5,
  s_14,
  s_0,
  s_7,
  s_4_7,
  s_18,
  s_6,
  s_10,
  s_18,
  s_2,
  s_7,
  s_14_0,
  s_6_29,
  s_6_7_24_30_31_32_35,
  s_18,
  s_1,
  s_15_18,
  s_20,
  s_0,
  s_0,
  s_4_6_10,
  s_0,
  s_7,
  s_6,
  s_5,
  s_18,
  s_18_23,
  s_1,
  s_6,
  s_18,
  s_6,
  s_0,
  s_4,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4_10,
  s_18,
  s_18_39,
  s_18,
  s_7,
  s_0,
  s_39,
  s_18_0,
  s_5,
  s_20,
  s_20,
  s_2,
  s_4,
  s_20,
  s_15,
  s_20,
  s_4_39,
  s_6,
  s_5,
  s_5,
  s_10_36,
  s_10_18,
  s_23,
  s_13,
  s_40,
  s_23,
  s_4,
  s_26,
  s_15,
  s_21,
  s_20,
  s_6_30,
  s_6,
  s_0,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_20,
  s_20,
  s_18,
  s_5,
  s_23_32_38,
  s_20,
  s_18,
  s_18,
  s_28,
  s_19,
  s_20,
  s_9,
  s_18,
  s_18,
  s_18,
  s_18,
  s_5,
  s_6_27_29_30,
  s_6_13_27,
  s_27,
  s_30,
  s_30,
  s_0,
  s_0,
  s_7,
  s_29,
  s_0,
  s_5,
  s_5,
  s_5,
  s_5,
  s_0,
  s_7,
  s_6,
  s_6,
  s_20,
  s_21,
  s_6_13_18_27,
  s_10,
  s_6,
  s_10_30_35_36,
  s_4_10,
  s_15_17_18,
  s_20,
  s_22,
  s_0,
  s_1,
  s_9,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_10,
  s_18,
  s_14,
  s_14,
  s_7_10,
  s_8,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9_14,
  s_9_18_32_0,
  s_4,
  s_9,
  s_29_32,
  s_0,
  s_18,
  s_18,
  s_7_9,
  s_9,
  s_29_32,
  s_0,
  s_2,
  s_4_9,
  s_29_36,
  s_4_11_14_28,
  s_1,
  s_0,
  s_6_18,
  s_6_13_1_0,
  s_2,
  s_4_7,
  s_0,
  s_2,
  s_7,
  s_10_11,
  s_5_18,
  s_1_0,
  s_1,
  s_2,
  s_9,
  s_18,
  s_9,
  s_5,
  s_13_15,
  s_18,
  s_15,
  s_15,
  s_1_0,
  s_7,
  s_2,
  s_1,
  s_0,
  s_18,
  s_13_20,
  s_20,
  s_13,
  s_20,
  s_1,
  s_8,
  s_8,
  s_10_1,
  s_18,
  s_1,
  s_9_18,
  s_20,
  s_15,
  s_4,
  s_18_1,
  s_13,
  s_14,
  s_9,
  s_7_14,
  s_1,
  s_1,
  s_15,
  s_1,
  s_6_9_10,
  s_14,
  s_18,
  s_15_18,
  s_6,
  s_0,
  s_2,
  s_7,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18_1,
  s_7,
  s_35_37_41_0,
  s_14,
  s_18,
  s_0,
  s_0,
  s_7,
  s_18,
  s_2,
  s_4,
  s_30,
  s_14,
  s_8,
  s_38,
  s_10,
  s_10,
  s_0,
  s_2,
  s_7_26,
  s_9_14,
  s_5,
  s_0,
  s_5,
  s_9,
  s_5,
  s_17,
  s_25_1,
  s_1,
  s_9,
  s_1,
  s_5,
  s_20,
  s_20,
  s_20,
  s_18,
  s_0_1,
  s_0_1,
  s_2,
  s_9,
  s_9,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_18,
  s_9,
  s_18,
  s_1_0,
  s_1_0,
  s_2,
  s_18,
  s_5,
  s_5,
  s_9,
  s_1,
  s_1,
  s_9,
  s_5,
  s_5,
  s_4,
  s_4,
  s_5,
  s_5,
  s_5,
  s_1,
  s_18,
  s_9,
  s_20,
  s_1,
  s_1,
  s_9,
  s_10_18,
  s_18,
  s_15,
  s_6,
  s_15,
  s_10_18_1,
  s_17,
  s_0,
  s_1,
  s_9,
  s_0,
  s_1,
  s_2,
  s_1,
  s_5,
  s_4,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_1,
  s_18,
  s_9,
  s_5_8_9,
  s_10_18_1,
  s_20,
  s_0,
  s_24,
  s_10_1,
  s_4,
  s_18,
  s_27,
  s_27,
  s_15,
  s_0,
  s_0,
  s_6,
  s_28_0,
  s_30_36,
  s_11_22,
  s_0,
  s_18,
  s_14,
  s_1,
  s_18,
  s_9,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4_41,
  s_18,
  s_10,
  s_1,
  s_18,
  s_18,
  s_18,
  s_20,
  s_20,
  s_20,
  s_27,
  s_9,
  s_14,
  s_29_36,
  s_9_26_28,
  s_1,
  s_32,
  s_0,
  s_10,
  s_0,
  s_4_10_32,
  s_4_29_30_31_32_33_35_36_37_38_39_40,
  s_6,
  s_0,
  s_0,
  s_4_7,
  s_0,
  s_4,
  s_4_15,
  s_6,
  s_20,
  s_6,
  s_17_38,
  s_15,
  s_1,
  s_1,
  s_18_1,
  s_6,
  s_7,
  s_0,
  s_6,
  s_27,
  s_6,
  s_13,
  s_10,
  s_15,
  s_13,
  s_15_26,
  s_30,
  s_30,
  s_6,
  s_9_10_18_36_37_38,
  s_5,
  s_0,
  s_7,
  s_0,
  s_36,
  s_18,
  s_18,
  s_0,
  s_6,
  s_8,
  s_27,
  s_28,
  s_14,
  s_18,
  s_5_14_17_18_0,
  s_18,
  s_7_26,
  s_5,
  s_26,
  s_5_23,
  s_10_32,
  s_27,
  s_10,
  s_6_41,
  s_5_18,
  s_0,
  s_25,
  s_0,
  s_25,
  s_18,
  s_27,
  s_10_32_42,
  s_0,
  s_23,
  s_23,
  s_2,
  s_23,
  s_13,
  s_13,
  s_15,
  s_18_1,
  s_18,
  s_18,
  s_10,
  s_2,
  s_7_26,
  s_0,
  s_18,
  s_20,
  s_18,
  s_4_9_21_40_41,
  s_0,
  s_4_6,
  s_23,
  s_23,
  s_28,
  s_28,
  s_0,
  s_7_26,
  s_5,
  s_10_29,
  s_18,
  s_10,
  s_18,
  s_13,
  s_10,
  s_10,
  s_17,
  s_18_23,
  s_1_0,
  s_14_36,
  s_0,
  s_18,
  s_6,
  s_6,
  s_18,
  s_18,
  s_5_20_23,
  s_0,
  s_18,
  s_18,
  s_6_18,
  s_20,
  s_18,
  s_18,
  s_6_0,
  s_6,
  s_0,
  s_6_0,
  s_6,
  s_10,
  s_6_13,
  s_4_6_7,
  s_14,
  s_26_38,
  s_26,
  s_0,
  s_4_6_13_35,
  s_20,
  s_7_13_20_39_0,
  s_13,
  s_2_0,
  s_27,
  s_13,
  s_13,
  s_0,
  s_6,
  s_8,
  s_1,
  s_26,
  s_20,
  s_5,
  s_8,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_6,
  s_18,
  s_20,
  s_18,
  s_18,
  s_4_41,
  s_18,
  s_20,
  s_5,
  s_5,
  s_5,
  s_6,
  s_6,
  s_18,
  s_20_27,
  s_18,
  s_33_35,
  s_6,
  s_6_8_35,
  s_10,
  s_18,
  s_18,
  s_28,
  s_0,
  s_2,
  s_7,
  s_14_21,
  s_14,
  s_18,
  s_9,
  s_18,
  s_18,
  s_6_7_35,
  s_18,
  s_6,
  s_9_10,
  s_18,
  s_10,
  s_18,
  s_18,
  s_6,
  s_7_29_30_31_32_34_35_36_38_40_41,
  s_10_21,
  s_9_0,
  s_7,
  s_18,
  s_4_10_0,
  s_15,
  s_15,
  s_6,
  s_5,
  s_18,
  s_8,
  s_1,
  s_0,
  s_0,
  s_0,
  s_1_0,
  s_2,
  s_30_35,
  s_0,
  s_22_26,
  s_17,
  s_20_0,
  s_37,
  s_0,
  s_20,
  s_15,
  s_12,
  s_18,
  s_1,
  s_20,
  s_8_20,
  s_2,
  s_12,
  s_0,
  s_12,
  s_6_18,
  s_7,
  s_4,
  s_30,
  s_4,
  s_30_31,
  s_0,
  s_7_32,
  s_4,
  s_30_31,
  s_4,
  s_30,
  s_0,
  s_4_38_39,
  s_8,
  s_26,
  s_1,
  s_8,
  s_4_7_26_29_39_43,
  s_5,
  s_5,
  s_5,
  s_0,
  s_2,
  s_0,
  s_18,
  s_15,
  s_10,
  s_6_23_27_30_35_39_40,
  s_18,
  s_0,
  s_6,
  s_23,
  s_6,
  s_0,
  s_18,
  s_6,
  s_6,
  s_18,
  s_6,
  s_20,
  s_0,
  s_18_1,
  s_20,
  s_26,
  s_5,
  s_27,
  s_0,
  s_20,
  s_7_13_30_35_39_40,
  s_0,
  s_18,
  s_18,
  s_7_11_30_39,
  s_7_11_0,
  s_35,
  s_18,
  s_20,
  s_21,
  s_20,
  s_20,
  s_12,
  s_0,
  s_2,
  s_12,
  s_8,
  s_20,
  s_20,
  s_17,
  s_18,
  s_6,
  s_18,
  s_8,
  s_1,
  s_0,
  s_2,
  s_7,
  s_4_10_38,
  s_6,
  s_4,
  s_9_11_39,
  s_9,
  s_0,
  s_4_9_10_39,
  s_18,
  s_7_11_39,
  s_0,
  s_26,
  s_26,
  s_6,
  s_20,
  s_5,
  s_5,
  s_4_38,
  s_10_2,
  s_7_39,
  s_0,
  s_7,
  s_0,
  s_26,
  s_7_11_39,
  s_0,
  s_0,
  s_7,
  s_28,
  s_28,
  s_12_32_39,
  s_12,
  s_2,
  s_14,
  s_0,
  s_22,
  s_30,
  s_22,
  s_30,
  s_2,
  s_6_17_25,
  s_5,
  s_20,
  s_18,
  s_5,
  s_5,
  s_5,
  s_27,
  s_0,
  s_7,
  s_0,
  s_7,
  s_17,
  s_27,
  s_20,
  s_20,
  s_6,
  s_13,
  s_40,
  s_1,
  s_20,
  s_26,
  s_8,
  s_12_26,
  s_0,
  s_2,
  s_7_12_26,
  s_0,
  s_0,
  s_10_27,
  s_4_26,
  s_0,
  s_30_32,
  s_7,
  s_20,
  s_0,
  s_2,
  s_7_26_32,
  s_7_10_32_36,
  s_8,
  s_26,
  s_18,
  s_10,
  s_2,
  s_5,
  s_7,
  s_5,
  s_26,
  s_20,
  s_26,
  s_26,
  s_1,
  s_5,
  s_26,
  s_6_10_0,
  s_1,
  s_8,
  s_1,
  s_9,
  s_15,
  s_15,
  s_6,
  s_0,
  s_0,
  s_7_12_19_26_37_39_43,
  s_4_29,
  s_0,
  s_2,
  s_19_0,
  s_2,
  s_5,
  s_20,
  s_8,
  s_27,
  s_18,
  s_27,
  s_6,
  s_27,
  s_27,
  s_27,
  s_26,
  s_6,
  s_27_30_35,
  s_0,
  s_0,
  s_7,
  s_39,
  s_7,
  s_0,
  s_20,
  s_2,
  s_12_26,
  s_17,
  s_7_34_40,
  s_27,
  s_27,
  s_8,
  s_1,
  s_27,
  s_13,
  s_6,
  s_8,
  s_7,
  s_0,
  s_7,
  s_0,
  s_5_18,
  s_34,
  s_34,
  s_0,
  s_2,
  s_4_7,
  s_6,
  s_27,
  s_20,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_38,
  s_38,
  s_27,
  s_20_27,
  s_27,
  s_11_22,
  s_1,
  s_27,
  s_22,
  s_27,
  s_27,
  s_26,
  s_20,
  s_27,
  s_6,
  s_6,
  s_4_6,
  s_28,
  s_20,
  s_25_32_35,
  s_0,
  s_0,
  s_29,
  s_5,
  s_5,
  s_8,
  s_5,
  s_5,
  s_30_35,
  s_5,
  s_27,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_13,
  s_10_18,
  s_1,
  s_0,
  s_6,
  s_9,
  s_18_0_1,
  s_9,
  s_21,
  s_5,
  s_15,
  s_6_10_32_35_37,
  s_0,
  s_10,
  s_4_6_9_15,
  s_4_18,
  s_4_18,
  s_0,
  s_6,
  s_6,
  s_4_18,
  s_5_15_18,
  s_8,
  s_0,
  s_5,
  s_18,
  s_20,
  s_20,
  s_27,
  s_5,
  s_8_14_18,
  s_13,
  s_11_32_34,
  s_10,
  s_5_18,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_18,
  s_23,
  s_0,
  s_5,
  s_6_18,
  s_18,
  s_18,
  s_2_0,
  s_2_0,
  s_2_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_0,
  s_18,
  s_18,
  s_0,
  s_7,
  s_0,
  s_7,
  s_0,
  s_18,
  s_6,
  s_18,
  s_11,
  s_18,
  s_11,
  s_18,
  s_5,
  s_18,
  s_18,
  s_18,
  s_15,
  s_18,
  s_18,
  s_1,
  s_1,
  s_27,
  s_18,
  s_6_18_29,
  s_39,
  s_6,
  s_18,
  s_18,
  s_10,
  s_4_11_0,
  s_26,
  s_26,
  s_27,
  s_15,
  s_6,
  s_7_21_27_0,
  s_18,
  s_18,
  s_4_6_18_41,
  s_4,
  s_5,
  s_20,
  s_0,
  s_20,
  s_5,
  s_20,
  s_20,
  s_15,
  s_20,
  s_5,
  s_5,
  s_20,
  s_18,
  s_18,
  s_18,
  s_6,
  s_18,
  s_35,
  s_15,
  s_18,
  s_27,
  s_20,
  s_18,
  s_18,
  s_6_18,
  s_4_33,
  s_6,
  s_6,
  s_18,
  s_4,
  s_18,
  s_15,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6,
  s_15,
  s_18,
  s_15,
  s_15,
  s_15,
  s_18,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_8,
  s_1,
  s_1,
  s_8,
  s_1,
  s_8,
  s_18,
  s_18,
  s_10,
  s_6,
  s_18,
  s_18,
  s_17,
  s_0,
  s_18,
  s_6_39,
  s_18,
  s_10,
  s_18,
  s_18,
  s_18,
  s_6,
  s_8,
  s_20,
  s_4,
  s_18,
  s_5,
  s_5,
  s_5,
  s_26,
  s_26,
  s_0,
  s_27,
  s_13,
  s_6_7_0_2,
  s_18,
  s_10,
  s_10,
  s_20,
  s_20,
  s_0,
  s_0,
  s_18,
  s_7,
  s_7_12_21,
  s_13,
  s_18,
  s_20,
  s_0,
  s_18_41,
  s_18,
  s_30,
  s_18_0,
  s_10_31,
  s_4,
  s_23,
  s_23,
  s_27,
  s_18,
  s_5,
  s_5,
  s_5,
  s_6_27,
  s_5,
  s_5_13_18_35,
  s_13_20,
  s_4,
  s_5,
  s_4,
  s_20,
  s_0,
  s_25,
  s_0,
  s_0,
  s_14,
  s_5_18,
  s_5,
  s_20,
  s_5,
  s_18,
  s_0,
  s_18,
  s_18,
  s_4_6_8_18_35,
  s_18,
  s_8_17_34,
  s_0,
  s_2,
  s_18,
  s_6,
  s_6,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_13,
  s_5,
  s_18,
  s_15_18,
  s_15,
  s_15_18,
  s_34,
  s_34,
  s_0,
  s_20,
  s_0,
  s_17,
  s_5,
  s_5,
  s_20,
  s_9_10,
  s_18,
  s_18,
  s_10,
  s_6_0,
  s_10_18_32,
  s_18,
  s_10,
  s_18,
  s_10,
  s_0,
  s_20,
  s_15,
  s_18,
  s_15,
  s_9_10_1_0,
  s_27,
  s_10,
  s_6,
  s_13,
  s_18,
  s_4_6_7_35_40,
  s_18,
  s_5,
  s_13,
  s_18,
  s_18,
  s_6_20,
  s_23,
  s_18,
  s_7,
  s_34,
  s_18,
  s_18,
  s_26,
  s_0,
  s_41_42,
  s_0,
  s_4_14,
  s_14,
  s_18,
  s_4_0,
  s_4_9_14,
  s_0,
  s_2,
  s_6_18,
  s_4,
  s_6_14_29,
  s_0,
  s_18,
  s_18,
  s_10,
  s_14,
  s_6,
  s_4_6_31_35_38_40,
  s_18,
  s_0,
  s_7_10_18_26_28_36_42,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_18,
  s_5,
  s_5,
  s_0,
  s_7,
  s_5,
  s_0,
  s_2,
  s_7,
  s_5,
  s_5,
  s_18_23,
  s_0,
  s_30_35,
  s_4_10_26,
  s_0,
  s_0,
  s_5_7_9_10_14_23_26_31_35,
  s_0,
  s_18,
  s_7_24,
  s_4,
  s_10_0,
  s_7,
  s_2,
  s_7,
  s_6_18_30_40_0,
  s_44_0,
  s_4_10_11,
  s_18_1,
  s_1,
  s_18,
  s_6,
  s_6,
  s_4_8_35,
  s_4,
  s_13_18,
  s_18,
  s_6_9,
  s_7_13_17_20_23_27_30_35,
  s_15,
  s_18,
  s_7,
  s_7,
  s_0,
  s_18_23,
  s_20,
  s_6,
  s_20,
  s_20,
  s_20,
  s_20,
  s_9,
  s_18,
  s_1,
  s_0_1,
  s_2,
  s_4,
  s_20,
  s_23,
  s_6,
  s_18,
  s_5,
  s_18,
  s_15,
  s_13_20,
  s_20,
  s_6,
  s_6_23_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_7,
  s_18,
  s_10,
  s_0,
  s_2,
  s_0,
  s_2,
  s_10,
  s_2,
  s_18,
  s_18,
  s_18,
  s_18,
  s_7_26,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6_14_36,
  s_18,
  s_18,
  s_6,
  s_18,
  s_4,
  s_7_27,
  s_0,
  s_6,
  s_0,
  s_18,
  s_6_18,
  s_13,
  s_4_7_10_18_21_32_40,
  s_0,
  s_18,
  s_18,
  s_10,
  s_18,
  s_0,
  s_7,
  s_29_30,
  s_0,
  s_4_26,
  s_17,
  s_1,
  s_8,
  s_1,
  s_26,
  s_26,
  s_1,
  s_0,
  s_6_13_20,
  s_13_20,
  s_1,
  s_6,
  s_10_20,
  s_0,
  s_10_36,
  s_10,
  s_6_1_0,
  s_1_0,
  s_2,
  s_6_10,
  s_27,
  s_18,
  s_9,
  s_26,
  s_6,
  s_14,
  s_13,
  s_18,
  s_4_6_35_41,
  s_6_18,
  s_4,
  s_20,
  s_0,
  s_4_7_9_31_35,
  s_0,
  s_4_9_0,
  s_6_13_18_20_32_33_34_35,
  s_5,
  s_11,
  s_5_13,
  s_15,
  s_0,
  s_0,
  s_0,
  s_0,
  s_6_11_35_37_40,
  s_0,
  s_2,
  s_12,
  s_6,
  s_6,
  s_4_26,
  s_0,
  s_34_37,
  s_0,
  s_2,
  s_6_0,
  s_2,
  s_2_0,
  s_12,
  s_0,
  s_2,
  s_21,
  s_0,
  s_6_10_28_35_0,
  s_18,
  s_27_31_35_37,
  s_0,
  s_20,
  s_2,
  s_0,
  s_7,
  s_6,
  s_18,
  s_18,
  s_6,
  s_15,
  s_0,
  s_18_26,
  s_26,
  s_26,
  s_26,
  s_6,
  s_1,
  s_4,
  s_7,
  s_38_42,
  s_9_11_19,
  s_1,
  s_2,
  s_1,
  s_17,
  s_7_12_19,
  s_4_6_10,
  s_11_13,
  s_5_6_7_14_18_23_30_0,
  s_5,
  s_18,
  s_5,
  s_0,
  s_5,
  s_2,
  s_7,
  s_15,
  s_4_26_34_35,
  s_0,
  s_18,
  s_4,
  s_26_27_35,
  s_18,
  s_0,
  s_6,
  s_0,
  s_18,
  s_20,
  s_2,
  s_7,
  s_0,
  s_18_0,
  s_6,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_6,
  s_27,
  s_5,
  s_18_1,
  s_18,
  s_15,
  s_4_7,
  s_2,
  s_7,
  s_0,
  s_6,
  s_10_18_1,
  s_18,
  s_6_7_13_15_17_18_30_0_1,
  s_21,
  s_15,
  s_18,
  s_5,
  s_20,
  s_18,
  s_20,
  s_5,
  s_5,
  s_13,
  s_18,
  s_6,
  s_20,
  s_18,
  s_6_1,
  s_19,
  s_0,
  s_7,
  s_15,
  s_5,
  s_2,
  s_4,
  s_6,
  s_7_26,
  s_27,
  s_14,
  s_6,
  s_13,
  s_27,
  s_15,
  s_5,
  s_1,
  s_26,
  s_1,
  s_18,
  s_17,
  s_15,
  s_15,
  s_20,
  s_15,
  s_5,
  s_17,
  s_31_32_39,
  s_18,
  s_10,
  s_5,
  s_5,
  s_0,
  s_2,
  s_7,
  s_1,
  s_18,
  s_27,
  s_18,
  s_15,
  s_6,
  s_18_1,
  s_5_18,
  s_13,
  s_15,
  s_18,
  s_18,
  s_20,
  s_20,
  s_5_6_7_14_18_30_0,
  s_5_18,
  s_6_18,
  s_0,
  s_5,
  s_5,
  s_0,
  s_5,
  s_2,
  s_7,
  s_20,
  s_6_9,
  s_6_30,
  s_13,
  s_6,
  s_14,
  s_9_12,
  s_18,
  s_10_12,
  s_37,
  s_18,
  s_0,
  s_0,
  s_2,
  s_18,
  s_18,
  s_5_18,
  s_18,
  s_6,
  s_6_30_32,
  s_6,
  s_0,
  s_4,
  s_6,
  s_6,
  s_0,
  s_10_29,
  s_26_35,
  s_26,
  s_2,
  s_18,
  s_7,
  s_10,
  s_0,
  s_10_29,
  s_4_7_18_30_35_36_38_41,
  s_20,
  s_6_8_13,
  s_11_17_19,
  s_5,
  s_6,
  s_18,
  s_18,
  s_10,
  s_18,
  s_4_6_7_18_19_35_37,
  s_10_32,
  s_26,
  s_26,
  s_26,
  s_0,
  s_6,
  s_18,
  s_6,
  s_20,
  s_6,
  s_0,
  s_5,
  s_13,
  s_13,
  s_8,
  s_0,
  s_6,
  s_7_27_35,
  s_27,
  s_13,
  s_27,
  s_0,
  s_5,
  s_6_32_37,
  s_0,
  s_5_0,
  s_39,
  s_10_32,
  s_18,
  s_21,
  s_13,
  s_18,
  s_6,
  s_5,
  s_20,
  s_13,
  s_9_26,
  s_0,
  s_6,
  s_6_8_36,
  s_31,
  s_6,
  s_20,
  s_18,
  s_15,
  s_18_29_41,
  s_0,
  s_4,
  s_18,
  s_4_8_25_35,
  s_0,
  s_6,
  s_4,
  s_0,
  s_4_35_41,
  s_0,
  s_2,
  s_18,
  s_5,
  s_23,
  s_6,
  s_21_23_40_0,
  s_5,
  s_2,
  s_7,
  s_20,
  s_23,
  s_17,
  s_6_0,
  s_2,
  s_7,
  s_7,
  s_7,
  s_18,
  s_17,
  s_0,
  s_18_32,
  s_2,
  s_18,
  s_0,
  s_6_9_15_16_17_24_27_31_32_35_38,
  s_4,
  s_20,
  s_18,
  s_4_0,
  s_20,
  s_4,
  s_5,
  s_5,
  s_4_9,
  s_18,
  s_0,
  s_7,
  s_18,
  s_27,
  s_13_20,
  s_6_9_10_15_17,
  s_20,
  s_6,
  s_18,
  s_18,
  s_28,
  s_4_6_9,
  s_3_9_27_31_33,
  s_0,
  s_5_13,
  s_18,
  s_3_4_9,
  s_9,
  s_10,
  s_5_13_32_33,
  s_20,
  s_27_35,
  s_6_14,
  s_38,
  s_18,
  s_0,
  s_18,
  s_0,
  s_18,
  s_29_30_36_42,
  s_18,
  s_22_1,
  s_11_32,
  s_17_18,
  s_10_11,
  s_0,
  s_18_0,
  s_11_14_17_22_26,
  s_6,
  s_15,
  s_15,
  s_5_13_35_40,
  s_2,
  s_26,
  s_5_1_0,
  s_21_40,
  s_12_37,
  s_0,
  s_2,
  s_13,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_20,
  s_5,
  s_5,
  s_10_11_32_39,
  s_18,
  s_10_11_0,
  s_8_27,
  s_6,
  s_0,
  s_0,
  s_18,
  s_2,
  s_7,
  s_0,
  s_7,
  s_26,
  s_2,
  s_0,
  s_5_11_18_32,
  s_5_18,
  s_37,
  s_5_17,
  s_13,
  s_5,
  s_18,
  s_14,
  s_14,
  s_4,
  s_13,
  s_5,
  s_15,
  s_4_15,
  s_15,
  s_20,
  s_20,
  s_17,
  s_15,
  s_15,
  s_20,
  s_5,
  s_13,
  s_6,
  s_5,
  s_15,
  s_15,
  s_27,
  s_27,
  s_27,
  s_15,
  s_20,
  s_10_18_23,
  s_10_21_32,
  s_18,
  s_21,
  s_4_6_7_14_18_33_41,
  s_0,
  s_0,
  s_2,
  s_6,
  s_18,
  s_4,
  s_6,
  s_6,
  s_18,
  s_18,
  s_6_18,
  s_18,
  s_15,
  s_18_1,
  s_13_20,
  s_15,
  s_20,
  s_6,
  s_1,
  s_27,
  s_5,
  s_18,
  s_5,
  s_21,
  s_5,
  s_6,
  s_18,
  s_5_15,
  s_18,
  s_9_10_31_32,
  s_18,
  s_9,
  s_9_32,
  s_9,
  s_6_18,
  s_6,
  s_9,
  s_6,
  s_18,
  s_18,
  s_20,
  s_10,
  s_10_29,
  s_18,
  s_34_39,
  s_10,
  s_15,
  s_5,
  s_4_10,
  s_6_9_10_18_35_38_39_41,
  s_10,
  s_0,
  s_9_10,
  s_9_10,
  s_10,
  s_0,
  s_14,
  s_23,
  s_6,
  s_4_7_9,
  s_0,
  s_0,
  s_5,
  s_6,
  s_6_10_35,
  s_12_26,
  s_2,
  s_26,
  s_0,
  s_26,
  s_0,
  s_6,
  s_5_15_18_21,
  s_18_1,
  s_18,
  s_13_18,
  s_7,
  s_6,
  s_5,
  s_18,
  s_15,
  s_10_18,
  s_15,
  s_10_18,
  s_4_18,
  s_6,
  s_17,
  s_23,
  s_7_17,
  s_5,
  s_5_18_32_41,
  s_8,
  s_7,
  s_0,
  s_18,
  s_17,
  s_5,
  s_4_32_34,
  s_18,
  s_4,
  s_15,
  s_13,
  s_8_13_20_27_29_30_34_35,
  s_13_20_27,
  s_26,
  s_13,
  s_26,
  s_0,
  s_7,
  s_4,
  s_27,
  s_26,
  s_0,
  s_7_9,
  s_0,
  s_6,
  s_6_18,
  s_20,
  s_20,
  s_4_6_18_33,
  s_6,
  s_27,
  s_4,
  s_4,
  s_6,
  s_27,
  s_27,
  s_6,
  s_18,
  s_27,
  s_5_6,
  s_18,
  s_6,
  s_6,
  s_6,
  s_4,
  s_6,
  s_27,
  s_18,
  s_4,
  s_4,
  s_6,
  s_18,
  s_18,
  s_6,
  s_6,
  s_14,
  s_5,
  s_10,
  s_11_32_34_39,
  s_18,
  s_5,
  s_6,
  s_18,
  s_10_11_32_35_38,
  s_6,
  s_0,
  s_2,
  s_0,
  s_6,
  s_0,
  s_19,
  s_9,
  s_1,
  s_1,
  s_1,
  s_18,
  s_12,
  s_0,
  s_6_8_17_35,
  s_18,
  s_18,
  s_20,
  s_0,
  s_7,
  s_7,
  s_7,
  s_0,
  s_6_18_26_34_35_38_43,
  s_18,
  s_20,
  s_20,
  s_34,
  s_10_1_0,
  s_2,
  s_18,
  s_6_18_30_32,
  s_15,
  s_18_1,
  s_17,
  s_34,
  s_18,
  s_4,
  s_18,
  s_18,
  s_18,
  s_38,
  s_6,
  s_11,
  s_20,
  s_20,
  s_6_14,
  s_18,
  s_1_0,
  s_4,
  s_5,
  s_20,
  s_20,
  s_20,
  s_5,
  s_20,
  s_5,
  s_20,
  s_5,
  s_1,
  s_18,
  s_9,
  s_20,
  s_20,
  s_20,
  s_1,
  s_20,
  s_5,
  s_6,
  s_1,
  s_18,
  s_9,
  s_4,
  s_18,
  s_0,
  s_0,
  s_14,
  s_14,
  s_1,
  s_1,
  s_18,
  s_9,
  s_26,
  s_4,
  s_18,
  s_20,
  s_20,
  s_22,
  s_26,
  s_20,
  s_20,
  s_20,
  s_4_41,
  s_5,
  s_5,
  s_20,
  s_27,
  s_10_18,
  s_20,
  s_20,
  s_1,
  s_38,
  s_4_11,
  s_25,
  s_5,
  s_5,
  s_6_13,
  s_6,
  s_20,
  s_6,
  s_6,
  s_1,
  s_6,
  s_6,
  s_8,
  s_18,
  s_6,
  s_20,
  s_10,
  s_10_18,
  s_4_10,
  s_20,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6,
  s_0,
  s_29_30,
  s_4_6_9_22_29,
  s_7,
  s_0,
  s_7,
  s_18,
  s_15,
  s_4_6_15,
  s_0,
  s_0,
  s_2,
  s_30_34,
  s_4_26,
  s_4,
  s_18,
  s_7_26,
  s_14,
  s_10,
  s_18,
  s_7,
  s_6_21,
  s_5_6_18_29_30_33_35_41,
  s_6,
  s_13_20,
  s_6,
  s_5,
  s_20,
  s_18,
  s_5_35,
  s_12,
  s_20,
  s_5_6,
  s_0,
  s_6,
  s_4,
  s_1,
  s_5_13,
  s_28_0,
  s_9_18,
  s_4_9,
  s_9,
  s_18,
  s_18,
  s_17,
  s_5,
  s_5,
  s_5,
  s_9,
  s_18,
  s_27,
  s_35,
  s_22,
  s_1,
  s_26,
  s_20,
  s_1,
  s_4,
  s_1,
  s_6,
  s_27,
  s_5,
  s_26,
  s_22,
  s_26,
  s_26,
  s_26,
  s_6_24,
  s_26,
  s_26,
  s_22,
  s_1,
  s_27,
  s_27,
  s_1,
  s_18,
  s_9,
  s_22,
  s_26,
  s_5,
  s_22,
  s_1,
  s_5,
  s_20,
  s_20,
  s_26,
  s_1,
  s_27,
  s_4,
  s_20,
  s_20,
  s_22,
  s_27,
  s_26,
  s_26,
  s_26,
  s_27,
  s_22,
  s_1,
  s_18,
  s_26,
  s_18,
  s_1,
  s_5,
  s_22,
  s_1,
  s_5,
  s_5,
  s_27,
  s_5,
  s_26,
  s_26,
  s_1,
  s_26,
  s_4,
  s_27,
  s_26,
  s_5,
  s_5,
  s_4,
  s_4,
  s_6,
  s_26,
  s_5,
  s_5,
  s_27,
  s_6,
  s_10,
  s_10,
  s_5_18,
  s_10,
  s_14,
  s_20,
  s_6,
  s_15,
  s_5,
  s_10,
  s_10,
  s_10_18,
  s_18_0,
  s_2,
  s_13,
  s_10_40,
  s_18,
  s_10,
  s_10,
  s_18,
  s_18,
  s_10,
  s_4,
  s_18,
  s_10,
  s_0,
  s_18,
  s_27,
  s_6,
  s_10_18,
  s_15,
  s_6,
  s_10,
  s_10_17_19_32_42_43,
  s_27,
  s_19,
  s_15,
  s_5_6_8_20_23,
  s_17,
  s_6,
  s_4,
  s_6,
  s_4_8,
  s_8,
  s_18,
  s_4_6,
  s_0,
  s_6,
  s_7,
  s_0,
  s_7_26,
  s_0,
  s_8_10,
  s_6,
  s_6,
  s_6,
  s_23,
  s_18,
  s_9_0,
  s_6,
  s_5,
  s_8,
  s_18,
  s_5,
  s_4,
  s_0,
  s_15,
  s_18_1,
  s_9,
  s_18,
  s_9,
  s_18,
  s_5_13,
  s_20,
  s_18,
  s_10,
  s_10,
  s_18,
  s_10_18,
  s_15,
  s_10,
  s_10,
  s_10,
  s_13_0,
  s_6,
  s_18,
  s_18,
  s_6,
  s_5_18_0,
  s_18,
  s_5,
  s_6,
  s_18_35_41_0,
  s_26,
  s_20,
  s_23,
  s_20,
  s_18,
  s_18,
  s_23_28_0_2,
  s_4_18,
  s_5,
  s_0,
  s_21,
  s_23,
  s_28,
  s_6,
  s_2_0,
  s_5,
  s_5_13,
  s_15,
  s_5,
  s_5,
  s_27,
  s_15,
  s_20,
  s_5,
  s_5,
  s_27,
  s_27,
  s_27,
  s_6_18,
  s_13,
  s_15,
  s_10,
  s_10,
  s_18,
  s_6,
  s_7_10,
  s_10_32_35,
  s_32,
  s_0,
  s_28,
  s_28,
  s_28,
  s_6,
  s_39,
  s_0,
  s_9_26,
  s_0,
  s_6,
  s_0,
  s_26,
  s_8,
  s_6,
  s_20,
  s_4,
  s_7_19_25,
  s_27,
  s_5,
  s_5,
  s_5,
  s_27,
  s_20,
  s_27,
  s_27,
  s_20,
  s_27,
  s_6,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_6,
  s_18,
  s_4_11_26_30_38_41_0,
  s_5_6_30_41,
  s_5,
  s_0,
  s_2,
  s_31,
  s_6,
  s_13_18_36,
  s_5_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_26,
  s_26,
  s_14,
  s_8,
  s_15,
  s_13,
  s_6,
  s_20,
  s_15,
  s_15,
  s_15_18,
  s_5,
  s_10,
  s_14_15_18,
  s_18,
  s_4_6_8_35_36,
  s_44,
  s_5_6_18,
  s_4,
  s_4,
  s_18,
  s_8,
  s_18,
  s_4,
  s_6_17,
  s_18,
  s_18,
  s_0,
  s_6_30_33,
  s_5_15,
  s_18,
  s_5,
  s_8_29_37,
  s_18,
  s_14,
  s_18,
  s_4_5_6_8_9_10_14_15_18_23_38_40,
  s_6,
  s_4_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_10,
  s_10,
  s_6,
  s_23,
  s_36,
  s_6,
  s_6,
  s_10,
  s_10,
  s_30,
  s_30,
  s_6_36,
  s_6_35,
  s_0,
  s_7,
  s_10_18,
  s_1,
  s_23,
  s_6,
  s_6,
  s_44,
  s_6,
  s_7_9_26_29_33,
  s_14_0,
  s_18,
  s_4_6,
  s_2,
  s_7_9,
  s_6,
  s_6,
  s_6_32_35_37_41,
  s_6,
  s_0,
  s_0,
  s_18,
  s_0,
  s_6,
  s_4,
  s_6,
  s_6,
  s_0,
  s_18_26,
  s_18_26,
  s_4,
  s_4_10,
  s_4,
  s_6,
  s_6,
  s_4_14,
  s_6,
  s_23,
  s_6,
  s_0,
  s_10,
  s_10,
  s_0,
  s_2,
  s_7,
  s_6,
  s_4,
  s_6_35,
  s_4,
  s_0,
  s_35,
  s_6,
  s_6,
  s_6,
  s_0,
  s_32,
  s_4_10,
  s_0,
  s_18_0,
  s_18,
  s_4_7_9_30_35_36_38_39_41_42,
  s_6,
  s_5,
  s_15,
  s_0,
  s_6_18,
  s_4_6,
  s_18,
  s_8,
  s_15,
  s_4_18_26,
  s_15,
  s_10,
  s_6,
  s_37,
  s_12,
  s_6,
  s_6,
  s_18,
  s_6,
  s_15_18,
  s_15,
  s_28,
  s_15,
  s_14_15,
  s_18_1,
  s_10,
  s_6,
  s_28,
  s_28,
  s_5_18,
  s_23,
  s_20,
  s_11_30,
  s_2_0,
  s_2,
  s_7,
  s_10,
  s_10,
  s_0,
  s_5_0,
  s_0,
  s_26,
  s_20,
  s_5,
  s_5,
  s_8,
  s_2,
  s_30_40_41,
  s_11,
  s_11,
  s_2,
  s_12_26,
  s_0,
  s_14,
  s_1,
  s_2,
  s_27,
  s_4,
  s_10_32,
  s_18,
  s_15,
  s_33_37,
  s_0,
  s_18,
  s_4_12,
  s_10_32,
  s_6_15_37_39_40_42,
  s_15,
  s_6_15_37_39_40_42,
  s_15,
  s_0_2,
  s_6_0,
  s_0,
  s_13,
  s_4_9,
  s_27,
  s_0,
  s_0,
  s_6_0,
  s_30,
  s_20,
  s_0,
  s_4_22_26,
  s_0,
  s_0,
  s_20,
  s_0,
  s_12,
  s_7,
  s_7,
  s_18,
  s_20,
  s_0,
  s_18,
  s_2,
  s_7,
  s_27,
  s_0,
  s_7_11_26,
  s_13_27,
  s_6,
  s_6,
  s_18,
  s_27,
  s_0,
  s_18_0,
  s_5_13_38,
  s_20,
  s_0,
  s_14,
  s_6,
  s_18,
  s_26,
  s_6,
  s_15,
  s_18,
  s_13_20,
  s_18,
  s_4,
  s_39,
  s_39,
  s_15,
  s_18_30,
  s_4,
  s_18,
  s_4,
  s_18,
  s_4_11_26_29,
  s_19,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7_9_1_0,
  s_6,
  s_0,
  s_2,
  s_9,
  s_0,
  s_2,
  s_7,
  s_4_10,
  s_30_36_42,
  s_0,
  s_18,
  s_6,
  s_0,
  s_4_10,
  s_30_36_42,
  s_0,
  s_18,
  s_7_10_26,
  s_18,
  s_6_30_34_35_41,
  s_0,
  s_6_32_36,
  s_18,
  s_5,
  s_18,
  s_18,
  s_6_33,
  s_18,
  s_18,
  s_6,
  s_18,
  s_20,
  s_20,
  s_5_18,
  s_6,
  s_18,
  s_0,
  s_5_18,
  s_18,
  s_18,
  s_15,
  s_20,
  s_18,
  s_18,
  s_6_36,
  s_0,
  s_30_37,
  s_0,
  s_30,
  s_2,
  s_7,
  s_5_18,
  s_18,
  s_5,
  s_15,
  s_18,
  s_6_18,
  s_4_19_20_30_35,
  s_6_18,
  s_5,
  s_4,
  s_5,
  s_18,
  s_6,
  s_18,
  s_18,
  s_6_13_35,
  s_6,
  s_6,
  s_10,
  s_18,
  s_1,
  s_14,
  s_9_14,
  s_13,
  s_6_35,
  s_18,
  s_18,
  s_18,
  s_1,
  s_14,
  s_9,
  s_27,
  s_4_11_37,
  s_6,
  s_0,
  s_4_7_26,
  s_30_36_38_41,
  s_2,
  s_10,
  s_7,
  s_4_15_18,
  s_0,
  s_4_6_29_40,
  s_6,
  s_6,
  s_6_7_22_29_35_36,
  s_6,
  s_0,
  s_6_35,
  s_15,
  s_6,
  s_7_22,
  s_5,
  s_6,
  s_12_37,
  s_0,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_23,
  s_18,
  s_20,
  s_0,
  s_18,
  s_6,
  s_6,
  s_12,
  s_0,
  s_18,
  s_15,
  s_6,
  s_2,
  s_7,
  s_0,
  s_4_23_35,
  s_4,
  s_18,
  s_18,
  s_4,
  s_20,
  s_5_8,
  s_15_37_38,
  s_0,
  s_0,
  s_10_18,
  s_5,
  s_27,
  s_10_18,
  s_20,
  s_6,
  s_6,
  s_7,
  s_15,
  s_10_18,
  s_18_29_30_32_34_35_36_39_40_41_42,
  s_18,
  s_6,
  s_6_15,
  s_6,
  s_4,
  s_8_20_32,
  s_15,
  s_10_18_1,
  s_14,
  s_5,
  s_5_6_18_29_33_40,
  s_5,
  s_20,
  s_18,
  s_4_18,
  s_18,
  s_0,
  s_9,
  s_5,
  s_5,
  s_18,
  s_20,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6,
  s_6,
  s_20,
  s_18,
  s_13_30,
  s_15,
  s_14,
  s_10_18,
  s_18,
  s_18,
  s_15,
  s_6,
  s_4,
  s_6,
  s_4_6,
  s_4,
  s_6_23,
  s_6,
  s_14,
  s_6,
  s_15_18,
  s_18,
  s_14,
  s_15,
  s_6_0,
  s_18,
  s_18,
  s_6_19_26_32_41,
  s_20,
  s_0,
  s_2,
  s_26,
  s_9_19_41_43,
  s_7_20_0,
  s_13_20,
  s_20,
  s_2,
  s_7,
  s_18,
  s_27,
  s_0,
  s_27,
  s_27,
  s_27,
  s_10,
  s_4_5_6_8_9_10_11_14_15_17_18_19_20_23_26_35_38_41_42,
  s_9_26,
  s_6,
  s_6,
  s_35,
  s_13,
  s_23,
  s_18,
  s_6,
  s_0,
  s_4_6_10,
  s_6,
  s_2_0,
  s_5,
  s_8_23,
  s_6,
  s_18,
  s_6_10_15,
  s_6,
  s_17,
  s_0,
  s_6,
  s_0,
  s_10_32_40,
  s_18,
  s_10,
  s_4,
  s_2_0,
  s_18,
  s_18,
  s_4,
  s_18,
  s_4,
  s_6,
  s_6,
  s_6,
  s_40,
  s_6_14,
  s_6,
  s_6,
  s_4_23,
  s_6,
  s_6,
  s_6,
  s_4,
  s_4,
  s_4,
  s_4_6,
  s_18,
  s_23,
  s_15,
  s_6,
  s_4,
  s_6,
  s_6,
  s_17,
  s_0,
  s_18,
  s_15,
  s_11_23,
  s_19,
  s_10,
  s_0,
  s_29_30,
  s_0,
  s_18,
  s_22_0,
  s_26,
  s_4,
  s_0,
  s_7,
  s_0,
  s_2,
  s_26,
  s_0,
  s_6_14_23_30_35_40,
  s_23_2,
  s_31_39_41,
  s_0,
  s_0,
  s_18,
  s_4_9_10_15_26_0,
  s_39,
  s_10_0,
  s_6,
  s_18,
  s_6_7_8_9_12_13_15_25,
  s_12,
  s_7_11_28,
  s_12,
  s_11_18,
  s_0,
  s_0,
  s_26,
  s_12,
  s_37,
  s_0,
  s_0,
  s_6_15,
  s_6,
  s_6,
  s_2,
  s_7,
  s_15,
  s_20,
  s_0,
  s_2,
  s_12,
  s_0,
  s_26,
  s_4,
  s_12_20,
  s_20,
  s_0,
  s_12,
  s_12,
  s_18,
  s_0,
  s_20,
  s_0,
  s_6_7_9_11_19_26_30_37_40,
  s_0,
  s_0,
  s_2,
  s_4_6,
  s_15_20,
  s_18_0,
  s_0,
  s_9,
  s_7_20,
  s_5,
  s_15,
  s_1,
  s_6_22,
  s_0,
  s_26,
  s_6,
  s_4_11_29_30_32_35_38,
  s_9_15,
  s_0_1,
  s_15,
  s_2_0,
  s_2,
  s_2,
  s_6_18,
  s_26,
  s_2,
  s_7_12,
  s_4_11,
  s_18,
  s_9_18_0_2,
  s_0,
  s_12,
  s_0,
  s_18,
  s_18,
  s_28,
  s_0,
  s_2,
  s_0,
  s_18,
  s_15,
  s_26,
  s_0,
  s_9,
  s_1,
  s_1,
  s_14,
  s_18,
  s_10_18_1,
  s_10_14,
  s_1,
  s_15,
  s_18,
  s_4,
  s_18,
  s_6,
  s_6_32_35,
  s_18,
  s_4,
  s_23,
  s_0,
  s_2,
  s_23,
  s_6_36,
  s_23,
  s_23,
  s_23,
  s_23,
  s_18_37,
  s_20,
  s_20,
  s_6_10_21_30_32_35,
  s_0,
  s_14,
  s_5,
  s_38,
  s_18,
  s_6,
  s_10_21,
  s_20,
  s_15,
  s_0,
  s_9_16,
  s_18,
  s_0,
  s_20,
  s_9_41,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7_9,
  s_6_8_13_18_30_35_36_38,
  s_8,
  s_15,
  s_7_35,
  s_7,
  s_0,
  s_20,
  s_18,
  s_18_1,
  s_14,
  s_14,
  s_4,
  s_18,
  s_5,
  s_7_26,
  s_30_38,
  s_0,
  s_15,
  s_17,
  s_18,
  s_18,
  s_18,
  s_18,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_18,
  s_21,
  s_18,
  s_4_41,
  s_15,
  s_4,
  s_18,
  s_18,
  s_44,
  s_18,
  s_15,
  s_20,
  s_5,
  s_1,
  s_1,
  s_20,
  s_20,
  s_20,
  s_0,
  s_20,
  s_5,
  s_6,
  s_6,
  s_20,
  s_5,
  s_0,
  s_10,
  s_6_32,
  s_6,
  s_4,
  s_6,
  s_15,
  s_20,
  s_20,
  s_18,
  s_15,
  s_4,
  s_5,
  s_27,
  s_4,
  s_6,
  s_5,
  s_5,
  s_6,
  s_20,
  s_27,
  s_5_6_25,
  s_4_9_11_15,
  s_5,
  s_18,
  s_20,
  s_20,
  s_20,
  s_18,
  s_10_1,
  s_9,
  s_1,
  s_1,
  s_18_23,
  s_5,
  s_15,
  s_9,
  s_5,
  s_15,
  s_18,
  s_18,
  s_0,
  s_2,
  s_18,
  s_10,
  s_4_6_38,
  s_6,
  s_0,
  s_20,
  s_18,
  s_5,
  s_26,
  s_6_0,
  s_20,
  s_18,
  s_5,
  s_5,
  s_18,
  s_18,
  s_20,
  s_20,
  s_20,
  s_4_7_18_29_30_34_41_42,
  s_4,
  s_18,
  s_0,
  s_2,
  s_7,
  s_13,
  s_0,
  s_2,
  s_7_12_26,
  s_18,
  s_18,
  s_15,
  s_15,
  s_6,
  s_20,
  s_20,
  s_15,
  s_18,
  s_10,
  s_20,
  s_20,
  s_6_10_32_35,
  s_5,
  s_35,
  s_22,
  s_1,
  s_26,
  s_1,
  s_4,
  s_1,
  s_27,
  s_6,
  s_27,
  s_26,
  s_22,
  s_27,
  s_26,
  s_26,
  s_26,
  s_6_24,
  s_26,
  s_26,
  s_26,
  s_22,
  s_1,
  s_27,
  s_27,
  s_1,
  s_1,
  s_18,
  s_9,
  s_22,
  s_26,
  s_22,
  s_1,
  s_26,
  s_27,
  s_26,
  s_5,
  s_5,
  s_20,
  s_20,
  s_27,
  s_26,
  s_26,
  s_20,
  s_1,
  s_26,
  s_25,
  s_10,
  s_20,
  s_5,
  s_5,
  s_5,
  s_0,
  s_22,
  s_0,
  s_22,
  s_0,
  s_22,
  s_0,
  s_27,
  s_27,
  s_18,
  s_18,
  s_1,
  s_20,
  s_1,
  s_26,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_8_15_25,
  s_1,
  s_1,
  s_5,
  s_15,
  s_20_27,
  s_18,
  s_26,
  s_4,
  s_6,
  s_1,
  s_9,
  s_27,
  s_22,
  s_27,
  s_26,
  s_26,
  s_26,
  s_27,
  s_22,
  s_1,
  s_18,
  s_26,
  s_18,
  s_1,
  s_22,
  s_1,
  s_27,
  s_26,
  s_26_29,
  s_1,
  s_26,
  s_4,
  s_27,
  s_26,
  s_4,
  s_4,
  s_6,
  s_0,
  s_26,
  s_6_20_27,
  s_0,
  s_6_35,
  s_6,
  s_5_13,
  s_20,
  s_20,
  s_2,
  s_2,
  s_2,
  s_18,
  s_6,
  s_10,
  s_18,
  s_6,
  s_27_30,
  s_0,
  s_6,
  s_18_23,
  s_18,
  s_0,
  s_5,
  s_6,
  s_20_1,
  s_20,
  s_20,
  s_20,
  s_26,
  s_26,
  s_27,
  s_26,
  s_26,
  s_0,
  s_27,
  s_18,
  s_18,
  s_18,
  s_23,
  s_25,
  s_27,
  s_18,
  s_18,
  s_18,
  s_20,
  s_18,
  s_18,
  s_10_18_32,
  s_0,
  s_1_0,
  s_1,
  s_6_9,
  s_15,
  s_13_20,
  s_0,
  s_20,
  s_13_1,
  s_18,
  s_14,
  s_18,
  s_18,
  s_27,
  s_5,
  s_0,
  s_15,
  s_0,
  s_17_18,
  s_18,
  s_14_38_42,
  s_18,
  s_18,
  s_15_18_2_0,
  s_2,
  s_2,
  s_28_2,
  s_2,
  s_21,
  s_9,
  s_0,
  s_7_22,
  s_5,
  s_2,
  s_2,
  s_2,
  s_26,
  s_2,
  s_10_18,
  s_9,
  s_18,
  s_0,
  s_2,
  s_2,
  s_2,
  s_2,
  s_2,
  s_0,
  s_4_7_9_21,
  s_20,
  s_18,
  s_6,
  s_18,
  s_18,
  s_20,
  s_26,
  s_18_0,
  s_0,
  s_7_26,
  s_18,
  s_1,
  s_9,
  s_18,
  s_0,
  s_2,
  s_5,
  s_18,
  s_6,
  s_0,
  s_0,
  s_15,
  s_20,
  s_26,
  s_26,
  s_9_13_18,
  s_18,
  s_18,
  s_10_1_0,
  s_0,
  s_2,
  s_4,
  s_6,
  s_18,
  s_7,
  s_5_18,
  s_15,
  s_26,
  s_5_26,
  s_5,
  s_18,
  s_9,
  s_10_18,
  s_14,
  s_5,
  s_5,
  s_18,
  s_5_13,
  s_6,
  s_18,
  s_15_18,
  s_15,
  s_18,
  s_18_28,
  s_1,
  s_18,
  s_28,
  s_18,
  s_12,
  s_7_12,
  s_0,
  s_2,
  s_42,
  s_18,
  s_0,
  s_2,
  s_4_7_9,
  s_18,
  s_0,
  s_18,
  s_5,
  s_20,
  s_17,
  s_18,
  s_18,
  s_6,
  s_27,
  s_18,
  s_0,
  s_20,
  s_20,
  s_5,
  s_0,
  s_17_27,
  s_27_0,
  s_0,
  s_5,
  s_0,
  s_7_9,
  s_35_1,
  s_0,
  s_7,
  s_0,
  s_7,
  s_19,
  s_0,
  s_8,
  s_0,
  s_5,
  s_5,
  s_0,
  s_0,
  s_0,
  s_7,
  s_20,
  s_0,
  s_22,
  s_0,
  s_22,
  s_5,
  s_10,
  s_5,
  s_26,
  s_5,
  s_5,
  s_4,
  s_18_0,
  s_4,
  s_4,
  s_7,
  s_5,
  s_1,
  s_22,
  s_5,
  s_5,
  s_26,
  s_20,
  s_0,
  s_5,
  s_3,
  s_1,
  s_26,
  s_8,
  s_0,
  s_10,
  s_20,
  s_27,
  s_9_0,
  s_20,
  s_18,
  s_35,
  s_18,
  s_0,
  s_10_32_1,
  s_6,
  s_23,
  s_1,
  s_27,
  s_25,
  s_1,
  s_25,
  s_5,
  s_5,
  s_25,
  s_20,
  s_10,
  s_5,
  s_5,
  s_5,
  s_27,
  s_1,
  s_5,
  s_5,
  s_0,
  s_20,
  s_27,
  s_27,
  s_28,
  s_18,
  s_18,
  s_18,
  s_18,
  s_14,
  s_18,
  s_27,
  s_14,
  s_8_10_11,
  s_18,
  s_6_30,
  s_20,
  s_15,
  s_0,
  s_29_41,
  s_0,
  s_4_26,
  s_15,
  s_20,
  s_26_29,
  s_26_29,
  s_18_0,
  s_26,
  s_18,
  s_20,
  s_10_18,
  s_0,
  s_27,
  s_26,
  s_5_27_30_35_39,
  s_6_15,
  s_0,
  s_0,
  s_2,
  s_7,
  s_15,
  s_4_26,
  s_22,
  s_1,
  s_38,
  s_0,
  s_20,
  s_18,
  s_0,
  s_0,
  s_0,
  s_2,
  s_14,
  s_10_1_0,
  s_1,
  s_14,
  s_10,
  s_10_1,
  s_1,
  s_2,
  s_4,
  s_18,
  s_0,
  s_18,
  s_40,
  s_6_7_14_15_26_0_2,
  s_13,
  s_18,
  s_6,
  s_0,
  s_6,
  s_18_0,
  s_0,
  s_6,
  s_0,
  s_0,
  s_0,
  s_18,
  s_18,
  s_0,
  s_4_35,
  s_18,
  s_4,
  s_17_0,
  s_18,
  s_15,
  s_4,
  s_7_24_29_30,
  s_6,
  s_7,
  s_2,
  s_7_18,
  s_6,
  s_14,
  s_38,
  s_11,
  s_6,
  s_18,
  s_10,
  s_4_6,
  s_4_35_40,
  s_18,
  s_4,
  s_15,
  s_4,
  s_4_7_38,
  s_18,
  s_4,
  s_1,
  s_0,
  s_2,
  s_12,
  s_18,
  s_18,
  s_6_17_18_36,
  s_18,
  s_18,
  s_18,
  s_7,
  s_17,
  s_17,
  s_15,
  s_0,
  s_15,
  s_6,
  s_8_20,
  s_8,
  s_17,
  s_1,
  s_17,
  s_10,
  s_20,
  s_5,
  s_18,
  s_23,
  s_18,
  s_9_14,
  s_9,
  s_18,
  s_5_0,
  s_8,
  s_18,
  s_18,
  s_33_41_0,
  s_4_6_9,
  s_0,
  s_2,
  s_0,
  s_5,
  s_8,
  s_10_1,
  s_5,
  s_0,
  s_18_1,
  s_9_14,
  s_10,
  s_10,
  s_13,
  s_5_8,
  s_4_6_9,
  s_13,
  s_9,
  s_18_1,
  s_9_14,
  s_15,
  s_10_18_1,
  s_6_26_35,
  s_5,
  s_10_23_32,
  s_15,
  s_8_20_25_0,
  s_8,
  s_6,
  s_1,
  s_0,
  s_15,
  s_18,
  s_20,
  s_0,
  s_18,
  s_14,
  s_5_15,
  s_5,
  s_5,
  s_5,
  s_5_8,
  s_20,
  s_18,
  s_1,
  s_20,
  s_5,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_18,
  s_14,
  s_5,
  s_1,
  s_4_18_40_41,
  s_0,
  s_18,
  s_18,
  s_18,
  s_15,
  s_18,
  s_18,
  s_0,
  s_7,
  s_7,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18_1,
  s_15,
  s_1,
  s_0,
  s_10_11_32_38,
  s_18,
  s_11,
  s_27,
  s_8,
  s_27,
  s_8,
  s_26,
  s_19,
  s_10,
  s_26,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_27,
  s_18,
  s_0,
  s_0_1,
  s_2,
  s_7_26,
  s_9,
  s_0,
  s_18,
  s_4_10,
  s_9_10_28,
  s_18,
  s_0,
  s_10,
  s_4_6_11_32_33_35_38_39_40_41,
  s_4_6_9_26_28_35_38,
  s_18,
  s_38,
  s_18,
  s_18,
  s_10_18,
  s_6,
  s_2,
  s_2,
  s_18,
  s_1,
  s_0,
  s_18,
  s_18,
  s_4,
  s_10_18_1,
  s_5_26,
  s_6_14_17_35_38_40,
  s_26,
  s_14,
  s_14,
  s_14,
  s_21,
  s_10_18_1,
  s_10,
  s_5,
  s_13,
  s_18,
  s_13,
  s_27_0,
  s_21_40,
  s_18,
  s_6,
  s_27,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_5,
  s_4_41,
  s_18,
  s_6_18_35,
  s_15,
  s_18,
  s_18,
  s_4_6_35_38_41,
  s_18,
  s_18,
  s_18,
  s_4_5_6,
  s_6_9,
  s_4,
  s_18,
  s_9_18,
  s_6_40,
  s_0,
  s_41,
  s_18,
  s_5_13_29_40,
  s_4,
  s_6,
  s_15,
  s_18,
  s_9_14,
  s_18,
  s_18,
  s_6,
  s_6,
  s_18,
  s_18,
  s_6_36,
  s_13,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_5_18_40,
  s_6_18,
  s_18,
  s_17,
  s_5,
  s_5,
  s_5_18,
  s_0,
  s_5,
  s_0,
  s_7,
  s_28,
  s_6_23,
  s_10,
  s_20,
  s_4_15,
  s_14,
  s_20,
  s_15,
  s_6_35,
  s_18,
  s_10_18,
  s_10_18,
  s_0,
  s_15,
  s_10,
  s_10,
  s_18,
  s_20,
  s_18,
  s_5,
  s_20,
  s_4_6_7_9_26_28_29_31_32_33_34_35_36_37_38_40_41_42,
  s_6,
  s_6_18,
  s_6,
  s_4_21,
  s_4_10_18,
  s_4_18,
  s_4,
  s_6_8_17_25_26_35,
  s_0,
  s_5,
  s_28_42,
  s_18,
  s_7,
  s_9,
  s_0,
  s_10,
  s_15,
  s_13,
  s_18,
  s_13,
  s_10_17_32,
  s_10,
  s_18,
  s_10_32,
  s_10,
  s_17_25_35_0,
  s_6,
  s_2,
  s_7_26,
  s_6,
  s_18_20,
  s_20,
  s_20,
  s_14_15_26_1_0,
  s_18,
  s_27,
  s_4,
  s_28,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_6,
  s_6_10,
  s_1_0,
  s_1,
  s_9,
  s_5,
  s_0,
  s_22,
  s_0,
  s_22,
  s_10,
  s_24,
  s_20,
  s_0,
  s_5,
  s_5,
  s_5,
  s_5,
  s_9,
  s_0,
  s_5,
  s_6,
  s_15_0,
  s_17_35,
  s_4,
  s_5,
  s_5,
  s_18,
  s_6,
  s_6_14_15_26_38_41_0_1_2,
  s_18,
  s_14_0,
  s_18,
  s_13,
  s_18,
  s_4,
  s_14,
  s_18,
  s_0,
  s_15,
  s_15,
  s_14_18_0,
  s_26,
  s_0,
  s_7,
  s_0,
  s_0,
  s_18,
  s_4,
  s_8,
  s_18,
  s_1,
  s_4,
  s_26,
  s_1,
  s_2,
  s_5,
  s_0,
  s_18,
  s_10,
  s_4_5_18_23_33,
  s_1,
  s_6,
  s_0,
  s_12,
  s_6_0,
  s_6_21_30,
  s_18,
  s_6_11,
  s_15,
  s_2_0,
  s_2,
  s_4,
  s_0,
  s_0,
  s_4,
  s_1,
  s_1,
  s_9,
  s_10,
  s_0,
  s_0,
  s_0,
  s_5_0,
  s_5,
  s_0,
  s_5,
  s_5,
  s_13,
  s_13,
  s_5_18,
  s_20,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_18,
  s_4,
  s_0,
  s_4,
  s_27,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_30,
  s_0,
  s_4,
  s_30,
  s_0,
  s_0,
  s_7,
  s_8,
  s_10,
  s_20,
  s_5,
  s_0,
  s_0,
  s_0,
  s_30,
  s_30_42,
  s_0,
  s_7,
  s_7,
  s_7,
  s_5,
  s_10,
  s_1,
  s_1,
  s_24,
  s_18_0,
  s_18,
  s_9,
  s_0,
  s_10,
  s_0,
  s_1,
  s_10,
  s_5,
  s_5,
  s_18_0,
  s_4,
  s_4,
  s_1,
  s_22,
  s_1,
  s_1,
  s_1,
  s_5,
  s_0,
  s_26,
  s_8,
  s_0,
  s_18,
  s_0,
  s_15,
  s_18,
  s_15,
  s_18_1,
  s_15,
  s_6_30_35,
  s_18,
  s_0,
  s_2,
  s_7,
  s_7_20,
  s_13_18_39_0,
  s_5,
  s_20,
  s_6_17_30_35_36,
  s_0,
  s_5,
  s_13,
  s_0,
  s_20,
  s_0,
  s_28_42,
  s_18,
  s_20,
  s_5,
  s_20,
  s_15,
  s_0,
  s_11_29_32_39,
  s_5_8_18,
  s_18,
  s_18,
  s_18,
  s_6,
  s_15,
  s_7_10_26_40_41,
  s_0,
  s_7,
  s_2,
  s_21,
  s_0,
  s_0,
  s_18,
  s_10_0,
  s_4,
  s_7_10_26_40_41,
  s_0,
  s_7,
  s_2,
  s_10,
  s_15,
  s_13,
  s_5_6_14_17_18_35,
  s_18,
  s_6,
  s_6,
  s_6_18_25_42,
  s_9,
  s_32_41,
  s_10,
  s_5_36_38,
  s_0,
  s_18,
  s_4,
  s_1,
  s_10,
  s_4_6_9_25_32_33_34_35_36_40,
  s_6,
  s_18,
  s_0,
  s_18,
  s_4,
  s_0,
  s_8,
  s_8,
  s_6,
  s_5_26,
  s_4,
  s_18,
  s_4,
  s_6_35,
  s_10,
  s_5,
  s_5,
  s_4,
  s_6,
  s_10,
  s_6,
  s_6,
  s_18,
  s_7_10_32,
  s_13,
  s_5_6_8,
  s_0,
  s_6_18_35,
  s_4_11_20_38,
  s_7_9_12_18_31_37,
  s_18_0,
  s_2,
  s_12_26,
  s_15,
  s_15,
  s_0,
  s_2,
  s_12,
  s_18,
  s_10_18,
  s_18,
  s_18,
  s_4_5_6_18,
  s_35,
  s_20,
  s_6,
  s_6,
  s_4,
  s_18,
  s_1,
  s_14,
  s_26,
  s_20,
  s_13_20,
  s_7_15,
  s_24_0,
  s_7,
  s_2,
  s_1,
  s_8,
  s_5_6_10_27_35,
  s_20,
  s_5,
  s_27,
  s_10,
  s_18,
  s_0,
  s_20,
  s_5,
  s_18,
  s_27,
  s_26,
  s_18,
  s_0,
  s_0,
  s_4_6_10,
  s_5,
  s_27,
  s_41,
  s_20,
  s_0,
  s_6,
  s_18,
  s_18,
  s_9,
  s_6_10,
  s_9,
  s_18,
  s_0,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_37,
  s_0,
  s_2,
  s_39,
  s_4,
  s_6_12,
  s_5_6_14_34,
  s_5_17_2,
  s_20,
  s_6,
  s_6,
  s_6,
  s_5,
  s_13,
  s_5,
  s_6_27,
  s_5,
  s_27,
  s_10,
  s_5,
  s_18,
  s_9,
  s_13,
  s_20,
  s_4,
  s_17,
  s_23,
  s_13_20,
  s_10,
  s_6_40,
  s_18,
  s_4,
  s_4,
  s_20,
  s_20,
  s_6_35,
  s_4,
  s_18,
  s_17,
  s_18,
  s_0,
  s_0,
  s_20,
  s_1,
  s_2,
  s_4,
  s_18,
  s_18,
  s_10,
  s_6_30,
  s_10_18,
  s_6,
  s_18,
  s_6,
  s_4_6,
  s_0,
  s_7,
  s_2,
  s_6_14,
  s_4,
  s_40,
  s_10,
  s_4_21_26_28,
  s_40,
  s_5_6_13_14_18_34,
  s_20,
  s_20,
  s_18,
  s_6,
  s_18,
  s_6,
  s_18,
  s_14_0,
  s_2,
  s_4,
  s_4_7_12_26,
  s_18,
  s_0,
  s_6_26,
  s_6,
  s_13,
  s_13_14,
  s_13_18,
  s_18,
  s_6,
  s_18,
  s_18,
  s_18,
  s_4_38_2,
  s_18,
  s_18,
  s_0,
  s_6,
  s_18,
  s_2,
  s_7_26,
  s_6,
  s_13,
  s_18,
  s_6_15,
  s_18,
  s_10,
  s_0,
  s_20,
  s_6,
  s_18,
  s_15_18,
  s_20,
  s_13,
  s_5_18_38,
  s_7_28,
  s_6,
  s_18,
  s_0,
  s_2_0,
  s_28,
  s_17,
  s_4_6_14_15_41_42,
  s_6,
  s_0,
  s_31,
  s_18,
  s_4,
  s_0,
  s_18,
  s_35,
  s_4,
  s_6,
  s_9,
  s_5,
  s_18,
  s_5,
  s_23,
  s_18,
  s_14,
  s_18,
  s_18,
  s_42,
  s_18,
  s_4,
  s_6,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6,
  s_20,
  s_23,
  s_6,
  s_14,
  s_18,
  s_0,
  s_4,
  s_4,
  s_18,
  s_6,
  s_18,
  s_15_18,
  s_20,
  s_18,
  s_9,
  s_20,
  s_6,
  s_38_42,
  s_6,
  s_18,
  s_6,
  s_10,
  s_18,
  s_18,
  s_2,
  s_6,
  s_10_11_29_32,
  s_4_5_10,
  s_10_0,
  s_6,
  s_20,
  s_18,
  s_0,
  s_7,
  s_18,
  s_18,
  s_4,
  s_15,
  s_23,
  s_15,
  s_10,
  s_10,
  s_14,
  s_15,
  s_10_18,
  s_10_18,
  s_20,
  s_15,
  s_6,
  s_6,
  s_17,
  s_6_15,
  s_17_18,
  s_18,
  s_11,
  s_18,
  s_6,
  s_18,
  s_7,
  s_6,
  s_6,
  s_13_20,
  s_18_40,
  s_14,
  s_10_14_38,
  s_0,
  s_18,
  s_14,
  s_17_18,
  s_20,
  s_14,
  s_7_30,
  s_0,
  s_26_29_34,
  s_2,
  s_12,
  s_4,
  s_0,
  s_12,
  s_0,
  s_4_35,
  s_0,
  s_2,
  s_18,
  s_4,
  s_18,
  s_18,
  s_18,
  s_1,
  s_20,
  s_18,
  s_20,
  s_13,
  s_14,
  s_4,
  s_6_18_42,
  s_0,
  s_0,
  s_6_15_18_20_30,
  s_4,
  s_10,
  s_20,
  s_11_14_26_32_39_42,
  s_5_0_1,
  s_0_1,
  s_2,
  s_7,
  s_4,
  s_37,
  s_9_14,
  s_18_1_0,
  s_1_0,
  s_18_1_0,
  s_9,
  s_9,
  s_5_7,
  s_4,
  s_37,
  s_5,
  s_0,
  s_2,
  s_7,
  s_6,
  s_5,
  s_27,
  s_17,
  s_37_0,
  s_5,
  s_0,
  s_7_12_26,
  s_0,
  s_2,
  s_18,
  s_4_10_41,
  s_18,
  s_7_0,
  s_18,
  s_27,
  s_8,
  s_1,
  s_0,
  s_6,
  s_30,
  s_26,
  s_26,
  s_22,
  s_1,
  s_30,
  s_37,
  s_0,
  s_0,
  s_2,
  s_4_11_12_26,
  s_7_12,
  s_27,
  s_4_18,
  s_4_11,
  s_5,
  s_17,
  s_13,
  s_0,
  s_7_8_10_12_32,
  s_1,
  s_4,
  s_18,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_7_8_10_12_32,
  s_18,
  s_0,
  s_2,
  s_0,
  s_13,
  s_25_35_38,
  s_5_18_26,
  s_0,
  s_0,
  s_18,
  s_8,
  s_20,
  s_13_27,
  s_6,
  s_18,
  s_15,
  s_4_9_38,
  s_18_26,
  s_0,
  s_0,
  s_23_0,
  s_2,
  s_23_24_0,
  s_23,
  s_10_18_1,
  s_15,
  s_7_26_34_39,
  s_2,
  s_7_12_26,
  s_0,
  s_17_18,
  s_35,
  s_10_18,
  s_20,
  s_4_9_14_18_33_35_38,
  s_0,
  s_6_17_18,
  s_4,
  s_15_18,
  s_18,
  s_18,
  s_15,
  s_10_18,
  s_4_6_9_38,
  s_18,
  s_11,
  s_11,
  s_4_32_35_38,
  s_18,
  s_4,
  s_18,
  s_17,
  s_10_32,
  s_19,
  s_2,
  s_0,
  s_2,
  s_7,
  s_4_7_26_30_38,
  s_4_0,
  s_4_11_12_26_29_30_37_39_0,
  s_0,
  s_26,
  s_35_38,
  s_18,
  s_18,
  s_18,
  s_18_40,
  s_0,
  s_18,
  s_4,
  s_7_30_39,
  s_0,
  s_11,
  s_13,
  s_20_27_30,
  s_2,
  s_7,
  s_4,
  s_5_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_4,
  s_4_32_38_40,
  s_18,
  s_18,
  s_6,
  s_6,
  s_18,
  s_18,
  s_6,
  s_18,
  s_18,
  s_7,
  s_1,
  s_18,
  s_1,
  s_18,
  s_20_27,
  s_20,
  s_20,
  s_18,
  s_5,
  s_5,
  s_27,
  s_27_0,
  s_26,
  s_26,
  s_8_0,
  s_5,
  s_8,
  s_1,
  s_20,
  s_5,
  s_27,
  s_27,
  s_20,
  s_5_9_10_0,
  s_4,
  s_35,
  s_4,
  s_35,
  s_4,
  s_8,
  s_6,
  s_20,
  s_26,
  s_26,
  s_15,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5_9_17_18,
  s_6,
  s_26,
  s_20,
  s_20,
  s_6,
  s_27,
  s_26,
  s_20,
  s_27_30,
  s_0,
  s_22,
  s_1,
  s_2,
  s_2,
  s_9,
  s_27,
  s_27,
  s_26,
  s_0,
  s_27,
  s_20,
  s_5,
  s_5,
  s_27,
  s_26,
  s_1,
  s_26,
  s_26,
  s_20,
  s_20,
  s_20,
  s_27,
  s_27,
  s_6,
  s_5,
  s_5,
  s_27,
  s_27,
  s_27,
  s_22,
  s_5,
  s_6,
  s_1,
  s_9,
  s_1,
  s_19,
  s_6,
  s_27,
  s_6,
  s_27,
  s_27,
  s_30,
  s_22,
  s_1,
  s_1,
  s_9,
  s_5,
  s_1,
  s_9,
  s_30,
  s_27,
  s_30,
  s_18,
  s_9,
  s_27,
  s_30,
  s_22,
  s_1,
  s_30,
  s_18,
  s_9,
  s_5,
  s_13,
  s_6,
  s_1,
  s_4,
  s_6,
  s_5,
  s_5,
  s_26,
  s_1,
  s_4,
  s_5,
  s_0,
  s_26,
  s_0,
  s_7,
  s_20,
  s_20,
  s_20,
  s_0,
  s_6_38,
  s_1,
  s_4,
  s_26,
  s_17,
  s_1,
  s_9,
  s_4,
  s_26,
  s_0,
  s_27,
  s_1,
  s_27,
  s_6,
  s_27,
  s_27,
  s_27,
  s_6,
  s_6,
  s_5,
  s_5,
  s_17,
  s_5,
  s_5,
  s_18,
  s_9_26,
  s_0,
  s_0,
  s_2,
  s_9,
  s_35,
  s_18,
  s_35,
  s_20,
  s_6,
  s_6,
  s_20,
  s_20,
  s_20,
  s_0,
  s_6,
  s_0,
  s_6,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_5,
  s_8_18,
  s_20,
  s_1,
  s_20,
  s_10_1,
  s_11,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_18,
  s_10_32_36,
  s_10,
  s_10,
  s_10,
  s_4,
  s_5,
  s_8_1,
  s_6,
  s_6,
  s_20,
  s_0,
  s_10,
  s_20,
  s_18,
  s_10_32,
  s_5,
  s_7,
  s_0,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_4,
  s_10,
  s_26,
  s_26,
  s_25,
  s_10,
  s_1_0,
  s_2,
  s_32,
  s_32,
  s_25,
  s_0,
  s_18,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_10_0,
  s_26,
  s_26,
  s_26,
  s_6,
  s_0,
  s_26,
  s_4,
  s_26,
  s_1,
  s_29,
  s_4,
  s_0,
  s_26,
  s_26,
  s_22,
  s_20,
  s_20,
  s_26,
  s_20,
  s_22,
  s_18,
  s_26,
  s_10,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_6,
  s_5,
  s_5,
  s_10,
  s_22,
  s_26,
  s_0,
  s_26,
  s_26,
  s_26,
  s_10,
  s_24,
  s_5,
  s_5,
  s_5,
  s_17,
  s_5,
  s_18,
  s_26,
  s_0,
  s_5,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_4,
  s_26,
  s_22,
  s_0,
  s_0,
  s_9_26,
  s_0,
  s_26,
  s_26,
  s_6,
  s_6,
  s_26,
  s_18_0,
  s_10,
  s_1,
  s_26,
  s_26,
  s_26,
  s_26,
  s_0,
  s_26,
  s_26,
  s_0,
  s_26_29,
  s_28,
  s_29,
  s_4,
  s_26,
  s_26,
  s_26,
  s_26,
  s_0,
  s_20,
  s_5,
  s_26,
  s_10_36,
  s_36,
  s_4,
  s_0,
  s_27,
  s_4,
  s_4,
  s_0,
  s_0,
  s_4,
  s_26,
  s_18,
  s_26,
  s_4,
  s_6_1_0,
  s_2,
  s_29,
  s_0,
  s_18,
  s_4,
  s_18,
  s_29,
  s_0,
  s_18,
  s_6_27,
  s_0,
  s_26,
  s_26,
  s_20,
  s_26,
  s_5,
  s_26,
  s_26,
  s_26,
  s_26,
  s_20,
  s_27,
  s_20,
  s_26,
  s_18_0,
  s_0,
  s_26,
  s_8,
  s_10,
  s_20,
  s_20,
  s_7_10,
  s_18,
  s_0,
  s_2,
  s_25,
  s_5,
  s_1,
  s_5,
  s_6_1,
  s_5,
  s_26,
  s_26,
  s_8,
  s_26,
  s_1,
  s_26,
  s_1,
  s_0,
  s_26,
  s_26,
  s_26,
  s_26,
  s_10,
  s_24,
  s_5,
  s_26,
  s_1,
  s_30,
  s_44,
  s_30,
  s_44,
  s_4,
  s_1,
  s_8,
  s_26,
  s_20,
  s_26,
  s_4,
  s_26,
  s_26,
  s_26,
  s_9_18_22,
  s_4,
  s_31,
  s_4,
  s_31,
  s_26,
  s_18_0,
  s_25,
  s_1,
  s_2,
  s_8,
  s_31_32,
  s_26,
  s_1,
  s_9_10,
  s_31,
  s_31,
  s_0,
  s_9_0,
  s_2,
  s_26,
  s_26,
  s_26,
  s_0,
  s_26,
  s_26,
  s_26,
  s_26,
  s_1,
  s_26,
  s_1,
  s_26,
  s_20,
  s_20,
  s_10,
  s_10,
  s_5,
  s_5,
  s_4_9,
  s_6,
  s_4,
  s_5,
  s_5,
  s_5,
  s_13,
  s_13_20,
  s_20,
  s_4,
  s_19,
  s_12_26,
  s_18_0,
  s_0,
  s_2,
  s_26,
  s_26,
  s_6,
  s_4,
  s_4,
  s_5,
  s_5,
  s_6,
  s_14_27,
  s_14,
  s_18,
  s_10,
  s_10_1,
  s_10,
  s_18,
  s_18,
  s_0,
  s_15,
  s_15,
  s_18_1,
  s_20,
  s_18,
  s_5,
  s_2,
  s_5,
  s_18,
  s_14,
  s_18,
  s_1,
  s_6,
  s_13_20,
  s_14,
  s_18,
  s_6,
  s_14,
  s_6_13_17_21_27_30_35,
  s_13_17,
  s_6,
  s_0,
  s_6,
  s_4_6,
  s_17,
  s_13,
  s_17,
  s_6,
  s_15,
  s_18,
  s_10_1,
  s_18,
  s_6,
  s_6,
  s_5,
  s_5,
  s_8_27,
  s_1,
  s_4,
  s_18,
  s_9,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_5,
  s_27,
  s_2,
  s_7,
  s_4_13_22,
  s_0,
  s_6_10,
  s_1,
  s_9,
  s_18,
  s_0,
  s_6,
  s_4,
  s_9,
  s_6,
  s_1,
  s_25,
  s_27,
  s_1,
  s_5,
  s_5,
  s_0,
  s_5,
  s_1,
  s_5_26,
  s_1,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_14,
  s_0,
  s_14,
  s_15,
  s_18,
  s_26,
  s_9_10,
  s_9_18_1_0,
  s_4_9_22,
  s_31,
  s_0,
  s_7_9,
  s_18,
  s_1_0,
  s_7,
  s_4_9_22,
  s_31,
  s_0,
  s_2,
  s_18,
  s_36,
  s_9,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_4_7_9_10_26,
  s_0,
  s_10,
  s_31_32,
  s_6,
  s_7_9_24,
  s_10,
  s_10,
  s_1,
  s_2,
  s_10,
  s_0,
  s_1_0,
  s_2,
  s_18,
  s_18,
  s_9,
  s_28,
  s_20,
  s_14,
  s_9,
  s_0,
  s_4,
  s_10,
  s_7_10,
  s_1,
  s_1,
  s_2,
  s_1,
  s_26,
  s_7,
  s_0,
  s_18,
  s_0,
  s_2,
  s_11,
  s_26_35_41_0,
  s_4_7,
  s_18,
  s_4,
  s_2,
  s_10,
  s_27,
  s_6_9_18,
  s_18,
  s_18,
  s_1_0,
  s_2,
  s_4,
  s_4,
  s_37,
  s_0,
  s_18,
  s_4,
  s_37,
  s_0,
  s_18,
  s_22,
  s_18,
  s_10,
  s_10_11,
  s_0,
  s_2,
  s_6,
  s_14,
  s_0,
  s_27,
  s_18,
  s_27,
  s_27,
  s_27,
  s_18,
  s_18,
  s_6,
  s_6,
  s_27,
  s_18,
  s_0_1,
  s_0,
  s_0,
  s_30_37_43,
  s_0,
  s_6_27,
  s_0,
  s_4_6_22,
  s_6_27,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_2,
  s_7,
  s_26,
  s_18,
  s_9,
  s_0,
  s_2,
  s_9,
  s_31_32_39,
  s_0,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_17,
  s_17,
  s_23_0,
  s_14,
  s_17,
  s_17,
  s_10,
  s_18,
  s_18,
  s_6,
  s_13_20,
  s_26,
  s_4,
  s_8,
  s_26,
  s_20,
  s_1,
  s_10,
  s_20,
  s_15,
  s_8_15,
  s_9,
  s_26_0_2,
  s_17,
  s_9,
  s_1_0,
  s_20,
  s_0,
  s_41,
  s_7,
  s_41,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7_26,
  s_18_0,
  s_2,
  s_0,
  s_7,
  s_2,
  s_0,
  s_2,
  s_7,
  s_20,
  s_17,
  s_0,
  s_10_15_18,
  s_18,
  s_9,
  s_18_0,
  s_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7,
  s_30,
  s_7,
  s_27,
  s_30_31_36,
  s_0,
  s_0,
  s_6_7_10_26,
  s_30,
  s_4_9,
  s_0,
  s_0,
  s_18,
  s_0,
  s_0,
  s_32_36,
  s_6_9_10,
  s_0,
  s_18,
  s_0,
  s_2,
  s_7,
  s_15,
  s_10,
  s_17,
  s_27,
  s_14,
  s_6,
  s_0,
  s_0,
  s_0,
  s_6_7_9_10_14_18_36_39,
  s_9,
  s_0,
  s_23_0,
  s_9,
  s_0,
  s_2,
  s_9,
  s_31_36,
  s_4_9,
  s_14,
  s_5_9,
  s_18,
  s_6,
  s_18,
  s_6,
  s_7_26,
  s_0,
  s_20,
  s_18_0,
  s_0,
  s_4_9,
  s_35,
  s_31_34_35,
  s_18,
  s_4,
  s_4_22,
  s_42_0,
  s_0,
  s_6,
  s_10_26,
  s_30,
  s_30_35,
  s_14,
  s_27,
  s_27,
  s_27,
  s_6,
  s_36_42,
  s_4_6_9_10_0,
  s_0,
  s_18,
  s_0,
  s_2,
  s_26,
  s_26,
  s_26,
  s_0,
  s_0,
  s_30,
  s_7_24,
  s_30,
  s_0,
  s_2,
  s_26,
  s_26,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_31_35,
  s_4_9_11,
  s_18,
  s_30,
  s_4_14,
  s_26,
  s_26,
  s_0,
  s_2,
  s_26,
  s_35,
  s_0,
  s_30,
  s_0,
  s_4,
  s_30_33_35_40,
  s_7_26,
  s_4,
  s_30_33_35_40,
  s_4,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_2,
  s_4_7,
  s_40,
  s_4,
  s_0,
  s_4_7,
  s_2,
  s_18_0,
  s_30_31,
  s_7_28,
  s_30_31,
  s_20,
  s_0,
  s_7,
  s_7,
  s_21_0,
  s_7,
  s_2,
  s_0,
  s_18_1_0,
  s_4,
  s_29_33,
  s_0,
  s_4_7_26,
  s_4,
  s_29_33,
  s_0,
  s_9,
  s_1,
  s_9,
  s_26,
  s_0,
  s_1,
  s_26,
  s_0,
  s_22,
  s_9,
  s_6,
  s_0,
  s_26,
  s_27,
  s_4,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9,
  s_9,
  s_6,
  s_1,
  s_26,
  s_6_1,
  s_6,
  s_1,
  s_4,
  s_41,
  s_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_14,
  s_18,
  s_4_11_19_30_35,
  s_0,
  s_4_26,
  s_30,
  s_0,
  s_17,
  s_4_11_26,
  s_5,
  s_35,
  s_4,
  s_7,
  s_0,
  s_2,
  s_31_41,
  s_0,
  s_38_40,
  s_10,
  s_0,
  s_9,
  s_2,
  s_10,
  s_0,
  s_6_26,
  s_0,
  s_0,
  s_2,
  s_12,
  s_12,
  s_4,
  s_7_12_26,
  s_0,
  s_2,
  s_32,
  s_26,
  s_10,
  s_7,
  s_0,
  s_2,
  s_0,
  s_0,
  s_26,
  s_19,
  s_35_41,
  s_0,
  s_6_9,
  s_6,
  s_0,
  s_35_36,
  s_0,
  s_0,
  s_6,
  s_0,
  s_42,
  s_26,
  s_26,
  s_0,
  s_0,
  s_7,
  s_0,
  s_7,
  s_7,
  s_7,
  s_0,
  s_2,
  s_4_24_0_1,
  s_2,
  s_7_26,
  s_7,
  s_0,
  s_2,
  s_24_0,
  s_9,
  s_0,
  s_26,
  s_24,
  s_2,
  s_26,
  s_0,
  s_6_8_1_0,
  s_4_9_10,
  s_18_1,
  s_1,
  s_2,
  s_42,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_7,
  s_7,
  s_7_15,
  s_7,
  s_7,
  s_0,
  s_7,
  s_0,
  s_7,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_32_36,
  s_4_10,
  s_18,
  s_7_10,
  s_0,
  s_2,
  s_12,
  s_0,
  s_12,
  s_0,
  s_0,
  s_7,
  s_1,
  s_26,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4_19,
  s_7,
  s_38_41,
  s_4,
  s_11,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_6_31_35,
  s_4_22,
  s_0,
  s_7,
  s_0,
  s_7,
  s_2,
  s_6_30_41,
  s_0,
  s_4,
  s_0,
  s_42,
  s_0,
  s_9_10_24,
  s_1,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_30,
  s_32,
  s_0,
  s_2,
  s_10_11,
  s_32_42,
  s_0,
  s_2,
  s_7,
  s_0,
  s_9_0,
  s_6_7_9_10_18_32_40,
  s_7_26,
  s_0,
  s_2,
  s_4_6,
  s_0,
  s_18,
  s_18,
  s_4,
  s_0,
  s_2,
  s_32,
  s_10,
  s_32_40_41,
  s_0,
  s_0,
  s_2,
  s_4_9,
  s_9_26,
  s_9_0,
  s_26,
  s_2,
  s_6_21,
  s_18,
  s_18,
  s_4,
  s_7_26,
  s_7_26,
  s_0,
  s_2,
  s_35_40,
  s_4,
  s_4,
  s_30_40,
  s_0,
  s_4_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_7,
  s_32,
  s_10,
  s_0,
  s_2,
  s_7,
  s_7,
  s_26,
  s_0,
  s_2,
  s_29_30,
  s_11_22_27,
  s_18,
  s_4_30_31_35_36_37,
  s_0,
  s_0,
  s_4_6_7_9_10_25,
  s_0,
  s_6,
  s_18_1,
  s_1,
  s_0,
  s_2,
  s_7,
  s_4,
  s_10,
  s_6_9_10_25_35_41,
  s_9,
  s_41,
  s_0,
  s_4_26,
  s_7,
  s_0,
  s_7,
  s_2,
  s_10_2_0,
  s_0,
  s_2,
  s_7,
  s_4_7_26,
  s_0,
  s_30,
  s_0,
  s_4_11_26,
  s_6_18,
  s_7,
  s_0,
  s_2,
  s_0,
  s_4_6,
  s_36_41,
  s_0,
  s_36,
  s_7,
  s_0,
  s_2,
  s_7_10,
  s_0,
  s_2,
  s_32,
  s_0,
  s_7,
  s_0,
  s_4_7_11_12_16,
  s_4_19,
  s_0,
  s_2,
  s_7,
  s_26,
  s_0,
  s_26,
  s_26_27,
  s_0,
  s_9_10,
  s_31,
  s_0,
  s_14,
  s_6,
  s_7_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_5,
  s_26,
  s_30_33,
  s_4_22,
  s_0,
  s_7_26,
  s_4_7_26,
  s_7_26,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_7_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_0,
  s_18,
  s_18,
  s_0,
  s_2,
  s_0,
  s_7,
  s_7,
  s_7,
  s_18,
  s_24,
  s_0,
  s_0,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_9,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_0,
  s_9,
  s_0,
  s_2,
  s_7_9,
  s_7,
  s_0,
  s_7,
  s_2,
  s_4_10_0,
  s_2,
  s_30_41,
  s_4,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_4,
  s_0,
  s_14,
  s_14_18,
  s_0,
  s_7,
  s_18_1,
  s_30,
  s_7_19,
  s_0,
  s_10,
  s_7_9,
  s_0,
  s_7_9,
  s_29_30,
  s_0,
  s_0,
  s_7_9,
  s_41,
  s_26,
  s_30,
  s_36_42_0,
  s_4_10_18_28,
  s_35,
  s_0,
  s_4,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_6_18_1_0,
  s_9_27_37_39,
  s_0,
  s_16_21,
  s_11,
  s_0,
  s_0,
  s_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4,
  s_1,
  s_2,
  s_23_38,
  s_15,
  s_0,
  s_24_0,
  s_4_15,
  s_5,
  s_19_24,
  s_11_26_0_1,
  s_10_21_0,
  s_2,
  s_20,
  s_30,
  s_4,
  s_6,
  s_28,
  s_28,
  s_0,
  s_35,
  s_0,
  s_4_25,
  s_0,
  s_2,
  s_7,
  s_8,
  s_25,
  s_25,
  s_4_16,
  s_32_35_36,
  s_4_10_16,
  s_18,
  s_0,
  s_7,
  s_7_26,
  s_0,
  s_26,
  s_4_7_9_12_25,
  s_6_17_31_37_38_39_42,
  s_0,
  s_4,
  s_6,
  s_30_35,
  s_4_10,
  s_30_31_41_42,
  s_0,
  s_4_17_24_26,
  s_0,
  s_2_0,
  s_0,
  s_9,
  s_0,
  s_0,
  s_10_26,
  s_10_26,
  s_0,
  s_2,
  s_0,
  s_21,
  s_4_0,
  s_0,
  s_0,
  s_41,
  s_0,
  s_26,
  s_0,
  s_0,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7_24_26,
  s_0,
  s_2,
  s_7_26,
  s_7,
  s_18_0,
  s_2,
  s_0,
  s_2,
  s_26,
  s_7,
  s_0,
  s_9,
  s_0,
  s_7,
  s_0,
  s_0,
  s_26,
  s_0,
  s_26,
  s_2,
  s_0,
  s_2,
  s_7,
  s_27,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_0,
  s_2,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_7_24,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_0,
  s_0,
  s_7_22,
  s_22,
  s_0,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7_26_41,
  s_0,
  s_2,
  s_7,
  s_0,
  s_9,
  s_30_35_41_42_0,
  s_0,
  s_4_9,
  s_0,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_0,
  s_7,
  s_0,
  s_7,
  s_7,
  s_4_7_11_22_23_30,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_9,
  s_0,
  s_2,
  s_7_22,
  s_0,
  s_32_42,
  s_0,
  s_2,
  s_10,
  s_0,
  s_30_35,
  s_6_17_22,
  s_29_30,
  s_4_22_28,
  s_6,
  s_18_26,
  s_31,
  s_4,
  s_26,
  s_0,
  s_26,
  s_42,
  s_10,
  s_0,
  s_0,
  s_4_28,
  s_18_0,
  s_6_9_21,
  s_30_42,
  s_7,
  s_18_0,
  s_7,
  s_2,
  s_0,
  s_4,
  s_4,
  s_4,
  s_0,
  s_35_38_0,
  s_4_25,
  s_25,
  s_0,
  s_8,
  s_14,
  s_6,
  s_0,
  s_24_26,
  s_4_7,
  s_0,
  s_2,
  s_0,
  s_7_9,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_2,
  s_7,
  s_4_7,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_0,
  s_2,
  s_4_7,
  s_0,
  s_4_21,
  s_40,
  s_21_26,
  s_27,
  s_10_32_35_36,
  s_4_10_22_25,
  s_10,
  s_10_25_32,
  s_0,
  s_11_15_26,
  s_26,
  s_18_0,
  s_2,
  s_6,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_7,
  s_8_10_24_31_40_41,
  s_4,
  s_18,
  s_1,
  s_4,
  s_1,
  s_15,
  s_6,
  s_10_18_1,
  s_15_18,
  s_18,
  s_15,
  s_10,
  s_10,
  s_32,
  s_9_10,
  s_24_1_0,
  s_6_10_27,
  s_5,
  s_0,
  s_41,
  s_26,
  s_0,
  s_28,
  s_10,
  s_14_0,
  s_7_12,
  s_0,
  s_2,
  s_18,
  s_26,
  s_18,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_0,
  s_7,
  s_26,
  s_17,
  s_0,
  s_2,
  s_12,
  s_4,
  s_7_20_27_0,
  s_20,
  s_27,
  s_6,
  s_0,
  s_4,
  s_2,
  s_7,
  s_0,
  s_7,
  s_0,
  s_2,
  s_9,
  s_0,
  s_4_7,
  s_0,
  s_2,
  s_0,
  s_7,
  s_0,
  s_7,
  s_29_30_31,
  s_0,
  s_7_26,
  s_7,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_7,
  s_0,
  s_36,
  s_27,
  s_3_18_0,
  s_9,
  s_30_31,
  s_0,
  s_7_9,
  s_18_0,
  s_0,
  s_2,
  s_7,
  s_9,
  s_30_31,
  s_0,
  s_2,
  s_30_42,
  s_7_9,
  s_0,
  s_15,
  s_0,
  s_6,
  s_31,
  s_4,
  s_7,
  s_0,
  s_2,
  s_6,
  s_7,
  s_0,
  s_15,
  s_10_18_1,
  s_0,
  s_2,
  s_32_41,
  s_4_10,
  s_18,
  s_18,
  s_0,
  s_5,
  s_5,
  s_5,
  s_7,
  s_0,
  s_2,
  s_31_32_36,
  s_0,
  s_4_16,
  s_18_27,
  s_4,
  s_0,
  s_32_36_41,
  s_6_19,
  s_18,
  s_4_9_11_19,
  s_0_1,
  s_6,
  s_41,
  s_34_41,
  s_4_7,
  s_0,
  s_2,
  s_4,
  s_17,
  s_17,
  s_30_0,
  s_26,
  s_17,
  s_1,
  s_20,
  s_0_1,
  s_4,
  s_30,
  s_0,
  s_14,
  s_18,
  s_4,
  s_30,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_4_7_14,
  s_42,
  s_18_22,
  s_0,
  s_13,
  s_18_34_37,
  s_0,
  s_26,
  s_26,
  s_0,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_9,
  s_0,
  s_2,
  s_0,
  s_0,
  s_7,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_7_9,
  s_2,
  s_7_9,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_7,
  s_0,
  s_0,
  s_7_19,
  s_1,
  s_7,
  s_0,
  s_2,
  s_17_0,
  s_7,
  s_0,
  s_7,
  s_11_0,
  s_7,
  s_2,
  s_0,
  s_7,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_9,
  s_0,
  s_0,
  s_0,
  s_2,
  s_0,
  s_0,
  s_2,
  s_0,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_26,
  s_26_28,
  s_18,
  s_4_18,
  s_1_0,
  s_4_26,
  s_14,
  s_18,
  s_26,
  s_26,
  s_37,
  s_0,
  s_9_12,
  s_7,
  s_0,
  s_29_31_41,
  s_0,
  s_7_10_11_22_26,
  s_0_1,
  s_2,
  s_0,
  s_0,
  s_2,
  s_7,
  s_31_32,
  s_9,
  s_1_0,
  s_10_18_0,
  s_7_26,
  s_18_0_1,
  s_2,
  s_9_11_15,
  s_0,
  s_26,
  s_38_42,
  s_14_26,
  s_18,
  s_7,
  s_6,
  s_18,
  s_38_41,
  s_4_22,
  s_18,
  s_3_0,
  s_2,
  s_7,
  s_9_0,
  s_1,
  s_10,
  s_7_23,
  s_28,
  s_0,
  s_6,
  s_26,
  s_10_35,
  s_29_37_43,
  s_0,
  s_4,
  s_7,
  s_0,
  s_4_26,
  s_0,
  s_0,
  s_30,
  s_0,
  s_6,
  s_4_7_11_22,
  s_0,
  s_6,
  s_32,
  s_0,
  s_10_11_24,
  s_0,
  s_7,
  s_0,
  s_7,
  s_2,
  s_24,
  s_32,
  s_4_9,
  s_6_27,
  s_20_22,
  s_22,
  s_0,
  s_4_7_9_18_19_31_32_41,
  s_0,
  s_0,
  s_2,
  s_26,
  s_22,
  s_10,
  s_22,
  s_10,
  s_30_32,
  s_0,
  s_7,
  s_2,
  s_18,
  s_9,
  s_7_9_10_14,
  s_1,
  s_0,
  s_2,
  s_0,
  s_0,
  s_18,
  s_10,
  s_10,
  s_10,
  s_2,
  s_41,
  s_4,
  s_0,
  s_1,
  s_0,
  s_7_19_0,
  s_0,
  s_6,
  s_7,
  s_0,
  s_2,
  s_22,
  s_38_41,
  s_4,
  s_22,
  s_8,
  s_37,
  s_0,
  s_0,
  s_12,
  s_30,
  s_29_30_31,
  s_4_22_27,
  s_5,
  s_5,
  s_20,
  s_10,
  s_18,
  s_32,
  s_0,
  s_2,
  s_7_9,
  s_9_18,
  s_7_9,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_31_34,
  s_13,
  s_4,
  s_6,
  s_0,
  s_2,
  s_6,
  s_35,
  s_31_35,
  s_0,
  s_4,
  s_18,
  s_37,
  s_0,
  s_2,
  s_4,
  s_0,
  s_12,
  s_6_9_13,
  s_18,
  s_4_11,
  s_10_18,
  s_14,
  s_0,
  s_0,
  s_17,
  s_8,
  s_1,
  s_34,
  s_6,
  s_42,
  s_0,
  s_4,
  s_18,
  s_4,
  s_0,
  s_6_27_1,
  s_4_6,
  s_6,
  s_29_34,
  s_6,
  s_0,
  s_0,
  s_7,
  s_42,
  s_26,
  s_26,
  s_0,
  s_2,
  s_40,
  s_0,
  s_4_7_21,
  s_0,
  s_0,
  s_18,
  s_18,
  s_18,
  s_30_37_41,
  s_0,
  s_4_7_22,
  s_27,
  s_0,
  s_7,
  s_0,
  s_0,
  s_7_26,
  s_2,
  s_10,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_7,
  s_11,
  s_41,
  s_0,
  s_0,
  s_0,
  s_2,
  s_8,
  s_0,
  s_2,
  s_4,
  s_10_32_0,
  s_10,
  s_30_31,
  s_10,
  s_10,
  s_30_31,
  s_2,
  s_14_18_30_32_36_41,
  s_4_7_11,
  s_4_7_0,
  s_18,
  s_0,
  s_29_30_32_34_35,
  s_0,
  s_27,
  s_4_27,
  s_6,
  s_0,
  s_2,
  s_7_9,
  s_18,
  s_10,
  s_29_30_37,
  s_0,
  s_0,
  s_2,
  s_7,
  s_4_11_26,
  s_4_7,
  s_8_27_30_32,
  s_14_18,
  s_20,
  s_7,
  s_7,
  s_6,
  s_9,
  s_6,
  s_6,
  s_6,
  s_6,
  s_0,
  s_14,
  s_0,
  s_0_2,
  s_6_36,
  s_6_17,
  s_26,
  s_41,
  s_18,
  s_0,
  s_6,
  s_8,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_6,
  s_30_40,
  s_7_26,
  s_28,
  s_4,
  s_18,
  s_7_26,
  s_7,
  s_20,
  s_18_0,
  s_2,
  s_0,
  s_36,
  s_4_6_9,
  s_0,
  s_0,
  s_9,
  s_18,
  s_0,
  s_15,
  s_10,
  s_0,
  s_7,
  s_0,
  s_0,
  s_6,
  s_27,
  s_29_30_32,
  s_4,
  s_4,
  s_18,
  s_27,
  s_0,
  s_0,
  s_2,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_35,
  s_8,
  s_27,
  s_27,
  s_18,
  s_22,
  s_22_0,
  s_6_9_10_35,
  s_4,
  s_12,
  s_31_32,
  s_18,
  s_10_0,
  s_2,
  s_4_9_10,
  s_10_14,
  s_0,
  s_2,
  s_9,
  s_18,
  s_1_0,
  s_0,
  s_14,
  s_4,
  s_22,
  s_14,
  s_0,
  s_7,
  s_7,
  s_0,
  s_2,
  s_26,
  s_0,
  s_26,
  s_0,
  s_2,
  s_0,
  s_32_35_41,
  s_0,
  s_4_10,
  s_1,
  s_2,
  s_7,
  s_0,
  s_2,
  s_5_18,
  s_5,
  s_1,
  s_1,
  s_2,
  s_27,
  s_27,
  s_5,
  s_5,
  s_0,
  s_0,
  s_2,
  s_26,
  s_12_26,
  s_29_35,
  s_4,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_7,
  s_7,
  s_0,
  s_0,
  s_2,
  s_4_6_10_30_32_35,
  s_4_10,
  s_5,
  s_6_30,
  s_0_2,
  s_15_0_2,
  s_18,
  s_0,
  s_2,
  s_7,
  s_9_12,
  s_0,
  s_9,
  s_10,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_32_38,
  s_0,
  s_2,
  s_4_10,
  s_0,
  s_7,
  s_2,
  s_7,
  s_31_32,
  s_4_10_26,
  s_4_26,
  s_0,
  s_2,
  s_10,
  s_26,
  s_2,
  s_39,
  s_4_19_26,
  s_6,
  s_4_7,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_26,
  s_18_0,
  s_26,
  s_18_0,
  s_2,
  s_12,
  s_0,
  s_35,
  s_31_38_39,
  s_4,
  s_18,
  s_14,
  s_4,
  s_4_6_9,
  s_0,
  s_2,
  s_1,
  s_29_31_32_36_37,
  s_0,
  s_18,
  s_0,
  s_30,
  s_0,
  s_30,
  s_4_22,
  s_0,
  s_7_26,
  s_35_41,
  s_35_41,
  s_4_6_11,
  s_4,
  s_4_10_21,
  s_4_10,
  s_9_11_32,
  s_7,
  s_28_0,
  s_0,
  s_2,
  s_7,
  s_39,
  s_9,
  s_2,
  s_5,
  s_4,
  s_2,
  s_6_8,
  s_18,
  s_32,
  s_4_10,
  s_0,
  s_18,
  s_35,
  s_30_31_35_40,
  s_4_27,
  s_6,
  s_4,
  s_4,
  s_4,
  s_9_0,
  s_0,
  s_2,
  s_14_36,
  s_4_6_9_14,
  s_0_1,
  s_40,
  s_0,
  s_40,
  s_0,
  s_2,
  s_11,
  s_32,
  s_4_10,
  s_1,
  s_10,
  s_0,
  s_2,
  s_18,
  s_4,
  s_18,
  s_4_6_10_18_32_36_40,
  s_1_0,
  s_9,
  s_18,
  s_6_7_14,
  s_36,
  s_4_6_10,
  s_0,
  s_4_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_2,
  s_7_26,
  s_0,
  s_2,
  s_29_40,
  s_4_22,
  s_27,
  s_1_0,
  s_26,
  s_26,
  s_30,
  s_4_26_27,
  s_27,
  s_8,
  s_4_10_32,
  s_0,
  s_2,
  s_0,
  s_2,
  s_0,
  s_7,
  s_0,
  s_10_21_26,
  s_31_32_40,
  s_18_0,
  s_14,
  s_4,
  s_4,
  s_18_0,
  s_0,
  s_4,
  s_1,
  s_1,
  s_9,
  s_18,
  s_0,
  s_0,
  s_26,
  s_6_10,
  s_4_6,
  s_7,
  s_21_0,
  s_7,
  s_23,
  s_9_1_0,
  s_26,
  s_2,
  s_30_31_41,
  s_0,
  s_4,
  s_4,
  s_0,
  s_6,
  s_7_26,
  s_8,
  s_1,
  s_1,
  s_9_18,
  s_9,
  s_18_0,
  s_22,
  s_22,
  s_2,
  s_4_9_10_14,
  s_0,
  s_2,
  s_14,
  s_7,
  s_0,
  s_2,
  s_6,
  s_4_7,
  s_0,
  s_2,
  s_4,
  s_31_32,
  s_0,
  s_0,
  s_2,
  s_4,
  s_0,
  s_10,
  s_30,
  s_0,
  s_10,
  s_0,
  s_7,
  s_10_0_1,
  s_2,
  s_7,
  s_9_10_0,
  s_4_9,
  s_0,
  s_7,
  s_2,
  s_2,
  s_7,
  s_41,
  s_41,
  s_4_19,
  s_0,
  s_0,
  s_14,
  s_8,
  s_0,
  s_35,
  s_4,
  s_0,
  s_30,
  s_28,
  s_32,
  s_1,
  s_9_35_39,
  s_4,
  s_6,
  s_4_10,
  s_18,
  s_4_6_30_40,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_0,
  s_6,
  s_32_42,
  s_10,
  s_4,
  s_35_42,
  s_0,
  s_26,
  s_4_26,
  s_0,
  s_8_1,
  s_4_10,
  s_0,
  s_0,
  s_1_2,
  s_42,
  s_24,
  s_24,
  s_0,
  s_10_32_36,
  s_10,
  s_1,
  s_4_7_9_14_21_37_42,
  s_0,
  s_9,
  s_0,
  s_2,
  s_7,
  s_6_9_10,
  s_1,
  s_0,
  s_41,
  s_4_6_10_11,
  s_0,
  s_6,
  s_6,
  s_1,
  s_28_0,
  s_14_15_0,
  s_31,
  s_31,
  s_32,
  s_4_10,
  s_35,
  s_0,
  s_0,
  s_15,
  s_10,
  s_30,
  s_6,
  s_10,
  s_30_35_40,
  s_27,
  s_1,
  s_1,
  s_10,
  s_35_42,
  s_0,
  s_1,
  s_4_6_30_35,
  s_4_11_0,
  s_18,
  s_1,
  s_41,
  s_18,
  s_4_28_36,
  s_26,
  s_41,
  s_18,
  s_27_32_0,
  s_2,
  s_4,
  s_18,
  s_11,
  s_0,
  s_4_10,
  s_0,
  s_2,
  s_35,
  s_4_28,
  s_32,
  s_7,
  s_7,
  s_0,
  s_2,
  s_35,
  s_4_6_13,
  s_1,
  s_0,
  s_18_41,
  s_0,
  s_9,
  s_31,
  s_7,
  s_9,
  s_31,
  s_2,
  s_14_0,
  s_10,
  s_4,
  s_30_41,
  s_7_9,
  s_18_0,
  s_0,
  s_7,
  s_4,
  s_30_41,
  s_2,
  s_18,
  s_0,
  s_18,
  s_6,
  s_18,
  s_4_26,
  s_20,
  s_4,
  s_18,
  s_9,
  s_1,
  s_8,
  s_7,
  s_0,
  s_32,
  s_4_10,
  s_35,
  s_4,
  s_0,
  s_6,
  s_1,
  s_4,
  s_14,
  s_30_31,
  s_4_9_10,
  s_32_38_41,
  s_4,
  s_31_32_36,
  s_0,
  s_4_9_10,
  s_0,
  s_0,
  s_10_18,
  s_9,
  s_0,
  s_0,
  s_2,
  s_0,
  s_19,
  s_28,
  s_31_42,
  s_0,
  s_24,
  s_24,
  s_24,
  s_32,
  s_10,
  s_10_24_0_1,
  s_2,
  s_18,
  s_10_0,
  s_19_30_32,
  s_0,
  s_6,
  s_4_11_28,
  s_0,
  s_0,
  s_38,
  s_0,
  s_0,
  s_4_6_9_14_25,
  s_18,
  s_0,
  s_0,
  s_0,
  s_4,
  s_30_35,
  s_4,
  s_6_0,
  s_1,
  s_6_8,
  s_1,
  s_30,
  s_1,
  s_1,
  s_12,
  s_35_36,
  s_7_9_10_28,
  s_30_41_42,
  s_0,
  s_18,
  s_4_10,
  s_1,
  s_10_32,
  s_18,
  s_18,
  s_35,
  s_0,
  s_26,
  s_0,
  s_1,
  s_8,
  s_23,
  s_4,
  s_4,
  s_8,
  s_7_12_26,
  s_1,
  s_18_32_0,
  s_2,
  s_9_10,
  s_37,
  s_0,
  s_0,
  s_4_10_12,
  s_0,
  s_2,
  s_7_9,
  s_0,
  s_2,
  s_32,
  s_4_10,
  s_32,
  s_0,
  s_6_13_0,
  s_29_34_37,
  s_0,
  s_0,
  s_12_26,
  s_1,
  s_1,
  s_1,
  s_7,
  s_0,
  s_7,
  s_2,
  s_1,
  s_1,
  s_1,
  s_2,
  s_1,
  s_25,
  s_0,
  s_1,
  s_1,
  s_1,
  s_0,
  s_1,
  s_2,
  s_6,
  s_7,
  s_7,
  s_0,
  s_10_0,
  s_2,
  s_24,
  s_30,
  s_24,
  s_30,
  s_1,
  s_1,
  s_0,
  s_0,
  s_0,
  s_1,
  s_26,
  s_1,
  s_2,
  s_1,
  s_35,
  s_6,
  s_0,
  s_7,
  s_2,
  s_7,
  s_0,
  s_2,
  s_9_26_31_42,
  s_18,
  s_0,
  s_0,
  s_0,
  s_2,
  s_10,
  s_30_31_32_35_36_38,
  s_4_10,
  s_0,
  s_10,
  s_8,
  s_9_30,
  s_0,
  s_9,
  s_4,
  s_41,
  s_27,
  s_27,
  s_31,
  s_9,
  s_0,
  s_7,
  s_0,
  s_7_22_26,
  s_0,
  s_18_30_35,
  s_0,
  s_0,
  s_0,
  s_32_38_39_41,
  s_18,
  s_0,
  s_4_11_17_22,
  s_0,
  s_7,
  s_40,
  s_35,
  s_4,
  s_31,
  s_9,
  s_9,
  s_1,
  s_0,
  s_2,
  s_30_38,
  s_22_26,
  s_22_26,
  s_0,
  s_35,
  s_22,
  s_18,
  s_20,
  s_27,
  s_29,
  s_4,
  s_30_35,
  s_0,
  s_19_23,
  s_30,
  s_0,
  s_0,
  s_7,
  s_33_35_38_42,
  s_18,
  s_0,
  s_35,
  s_22_26,
  s_18_29_41_0,
  s_30_31_32_41,
  s_0,
  s_0,
  s_4,
  s_18,
  s_26,
  s_7,
  s_7,
  s_0,
  s_7,
  s_27,
  s_7,
  s_9_0,
  s_7,
  s_2,
  s_7,
  s_9_0,
  s_4_11,
  s_0,
  s_10,
  s_32,
  s_32,
  s_36,
  s_4_6_9,
  s_0,
  s_2,
  s_9,
  s_18,
  s_4_6_9_10_21_41,
  s_4,
  s_24_0,
  s_2,
  s_4_10_11_19_22_26,
  s_30,
  s_27,
  s_5_0,
  s_0,
  s_6,
  s_0,
  s_40_41,
  s_32,
  s_4,
  s_4_9,
  s_0,
  s_18,
  s_0,
  s_4,
  s_4_11,
  s_4_5_7_21,
  s_18,
  s_2_0,
  s_4,
  s_0,
  s_2,
  s_41,
  s_4,
  s_18,
  s_29_30_37,
  s_0,
  s_0,
  s_4_7,
  s_17,
  s_7,
  s_0,
  s_2,
  s_0,
  s_0,
  s_6,
  s_7,
  s_0,
  s_7,
  s_2,
  s_7_10,
  s_1,
  s_0,
  s_10_32_35_37_41,
  s_18,
  s_0,
  s_2,
  s_4_9_10,
  s_10_40,
  s_32_36,
  s_1,
  s_20,
  s_2,
  s_7,
  s_0,
  s_0,
  s_4_7_10_22,
  s_30_31_42,
  s_0,
  s_4_9_24_26,
  s_7_26,
  s_0,
  s_0_2,
  s_2,
  s_7_9,
  s_2,
  s_35,
  s_0,
  s_14,
  s_27,
  s_27,
  s_30,
  s_1,
  s_0,
  s_22,
  s_6_27,
  s_29_30,
  s_1,
  s_29_30,
  s_1,
  s_6,
  s_27,
  s_6_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_17,
  s_30,
  s_18,
  s_15,
  s_14_18_1,
  s_10_1,
  s_22_26,
  s_30,
  s_0,
  s_22_26,
  s_30,
  s_0,
  s_22,
  s_15,
  s_4,
  s_4,
  s_19,
  s_10_23,
  s_21,
  s_10_15_18,
  s_18,
  s_10_18,
  s_6,
  s_18,
  s_5,
  s_4,
  s_6,
  s_20,
  s_6,
  s_10,
  s_0,
  s_4,
  s_6,
  s_4_9_14,
  s_15,
  s_18_1,
  s_15,
  s_18,
  s_10_18_1,
  s_15,
  s_18_1,
  s_12,
  s_0,
  s_0,
  s_2,
  s_4_12,
  s_0,
  s_15,
  s_18,
  s_5,
  s_18,
  s_0,
  s_5,
  s_20,
  s_20,
  s_1,
  s_4,
  s_42,
  s_7,
  s_0,
  s_1,
  s_27,
  s_26,
  s_26,
  s_26,
  s_5,
  s_27,
  s_4,
  s_6_8_20,
  s_10_13_18_1,
  s_18,
  s_18,
  s_1,
  s_26,
  s_37,
  s_0,
  s_6_27_35_0,
  s_6_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_4_6,
  s_18,
  s_0,
  s_18,
  s_6_18,
  s_6,
  s_6,
  s_0,
  s_18,
  s_18,
  s_6,
  s_20,
  s_20,
  s_6,
  s_18,
  s_6,
  s_7_10,
  s_10,
  s_10_18,
  s_30_32,
  s_4_9_11_19_26,
  s_23_0_1,
  s_26,
  s_2,
  s_17,
  s_26,
  s_0,
  s_0,
  s_0,
  s_0,
  s_15,
  s_9,
  s_18,
  s_0,
  s_0,
  s_2,
  s_6_18_0,
  s_4_7_26,
  s_2,
  s_24,
  s_24,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_7,
  s_0,
  s_0,
  s_0,
  s_2,
  s_0,
  s_7,
  s_7,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_2,
  s_7,
  s_7_9,
  s_2,
  s_7,
  s_0,
  s_7,
  s_2,
  s_0,
  s_2,
  s_4_9,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_0,
  s_2,
  s_0,
  s_15,
  s_9,
  s_18,
  s_29_30,
  s_4,
  s_7_9_12,
  s_0,
  s_2,
  s_9,
  s_29_30_37,
  s_0,
  s_0,
  s_2,
  s_4_12_26,
  s_0,
  s_30_38,
  s_4_11_22,
  s_0,
  s_14,
  s_17,
  s_17,
  s_10,
  s_18,
  s_20,
  s_18,
  s_18,
  s_10_18,
  s_15,
  s_20,
  s_26,
  s_1,
  s_26,
  s_1,
  s_15,
  s_5,
  s_8,
  s_1,
  s_17,
  s_18,
  s_15,
  s_18,
  s_18,
  s_18,
  s_14,
  s_27,
  s_18,
  s_14,
  s_9_14,
  s_15,
  s_1,
  s_30,
  s_9_14,
  s_18,
  s_30,
  s_9,
  s_6_17,
  s_18,
  s_15_20,
  s_17,
  s_17,
  s_9,
  s_18_1,
  s_18,
  s_9,
  s_14,
  s_22,
  s_27,
  s_27,
  s_27,
  s_15,
  s_0,
  s_27,
  s_6,
  s_0,
  s_15,
  s_0,
  s_15_0,
  s_0,
  s_18,
  s_27,
  s_0,
  s_20,
  s_20,
  s_20,
  s_6,
  s_8,
  s_22,
  s_25,
  s_15,
  s_0,
  s_15,
  s_15,
  s_0,
  s_30_31,
  s_0,
  s_0,
  s_4_12_22_26,
  s_10,
  s_18_1,
  s_1,
  s_18,
  s_27,
  s_27,
  s_27,
  s_1,
  s_11,
  s_30,
  s_26,
  s_11,
  s_30,
  s_10_0_1,
  s_0,
  s_4,
  s_26,
  s_7_24_28,
  s_1,
  s_7,
  s_1,
  s_7,
  s_6,
  s_15,
  s_5,
  s_5,
  s_27,
  s_6,
  s_5,
  s_1,
  s_6,
  s_20,
  s_6,
  s_0,
  s_0,
  s_6,
  s_5,
  s_26,
  s_15,
  s_0,
  s_1,
  s_27,
  s_0_1,
  s_27,
  s_1,
  s_0,
  s_2,
  s_0,
  s_7,
  s_15,
  s_18_1,
  s_18,
  s_14,
  s_18,
  s_4,
  s_4_6_9_10_11_18_19_21_30_32_41,
  s_14,
  s_4,
  s_4,
  s_15,
  s_1,
  s_8_17,
  s_5,
  s_5,
  s_6,
  s_5,
  s_5,
  s_15,
  s_10_18_1,
  s_10_1,
  s_36,
  s_36,
  s_15,
  s_9_12_26_37_39,
  s_9,
  s_9,
  s_0,
  s_6_9_10_24_2,
  s_4,
  s_32,
  s_4,
  s_32,
  s_30_32,
  s_4_22,
  s_24_0,
  s_15,
  s_15,
  s_18,
  s_18_0,
  s_9_10_15,
  s_38,
  s_4,
  s_6,
  s_6,
  s_20,
  s_18,
  s_18,
  s_0,
  s_7_27,
  s_5,
  s_4_6,
  s_4,
  s_20,
  s_4,
  s_14,
  s_0,
  s_20,
  s_0,
  s_5,
  s_5,
  s_5,
  s_5,
  s_28,
  s_28,
  s_18,
  s_18,
  s_6,
  s_15,
  s_10,
  s_4_35,
  s_15,
  s_10_32,
  s_18,
  s_10,
  s_10,
  s_4,
  s_5,
  s_20,
  s_6,
  s_13_20,
  s_5,
  s_20,
  s_27,
  s_5_6_13_18_23_33_35,
  s_5,
  s_18,
  s_5_18,
  s_6,
  s_5,
  s_6_13_29_35,
  s_13_20,
  s_6,
  s_4_6_38,
  s_6_33,
  s_21,
  s_5_38,
  s_4,
  s_6,
  s_5,
  s_5,
  s_15_18,
  s_20,
  s_18_1,
  s_15,
  s_4_6,
  s_6,
  s_4,
  s_18,
  s_18_1,
  s_18,
  s_18,
  s_1,
  s_1,
  s_9,
  s_18,
  s_18,
  s_6,
  s_6_18,
  s_20,
  s_7,
  s_38,
  s_7_10,
  s_5,
  s_5_7_18_27_29_0,
  s_0,
  s_27,
  s_27,
  s_5,
  s_18,
  s_15,
  s_18,
  s_4_6_17_35,
  s_18,
  s_18,
  s_10,
  s_18,
  s_27,
  s_0,
  s_2,
  s_7,
  s_18,
  s_27,
  s_27,
  s_0,
  s_10,
  s_20,
  s_5,
  s_5,
  s_5,
  s_18,
  s_18,
  s_6_41,
  s_18,
  s_4,
  s_0,
  s_18,
  s_6,
  s_18,
  s_1,
  s_9_14,
  s_18_1,
  s_13,
  s_15,
  s_6,
  s_18,
  s_15,
  s_13_20,
  s_6,
  s_6,
  s_4_13_14_26_32_35_38,
  s_15,
  s_18_1,
  s_6,
  s_13,
  s_6,
  s_20,
  s_13,
  s_4,
  s_20,
  s_20,
  s_10_17_18,
  s_1,
  s_20,
  s_15,
  s_18,
  s_6,
  s_0,
  s_6,
  s_6,
  s_4,
  s_35,
  s_6,
  s_6,
  s_28,
  s_11_39,
  s_0,
  s_0,
  s_18,
  s_18,
  s_18,
  s_9,
  s_18,
  s_28,
  s_18,
  s_18,
  s_6_15_36,
  s_10_18_1,
  s_10,
  s_4,
  s_18,
  s_20,
  s_6_11_23_35_37_38_42,
  s_23,
  s_10_27,
  s_27,
  s_18,
  s_0,
  s_2,
  s_20,
  s_20,
  s_18,
  s_27,
  s_18,
  s_5,
  s_5,
  s_18,
  s_14,
  s_20,
  s_7_26_29_30,
  s_0,
  s_4_38,
  s_2,
  s_7,
  s_0,
  s_10_13_15,
  s_18_1,
  s_10_18_1,
  s_5,
  s_6_11,
  s_5,
  s_6_8_32_34,
  s_18,
  s_8_32,
  s_10_13,
  s_0,
  s_5,
  s_0,
  s_5_18,
  s_5,
  s_14,
  s_38,
  s_18,
  s_10_35_36,
  s_18,
  s_0,
  s_6,
  s_0,
  s_2,
  s_9_12,
  s_6,
  s_6,
  s_15,
  s_6,
  s_10_32,
  s_18,
  s_10_0,
  s_2,
  s_18,
  s_18,
  s_18_1,
  s_4,
  s_18,
  s_0,
  s_2,
  s_7_26,
  s_26,
  s_7,
  s_26,
  s_4,
  s_8,
  s_30,
  s_6,
  s_0,
  s_0,
  s_30,
  s_13,
  s_13_27_30,
  s_5,
  s_20,
  s_0,
  s_13,
  s_14,
  s_6,
  s_4,
  s_18,
  s_5,
  s_5_18,
  s_18,
  s_42,
  s_41_42,
  s_26,
  s_5,
  s_10,
  s_10_18,
  s_15,
  s_15,
  s_15,
  s_4_13_18_28_29_35_38,
  s_18,
  s_2,
  s_6,
  s_7,
  s_4_0,
  s_0,
  s_13_0,
  s_6_18,
  s_18,
  s_18,
  s_5_6_15,
  s_15,
  s_18,
  s_20,
  s_4_10_29_32,
  s_18,
  s_0,
  s_2,
  s_18_1,
  s_1,
  s_1,
  s_9,
  s_9,
  s_18,
  s_6_11_19_27_35_38_0,
  s_28,
  s_6,
  s_6,
  s_0,
  s_35_40,
  s_6,
  s_18,
  s_18,
  s_20,
  s_6_18_36,
  s_0,
  s_18,
  s_0,
  s_18,
  s_6,
  s_6,
  s_20,
  s_18,
  s_5,
  s_1,
  s_18,
  s_14,
  s_18,
  s_18,
  s_18,
  s_23,
  s_6_38_41,
  s_6,
  s_10_38_42,
  s_15,
  s_15,
  s_28,
  s_4_6_10_38,
  s_5_6,
  s_0,
  s_6,
  s_4_38,
  s_6,
  s_4,
  s_1,
  s_18,
  s_23,
  s_18_31,
  s_0,
  s_6_18,
  s_18,
  s_6_18,
  s_13,
  s_6_35,
  s_20,
  s_10,
  s_10,
  s_10_11_39,
  s_0,
  s_0,
  s_18,
  s_7_10,
  s_18,
  s_0,
  s_15,
  s_4,
  s_18,
  s_18,
  s_18,
  s_6,
  s_10_18_31_32,
  s_0,
  s_20,
  s_5,
  s_14,
  s_10,
  s_6,
  s_11,
  s_4_38,
  s_12,
  s_0,
  s_26,
  s_1_0,
  s_4,
  s_10_36,
  s_9,
  s_18,
  s_18,
  s_4_6_10_18_26_40_41,
  s_18,
  s_7,
  s_6,
  s_18,
  s_0,
  s_18,
  s_6_18,
  s_18_33,
  s_6,
  s_0,
  s_2,
  s_7,
  s_7_10,
  s_20,
  s_2_0,
  s_4_10_12,
  s_0,
  s_12,
  s_6,
  s_6,
  s_10_18,
  s_20,
  s_18,
  s_18,
  s_4_25_32_35_38_42,
  s_18,
  s_4,
  s_4_6_35_38,
  s_15,
  s_6_10_18,
  s_18,
  s_13,
  s_18,
  s_18,
  s_18,
  s_15,
  s_15,
  s_14_25_35_41_42,
  s_0,
  s_18,
  s_4_6,
  s_4,
  s_6_8_13_25_35_40_42_0,
  s_0,
  s_6,
  s_2,
  s_4_21,
  s_5,
  s_6,
  s_4_7_10_29_32,
  s_6_10_18,
  s_18,
  s_0,
  s_2,
  s_18,
  s_18,
  s_18,
  s_4,
  s_41,
  s_12,
  s_12,
  s_6_11_32_2_0,
  s_18,
  s_4_11_37_38,
  s_0,
  s_0,
  s_0,
  s_10_18,
  s_13,
  s_18,
  s_15,
  s_18,
  s_18,
  s_20,
  s_18,
  s_6_13,
  s_18,
  s_15,
  s_15_17,
  s_5,
  s_18_1,
  s_6,
  s_18,
  s_18,
  s_32,
  s_10_18,
  s_6,
  s_4_38,
  s_4,
  s_10,
  s_10_23_32,
  s_10,
  s_10,
  s_18,
  s_18,
  s_18_23,
  s_11_38,
  s_6_10_21,
  s_10,
  s_4_10,
  s_18,
  s_1,
  s_2,
  s_4_38,
  s_18,
  s_4,
  s_18,
  s_11_33,
  s_18,
  s_0,
  s_7_12,
  s_2,
  s_1,
  s_18,
  s_8,
  s_0,
  s_9_12_37,
  s_18,
  s_0,
  s_2,
  s_12,
  s_0,
  s_2,
  s_12,
  s_0,
  s_2,
  s_12,
  s_4_38,
  s_6,
  s_14,
  s_15,
  s_15,
  s_12,
  s_12,
  s_0,
  s_2,
  s_32_41,
  s_10_11_12,
  s_28,
  s_15,
  s_15,
  s_15_18,
  s_1,
  s_14,
  s_1,
  s_9_14,
  s_6_18,
  s_38,
  s_10_18,
  s_15,
  s_18_31_32_41,
  s_4_7_9_10,
  s_10,
  s_4,
  s_9,
  s_4_7_9_10,
  s_0,
  s_0,
  s_14,
  s_4_14,
  s_1_0,
  s_2,
  s_14,
  s_0,
  s_2,
  s_7_9,
  s_10_18,
  s_4,
  s_6_23_30_41,
  s_8,
  s_23,
  s_6_18,
  s_4_35_41,
  s_18,
  s_4,
  s_4,
  s_20,
  s_20,
  s_20,
  s_18,
  s_18,
  s_15,
  s_7_8_1,
  s_8_13_19_26,
  s_0,
  s_6_18,
  s_7,
  s_0,
  s_4,
  s_6_9,
  s_13_20,
  s_4,
  s_4_6,
  s_6,
  s_13,
  s_18_1,
  s_13_35,
  s_28,
  s_13,
  s_9_13_26_35_36_42,
  s_0,
  s_0,
  s_6,
  s_5,
  s_1,
  s_4_10_11_30_31_33_38_42,
  s_4_6_18,
  s_12,
  s_4,
  s_4_30_38,
  s_6,
  s_0,
  s_20,
  s_20,
  s_5,
  s_4_6_25_26,
  s_11_25_26,
  s_20,
  s_28,
  s_15,
  s_13_20,
  s_18,
  s_20,
  s_20,
  s_18_1,
  s_14_15,
  s_0,
  s_18_0,
  s_20,
  s_20,
  s_6_27_40,
  s_18,
  s_18,
  s_4_13_34_38,
  s_38,
  s_4,
  s_18,
  s_18,
  s_15,
  s_18,
  s_0,
  s_14,
  s_14,
  s_20,
  s_20,
  s_17_18,
  s_0,
  s_28_1,
  s_1,
  s_1,
  s_7_15,
  s_0,
  s_9_14,
  s_1,
  s_2,
  s_18,
  s_0,
  s_18,
  s_14,
  s_18,
  s_18,
  s_18,
  s_0_2,
  s_4_7_14_18,
  s_18,
  s_15_18,
  s_0,
  s_2,
  s_4_9_10,
  s_0,
  s_0,
  s_0,
  s_2,
  s_18,
  s_30_32,
  s_18,
  s_2,
  s_7,
  s_4_25_42,
  s_18_27,
  s_10,
  s_4_15,
  s_4_0,
  s_18,
  s_22,
  s_18_1_0,
  s_7_26,
  s_35,
  s_0,
  s_4_15,
  s_28,
  s_15,
  s_5,
  s_6,
  s_9_10,
  s_9_10,
  s_9_10,
  s_4_9,
  s_18,
  s_0,
  s_13,
  s_27,
  s_15,
  s_14,
  s_18,
  s_10,
  s_6_18,
  s_10,
  s_10,
  s_15,
  s_18_20,
  s_6,
  s_18,
  s_10,
  s_18,
  s_1_0,
  s_6,
  s_6,
  s_20,
  s_13,
  s_18,
  s_15,
  s_13_20,
  s_27,
  s_22,
  s_18,
  s_5,
  s_6,
  s_5_20,
  s_15,
  s_15,
  s_6,
  s_20,
  s_18,
  s_10,
  s_18,
  s_10,
  s_6,
  s_13_20_21,
  s_6_9,
  s_0,
  s_0,
  s_26,
  s_18_20,
  s_6,
  s_18,
  s_15,
  s_18,
  s_18,
  s_26,
  s_10_18,
  s_18,
  s_20,
  s_5,
  s_5,
  s_6,
  s_15,
  s_20,
  s_26,
  s_18,
  s_10,
  s_10,
  s_10,
  s_6,
  s_17,
  s_18,
  s_10_18,
  s_6_18,
  s_15,
  s_15,
  s_15,
  s_18_1,
  s_20,
  s_6,
  s_15,
  s_15,
  s_10_18,
  s_17,
  s_17,
  s_17,
  s_5,
  s_15,
  s_18,
  s_18,
  s_15,
  s_5,
  s_10,
  s_10_18,
  s_18,
  s_10_15_17_18,
  s_15,
  s_18,
  s_1,
  s_6,
  s_6,
  s_27,
  s_20,
  s_27,
  s_27,
  s_27,
  s_17,
  s_6,
  s_23,
  s_10,
  s_20_27,
  s_10,
  s_10,
  s_20,
  s_0,
  s_6,
  s_15,
  s_14,
  s_10_18,
  s_17,
  s_5,
  s_4,
  s_23,
  s_4,
  s_15,
  s_15,
  s_10_18,
  s_10,
  s_10,
  s_18,
  s_18,
  s_11,
  s_15,
  s_10_18,
  s_18,
  s_18,
  s_28,
  s_18,
  s_28,
  s_18,
  s_22,
  s_1,
  s_8,
  s_22,
  s_8,
  s_8,
  s_8,
  s_17,
  s_15,
  s_13,
  s_14,
  s_15,
  s_10_18_1,
  s_18,
  s_10_18,
  s_18,
  s_6,
  s_0,
  s_0_1,
  s_22,
  s_22,
  s_15,
  s_18_1,
  s_10,
  s_20,
  s_1,
  s_6,
  s_4,
  s_15,
  s_15,
  s_15,
  s_15,
  s_5,
  s_5,
  s_17,
  s_5,
  s_11_26,
  s_15,
  s_18,
  s_15,
  s_18,
  s_20_27,
  s_20,
  s_13,
  s_13,
  s_6,
  s_20,
  s_6_38,
  s_4_35,
  s_0,
  s_10_15_18,
  s_10_15_18,
  s_15,
  s_18_1,
  s_15,
  s_15_18,
  s_6,
  s_23,
  s_17,
  s_5,
  s_18,
  s_18,
  s_18,
  s_18,
  s_13,
  s_18,
  s_10_14_18,
  s_10_1,
  s_15,
  s_13,
  s_6_8_25_38,
  s_6,
  s_44,
  s_6,
  s_10_37_0,
  s_2,
  s_7_9_12,
  s_6_21_30_31_32_34_35_40_41_42,
  s_18,
  s_4,
  s_6,
  s_5,
  s_6,
  s_6,
  s_6,
  s_6_23,
  s_23,
  s_8,
  s_10_18,
  s_18,
  s_15,
  s_18,
  s_18,
  s_18,
  s_26,
  s_5,
  s_5_18,
  s_20,
  s_18,
  s_18,
  s_26,
  s_18_23,
  s_6,
  s_0,
  s_9,
  s_20,
  s_27,
  s_27,
  s_18,
  s_18,
  s_18,
  s_20,
  s_15_18,
  s_20,
  s_6_41,
  s_18,
  s_15,
  s_10,
  s_4,
  s_22,
  s_9,
  s_15_18,
  s_20,
  s_10,
  s_18,
  s_15,
  s_15,
  s_18_1,
  s_5,
  s_18,
  s_18,
  s_6,
  s_18,
  s_0,
  s_10,
  s_26,
  s_26,
  s_27,
  s_22,
  s_30,
  s_22,
  s_30,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_27,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_4,
  s_26,
  s_6,
  s_4,
  s_26,
  s_4,
  s_6,
  s_15,
  s_15,
  s_6,
  s_6,
  s_18,
  s_26,
  s_26,
  s_6_18_40,
  s_9_20,
  s_26,
  s_27,
  s_27,
  s_27,
  s_18,
  s_10,
  s_10,
  s_18,
  s_5,
  s_6,
  s_6,
  s_6,
  s_13,
  s_20,
  s_13_20,
  s_26,
  s_26,
  s_27,
  s_27,
  s_26,
  s_26,
  s_6,
  s_6,
  s_27,
  s_26,
  s_27,
  s_18,
  s_6_17_23,
  s_6,
  s_23,
  s_10,
  s_20,
  s_6_7_9_10_15_17_18_20_23_30_31_35_40_0,
  s_6,
  s_18,
  s_10,
  s_0,
  s_6,
  s_0,
  s_18,
  s_18_1,
  s_9,
  s_9_10_30_32,
  s_6,
  s_6_9,
  s_4,
  s_14,
  s_15,
  s_18,
  s_18,
  s_6,
  s_6,
  s_6_0,
  s_6,
  s_18,
  s_18,
  s_10_18,
  s_10_18,
  s_14,
  s_18,
  s_19,
  s_10,
  s_6_18,
  s_4_15,
  s_10_18,
  s_15,
  s_15,
  s_15,
  s_6,
  s_20,
  s_18,
  s_18,
  s_20,
  s_10,
  s_6,
  s_15,
  s_10_18,
  s_10_18,
  s_10,
  s_10,
  s_10_18,
  s_18,
  s_23,
  s_10,
  s_18,
  s_10,
  s_18,
  s_6,
  s_28,
  s_20,
  s_5,
  s_23,
  s_32,
  s_6_13,
  s_14,
  s_18,
  s_26,
  s_23,
  s_23,
  s_23,
  s_32,
  s_18,
  s_41,
  s_10,
  s_18,
  s_4_9_10_11_12_32_33_34_35_38,
  s_10_18,
  s_21,
  s_18,
  s_4,
  s_4_11_28,
  s_13,
  s_6,
  s_6,
  s_5_18_27_32,
  s_18,
  s_18,
  s_18,
  s_35,
  s_18,
  s_18,
  s_4,
  s_8,
  s_27,
  s_18,
  s_27,
  s_27,
  s_18,
  s_15,
  s_15,
  s_20,
  s_18,
  s_15,
  s_5,
  s_23,
  s_6,
  s_17,
  s_10_18,
  s_10_18,
  s_4_5_30_34_35_37_39_41_42,
  s_0,
  s_5,
  s_5_9_18_26,
  s_5,
  s_4_11_21_0,
  s_2,
  s_18,
  s_6,
  s_23,
  s_23,
  s_23,
  s_23,
  s_28,
  s_23,
  s_28,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_18,
  s_6,
  s_26,
  s_15,
  s_27,
  s_6,
  s_14_18_0,
  s_23,
  s_9,
  s_9,
  s_1,
  s_2,
  s_9,
  s_27,
  s_17,
  s_9_0,
  s_2,
  s_14,
  s_18,
  s_18,
  s_0,
  s_12,
  s_37_43,
  s_0,
  s_7,
  s_4_27,
  s_2_0,
  s_4_7,
  s_14_0,
  s_5,
  s_9,
  s_6,
  s_9,
  s_4,
  s_9,
  s_9,
  s_1,
  s_2,
  s_9,
  s_1_0,
  s_9,
  s_8,
  s_6,
  s_26,
  s_14,
  s_6_18_26,
  s_5,
  s_6,
  s_20,
  s_14_15_26,
  s_5_13,
  s_5,
  s_5,
  s_0,
  s_0,
  s_18,
  s_6_18,
  s_26,
  s_5,
  s_15,
  s_15,
  s_20,
  s_27,
  s_9_18_25_26_30_35,
  s_5,
  s_0,
  s_20_27,
  s_5,
  s_5,
  s_18,
  s_14,
  s_15,
  s_24,
  s_18,
  s_18,
  s_18,
  s_10,
  s_6,
  s_10_18,
  s_4_23_28_29,
  s_18,
  s_1,
  s_13,
  s_18,
  s_18,
  s_10_15_18,
  s_15,
  s_15,
  s_10_15_18,
  s_15,
  s_15,
  s_15,
  s_6,
  s_20,
  s_15,
  s_6,
  s_13,
  s_6,
  s_18,
  s_15,
  s_13,
  s_28,
  s_11,
  s_11,
  s_4_13_35,
  s_8_18,
  s_17,
  s_4,
  s_18,
  s_15,
  s_10,
  s_5_6_40,
  s_15,
  s_13_20,
  s_6,
  s_6,
  s_18,
  s_6,
  s_6,
  s_5_6_21_38_40,
  s_13_20,
  s_14,
  s_6,
  s_0,
  s_4,
  s_5_29,
  s_0,
  s_5,
  s_20,
  s_5_21,
  s_20,
  s_17,
  s_5_13_18_20,
  s_14,
  s_15,
  s_17,
  s_14,
  s_18,
  s_18,
  s_14,
  s_6,
  s_6,
  s_5,
  s_18,
  s_27,
  s_18,
  s_18,
  s_16,
  s_18,
  s_23,
  s_18,
  s_18,
  s_18,
  s_4_15,
  s_18,
  s_27,
  s_18,
  s_14,
  s_18,
  s_18,
  s_6,
  s_15,
  s_9,
  s_18,
  s_0,
  s_13,
  s_35,
  s_6,
  s_20,
  s_6_18,
  s_4,
  s_0,
  s_2,
  s_20,
  s_20,
  s_35,
  s_5_6_8,
  s_8_33,
  s_4_35,
  s_6_18,
  s_4,
  s_8,
  s_11_39,
  s_14,
  s_14,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_25_35,
  s_0,
  s_6_18_41,
  s_14,
  s_20,
  s_9,
  s_0,
  s_20,
  s_13,
  s_6_35_36,
  s_0,
  s_18,
  s_4_6,
  s_6,
  s_6,
  s_6_25,
  s_0,
  s_6,
  s_0,
  s_0,
  s_6,
  s_6,
  s_4_9_11_32_35_39,
  s_6_0,
  s_4_0,
  s_6_8_18,
  s_11,
  s_6,
  s_4_18_0,
  s_13,
  s_17,
  s_15,
  s_5_6_7_14_25_27_28_35_36,
  s_20,
  s_27,
  s_0,
  s_7,
  s_0,
  s_6,
  s_9_31_35,
  s_0,
  s_18,
  s_9_0,
  s_2,
  s_9,
  s_3,
  s_7,
  s_0,
  s_7,
  s_0,
  s_18,
  s_15,
  s_8_35,
  s_4,
  s_4,
  s_18,
  s_4,
  s_6,
  s_6,
  s_18,
  s_5,
  s_10,
  s_10_18,
  s_5,
  s_15,
  s_15,
  s_23,
  s_5,
  s_18,
  s_20,
  s_5_17,
  s_20,
  s_18,
  s_5,
  s_6,
  s_20,
  s_13_20,
  s_10,
  s_14,
  s_14_1,
  s_10_20,
  s_18,
  s_10,
  s_15,
  s_14,
  s_18,
  s_20,
  s_15,
  s_15,
  s_10_18,
  s_5,
  s_15,
  s_18,
  s_10,
  s_20,
  s_18,
  s_18,
  s_10,
  s_5,
  s_18,
  s_5,
  s_0,
  s_0,
  s_18,
  s_23,
  s_23,
  s_23,
  s_17,
  s_17,
  s_23,
  s_10,
  s_1,
  s_18,
  s_18,
  s_18,
  s_15,
  s_10,
  s_18,
  s_15,
  s_10_18_1,
  s_15,
  s_23,
  s_18,
  s_23,
  s_18,
  s_18,
  s_13_0,
  s_15,
  s_20,
  s_10_18,
  s_10_18,
  s_6,
  s_6,
  s_10,
  s_10_32,
  s_5,
  s_13,
  s_18,
  s_15,
  s_15,
  s_15,
  s_20,
  s_10_32_38,
  s_28,
  s_6_15,
  s_27,
  s_5,
  s_15,
  s_15,
  s_15,
  s_15,
  s_15,
  s_18,
  s_26,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6,
  s_20,
  s_5,
  s_6,
  s_18,
  s_9,
  s_15,
  s_18,
  s_23,
  s_23,
  s_18,
  s_23,
  s_18,
  s_18,
  s_20,
  s_18,
  s_6,
  s_18,
  s_5,
  s_27,
  s_18,
  s_15,
  s_18,
  s_10,
  s_10,
  s_5,
  s_20,
  s_17,
  s_18,
  s_10_18,
  s_18,
  s_17,
  s_10,
  s_10,
  s_15,
  s_15,
  s_13,
  s_13,
  s_13_20,
  s_17,
  s_27,
  s_14,
  s_17,
  s_20,
  s_20,
  s_20,
  s_18,
  s_10_1,
  s_6_15,
  s_18,
  s_19,
  s_20,
  s_20,
  s_15,
  s_6,
  s_26,
  s_23,
  s_10,
  s_10_18,
  s_20,
  s_18,
  s_5,
  s_10,
  s_15,
  s_18_1,
  s_18,
  s_13,
  s_10_18_32,
  s_10,
  s_23,
  s_23,
  s_4_15,
  s_10_18,
  s_15,
  s_15,
  s_15,
  s_18,
  s_4_23,
  s_4,
  s_26,
  s_20,
  s_10,
  s_27,
  s_27,
  s_23,
  s_18,
  s_6,
  s_6,
  s_6,
  s_15,
  s_5,
  s_26,
  s_5,
  s_0,
  s_15,
  s_1,
  s_15,
  s_15,
  s_6,
  s_6,
  s_18,
  s_10,
  s_20_27,
  s_10_27_31_32_35,
  s_0,
  s_0,
  s_6,
  s_10_1,
  s_32,
  s_32,
  s_20,
  s_0,
  s_0,
  s_10,
  s_8,
  s_20,
  s_14,
  s_4_14_26_29_41,
  s_6_15,
  s_0,
  s_18,
  s_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_4_14_26_29_41,
  s_0,
  s_18,
  s_0,
  s_18,
  s_0,
  s_15,
  s_5,
  s_8,
  s_18,
  s_20,
  s_6_8,
  s_0,
  s_1_0,
  s_26,
  s_5,
  s_5,
  s_5,
  s_27,
  s_20,
  s_6_30_35_36,
  s_20,
  s_0,
  s_0,
  s_20,
  s_18,
  s_35_37_0,
  s_0,
  s_4_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_1,
  s_5,
  s_20,
  s_6,
  s_18,
  s_18,
  s_5,
  s_1,
  s_22,
  s_27,
  s_1,
  s_0,
  s_4_6_13,
  s_0,
  s_26_42,
  s_0,
  s_2,
  s_18,
  s_0,
  s_0,
  s_0,
  s_15,
  s_18,
  s_0,
  s_2,
  s_10,
  s_10,
  s_6_27_36,
  s_6,
  s_1,
  s_22,
  s_27,
  s_1,
  s_4,
  s_27,
  s_27,
  s_20,
  s_27,
  s_27_34,
  s_0,
  s_4_22_28,
  s_8_1,
  s_1,
  s_27,
  s_5,
  s_5,
  s_5,
  s_27,
  s_27,
  s_1,
  s_5,
  s_27,
  s_26,
  s_20,
  s_6,
  s_6,
  s_1,
  s_0,
  s_18,
  s_20,
  s_6_11_26_30,
  s_18,
  s_35,
  s_35_0,
  s_0,
  s_10,
  s_6,
  s_10,
  s_6_35,
  s_17,
  s_18,
  s_5,
  s_5,
  s_5,
  s_13,
  s_5,
  s_0,
  s_7,
  s_18,
  s_10,
  s_20,
  s_18,
  s_27,
  s_27,
  s_15_18,
  s_18,
  s_18,
  s_18,
  s_4_6_28_35_38_41,
  s_6,
  s_20,
  s_20,
  s_6,
  s_20,
  s_6_13,
  s_6,
  s_20,
  s_18_0,
  s_18,
  s_27,
  s_5,
  s_21,
  s_5,
  s_5,
  s_5,
  s_17,
  s_26,
  s_5,
  s_5,
  s_15,
  s_5,
  s_5,
  s_17,
  s_20,
  s_17,
  s_10,
  s_11,
  s_15,
  s_10,
  s_0,
  s_30,
  s_30,
  s_0,
  s_15,
  s_18,
  s_14,
  s_18,
  s_17_27,
  s_17,
  s_15,
  s_17,
  s_17,
  s_23,
  s_18,
  s_18,
  s_10,
  s_10_26,
  s_6,
  s_42,
  s_4_35_38,
  s_5_18,
  s_9,
  s_18,
  s_18,
  s_18_1,
  s_9,
  s_6,
  s_5_13_18_29,
  s_32_35,
  s_32_35,
  s_13,
  s_8_10,
  s_26,
  s_7,
  s_0,
  s_18_23,
  s_20,
  s_5,
  s_20,
  s_5,
  s_0,
  s_6,
  s_27,
  s_6_18_29_0,
  s_10,
  s_6_8_20,
  s_5_0,
  s_5,
  s_5,
  s_2,
  s_26,
  s_10_32_37,
  s_0,
  s_2,
  s_4_10,
  s_10,
  s_0,
  s_18,
  s_0,
  s_18,
  s_20,
  s_8,
  s_0,
  s_0,
  s_5,
  s_5,
  s_5,
  s_6_35_36,
  s_4_6,
  s_18,
  s_4,
  s_26,
  s_6,
  s_20,
  s_6,
  s_28,
  s_28,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_27,
  s_6,
  s_19,
  s_18,
  s_0,
  s_10_32,
  s_18,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_5,
  s_5,
  s_6,
  s_6_15,
  s_0,
  s_15,
  s_14_15,
  s_18_1,
  s_6_35_38,
  s_5,
  s_0,
  s_18,
  s_0,
  s_18,
  s_4,
  s_6,
  s_5,
  s_20,
  s_15,
  s_15,
  s_0,
  s_0,
  s_4_14_15_17_18_21_26_30_38_40,
  s_6_18,
  s_0,
  s_6_15,
  s_4_17,
  s_17,
  s_18,
  s_18,
  s_21,
  s_4_6,
  s_18,
  s_4_10,
  s_0,
  s_6,
  s_0,
  s_18,
  s_18,
  s_0,
  s_18,
  s_8_10_11_15,
  s_17,
  s_18,
  s_18,
  s_6,
  s_6_9_15_36,
  s_0,
  s_18,
  s_4_6,
  s_18,
  s_6,
  s_11,
  s_11,
  s_10,
  s_10,
  s_18,
  s_18,
  s_2,
  s_2,
  s_6,
  s_18,
  s_27,
  s_18,
  s_18,
  s_18_23,
  s_18,
  s_18,
  s_5_13,
  s_13,
  s_20,
  s_20,
  s_4,
  s_28_2,
  s_18,
  s_9_10,
  s_0,
  s_2,
  s_29_30_37,
  s_18,
  s_7_12_19,
  s_0,
  s_2,
  s_5,
  s_6,
  s_1,
  s_5,
  s_5,
  s_0,
  s_7,
  s_0,
  s_6_27,
  s_6,
  s_13,
  s_13,
  s_13,
  s_13,
  s_15,
  s_27,
  s_20,
  s_6,
  s_5,
  s_27,
  s_27,
  s_27,
  s_5,
  s_5,
  s_27,
  s_8,
  s_6,
  s_15,
  s_10_18_1,
  s_18,
  s_15,
  s_18_1,
  s_4_6_8_26_30_34_35_39_42,
  s_26,
  s_6,
  s_4,
  s_4,
  s_6,
  s_5,
  s_6,
  s_23,
  s_0,
  s_18,
  s_18_1,
  s_35,
  s_4,
  s_18,
  s_30,
  s_18,
  s_5_27,
  s_18,
  s_15,
  s_20,
  s_10_18,
  s_5_6_8,
  s_10,
  s_6,
  s_10,
  s_15,
  s_18,
  s_20,
  s_4_28_29_30_38_40,
  s_0,
  s_4,
  s_6,
  s_9,
  s_1_0,
  s_5,
  s_15,
  s_6_0,
  s_18,
  s_18,
  s_7,
  s_4,
  s_20,
  s_13_32_36,
  s_6_13,
  s_20,
  s_20,
  s_18,
  s_15,
  s_7_0_2,
  s_2,
  s_5,
  s_7_9,
  s_0,
  s_7_21,
  s_7_21,
  s_10_0,
  s_0,
  s_0,
  s_10_2_0,
  s_5_23,
  s_6,
  s_5,
  s_5,
  s_5,
  s_6,
  s_20,
  s_4_5_38,
  s_20,
  s_31,
  s_27,
  s_6,
  s_18,
  s_20,
  s_35,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_1_0,
  s_27,
  s_1,
  s_4,
  s_4,
  s_26,
  s_1,
  s_26,
  s_8,
  s_6,
  s_26,
  s_26,
  s_26,
  s_8,
  s_13,
  s_13,
  s_18,
  s_15_18,
  s_17,
  s_0,
  s_2,
  s_12,
  s_4,
  s_6,
  s_4_6_8_35_38,
  s_18,
  s_4_6_0,
  s_23,
  s_4,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_18,
  s_15,
  s_18,
  s_7_12_26,
  s_6_18_35,
  s_4_6_11_23_24_28_42_0_2,
  s_6,
  s_20,
  s_0,
  s_2,
  s_7,
  s_2,
  s_20,
  s_8,
  s_15_27,
  s_20,
  s_6_35,
  s_6,
  s_6,
  s_6,
  s_0_2,
  s_18,
  s_6_0,
  s_2,
  s_26_28,
  s_7,
  s_0,
  s_0_2,
  s_4_0,
  s_9,
  s_7_9,
  s_9,
  s_38,
  s_2,
  s_15,
  s_27,
  s_5,
  s_10_0,
  s_6_27,
  s_6,
  s_6,
  s_6,
  s_17_18_26_29_30_35,
  s_1,
  s_6,
  s_20,
  s_20,
  s_5,
  s_5,
  s_10_18_1,
  s_5,
  s_1,
  s_10,
  s_30_32,
  s_10,
  s_18,
  s_30_32,
  s_18_1,
  s_0,
  s_7_15_26,
  s_1,
  s_18_0,
  s_15,
  s_13,
  s_18,
  s_4,
  s_6,
  s_18,
  s_5,
  s_23,
  s_13,
  s_27,
  s_24_0,
  s_2,
  s_6_9,
  s_0,
  s_0,
  s_6,
  s_15,
  s_10_18_1,
  s_32,
  s_7,
  s_0,
  s_7,
  s_2,
  s_6,
  s_18,
  s_0,
  s_18,
  s_17,
  s_10_29,
  s_0,
  s_2,
  s_11_18,
  s_0,
  s_2,
  s_18,
  s_4_10,
  s_18,
  s_20,
  s_5,
  s_4_6_30_35_41,
  s_6,
  s_4,
  s_6,
  s_30_35,
  s_6,
  s_4,
  s_18,
  s_6,
  s_6,
  s_18,
  s_18,
  s_20,
  s_17,
  s_18_0,
  s_6_18_20,
  s_0,
  s_0,
  s_10_26,
  s_20,
  s_18,
  s_18,
  s_20,
  s_15,
  s_6,
  s_27,
  s_6,
  s_4,
  s_6,
  s_6,
  s_6,
  s_6,
  s_20,
  s_20,
  s_4,
  s_6,
  s_29_30,
  s_7_20_0,
  s_5_6_18,
  s_40_0,
  s_2,
  s_4_7,
  s_18,
  s_4_9_10_14,
  s_18,
  s_6,
  s_0,
  s_2,
  s_7,
  s_18,
  s_0,
  s_2,
  s_7_26,
  s_18,
  s_4,
  s_18,
  s_15,
  s_15_18,
  s_27,
  s_10,
  s_4,
  s_15,
  s_18,
  s_20,
  s_0,
  s_4_22,
  s_6_0,
  s_7_26,
  s_2,
  s_7_26,
  s_10_35_36_40_0,
  s_18,
  s_6,
  s_5_6_9_15_35,
  s_0,
  s_6,
  s_20,
  s_22,
  s_18,
  s_4,
  s_4_9,
  s_4,
  s_18,
  s_4,
  s_18,
  s_6,
  s_6,
  s_6,
  s_18,
  s_41,
  s_2,
  s_4_7,
  s_15,
  s_27,
  s_7,
  s_0,
  s_18,
  s_18,
  s_6,
  s_9,
  s_27,
  s_15_23,
  s_22_30_38,
  s_22,
  s_18,
  s_4_6_7_9_10_15_18_23_25_27_32_36_38_41_42,
  s_18,
  s_0,
  s_1_0,
  s_6_18,
  s_14,
  s_4_9_14_26,
  s_4_6_0,
  s_0,
  s_20,
  s_20,
  s_6_10_20_29_38_39,
  s_20,
  s_0,
  s_5,
  s_22,
  s_0,
  s_8_10_20,
  s_0,
  s_20,
  s_0,
  s_14_23_30,
  s_10_11_17_22_26_30_32,
  s_11,
  s_18,
  s_18,
  s_26,
  s_0,
  s_0,
  s_0,
  s_7_31_35_38_42_0,
  s_18,
  s_4,
  s_4_7_9_12_0,
  s_7,
  s_4_7_11_30_38,
  s_18,
  s_4_30_38,
  s_4,
  s_18,
  s_31_32,
  s_0,
  s_2,
  s_9,
  s_18,
  s_9,
  s_18,
  s_10_21_28_40_41,
  s_0,
  s_21,
  s_18,
  s_4_6_23_35,
  s_9_0_2,
  s_2,
  s_2,
  s_27_35,
  s_5,
  s_0,
  s_6,
  s_5,
  s_5,
  s_5,
  s_20,
  s_0,
  s_18,
  s_20,
  s_6,
  s_0,
  s_4_10_28_30_31_38_40_41_42,
  s_0,
  s_9_27_38,
  s_0,
  s_9_27,
  s_18,
  s_4,
  s_18_1,
  s_15,
  s_23,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_20,
  s_27,
  s_18,
  s_0,
  s_12,
  s_4,
  s_5,
  s_27,
  s_6,
  s_27,
  s_18,
  s_4_10_32,
  s_18,
  s_4,
  s_4,
  s_20,
  s_6,
  s_18,
  s_18,
  s_10,
  s_6,
  s_17,
  s_18,
  s_6_21,
  s_20,
  s_15_18_0,
  s_5_18_29,
  s_13,
  s_0,
  s_15,
  s_13_20,
  s_7_10_39,
  s_0,
  s_0,
  s_17,
  s_18,
  s_15_24_0_2,
  s_7_22,
  s_6,
  s_4_6_8_14_15_0_2,
  s_4_6,
  s_18,
  s_0,
  s_9,
  s_18_0,
  s_0,
  s_24_0,
  s_13,
  s_18,
  s_4_6_8_13_25,
  s_21,
  s_0_1,
  s_10,
  s_4,
  s_41,
  s_9,
  s_7,
  s_4,
  s_41,
  s_2,
  s_18,
  s_18,
  s_4,
  s_4_14,
  s_0_2,
  s_10,
  s_0,
  s_18_21,
  s_4,
  s_7,
  s_0,
  s_6,
  s_0,
  s_6,
  s_7,
  s_0,
  s_2,
  s_6,
  s_14_0,
  s_18,
  s_5,
  s_18,
  s_41,
  s_4,
  s_4_10,
  s_1,
  s_2,
  s_18,
  s_4,
  s_14,
  s_7,
  s_30_32_41_0,
  s_2,
  s_4,
  s_41,
  s_41,
  s_41,
  s_41,
  s_0,
  s_0,
  s_6,
  s_7,
  s_13_20,
  s_20,
  s_1,
  s_18,
  s_6,
  s_18,
  s_1,
  s_18,
  s_1,
  s_15,
  s_15,
  s_15,
  s_18,
  s_26,
  s_26,
  s_5,
  s_5,
  s_20,
  s_5,
  s_15,
  s_5,
  s_26,
  s_26,
  s_6,
  s_4_28,
  s_0,
  s_7,
  s_2_0,
  s_10,
  s_10,
  s_20,
  s_20,
  s_23,
  s_13,
  s_6,
  s_20,
  s_18,
  s_20,
  s_10_20,
  s_5,
  s_18,
  s_5,
  s_20,
  s_20,
  s_25,
  s_8,
  s_15,
  s_6_7_9_13_20,
  s_13,
  s_20_27,
  s_0,
  s_20,
  s_0,
  s_23,
  s_5,
  s_5,
  s_5,
  s_17,
  s_18,
  s_40_42,
  s_0,
  s_18,
  s_4,
  s_18,
  s_6_7,
  s_30,
  s_0,
  s_4,
  s_2,
  s_7,
  s_0_2,
  s_0_2,
  s_0,
  s_4_7,
  s_4_7,
  s_0,
  s_2,
  s_37,
  s_18,
  s_15,
  s_9,
  s_6_0,
  s_7,
  s_20,
  s_18,
  s_6_8_10_20,
  s_6,
  s_18,
  s_28,
  s_1,
  s_28,
  s_15,
  s_20,
  s_0,
  s_20,
  s_0,
  s_0,
  s_0,
  s_0,
  s_8,
  s_13_20,
  s_20,
  s_20,
  s_0,
  s_2_0,
  s_15_17_18,
  s_15,
  s_18,
  s_1,
  s_18,
  s_5,
  s_5,
  s_23,
  s_18,
  s_1,
  s_20,
  s_18,
  s_5,
  s_20,
  s_20,
  s_20,
  s_5_27,
  s_20,
  s_5,
  s_15,
  s_6,
  s_6,
  s_5,
  s_4,
  s_5,
  s_20,
  s_18,
  s_20,
  s_20,
  s_20,
  s_5,
  s_27,
  s_5,
  s_20,
  s_20,
  s_27,
  s_27,
  s_26,
  s_5,
  s_5,
  s_18,
  s_18,
  s_9,
  s_5,
  s_9,
  s_5,
  s_0,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_0,
  s_26,
  s_1,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_8,
  s_26,
  s_17_23,
  s_20,
  s_5,
  s_0,
  s_0,
  s_0,
  s_0,
  s_5,
  s_26,
  s_0,
  s_20,
  s_22,
  s_5,
  s_5,
  s_5_17,
  s_18,
  s_7,
  s_18,
  s_18,
  s_5,
  s_18_0,
  s_4,
  s_15,
  s_6,
  s_26,
  s_15,
  s_20,
  s_20,
  s_0_2,
  s_18,
  s_30,
  s_0,
  s_11,
  s_18,
  s_0,
  s_18,
  s_4_10,
  s_18,
  s_15,
  s_4_14_30_32_40_41,
  s_18,
  s_12,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7_26,
  s_17,
  s_18,
  s_10_18_36_40,
  s_10,
  s_0,
  s_18,
  s_10,
  s_10,
  s_18,
  s_10,
  s_9,
  s_21,
  s_10,
  s_13_20_21,
  s_28,
  s_23,
  s_20,
  s_26,
  s_20,
  s_20,
  s_27,
  s_5,
  s_8,
  s_26,
  s_5,
  s_5,
  s_20,
  s_26,
  s_26,
  s_8,
  s_20,
  s_4,
  s_4,
  s_26,
  s_26,
  s_6,
  s_8,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_8,
  s_4,
  s_18,
  s_23,
  s_6,
  s_15_27_38,
  s_19,
  s_18_1,
  s_8,
  s_6_14,
  s_6_7_9_26_30_32_33_35_36_0,
  s_18,
  s_0,
  s_4,
  s_18,
  s_6_35,
  s_4_7_19_40,
  s_4,
  s_5,
  s_18,
  s_18,
  s_9,
  s_6,
  s_20,
  s_38,
  s_4_11_19,
  s_18,
  s_1,
  s_10,
  s_6,
  s_7_12,
  s_27,
  s_0,
  s_11,
  s_0,
  s_27,
  s_4_21_33_40,
  s_0,
  s_2,
  s_7,
  s_18,
  s_20,
  s_15,
  s_10,
  s_1,
  s_22,
  s_32,
  s_1,
  s_22,
  s_32,
  s_1,
  s_2,
  s_18,
  s_1,
  s_1,
  s_4,
  s_18,
  s_9,
  s_9_10,
  s_1,
  s_9,
  s_4_15,
  s_9,
  s_15,
  s_20,
  s_15,
  s_20,
  s_4,
  s_6,
  s_26,
  s_5_15,
  s_17,
  s_21,
  s_7_26,
  s_0,
  s_32,
  s_10_26,
  s_17,
  s_20,
  s_14,
  s_18,
  s_20,
  s_4_13,
  s_18,
  s_18,
  s_10_32,
  s_18,
  s_0,
  s_0,
  s_18_0,
  s_4,
  s_41,
  s_9,
  s_18,
  s_0,
  s_7_9,
  s_4,
  s_41,
  s_2,
  s_7_9,
  s_36_41,
  s_0,
  s_4,
  s_18,
  s_15,
  s_18_1,
  s_18,
  s_9,
  s_18_0,
  s_4_26_28,
  s_1,
  s_0,
  s_12,
  s_20,
  s_15_17_18,
  s_18,
  s_4,
  s_6_14,
  s_38_42,
  s_22,
  s_18,
  s_10,
  s_15,
  s_6,
  s_6,
  s_15,
  s_18_1,
  s_10_26_41,
  s_0,
  s_4_10_26_41,
  s_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_2,
  s_4_7,
  s_5,
  s_13_20,
  s_20_26,
  s_20,
  s_20,
  s_6,
  s_13,
  s_18,
  s_0,
  s_2,
  s_7,
  s_4_17_31_34_35,
  s_0,
  s_4_11,
  s_13_20,
  s_6_8,
  s_6,
  s_0,
  s_0,
  s_6,
  s_6,
  s_10_15_18_32_35_38_42,
  s_13,
  s_15,
  s_18_1,
  s_10,
  s_13,
  s_2,
  s_15_18_0,
  s_18,
  s_8_21,
  s_1,
  s_15,
  s_15,
  s_4,
  s_4,
  s_18,
  s_3_7_9_10_16_18_19_26_28,
  s_7_8,
  s_6,
  s_18,
  s_30,
  s_0,
  s_2,
  s_7_26,
  s_0,
  s_6_9_25,
  s_0,
  s_18,
  s_6_18,
  s_4,
  s_0,
  s_28,
  s_7,
  s_28,
  s_4,
  s_4,
  s_4_6_11_19_29_30_32_35_38_40_42,
  s_0,
  s_18,
  s_6,
  s_18,
  s_11,
  s_6_8,
  s_6,
  s_27,
  s_29_30_35,
  s_4,
  s_4_6_10,
  s_5,
  s_6_7_9_10_15_16_18_19_26_30_34_38_40_43_0_2,
  s_6,
  s_0,
  s_30_32_35_37,
  s_4_11,
  s_6_27_38,
  s_4_21,
  s_18,
  s_0,
  s_7_26,
  s_0,
  s_12,
  s_6,
  s_4_6_26,
  s_0,
  s_26,
  s_2,
  s_7_12,
  s_11_19,
  s_0,
  s_6,
  s_0,
  s_2,
  s_7_12,
  s_18_0,
  s_20,
  s_23,
  s_0,
  s_30,
  s_27,
  s_27,
  s_20,
  s_20,
  s_20,
  s_20,
  s_15,
  s_20,
  s_0,
  s_0,
  s_0,
  s_9_31_37_0,
  s_0,
  s_0,
  s_7,
  s_7,
  s_0_2,
  s_31,
  s_6_7,
  s_4,
  s_2,
  s_12,
  s_23,
  s_20_0,
  s_23,
  s_20,
  s_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_20,
  s_18,
  s_15,
  s_18,
  s_9,
  s_18_1_0,
  s_6,
  s_15,
  s_7_32,
  s_0,
  s_20,
  s_20,
  s_15,
  s_5,
  s_1,
  s_1,
  s_17,
  s_5,
  s_5,
  s_6_8_15_20,
  s_0,
  s_6_29_35_0,
  s_6,
  s_1,
  s_0,
  s_9_26,
  s_13,
  s_8,
  s_13_20_27_35_38,
  s_13,
  s_15,
  s_6,
  s_6_26,
  s_9,
  s_5,
  s_10_15,
  s_27,
  s_27,
  s_18,
  s_5,
  s_7_15_23_28_30_32,
  s_4_7_9_23_28,
  s_6_0,
  s_2,
  s_6,
  s_24_0,
  s_0,
  s_7,
  s_36,
  s_18,
  s_6,
  s_20,
  s_5,
  s_5,
  s_1,
  s_2,
  s_18,
  s_9,
  s_15,
  s_6,
  s_27,
  s_27,
  s_20,
  s_5,
  s_15,
  s_6,
  s_4_38_0,
  s_13,
  s_18,
  s_5_13,
  s_0,
  s_7,
  s_2,
  s_26,
  s_5,
  s_2,
  s_7,
  s_17,
  s_5,
  s_5,
  s_18,
  s_6,
  s_20,
  s_21_23,
  s_27,
  s_20,
  s_20,
  s_6_9,
  s_6,
  s_5_15_18,
  s_1,
  s_1,
  s_15,
  s_6,
  s_18,
  s_27,
  s_18,
  s_20,
  s_20,
  s_15,
  s_20,
  s_18,
  s_4,
  s_4_6_9_10_14_15_19_21_23_25_30_35_42,
  s_7_14_21_23_24,
  s_0,
  s_2,
  s_8_9,
  s_0,
  s_30,
  s_7,
  s_30,
  s_2,
  s_4_15,
  s_4_18,
  s_6,
  s_0,
  s_0,
  s_4_18,
  s_14,
  s_6_27,
  s_18,
  s_4_6,
  s_18,
  s_10_14,
  s_5_20,
  s_10,
  s_20,
  s_5_13,
  s_20,
  s_38_42,
  s_18,
  s_6,
  s_4,
  s_2,
  s_10,
  s_13_20,
  s_8,
  s_10_1,
  s_2,
  s_10,
  s_13,
  s_13,
  s_13,
  s_18,
  s_1,
  s_2,
  s_9,
  s_0,
  s_6,
  s_8,
  s_4_6,
  s_6_10_23_24_25_26_31_35_42,
  s_4_6_7_24,
  s_18,
  s_0,
  s_18,
  s_6,
  s_18,
  s_6,
  s_20,
  s_1,
  s_18,
  s_1,
  s_5,
  s_27,
  s_6,
  s_27,
  s_6,
  s_27,
  s_6,
  s_6_27,
  s_6,
  s_5,
  s_20,
  s_27,
  s_10,
  s_15,
  s_5,
  s_5_15_18,
  s_5,
  s_5,
  s_5,
  s_0,
  s_41,
  s_41,
  s_5,
  s_5,
  s_8,
  s_5_6_8_10_20,
  s_26,
  s_5,
  s_5,
  s_5_20,
  s_27,
  s_18,
  s_4,
  s_26,
  s_20,
  s_27,
  s_26,
  s_27,
  s_26,
  s_26,
  s_6,
  s_5,
  s_0,
  s_0,
  s_18,
  s_26,
  s_10,
  s_27,
  s_26,
  s_26,
  s_26,
  s_26,
  s_0,
  s_27,
  s_26,
  s_5,
  s_8,
  s_4,
  s_0,
  s_5,
  s_0,
  s_18,
  s_5,
  s_5,
  s_18,
  s_31,
  s_4,
  s_18,
  s_6_29_36,
  s_6,
  s_22,
  s_0,
  s_0,
  s_30_43,
  s_0,
  s_13,
  s_10_26_27_0,
  s_20,
  s_35_40,
  s_4,
  s_18,
  s_30,
  s_6,
  s_7_26,
  s_30_40,
  s_6,
  s_7_26,
  s_0,
  s_0,
  s_30,
  s_13_27,
  s_13_20,
  s_18,
  s_23,
  s_20,
  s_20,
  s_15,
  s_15,
  s_6,
  s_6,
  s_10_26_32,
  s_18,
  s_2,
  s_0,
  s_0,
  s_7,
  s_7_10_32_38_41,
  s_0,
  s_39_41,
  s_18,
  s_4,
  s_6_18,
  s_20,
  s_5,
  s_26,
  s_4_10,
  s_0,
  s_2,
  s_7_12,
  s_18,
  s_10,
  s_18,
  s_9_0,
  s_10,
  s_23,
  s_13,
  s_13_20,
  s_0,
  s_23,
  s_9,
  s_10_0,
  s_31,
  s_9,
  s_31,
  s_2,
  s_7,
  s_1_0,
  s_18_0,
  s_14,
  s_2,
  s_4_9_10,
  s_27,
  s_0,
  s_7,
  s_0,
  s_26,
  s_1,
  s_27,
  s_20,
  s_5,
  s_6,
  s_6_36,
  s_18,
  s_1,
  s_4_10,
  s_9,
  s_18,
  s_9,
  s_1,
  s_27,
  s_20,
  s_20,
  s_1,
  s_20,
  s_20,
  s_17,
  s_4,
  s_15,
  s_10_18_1,
  s_22,
  s_18,
  s_41,
  s_4,
  s_18,
  s_1_0,
  s_7,
  s_27,
  s_5,
  s_15,
  s_10,
  s_23,
  s_6_14_27_29_35_42,
  s_18,
  s_6,
  s_18,
  s_0,
  s_18,
  s_23_0_2,
  s_5_13,
  s_7,
  s_0,
  s_15_1,
  s_5,
  s_5,
  s_18,
  s_1,
  s_9,
  s_9,
  s_18,
  s_4,
  s_0,
  s_0,
  s_31_42_0_2,
  s_0,
  s_0,
  s_26,
  s_21,
  s_4_7,
  s_20_0,
  s_0,
  s_30,
  s_7,
  s_8_13_18_0,
  s_0,
  s_0,
  s_20,
  s_18,
  s_15,
  s_18_1,
  s_20,
  s_13,
  s_4_6_0,
  s_18,
  s_5,
  s_0,
  s_7_12,
  s_2,
  s_7,
  s_9_14_21_26_1_0,
  s_18,
  s_18,
  s_20,
  s_15,
  s_10_18,
  s_18,
  s_5,
  s_5_18,
  s_5,
  s_15,
  s_5,
  s_17,
  s_10,
  s_10,
  s_10,
  s_18,
  s_18,
  s_17,
  s_18,
  s_5,
  s_6_9_19_23_30_35_40,
  s_0,
  s_18,
  s_4_6_23_24,
  s_23,
  s_9_17,
  s_27,
  s_13_42,
  s_6_18,
  s_4,
  s_27,
  s_0,
  s_0,
  s_10_21_40,
  s_10,
  s_6_18,
  s_4,
  s_10,
  s_20,
  s_20,
  s_0,
  s_37,
  s_18,
  s_12,
  s_0,
  s_0,
  s_7,
  s_4_35,
  s_18,
  s_1,
  s_5,
  s_1_0,
  s_1,
  s_6_14_41,
  s_4,
  s_18,
  s_6_8_10_20,
  s_4,
  s_0,
  s_5,
  s_20,
  s_20,
  s_1,
  s_5,
  s_15,
  s_13,
  s_5,
  s_5,
  s_4,
  s_13,
  s_13,
  s_5_13,
  s_18,
  s_18,
  s_1,
  s_20,
  s_7,
  s_8,
  s_5,
  s_6_0_1,
  s_15,
  s_4_9,
  s_36_41_42,
  s_0,
  s_9_10,
  s_15,
  s_4_9,
  s_36_41_42,
  s_0,
  s_2,
  s_30_40_42,
  s_0,
  s_18,
  s_4,
  s_3_4_6,
  s_10,
  s_18,
  s_17,
  s_8,
  s_4_6_8_30_35_36_37_38,
  s_4_6_21,
  s_6,
  s_4,
  s_18,
  s_6,
  s_6,
  s_4,
  s_26,
  s_18,
  s_18,
  s_18,
  s_6,
  s_4,
  s_6,
  s_18,
  s_4,
  s_6,
  s_4_6,
  s_0,
  s_26,
  s_38,
  s_4_7,
  s_6_1,
  s_1,
  s_6_20,
  s_8,
  s_8,
  s_18,
  s_14_15,
  s_5_20,
  s_5,
  s_5,
  s_10,
  s_19,
  s_9_17,
  s_27,
  s_6_14_18_32_35_42,
  s_7_10,
  s_20,
  s_18,
  s_4_6_7,
  s_6,
  s_7_10,
  s_6,
  s_15,
  s_18,
  s_27,
  s_6,
  s_18,
  s_18,
  s_5,
  s_15,
  s_6_7_31_35_40,
  s_2,
  s_7,
  s_0,
  s_6_10_27_32_35,
  s_26,
  s_17,
  s_13_20,
  s_20,
  s_20,
  s_10,
  s_1,
  s_2,
  s_10,
  s_6,
  s_18,
  s_5_18,
  s_0,
  s_6,
  s_26,
  s_4,
  s_9,
  s_0,
  s_7,
  s_2,
  s_7,
  s_18,
  s_9,
  s_26,
  s_10,
  s_1,
  s_1,
  s_18,
  s_4,
  s_14_26,
  s_10,
  s_10,
  s_1,
  s_2,
  s_10,
  s_1,
  s_18,
  s_18,
  s_10,
  s_16,
  s_16,
  s_18,
  s_10,
  s_41,
  s_4,
  s_15,
  s_20,
  s_0,
  s_18,
  s_5_13,
  s_6,
  s_8,
  s_5,
  s_17,
  s_20,
  s_42,
  s_18,
  s_18,
  s_5,
  s_18,
  s_20,
  s_42,
  s_13,
  s_38,
  s_13_21,
  s_42,
  s_10,
  s_10,
  s_20,
  s_20,
  s_18,
  s_15,
  s_15,
  s_15,
  s_20,
  s_20,
  s_6,
  s_6,
  s_20,
  s_20,
  s_15_18,
  s_18,
  s_0,
  s_7_12_26,
  s_0,
  s_18,
  s_0,
  s_7,
  s_37_0_2,
  s_20,
  s_13_20,
  s_7,
  s_0,
  s_6,
  s_6,
  s_6,
  s_18,
  s_18_2,
  s_2,
  s_7,
  s_18,
  s_10_0,
  s_5,
  s_5,
  s_12,
  s_2,
  s_0,
  s_15,
  s_1_0,
  s_2,
  s_5,
  s_7,
  s_20,
  s_18,
  s_6,
  s_0,
  s_26,
  s_0,
  s_0,
  s_28,
  s_4_2,
  s_2,
  s_5,
  s_6,
  s_20,
  s_6,
  s_20,
  s_6,
  s_20,
  s_20,
  s_4_7_26_29_31_32_39_41_42,
  s_5,
  s_18,
  s_4_0,
  s_4_6_15_18,
  s_22,
  s_6_36_42,
  s_5_18,
  s_18,
  s_23,
  s_18_0,
  s_4_6_9_10_14_22_25_35_36_38,
  s_5,
  s_6_10,
  s_22,
  s_1_0,
  s_18,
  s_30_35_41_0_2,
  s_0,
  s_2,
  s_30_35_41,
  s_0,
  s_4_7_26,
  s_4_11,
  s_20,
  s_21_40,
  s_0,
  s_18,
  s_4,
  s_35,
  s_4_38,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_5,
  s_20,
  s_20,
  s_6,
  s_6,
  s_6,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_13_20,
  s_20,
  s_20,
  s_6,
  s_18,
  s_20,
  s_18_41,
  s_0,
  s_7,
  s_0,
  s_4,
  s_26,
  s_0,
  s_7_10,
  s_9,
  s_18,
  s_18,
  s_18,
  s_18,
  s_6,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_15,
  s_18,
  s_6,
  s_5,
  s_30_33_37_39_40,
  s_18,
  s_21,
  s_4_7_11_21_22,
  s_21,
  s_0,
  s_0,
  s_14_0,
  s_6_14_15_18_23_26_40_41,
  s_5_6,
  s_0,
  s_18,
  s_15,
  s_23,
  s_0,
  s_6,
  s_23_2,
  s_5,
  s_4_11,
  s_4,
  s_20,
  s_26,
  s_0,
  s_0_2,
  s_30_39,
  s_2,
  s_18,
  s_7,
  s_6,
  s_17,
  s_18,
  s_15,
  s_18,
  s_18,
  s_15,
  s_6_35_42,
  s_6_18,
  s_6,
  s_6,
  s_29_30,
  s_5_18,
  s_7_26,
  s_0,
  s_18,
  s_0,
  s_5,
  s_6,
  s_0,
  s_6,
  s_0,
  s_13_20,
  s_6,
  s_4_9_12_18_23_35_37,
  s_0,
  s_5,
  s_0,
  s_18,
  s_0,
  s_7,
  s_18,
  s_0,
  s_18_0,
  s_4,
  s_18,
  s_0,
  s_0,
  s_6,
  s_0,
  s_12,
  s_0,
  s_0,
  s_2,
  s_7_12,
  s_20,
  s_6_7_18_26_32_0_2,
  s_5,
  s_31,
  s_0,
  s_6,
  s_0,
  s_18_0,
  s_0,
  s_18,
  s_6_29_30_35_38,
  s_10_0,
  s_18,
  s_0,
  s_4_0,
  s_2,
  s_0,
  s_2_0,
  s_17_0,
  s_18,
  s_15,
  s_18,
  s_26,
  s_0,
  s_7_12_26,
  s_18,
  s_0,
  s_13_27,
  s_6,
  s_5,
  s_6,
  s_5,
  s_15,
  s_20,
  s_20,
  s_5,
  s_0,
  s_18,
  s_2,
  s_4_7_12,
  s_15,
  s_18,
  s_6,
  s_6_13,
  s_18,
  s_18,
  s_6,
  s_9,
  s_14,
  s_15,
  s_11,
  s_10_18,
  s_14_15,
  s_18,
  s_18,
  s_0,
  s_15,
  s_27_35,
  s_15,
  s_18,
  s_15,
  s_27,
  s_30_35_42,
  s_0,
  s_4_26,
  s_27,
  s_0,
  s_12,
  s_15,
  s_15,
  s_5,
  s_18,
  s_18,
  s_0,
  s_20,
  s_0,
  s_7_26,
  s_2,
  s_7,
  s_6_17_18,
  s_27,
  s_1,
  s_1,
  s_5,
  s_27,
  s_19_26,
  s_2,
  s_26,
  s_0,
  s_4_15,
  s_0,
  s_0,
  s_7,
  s_21,
  s_18,
  s_32,
  s_9_10,
  s_0,
  s_0,
  s_18,
  s_18,
  s_5,
  s_15,
  s_18,
  s_10,
  s_0,
  s_0,
  s_2,
  s_4,
  s_26,
  s_5,
  s_4_6_38,
  s_20,
  s_15,
  s_14,
  s_5_6_18_35,
  s_10,
  s_6_38,
  s_6_18,
  s_6,
  s_6,
  s_18,
  s_4,
  s_18,
  s_6,
  s_0,
  s_2,
  s_7,
  s_5,
  s_15,
  s_10_18,
  s_0,
  s_2,
  s_7,
  s_26_28_30_37,
  s_4_10,
  s_18,
  s_18,
  s_18,
  s_15,
  s_26,
  s_1,
  s_6_27_35_38,
  s_4_0,
  s_6_18,
  s_18,
  s_6,
  s_6,
  s_1,
  s_5,
  s_8_23,
  s_6,
  s_7,
  s_18,
  s_43,
  s_7_19,
  s_0,
  s_14,
  s_7,
  s_0,
  s_7,
  s_23,
  s_18,
  s_14_17_18_26_31_35,
  s_4,
  s_0,
  s_14,
  s_5,
  s_18,
  s_5,
  s_0,
  s_5,
  s_0,
  s_18,
  s_4_26,
  s_1,
  s_20,
  s_0,
  s_18_0,
  s_28,
  s_13_34,
  s_13,
  s_18,
  s_4,
  s_6,
  s_28,
  s_15,
  s_5,
  s_6,
  s_8,
  s_4_38,
  s_20,
  s_18,
  s_5,
  s_6,
  s_6,
  s_1,
  s_18,
  s_18,
  s_6_8,
  s_8,
  s_10,
  s_15,
  s_20,
  s_20_1,
  s_20,
  s_17_26,
  s_4_11_33_38_42,
  s_18,
  s_6_7_9_32,
  s_0,
  s_2,
  s_7_10,
  s_33_42,
  s_18,
  s_15,
  s_10,
  s_5,
  s_0,
  s_2,
  s_7,
  s_18_0,
  s_7,
  s_15,
  s_15,
  s_1,
  s_4_12_34,
  s_7,
  s_0,
  s_7,
  s_6,
  s_0,
  s_2,
  s_12,
  s_2,
  s_7,
  s_30,
  s_7,
  s_0,
  s_7,
  s_0,
  s_4_28,
  s_0,
  s_15,
  s_18,
  s_6_27,
  s_1,
  s_27,
  s_13,
  s_27,
  s_18,
  s_27,
  s_27,
  s_13,
  s_18,
  s_18_1,
  s_9,
  s_18,
  s_27,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_4,
  s_5,
  s_5,
  s_10,
  s_10,
  s_23,
  s_30,
  s_11,
  s_0,
  s_15,
  s_18,
  s_1,
  s_15,
  s_18_1,
  s_15,
  s_4,
  s_7,
  s_0,
  s_2,
  s_30_34,
  s_4,
  s_0,
  s_2,
  s_26,
  s_7_26,
  s_10,
  s_15,
  s_0,
  s_0,
  s_0,
  s_23,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_23_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_23_0,
  s_23_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_7,
  s_14,
  s_6_14,
  s_13,
  s_6,
  s_20,
  s_15,
  s_10,
  s_20,
  s_27,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_15,
  s_10,
  s_27,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_5,
  s_4,
  s_18,
  s_5,
  s_5,
  s_5,
  s_8,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_6,
  s_4,
  s_26,
  s_26,
  s_1,
  s_26,
  s_8,
  s_8,
  s_1,
  s_26,
  s_26,
  s_26,
  s_4,
  s_1,
  s_27,
  s_26,
  s_26,
  s_22,
  s_26,
  s_41,
  s_15,
  s_4,
  s_6_9,
  s_5_10,
  s_15,
  s_20,
  s_15,
  s_0,
  s_14_15,
  s_22,
  s_30,
  s_0,
  s_22,
  s_30,
  s_0,
  s_6,
  s_17,
  s_0,
  s_6,
  s_5,
  s_20,
  s_10_36_0_1,
  s_0,
  s_7,
  s_2,
  s_7,
  s_18,
  s_18,
  s_5,
  s_18,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_18,
  s_27,
  s_27,
  s_26,
  s_18,
  s_22,
  s_1,
  s_26,
  s_22,
  s_22,
  s_30,
  s_26,
  s_27,
  s_8,
  s_27,
  s_26,
  s_5,
  s_20,
  s_20,
  s_18,
  s_27,
  s_17,
  s_15,
  s_6,
  s_0,
  s_5,
  s_6_27,
  s_20,
  s_35,
  s_35,
  s_20,
  s_15,
  s_5,
  s_13_18,
  s_1,
  s_13,
  s_18,
  s_15,
  s_18,
  s_5,
  s_18,
  s_18,
  s_10_13_18_27,
  s_18,
  s_13,
  s_15,
  s_15,
  s_10_18_1,
  s_18,
  s_30,
  s_7_22,
  s_1,
  s_18,
  s_9,
  s_18,
  s_20,
  s_6,
  s_18,
  s_18_1,
  s_9,
  s_40,
  s_6,
  s_5,
  s_5,
  s_31_36,
  s_9,
  s_18,
  s_6_14_18_36,
  s_0,
  s_6_14,
  s_18,
  s_7,
  s_6,
  s_18_0,
  s_6,
  s_6,
  s_18,
  s_17_18,
  s_5_13,
  s_6,
  s_6,
  s_10,
  s_20,
  s_18,
  s_18,
  s_20,
  s_13_15,
  s_13,
  s_13,
  s_20,
  s_6_36,
  s_1,
  s_1,
  s_26,
  s_10_0,
  s_1,
  s_9,
  s_1,
  s_5,
  s_1,
  s_26,
  s_5,
  s_5,
  s_17,
  s_1,
  s_8,
  s_26,
  s_5,
  s_6,
  s_1,
  s_9,
  s_18,
  s_22,
  s_8,
  s_26,
  s_1,
  s_27,
  s_10,
  s_5,
  s_8,
  s_5,
  s_5,
  s_5,
  s_0,
  s_0,
  s_2,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_20,
  s_5,
  s_20,
  s_5,
  s_5,
  s_8_19,
  s_30_35_0,
  s_4_7,
  s_8,
  s_9_10_14,
  s_18,
  s_0,
  s_18_1,
  s_15,
  s_20,
  s_18,
  s_18,
  s_18_0,
  s_37,
  s_0,
  s_0,
  s_20_30,
  s_20,
  s_0,
  s_13_15_17,
  s_15,
  s_5,
  s_6,
  s_20,
  s_15_18,
  s_2,
  s_18,
  s_20,
  s_7_9_12_26,
  s_18,
  s_5,
  s_6_15,
  s_14,
  s_14,
  s_5,
  s_5,
  s_15,
  s_10_36,
  s_18,
  s_13,
  s_20,
  s_20,
  s_18,
  s_20,
  s_5,
  s_11,
  s_18,
  s_18,
  s_18,
  s_10,
  s_14,
  s_14,
  s_18,
  s_10,
  s_10,
  s_6_10_14,
  s_18,
  s_17,
  s_18,
  s_4_7_0,
  s_5,
  s_0,
  s_28,
  s_28,
  s_15,
  s_14,
  s_4_9_0,
  s_0,
  s_2,
  s_18,
  s_5,
  s_27,
  s_18,
  s_1_0,
  s_2,
  s_4,
  s_18,
  s_4,
  s_4,
  s_27,
  s_7,
  s_0,
  s_2,
  s_7,
  s_18,
  s_27,
  s_27,
  s_27,
  s_6_9,
  s_0_1,
  s_2,
  s_9,
  s_7_22_23,
  s_30_32,
  s_0,
  s_9_19,
  s_27,
  s_7_22_23,
  s_30_32,
  s_0,
  s_6,
  s_6,
  s_9,
  s_6,
  s_23,
  s_19,
  s_6,
  s_10,
  s_4_6_10_24,
  s_7,
  s_0,
  s_2,
  s_18,
  s_0,
  s_6,
  s_30_32,
  s_10,
  s_0,
  s_2,
  s_7_24,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_6,
  s_5_18,
  s_18,
  s_20,
  s_18,
  s_10_18_1,
  s_15,
  s_18,
  s_10,
  s_10,
  s_10,
  s_20,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_15,
  s_18,
  s_9_14,
  s_9,
  s_18,
  s_18,
  s_9,
  s_18,
  s_15,
  s_10_18,
  s_5_13,
  s_4,
  s_18,
  s_6,
  s_20,
  s_7_20,
  s_18,
  s_20,
  s_18,
  s_18,
  s_18,
  s_10,
  s_20,
  s_5,
  s_20,
  s_18,
  s_18_28_0,
  s_20,
  s_8,
  s_28,
  s_0,
  s_7,
  s_0,
  s_28,
  s_26,
  s_18,
  s_10_18,
  s_15,
  s_5,
  s_5,
  s_20,
  s_6_10_14_32_35,
  s_6,
  s_6,
  s_6,
  s_6,
  s_0,
  s_6_10_18,
  s_4_14,
  s_18,
  s_6,
  s_18,
  s_6,
  s_29,
  s_14_0,
  s_18,
  s_18,
  s_6_17_0,
  s_15,
  s_18,
  s_6,
  s_17,
  s_34,
  s_2,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6_9_18,
  s_9,
  s_0,
  s_31_32_34_40_42,
  s_0,
  s_0,
  s_18,
  s_4_21,
  s_18,
  s_6,
  s_6,
  s_6,
  s_18,
  s_18,
  s_7_20,
  s_5,
  s_20,
  s_0,
  s_2,
  s_7,
  s_5,
  s_6,
  s_9_18_31_0,
  s_20,
  s_15,
  s_18,
  s_7_23_28,
  s_14,
  s_0,
  s_10_0,
  s_14,
  s_5,
  s_17,
  s_18,
  s_4_9_29_30_31_32_35_36_38_39_40_41_42,
  s_15,
  s_4,
  s_14_18,
  s_4,
  s_4_0,
  s_6_7_11,
  s_6,
  s_4,
  s_4_6_7,
  s_5,
  s_20,
  s_15,
  s_22,
  s_5,
  s_6_15_20,
  s_10_18,
  s_10_18,
  s_27,
  s_26,
  s_5,
  s_18,
  s_9,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_20,
  s_0,
  s_0,
  s_0,
  s_26,
  s_0,
  s_2,
  s_9,
  s_26,
  s_15,
  s_18,
  s_26,
  s_18,
  s_5,
  s_20,
  s_10,
  s_10,
  s_0_2,
  s_8,
  s_26,
  s_1,
  s_10,
  s_10,
  s_27,
  s_15,
  s_18_1,
  s_20,
  s_10_18_1,
  s_15,
  s_10,
  s_18_1,
  s_15,
  s_10_18_1,
  s_20,
  s_18_0,
  s_18,
  s_15,
  s_18,
  s_4,
  s_5_15_18_0,
  s_27,
  s_20,
  s_18,
  s_10_18,
  s_32_0,
  s_10,
  s_18,
  s_0,
  s_7_12,
  s_0,
  s_5,
  s_7,
  s_5,
  s_10,
  s_18,
  s_7_12,
  s_7,
  s_0,
  s_2,
  s_4,
  s_18,
  s_11_26,
  s_0,
  s_11_35,
  s_0,
  s_15,
  s_18_1,
  s_7_12,
  s_0,
  s_2,
  s_12,
  s_32_0,
  s_7_26,
  s_7_26,
  s_0,
  s_2,
  s_18,
  s_7_12,
  s_2,
  s_10,
  s_18,
  s_41,
  s_18,
  s_4,
  s_5,
  s_18,
  s_6,
  s_5,
  s_18,
  s_7,
  s_0,
  s_20,
  s_6,
  s_8,
  s_18,
  s_5,
  s_5,
  s_20,
  s_15,
  s_13,
  s_34,
  s_0,
  s_26,
  s_26,
  s_26,
  s_9,
  s_0,
  s_7,
  s_9,
  s_0,
  s_18,
  s_27,
  s_20,
  s_5,
  s_18,
  s_20,
  s_18,
  s_20,
  s_20,
  s_0,
  s_7,
  s_4,
  s_18,
  s_10,
  s_13_30,
  s_15,
  s_13_44,
  s_5_10_18_1,
  s_27,
  s_18,
  s_18_1,
  s_9,
  s_10,
  s_18,
  s_10_18,
  s_27,
  s_41,
  s_0,
  s_18,
  s_4,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_40,
  s_4,
  s_10,
  s_10_18,
  s_18,
  s_5,
  s_4_38,
  s_18,
  s_13_20,
  s_8,
  s_8_18,
  s_5,
  s_5,
  s_5_1,
  s_18,
  s_9,
  s_1,
  s_20,
  s_13_20,
  s_8,
  s_20,
  s_6,
  s_4,
  s_18_26,
  s_5_0,
  s_4,
  s_5,
  s_5,
  s_5,
  s_18,
  s_5,
  s_20,
  s_5_6_15_18_33_41,
  s_6_35,
  s_35_41,
  s_7,
  s_0,
  s_7,
  s_2,
  s_4_14,
  s_18,
  s_18,
  s_1,
  s_2,
  s_4,
  s_15,
  s_5_6_18,
  s_15,
  s_28,
  s_18,
  s_23,
  s_5,
  s_18,
  s_18,
  s_15,
  s_10_14_18,
  s_15,
  s_1,
  s_18_1,
  s_10,
  s_10_18_1,
  s_9,
  s_6,
  s_15,
  s_10,
  s_10,
  s_10_13_18_20,
  s_18,
  s_4_10_15_32_41,
  s_18,
  s_2,
  s_15_18_0,
  s_10,
  s_10_18_1,
  s_9,
  s_18,
  s_6,
  s_18,
  s_18,
  s_18,
  s_20,
  s_8,
  s_8,
  s_1,
  s_1,
  s_1,
  s_20,
  s_20,
  s_6,
  s_6,
  s_20,
  s_20,
  s_6,
  s_6,
  s_5,
  s_5,
  s_5,
  s_34,
  s_4,
  s_5_8,
  s_18,
  s_18,
  s_4_9_33_38_41,
  s_7,
  s_0,
  s_18,
  s_0,
  s_2,
  s_7,
  s_10,
  s_5,
  s_27,
  s_27,
  s_27,
  s_26,
  s_6,
  s_0,
  s_20,
  s_2,
  s_7,
  s_6_30_35,
  s_0,
  s_18,
  s_20,
  s_13_20,
  s_20,
  s_6,
  s_13_20,
  s_20,
  s_0,
  s_35,
  s_13_15,
  s_6,
  s_4_7_26,
  s_4,
  s_16_26,
  s_18_0,
  s_0,
  s_2,
  s_0,
  s_18_1,
  s_9,
  s_9,
  s_18_1,
  s_18_1,
  s_0,
  s_13,
  s_4_29,
  s_18,
  s_5,
  s_10_30_32_0,
  s_4_10_11,
  s_2,
  s_10,
  s_6_14_27_30_0,
  s_20,
  s_6_18,
  s_15_27,
  s_20,
  s_27,
  s_20_27,
  s_27,
  s_7,
  s_0,
  s_29_35_37_40_41,
  s_4,
  s_0,
  s_2,
  s_18,
  s_15,
  s_5,
  s_5,
  s_5,
  s_15,
  s_15,
  s_5,
  s_0,
  s_0,
  s_7,
  s_0_2,
  s_18,
  s_13_20,
  s_0,
  s_6_18,
  s_7_9,
  s_0,
  s_4_7,
  s_0,
  s_7,
  s_15,
  s_6_18,
  s_0,
  s_6,
  s_33_38_41,
  s_7,
  s_0,
  s_4_9_33_38_41,
  s_18,
  s_6,
  s_6_21,
  s_1,
  s_6,
  s_14,
  s_0,
  s_20,
  s_6_0,
  s_18,
  s_6,
  s_18,
  s_15_18,
  s_10_18,
  s_6_15,
  s_4,
  s_18,
  s_18,
  s_5_6,
  s_18,
  s_5,
  s_6,
  s_6,
  s_18,
  s_6,
  s_5,
  s_0,
  s_18,
  s_18,
  s_18,
  s_5,
  s_5,
  s_18,
  s_6,
  s_4,
  s_4,
  s_5,
  s_5,
  s_5,
  s_10,
  s_6_8_10_17_18_35_38,
  s_0,
  s_6,
  s_6,
  s_5,
  s_10,
  s_6_18,
  s_6,
  s_4_10_0_1,
  s_2,
  s_8,
  s_6,
  s_4_36,
  s_0,
  s_14_18,
  s_4,
  s_5,
  s_4,
  s_41,
  s_18,
  s_27_38,
  s_8,
  s_10,
  s_5_10_1,
  s_0,
  s_13,
  s_20,
  s_18,
  s_18_27,
  s_6,
  s_9,
  s_18_1,
  s_10_14,
  s_6_24_30_31_36_42,
  s_5,
  s_20,
  s_0,
  s_4,
  s_18,
  s_4_24,
  s_10_31,
  s_15,
  s_6,
  s_14_18,
  s_18,
  s_7_28_29_30,
  s_5_18,
  s_5,
  s_5,
  s_6,
  s_15,
  s_15,
  s_10_18,
  s_13_20,
  s_20,
  s_20,
  s_20,
  s_13,
  s_20,
  s_26,
  s_18,
  s_18,
  s_10,
  s_4_11,
  s_18,
  s_20,
  s_20,
  s_20,
  s_4_38,
  s_18,
  s_0,
  s_20,
  s_6_27_36,
  s_0,
  s_7,
  s_30,
  s_0,
  s_7,
  s_7,
  s_30,
  s_0,
  s_7,
  s_4_9,
  s_20,
  s_13,
  s_13,
  s_18,
  s_8_29,
  s_4_10_14_15_28_35_38_41,
  s_20,
  s_20,
  s_20,
  s_15,
  s_18,
  s_15,
  s_4,
  s_18,
  s_15,
  s_13,
  s_18,
  s_9,
  s_18,
  s_18,
  s_18,
  s_5_17,
  s_4,
  s_13_27,
  s_13,
  s_13,
  s_28,
  s_5,
  s_5,
  s_13,
  s_7_10_21_25,
  s_0,
  s_10,
  s_22,
  s_41,
  s_7,
  s_22,
  s_41,
  s_2,
  s_5,
  s_5,
  s_20,
  s_18,
  s_20,
  s_10_18,
  s_17_20,
  s_14,
  s_1,
  s_15,
  s_10_18,
  s_15,
  s_20,
  s_6_20,
  s_6_20,
  s_6,
  s_6,
  s_13_30,
  s_13,
  s_30,
  s_18_0_1,
  s_6,
  s_18,
  s_14,
  s_18,
  s_18,
  s_6,
  s_20,
  s_10,
  s_1,
  s_4,
  s_1_0,
  s_15,
  s_13_20,
  s_4_7_9_10_18_23_30_31_32_35_39_41,
  s_0,
  s_2,
  s_6_10,
  s_4_6_14_30_40,
  s_0,
  s_18,
  s_4,
  s_4_6,
  s_5,
  s_5,
  s_4_7_10,
  s_23,
  s_18,
  s_18,
  s_18,
  s_1,
  s_18,
  s_18,
  s_9,
  s_10_21,
  s_20,
  s_27,
  s_20,
  s_18,
  s_5,
  s_6,
  s_6,
  s_6,
  s_6,
  s_27,
  s_18,
  s_27,
  s_1,
  s_13,
  s_17,
  s_6_13,
  s_17,
  s_1,
  s_1,
  s_5,
  s_5,
  s_5,
  s_15_1,
  s_6,
  s_6_7_18_30_40_0,
  s_0,
  s_6,
  s_18,
  s_10,
  s_6,
  s_18,
  s_6,
  s_6,
  s_15_18,
  s_18,
  s_6_18,
  s_15,
  s_15,
  s_18,
  s_0,
  s_20,
  s_4_14_26,
  s_7,
  s_0,
  s_18_0_1,
  s_8_9_13_20,
  s_13,
  s_20,
  s_15,
  s_41,
  s_17_18,
  s_13,
  s_10,
  s_6_15,
  s_15,
  s_17_18,
  s_18_30_35_38,
  s_18,
  s_14,
  s_4,
  s_17,
  s_13,
  s_0,
  s_20,
  s_20,
  s_18,
  s_5_1,
  s_5,
  s_8,
  s_6,
  s_20,
  s_5,
  s_27,
  s_5,
  s_18,
  s_18_0,
  s_2,
  s_18_1,
  s_5_18,
  s_18,
  s_6,
  s_13,
  s_15,
  s_28,
  s_20,
  s_20,
  s_18_29_35,
  s_11,
  s_29,
  s_29,
  s_20,
  s_20,
  s_20,
  s_18,
  s_11_32,
  s_18,
  s_18,
  s_0,
  s_2,
  s_0,
  s_2,
  s_18,
  s_9,
  s_18_1,
  s_18,
  s_15,
  s_18,
  s_13,
  s_10,
  s_10,
  s_6,
  s_13,
  s_18,
  s_10_0,
  s_22,
  s_30,
  s_7,
  s_22,
  s_30,
  s_20,
  s_18,
  s_6,
  s_15,
  s_13_27_30_32_35,
  s_6_18,
  s_15,
  s_10,
  s_6,
  s_15,
  s_6,
  s_4_6_14_35_39,
  s_0,
  s_18,
  s_4_6_9,
  s_12,
  s_18,
  s_0,
  s_2,
  s_18,
  s_1,
  s_6,
  s_4_6_14,
  s_10,
  s_10,
  s_18,
  s_1,
  s_18,
  s_18,
  s_15,
  s_14,
  s_18,
  s_4_6_14_32_39,
  s_18,
  s_4_7_10_14_17_23_38_0,
  s_10_18,
  s_10_15_18,
  s_4_30,
  s_4_29_35,
  s_18,
  s_5,
  s_18,
  s_15,
  s_4,
  s_18,
  s_14,
  s_8,
  s_18,
  s_18,
  s_27,
  s_27,
  s_17,
  s_18,
  s_0,
  s_2,
  s_7,
  s_18,
  s_6_13_20,
  s_6,
  s_6,
  s_26,
  s_4,
  s_1,
  s_6_18_31_33_41_0,
  s_0,
  s_0,
  s_2,
  s_4_9,
  s_0,
  s_0,
  s_18_31,
  s_4_6,
  s_18,
  s_4_9,
  s_4,
  s_20,
  s_4_9_26,
  s_6_10,
  s_20_27,
  s_34_35,
  s_4,
  s_5,
  s_5,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_8,
  s_5,
  s_5,
  s_8_1,
  s_8_1,
  s_8,
  s_4,
  s_26,
  s_26,
  s_4,
  s_5,
  s_5,
  s_35,
  s_4,
  s_18,
  s_6_7_10_17_30_35_0,
  s_10,
  s_18,
  s_20,
  s_10,
  s_15,
  s_6_9_11_14_18_23_30_33_35_40_42,
  s_6,
  s_6,
  s_6,
  s_20,
  s_0,
  s_18,
  s_6,
  s_0,
  s_0,
  s_6,
  s_18,
  s_4,
  s_6,
  s_4,
  s_20,
  s_17_27,
  s_4_6_13_18_20_23_33_35,
  s_0,
  s_0,
  s_13,
  s_18,
  s_18,
  s_6_10_18_27_0,
  s_11_22,
  s_30,
  s_9_26,
  s_18,
  s_0,
  s_2,
  s_7_24,
  s_11_22,
  s_30,
  s_2,
  s_6,
  s_0_1,
  s_4_7,
  s_0,
  s_2,
  s_7_24_26,
  s_14,
  s_0,
  s_9,
  s_0_1,
  s_2,
  s_18,
  s_9,
  s_18,
  s_9,
  s_10,
  s_4,
  s_28,
  s_18,
  s_18,
  s_18,
  s_18,
  s_0,
  s_14,
  s_0,
  s_14,
  s_4,
  s_20,
  s_0,
  s_4_18,
  s_18_41,
  s_4,
  s_18,
  s_24,
  s_0,
  s_2,
  s_0,
  s_1,
  s_4_26,
  s_18,
  s_6_8_14_17_27,
  s_18,
  s_0,
  s_10,
  s_7,
  s_7_0,
  s_7_27_30_0,
  s_0,
  s_3_7_9_10_42,
  s_17,
  s_20,
  s_10_18,
  s_20,
  s_6,
  s_6,
  s_10_18,
  s_6,
  s_29_30,
  s_22,
  s_1,
  s_29_30_32_0,
  s_0,
  s_2,
  s_22,
  s_26,
  s_26_28,
  s_1,
  s_13,
  s_13,
  s_13,
  s_0,
  s_18,
  s_15,
  s_6_35,
  s_18,
  s_18,
  s_8,
  s_6,
  s_23,
  s_32_38,
  s_11,
  s_18,
  s_18,
  s_15,
  s_18_1,
  s_15,
  s_18_1,
  s_15,
  s_18,
  s_6_18,
  s_6,
  s_7_0,
  s_18,
  s_5_18_0,
  s_6,
  s_18,
  s_5,
  s_8,
  s_0,
  s_2,
  s_7_12,
  s_15,
  s_6,
  s_6_0,
  s_8,
  s_20,
  s_8_1,
  s_1,
  s_1,
  s_1,
  s_10_18,
  s_0,
  s_2,
  s_4,
  s_18,
  s_4,
  s_30,
  s_0,
  s_4,
  s_30,
  s_0,
  s_7_15_23_0,
  s_5,
  s_18_23,
  s_6,
  s_20_28,
  s_10_14_18,
  s_20,
  s_20,
  s_18,
  s_10_18,
  s_20,
  s_2,
  s_10,
  s_20,
  s_15,
  s_18,
  s_5,
  s_5,
  s_6_20,
  s_5,
  s_2,
  s_20,
  s_4,
  s_26,
  s_13,
  s_13,
  s_18,
  s_1,
  s_4,
  s_18,
  s_6,
  s_20,
  s_18,
  s_20,
  s_5,
  s_15,
  s_9,
  s_6_9,
  s_0,
  s_6,
  s_26,
  s_4_10,
  s_0,
  s_20,
  s_18,
  s_10,
  s_15,
  s_26,
  s_15,
  s_23,
  s_14,
  s_15,
  s_15,
  s_18,
  s_4,
  s_18,
  s_18,
  s_18,
  s_18,
  s_23,
  s_18,
  s_18,
  s_9,
  s_14,
  s_13,
  s_18,
  s_17_18,
  s_18,
  s_18,
  s_18,
  s_14,
  s_10,
  s_6,
  s_13_18,
  s_18,
  s_15,
  s_20,
  s_5,
  s_0,
  s_0_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_13_28,
  s_20,
  s_20,
  s_28,
  s_5,
  s_1_0,
  s_5,
  s_0,
  s_9_31_32_42_0,
  s_4_17_38,
  s_0,
  s_2,
  s_18,
  s_9_10_0,
  s_0,
  s_2,
  s_7,
  s_0,
  s_7_10,
  s_2,
  s_7,
  s_4_6_21,
  s_0,
  s_2,
  s_28_2,
  s_28_2,
  s_18,
  s_10,
  s_26,
  s_0,
  s_7,
  s_0,
  s_2,
  s_3_4_6_10_30_31_42,
  s_1_0,
  s_2,
  s_0,
  s_4,
  s_18,
  s_4,
  s_9_13_20,
  s_13,
  s_0,
  s_13,
  s_18,
  s_4,
  s_8,
  s_0,
  s_6,
  s_6,
  s_23,
  s_23,
  s_15,
  s_6,
  s_18_0,
  s_0_1,
  s_2,
  s_4_9,
  s_4_26,
  s_30,
  s_0,
  s_4_6_9_17_22,
  s_18,
  s_1_0,
  s_2,
  s_4_26,
  s_30,
  s_0,
  s_6,
  s_6,
  s_6,
  s_6,
  s_27,
  s_20,
  s_5,
  s_5,
  s_1,
  s_10,
  s_10,
  s_18,
  s_10_13_21,
  s_18,
  s_15,
  s_18,
  s_41,
  s_18,
  s_0,
  s_7,
  s_4_0,
  s_18,
  s_15,
  s_4,
  s_5,
  s_15,
  s_7,
  s_1_0,
  s_0,
  s_2,
  s_9_0,
  s_10,
  s_8,
  s_32_42_0,
  s_0,
  s_7,
  s_4_10,
  s_18,
  s_1,
  s_1,
  s_18,
  s_18_20,
  s_20,
  s_4,
  s_4_0_1,
  s_2,
  s_6,
  s_4,
  s_29,
  s_4_6,
  s_0,
  s_14,
  s_0,
  s_2,
  s_4_6_9_29,
  s_20,
  s_18,
  s_1,
  s_23,
  s_1_0,
  s_15,
  s_20,
  s_0,
  s_7_18,
  s_31,
  s_9,
  s_0,
  s_2,
  s_7,
  s_17_1,
  s_4_10_15_18_26_27_0,
  s_4,
  s_13_20,
  s_10,
  s_10,
  s_6,
  s_13,
  s_27,
  s_8_27,
  s_1,
  s_1,
  s_5_18,
  s_5,
  s_5_1,
  s_21,
  s_0,
  s_2,
  s_7_12,
  s_10,
  s_5,
  s_6_27,
  s_11_33_34_35_38_39_41_42_0,
  s_18,
  s_4_11_14_15,
  s_6,
  s_6,
  s_6,
  s_23,
  s_5,
  s_23,
  s_21,
  s_23,
  s_26,
  s_26,
  s_5,
  s_5,
  s_5,
  s_8,
  s_28,
  s_11,
  s_5,
  s_5,
  s_18,
  s_23,
  s_20,
  s_28,
  s_4,
  s_8,
  s_1,
  s_6,
  s_1,
  s_5,
  s_8,
  s_1,
  s_26,
  s_26,
  s_8,
  s_26,
  s_26,
  s_18,
  s_0,
  s_0,
  s_5,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_6,
  s_5,
  s_5,
  s_5,
  s_5,
  s_0,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_23,
  s_23,
  s_27,
  s_10,
  s_27,
  s_23,
  s_26,
  s_26,
  s_20,
  s_10_22,
  s_1,
  s_18,
  s_18,
  s_18,
  s_27,
  s_14,
  s_17,
  s_27,
  s_26,
  s_27,
  s_20,
  s_20,
  s_20,
  s_26,
  s_18,
  s_18_0,
  s_8_12_26_0,
  s_18,
  s_5,
  s_15,
  s_1,
  s_14,
  s_27,
  s_30,
  s_26,
  s_5,
  s_30,
  s_8,
  s_8,
  s_7,
  s_5,
  s_26,
  s_5,
  s_26,
  s_5,
  s_20,
  s_26,
  s_20,
  s_20,
  s_20,
  s_8,
  s_18,
  s_15,
  s_18,
  s_18,
  s_4_30_32,
  s_5,
  s_5,
  s_4,
  s_27,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_30,
  s_4_22_26,
  s_0,
  s_9,
  s_18,
  s_5,
  s_20,
  s_18,
  s_6,
  s_0,
  s_0,
  s_5,
  s_18,
  s_30_2_0,
  s_0,
  s_22,
  s_2,
  s_2,
  s_7_9_12,
  s_20,
  s_0_1,
  s_2,
  s_0,
  s_2,
  s_7,
  s_36,
  s_36,
  s_10,
  s_0,
  s_2,
  s_9_10,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_13_20,
  s_5,
  s_5,
  s_20,
  s_5,
  s_6,
  s_18,
  s_22_30,
  s_0,
  s_11_22,
  s_0,
  s_18,
  s_22_0,
  s_27,
  s_5,
  s_18,
  s_10,
  s_8_14_18_24,
  s_0,
  s_0,
  s_14_26,
  s_5,
  s_6_8,
  s_6,
  s_1_0,
  s_9,
  s_15,
  s_9,
  s_10,
  s_10,
  s_10,
  s_7,
  s_0,
  s_2,
  s_10,
  s_10,
  s_6_10,
  s_11,
  s_31_32,
  s_11,
  s_31_32,
  s_9,
  s_31,
  s_18,
  s_9,
  s_31,
  s_18,
  s_6_9,
  s_15,
  s_18,
  s_14,
  s_10_26_29_32_42,
  s_0,
  s_2,
  s_27,
  s_14,
  s_6_14,
  s_18,
  s_11,
  s_18,
  s_4_6_30,
  s_0,
  s_2,
  s_7,
  s_18,
  s_18,
  s_27,
  s_18,
  s_18_1,
  s_9,
  s_9,
  s_18,
  s_18,
  s_18,
  s_10_26,
  s_18_0,
  s_26,
  s_4_6,
  s_18,
  s_5,
  s_6,
  s_18_0,
  s_2,
  s_18,
  s_1,
  s_8,
  s_26,
  s_26,
  s_26,
  s_26,
  s_26,
  s_8,
  s_5,
  s_4,
  s_20,
  s_6_8,
  s_20,
  s_20,
  s_18,
  s_18,
  s_9,
  s_10_18,
  s_10_18,
  s_1,
  s_28,
  s_5,
  s_6,
  s_22,
  s_8,
  s_18,
  s_5,
  s_17,
  s_1,
  s_18,
  s_22,
  s_18,
  s_18,
  s_1,
  s_29,
  s_22,
  s_22_27,
  s_0_1,
  s_1,
  s_31,
  s_4,
  s_0_1,
  s_9,
  s_9,
  s_2,
  s_9,
  s_20,
  s_6_27,
  s_1,
  s_5,
  s_10_32,
  s_18,
  s_18_32,
  s_8_20,
  s_20,
  s_9_10_13,
  s_18,
  s_5,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_11_32,
  s_6,
  s_6,
  s_6,
  s_6,
  s_0,
  s_18,
  s_0,
  s_0,
  s_5,
  s_5_9_27,
  s_6,
  s_6,
  s_6,
  s_7,
  s_26,
  s_6,
  s_1_0,
  s_4_14,
  s_6,
  s_18,
  s_17,
  s_5,
  s_18_0,
  s_18,
  s_30,
  s_44,
  s_30,
  s_44,
  s_6_40,
  s_18,
  s_4,
  s_18,
  s_26,
  s_0,
  s_6,
  s_0,
  s_2,
  s_4_7_12,
  s_0,
  s_2,
  s_7_12,
  s_18,
  s_18,
  s_1_0,
  s_20,
  s_1,
  s_6,
  s_1,
  s_7_17_18_27,
  s_4_7_12_26,
  s_17_0,
  s_18,
  s_2,
  s_10,
  s_1_0,
  s_2,
  s_7,
  s_5,
  s_30,
  s_0,
  s_18,
  s_4_11,
  s_5,
  s_4_0,
  s_5,
  s_20,
  s_15,
  s_15_26_1_0,
  s_1_0,
  s_13,
  s_5,
  s_5,
  s_20,
  s_7_42,
  s_0,
  s_0,
  s_0,
  s_9_14,
  s_1,
  s_0,
  s_2,
  s_7,
  s_5,
  s_5,
  s_5,
  s_5_18,
  s_6,
  s_13_20,
  s_5,
  s_18,
  s_18,
  s_18,
  s_26,
  s_10,
  s_24,
  s_5,
  s_5,
  s_5,
  s_14_18_1,
  s_5,
  s_2,
  s_6,
  s_17,
  s_4_12,
  s_7,
  s_0,
  s_18,
  s_4,
  s_20,
  s_6,
  s_18,
  s_20,
  s_15_17,
  s_26,
  s_6,
  s_28,
  s_13_20,
  s_6,
  s_20,
  s_8,
  s_5,
  s_1,
  s_8,
  s_4_6_9_11_23_30_35_41,
  s_15_0,
  s_4_6_11,
  s_0,
  s_4,
  s_0,
  s_0,
  s_18_0,
  s_18_0,
  s_6,
  s_0,
  s_0_1,
  s_18,
  s_0,
  s_29_32,
  s_0,
  s_4,
  s_18,
  s_29_32,
  s_0,
  s_18,
  s_0,
  s_15,
  s_18_1,
  s_5,
  s_1,
  s_20,
  s_8,
  s_5,
  s_5,
  s_1,
  s_5,
  s_28_1,
  s_18,
  s_0,
  s_7,
  s_17,
  s_1,
  s_8,
  s_20,
  s_0,
  s_15,
  s_17,
  s_26,
  s_8,
  s_17,
  s_28_1,
  s_20,
  s_20,
  s_20,
  s_6_13_23_26_30_34,
  s_10_32,
  s_10,
  s_18,
  s_10_18,
  s_4,
  s_1,
  s_28,
  s_2,
  s_15,
  s_7_26,
  s_18,
  s_6,
  s_0,
  s_18,
  s_18,
  s_27,
  s_20,
  s_5,
  s_0_1,
  s_2,
  s_34,
  s_22,
  s_27,
  s_34,
  s_0,
  s_8_1,
  s_8,
  s_9,
  s_9,
  s_1,
  s_26,
  s_14,
  s_19,
  s_0,
  s_0,
  s_0,
  s_0,
  s_9,
  s_27_35_0,
  s_10,
  s_10,
  s_18,
  s_35,
  s_6_0,
  s_0,
  s_35,
  s_0,
  s_1,
  s_1,
  s_18,
  s_9,
  s_6,
  s_4_6,
  s_18,
  s_4,
  s_6,
  s_9,
  s_5,
  s_0,
  s_0_1,
  s_22,
  s_26,
  s_30,
  s_4_22,
  s_1_0,
  s_22,
  s_10,
  s_0,
  s_0,
  s_2,
  s_1_0,
  s_2,
  s_9,
  s_8,
  s_6,
  s_9,
  s_20,
  s_7,
  s_1,
  s_22,
  s_29,
  s_29,
  s_1,
  s_8_1,
  s_8,
  s_5,
  s_5,
  s_22,
  s_5,
  s_5,
  s_18,
  s_18,
  s_15,
  s_19,
  s_8,
  s_17_19,
  s_1_0,
  s_17,
  s_1,
  s_1,
  s_17,
  s_1,
  s_1,
  s_2,
  s_18,
  s_9_10,
  s_4,
  s_6_7_10_23_30_35,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_27,
  s_27,
  s_5,
  s_27,
  s_6,
  s_6,
  s_6,
  s_6,
  s_13,
  s_6,
  s_6,
  s_27,
  s_6,
  s_4_9,
  s_0,
  s_2,
  s_7,
  s_9,
  s_18_1,
  s_14,
  s_1,
  s_2,
  s_9,
  s_6,
  s_18,
  s_27,
  s_1,
  s_27,
  s_6,
  s_27,
  s_6,
  s_6,
  s_27,
  s_18,
  s_23,
  s_27,
  s_7,
  s_0,
  s_2,
  s_7,
  s_4_7,
  s_18,
  s_10,
  s_0,
  s_0,
  s_2,
  s_10,
  s_8,
  s_6,
  s_26,
  s_6,
  s_7_10_23,
  s_6,
  s_23_24_1_0,
  s_1_0,
  s_2,
  s_30,
  s_4,
  s_30,
  s_30,
  s_9,
  s_4,
  s_30_36,
  s_26,
  s_6,
  s_1,
  s_9,
  s_6,
  s_6,
  s_10,
  s_14_15,
  s_18_1,
  s_26,
  s_26,
  s_20,
  s_18,
  s_7,
  s_0,
  s_7,
  s_6,
  s_4_17,
  s_6,
  s_5_11_32,
  s_29,
  s_6,
  s_15,
  s_18_1,
  s_18,
  s_15,
  s_6,
  s_6,
  s_18,
  s_18,
  s_20,
  s_20,
  s_20,
  s_10,
  s_10,
  s_6,
  s_10_18,
  s_6,
  s_10,
  s_23,
  s_23,
  s_28,
  s_15_18,
  s_10_18,
  s_11_32,
  s_11_32,
  s_26,
  s_26,
  s_0,
  s_0,
  s_11,
  s_23,
  s_23,
  s_6,
  s_27,
  s_1,
  s_10_18,
  s_18,
  s_17,
  s_18,
  s_28,
  s_28,
  s_10_18,
  s_1,
  s_18,
  s_18,
  s_18,
  s_4_15_17,
  s_18,
  s_18,
  s_18,
  s_23,
  s_10_18,
  s_6,
  s_0,
  s_6,
  s_23,
  s_5,
  s_5,
  s_1,
  s_1,
  s_18,
  s_9,
  s_26,
  s_6,
  s_5,
  s_1,
  s_1,
  s_26,
  s_26,
  s_6,
  s_5,
  s_6,
  s_5,
  s_5,
  s_10,
  s_6,
  s_36,
  s_9,
  s_1,
  s_0,
  s_8,
  s_26,
  s_5,
  s_5,
  s_6,
  s_1,
  s_9,
  s_18,
  s_1,
  s_9,
  s_22,
  s_23,
  s_6,
  s_6_36,
  s_20,
  s_17,
  s_20,
  s_23,
  s_8,
  s_8,
  s_23,
  s_20,
  s_5,
  s_20,
  s_17,
  s_1,
  s_17,
  s_1,
  s_17,
  s_6_23,
  s_4,
  s_23,
  s_23,
  s_23,
  s_5,
  s_23,
  s_6,
  s_15,
  s_6,
  s_27,
  s_5,
  s_9,
  s_8,
  s_8,
  s_8,
  s_6,
  s_22,
  s_6,
  s_5,
  s_6,
  s_5,
  s_1,
  s_20,
  s_23,
  s_6,
  s_1_0,
  s_1_0,
  s_2,
  s_18,
  s_17,
  s_4,
  s_28,
  s_11,
  s_1,
  s_8,
  s_20,
  s_20,
  s_20,
  s_5,
  s_20,
  s_20,
  s_5,
  s_20,
  s_4,
  s_27,
  s_6,
  s_8,
  s_5,
  s_23,
  s_6_19_30,
  s_6,
  s_5,
  s_5,
  s_29,
  s_22,
  s_0,
  s_28,
  s_15,
  s_18,
  s_6,
  s_8,
  s_28,
  s_14_15,
  s_8_9_15_28_35_0,
  s_6,
  s_18,
  s_18,
  s_0,
  s_18,
  s_18,
  s_6_2_0,
  s_6,
  s_15,
  s_15,
  s_9,
  s_5,
  s_18_0,
  s_20,
  s_10_15_0,
  s_18,
  s_6,
  s_15_0,
  s_25,
  s_2_0,
  s_28,
  s_25,
  s_15,
  s_10,
  s_20,
  s_8,
  s_8,
  s_18,
  s_2,
  s_15,
  s_17,
  s_28,
  s_10_28,
  s_20,
  s_28,
  s_4_15_2_0,
  s_28_2,
  s_0,
  s_15,
  s_0,
  s_18,
  s_4_9,
  s_28,
  s_7,
  s_5,
  s_6,
  s_26_37,
  s_0,
  s_7,
  s_2,
  s_7,
  s_2_0,
  s_20,
  s_26,
  s_18_0,
  s_38,
  s_4_11_14,
  s_1,
  s_5_18,
  s_0,
  s_6,
  s_18,
  s_20,
  s_6,
  s_18,
  s_4,
  s_23,
  s_18,
  s_7,
  s_15,
  s_18_1,
  s_15,
  s_1,
  s_5,
  s_0,
  s_20_22_30,
  s_2,
  s_7_26,
  s_11_23,
  s_7_21_24,
  s_6,
  s_10,
  s_18_23,
  s_10_11,
  s_20,
  s_18,
  s_26,
  s_26,
  s_4,
  s_7,
  s_7,
  s_18_0,
  s_2,
  s_4,
  s_30_33,
  s_0,
  s_9,
  s_18,
  s_0,
  s_4,
  s_30_33,
  s_0,
  s_14_0_1,
  s_41,
  s_14,
  s_18,
  s_8,
  s_8_13_17_30_34,
  s_20,
  s_5,
  s_0,
  s_0,
  s_18,
  s_18,
  s_13,
  s_18,
  s_6,
  s_20,
  s_20,
  s_0,
  s_4_6_18_30_35_38,
  s_18,
  s_18,
  s_27,
  s_6,
  s_0,
  s_18_1,
  s_9,
  s_9,
  s_18,
  s_23_28_1,
  s_1,
  s_1,
  s_28,
  s_9,
  s_5,
  s_5_6_18,
  s_27,
  s_13_18_20,
  s_20,
  s_6,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_7,
  s_23,
  s_23,
  s_23,
  s_18,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_23,
  s_18,
  s_6,
  s_6,
  s_23_0,
  s_18,
  s_18,
  s_2,
  s_23_24_0,
  s_5,
  s_5,
  s_23,
  s_23,
  s_28,
  s_23,
  s_6,
  s_23,
  s_17,
  s_6,
  s_6,
  s_18,
  s_6_9,
  s_6,
  s_6,
  s_18,
  s_18,
  s_20,
  s_6,
  s_6,
  s_18,
  s_18,
  s_5_13,
  s_18,
  s_20,
  s_18,
  s_20,
  s_6,
  s_5,
  s_15,
  s_9,
  s_4_18_36,
  s_6_36,
  s_6_36,
  s_18,
  s_9_10_26,
  s_0,
  s_18_36_0,
  s_18,
  s_4,
  s_5,
  s_18,
  s_13_20,
  s_20,
  s_20,
  s_5,
  s_10_18_28,
  s_5,
  s_0,
  s_5,
  s_6,
  s_0,
  s_13_32_35_38,
  s_13,
  s_6,
  s_0,
  s_2,
  s_9_18_31_32_41,
  s_15,
  s_0,
  s_4,
  s_18,
  s_0,
  s_2,
  s_7,
  s_0,
  s_2,
  s_7,
  s_15,
  s_9,
  s_6_33_34,
  s_0,
  s_15,
  s_6,
  s_4,
  s_18,
  s_27_1_0,
  s_30,
  s_27,
  s_18,
  s_9,
  s_18,
  s_6,
  s_13,
  s_6,
  s_4,
  s_18,
  s_14,
  s_8,
  s_7,
  s_35_41_42,
  s_4,
  s_0,
  s_6_0,
  s_36,
  s_6_0,
  s_4,
  s_30,
  s_18,
  s_4,
  s_30,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_18,
  s_30,
  s_10_23,
  s_0,
  s_14,
  s_18_1_0,
  s_2,
  s_4,
  s_30_32,
  s_4,
  s_30_32,
  s_0,
  s_15_23_0,
  s_8,
  s_4,
  s_18,
  s_6,
  s_0,
  s_6,
  s_4_18_41,
  s_1,
  s_2,
  s_18_0,
  s_4,
  s_4_6_14,
  s_6,
  s_6,
  s_27,
  s_6,
  s_6,
  s_5_6_27,
  s_18,
  s_15,
  s_15,
  s_18,
  s_18,
  s_20,
  s_5,
  s_18_1,
  s_6,
  s_6,
  s_18_31_0,
  s_7_14_28,
  s_14,
  s_18,
  s_18,
  s_6,
  s_15,
  s_6,
  s_18_36,
  s_9_10_14,
  s_6_13_20_23_36_0,
  s_4_21,
  s_18,
  s_10,
  s_1_0,
  s_20,
  s_23,
  s_4_10,
  s_18,
  s_4_0,
  s_0,
  s_10_0,
  s_7_10_23_28_0,
  s_2,
  s_6_18,
  s_7,
  s_10,
  s_9,
  s_18,
  s_14,
  s_28,
  s_4_22,
  s_6_1,
  s_23,
  s_18,
  s_20,
  s_11,
  s_0,
  s_2,
  s_9_19,
  s_20,
  s_17_26_27_35_38_42,
  s_0,
  s_10,
  s_5,
  s_5,
  s_10,
  s_0,
  s_18_20,
  s_5,
  s_6_9_32_43,
  s_0,
  s_0,
  s_12,
  s_0,
  s_2,
  s_12,
  s_0,
  s_0,
  s_32,
  s_11,
  s_32,
  s_30,
  s_7,
  s_26,
  s_41,
  s_18,
  s_0,
  s_0,
  s_18,
  s_7_12,
  s_4,
  s_34,
  s_31,
  s_9,
  s_40,
  s_0,
  s_4,
  s_0,
  s_0,
  s_41,
  s_4,
  s_4,
  s_31,
  s_18,
  s_0,
  s_31,
  s_4,
  s_32,
  s_4_11,
  s_29_41,
  s_36,
  s_42,
  s_4,
  s_14,
  s_0,
  s_10_14,
  s_11_19,
  s_4_7,
  s_0,
  s_2,
  s_4_7,
  s_0,
  s_31,
  s_9,
  s_4_41,
  s_10,
  s_10,
  s_31,
  s_4_32,
  s_18,
  s_31,
  s_11,
  s_4,
  s_31,
  s_28,
  s_4_40,
  s_4,
  s_35,
  s_41,
  s_4,
  s_4,
  s_32_38_41,
  s_4_10,
  s_41,
  s_18,
  s_0,
  s_26,
  s_2,
  s_7,
  s_0,
  s_12_26,
  s_31,
  s_4,
  s_4,
  s_11_33,
  s_18,
  s_0,
  s_11_26,
  s_35,
  s_31,
  s_31,
  s_9_12,
  s_41,
  s_4,
  s_32_38,
  s_0,
  s_41,
  s_11_19,
  s_4,
  s_4,
  s_14,
  s_10,
  s_10,
  s_1,
  s_14,
  s_14,
  s_31,
  s_32,
  s_10,
  s_31_32,
  s_10,
  s_31,
  s_0,
  s_0,
  s_35,
  s_32_38,
  s_18,
  s_0,
  s_2,
  s_41,
  s_4,
  s_41,
  s_9_35,
  s_0,
  s_35,
  s_0,
  s_32,
  s_10,
  s_13,
  s_12,
  s_18,
  s_12,
  s_0,
  s_12,
  s_18,
  s_0,
  s_0,
  s_12,
  s_12,
  s_12,
  s_12,
  s_39,
  s_27,
  s_35,
  s_0,
  s_7,
  s_4_33_36,
  s_10_36,
  s_32,
  s_10,
  s_10,
  s_10_32,
  s_31,
  s_10,
  s_4,
  s_0,
  s_31,
  s_32_41,
  s_4_10,
  s_0,
  s_4,
  s_10_11_18_31_32_35_37_38_39_42,
  s_10,
  s_0,
  s_0,
  s_26,
  s_6,
  s_0,
  s_4_14,
  s_1,
  s_18_1,
  s_18,
  s_18,
  s_15_17,
  s_18_28,
  s_10,
  s_15,
  s_10_15_17_18,
  s_18,
  s_32,
  s_32,
  s_10,
  s_40_42,
  s_32,
  s_10,
  s_4,
  s_18,
  s_18,
  s_19_30_35_39,
  s_0,
  s_4_9_10_31,
  s_0,
  s_2,
  s_10,
  s_10,
  s_20,
  s_2,
  s_30,
  s_28,
  s_7,
  s_20,
  s_19,
  s_32,
  s_10,
  s_41,
  s_0,
  s_4,
  s_18,
  s_4,
  s_7_9_31,
  s_0,
  s_2,
  s_0,
  s_31,
  s_9_10,
  s_0,
  s_4_30_34,
  s_0,
  s_6,
  s_18,
  s_20,
  s_18,
  s_5_23,
  s_20,
  s_6_35_40,
  s_20,
  s_18,
  s_5,
  s_18,
  s_6,
  s_1,
  s_9,
  s_9,
  s_18,
  s_1,
  s_6,
  s_18,
  s_18,
  s_0,
  s_30_32,
  s_0,
  s_4_10,
  s_0,
  s_0,
  s_8,
  s_27,
  s_6,
  s_22,
  s_1,
  s_18,
  s_1,
  s_6,
  s_20,
  s_4_9,
  s_6_8,
  s_9,
  s_6,
  s_18,
  s_4_9,
  s_10_18,
  s_4_11_13_30_35_41,
  s_0,
  s_0,
  s_6_13_14,
  s_4,
  s_18,
  s_9,
  s_4_11_13_14_27,
  s_6,
  s_6,
  s_6,
  s_6,
  s_19_43,
  s_14,
  s_10,
  s_10,
  s_10,
  s_4_1,
  s_9,
  s_18,
  s_18,
  s_1,
  s_1,
  s_20,
  s_20,
  s_5,
  s_10_32,
  s_18,
  s_6,
  s_0,
  s_14_38,
  s_6,
  s_0,
  s_6,
  s_6_15_17_0,
  s_4,
  s_30_33,
  s_7,
  s_4,
  s_30_33,
  s_18,
  s_0,
  s_14,
  s_18,
  s_5,
  s_5,
  s_15,
  s_6,
  s_6,
  s_7_13_27,
  s_4_32_0,
  s_5_18,
  s_20,
  s_4_10,
  s_0,
  s_5,
  s_2,
  s_18_0,
  s_10_1_0,
  s_4_9_24,
  s_7_9_10_24_26,
  s_4_6_9_18_36_39_0,
  s_0,
  s_18,
  s_4_6,
  s_18,
  s_4,
  s_6,
  s_18_30_32_41_0,
  s_2,
  s_7,
  s_0,
  s_4_7_11,
  s_9,
  s_18,
  s_9,
  s_0,
  s_18_27,
  s_4,
  s_10_18_0,
  s_0,
  s_4,
  s_30,
  s_0,
  s_4_6_7,
  s_18,
  s_0,
  s_7,
  s_4_10,
  s_30,
  s_0,
  s_7,
  s_0,
  s_2,
  s_7,
  s_7,
  s_6,
  s_23,
  s_0,
  s_4_6_11_24,
  s_0,
  s_8_10_18,
  s_30,
  s_18,
  s_6,
  s_8,
  s_0,
  s_2,
  s_7,
  s_18,
  s_14,
  s_0,
  s_30_32_36,
  s_0,
  s_4_10,
  s_6_9,
  s_23,
  s_20,
  s_15,
  s_15,
  s_18,
  s_18_25,
  s_6,
  s_18,
  s_18,
  s_18_1,
  s_9,
  s_28,
  s_10_15_18,
  s_8_10_18,
  s_10_18,
  s_17,
  s_18,
  s_20,
  s_14_23,
  s_30_38_41,
  s_18,
  s_18,
  s_6_0,
  s_0,
  s_30_35,
  s_6,
  s_4,
  s_2,
  s_26,
  s_26,
  s_30,
  s_30,
  s_5,
  s_10_15_18,
  s_9,
  s_5,
  s_11,
  s_10,
  s_23,
  s_5,
  s_1,
  s_7,
  s_8_0_1,
  s_7,
  s_13,
  s_6_7_13_20_22_25_27_30_31_35_36,
  s_0,
  s_15,
  s_6,
  s_0,
  s_30,
  s_7,
  s_4_6,
  s_15,
  s_1,
  s_0,
  s_5_6_7_13_18_23,
  s_18,
  s_0_1,
  s_27,
  s_17,
  s_6,
  s_37_41,
  s_4,
  s_18,
  s_5,
  s_18,
  s_6,
  s_15,
  s_15,
  s_18,
  s_18,
  s_20,
  s_5,
  s_5,
  s_4_26,
  s_30_37,
  s_20,
  s_5,
  s_5,
  s_26,
  s_5,
  s_5,
  s_18_41,
  s_18,
  s_5,
  s_18,
  s_5_18,
  s_15,
  s_5,
  s_5,
  s_15_18,
  s_22_29,
  s_0,
  s_5,
  s_22,
  s_2,
  s_15,
  s_20,
  s_5,
  s_27,
  s_27,
  s_18,
  s_15,
  s_13_20,
  s_7_9_19_28,
  s_0,
  s_2,
  s_0,
  s_2,
  s_0,
  s_2,
  s_7,
  s_7,
  s_4,
  s_18,
  s_18,
  s_18,
  s_20,
  s_18,
  s_5,
  s_5,
  s_5,
  s_18,
  s_10_18_28,
  s_15,
  s_18_1,
  s_15,
  s_5_23_27,
  s_5,
  s_0,
  s_26,
  s_5_18,
  s_0,
  s_0,
  s_0,
  s_9,
  s_18,
  s_14,
  s_20,
  s_20,
  s_10,
  s_23,
  s_6,
  s_18_0,
  s_0,
  s_7,
  s_1,
  s_5,
  s_0,
  s_2,
  s_27,
  s_28,
  s_18,
  s_0,
  s_18_1,
  s_5,
  s_5_1,
  s_5,
  s_20,
  s_0,
  s_18,
  s_9,
  s_18,
  s_1,
  s_4,
  s_41,
  s_4,
  s_41,
  s_21,
  s_6,
  s_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_9_18,
  s_4_0,
  s_18,
  s_20,
  s_18_40,
  s_13_20,
  s_23,
  s_18_1,
  s_15,
  s_10_18_1,
  s_26,
  s_10,
  s_26,
  s_18_1,
  s_5,
  s_5_6,
  s_35,
  s_35,
  s_0,
  s_10,
  s_20,
  s_20,
  s_20,
  s_26,
  s_32,
  s_9,
  s_6,
  s_1,
  s_10,
  s_5_6_18_39,
  s_4,
  s_0,
  s_18,
  s_18,
  s_5_18_35,
  s_20,
  s_5_13,
  s_0,
  s_20,
  s_18,
  s_26_0,
  s_27,
  s_1,
  s_8,
  s_5,
  s_5,
  s_1,
  s_20,
  s_1,
  s_5,
  s_26,
  s_26,
  s_18,
  s_0_1,
  s_26,
  s_6_0,
  s_26,
  s_0,
  s_0,
  s_6,
  s_0,
  s_0,
  s_17,
  s_0,
  s_0,
  s_27_1,
  s_20,
  s_20,
  s_20,
  s_20,
  s_0,
  s_14,
  s_4,
  s_6,
  s_8,
  s_26,
  s_18,
  s_0,
  s_0,
  s_5,
  s_5,
  s_10,
  s_0,
  s_0,
  s_18,
  s_0,
  s_26,
  s_26,
  s_22,
  s_0,
  s_10,
  s_10,
  s_0,
  s_18,
  s_0,
  s_26,
  s_5,
  s_27,
  s_0,
  s_4,
  s_18_0,
  s_2,
  s_6,
  s_0,
  s_18,
  s_10,
  s_32,
  s_32,
  s_16,
  s_18,
  s_0,
  s_27,
  s_1,
  s_5,
  s_1,
  s_26,
  s_17,
  s_0,
  s_0,
  s_26,
  s_0,
  s_10,
  s_18,
  s_18_1,
  s_1,
  s_9,
  s_6,
  s_26,
  s_0,
  s_4,
  s_40_41,
  s_18,
  s_18,
  s_0,
  s_4,
  s_40_41,
  s_18,
  s_4_26,
  s_26,
  s_0,
  s_6,
  s_26,
  s_26,
  s_27,
  s_27,
  s_0,
  s_7,
  s_26,
  s_0,
  s_2,
  s_10,
  s_9,
  s_18,
  s_0,
  s_9,
  s_10_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_5,
  s_5,
  s_20,
  s_20,
  s_6_14,
  s_1,
  s_0,
  s_0,
  s_0,
  s_27,
  s_1,
  s_15_18,
  s_15,
  s_8,
  s_18,
  s_18,
  s_19_28,
  s_5_18,
  s_13_20,
  s_6_10,
  s_11_18,
  s_0,
  s_2,
  s_6,
  s_18,
  s_18,
  s_15,
  s_18,
  s_1,
  s_4,
  s_15,
  s_15,
  s_15,
  s_18,
  s_18,
  s_18,
  s_18,
  s_15,
  s_18,
  s_20,
  s_18,
  s_18,
  s_15_18,
  s_28,
  s_0,
  s_10_2_0,
  s_20,
  s_15,
  s_15,
  s_13,
  s_15,
  s_15,
  s_18_1,
  s_6_15,
  s_1_0,
  s_31,
  s_31,
  s_11_32,
  s_18_40,
  s_18,
  s_12_24_26,
  s_2,
  s_7_12,
  s_18_0,
  s_21,
  s_17_18_19_28_39_41,
  s_19,
  s_26,
  s_5,
  s_20,
  s_13_20,
  s_18,
  s_2,
  s_0,
  s_19_41,
  s_18,
  s_0,
  s_0,
  s_20,
  s_5,
  s_13_19_30,
  s_18,
  s_27,
  s_0,
  s_4,
  s_20,
  s_0,
  s_17_18_35,
  s_4_15_21,
  s_5,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_6_15,
  s_9_1,
  s_17,
  s_20,
  s_5,
  s_20,
  s_4_32_0,
  s_6_29_35,
  s_6,
  s_18_37_38,
  s_6,
  s_26,
  s_18,
  s_18,
  s_4,
  s_10,
  s_6,
  s_20,
  s_1,
  s_17,
  s_10_0,
  s_7_26,
  s_4_10,
  s_30_32,
  s_4_10,
  s_18,
  s_0,
  s_7_16,
  s_4_10,
  s_30_32,
  s_10,
  s_2,
  s_16,
  s_17,
  s_26_28,
  s_15,
  s_1,
  s_5,
  s_0,
  s_7_9_24,
  s_2,
  s_7_9,
  s_0,
  s_26,
  s_1,
  s_10,
  s_20,
  s_20,
  s_0,
  s_2,
  s_7,
  s_27_0,
  s_10_18,
  s_10_18,
  s_10_18,
  s_18_0_2,
  s_6,
  s_20,
  s_13_20,
  s_2,
  s_9,
  s_1,
  s_5_18,
  s_0,
  s_27,
  s_15,
  s_23,
  s_6,
  s_0,
  s_6,
  s_18,
  s_18_1,
  s_9,
  s_14,
  s_28,
  s_10_11_28,
  s_18,
  s_18_1,
  s_15_27,
  s_15_18,
  s_5,
  s_0,
  s_9,
  s_0,
  s_2,
  s_7_12,
  s_18,
  s_30,
  s_22,
  s_26,
  s_10,
  s_1,
  s_18,
  s_6,
  s_6,
  s_22,
  s_1,
  s_1,
  s_2,
  s_9,
  s_10,
  s_1,
  s_9,
  s_9,
  s_18,
  s_18,
  s_18,
  s_18,
  s_15,
  s_28,
  s_18,
  s_10_18,
  s_13_23,
  s_3_0,
  s_7_28,
  s_2,
  s_6_27_35,
  s_6,
  s_21_40,
  s_0,
  s_18,
  s_18,
  s_18,
  s_6_35,
  s_18,
  s_4_11_12_19,
  s_0,
  s_29_37,
  s_0,
  s_18,
  s_6_35,
  s_7_21,
  s_18,
  s_6_1,
  s_5,
  s_20,
  s_6_9_10_26_1,
  s_26,
  s_10,
  s_18,
  s_5,
  s_15,
  s_13,
  s_18,
  s_38,
  s_38,
  s_14,
  s_18_1,
  s_6,
  s_5,
  s_5,
  s_20,
  s_14,
  s_18,
  s_18,
  s_0,
  s_0,
  s_0_2,
  s_13,
  s_2,
  s_15,
  s_4_10,
  s_5,
  s_5,
  s_27,
  s_6,
  s_10,
  s_5,
  s_6_40,
  s_9_18_27_29_41,
  s_10,
  s_18,
  s_24,
  s_15,
  s_0,
  s_0,
  s_7,
  s_2_0,
  s_18,
  s_20,
  s_33_0,
  s_0,
  s_6_9_10,
  s_18_0,
  s_8,
  s_4_7,
  s_4_10_11_19_26_32,
  s_1,
  s_0,
  s_2,
  s_26,
  s_36,
  s_0,
  s_4_0,
  s_3_4_26,
  s_1,
  s_0,
  s_16,
  s_3_6_10_0,
  s_0,
  s_7,
  s_6_14_30_0,
  s_5,
  s_8,
  s_6_17_38_0,
  s_6_38,
  s_6_38,
  s_6,
  s_14,
  s_6,
  s_6,
  s_6_38,
  s_4,
  s_18,
  s_0,
  s_0,
  s_4,
  s_4,
  s_30,
  s_0,
  s_18,
  s_4,
  s_30_40,
  s_0,
  s_0,
  s_18,
  s_18,
  s_6,
  s_6,
  s_15,
  s_6,
  s_18,
  s_7_30_36,
  s_0,
  s_4,
  s_10,
  s_10,
  s_5,
  s_5,
  s_18,
  s_15,
  s_6_7_13_20_22_25_27_36,
  s_6,
  s_30,
  s_4_6,
  s_0,
  s_6,
  s_15,
  s_22_29,
  s_5,
  s_22,
  s_4_6_14_17_36,
  s_4_5_6_17_30_35_36_38,
  s_17_23,
  s_18_38,
  s_4,
  s_0,
  s_17,
  s_18,
  s_0,
  s_18,
  s_18,
  s_14,
  s_6_11,
  s_37,
  s_18,
  s_0,
  s_2,
  s_12,
  s_4_26_0,
  s_5_6_18_26_35_38,
  s_0,
  s_6,
  s_5,
  s_4_6,
  s_1_0,
  s_13,
  s_6_13_29,
  s_18,
  s_8,
  s_8,
  s_1_0,
  s_6_8_10_17_18_32_35,
  s_5,
  s_13_23,
  s_0,
  s_0,
  s_5,
  s_6_18,
  s_27,
  s_13,
  s_7,
  s_21_0,
  s_7,
  s_4_29_30_32_33_36_37_38_40_41,
  s_0,
  s_0,
  s_4_6_9_10_11_14_19_22,
  s_14_18,
  s_10,
  s_18,
  s_4,
  s_0,
  s_2,
  s_6_29_35,
  s_6,
  s_0,
  s_7,
  s_18,
  s_18_1,
  s_15,
  s_10_18,
  s_1,
  s_1,
  s_13,
  s_4,
  s_28,
  s_8,
  s_10,
  s_23,
  s_4,
  s_27,
  s_10,
  s_14,
  s_20,
  s_14,
  s_10,
  s_28,
  s_13,
  s_27,
  s_28,
  s_18,
  s_18,
  s_18,
  s_23_0_2,
  s_7,
  s_1,
  s_27,
  s_0,
  s_27,
  s_1,
  s_1,
  s_27_30_35_38,
  s_14,
  s_14,
  s_23,
  s_32,
  s_18,
  s_10,
  s_0,
  s_1,
  s_27_1,
  s_1,
  s_27,
  s_26,
  s_1,
  s_20,
  s_20,
  s_20,
  s_8,
  s_1,
  s_1,
  s_1,
  s_26,
  s_20,
  s_8,
  s_10_27_35,
  s_5_13,
  s_5,
  s_0,
  s_7_9_26,
  s_26_31_35,
  s_0,
  s_0,
  s_30_31_35_0,
  s_6,
  s_6,
  s_4,
  s_5,
  s_11,
  s_18,
  s_5,
  s_35,
  s_15,
  s_13,
  s_13,
  s_18,
  s_4_6_41,
  s_13,
  s_6_35_39,
  s_0,
  s_6,
  s_6_18,
  s_6_8_18_23_40,
  s_23,
  s_18,
  s_18,
  s_26,
  s_4,
  s_18,
  s_0,
  s_5,
  s_5,
  s_5,
  s_6,
  s_20,
  s_18,
  s_18,
  s_18_1,
  s_9,
  s_18,
  s_28,
  s_28,
  s_20,
  s_18,
  s_5,
  s_14,
  s_14,
  s_14,
  s_14,
  s_14,
  s_18,
  s_14,
  s_14,
  s_18,
  s_18,
  s_15,
  s_6,
  s_15,
  s_18,
  s_13_20,
  s_6_35,
  s_21_40_41,
  s_5_6,
  s_18,
  s_7_26,
  s_0,
  s_2,
  s_7,
  s_15_17_31_39,
  s_18,
  s_18,
  s_20,
  s_6_18,
  s_5_13,
  s_5,
  s_13,
  s_13,
  s_6,
  s_0,
  s_5,
  s_5,
  s_5,
  s_0,
  s_9,
  s_0,
  s_0,
  s_0,
  s_0,
  s_1,
  s_9,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_2,
  s_7,
  s_20,
  s_0,
  s_0,
  s_0,
  s_2,
  s_1,
  s_0,
  s_10,
  s_0,
  s_9_1,
  s_1,
  s_0,
  s_0,
  s_1,
  s_9_0,
  s_6_10_0,
  s_6,
  s_23,
  s_4_22,
  s_0,
  s_2,
  s_7,
  s_0,
  s_23,
  s_29_30_31_2,
  s_0,
  s_22,
  s_6,
  s_22,
  s_0,
  s_0,
  s_28,
  s_0,
  s_0,
  s_0,
  s_14_23,
  s_0,
  s_7,
  s_26,
  s_26,
  s_0,
  s_0,
  s_14,
  s_13,
  s_10,
  s_7_18_20_0,
  s_15,
  s_10_32_34,
  s_18,
  s_4_10,
  s_18,
  s_10,
  s_5,
  s_4_26,
  s_30_40_42,
  s_8_18,
  s_26,
  s_9,
  s_4_18_34,
  s_18,
  s_13,
  s_18,
  s_18,
  s_15,
  s_10,
  s_0,
  s_2,
  s_7,
  s_7,
  s_13_20,
  s_13_20,
  s_15,
  s_1_0,
  s_14_15,
  s_2,
  s_7,
  s_0,
  s_2,
  s_10,
  s_6_40,
  s_20,
  s_20,
  s_20,
  s_10,
  s_18,
  s_5,
  s_20,
  s_5,
  s_17,
  s_5,
  s_6_1,
  s_18,
  s_27,
  s_4_30_41,
  s_0,
  s_18,
  s_18,
  s_18,
  s_0,
  s_2,
  s_7_12,
  s_18,
  s_5,
  s_18,
  s_5_1,
  s_15,
  s_26_30,
  s_2,
  s_7_26,
  s_0,
  s_15,
  s_10_11_26_32,
  s_11,
  s_18,
  s_10_11_0,
  s_0,
  s_5,
  s_13,
  s_26,
  s_17_18,
  s_5,
  s_18,
  s_17,
  s_5,
  s_20,
  s_20,
  s_20,
  s_5_17,
  s_13,
  s_13,
  s_13_20,
  s_13_20,
  s_5,
  s_20,
  s_13_15_20,
  s_13,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_7_8_18_38,
  s_18,
  s_4,
  s_18,
  s_5,
  s_18_27_1,
  s_15,
  s_0_1,
  s_7_26,
  s_8,
  s_1,
  s_8,
  s_10,
  s_9_18_31,
  s_18,
  s_6,
  s_6,
  s_10,
  s_10,
  s_4_10_13_17_38,
  s_18,
  s_7,
  s_13_19_20_30_35,
  s_0,
  s_18,
  s_4_9_10,
  s_10_0_1,
  s_7,
  s_2,
  s_7,
  s_18,
  s_9,
  s_1,
  s_2,
  s_18,
  s_9,
  s_9_0,
  s_2,
  s_6,
  s_9_27,
  s_20,
  s_5_13,
  s_6,
  s_18,
  s_9_14,
  s_10_18,
  s_7,
  s_13_20,
  s_10_18,
  s_10_15_18,
  s_5_27,
  s_20,
  s_0,
  s_18_1,
  s_18,
  s_9_14,
  s_6,
  s_6,
  s_5,
  s_5,
  s_26,
  s_5,
  s_26_35,
  s_5_13,
  s_18,
  s_26,
  s_32,
  s_11,
  s_18,
  s_18,
  s_0,
  s_7_13_17_0,
  s_8,
  s_0,
  s_8,
  s_0,
  s_17,
  s_5,
  s_13_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4_14_32_35,
  s_28,
  s_7,
  s_0,
  s_7,
  s_0,
  s_7,
  s_1,
  s_17,
  s_11,
  s_1,
  s_6,
  s_5_18_1,
  s_30,
  s_11_18,
  s_1,
  s_1,
  s_14,
  s_23,
  s_6_18_39_0,
  s_0,
  s_2,
  s_7_26,
  s_29_30,
  s_0,
  s_4_11,
  s_18,
  s_5,
  s_18,
  s_0,
  s_20,
  s_4_41,
  s_20,
  s_26,
  s_27,
  s_18,
  s_5,
  s_10_11_32,
  s_18,
  s_10_11,
  s_13,
  s_5,
  s_18,
  s_0,
  s_24,
  s_0,
  s_24,
  s_2,
  s_24,
  s_6,
  s_18,
  s_18,
  s_18,
  s_17,
  s_17,
  s_5_6_35_39_40,
  s_18,
  s_0,
  s_18,
  s_15,
  s_10,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_1,
  s_15,
  s_26,
  s_20,
  s_15,
  s_1,
  s_18,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18,
  s_9,
  s_6,
  s_18,
  s_18,
  s_4,
  s_5,
  s_5,
  s_5,
  s_26,
  s_6,
  s_27,
  s_5,
  s_5,
  s_5,
  s_5,
  s_4,
  s_6,
  s_26,
  s_8,
  s_1,
  s_27,
  s_1,
  s_27,
  s_1,
  s_22,
  s_22,
  s_26,
  s_8,
  s_8,
  s_26,
  s_6,
  s_4,
  s_1,
  s_26,
  s_26,
  s_23,
  s_26,
  s_27,
  s_27,
  s_5,
  s_18,
  s_5,
  s_5,
  s_5,
  s_23,
  s_5,
  s_5,
  s_1,
  s_26,
  s_26,
  s_8,
  s_5,
  s_26,
  s_26,
  s_8,
  s_8,
  s_27,
  s_26,
  s_10,
  s_1,
  s_9,
  s_26,
  s_26,
  s_8,
  s_5,
  s_19,
  s_1,
  s_26,
  s_18,
  s_26,
  s_0,
  s_5,
  s_26,
  s_27,
  s_4_26,
  s_26,
  s_20,
  s_6_1,
  s_5,
  s_4,
  s_26,
  s_1,
  s_20,
  s_20,
  s_18,
  s_23_0,
  s_23,
  s_23,
  s_23,
  s_5,
  s_5,
  s_20,
  s_20,
  s_20,
  s_20,
  s_8,
  s_4,
  s_4,
  s_4,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_0,
  s_5,
  s_0,
  s_20,
  s_1,
  s_5,
  s_5,
  s_18,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_12,
  s_6,
  s_12,
  s_26,
  s_0,
  s_15,
  s_0,
  s_2,
  s_9_10,
  s_18_1_0,
  s_1_0,
  s_2,
  s_5,
  s_9,
  s_4_6_9,
  s_0,
  s_10,
  s_30_31,
  s_0,
  s_7,
  s_10,
  s_1_0,
  s_0,
  s_30_31,
  s_30_31,
  s_0,
  s_0,
  s_10,
  s_30_36,
  s_18,
  s_10,
  s_30_36,
  s_9_14,
  s_15,
  s_5,
  s_5,
  s_5,
  s_26,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_5,
  s_26,
  s_26,
  s_26,
  s_20,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_5,
  s_13,
  s_35,
  s_20,
  s_15,
  s_18,
  s_18,
  s_20,
  s_18,
  s_6,
  s_14,
  s_6,
  s_13,
  s_17,
  s_27,
  s_1_0,
  s_27,
  s_23,
  s_15_26,
  s_6,
  s_27,
  s_5,
  s_6,
  s_6,
  s_4,
  s_15,
  s_5_18_31_32_37,
  s_10,
  s_20,
  s_15,
  s_10,
  s_15,
  s_20,
  s_18,
  s_0,
  s_20,
  s_15,
  s_10_18,
  s_10_18,
  s_18_20,
  s_20,
  s_20,
  s_0,
  s_20,
  s_18_0,
  s_10,
  s_6_8_23_33_35_40_41,
  s_6,
  s_18,
  s_6,
  s_6,
  s_20,
  s_6,
  s_23,
  s_15,
  s_18,
  s_0,
  s_2,
  s_7,
  s_7,
  s_7,
  s_5,
  s_20,
  s_20,
  s_15,
  s_0,
  s_2,
  s_7_26,
  s_20,
  s_15,
  s_15,
  s_6,
  s_6,
  s_6,
  s_6,
  s_6,
  s_4_10_14_18_26_31_32_41,
  s_32,
  s_20,
  s_0,
  s_26,
  s_2,
  s_6,
  s_18,
  s_10,
  s_18,
  s_15,
  s_18_1,
  s_4_10_0,
  s_6,
  s_18,
  s_17,
  s_15,
  s_18,
  s_18,
  s_15,
  s_13_17_18,
  s_15,
  s_18,
  s_18,
  s_10,
  s_15,
  s_15,
  s_27,
  s_5,
  s_26,
  s_15,
  s_6,
  s_15,
  s_18,
  s_15,
  s_5_18,
  s_1,
  s_26,
  s_23,
  s_23,
  s_23,
  s_5,
  s_26,
  s_28,
  s_9,
  s_27,
  s_23,
  s_18,
  s_15,
  s_10_18,
  s_13,
  s_15,
  s_18,
  s_18,
  s_4_6_7_28_29,
  s_20,
  s_20,
  s_27,
  s_8,
  s_6,
  s_6,
  s_27,
  s_27,
  s_27,
  s_27,
  s_18,
  s_6,
  s_15,
  s_4_13_18,
  s_1,
  s_15,
  s_0,
  s_0,
  s_6_0,
  s_18,
  s_4,
  s_6,
  s_6,
  s_5,
  s_6,
  s_14,
  s_20,
  s_18,
  s_6,
  s_7,
  s_7,
  s_18,
  s_0,
  s_18_20,
  s_18,
  s_26,
  s_6_18_1,
  s_9,
  s_4,
  s_6_1_0,
  s_29,
  s_0,
  s_0,
  s_29,
  s_0,
  s_0,
  s_4,
  s_6,
  s_6,
  s_20,
  s_20,
  s_6,
  s_6,
  s_1,
  s_8,
  s_18_32_37,
  s_32,
  s_10,
  s_10_0,
  s_18,
  s_17_30_31_0,
  s_6,
  s_0,
  s_4_7_22_0,
  s_2,
  s_7_9,
  s_20,
  s_6,
  s_5,
  s_5,
  s_5,
  s_0,
  s_14,
  s_8_10_1_0,
  s_32,
  s_5,
  s_10,
  s_32,
  s_7,
  s_10,
  s_32,
  s_2,
  s_11,
  s_11,
  s_0,
  s_6,
  s_4_15,
  s_18,
  s_15,
  s_8,
  s_1,
  s_8,
  s_15,
  s_17_18,
  s_18,
  s_2,
  s_7_26,
  s_13_20,
  s_0,
  s_5,
  s_15_1,
  s_28,
  s_5,
  s_4,
  s_18,
  s_6,
  s_15,
  s_8,
  s_5,
  s_14_18,
  s_18_0_1,
  s_4,
  s_30,
  s_7_9_12,
  s_18_0,
  s_0,
  s_14_26,
  s_4,
  s_30,
  s_2,
  s_26,
  s_2_0,
  s_3_18_0,
  s_7,
  s_9_10,
  s_18_1,
  s_1,
  s_9_11,
  s_14,
  s_26,
  s_1,
  s_5,
  s_27,
  s_18,
  s_32,
  s_5,
  s_2,
  s_7,
  s_0,
  s_4_10_18_0,
  s_4_7,
  s_30,
  s_0,
  s_9_14,
  s_18,
  s_0,
  s_4_7,
  s_30_32,
  s_0,
  s_2,
  s_7,
  s_7_9_17_18,
  s_4,
  s_18,
  s_1,
  s_18,
  s_4,
  s_4,
  s_20,
  s_5,
  s_4_23,
  s_2,
  s_7,
  s_0,
  s_6,
  s_6,
  s_26,
  s_15,
  s_18_1,
  s_12_26,
  s_6,
  s_37_39,
  s_0,
  s_0,
  s_7,
  s_0,
  s_4,
  s_1,
  s_5,
  s_5_6,
  s_10_18,
  s_10_18,
  s_1,
  s_6,
  s_4,
  s_6,
  s_8_15,
  s_8_0,
  s_7,
  s_0,
  s_38,
  s_4,
  s_1,
  s_18,
  s_18,
  s_18,
  s_7_14,
  s_18,
  s_14,
  s_10_2,
  s_18,
  s_10,
  s_18_1,
  s_15,
  s_15,
  s_18_1,
  s_22,
  s_30,
  s_14,
  s_18,
  s_14,
  s_24,
  s_24,
  s_14,
  s_10,
  s_15,
  s_5_1_0,
  s_5_1_0,
  s_1,
  s_11,
  s_18_1,
  s_38_0_2,
  s_2_0,
  s_2,
  s_2,
  s_2,
  s_7,
  s_6,
  s_0,
  s_26,
  s_0,
  s_29_30,
  s_2,
  s_7_26,
  s_5,
  s_18,
  s_18,
  s_6,
  s_24,
  s_10,
  s_24,
  s_18,
  s_15,
  s_18,
  s_6_18,
  s_18,
  s_7_17_26_27,
  s_1_0,
  s_17,
  s_6,
  s_6,
  s_0,
  s_1_0,
  s_2,
  s_26,
  s_2,
  s_17_0,
  s_18,
  s_42,
  s_0,
  s_17_26,
  s_6_8_13_17_35,
  s_17,
  s_6,
  s_6,
  s_0,
  s_18,
  s_6,
  s_4_6,
  s_6,
  s_0,
  s_6,
  s_0,
  s_6,
  s_6,
  s_6,
  s_6,
  s_19,
  s_10,
  s_22,
  s_18,
  s_9,
  s_16,
  s_1_0,
  s_1,
  s_4,
  s_4,
  s_16,
  s_16,
  s_15,
  s_4,
  s_29,
  s_19,
  s_1,
  s_13_27,
  s_1,
  s_13_20,
  s_0,
  s_20,
  s_5,
  s_15,
  s_0,
  s_3_17_26_34_42,
  s_0,
  s_18,
  s_0,
  s_2,
  s_7_26,
  s_6_20_32_35,
  s_20,
  s_4_6,
  s_0,
  s_5,
  s_0,
  s_6,
  s_0,
  s_2,
  s_18,
  s_20,
  s_4_6,
  s_18,
  s_2,
  s_14_0,
  s_18,
  s_20,
  s_8,
  s_0,
  s_2,
  s_7,
  s_6,
  s_18,
  s_15,
  s_5,
  s_30_31_32_42,
  s_10,
  s_6_10_41_0,
  s_2,
  s_7_24,
  s_7,
  s_18,
  s_7_24,
  s_17,
  s_15,
  s_6,
  s_4_7_9_26_31_41,
  s_0,
  s_18,
  s_0,
  s_2,
  s_7,
  s_6,
  s_6,
  s_4_7,
  s_0,
  s_2,
  s_0,
  s_32_38_40_41,
  s_0,
  s_18,
  s_32_38,
  s_4_10,
  s_18,
  s_18,
  s_18,
  s_9,
  s_18_0,
  s_18,
  s_13,
  s_10,
  s_18,
  s_11_32,
  s_17_18_42,
  s_14_15_23,
  s_0,
  s_7,
  s_0,
  s_17_18_42,
  s_14_15,
  s_7,
  s_0,
  s_0,
  s_15,
  s_5,
  s_6,
  s_4_18,
  s_20,
  s_20,
  s_5,
  s_5,
  s_5,
  s_6,
  s_15,
  s_5,
  s_5,
  s_5,
  s_5,
  s_18_26,
  s_20,
  s_10,
  s_10,
  s_10,
  s_0,
  s_6,
  s_5,
  s_0,
  s_0,
  s_9,
  s_18_1,
  s_1,
  s_4,
  s_18,
  s_9,
  s_18,
  s_8,
  s_1,
  s_27,
  s_8,
  s_14,
  s_5,
  s_20,
  s_20,
  s_18_0,
  s_9,
  s_6,
  s_28_1,
  s_4_10,
  s_18,
  s_4_10,
  s_6,
  s_5,
  s_27,
  s_1,
  s_18,
  s_9,
  s_8,
  s_26,
  s_5,
  s_18_20,
  s_22,
  s_26,
  s_1,
  s_9,
  s_18,
  s_18,
  s_27,
  s_14,
  s_17,
  s_6,
  s_6,
  s_1,
  s_1,
  s_9,
  s_5,
  s_26,
  s_5,
  s_15,
  s_18_1,
  s_10_18_1,
  s_20,
  s_20,
  s_20,
  s_27,
  s_27,
  s_27,
  s_20,
  s_18,
  s_9,
  s_6,
  s_26,
  s_4,
  s_27,
  s_1,
  s_26,
  s_26,
  s_26,
  s_26,
  s_20,
  s_17,
  s_26,
  s_9,
  s_8,
  s_26,
  s_5,
  s_5,
  s_26,
  s_26,
  s_26,
  s_26,
  s_4,
  s_0,
  s_27,
  s_18,
  s_20,
  s_5,
  s_4,
  s_18,
  s_17_18,
  s_27,
  s_18,
  s_18,
  s_18,
  s_18,
  s_5,
  s_1_0,
  s_5,
  s_5,
  s_5,
  s_20,
  s_18,
  s_18,
  s_5,
  s_18,
  s_18,
  s_18,
  s_7_8_37,
  s_0,
  s_2,
  s_7,
  s_20,
  s_7_26,
  s_18,
  s_2,
  s_1_0,
  s_2,
  s_7_12_26,
  s_5_20,
  s_8,
  s_0,
  s_9,
  s_0,
  s_5,
  s_17,
  s_13,
  s_18,
  s_6_14_15_17_35_42,
  s_5_18,
  s_4_35_42,
  s_0,
  s_5_18,
  s_5_18,
  s_18_1,
  s_9,
  s_18,
  s_6_21_35_36_40_0,
  s_4,
  s_0,
  s_18,
  s_15,
  s_0,
  s_9,
  s_4_18,
  s_0,
  s_32,
  s_18,
  s_10,
  s_35_0,
  s_0,
  s_4_6,
  s_20_37_39,
  s_0,
  s_0,
  s_6_14_32,
  s_0,
  s_18,
  s_1,
  s_26,
  s_1,
  s_26,
  s_26,
  s_18_1,
  s_4,
  s_8,
  s_26,
  s_26,
  s_26,
  s_1,
  s_1,
  s_9,
  s_1_2,
  s_18,
  s_9,
  s_8,
  s_26,
  s_27,
  s_26,
  s_1,
  s_26,
  s_8,
  s_9,
  s_26,
  s_26,
  s_22,
  s_1,
  s_8,
  s_8,
  s_1,
  s_8,
  s_8,
  s_8,
  s_6,
  s_18,
  s_9,
  s_1,
  s_1,
  s_18,
  s_9,
  s_27,
  s_26,
  s_4,
  s_1,
  s_0,
  s_1,
  s_8,
  s_1,
  s_1,
  s_6,
  s_26,
  s_1,
  s_9,
  s_8,
  s_8,
  s_4,
  s_1,
  s_9,
  s_1,
  s_9,
  s_5,
  s_5,
  s_5,
  s_26,
  s_9,
  s_18,
  s_26,
  s_20,
  s_18,
  s_4,
  s_26,
  s_18_0_1,
  s_2,
  s_26,
  s_1,
  s_27,
  s_27,
  s_5,
  s_1,
  s_4,
  s_10_29_0,
  s_0,
  s_4,
  s_18_0,
  s_4_22,
  s_30_33_35,
  s_0,
  s_10,
  s_18,
  s_4_7_9,
  s_4_22,
  s_30_33_35_41,
  s_0,
  s_17,
  s_17,
  s_26,
  s_8,
  s_8,
  s_17,
  s_15,
  s_18,
  s_17,
  s_18,
  s_2,
  s_2,
  s_2,
  s_6,
  s_15,
  s_7,
  s_0_2,
  s_10,
  s_15,
  s_18,
  s_18_0,
  s_15,
  s_15,
  s_18,
  s_18,
  s_6,
  s_0,
  s_0,
  s_5_15,
  s_6,
  s_2,
  s_18,
  s_18,
  s_4_6,
  s_7,
  s_15,
  s_7_10,
  s_18,
  s_18,
  s_10,
  s_10,
  s_18,
  s_18,
  s_10,
  s_0,
  s_10,
  s_18,
  s_18,
  s_6_10_14_27,
  s_4,
  s_18,
  s_18,
  s_4,
  s_18,
  s_27,
  s_18,
  s_10,
  s_6_14,
  s_10,
  s_6,
  s_18,
  s_18,
  s_7,
  s_0,
  s_18,
  s_0,
  s_5,
  s_18_23,
  s_18_1,
  s_2_0,
  s_14_24,
  s_18,
  s_14,
  s_10_18,
  s_14,
  s_27,
  s_14,
  s_26,
  s_23,
  s_10,
  s_23,
  s_27,
  s_17,
  s_15,
  s_5_6,
  s_0,
  s_4_23_34_35,
  s_18,
  s_18,
  s_10,
  s_6,
  s_6,
  s_14_15,
  s_1,
  s_20,
  s_15,
  s_18_1,
  s_15_0,
  s_2,
  s_1,
  s_7,
  s_7_10,
  s_6_25_26,
  s_18,
  s_27,
  s_4_6_7_29_30_35,
  s_21_27_35,
  s_6,
  s_11_32,
  s_18,
  s_6,
  s_10_32,
  s_18,
  s_15,
  s_20,
  s_27,
  s_29,
  s_4,
  s_29,
  s_4,
  s_14,
  s_15,
  s_22,
  s_26,
  s_0,
  s_0,
  s_20,
  s_20,
  s_20,
  s_17_26,
  s_18,
  s_18,
  s_18,
  s_20,
  s_18,
  s_6,
  s_9,
  s_0,
  s_0,
  s_20,
  s_15_17,
  s_15,
  s_18_1,
  s_18_1,
  s_18,
  s_7,
  s_0,
  s_7,
  s_32_37,
  s_18,
  s_0,
  s_0_2,
  s_2,
  s_2,
  s_18_26_28,
  s_18,
  s_4_6_13,
  s_6,
  s_6,
  s_5,
  s_6,
  s_0,
  s_28,
  s_6,
  s_5_18,
  s_6,
  s_5_18,
  s_5,
  s_4,
  s_0,
  s_2_0,
  s_9_26,
  s_0,
  s_18,
  s_20,
  s_6,
  s_6,
  s_6,
  s_28,
  s_5,
  s_6,
  s_4,
  s_20,
  s_14,
  s_15,
  s_23,
  s_9_26,
  s_18,
  s_1,
  s_26,
  s_15,
  s_14,
  s_18,
  s_15,
  s_18,
  s_23,
  s_17,
  s_5,
  s_10_1,
  s_1,
  s_18,
  s_4,
  s_0,
  s_7_9,
  s_20,
  s_2,
  s_7_17,
  s_18,
  s_7,
  s_18,
  s_5,
  s_18,
  s_18,
  s_18,
  s_6_14_23_0,
  s_2_0,
  s_21,
  s_0,
  s_6,
  s_4,
  s_23,
  s_23_0,
  s_24_0,
  s_28,
  s_24_0,
  s_23_0,
  s_15,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_18,
  s_14_18,
  s_4,
  s_4,
  s_18,
  s_18,
  s_18,
  s_6,
  s_23_24_0,
  s_18,
  s_18,
  s_18,
  s_18,
  s_27,
  s_27,
  s_17,
  s_4_7_9_18_23_35,
  s_13_20,
  s_5_18,
  s_0,
  s_6_8,
  s_15,
  s_18_1,
  s_0,
  s_14,
  s_18,
  s_6,
  s_15_26,
  s_28,
  s_18,
  s_0,
  s_28,
  s_14,
  s_4,
  s_5_23,
  s_5,
  s_27,
  s_0,
  s_32,
  s_18,
  s_27,
  s_27_30,
  s_6,
  s_27,
  s_1,
  s_27,
  s_22,
  s_30,
  s_27,
  s_27,
  s_27,
  s_5,
  s_5,
  s_5,
  s_5,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_27,
  s_6,
  s_27,
  s_27,
  s_30,
  s_30,
  s_1,
  s_27,
  s_27,
  s_5,
  s_5,
  s_6_27,
  s_6_27,
  s_1,
  s_20,
  s_18,
  s_0,
  s_28,
  s_23_32,
  s_18,
  s_18,
  s_18,
  s_9,
  s_14,
  s_19,
  s_24,
  s_6,
  s_24,
  s_14,
  s_1,
  s_18,
  s_18,
  s_30_35_40_41,
  s_18,
  s_18,
  s_27,
  s_7_14_26,
  s_18_0,
  s_18,
  s_7,
  s_14_26,
  s_18,
  s_2,
  s_18,
  s_18,
  s_0,
  s_0,
  s_35,
  s_4,
  s_4,
  s_18,
  s_5,
  s_0,
  s_5,
  s_5,
  s_5,
  s_22,
  s_0_1,
  s_2,
  s_10,
  s_4_10_29_32_38,
  s_0,
  s_9,
  s_6_8_15_20_25,
  s_1_0,
  s_0,
  s_8_17_20,
  s_0,
  s_0,
  s_28,
  s_18,
  s_3,
  s_18,
  s_0,
  s_6,
  s_15,
  s_8,
  s_6,
  s_18,
  s_2,
  s_7_9_10_11_39,
  s_0,
  s_2,
  s_7,
  s_6,
  s_2,
  s_7,
  s_0,
  s_7,
  s_0,
  s_20,
  s_26,
  s_18,
  s_0,
  s_15,
  s_15,
  s_10,
  s_4,
  s_5,
  s_10_0_1,
  s_9,
  s_18,
  s_1,
  s_2,
  s_32_41,
  s_0,
  s_4_10_26,
  s_10_1_0,
  s_18,
  s_18,
  s_6,
  s_6,
  s_0,
  s_2,
  s_7,
  s_0,
  s_0,
  s_4,
  s_4,
  s_4,
  s_18,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_0,
  s_28,
  s_0,
  s_18_0,
  s_10,
  s_0,
  s_25,
  s_0,
  s_0,
  s_14,
  s_14,
  s_8,
];
