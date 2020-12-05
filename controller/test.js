#!/usr/bin/node

const Vehicle = require("./vehicle");
const Motor = require("./motor");
const { EventEmitter } = require("events");
const sleep = require("await-sleep");
const ShotTargetAction = require("./shot_target");

const vehicle = new Vehicle();
const motor = new Motor();

async function go_ahead(speed) {
    motor.setSpeed("left_front", speed);
    motor.setSpeed("left_back", speed);
    motor.setSpeed("right_front", speed);
    motor.setSpeed("right_back", speed);
}

/**
 * @param {number} speed positive for left, negative for right
 */
async function go_crab(speed) {
    motor.setSpeed("right_front", speed);
    motor.setSpeed("left_back", speed);
    motor.setSpeed("left_front", -speed);
    motor.setSpeed("right_back", -speed);
}

/**
 * @param {number} speed positive for left, negative for right
 */
async function rotate(speed) {
    motor.setSpeed("left_front", -speed);
    motor.setSpeed("left_back", -speed);
    motor.setSpeed("right_front", speed);
    motor.setSpeed("right_back", speed);
}

(async()=>{
    await motor.begin();
    await rotate(.3);
    await sleep(1000);
    await rotate(0);
})();
