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
        this.kd_v = 0.1;
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
            current_center = this.last_center;
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

        console.log(`p=${this.kp_v * current_err[1]} i=${this.ki_v * this.err_sum[1]} d=${this.kd_v * (current_err[1] - last_err[1]) / dt}`);

        return [null, -control_v];
    }
}

const TagDetector = require("./tag_detector");
const Vehicle = require("./vehicle");

const detector = new TagDetector();
const vehicle = new Vehicle();
const follower = new TagFollower();

let pitch = 4700;

detector.on("frame", detect_result => {
    const control = follower.onDetection(detect_result);
    if (typeof control[1] === "number") {
        pitch += control[1] * 100;
        pitch = clamp(pitch, 4000, 6800);
        console.log(`Set pitch to ${pitch}, control is ${control}`);
    }
    vehicle.setPitch(pitch);
});

const stdin = process.openStdin();
stdin.on("data", data => {
    for (const x of data.toString()) {
        if (x === "\n") {
            vehicle.shot();
        }
    }
});
