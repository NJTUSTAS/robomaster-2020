const sleep = require("await-sleep");
const Motor = require("./motor");
const TagDetector = require("./tag_detector");
const Vehicle = require("./vehicle");

const rotate_speed_initial = .12;
const rotate_speed_max = .2;
const pitch_initial = 4100;
const pitch_min = 3200;
const pitch_max = 6300;
const skip_duration = 5000;
const retry_duration = 3000;
const stable_duration = 1000;
const shot_detect_delay = 1000;

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
        tag_center[1] / 720 - .7
    ];
}

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

class RotationController {
    constructor(rotateFn, defaultDuration) {
        this.rotateFn = rotateFn;
        this.defaultDuration = defaultDuration;
        this._ver = 0;
    }
    async setRotation(speed, duration) {
        if (duration === undefined) {
            duration = this.defaultDuration;
        }
        const my_ver = ++this._ver;
        await this.rotateFn(speed);
        (async () => {
            await sleep(duration);
            if (this._ver === my_ver) {
                await this.rotateFn(0);
            }
        })();
    }
}

class TagFollower {
    constructor(tag) {
        this.tag = tag;
        this.kp_v = 1.5;
        this.ki_v = 0;
        this.kd_v = 0.2;
        this.kp_h = 1;
        this.ki_h = 0;
        this.kd_h = 0.02;
        this.err_sum = [0, 0];
        this.last_center = null;
        this.last_time = null;
        this.disappeared = false;
    }
    /**
     * @param {[number|null,number|null]} detect_result
     */
    onDetection(detect_result) {
        const current_time = Date.now() / 1000;
        let current_center = find_center(this.tag, detect_result);
        if (current_center === null) {
            if (this._disappeared === false) {
                this._disappeared = true;
                console.log(`Tag disappeared at ${this.last_center}`);
            }
            return [null, null];
        }
        this._disappeared = false;
        if (this.last_center === null || this.last_time === null) {
            this.last_center = current_center;
            this.last_time = current_time;
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
        const control_v_d = dt === 0 ? 0 : this.kd_v * (current_err[1] - last_err[1]) / dt;
        let control_v;
        if (Math.abs(current_err[1]) < .03) {
            control_v = 0;
        } else {
            control_v = control_v_p + control_v_i + control_v_d;
        }

        const control_h_p = this.kp_h * current_err[0];
        const control_h_i = this.ki_h * this.err_sum[0];
        const control_h_d = dt === 0 ? 0 : this.kd_h * (current_err[0] - last_err[1]) / dt;
        let control_h;
        if (Math.abs(current_err[0]) < .01) {
            control_h = 0;
        } else {
            control_h = control_h_p + control_h_i + control_h_d;
            if (control_h < 0) {
                control_h -= rotate_speed_initial;
            } else if (control_h > 0) {
                control_h += rotate_speed_initial;
            }
        }

        return [-control_h, -control_v];
    }
}

class ShotTargetAction {
    /**
     * @param {TagDetector} tag_detector
     * @param {Motor} motor
     * @param {Vehicle} vehicle
     * @param {Array<number>} targets
     */
    constructor(tag_detector, motor, vehicle, targets) {
        const rotationController = new RotationController(async speed => {
            await motor.setSpeed("left_front", -speed);
            await motor.setSpeed("left_back", -speed);
            await motor.setSpeed("right_front", speed);
            await motor.setSpeed("right_back", speed);
        }, 50);

        let pitch = pitch_initial;

        let follower;
        let shot_progress = -1;
        let last_shot_time;
        let last_seen_time;
        let stable_since;
        const next_tag = () => {
            shot_progress++;
            if (shot_progress >= targets.length) {
                this._resolve();
                return;
            }
            follower = new TagFollower(targets[shot_progress]);
            last_shot_time = null;
            last_seen_time = null;
            stable_since = null;
            console.log(`Next target: #${targets[shot_progress]}`);
        }

        this.frameListener = async detect_result => {
            const control = follower.onDetection(detect_result);
            let stable = true;
            if (typeof control[1] === "number" && control[1] !== 0) {
                stable = false;
                pitch += control[1] * 100;
                pitch = clamp(pitch, pitch_min, pitch_max);
                console.log(`Set pitch to ${pitch}`);
                await vehicle.setPitch(pitch);
            }

            if (typeof control[0] === 'number' && control[0] !== 0) {
                stable = false;
                const rotateSpeed = clamp(control[0], -rotate_speed_max, rotate_speed_max);
                await rotationController.setRotation(rotateSpeed);
                console.log(`Set rotation speed to ${rotateSpeed}`);
            }

            const now = Date.now();
            const tag_found = find_center(targets[shot_progress], detect_result) !== null;
            if (tag_found) {
                console.log(`Tag #${follower.tag} found`);
            }

            if (tag_found || last_seen_time === null) {
                last_seen_time = now;
            } else if (now > last_seen_time + skip_duration) {
                next_tag();
                return;
            }

            if (stable) {
                if (stable_since === null) {
                    stable_since = now;
                }
            } else {
                stable_since = null;
            }

            if (stable && tag_found && (last_shot_time === null || now > last_shot_time + retry_duration) && now > stable_since + stable_duration) {
                console.log(`Shot #${follower.tag}`);
                vehicle.shot();
                last_shot_time = now;
            } else if (!tag_found && last_shot_time !== null && now > last_shot_time + shot_detect_delay) {
                console.log(`#${follower.tag} is shot!`);
                next_tag();
            }
        };

        this.tag_detector = tag_detector;
        this.vehicle = vehicle;
        next_tag();
    }

    async perform() {
        await this.vehicle.setPitch(pitch_initial);
        await new Promise(resolve => {
            this._resolve = resolve;
            this.tag_detector.addListener("frame", this.frameListener);
        });
        this.tag_detector.removeListener("frame", this.frameListener);
    }
}

module.exports = ShotTargetAction;
