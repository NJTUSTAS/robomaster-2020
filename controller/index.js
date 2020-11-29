#!/usr/bin/node

const TagDetector = require("./tag_detector");
const RemoteControlServer = require("./remote_control");
const Vehicle = require("./vehicle");
const Motor = require("./motor");

const detector = new TagDetector();
detector.on("frame", result => {
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

const motor = new Motor();
motor.begin();
