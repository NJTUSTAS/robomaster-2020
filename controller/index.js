#!/usr/bin/node

const TagDetector = require("./tag_detector");
const MPU6050 = require("./mpu6050");
const RemoteControlServer = require("./remote_control");
const Vehicle = require("./vehicle");

const detector = new TagDetector();
detector.on("frame", result => {
    console.log(JSON.stringify(result));
});

const mpu6050 = new MPU6050();
mpu6050.on("motion", result => {
    console.log(JSON.stringify(result));
});

const remoteControl = new RemoteControlServer();
remoteControl.on("speed", result => {
    console.log(JSON.stringify(result));
});
remoteControl.on("mode", result => {
    console.log(JSON.stringify(result));
});

const vehicle = new Vehicle();
vehicle.on("sonar", result => {
    console.log(JSON.stringify(result));
});
