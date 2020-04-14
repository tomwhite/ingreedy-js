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
const outcome = process.argv[3];

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
            return {};
        }
        const text = ocr.getTextFromBlock(centerBlock).trim();
        const lines = text.split(/\n/);
        const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);

        const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food));
        const outcomes = {};
        for (const foodWithCarbs of foodsWithCarbs) {
            outcomes[foodWithCarbs.outcome] = (outcomes[foodWithCarbs.outcome] || 0) + 1;
            if (foodWithCarbs.outcome === Symbol.for(outcome)) {
                console.log(`${inputFile}|${foodWithCarbs.reasonText}|${foodWithCarbs.input}|${foodWithCarbs.qty || ''}|${foodWithCarbs.unit || ''}|${foodWithCarbs.food.name || ''}`);
            }
        }
        return outcomes;
    }

    function mergeOutcomes(outcomes1, outcomes2) {
        const outcomes = {...outcomes1, ...outcomes2};
        for (let key of Object.getOwnPropertySymbols(outcomes)) {
            outcomes[key] = (outcomes1[key] || 0) + (outcomes2[key] || 0);
        }
        return outcomes;
    }

    function printOutcomesSummary(outcomes) {
        let success = 0;
        let total = 0;
        for (const key of Object.getOwnPropertySymbols(outcomes)) {
            if (key === measures.Outcome.SUCCESS) {
                success += outcomes[key];
            }
            total += outcomes[key];
            console.log(`${key.toString()}: ${outcomes[key]}`);
        }
        console.log(`Success: ${(100.0 * success / total).toFixed(2)}%`)
    }

    if (fs.lstatSync(input).isDirectory()) {
        // walk directory and run for each file
        let outcomes = {};
        walkDir(input, function(inputFile) {
            if (inputFile.toLowerCase().endsWith('.google.json')) {
                const newOutcomes = printFoodsNotInFoodMap(inputFile);
                outcomes = mergeOutcomes(outcomes, newOutcomes);
            }
        });
        console.log();
        printOutcomesSummary(outcomes);
    } else {
        // single file
        const outcomes = printFoodsNotInFoodMap(input);
        console.log();
        printOutcomesSummary(outcomes);
    }

});
