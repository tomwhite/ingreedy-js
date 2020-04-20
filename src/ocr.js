// Unlike browsers, Node doesn't have the XMLHttpRequest variable, so we need to emulate it
var XHR =
  typeof XMLHttpRequest === "undefined"
    ? require("xmlhttprequest").XMLHttpRequest
    : XMLHttpRequest;

function makeVisionRequest(base64Img, key, successCallback) {
  const http = new XHR();
  const url = "https://vision.googleapis.com/v1/images:annotate?key=" + key;
  const data = {
    requests: [
      {
        image: { content: base64Img },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      },
    ],
  };

  http.open("POST", url, true);
  http.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  http.onreadystatechange = function () {
    if (http.readyState == 4 && http.status == 200) {
      successCallback(JSON.parse(http.responseText));
    }
  };
  http.send(JSON.stringify(data));
}

function getBlocks(response) {
  // get all the blocks on the first page of the response JSON
  return response["responses"][0]["fullTextAnnotation"]["pages"][0]["blocks"];
}

function getCenterBlock(response) {
  // get block that overlaps the center of the page
  const page = response["responses"][0]["fullTextAnnotation"]["pages"][0];
  const midx = page["width"] / 2;
  const midy = page["height"] / 2;
  const overlappingBlocks = getBlocks(response).filter(function (block) {
    const [minx, miny, maxx, maxy] = getExtents(
      block["boundingBox"]["vertices"]
    );
    return minx <= midx && midx <= maxx && miny <= midy && midy <= maxy;
  });
  return overlappingBlocks[0];
}

function getExtents(vertices) {
  // find the min and max extents of a set of vertices
  let minx = Number.MAX_SAFE_INTEGER;
  let miny = Number.MAX_SAFE_INTEGER;
  let maxx = Number.MIN_SAFE_INTEGER;
  let maxy = Number.MIN_SAFE_INTEGER;
  vertices.forEach(function (vertex) {
    if (vertex["x"] < minx) {
      minx = vertex["x"];
    }
    if (vertex["y"] < miny) {
      miny = vertex["y"];
    }
    if (vertex["x"] > maxx) {
      maxx = vertex["x"];
    }
    if (vertex["y"] > maxy) {
      maxy = vertex["y"];
    }
  });
  return [minx, miny, maxx, maxy];
}

function getTextFromBlock(block) {
  // construct the text that is in a block
  let text = "";
  let lineBreakBuffer = "";
  block["paragraphs"].forEach(function (paragraph) {
    if (lineBreakBuffer.length > 0) {
      // treat a new para as a line continuation
      text += " ";
      lineBreakBuffer = "";
    }
    paragraph["words"].forEach(function (word) {
      word["symbols"].forEach(function (symbol) {
        if (lineBreakBuffer.length > 0) {
          text += lineBreakBuffer;
          lineBreakBuffer = "";
        }
        text += symbol["text"];
        if ("property" in symbol && "detectedBreak" in symbol["property"]) {
          const detectedBreakType = symbol["property"]["detectedBreak"]["type"];
          if (
            detectedBreakType === "SPACE" ||
            detectedBreakType === "SURE_SPACE"
          ) {
            text += " ";
          } else if (
            detectedBreakType === "EOL_SURE_SPACE" ||
            detectedBreakType === "LINE_BREAK"
          ) {
            lineBreakBuffer = "\n";
          }
        }
      });
    });
  });
  if (!text.endsWith("\n")) {
    text += "\n";
  }
  return text;
}

exports.getBlocks = getBlocks;
exports.getCenterBlock = getCenterBlock;
exports.getExtents = getExtents;
exports.getTextFromBlock = getTextFromBlock;
exports.makeVisionRequest = makeVisionRequest;
