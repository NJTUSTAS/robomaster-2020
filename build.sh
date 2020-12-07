#!/bin/bash
pushd apriltag
cmake .
make
popd
pushd controller
npm install
popd
