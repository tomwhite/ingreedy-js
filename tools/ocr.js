const fs = require('fs');
const ocr = require('../src/ocr');
const path = require('path');

function base64Encode(file) {
    const bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}

const inputFile = process.argv[2];
const outputDir = process.argv[3];
const key = process.argv[4];

const base64EncodedFileContent = base64Encode(inputFile);
const outputFile = path.join(outputDir, path.basename(inputFile) + ".google.json")

ocr.makeVisionRequest(base64EncodedFileContent, key,
    response => fs.writeFileSync(outputFile, JSON.stringify(response, null, 2)));
