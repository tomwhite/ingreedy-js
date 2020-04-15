const colors = require('colors');
const fs = require('fs');
const measures = require('../src/measures');
const path = require('path');
const recipe = require('../src/recipe');
const tagger = require('../src/tagger');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
};

function getIngredientsLinesFromFile(inputFile) {
    if (inputFile.endsWith(".json")) {
        const response = JSON.parse(fs.readFileSync(inputFile));
        const text = recipe.getIngredientsTextFromPage(response);
        if (text == null) {
            return {};
        }
        return text.split(/\n/);    
    } else if (inputFile.endsWith(".tsv")) {
        return fs.readFileSync(inputFile, "utf8")
            .split(/\n/)
            .slice(1) // remove header
            .map(line => line.split('\t')[1]) // TODO: pull out named field
            .filter(line => line !== undefined);
    }
}

const input = process.argv[2];
const outcome = process.argv[3];
const fallbackToSearch = process.argv[4] || false;

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
        const lines = getIngredientsLinesFromFile(inputFile);
        const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);

        const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food, fallbackToSearch));
        const outcomes = {};
        for (const foodWithCarbs of foodsWithCarbs) {
            outcomes[foodWithCarbs.outcome] = (outcomes[foodWithCarbs.outcome] || 0) + 1;
            if (foodWithCarbs.outcome === Symbol.for(outcome)) {
                console.log(`${inputFile}|${foodWithCarbs.reasonText}|${foodWithCarbs.input}|${foodWithCarbs.qty || ''}|${foodWithCarbs.unit || ''}|${foodWithCarbs.food ? foodWithCarbs.food.name || '' : ''}`);
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
