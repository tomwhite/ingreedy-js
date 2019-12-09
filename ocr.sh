# Run OCR on an image and return the JSON response. Useful for testing.

# E.g. ./ocr.sh $KEY gs://tom-ingreedy/IMG_0220.JPG > IMG_0220.JPG.google.json

if [[ $# -ne 2 ]] ; then
    echo 'Usage: ./ocr.sh <KEY> <URL>'
    exit 1
fi

KEY=$1
URL=$2

curl -X POST -H "Content-Type: application/json; charset=utf-8" --data "{
'requests': [
     {
       'image': {
         'source': {
           'imageUri':'$URL'
          }
        },
        'features': [
          {
           'type': 'DOCUMENT_TEXT_DETECTION'
          }
        ]
      }
  ]
 }" "https://vision.googleapis.com/v1/images:annotate?key=$KEY"