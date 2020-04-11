const measures = require('./src/measures')
const ocr = require('./src/ocr')
const servngs = require('./src/servings')
const tagger = require('./src/tagger')

const fileInput = document.getElementById('file-input');
fileInput.onchange = function(e) {
  loadImage(
    e.target.files[0],
    function(img) {
      const dataUrl = img.toDataURL('image/png');
      document.getElementById('output').src = dataUrl;
      const base64Img = dataUrl.replace('data:image/png;base64,', '');
      ocr.makeVisionRequest(
          base64Img, 'AIzaSyChp1eQ02e3IDQbJ5aqcs2I_27GIn-TsxA',
          function(response) {
            hideFileInput();
            showResultsContainer();

            // servings
            const servings = servngs.getServingsFromPage(response);
            if (!isNaN(servings)) {
                document.getElementById('servings').value = servings;
            }

            // ingredients
            const centerBlock = ocr.getCenterBlock(response);
            const text = ocr.getTextFromBlock(centerBlock).trim();
            const textArea = document.getElementById('ingredients_box');
            textArea.value = text;
            textArea.rows = text.split("\n").length + 1;
            updateNutrients();
          });
    },
    {
      maxWidth: 1024,
      maxHeight: 768,
      orientation: true
    }
  );
};


      function hideFileInput() {
        document.getElementById('scan_container').style.display = 'none';
      }

      function showResultsContainer() {
        document.getElementById('result_container').style.display = '';
      }

      const servingsSelect = document.getElementById('servings');
      servingsSelect.addEventListener('input', (e) => servingsChanged(e));

      function servingsChanged(e) {
        updateNutrients();
      }

      const textArea = document.getElementById('ingredients_box');
      textArea.addEventListener('input', (e) => textChanged(e));

      function textChanged(e) {
        updateNutrients();
      }

      function updateNutrients() {
        const text = document.getElementById('ingredients_box').value;
        const lines = text.split(/\n/);
        const foods = parseIngredients(lines).filter(food => food['input'].trim().length > 0);
        const foodsWithCarbs = foods.map(food => measures.calculateCarbsInFood(food));
        const totalCarbsInfo = measures.calculateTotalCarbs(foodsWithCarbs);
        const servings = document.getElementById('servings').value;
        const carbsPerServing = Math.round(totalCarbsInfo.carbs / servings);
        const warningIndicator = totalCarbsInfo.unknownFoods ? ">" : "";
        document.getElementById('carbohydrate_content').innerHTML = warningIndicator + carbsPerServing + "g Carbs";
        if (totalCarbsInfo.unknownFoods) {
            document.getElementById('carbohydrate_content').className = "badge badge-pill badge-warning";
        } else {
            document.getElementById('carbohydrate_content').className = "badge badge-pill badge-success";
        }

        let breakdown = '';
        for (const foodWithCarbs of foodsWithCarbs) {
          console.log(foodWithCarbs);
          if ('food' in foodWithCarbs && foodWithCarbs['food'] != null) {
            const name = foodWithCarbs['food']['name'];
            if (foodWithCarbs.success) {
              const c = Math.round(foodWithCarbs.carbs);
              if (c == 0.0) {
                breakdown += '<span class="zero_carbs">' + c + 'g ' + name + '</span>' + '<br/>';
              } else {
                breakdown += c + 'g ' + name + '<br/>';
              }
            } else {
              breakdown += '<span class="error">?</span>g ' + name + ' <span class="error">' + foodWithCarbs.reason + '</span><br/>';
            }
          } else {
            breakdown += '<span class="error">?</span>g <span class="error">' + foodWithCarbs.reason + '</span><br/>';
          }
        }
        document.getElementById('breakdown').innerHTML = breakdown;
      }

      function parseIngredients(lines) {
        return tagger.import_data(crfTest(tagger.export_data(lines)));
      }
      
module.exports = {updateNutrients: updateNutrients};
