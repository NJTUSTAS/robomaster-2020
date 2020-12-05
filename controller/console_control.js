#!/usr/bin/node

/*
Space   停车
W       前进
A       左移
S       后退
D       右移
Z       左转
X       右转
J       射击J
K       射击K
L       射击L
Q       设置射击序列
R       直接射击
*/

const c_pitch_initial = 4100;
const c_go_ahead_speed = .5;
const c_go_crab_speed = .5;
const c_rotate_speed = .5;

const { EventEmitter } = require("events");
const readline = require("readline");
const Vehicle = require("./vehicle");
const Motor = require("./motor");
const TagDetector = require("./tag_detector");

// 初始化控制台
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const keyEventEmitter = new EventEmitter();
process.stdin.on("keypress", (_, key) => {
    if (key.ctrl && key.name === "c") {
        process.exit();
    }
    keyEventEmitter.emit("key", key);
});
async function read_key() {
    return await new Promise(resolve => {
        keyEventEmitter.once("key", key => {
            resolve(key);
        });
    });
}

// 初始化机器人
const vehicle = new Vehicle();
const motor = new Motor();
const tag_detector = new TagDetector("../tag_detector");

(async () => {
    await motor.begin();
    console.log("Motor initialized.");
})();

(async () => {
    await tag_detector.waitInitialized();
    console.log("Tag detector initialized.");
})();

(async () => {
    await vehicle.setPitch(c_pitch_initial);
    console.log(`Set pitch to ${c_pitch_initial}.`);
})();

async function go_ahead(speed) {
    await Promise.all([
        motor.setSpeed("left_front", speed),
        motor.setSpeed("left_back", speed),
        motor.setSpeed("right_front", speed),
        motor.setSpeed("right_back", speed)
    ]);
    console.log(`Go ahead ${speed}`);
}

async function go_crab(speed) {
    await Promise.all([
        motor.setSpeed("right_front", speed),
        motor.setSpeed("left_back", speed),
        motor.setSpeed("left_front", -speed),
        motor.setSpeed("right_back", -speed)
    ]);
    console.log(`Go crab ${speed}`);
}

async function rotate(speed) {
    await Promise.all([
        motor.setSpeed("left_front", -speed),
        motor.setSpeed("left_back", -speed),
        motor.setSpeed("right_front", speed),
        motor.setSpeed("right_back", speed)
    ]);
    console.log(`Rotate ${speed}`);
}

async function stop() {
    await Promise.all([
        motor.setSpeed("left_front", 0),
        motor.setSpeed("left_back", 0),
        motor.setSpeed("right_front", 0),
        motor.setSpeed("right_back", 0)
    ]);
    console.log("Stop");
}

(async () => {
    let current_action = null;
    for (; ;) {
        const key = await read_key();
        switch (key.name) {
            case 'space':
                current_action = null;
                await stop();
                break;

            case "w":
                if (current_action === "w") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "w";
                    await go_ahead(c_go_ahead_speed);
                }
                break;
            case "a":
                if (current_action === "a") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "a";
                    await go_crab(c_go_crab_speed);
                }
                break;

            case "s":
                if (current_action === "s") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "s";
                    await go_ahead(-c_go_ahead_speed);
                }
                break;

            case "d":
                if (current_action === "d") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "d";
                    await go_crab(-c_go_crab_speed);
                }
                break;
            case "z":
                if (current_action === "z") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "z";
                    await rotate(c_rotate_speed);
                }
                break;

            case "x":
                if (current_action === "x") {
                    current_action = null;
                    await stop();
                } else {
                    current_action = "x";
                    await rotate(-c_rotate_speed);
                }
                break;

            case 'r':
                await vehicle.shot();
                break;

            // case 'q':
            //     process.stdout.write("Choose target (A, B or C): ");
            //     let _k = await read_key();
            //     if([])
            //     break;
            default:
                console.log(`Unrecognized key: ${key}`);
                break;
        }
    }
})();
