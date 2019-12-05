/**
 * lunr - http://lunrjs.com - A bit like Solr, but much smaller and not as bright - 2.3.6
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

lunr.version = "2.3.6"
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

  var str = obj.toString().trim().toLowerCase(),
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
 * null. This token will not be passed to any downstream pipeline functions and will not be
 * added to the index.
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

      if (result === void 0 || result === '') continue

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
function tokenize(s) {
  // handle abbreviation like "100g" by treating it as "100 grams"
  s = s.replace(/(\d+)g/, '$1 grams');
  s = s.replace(/(\d+)oz/, '$1 ounces');
  s = s.replace(/(\d+)ml/, '$1 millilitre');
  s = s.replace(/(\d+)lb/, '$1 pound');
  // handle abbreviation like "100 g" (with space) by treating it as "100 grams"
  s = s.replace(/(\d+) +g /, '$1 grams ');
  s = s.replace(/(\d+) +oz /, '$1 ounces ');
  s = s.replace(/(\d+) +ml /, '$1 millilitre ');
  s = s.replace(/(\d+) +lb /, '$1 pound ');
  // handle abbreviations like tsp and tbsp
  s = s.replace(/tsp\.?/, 'teaspoon');
  s = s.replace(/tbsp\.?/, 'tablespoon');
  return clumpFractions(s).split(/([,()]|\s+)/).filter(function(e) {
    return String(e).trim();
  })
}

function joinLine(columns) {
  return columns.join('\t');
}

function clumpFractions(s) {
  return s.replace(/(\d+)\s+(\d)\/(\d)/, '$1$$$2/$3')
}

function cleanUnicodeFractions(s) {
  const fractions = {
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
  };
  for (var unicode in fractions) {
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
    (`I${index}`), (`L${lengthGroup(l)}`),
    (isCapitalized(token) ? 'Yes' : 'No') + 'CAP',
    (insideParenthesis(token, tokens) ? 'Yes' : 'No') + 'PAREN'
  ];
}

function singularize(word) {
  const units = {
    'cups': 'cup',
    'tablespoons': 'tablespoon',
    'teaspoons': 'teaspoon',
    'pounds': 'pound',
    'ounces': 'ounce',
    'cloves': 'clove',
    'sprigs': 'sprig',
    'pinches': 'pinch',
    'bunches': 'bunch',
    'slices': 'slice',
    'grams': 'gram',
    'heads': 'head',
    'quarts': 'quart',
    'stalks': 'stalk',
    'pints': 'pint',
    'pieces': 'piece',
    'sticks': 'stick',
    'dashes': 'dash',
    'fillets': 'fillet',
    'cans': 'can',
    'ears': 'ear',
    'packages': 'package',
    'strips': 'strip',
    'bulbs': 'bulb',
    'bottles': 'bottle'
  };
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
  return 'X';
}

function insideParenthesis(token, tokens) {
  if (token === '(' || token === ')') {
    return true;
  }
  var line = tokens.join(' ');
  // TODO: should escape token in line below
  return RegExp('.*\\(.*' + token + '.*\\).*').test(line);
}

function displayIngredient(ingredient) {
  var str = '';
  for (var i = 0; i < ingredient.length; i++) {
    var tag_tokens = ingredient[i];
    var tag = tag_tokens[0];
    var tokens = tag_tokens[1].join(' ');
    str += `<span class='${tag}'>${tokens}</span>`;
  }
  return str;
}

function smartJoin(words) {
  var input = words.join(' ');
  input = input.replace(' , ', ', ')
  input = input.replace('( ', '(')
  input = input.replace(' )', ')')
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
    } else if (line[0] == '#') {
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

      if (tag === 'unit') {
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
    output[i]['display'] = displayIngredient(display[i]);
  }

  for (var i = 0; i < output.length; i++) {
    var all_tokens = [];
    for (var j = 0; j < display[i].length; j++) {
      all_tokens.push(display[i][j][1].join(' '));
    }
    output[i]['input'] = smartJoin(all_tokens);
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
      var features = getFeatures(token, j + 1, tokens);
      output.push(joinLine([token].concat(features)));
    }
    output.push('');
  }
  return output.join('\n');
}
foods = [
  {
    "fat_content": "0.3", 
    "name": "Celeriac, raw", 
    "carbohydrate_content": "9.2", 
    "calories": "42", 
    "fiber_content": "1.8", 
    "protein_content": "1.5"
  }, 
  {
    "fat_content": "72", 
    "name": "Pecans", 
    "carbohydrate_content": "14", 
    "calories": "691", 
    "fiber_content": "9.6", 
    "protein_content": "9.2"
  }, 
  {
    "fat_content": "0.8", 
    "name": "Cherries, dried, Waitrose", 
    "carbohydrate_content": "75.1", 
    "calories": "333", 
    "fiber_content": "3.7", 
    "protein_content": "2.2"
  }, 
  {
    "fat_content": "20.5", 
    "name": "Soft goats cheese", 
    "carbohydrate_content": "3.7", 
    "calories": "247", 
    "fiber_content": "0.5", 
    "protein_content": "11.6"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Parsnips, raw", 
    "carbohydrate_content": "18", 
    "calories": "75", 
    "fiber_content": "4.9", 
    "protein_content": "1.2"
  }, 
  {
    "fat_content": "11", 
    "name": "Mustard, Dijon Originale, Maille", 
    "carbohydrate_content": "3.5", 
    "calories": "150", 
    "fiber_content": "0", 
    "protein_content": "7"
  }, 
  {
    "fat_content": "26.9", 
    "name": "Mackerel, smoked, Waitrose, essential", 
    "carbohydrate_content": "0.1", 
    "calories": "325", 
    "fiber_content": "0.5", 
    "protein_content": "20.5"
  }, 
  {
    "fat_content": "21", 
    "name": "Cream cheese, Philadelphia original", 
    "carbohydrate_content": "4.3", 
    "calories": "225", 
    "fiber_content": "0.2", 
    "protein_content": "5.4"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Swede", 
    "carbohydrate_content": "2.3", 
    "calories": "13", 
    "fiber_content": "0.7", 
    "protein_content": "0.3"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Brussels sprouts", 
    "carbohydrate_content": "9", 
    "calories": "43", 
    "fiber_content": "3.8", 
    "protein_content": "3.4"
  }, 
  {
    "fat_content": "26.2", 
    "name": "Taleggio cheese", 
    "carbohydrate_content": "0.9", 
    "calories": "315", 
    "fiber_content": "0", 
    "protein_content": "19"
  }, 
  {
    "fat_content": "0", 
    "name": "Cornflour, Waitrose", 
    "carbohydrate_content": "88", 
    "calories": "354", 
    "fiber_content": "0", 
    "protein_content": "0"
  }, 
  {
    "fat_content": "0.0", 
    "name": "Water, distilled", 
    "carbohydrate_content": "0.0", 
    "calories": "0", 
    "fiber_content": "0.0", 
    "protein_content": "0.0"
  }, 
  {
    "fat_content": "4.4", 
    "name": "Rosemary, fresh", 
    "carbohydrate_content": "13.5", 
    "calories": "99", 
    "fiber_content": "12.4", 
    "protein_content": "1.4"
  }, 
  {
    "fat_content": "20.1", 
    "name": "Cloves, dried", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "\"\"", 
    "protein_content": "6.0"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Limes, flesh only", 
    "carbohydrate_content": "0.8", 
    "calories": "9", 
    "fiber_content": "\"\"", 
    "protein_content": "0.7"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Oranges, flesh only", 
    "carbohydrate_content": "8.2", 
    "calories": "36", 
    "fiber_content": "1.2", 
    "protein_content": "0.8"
  }, 
  {
    "fat_content": "0.0", 
    "name": "Sugar, icing", 
    "carbohydrate_content": "104.9", 
    "calories": "393", 
    "fiber_content": "0.0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Raisins", 
    "carbohydrate_content": "69.3", 
    "calories": "272", 
    "fiber_content": "N", 
    "protein_content": "2.1"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Worcestershire sauce", 
    "carbohydrate_content": "28.3", 
    "calories": "113", 
    "fiber_content": "Tr", 
    "protein_content": "1.4"
  }, 
  {
    "fat_content": "58.0", 
    "name": "Sesame seeds", 
    "carbohydrate_content": "0.9", 
    "calories": "598", 
    "fiber_content": "N", 
    "protein_content": "18.2"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Asparagus, raw", 
    "carbohydrate_content": "2.0", 
    "calories": "25", 
    "fiber_content": "N", 
    "protein_content": "2.9"
  }, 
  {
    "fat_content": "1.5", 
    "name": "Peas, raw", 
    "carbohydrate_content": "11.3", 
    "calories": "83", 
    "fiber_content": "5.3", 
    "protein_content": "6.9"
  }, 
  {
    "fat_content": "3.3", 
    "name": "Cornmeal, sifted", 
    "carbohydrate_content": "73.1", 
    "calories": "368", 
    "fiber_content": "\"\"", 
    "protein_content": "9.4"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Strawberries, raw", 
    "carbohydrate_content": "6.1", 
    "calories": "30", 
    "fiber_content": "3.8", 
    "protein_content": "0.6"
  }, 
  {
    "fat_content": "31.8", 
    "name": "Cheese, white, average", 
    "carbohydrate_content": "0.1", 
    "calories": "381", 
    "fiber_content": "0.0", 
    "protein_content": "23.7"
  }, 
  {
    "fat_content": "5.9", 
    "name": "Saffron", 
    "carbohydrate_content": "61.5", 
    "calories": "310", 
    "fiber_content": "\"\"", 
    "protein_content": "11.4"
  }, 
  {
    "fat_content": "25.8", 
    "name": "Cheese, goats milk, full fat, soft, white rind", 
    "carbohydrate_content": "1.0", 
    "calories": "320", 
    "fiber_content": "0.0", 
    "protein_content": "21.1"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Rocket, raw", 
    "carbohydrate_content": "Tr", 
    "calories": "18", 
    "fiber_content": "1.7", 
    "protein_content": "3.6"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Cranberries", 
    "carbohydrate_content": "3.4", 
    "calories": "15", 
    "fiber_content": "\"\"", 
    "protein_content": "0.4"
  }, 
  {
    "fat_content": "1.8", 
    "name": "Mussels, raw", 
    "carbohydrate_content": "2.5", 
    "calories": "74", 
    "fiber_content": "0.0", 
    "protein_content": "12.1"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Raspberries, raw", 
    "carbohydrate_content": "4.6", 
    "calories": "25", 
    "fiber_content": "N", 
    "protein_content": "1.4"
  }, 
  {
    "fat_content": "1.0", 
    "name": "Rice, white, Italian Arborio risotto, raw", 
    "carbohydrate_content": "85.2", 
    "calories": "354", 
    "fiber_content": "1.4", 
    "protein_content": "6.4"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Pears, raw, flesh and skin", 
    "carbohydrate_content": "10.9", 
    "calories": "43", 
    "fiber_content": "2.7", 
    "protein_content": "0.3"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Blueberries", 
    "carbohydrate_content": "9.1", 
    "calories": "40", 
    "fiber_content": "1.5", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Horseradish, raw", 
    "carbohydrate_content": "11.0", 
    "calories": "62", 
    "fiber_content": "\"\"", 
    "protein_content": "4.5"
  }, 
  {
    "fat_content": "0.0", 
    "name": "Gelatine", 
    "carbohydrate_content": "0.0", 
    "calories": "338", 
    "fiber_content": "0.0", 
    "protein_content": "84.4"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Tomato ketchup", 
    "carbohydrate_content": "28.6", 
    "calories": "115", 
    "fiber_content": "0.9", 
    "protein_content": "1.6"
  }, 
  {
    "fat_content": "0", 
    "name": "Jerusalem Artichokes", 
    "carbohydrate_content": "17", 
    "calories": "73", 
    "fiber_content": "1.6", 
    "protein_content": "2"
  }, 
  {
    "fat_content": "5.4", 
    "name": "Tofu, Tofoo brand", 
    "carbohydrate_content": "1.1", 
    "calories": "100", 
    "fiber_content": "0.5", 
    "protein_content": "11.5"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Rhubarb", 
    "carbohydrate_content": "4.5", 
    "calories": "21", 
    "fiber_content": "1.8", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "21", 
    "name": "Coconut cream, Waitrose", 
    "carbohydrate_content": "3.9", 
    "calories": "210", 
    "fiber_content": "0", 
    "protein_content": "1.3"
  }, 
  {
    "fat_content": "8.7", 
    "name": "Allspice, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "", 
    "protein_content": "6.1"
  }, 
  {
    "fat_content": "55.8", 
    "name": "Almonds, ground", 
    "carbohydrate_content": "6.9", 
    "calories": "645", 
    "fiber_content": "7.4", 
    "protein_content": "25.5"
  }, 
  {
    "fat_content": "56.7", 
    "name": "Almonds, toasted", 
    "carbohydrate_content": "7", 
    "calories": "621", 
    "fiber_content": "", 
    "protein_content": "21.2"
  }, 
  {
    "fat_content": "10", 
    "name": "Anchovies, canned in oil, drained", 
    "carbohydrate_content": "0", 
    "calories": "191", 
    "fiber_content": "0", 
    "protein_content": "25.2"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Artichoke, globe, base of leaves and heart, boiled in unsalted water", 
    "carbohydrate_content": "2.7", 
    "calories": "18", 
    "fiber_content": "", 
    "protein_content": "2.9"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Aubergine, raw", 
    "carbohydrate_content": "2.2", 
    "calories": "20", 
    "fiber_content": "2", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Apples, eating, raw, flesh and skin", 
    "carbohydrate_content": "11.6", 
    "calories": "51", 
    "fiber_content": "1.2", 
    "protein_content": "0.6"
  }, 
  {
    "fat_content": "1.1", 
    "name": "Yogurt, low fat, fruit", 
    "carbohydrate_content": "13.7", 
    "calories": "78", 
    "fiber_content": "0.3", 
    "protein_content": "4.2"
  }, 
  {
    "fat_content": "23.6", 
    "name": "Bacon rashers, streaky, raw", 
    "carbohydrate_content": "0", 
    "calories": "276", 
    "fiber_content": "", 
    "protein_content": "15.8"
  }, 
  {
    "fat_content": "0", 
    "name": "Baking powder", 
    "carbohydrate_content": "37.8", 
    "calories": "163", 
    "fiber_content": "0", 
    "protein_content": "5.2"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Bananas, flesh only", 
    "carbohydrate_content": "20.3", 
    "calories": "81", 
    "fiber_content": "1.4", 
    "protein_content": "1.2"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Borlotti beans, canned, Waitrose", 
    "carbohydrate_content": "12.9", 
    "calories": "100", 
    "fiber_content": "7.7", 
    "protein_content": "6.9"
  }, 
  {
    "fat_content": "1.2", 
    "name": "Barley, pearl, raw", 
    "carbohydrate_content": "78", 
    "calories": "352", 
    "fiber_content": "16", 
    "protein_content": "9.9"
  }, 
  {
    "fat_content": "0.8", 
    "name": "Basil, fresh", 
    "carbohydrate_content": "2.7", 
    "calories": "23", 
    "fiber_content": "1.6", 
    "protein_content": "3.2"
  }, 
  {
    "fat_content": "6.8", 
    "name": "Bass, sea, flesh only, baked", 
    "carbohydrate_content": "0", 
    "calories": "154", 
    "fiber_content": "0", 
    "protein_content": "23.2"
  }, 
  {
    "fat_content": "8.4", 
    "name": "Bay leaf, dried", 
    "carbohydrate_content": "48.6", 
    "calories": "313", 
    "fiber_content": "", 
    "protein_content": "7.6"
  }, 
  {
    "fat_content": "1", 
    "name": "Beans, broad, whole, raw", 
    "carbohydrate_content": "7.2", 
    "calories": "73", 
    "fiber_content": "6.1", 
    "protein_content": "5.7"
  }, 
  {
    "fat_content": "1.4", 
    "name": "Beans, chick peas, canned, re-heated, drained", 
    "carbohydrate_content": "16.5", 
    "calories": "122", 
    "fiber_content": "6.1", 
    "protein_content": "7.7"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Beans, green, raw", 
    "carbohydrate_content": "3.1", 
    "calories": "31", 
    "fiber_content": "3.4", 
    "protein_content": "2.1"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Beans, haricot, whole, dried, boiled in unsalted water", 
    "carbohydrate_content": "17.2", 
    "calories": "95", 
    "fiber_content": "", 
    "protein_content": "6.6"
  }, 
  {
    "fat_content": "3.7", 
    "name": "Beansprouts, mung, raw", 
    "carbohydrate_content": "1.4", 
    "calories": "50", 
    "fiber_content": "1.7", 
    "protein_content": "1.9"
  }, 
  {
    "fat_content": "8.6", 
    "name": "Beef, braising steak, raw, lean and fat", 
    "carbohydrate_content": "0", 
    "calories": "160", 
    "fiber_content": "", 
    "protein_content": "20.7"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Beetroot, raw", 
    "carbohydrate_content": "9.5", 
    "calories": "54", 
    "fiber_content": "2.8", 
    "protein_content": "2.3"
  }, 
  {
    "fat_content": "0", 
    "name": "Bicarbonate of soda", 
    "carbohydrate_content": "0", 
    "calories": "0", 
    "fiber_content": "", 
    "protein_content": "0"
  }, 
  {
    "fat_content": "0", 
    "name": "Blackcurrants, raw", 
    "carbohydrate_content": "10.2", 
    "calories": "34", 
    "fiber_content": "3.6", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "2.3", 
    "name": "Bread, white, premium", 
    "carbohydrate_content": "47", 
    "calories": "230", 
    "fiber_content": "2.8", 
    "protein_content": "8.3"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Broccoli, green, raw", 
    "carbohydrate_content": "3.2", 
    "calories": "34", 
    "fiber_content": "4", 
    "protein_content": "4.3"
  }, 
  {
    "fat_content": "82.2", 
    "name": "Butter, salted", 
    "carbohydrate_content": "0.6", 
    "calories": "744", 
    "fiber_content": "0", 
    "protein_content": "0.6"
  }, 
  {
    "fat_content": "82.2", 
    "name": "Butter, unsalted", 
    "carbohydrate_content": "0.6", 
    "calories": "744", 
    "fiber_content": "0", 
    "protein_content": "0.6"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Cabbage, average, raw", 
    "carbohydrate_content": "4.4", 
    "calories": "26", 
    "fiber_content": "3.5", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Cabbage, Chinese, raw", 
    "carbohydrate_content": "1.4", 
    "calories": "12", 
    "fiber_content": "", 
    "protein_content": "1"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Cabbage, red, raw", 
    "carbohydrate_content": "3.7", 
    "calories": "21", 
    "fiber_content": "2.9", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "14.6", 
    "name": "Caraway seeds", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "", 
    "protein_content": "19.8"
  }, 
  {
    "fat_content": "6.7", 
    "name": "Cardamom, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "", 
    "protein_content": "10.8"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Carrots, old, raw", 
    "carbohydrate_content": "7.7", 
    "calories": "34", 
    "fiber_content": "3.9", 
    "protein_content": "0.5"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Carrots, young, raw", 
    "carbohydrate_content": "6", 
    "calories": "30", 
    "fiber_content": "N", 
    "protein_content": "0.7"
  }, 
  {
    "fat_content": "45.7", 
    "name": "Cashew nuts, kernel only, plain", 
    "carbohydrate_content": "17.8", 
    "calories": "582", 
    "fiber_content": "7.7", 
    "protein_content": "20.9"
  }, 
  {
    "fat_content": "0.9", 
    "name": "Cauliflower, raw", 
    "carbohydrate_content": "3", 
    "calories": "38", 
    "fiber_content": "1.8", 
    "protein_content": "3.6"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Celery, raw", 
    "carbohydrate_content": "0.9", 
    "calories": "10", 
    "fiber_content": "1.1", 
    "protein_content": "0.5"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Chard, Swiss, raw", 
    "carbohydrate_content": "2.9", 
    "calories": "24", 
    "fiber_content": "1.6", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "35.0", 
    "name": "Cheese, Stilton, blue", 
    "carbohydrate_content": "0.1", 
    "calories": "410", 
    "fiber_content": "0.0", 
    "protein_content": "23.7"
  }, 
  {
    "fat_content": "34.9", 
    "name": "Cheese, Cheddar, English", 
    "carbohydrate_content": "0.1", 
    "calories": "416", 
    "fiber_content": "0", 
    "protein_content": "25.4"
  }, 
  {
    "fat_content": "20.2", 
    "name": "Cheese, Feta", 
    "carbohydrate_content": "1.5", 
    "calories": "250", 
    "fiber_content": "0", 
    "protein_content": "15.6"
  }, 
  {
    "fat_content": "33.3", 
    "name": "Cheese, Gruyere", 
    "carbohydrate_content": "Tr", 
    "calories": "409", 
    "fiber_content": "", 
    "protein_content": "27.2"
  }, 
  {
    "fat_content": "23.5", 
    "name": "Cheese, Halloumi", 
    "carbohydrate_content": "1.7", 
    "calories": "313", 
    "fiber_content": "0", 
    "protein_content": "23.9"
  }, 
  {
    "fat_content": "20.3", 
    "name": "Cheese, Mozzarella, fresh", 
    "carbohydrate_content": "Tr", 
    "calories": "257", 
    "fiber_content": "0", 
    "protein_content": "18.6"
  }, 
  {
    "fat_content": "24.5", 
    "name": "Cheese, Paneer", 
    "carbohydrate_content": "0.9", 
    "calories": "328", 
    "fiber_content": "0", 
    "protein_content": "26"
  }, 
  {
    "fat_content": "29.7", 
    "name": "Cheese, Parmesan, fresh", 
    "carbohydrate_content": "0.9", 
    "calories": "415", 
    "fiber_content": "0", 
    "protein_content": "36.2"
  }, 
  {
    "fat_content": "11", 
    "name": "Cheese, Ricotta", 
    "carbohydrate_content": "2", 
    "calories": "144", 
    "fiber_content": "", 
    "protein_content": "9.4"
  }, 
  {
    "fat_content": "1.6", 
    "name": "Chestnuts, kernel only, raw", 
    "carbohydrate_content": "33.3", 
    "calories": "176", 
    "fiber_content": "5.9", 
    "protein_content": "4.1"
  }, 
  {
    "fat_content": "2.1", 
    "name": "Chicken, meat, average, raw", 
    "carbohydrate_content": "0", 
    "calories": "108", 
    "fiber_content": "0", 
    "protein_content": "22.3"
  }, 
  {
    "fat_content": "14.3", 
    "name": "Chilli powder", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "34.8", 
    "protein_content": "13.5"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Chives, fresh", 
    "carbohydrate_content": "1.9", 
    "calories": "27", 
    "fiber_content": "2.5", 
    "protein_content": "3.3"
  }, 
  {
    "fat_content": "32.2", 
    "name": "Chorizo", 
    "carbohydrate_content": "2.4", 
    "calories": "395", 
    "fiber_content": "1", 
    "protein_content": "24"
  }, 
  {
    "fat_content": "0", 
    "name": "Cider, dry", 
    "carbohydrate_content": "2.6", 
    "calories": "36", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "1.2", 
    "name": "Cinnamon, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "53.1", 
    "protein_content": "4"
  }, 
  {
    "fat_content": "18", 
    "name": "Coconut milk, canned", 
    "carbohydrate_content": "3.4", 
    "calories": "180", 
    "fiber_content": "0", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "62", 
    "name": "Coconut, desiccated", 
    "carbohydrate_content": "6.1", 
    "calories": "632", 
    "fiber_content": "13.7", 
    "protein_content": "5.6"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Cod, flesh only, raw", 
    "carbohydrate_content": "0.0", 
    "calories": "75", 
    "fiber_content": "0.0", 
    "protein_content": "17.5"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Coriander leaves, fresh", 
    "carbohydrate_content": "1.2", 
    "calories": "18", 
    "fiber_content": "2.8", 
    "protein_content": "2.1"
  }, 
  {
    "fat_content": "17.8", 
    "name": "Coriander seeds", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "41.9", 
    "protein_content": "12.4"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Courgette, raw", 
    "carbohydrate_content": "1.8", 
    "calories": "20", 
    "fiber_content": "1.1", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "1", 
    "name": "Couscous, plain, cooked", 
    "carbohydrate_content": "37.5", 
    "calories": "178", 
    "fiber_content": "2.2", 
    "protein_content": "7.2"
  }, 
  {
    "fat_content": "2.1", 
    "name": "Couscous, plain, raw", 
    "carbohydrate_content": "79.2", 
    "calories": "364", 
    "fiber_content": "3.7", 
    "protein_content": "12"
  }, 
  {
    "fat_content": "53.7", 
    "name": "Cream, fresh, double, including Jersey cream", 
    "carbohydrate_content": "1.7", 
    "calories": "496", 
    "fiber_content": "0", 
    "protein_content": "1.6"
  }, 
  {
    "fat_content": "19.1", 
    "name": "Cream, fresh, single", 
    "carbohydrate_content": "2.2", 
    "calories": "193", 
    "fiber_content": "0", 
    "protein_content": "3.3"
  }, 
  {
    "fat_content": "40", 
    "name": "Creme fraiche, full fat", 
    "carbohydrate_content": "2.4", 
    "calories": "378", 
    "fiber_content": "0", 
    "protein_content": "2.2"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Cucumber, raw, flesh and skin", 
    "carbohydrate_content": "1.2", 
    "calories": "14", 
    "fiber_content": "0.7", 
    "protein_content": "1"
  }, 
  {
    "fat_content": "22.3", 
    "name": "Cumin seeds", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "10.5", 
    "protein_content": "17.8"
  }, 
  {
    "fat_content": "1.6", 
    "name": "Curly kale, raw", 
    "carbohydrate_content": "1.4", 
    "calories": "41", 
    "fiber_content": "3.6", 
    "protein_content": "3.4"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Currants", 
    "carbohydrate_content": "70.5", 
    "calories": "303", 
    "fiber_content": "3.1", 
    "protein_content": "2"
  }, 
  {
    "fat_content": "10.8", 
    "name": "Curry powder", 
    "carbohydrate_content": "26.1", 
    "calories": "233", 
    "fiber_content": "N", 
    "protein_content": "9.5"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Dates, dried, flesh and skin", 
    "carbohydrate_content": "68", 
    "calories": "295", 
    "fiber_content": "4", 
    "protein_content": "3.3"
  }, 
  {
    "fat_content": "0.8", 
    "name": "Dill, fresh", 
    "carbohydrate_content": "0.9", 
    "calories": "25", 
    "fiber_content": "", 
    "protein_content": "3.7"
  }, 
  {
    "fat_content": "9", 
    "name": "Eggs, chicken, whole, raw", 
    "carbohydrate_content": "0", 
    "calories": "131", 
    "fiber_content": "0", 
    "protein_content": "12.6"
  }, 
  {
    "fat_content": "31.3", 
    "name": "Eggs, chicken, yolk, raw", 
    "carbohydrate_content": "0", 
    "calories": "347", 
    "fiber_content": "0", 
    "protein_content": "16.4"
  }, 
  {
    "fat_content": "14.9", 
    "name": "Fennel seeds", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "", 
    "protein_content": "15.8"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Fennel, Florence, raw", 
    "carbohydrate_content": "7.3", 
    "calories": "31", 
    "fiber_content": "3.1", 
    "protein_content": "1.2"
  }, 
  {
    "fat_content": "6.7", 
    "name": "Flour, gram", 
    "carbohydrate_content": "58", 
    "calories": "387", 
    "fiber_content": "11", 
    "protein_content": "22"
  }, 
  {
    "fat_content": "1.4", 
    "name": "Flour, wheat, white, plain, soft", 
    "carbohydrate_content": "80.9", 
    "calories": "352", 
    "fiber_content": "4", 
    "protein_content": "9.1"
  }, 
  {
    "fat_content": "15.1", 
    "name": "Garam masala", 
    "carbohydrate_content": "45.2", 
    "calories": "379", 
    "fiber_content": "N", 
    "protein_content": "15.6"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Garlic, raw", 
    "carbohydrate_content": "16.3", 
    "calories": "102", 
    "fiber_content": "2.1", 
    "protein_content": "7.9"
  }, 
  {
    "fat_content": "97.6", 
    "name": "Ghee, butter", 
    "carbohydrate_content": "Tr", 
    "calories": "878", 
    "fiber_content": "0", 
    "protein_content": "0.1"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Gherkins, pickled, drained", 
    "carbohydrate_content": "2.6", 
    "calories": "14", 
    "fiber_content": "1.5", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "0.8", 
    "name": "Ginger, fresh", 
    "carbohydrate_content": "8.1", 
    "calories": "44", 
    "fiber_content": "2", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Gooseberries, cooking, raw", 
    "carbohydrate_content": "3", 
    "calories": "19", 
    "fiber_content": "", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "63.5", 
    "name": "Hazelnuts, kernel only", 
    "carbohydrate_content": "6", 
    "calories": "650", 
    "fiber_content": "6.9", 
    "protein_content": "14.1"
  }, 
  {
    "fat_content": "0", 
    "name": "Honey", 
    "carbohydrate_content": "76.4", 
    "calories": "288", 
    "fiber_content": "0", 
    "protein_content": "0.4"
  }, 
  {
    "fat_content": "8", 
    "name": "Lamb, lean only, raw, average", 
    "carbohydrate_content": "0", 
    "calories": "153", 
    "fiber_content": "0", 
    "protein_content": "20.2"
  }, 
  {
    "fat_content": "40", 
    "name": "Flaxseed", 
    "carbohydrate_content": "3", 
    "calories": "508", 
    "fiber_content": "23.7", 
    "protein_content": "22.1"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Leeks, raw", 
    "carbohydrate_content": "2.9", 
    "calories": "23", 
    "fiber_content": "0", 
    "protein_content": "1.6"
  }, 
  {
    "fat_content": "Tr", 
    "name": "Lemon juice, fresh", 
    "carbohydrate_content": "1.6", 
    "calories": "7", 
    "fiber_content": "N", 
    "protein_content": "0.3"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Lemon peel", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "10.6", 
    "protein_content": "1.5"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Lemons, peeled, flesh only", 
    "carbohydrate_content": "2.2", 
    "calories": "14", 
    "fiber_content": "", 
    "protein_content": "0.8"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Lemons, whole, without pips", 
    "carbohydrate_content": "3.2", 
    "calories": "19", 
    "fiber_content": "N", 
    "protein_content": "1"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Lentils, green and brown, whole, dried, boiled in unsalted water", 
    "carbohydrate_content": "16.9", 
    "calories": "105", 
    "fiber_content": "N", 
    "protein_content": "8.8"
  }, 
  {
    "fat_content": "1.5", 
    "name": "Lentils, green and brown, whole, dried, raw", 
    "carbohydrate_content": "62", 
    "calories": "350", 
    "fiber_content": "26", 
    "protein_content": "23"
  }, 
  {
    "fat_content": "2.1", 
    "name": "Lentils, red, split, dried, raw", 
    "carbohydrate_content": "58.1", 
    "calories": "352", 
    "fiber_content": "14.5", 
    "protein_content": "27"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Lime juice, fresh", 
    "carbohydrate_content": "1.6", 
    "calories": "9", 
    "fiber_content": "", 
    "protein_content": "0.4"
  }, 
  {
    "fat_content": "79", 
    "name": "Mayonnaise, Hellman's", 
    "carbohydrate_content": "1.3", 
    "calories": "721", 
    "fiber_content": "0", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "1.7", 
    "name": "Milk, semi-skimmed, pasteurised, average", 
    "carbohydrate_content": "4.7", 
    "calories": "46", 
    "fiber_content": "0", 
    "protein_content": "3.5"
  }, 
  {
    "fat_content": "3.6", 
    "name": "Milk, whole, pasteurised, average", 
    "carbohydrate_content": "4.6", 
    "calories": "63", 
    "fiber_content": "0", 
    "protein_content": "3.4"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Mint, fresh", 
    "carbohydrate_content": "5.3", 
    "calories": "43", 
    "fiber_content": "N", 
    "protein_content": "3.8"
  }, 
  {
    "fat_content": "13.3", 
    "name": "Mixed curry spices", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "N", 
    "protein_content": "13.2"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Mushrooms, white, raw", 
    "carbohydrate_content": "0.3", 
    "calories": "7", 
    "fiber_content": "0.7", 
    "protein_content": "1"
  }, 
  {
    "fat_content": "10", 
    "name": "Mustard, wholegrain", 
    "carbohydrate_content": "9.4", 
    "calories": "176", 
    "fiber_content": "N", 
    "protein_content": "6.9"
  }, 
  {
    "fat_content": "Tr", 
    "name": "Orange juice, freshly squeezed", 
    "carbohydrate_content": "8.1", 
    "calories": "33", 
    "fiber_content": "N", 
    "protein_content": "0.6"
  }, 
  {
    "fat_content": "36.3", 
    "name": "Nutmeg, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "20.8", 
    "protein_content": "5.8"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, coconut", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, olive", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, peanut (groundnut)", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, rapeseed", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "99.7", 
    "name": "Oil, sesame", 
    "carbohydrate_content": "0", 
    "calories": "898", 
    "fiber_content": "0", 
    "protein_content": "0.2"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, sunflower", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "99.9", 
    "name": "Oil, vegetable, average", 
    "carbohydrate_content": "0", 
    "calories": "899", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "11", 
    "name": "Olives, green, in brine, drained, flesh and skin", 
    "carbohydrate_content": "Tr", 
    "calories": "103", 
    "fiber_content": "N", 
    "protein_content": "0.9"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Onions, raw", 
    "carbohydrate_content": "8", 
    "calories": "35", 
    "fiber_content": "2.2", 
    "protein_content": "1"
  }, 
  {
    "fat_content": "4.3", 
    "name": "Oregano, dried, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "42.5", 
    "protein_content": "9.0"
  }, 
  {
    "fat_content": "1.2", 
    "name": "Parsnip, boiled in unsalted water", 
    "carbohydrate_content": "12.9", 
    "calories": "66", 
    "fiber_content": "N", 
    "protein_content": "1.6"
  }, 
  {
    "fat_content": "12.9", 
    "name": "Paprika", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "34.9", 
    "protein_content": "14.1"
  }, 
  {
    "fat_content": "1.3", 
    "name": "Parsley, fresh", 
    "carbohydrate_content": "2.7", 
    "calories": "34", 
    "fiber_content": "N", 
    "protein_content": "3"
  }, 
  {
    "fat_content": "1.6", 
    "name": "Pasta, egg, white, tagliatelle, fresh, boiled in unsalted water", 
    "carbohydrate_content": "30.6", 
    "calories": "152", 
    "fiber_content": "2", 
    "protein_content": "5.8"
  }, 
  {
    "fat_content": "1.6", 
    "name": "Pasta, white, dried, raw", 
    "carbohydrate_content": "75.6", 
    "calories": "343", 
    "fiber_content": "N", 
    "protein_content": "11.3"
  }, 
  {
    "fat_content": "3.8", 
    "name": "Pastry, filo, retail, cooked", 
    "carbohydrate_content": "77.1", 
    "calories": "363", 
    "fiber_content": "4.5", 
    "protein_content": "10"
  }, 
  {
    "fat_content": "51.8", 
    "name": "Peanut butter, smooth", 
    "carbohydrate_content": "13.1", 
    "calories": "607", 
    "fiber_content": "6.6", 
    "protein_content": "22.8"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Peas, frozen, raw", 
    "carbohydrate_content": "10.7", 
    "calories": "68", 
    "fiber_content": "5.3", 
    "protein_content": "5.3"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Peas, mange-tout, raw", 
    "carbohydrate_content": "4.2", 
    "calories": "32", 
    "fiber_content": "N", 
    "protein_content": "3.6"
  }, 
  {
    "fat_content": "2.4", 
    "name": "Peas, split, dried, raw", 
    "carbohydrate_content": "58.2", 
    "calories": "328", 
    "fiber_content": "", 
    "protein_content": "22.1"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Peppers, capsicum, green, raw", 
    "carbohydrate_content": "2.6", 
    "calories": "15", 
    "fiber_content": "N", 
    "protein_content": "0.8"
  }, 
  {
    "fat_content": "3.3", 
    "name": "Pepper, black", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "25.3", 
    "protein_content": "10.4"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Pepper, capsicum, red, raw", 
    "carbohydrate_content": "4.3", 
    "calories": "21", 
    "fiber_content": "2.2", 
    "protein_content": "0.8"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Pepper, capsicum, yellow, raw", 
    "carbohydrate_content": "4.6", 
    "calories": "23", 
    "fiber_content": "2.2", 
    "protein_content": "0.8"
  }, 
  {
    "fat_content": "17.3", 
    "name": "Pepper, cayenne, ground", 
    "carbohydrate_content": "31.7", 
    "calories": "318", 
    "fiber_content": "", 
    "protein_content": "12"
  }, 
  {
    "fat_content": "2.1", 
    "name": "Pepper, white", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "26.2", 
    "protein_content": "10.4"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Peppers, capsicum, chilli, green, raw", 
    "carbohydrate_content": "0.7", 
    "calories": "20", 
    "fiber_content": "N", 
    "protein_content": "2.9"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Peppers, capsicum, chilli, red, raw", 
    "carbohydrate_content": "4.2", 
    "calories": "26", 
    "fiber_content": "", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "68.6", 
    "name": "Pine nuts, kernel only", 
    "carbohydrate_content": "4", 
    "calories": "688", 
    "fiber_content": "1.9", 
    "protein_content": "14"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Pomegranate, flesh and pips", 
    "carbohydrate_content": "11.8", 
    "calories": "51", 
    "fiber_content": "N", 
    "protein_content": "1.3"
  }, 
  {
    "fat_content": "6.5", 
    "name": "Pork, fillet, raw, lean and fat", 
    "carbohydrate_content": "0", 
    "calories": "147", 
    "fiber_content": "", 
    "protein_content": "22"
  }, 
  {
    "fat_content": "18.2", 
    "name": "Pork, loin chops, raw, lean and fat, weighed with bone", 
    "carbohydrate_content": "0", 
    "calories": "227", 
    "fiber_content": "", 
    "protein_content": "15.7"
  }, 
  {
    "fat_content": "5.8", 
    "name": "Porridge oats, unfortified", 
    "carbohydrate_content": "64", 
    "calories": "371", 
    "fiber_content": "8.3", 
    "protein_content": "11"
  }, 
  {
    "fat_content": "0.7", 
    "name": "Prawns, king, raw", 
    "carbohydrate_content": "0.0", 
    "calories": "77", 
    "fiber_content": "0.0", 
    "protein_content": "17.6"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Potatoes, new and salad, flesh only, raw", 
    "carbohydrate_content": "16.1", 
    "calories": "68", 
    "fiber_content": "1.8", 
    "protein_content": "1.7"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Potatoes, old, raw, flesh only", 
    "carbohydrate_content": "19.6", 
    "calories": "82", 
    "fiber_content": "2", 
    "protein_content": "1.9"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Prunes, flesh and skin", 
    "carbohydrate_content": "50", 
    "calories": "226", 
    "fiber_content": "7.7", 
    "protein_content": "1.8"
  }, 
  {
    "fat_content": "5.0", 
    "name": "Quinoa, raw", 
    "carbohydrate_content": "55.7", 
    "calories": "309", 
    "fiber_content": "7.0", 
    "protein_content": "13.8"
  }, 
  {
    "fat_content": "49.1", 
    "name": "Pumpkin seeds", 
    "carbohydrate_content": "10.7", 
    "calories": "618", 
    "fiber_content": "6", 
    "protein_content": "30.2"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Radish, red, raw, flesh and skin", 
    "carbohydrate_content": "1.9", 
    "calories": "14", 
    "fiber_content": "0.9", 
    "protein_content": "0.7"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Rice, white, basmati, raw", 
    "carbohydrate_content": "83.7", 
    "calories": "351", 
    "fiber_content": "1.1", 
    "protein_content": "8.1"
  }, 
  {
    "fat_content": "4.6", 
    "name": "Sage, fresh", 
    "carbohydrate_content": "15.6", 
    "calories": "119", 
    "fiber_content": "\"\"", 
    "protein_content": "3.9"
  }, 
  {
    "fat_content": "15", 
    "name": "Salmon, farmed, flesh only, raw", 
    "carbohydrate_content": "0", 
    "calories": "217", 
    "fiber_content": "0.2", 
    "protein_content": "20.4"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Buttermilk", 
    "carbohydrate_content": "8.8", 
    "calories": "58", 
    "fiber_content": "", 
    "protein_content": "5.5"
  }, 
  {
    "fat_content": "0", 
    "name": "Salt", 
    "carbohydrate_content": "0", 
    "calories": "0", 
    "fiber_content": "0", 
    "protein_content": "0"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Shallots, raw", 
    "carbohydrate_content": "3.3", 
    "calories": "20", 
    "fiber_content": "", 
    "protein_content": "1.5"
  }, 
  {
    "fat_content": "Tr", 
    "name": "Soy sauce, light and dark varieties", 
    "carbohydrate_content": "17.9", 
    "calories": "79", 
    "fiber_content": "Tr", 
    "protein_content": "3.0"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Spinach, baby, raw", 
    "carbohydrate_content": "0.2", 
    "calories": "16", 
    "fiber_content": "1", 
    "protein_content": "2.6"
  }, 
  {
    "fat_content": "0.8", 
    "name": "Spinach, mature, raw", 
    "carbohydrate_content": "1.6", 
    "calories": "29", 
    "fiber_content": "2.2", 
    "protein_content": "2.9"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Spring onions, bulbs and tops, raw", 
    "carbohydrate_content": "3", 
    "calories": "23", 
    "fiber_content": "N", 
    "protein_content": "2"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Squash, butternut, raw", 
    "carbohydrate_content": "8.3", 
    "calories": "43", 
    "fiber_content": "2", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "17.3", 
    "name": "Stock cubes, vegetable", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "1.8", 
    "protein_content": "13.5"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Stock, chicken, ready made, retail", 
    "carbohydrate_content": "0.2", 
    "calories": "12", 
    "fiber_content": "0.3", 
    "protein_content": "2.3"
  }, 
  {
    "fat_content": "0", 
    "name": "Sugar, brown", 
    "carbohydrate_content": "101.3", 
    "calories": "380", 
    "fiber_content": "0", 
    "protein_content": "0.1"
  }, 
  {
    "fat_content": "0", 
    "name": "Sugar, white", 
    "carbohydrate_content": "105", 
    "calories": "394", 
    "fiber_content": "0", 
    "protein_content": "Tr"
  }, 
  {
    "fat_content": "53.8", 
    "name": "Sunflower seeds", 
    "carbohydrate_content": "3.8", 
    "calories": "615", 
    "fiber_content": "10.1", 
    "protein_content": "23.8"
  }, 
  {
    "fat_content": "0.3", 
    "name": "Sweet potato, raw, flesh only", 
    "carbohydrate_content": "21.3", 
    "calories": "93", 
    "fiber_content": "3", 
    "protein_content": "1.2"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Sweetcorn, baby, fresh and frozen, boiled in unsalted water", 
    "carbohydrate_content": "2.7", 
    "calories": "24", 
    "fiber_content": "N", 
    "protein_content": "2.5"
  }, 
  {
    "fat_content": "1.1", 
    "name": "Sweetcorn, kernels, 'on-the-cob', raw, weighed with core", 
    "carbohydrate_content": "4.8", 
    "calories": "36", 
    "fiber_content": "N", 
    "protein_content": "2"
  }, 
  {
    "fat_content": "0", 
    "name": "Syrup, golden", 
    "carbohydrate_content": "79", 
    "calories": "298", 
    "fiber_content": "0", 
    "protein_content": "0.3"
  }, 
  {
    "fat_content": "58.9", 
    "name": "Tahini paste, Waitrose", 
    "carbohydrate_content": "5.2", 
    "calories": "664", 
    "fiber_content": "8.3", 
    "protein_content": "24.9"
  }, 
  {
    "fat_content": "1.1", 
    "name": "Tarragon, fresh", 
    "carbohydrate_content": "6.3", 
    "calories": "49", 
    "fiber_content": "", 
    "protein_content": "3.4"
  }, 
  {
    "fat_content": "2.5", 
    "name": "Thyme, fresh", 
    "carbohydrate_content": "15.1", 
    "calories": "95", 
    "fiber_content": "12.3", 
    "protein_content": "3"
  }, 
  {
    "fat_content": "0.2", 
    "name": "Tomato puree", 
    "carbohydrate_content": "12.9", 
    "calories": "67", 
    "fiber_content": "4.7", 
    "protein_content": "4.4"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Tomatoes, canned, whole contents", 
    "carbohydrate_content": "3.8", 
    "calories": "19", 
    "fiber_content": "0.8", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "0.5", 
    "name": "Tomatoes, cherry, raw", 
    "carbohydrate_content": "3.6", 
    "calories": "22", 
    "fiber_content": "1.3", 
    "protein_content": "1.1"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Tomatoes, standard, raw", 
    "carbohydrate_content": "3", 
    "calories": "14", 
    "fiber_content": "1", 
    "protein_content": "0.5"
  }, 
  {
    "fat_content": "6.4", 
    "name": "Tuna, canned in sunflower oil, drained", 
    "carbohydrate_content": "0", 
    "calories": "159", 
    "fiber_content": "0", 
    "protein_content": "25.4"
  }, 
  {
    "fat_content": "7", 
    "name": "Turmeric, ground", 
    "carbohydrate_content": "N", 
    "calories": "N", 
    "fiber_content": "", 
    "protein_content": "6.7"
  }, 
  {
    "fat_content": "0", 
    "name": "Vinegar", 
    "carbohydrate_content": "0.6", 
    "calories": "22", 
    "fiber_content": "0", 
    "protein_content": "0.4"
  }, 
  {
    "fat_content": "65.2", 
    "name": "Walnuts, kernel only", 
    "carbohydrate_content": "7", 
    "calories": "689", 
    "fiber_content": "6.7", 
    "protein_content": "15.2"
  }, 
  {
    "fat_content": "1", 
    "name": "Watercress, raw", 
    "carbohydrate_content": "0.4", 
    "calories": "26", 
    "fiber_content": "1.5", 
    "protein_content": "3"
  }, 
  {
    "fat_content": "2", 
    "name": "Wheat, bulgur, raw", 
    "carbohydrate_content": "77.8", 
    "calories": "352", 
    "fiber_content": "6.7", 
    "protein_content": "10.6"
  }, 
  {
    "fat_content": "0", 
    "name": "Wine, red", 
    "carbohydrate_content": "0.2", 
    "calories": "76", 
    "fiber_content": "0", 
    "protein_content": "0.1"
  }, 
  {
    "fat_content": "0", 
    "name": "Wine, white, dry", 
    "carbohydrate_content": "0.6", 
    "calories": "75", 
    "fiber_content": "0", 
    "protein_content": "0.1"
  }, 
  {
    "fat_content": "0", 
    "name": "Wine, white, medium", 
    "carbohydrate_content": "3", 
    "calories": "75", 
    "fiber_content": "0", 
    "protein_content": "0.1"
  }, 
  {
    "fat_content": "10.2", 
    "name": "Yogurt, Greek style, plain", 
    "carbohydrate_content": "4.8", 
    "calories": "133", 
    "fiber_content": "0", 
    "protein_content": "5.7"
  }, 
  {
    "fat_content": "1", 
    "name": "Yogurt, low fat, plain", 
    "carbohydrate_content": "7.8", 
    "calories": "57", 
    "fiber_content": "N", 
    "protein_content": "4.8"
  }, 
  {
    "fat_content": "6.3", 
    "name": "Tomato, sundried", 
    "carbohydrate_content": "19.9", 
    "calories": "175", 
    "fiber_content": "9.7", 
    "protein_content": "4.8"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Capers, in brine", 
    "carbohydrate_content": "3.5", 
    "calories": "34", 
    "fiber_content": "2.7", 
    "protein_content": "2.4"
  }, 
  {
    "fat_content": "47", 
    "name": "Coconut chips, toasted", 
    "carbohydrate_content": "44", 
    "calories": "592", 
    "fiber_content": "13", 
    "protein_content": "5"
  }, 
  {
    "fat_content": "0.4", 
    "name": "Cirio double concentrated tomato puree", 
    "carbohydrate_content": "16", 
    "calories": "95", 
    "fiber_content": "5.4", 
    "protein_content": "4.1"
  }, 
  {
    "fat_content": "1", 
    "name": "Gnocchi di Patate, De Cecco", 
    "carbohydrate_content": "32", 
    "calories": "155", 
    "fiber_content": "2.6", 
    "protein_content": "3.3"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Psyllium husks", 
    "carbohydrate_content": "0.1", 
    "calories": "189", 
    "fiber_content": "89", 
    "protein_content": "1.5"
  }, 
  {
    "fat_content": "53.8", 
    "name": "Chia seeds", 
    "carbohydrate_content": "6.2", 
    "calories": "431", 
    "fiber_content": "35.5", 
    "protein_content": "18"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Maple syrup", 
    "carbohydrate_content": "63", 
    "calories": "254", 
    "fiber_content": "0.2", 
    "protein_content": "0"
  }, 
  {
    "fat_content": "0.1", 
    "name": "Nam Pla Fish Sauce", 
    "carbohydrate_content": "12.3", 
    "calories": "97", 
    "fiber_content": "0", 
    "protein_content": "11.7"
  }, 
  {
    "fat_content": "6.3", 
    "name": "Soybeans, fresh or frozen", 
    "carbohydrate_content": "4.5", 
    "calories": "128", 
    "fiber_content": "0", 
    "protein_content": "11"
  }, 
  {
    "fat_content": "0.6", 
    "name": "Cannellini beans in water", 
    "carbohydrate_content": "13.3", 
    "calories": "101", 
    "fiber_content": "6.4", 
    "protein_content": "7.5"
  }, 
  {
    "fat_content": "30.2", 
    "name": "Za'atar", 
    "carbohydrate_content": "8.2", 
    "calories": "416", 
    "fiber_content": "26.1", 
    "protein_content": "14.7"
  }, 
  {
    "fat_content": "3.1", 
    "name": "Cracked freekeh", 
    "carbohydrate_content": "72", 
    "calories": "352", 
    "fiber_content": "17", 
    "protein_content": "15"
  }, 
  {
    "fat_content": "5.3", 
    "name": "Breadcrumbs", 
    "carbohydrate_content": "72", 
    "calories": "395", 
    "fiber_content": "4.5", 
    "protein_content": "13.35"
  }, 
  {
    "fat_content": "0", 
    "name": "Tamarind paste", 
    "carbohydrate_content": "26.1", 
    "calories": "109", 
    "fiber_content": "0.9", 
    "protein_content": "0.7"
  }, 
  {
    "fat_content": "12", 
    "name": "Coconut Flour", 
    "carbohydrate_content": "16", 
    "calories": "352", 
    "fiber_content": "42", 
    "protein_content": "18"
  }, 
  {
    "fat_content": "2.2", 
    "name": "Chestnut puree, unsweetened", 
    "carbohydrate_content": "17", 
    "calories": "103", 
    "fiber_content": "2.2", 
    "protein_content": "2.7"
  }, 
  {
    "fat_content": "42", 
    "name": "Chocolate, 70%, Green and Blacks", 
    "carbohydrate_content": "36", 
    "calories": "580", 
    "fiber_content": "10", 
    "protein_content": "9.1"
  }, 
  {
    "fat_content": "50", 
    "name": "Almonds, raw", 
    "carbohydrate_content": "22", 
    "calories": "579", 
    "fiber_content": "13", 
    "protein_content": "21"
  }, 
  {
    "fat_content": "67", 
    "name": "Brazil nuts, raw", 
    "carbohydrate_content": "12", 
    "calories": "659", 
    "fiber_content": "7.5", 
    "protein_content": "14"
  }, 
  {
    "fat_content": "51", 
    "name": "Sunflower seeds", 
    "carbohydrate_content": "20", 
    "calories": "584", 
    "fiber_content": "8.6", 
    "protein_content": "21"
  }, 
  {
    "fat_content": "49", 
    "name": "Pumpkin seeds", 
    "carbohydrate_content": "11", 
    "calories": "559", 
    "fiber_content": "6", 
    "protein_content": "30"
  }
]
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
const unitToGrams = {
  'clove': 5,
  'gram': 1,
  'millilitre': 1,
  'ounce': 28.3,
  'pound': 454,
  'teaspoon': 5,
  'tablespoon': 15
};

const foodMeasures = {
  'apple': 175,
  'banana': 151,
  'mandarin': 78,
  'mango': 274,
  'pear': 198,
  'aubergine': 572,
  'avocado': 210,
  'bok choy': 235,
  'capsicum': 275,
  'carrot': 168,
  'chilli': 15,
  'corn': 320,
  'cucumber': 187,
  'lettuce': 570,
  'mushroom': 100,
  'onion': 130,
  'potato': 229,
  'tomato': 145
};

function normalizeQuantity(quantity) {
  let match = quantity.match(/(\d+) (\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1]) + Number(match[2]) / Number(match[3])
  }
  match = quantity.match(/(\d+)\/(\d+)/)
  if (match != null) {
    return Number(match[1]) / Number(match[2])
  }
  return Number(quantity);
}

function calculateMass(quantity, unit, name) {
  quantityFloat = normalizeQuantity(quantity)
  if (isNaN(quantityFloat)) {
    return quantityFloat;
  }
  if (unit in unitToGrams) {
    return quantityFloat * unitToGrams[unit];
  }
  if (!unit && name in foodMeasures) {
    return quantityFloat * foodMeasures[name];
  }
  return NaN;
}

function calculateCarbs(foods) {
  let carbsTotal = 0.0;
  for (const food of foods) {
    if ('name' in food) {
      food['food'] = lookup(food['name']);
    }
    if ('qty' in food) {
      // TODO: won't normally match
      food['weight'] = calculateMass(food['qty'], food['unit'], food['name']);
    }
    if ('weight' in food && 'food' in food && food['food'] != null) {
      carbsTotal += getCarbs(food);
    }
  }
  return carbsTotal;
}

function getCarbs(food) {
  if ('food' in food && food['food'] != null) {
    let carbsStr = food['food']['carbohydrate_content'];
    if (carbsStr === '0' || carbsStr === 'N' || carbsStr === 'Tr') {
      return 0.0;
    } else if ('weight' in food) {
      return food['weight'] * carbsStr / 100.0;
    }
  }
  return NaN;
}