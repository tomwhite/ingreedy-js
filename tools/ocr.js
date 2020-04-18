const fs = require('fs');
const ocr = require('../src/ocr');
const path = require('path');

function base64Encode(file) {
    const bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
};

function getOutputFile(relativeInputFile, outputDir) {
    return path.join(outputDir, relativeInputFile + ".google.json");
}

function ocrFile(inputFile, outputFile, key) {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    if (fs.existsSync(outputFile)) {
        console.log(`${outputFile} already exists`);
    } else {
        const base64EncodedFileContent = base64Encode(inputFile);
        ocr.makeVisionRequest(base64EncodedFileContent, key,
            response => fs.writeFileSync(outputFile, JSON.stringify(response, null, 2)));
    }
}

const input = process.argv[2];
const outputDir = process.argv[3];
const key = process.argv[4];

if (fs.lstatSync(input).isDirectory()) {
    // walk directory and run for each file
    walkDir(input, function(inputFile) {
        if (inputFile.toLowerCase().endsWith('.jpg')) {
            const outputFile = getOutputFile(path.relative(input, inputFile), outputDir)
            ocrFile(inputFile, outputFile, key);
        }
    });
} else {
    // single file
    ocrFile(input, getOutputFile(path.relative(input, inputFile), outputDir), key);
}
