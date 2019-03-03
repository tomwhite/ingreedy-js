## Building CRF++ with Emscripten

Install Emscripten: https://github.com/emscripten-core/emsdk

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk update
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
```

Download CRF++ source tar.gz: https://taku910.github.io/crfpp/#source

```bash
tar zxf CRF++-0.58.tar.gz
```

Build

```bash
cd CRF++-0.58/
emconfigure ./configure
emmake make
cp .libs/crf_learn .libs/crf_learn.bc
emcc .libs/crf_learn.bc .libs/libcrfpp.dylib -o crf_learn.js
cp .libs/crf_test .libs/crf_test.bc
emcc .libs/crf_test.bc .libs/libcrfpp.dylib -o crf_test.js

#
emcc .libs/crf_test.bc .libs/libcrfpp.dylib -o crf_test.html --preload-file ../model/model_file@model_file --preload-file ../ing.txt@ing.txt -s ALLOW_MEMORY_GROWTH=1 -s ENVIRONMENT=web --emrun
emrun crf_test.html -v 1 -m model_file ing.txt

# Bundle the model file (doesn't work yet)
#emcc .libs/crf_test.bc .libs/libcrfpp.dylib -o crf_test.js --preload-file ../model/model_file@model_file

```

Run

```bash
node crf_learn.js --help
node crf_test.js --help
```