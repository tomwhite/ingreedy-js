function makeVisionRequest(base64Img, key, successCallback) {
  const http = new XMLHttpRequest();
  const url = 'https://vision.googleapis.com/v1/images:annotate?key=' + key;
  const data = {
    'requests': [{
      'image': {'content': base64Img},
      'features': [{'type': 'DOCUMENT_TEXT_DETECTION'}]
    }]
  };

  http.open('POST', url, true);
  http.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      successCallback(JSON.parse(http.responseText));
    }
  };
  http.send(JSON.stringify(data));
}

function getBlocks(response) {
  // get all the blocks on the first page of the response JSON
  return response['responses'][0]['fullTextAnnotation']['pages'][0]['blocks'];
}

function getCenterBlock(response) {
  // get block that overlaps the center of the page
  // TODO: make this more robust by finding the nearest block that overlaps
  const page = response['responses'][0]['fullTextAnnotation']['pages'][0];
  const midx = page['width'] / 2;
  const midy = page['height'] / 2;
  const overlappingBlocks = getBlocks(response).filter(function(block) {
    const [minx, miny, maxx, maxy] =
        getExtents(block['boundingBox']['vertices']);
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
  vertices.forEach(function(vertex) {
    if (vertex['x'] < minx) {
      minx = vertex['x'];
    }
    if (vertex['y'] < miny) {
      miny = vertex['y'];
    }
    if (vertex['x'] > maxx) {
      maxx = vertex['x'];
    }
    if (vertex['y'] > maxy) {
      maxy = vertex['y'];
    }
  });
  return [minx, miny, maxx, maxy];
}

function getTextFromBlock(block) {
  // construct the text that is in a block
  let text = '';
  block['paragraphs'].forEach(function(paragraph) {
    paragraph['words'].forEach(function(word) {
      word['symbols'].forEach(function(symbol) {
        text += symbol['text'];
        if ('detectedBreak' in symbol['property']) {
          const detectedBreakType = symbol['property']['detectedBreak']['type'];
          if (detectedBreakType === 'SPACE' ||
              detectedBreakType === 'SURE_SPACE') {
            text += ' ';
          } else if (
              detectedBreakType === 'EOL_SURE_SPACE' ||
              detectedBreakType === 'LINE_BREAK') {
            text += '\n';
          }
        }
      });
    });
  });
  return text;
}

// https://stackoverflow.com/a/56907342
/**
 *
 * @param gOCR  The Google Vision response
 * @return orientation (0, 90, 180 or 270)
 */
function getOrientation(gOCR) {
    var vertexList = gOCR.responses[0].textAnnotations[1].boundingPoly.vertices;

    const ORIENTATION_NORMAL = 0;
    const ORIENTATION_270_DEGREE = 270;
    const ORIENTATION_90_DEGREE = 90;
    const ORIENTATION_180_DEGREE = 180;

    var centerX = 0, centerY = 0;
    for (var i = 0; i < 4; i++) {
        centerX += vertexList[i].x;
        centerY += vertexList[i].y;
    }
    centerX /= 4;
    centerY /= 4;

    var x0 = vertexList[0].x;
    var y0 = vertexList[0].y;

    if (x0 < centerX) {
        if (y0 < centerY) {

            return ORIENTATION_NORMAL;
        } else {
            return ORIENTATION_270_DEGREE;
        }
    } else {
        if (y0 < centerY) {
            return ORIENTATION_90_DEGREE;
        } else {
            return ORIENTATION_180_DEGREE;
        }
    }
}