#!/usr/bin/node
const Motor = require("./motor");
const motor = new Motor();
async function go_ahead(speed) {
    motor.setSpeed("left_front", speed);
    motor.setSpeed("left_back", speed);
    motor.setSpeed("right_front", speed);
    motor.setSpeed("right_back", speed);
}
go_ahead(0);
