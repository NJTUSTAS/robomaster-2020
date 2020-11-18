#!/bin/bash
pushd apriltag
cmake .
make
popd
pushd mpu6050
make
popd
pushd controller
npm install
popd
