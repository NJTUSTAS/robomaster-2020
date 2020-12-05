#!/usr/bin/node

/*
Space   停车
W       前进
A       左移
S       后退
D       右移
Q       左转
E       右转
J       射击A
K       射击B
L       射击C
Tab     设置射击序列
Return  直接射击
Up      抬枪
Down    压枪
*/

const c_pitch_initial = 4100;
const c_go_ahead_speed = .5;
const c_go_crab_speed = .5;
const c_rotate_speed = .3;
const target_groups = {
    a: [1, 2, 3],
    b: [4, 5, 6],
    c: [7, 8, 9]
};

const { EventEmitter } = require("events");
const readline = require("readline");
const Vehicle = require("./vehicle");
const Motor = require("./motor");
const TagDetector = require("./tag_detector");
const sleep = require("await-sleep");
const ShotTargetAction = require("./shot_target");

// 初始化控制台
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const keyEventEmitter = new EventEmitter();
process.stdin.on("keypress", async (_, key) => {
    if (key.ctrl && key.name === "c") {
        try {
            await stop();
        } finally {
            process.exit();
        }
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

async function brake(last_action) {
    switch (last_action) {
        case null:
            await stop();
            return;
        case "w":
            await go_ahead(-c_go_ahead_speed);
            break;
        case "s":
            await go_ahead(c_go_ahead_speed);
            break;
        case "a":
            await go_crab(-c_go_crab_speed);
            break;
        case "d":
            await go_crab(c_go_crab_speed);
            break;
        case "z":
            await rotate(-c_rotate_speed);
            break;
        case "x":
            await rotate(c_rotate_speed);
            break;
    }
    await sleep(50);
    await stop();
}

/**
 * @param {"a"|"b"|"c"} group
 */
async function do_shot(group) {
    (async () => {
        await ShotTargetAction.doAction(tag_detector, motor, vehicle, target_groups[group]);
        console.log("OK!");
    })();
}

function clamp(num, a, b) {
    if (a > b) {
        const t = a;
        a = b;
        b = t;
    }
    return num <= a ? a : num >= b ? b : num;
}

let pitch = c_pitch_initial;

async function offsetPitch(delta) {
    pitch += delta;
    pitch = clamp(pitch, 3200, 6300);
    await vehicle.setPitch(pitch);
    console.log(`Set pitch to ${pitch}`);
}

(async () => {
    offsetPitch(0);
    let current_action = null;
    for (; ;) {
        try {
            const key = await read_key();
            switch (key.name) {
                case 'space':
                    await brake(current_action);
                    current_action = null;
                    break;

                case "w":
                    if (current_action === "w") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "w";
                        await go_ahead(c_go_ahead_speed);
                    }
                    break;
                case "a":
                    if (current_action === "a") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "a";
                        await go_crab(c_go_crab_speed);
                    }
                    break;

                case "s":
                    if (current_action === "s") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "s";
                        await go_ahead(-c_go_ahead_speed);
                    }
                    break;

                case "d":
                    if (current_action === "d") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "d";
                        await go_crab(-c_go_crab_speed);
                    }
                    break;
                case "q":
                    if (current_action === "z") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "z";
                        await rotate(c_rotate_speed);
                    }
                    break;

                case "e":
                    if (current_action === "x") {
                        await brake(current_action);
                        current_action = null;
                    } else {
                        current_action = "x";
                        await rotate(-c_rotate_speed);
                    }
                    break;

                case 'return':
                    await vehicle.shot();
                    break;

                case 'tab':
                    process.stdout.write("Choose target group (A, B or C): ");
                    let _k = await read_key();
                    if (!["a", "b", "c"].includes(_k.name)) {
                        console.log("Illegal target group");
                        break;
                    }
                    const targetGroup = _k.name;
                    console.log(targetGroup);
                    process.stdout.write("Targets:");
                    const targets = [];
                    for (let i = 0; i < 3; i++) {
                        _k = await read_key();
                        if (!["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(_k.name)) {
                            console.log("Illegal target");
                            break;
                        }
                        const target = parseInt(_k.name);
                        process.stdout.write(` ${target}`);
                        targets.push(target);
                    }
                    target_groups[targetGroup] = targets;
                    console.log();
                    console.log(`${targetGroup} targets: ${JSON.stringify(target_groups[targetGroup])}`);
                    break;

                case "j":
                    await do_shot("a");
                    break;

                case "k":
                    await do_shot("b");
                    break;

                case "l":
                    await do_shot("c");
                    break;

                case "up":
                    await offsetPitch(100);
                    break;

                case "down":
                    await offsetPitch(-100);
                    break;

                default:
                    console.log(`Unrecognized key: ${JSON.stringify(key)}`);
                    break;
            }
        } catch (e) {
            console.log("Communication error!");
            console.log(e);
        }
    }
})();
