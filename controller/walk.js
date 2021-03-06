#!/usr/bin/node

const Vehicle = require("./vehicle");
const Motor = require("./motor");
const TagDetector = require("./tag_detector");
const { EventEmitter } = require("events");
const sleep = require("await-sleep");
const ShotTargetAction = require("./shot_target");

const vehicle = new Vehicle();
const motor = new Motor();
const tag_detector = new TagDetector("../tag_detector");

const fix_factor = 1;
const targetsA = [1,2,3];

async function go_ahead(speed) {
    motor.setSpeed("left_front", speed);
    motor.setSpeed("left_back", speed);
    motor.setSpeed("right_front", speed * fix_factor);
    motor.setSpeed("right_back", speed * fix_factor);
}

/**
 * @param {number} speed positive for left, negative for right
 */
async function go_crab(speed) {
    motor.setSpeed("right_front", speed * fix_factor);
    motor.setSpeed("left_back", speed);
    motor.setSpeed("left_front", -speed);
    motor.setSpeed("right_back", -speed * fix_factor);
}

async function do_then_stop(controlFn, speed, blocker) {
    await controlFn(speed);
    await blocker();
    await controlFn(-speed);
    await sleep(50);
    await controlFn(0);
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

const g_sensor_data = {
    sonar: {
        front: -2,
        left: -2,
        right: -2,
        back: -2
    },
    detected_tags: []
};
const sensor_data_em = new EventEmitter();

tag_detector.on("frame", detect_result => {
    g_sensor_data.detected_tags = detect_result_to_tag_array(detect_result);
    sensor_data_em.emit("update", g_sensor_data);
});

vehicle.on("sonar", detect_result => {
    g_sensor_data.sonar[detect_result.direction] = detect_result.distance;
    sensor_data_em.emit("update", g_sensor_data);
});

/*
condition := SensorData => boolean
SensorData := {
    sonar: {
        front: number
        left: number
        right: number
        back: number
    },
    detected_tags: number[]
}
*/
async function wait_until(condition) {
    await new Promise(resolve => {
        const listener = sensor_data => {
            console.log(sensor_data);
            if (!condition(sensor_data)) {
                return;
            }
            sensor_data_em.removeListener("update", listener);
            resolve();
        };
        sensor_data_em.addListener("update", listener);
    });
}

async function wait_event(emitter, type) {
    return await new Promise(resolve => {
        emitter.once(type, e => resolve(e));
    });
}

function detect_result_to_tag_array(detect_result) {
    const result = [];
    for (const detection of detect_result.detections) {
        result.push(detection.id);
    }
    return result;
}

function distance_greater_than(direction, distance = 500) {
    return d =>
        (d.sonar[direction] !== -2) &&
        (d.sonar[direction] === -1 || d.sonar[direction] >= distance);
}

function distance_less_than(direction, distance = 300) {
    return d =>
        (d.sonar[direction] !== -2) &&
        (d.sonar[direction] !== -1 && d.sonar[direction] <= distance);
}

function clamp(num, a, b) {
    if (a > b) {
        const t = a;
        a = b;
        b = t;
    }
    return num <= a ? a : num >= b ? b : num;
}

function containsAll(a,b){
    for(const e of b){
        if(!a.includes(e)){
            return false;
        }
    }
    return true;
}

async function scene1() {
    await motor.begin();
    await vehicle.setSonarInterval(50);
    await tag_detector.waitInitialized();
    await vehicle.setPitch(4100);

    // 直走
    await vehicle.setEnabledSonar(["left"]);
    await go_ahead(.5);
    await wait_until(distance_greater_than("left"));
    await sleep(150);
    await go_ahead(-.5);
    await sleep(50);
    await go_ahead(0);

    // 向左横走
    await go_crab(.5);
    await wait_until(distance_less_than("left", 150));

    // 撞墙
    await go_crab(.3);
    await sleep(1000);
    await go_crab(-.3);
    await sleep(500);
    await go_crab(.3);
    await sleep(50);
    await go_crab(0);

    // 直走
    await vehicle.setEnabledSonar(["front"]);
    await go_ahead(.5);
    await wait_until(distance_less_than("front"));
    await go_ahead(-.5);
    await sleep(50);
    await go_ahead(0);

    // 向左横走
    await go_crab(.5);
    await vehicle.setEnabledSonar(["left"]);
    await wait_until(distance_less_than("left", 150));

    // 撞墙
    await go_crab(.3);
    await sleep(1000);
    await go_crab(-.3);
    await sleep(500);
    await go_crab(.3);
    await sleep(50);
    await go_ahead(0);

    // 直走
    await go_ahead(.5);
    await wait_until(distance_greater_than("left"));
    await sleep(120);
    await go_ahead(-.5);
    await sleep(50);
    await go_ahead(0);

    // 向左横走
    await go_crab(.5);
    await wait_until(distance_less_than("left"));
    await go_crab(-.5);
    await sleep(50);
    await go_ahead(0);

    // 旋转找靶
    await vehicle.setPitch(4100);
    await rotate(.3);
    await sleep(1000);
    await rotate(0);
    outer: for (; ;) {
        for (let i = 0; i < 2; i++) {
            const tags = detect_result_to_tag_array(await wait_event(tag_detector, "frame"));
            if (tags.includes(1) && tags.includes(8) && tags.includes(9)) {
                break outer;
            }
        }
        await rotate(.2);
        await sleep(300);
        await rotate(-.2);
        await sleep(40);
        await rotate(0);
    }
    await ShotTargetAction.doAction(tag_detector, motor, vehicle, [9, 1, 8]);

    // 向左横走
    await go_crab(.5);
    await wait_until(distance_less_than("left", 150));

    // 撞墙
    await go_crab(.3);
    await sleep(1000);
    await go_crab(-.3);
    await sleep(500);
    await go_crab(.3);
    await sleep(50);
    await go_ahead(0);

    // 直走
    await go_ahead(.5);
    await wait_until(distance_greater_than("left"));
    await sleep(150);
    await go_ahead(-.5);
    await sleep(50);
    await go_ahead(0);

    // 向左横走
    await go_crab(.5);
    await wait_until(distance_less_than("left", 150));

    // 撞墙
    await go_crab(.3);
    await sleep(1000);
    await go_crab(-.3);
    await sleep(500);
    await go_crab(.3);
    await sleep(50);
    await go_ahead(0);

    // 倒车
    await vehicle.setEnabledSonar(["back"]);
    await go_ahead(-.5);
    await wait_until(distance_less_than("back", 150));

    // 撞墙
    await go_ahead(-.3);
    await sleep(1000);
    await go_ahead(.3);
    await sleep(700);
    await go_ahead(-.3);
    await sleep(50);
    await go_ahead(0);

    // 向右横走
    await go_crab(-.5);
    await wait_until(distance_greater_than("back"));
    await sleep(100);
    await wait_until(distance_less_than("back"));
    await sleep(100);
    await go_crab(.5);
    await sleep(50);
    await go_ahead(0);

    // 撞墙
    await go_ahead(-.3);
    await sleep(1000);
    await go_ahead(.3);
    await sleep(500);
    await go_ahead(-.3);
    await sleep(50);
    await go_ahead(0);

    // 向右横走
    await go_crab(-.3);
    await wait_until(distance_greater_than("back"));
    await sleep(100);
    await wait_until(distance_less_than("back"));
    await sleep(300);
    await go_crab(.5);
    await sleep(50);
    await go_ahead(0);
}

async function scene2() {
    await motor.begin();
    await vehicle.setSonarInterval(50);
    await tag_detector.waitInitialized();
    await vehicle.setPitch(4100);

    //向右横向
    await vehicle.setEnabledSonar(["front"]);

    await do_then_stop(go_crab, -.5, async () => {
        await wait_until(distance_greater_than("front"));
        await sleep(150);
    });

    //直走
    await do_then_stop(go_ahead, 0.5, async () => {
        await wait_until(distance_less_than("front", 200));
        await sleep(150);
    });

    /*
    //前撞墙
    await go_ahead(.3);
    await sleep(1000);
    await do_then_stop(go_ahead, -.3, async () => {
        await sleep(500);
    });
    */

    //左撞墙
    await go_crab(.3);
    await sleep(1500);
    await do_then_stop(go_crab, -.3, async () => {
        await sleep(500);
    });

    //向右横走
    await vehicle.setEnabledSonar(["back"]);
    await do_then_stop(go_crab, -.5, async () => {
        await wait_until(distance_less_than("back"));
        await sleep(150);
    });

    // 后撞墙
    await go_ahead(-.3);
    await sleep(1500);
    await do_then_stop(go_ahead, .5, async () => {
        await sleep(500);
    });

    // 向右横走
    await vehicle.setEnabledSonar(["right"]);
    await do_then_stop(go_crab, -.5, async () => {
        await wait_until(distance_less_than("right", 200));
        await sleep(100);
    });

    // 撞墙
    await go_crab(-.3);
    await sleep(1000);
    await do_then_stop(go_crab, .3, async () => {
        await sleep(500);
    });

    // 向后直走
    await vehicle.setEnabledSonar(["back"]);
    await do_then_stop(go_ahead, -.5, async () => {
        await wait_until(distance_less_than("back", 200));
        await sleep(100);
    });

    //撞墙
    await go_ahead(-.3);
    await sleep(1500);
    await do_then_stop(go_ahead, .3, async () => {
        await sleep(500);
    });

    //向右横走
    await do_then_stop(go_crab, -.5, async () => {
        await sleep(500);
    })
    outer: for (; ;) {
        for (let i = 0; i < 2; i++) {
            const tags = detect_result_to_tag_array(await wait_event(tag_detector, "frame"));
            if (containsAll(tags,targetsA)) {
                break outer;
            }
        }
        await do_then_stop(go_crab, -.3, async () => {
            await sleep(50);
        })
    }
    await ShotTargetAction.doAction(tag_detector, motor, vehicle, targetsA);
    await go_ahead(0);
}

scene2();
