const colors = require('colors');
const foodmap = require('../src/foodmap')
const fs = require('fs');
const measures = require('../src/measures');
const ocr = require('../src/ocr');
const path = require('path');
const tagger = require('../src/tagger');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
};

const input = process.argv[2];

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

    function printFoodsNotInFoodMap(inputFile) {
        const response = JSON.parse(fs.readFileSync(inputFile));
        const centerBlock = ocr.getCenterBlock(response);
        if (!centerBlock) {
            return;
        }
        const text = ocr.getTextFromBlock(centerBlock).trim();
        const lines = text.split(/\n/);
        const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);

        const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food));
        for (const foodWithCarbs of foodsWithCarbs) {
            if (!foodWithCarbs.success && foodWithCarbs.reason === measures.FailureReason.UNIT_NOT_FOUND) {
                console.log(`${inputFile}:${foodWithCarbs.reasonText}`);
            }
        }
    }

    if (fs.lstatSync(input).isDirectory()) {
        // walk directory and run for each file
        walkDir(input, function(inputFile) {
            if (inputFile.toLowerCase().endsWith('.google.json')) {
                printFoodsNotInFoodMap(inputFile);
            }
        });
    } else {
        // single file
        printFoodsNotInFoodMap(input);
    }

});
