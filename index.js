const loadImage = require("blueimp-load-image");
const measures = require("./src/measures");
const ocr = require("./src/ocr");
const recipe = require("./src/recipe");
const tagger = require("./src/tagger");

const urlParams = new URLSearchParams(window.location.search);
const key = urlParams.get("key"); // need a key for OCR

let selectedBlocks = [];

const fileInput = document.getElementById("file-input");
if (key != null && fileInput != null) {
  showFileInput();
  fileInput.onchange = function (e) {
    loadImage(
      e.target.files[0],
      function (img) {
        const dataUrl = img.toDataURL("image/png");
        const canvas = document.getElementById("imgbox").appendChild(img);
        const ctx = canvas.getContext("2d");
        canvas.className = "center-fit";
        const base64Img = dataUrl.replace("data:image/png;base64,", "");
        ocr.makeVisionRequest(base64Img, key, function (response) {
          hideFileInput();
          showResultsContainer();

          const blocks = ocr.getBlocks(response);

          // Add listener to toggle blocks
          canvas.addEventListener("click", (event) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const canvasX = (mouseX * canvas.width) / canvas.clientWidth;
            const canvasY = (mouseY * canvas.height) / canvas.clientHeight;
            blocks.forEach((block) => {
              const vertices = block["boundingBox"]["vertices"];
              // construct a path to see if user has clicked on it, but don't render it
              const box = new Path2D();
              box.moveTo(vertices[0].x, vertices[0].y);
              for (let i = 1; i < vertices.length; i++) {
                box.lineTo(vertices[i].x, vertices[i].y);
              }
              box.closePath();
              if (ctx.isPointInPath(box, canvasX, canvasY)) {
                const index = selectedBlocks.indexOf(block);
                if (index >= 0) {
                  // remove block
                  selectedBlocks.splice(index, 1);
                } else {
                  // add block
                  // We want selected blocks to be in same order as blocks...
                  const selectedBlocksCopy = selectedBlocks.slice();
                  selectedBlocksCopy.push(block);
                  selectedBlocks = [];
                  blocks.forEach((block) => {
                    if (selectedBlocksCopy.includes(block)) {
                      selectedBlocks.push(block);
                    }
                  });
                }
              }
              updateIngredientsFromSelectedBlocks(ctx, blocks, selectedBlocks);
            });
          });

          // servings
          const servings = recipe.getServingsFromPage(response);
          if (!isNaN(servings)) {
            document.getElementById("servings").value = servings;
          }

          // ingredients
          selectedBlocks = recipe.getIngredientsBlocksFromPage(response);
          updateIngredientsFromSelectedBlocks(ctx, blocks, selectedBlocks);
        });
      },
      {
        maxWidth: 1024,
        maxHeight: 768,
        canvas: true,
      }
    );
  };
} else {
  hideScannedImage();
  showResultsContainer();
}

function hideFileInput() {
  document.getElementById("scan_container").style.display = "none";
}

function showFileInput() {
  document.getElementById("scan_container").style.display = "";
}

function hideScannedImage() {
  document.getElementById("imgbox_container").style.display = "none";
}

function showResultsContainer() {
  document.getElementById("result_container").style.display = "";
}

const servingsSelect = document.getElementById("servings");
servingsSelect.addEventListener("input", (e) => servingsChanged(e));

function servingsChanged() {
  updateNutrients();
}

const textArea = document.getElementById("ingredients_box");
textArea.addEventListener("input", (e) => textChanged(e));

function textChanged() {
  updateNutrients();
}

function updateNutrients() {
  const text = document.getElementById("ingredients_box").value;
  const lines = text.split(/\n/);
  const foods = parseIngredients(lines).filter(
    (food) => food["input"].trim().length > 0
  );
  const foodsWithCarbs = foods.map((food) =>
    measures.calculateCarbsInFood(food, true)
  );
  const totalCarbsInfo = measures.calculateTotalCarbs(foodsWithCarbs);
  const servings = document.getElementById("servings").value;
  const carbsPerServing = Math.round(totalCarbsInfo.carbs / servings);
  const warningIndicator = totalCarbsInfo.unknownFoods ? ">" : "";
  document.getElementById("carbohydrate_content").innerHTML =
    warningIndicator + carbsPerServing + "g Carbs";
  if (totalCarbsInfo.unknownFoods) {
    document.getElementById("carbohydrate_content").className =
      "badge badge-pill badge-warning";
  } else {
    document.getElementById("carbohydrate_content").className =
      "badge badge-pill badge-success";
  }

  let breakdown = "";
  for (const foodWithCarbs of foodsWithCarbs) {
    console.log(foodWithCarbs);
    if ("food" in foodWithCarbs && foodWithCarbs["food"] != null) {
      const name = foodWithCarbs["food"]["name"];
      if (foodWithCarbs.success) {
        const c = Math.round(foodWithCarbs.carbs);
        if (c == 0.0) {
          breakdown +=
            '<span class="zero_carbs">' + c + "g " + name + "</span>" + "<br/>";
        } else {
          breakdown += c + "g " + name + "<br/>";
        }
      } else {
        breakdown +=
          '<span class="error">?</span>g ' +
          name +
          ' <span class="error">' +
          foodWithCarbs.reasonText +
          "</span><br/>";
      }
    } else {
      breakdown +=
        '<span class="error">?</span>g <span class="error">' +
        foodWithCarbs.reasonText +
        "</span><br/>";
    }
  }
  document.getElementById("breakdown").innerHTML = breakdown;
}

function parseIngredients(lines) {
  return tagger.import_data(crfTest(tagger.export_data(lines))); // eslint-disable-line no-undef
}

function updateIngredientsFromSelectedBlocks(ctx, blocks, selectedBlocks) {
  const text = recipe.getIngredientsTextFromBlocks(selectedBlocks);
  drawBoundingBoxes(ctx, blocks, selectedBlocks);
  const textArea = document.getElementById("ingredients_box");
  textArea.value = text;
  textArea.rows = text.split("\n").length + 1;
  updateNutrients();
}

function drawBoundingBoxes(ctx, blocks, selectedBlocks) {
  blocks.forEach((block) => {
    const vertices = block["boundingBox"]["vertices"];
    const box = new Path2D();
    box.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      box.lineTo(vertices[i].x, vertices[i].y);
    }
    box.closePath();
    if (selectedBlocks.includes(block)) {
      ctx.strokeStyle = "green";
    } else {
      ctx.strokeStyle = "orange";
    }
    ctx.stroke(box);
  });
}

module.exports = { updateNutrients: updateNutrients };
