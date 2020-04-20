const assert = require("assert");
const tagger = require("../src/tagger");

describe("tokenize", function () {
  it("should parse grams", function () {
    assert.deepEqual(tagger.tokenize("100 grams flour"), [
      "100",
      "grams",
      "flour",
    ]);
  });
  it("should parse g", function () {
    assert.deepEqual(tagger.tokenize("100g flour"), ["100", "grams", "flour"]);
  });
  it("should parse g with space", function () {
    assert.deepEqual(tagger.tokenize("100 g flour"), ["100", "grams", "flour"]);
  });
  it("should parse tsp", function () {
    assert.deepEqual(tagger.tokenize("2 tsp sugar"), [
      "2",
      "teaspoon",
      "sugar",
    ]);
  });
  it("should parse tsp with period", function () {
    assert.deepEqual(tagger.tokenize("2 tsp. sugar"), [
      "2",
      "teaspoon",
      "sugar",
    ]);
  });
  it("should parse complex line", function () {
    assert.deepEqual(
      tagger.tokenize("100 grams big, green apples (not rotten)"),
      ["100", "grams", "big", ",", "green", "apples", "(", "not", "rotten", ")"]
    );
  });
});

describe("clumpFractions", function () {
  it("should insert dollar", function () {
    assert.equal(tagger.clumpFractions("aaa 1 2/3 bbb"), "aaa 1$2/3 bbb");
  });
});

describe("unclump", function () {
  it("should reverse clumpFractions", function () {
    assert.equal(tagger.unclump("aaa 1$2/3 bbb"), "aaa 1 2/3 bbb");
  });
});

describe("cleanUnicodeFractions", function () {
  it("should handle simple fraction", function () {
    assert.equal(tagger.cleanUnicodeFractions("\u00bd"), " 1/2");
  });
  it("should handle mixed fraction", function () {
    assert.equal(tagger.cleanUnicodeFractions("1\u215e"), "1 7/8");
  });
});

describe("getFeatures", function () {
  it("should parse units", function () {
    const tokens = ["100", "grams", "potatoes"];
    assert.deepEqual(tagger.getFeatures("grams", 2, tokens), [
      "I2",
      "L4",
      "NoCAP",
      "NoPAREN",
    ]);
  });
});

describe("singularize", function () {
  it("should return singular form for ingredient units", function () {
    assert.equal(tagger.singularize("grams"), "gram");
  });
  it("should not handle other forms", function () {
    assert.equal(tagger.singularize("nights"), "nights");
  });
});

describe("isCapitalized", function () {
  it('should return true for "Apple"', function () {
    assert.equal(tagger.isCapitalized("Apple"), true);
  });
  it('should return false for "apple"', function () {
    assert.equal(tagger.isCapitalized("apple"), false);
  });
  it('should return false for "aPple"', function () {
    assert.equal(tagger.isCapitalized("aPple"), false);
  });
});

describe("lengthGroup", function () {
  it("should give 4 for lengthGroup 0", function () {
    assert.equal(tagger.lengthGroup(0), "4");
  });
  it("should give 4 for lengthGroup 1", function () {
    assert.equal(tagger.lengthGroup(1), "4");
  });
  it("should give 8 for lengthGroup 4", function () {
    assert.equal(tagger.lengthGroup(4), "8");
  });
  it("should give X for lengthGroup 20", function () {
    assert.equal(tagger.lengthGroup(20), "X");
  });
});

describe("insideParenthesis", function () {
  const tokens = [
    "100",
    "grams",
    "big",
    ",",
    "green",
    "apples",
    "(",
    "not",
    "rotten",
    ")",
  ];
  it("should return true for opening parenthesis", function () {
    assert.equal(tagger.insideParenthesis("(", tokens), true);
  });
  it("should return true for closing parenthesis", function () {
    assert.equal(tagger.insideParenthesis(")", tokens), true);
  });
  it("should return true for word in parentheses", function () {
    assert.equal(tagger.insideParenthesis("rotten", tokens), true);
  });
  it("should return false for word not in parentheses", function () {
    assert.equal(tagger.insideParenthesis("green", tokens), false);
  });
  it("should not fail for a regex character", function () {
    assert.equal(tagger.insideParenthesis("green [", tokens), false);
  });
});

describe("smartJoin", function () {
  it("should return singular form for ingredient units", function () {
    assert.equal(
      tagger.smartJoin([
        "big",
        ",",
        "green",
        "apples",
        "(",
        "not",
        "rotten",
        ")",
      ]),
      "big, green apples (not rotten)"
    );
  });
});

describe("import_data", function () {
  const lines = [
    "# 0.511035",
    "1/2       I1  L12  NoCAP  X  B-QTY/0.982850",
    "teaspoon  I2  L12  NoCAP  X  B-UNIT/0.982200",
    "fresh     I3  L12  NoCAP  X  B-COMMENT/0.716364",
    "thyme     I4  L12  NoCAP  X  B-NAME/0.816803",
    "leaves    I5  L12  NoCAP  X  I-NAME/0.960524",
    ",         I6  L12  NoCAP  X  B-COMMENT/0.772231",
    "finely    I7  L12  NoCAP  X  I-COMMENT/0.825956",
    "chopped   I8  L12  NoCAP  X  I-COMMENT/0.893379",
    "",
    "# 0.505999",
    "Black   I1  L8  YesCAP  X  B-NAME/0.765461",
    "pepper  I2  L8  NoCAP   X  I-NAME/0.756614",
    ",       I3  L8  NoCAP   X  OTHER/0.798040",
    "to      I4  L8  NoCAP   X  B-COMMENT/0.683089",
    "taste   I5  L8  NoCAP   X  I-COMMENT/0.848617",
  ].map((line) => line.replace(/ +/g, "\t")); // replace spaces with tabs
  const output = tagger.import_data(lines);

  it("should return output of same length", function () {
    assert.equal(output.length, 2);
  });

  it("should return name", function () {
    assert.equal(output[0]["name"], "thyme leaves");
  });
  it("should return unit", function () {
    assert.equal(output[0]["unit"], "teaspoon");
  });
  it("should return comment", function () {
    assert.equal(output[0]["comment"], "fresh, finely chopped");
  });
  it("should return display", function () {
    assert.equal(
      output[0]["display"],
      "<span class='qty'>1/2</span><span class='unit'>teaspoon</span><span class='comment'>fresh</span><span class='name'>thyme leaves</span><span class='comment'>, finely chopped</span>"
    );
  });
  it("should return input", function () {
    assert.equal(
      output[0]["input"],
      "1/2 teaspoon fresh thyme leaves, finely chopped"
    );
  });

  it("should return name", function () {
    assert.equal(output[1]["name"], "Black pepper");
  });
  it("should return comment", function () {
    assert.equal(output[1]["comment"], "to taste");
  });
  it("should return display", function () {
    assert.equal(
      output[1]["display"],
      "<span class='name'>Black pepper</span><span class='other'>,</span><span class='comment'>to taste</span>"
    );
  });
  it("should return input", function () {
    assert.equal(output[1]["input"], "Black pepper, to taste");
  });
});

describe("export_data", function () {
  it("should convert ingredient lines", function () {
    const lines = ["100 grams potatoes", "2 large eggs, freshly laid"];
    assert.equal(
      tagger.export_data(lines),
      `100	I1	L4	NoCAP	NoPAREN
grams	I2	L4	NoCAP	NoPAREN
potatoes	I3	L4	NoCAP	NoPAREN

2	I1	L8	NoCAP	NoPAREN
large	I2	L8	NoCAP	NoPAREN
eggs	I3	L8	NoCAP	NoPAREN
,	I4	L8	NoCAP	NoPAREN
freshly	I5	L8	NoCAP	NoPAREN
laid	I6	L8	NoCAP	NoPAREN
`
    );
  });
});
