#!/usr/bin/env bash

source emsdk/emsdk_env.sh

pushd CRF++-0.58/
emconfigure ./configure
emmake make
cp .libs/crf_test .libs/crf_test.bc
emcc .libs/crf_test.bc .libs/libcrfpp.dylib -o ../crf_test.html --preload-file ../model/model_file@model_file --preload-file ../ing.txt@ing.txt -s TOTAL_MEMORY=512MB -s ENVIRONMENT=web --no-heap-copy
rm ../crf_test.html
popd