const colors = require('colors');
const fs = require('fs');
const measures = require('../src/measures');
const ocr = require('../src/ocr');
const recipe = require('../src/recipe');
const tagger = require('../src/tagger');

// Eventually this should accept an image, a JSON response, or just a list of ingredient lines
const inputFile = process.argv[2];

const response = JSON.parse(fs.readFileSync(inputFile));

const servings = recipe.getServingsFromPage(response) || 1;
const text = recipe.getIngredientsTextFromPage(response);
console.log(text)
console.log();

const CRFNode = require('../CRF++-0.58/crf_test_node')
CRFNode().then(function(Module) {
    const FS = Module.FS;

    function crfTest(input) {
        FS.writeFile('input.txt', input);
        args = ['-v', '1', '-m', 'model_file', '-o', 'output.txt', 'input.txt'];
        Module['callMain'](args);
        return FS.readFile('output.txt', { encoding: 'utf8' }).split(/\n/);
    }

    function parseIngredients(lines) {
        return tagger.import_data(crfTest(tagger.export_data(lines)));
    }

    const lines = text.split(/\n/);
    const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);
    for (const food of foods) {
        console.log(`${food.qty || '-'} ${food.unit || '-'} ${food.name}`)
    }
    console.log();

    const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food, true));
    for (const foodWithCarbs of foodsWithCarbs) {
        if ('food' in foodWithCarbs && foodWithCarbs['food'] != null) {
            const name = foodWithCarbs['food']['name'];
            if (foodWithCarbs.success) {
                const c = Math.round(foodWithCarbs.carbs);
                if (c == 0.0) {
                    console.log(`${c}g ${name}`.grey);
                } else {
                    console.log(`${c}g ${name}`);
                }
            } else {
                console.log('?g'.red + ` ${name} ` + `${foodWithCarbs.reasonText}`.red);
            }
        } else {
            console.log('?g'.red + `${foodWithCarbs.reasonText}`.red);
        }
    }
    console.log();

    const totalCarbsInfo = measures.calculateTotalCarbs(foodsWithCarbs);
    const carbsPerServing = Math.round(totalCarbsInfo.carbs / servings);
    const warningIndicator = totalCarbsInfo.unknownFoods ? ">" : "";
    const carbsString = warningIndicator + carbsPerServing + "g carbs";
    console.log("Serves: " + servings);
    if (totalCarbsInfo.unknownFoods) {
        console.log(carbsString.yellow + " (per serving)");
    } else {
        console.log(carbsString.green + " (per serving)");
    }
});
