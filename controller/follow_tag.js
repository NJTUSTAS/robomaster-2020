#!/usr/bin/node

function find_center(tag_id, detect_result) {
    for (const det of detect_result.detections) {
        if (det.id === tag_id) {
            return det.center;
        }
    }
    return null;
}

function calc_err(tag_center) {
    return [
        tag_center[0] / 960 - .5,
        tag_center[1] / 720 - .5
    ];
}

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

class TagFollower {
    constructor() {
        this.kp_v = 1.5;
        this.ki_v = 0;
        this.kd_v = 0.2;
        this.kp_h = 0.5;
        this.ki_h = 0;
        this.kd_h = 0;
        this.err_sum = [0, 0];
        this.last_center = null;
        this.last_time = null;
    }
    /**
     * @param {[number|null,number|null]} detect_result
     */
    onDetection(detect_result) {
        const current_time = Date.now() / 1000;
        let current_center = find_center(0, detect_result);
        if (current_center === null) {
		return [0, null];
        }
        if (this.last_center === null || this.last_time === null) {
            this.last_center = current_center;
            this.last_time = current_time;
            return [null, null];
        }

        const current_err = calc_err(current_center);
        const last_err = calc_err(this.last_center);
        const dt = current_time - this.last_time;

        this.last_time = current_time;
        this.last_center = current_center;
        this.err_sum[0] += current_err[0] * dt;
        this.err_sum[1] += current_err[1] * dt;

        const control_v_p = this.kp_v * current_err[1];
        const control_v_i = this.ki_v * this.err_sum[1];
        const control_v_d = this.kd_v * (current_err[1] - last_err[1]) / dt;
        let control_v;
        if (Math.abs(current_err[1]) < .03) {
            control_v = 0;
        } else {
            control_v = control_v_p + control_v_i + control_v_d;
        }
        console.log(`v_p=${control_v_p} v_i=${control_v_i} v_d=${control_v_d}`);

        const control_h_p = this.kp_h * current_err[0];
        const control_h_i = this.ki_h * this.err_sum[0];
        const control_h_d = this.kd_h * (current_err[0] - last_err[1]) / dt;
        let control_h;
        if (Math.abs(current_err[0]) < .03) {
            control_h = 0;
        } else {
            control_h = control_h_p + control_h_i + control_h_d;
        }
        console.log(`h_p=${control_h_p} h_i=${control_h_i} h_d=${control_h_d}`);

        return [-control_h, -control_v];
    }
}

const TagDetector = require("./tag_detector");
const Vehicle = require("./vehicle");
const Motor = require("./motor");

const detector = new TagDetector();
const vehicle = new Vehicle();
const follower = new TagFollower();
const motor = new Motor();

motor.begin();

let pitch = 4700;
vehicle.setPitch(pitch);

detector.on("frame", async detect_result => {
    const control = follower.onDetection(detect_result);
    if (typeof control[1] === "number") {
        pitch += control[1] * 100;
        pitch = clamp(pitch, 4000, 6800);
        console.log(`Set pitch to ${pitch}, control is ${control[1]}`);
        await vehicle.setPitch(pitch);
    }

    if (typeof control[0] === 'number') {
        const rotateSpeed = clamp(control[0], -.2, .2);
        console.log(`Set rotation speed to ${rotateSpeed}, control is ${control[0]}`);
        motor.setSpeed("left_front", -rotateSpeed);
        motor.setSpeed("left_back", -rotateSpeed);
        motor.setSpeed("right_front", rotateSpeed);
        motor.setSpeed("right_back", rotateSpeed);
    }
});

const stdin = process.openStdin();
stdin.on("data", data => {
    for (const x of data.toString()) {
        if (x === "\n") {
            vehicle.shot();
        }
    }
});
