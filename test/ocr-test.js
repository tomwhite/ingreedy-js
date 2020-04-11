const assert = require('assert');
const ocr = require('../src/ocr');

const response0096 = require('./IMG_0096.JPG.google');
const response0100 = require('./IMG_0100.JPG.google');
const response0220 = require('./IMG_0220.JPG.google');

describe('getBlocks', function() {
    it('should find all blocks on page', function() {
        assert.equal(ocr.getBlocks(response0220).length, 5);
    });
});

describe('getTextFromBlock', function() {
    it('should find text for centre block', function() {
        assert.equal(ocr.getTextFromBlock(ocr.getCenterBlock(response0096)).trim(), `500g dried haricot beans
2-3 tablespoons vegetable oil
2 large onions, finely chopped or minced in a food processor
2 fat garlic cloves, crushed
1 tablespoon cocoa powder
2 teaspoons ground cinnamon
2 teaspoons ground cumin
1 teaspoon cayenne pepper
400g can chopped tomatoes
100g tamarind paste (the paste should be the consistency of a ketchup)
4 tablespoons brown sugar
4 tablespoons red wine vinegar
500ml boiling water
Maldon sea salt flakes and freshly ground black pepper
toasted bread, to serve`);
    });
    it('should find text for centre block, no indents so continuation lines are not detected', function() {
        assert.equal(ocr.getTextFromBlock(ocr.getCenterBlock(response0100)).trim(), `SERVES 6 WITH RICE,
OR AS A SIDE DISH
450g (11b) extra-firm tofu
900g (216) squash, ideally
Crown Prince, if you can
get it
3 tablespoons runny honey
6 tablespoons soy sauce
2 teaspoons chilli flakes
2cm (3/4in) fresh root ginger,
peeled and finely grated
125ml (4f1 oz) groundnut oil
sea salt flakes and freshly
ground black pepper
6 garlic cloves, very finely
sliced`);
    });
    it('should find text for centre block', function() {
        assert.equal(ocr.getTextFromBlock(ocr.getCenterBlock(response0220)).trim(), `10g (1/202) butter
50g (20z) onion, very finely chopped
450g (11b) beef (flank, chump or shin would be perfect), freshly minced
1/2 teaspoon fresh thyme leaves
1/2 teaspoon finely chopped parsley
1 small organic egg, beaten
salt and freshly ground pepper
pork caul fat (optional)
oil or dripping`);
    });
});