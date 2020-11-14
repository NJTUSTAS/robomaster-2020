const rpio = require("rpio");

function sendCommand(command, data) {
    rpio.i2cSetSlaveAddress(0x55);
    rpio.i2cSetBaudRate(10000);
    rpio.i2cWrite(Buffer.from([command.charCodeAt(0), data, 79]));
    console.info(`command: ${command.charAt(0)} ${data}`);
}

function setSpeed(wheel, speed) {
    let command;
    switch (wheel) {
        case "left":
            command = speed < 0.0 ? "L" : "l";
            break;
        case "right":
            command = speed < 0.0 ? "R" : "r";
            break;
        default:
            throw `illegal wheel ${wheel}`;
    }
    if (speed > 1.0) {
        speed = 1.0;
        console.warn(`setting ${wheel} wheel speed to ${speed}`);
    } else if (speed < -1.0) {
        speed = -1.0;
        console.warn(`setting ${wheel} wheel speed to ${speed}`);
    }
    const speed_raw = Math.round(speed * 255.0);
    sendCommand(command, speed_raw);
}

function goAhead(speed) {
    setSpeed("left", speed);
    setSpeed("right", speed);
}

function rotate(speed) {
    setSpeed("left", speed);
    setSpeed("right", -speed);
}

function stop() {
    goAhead(0);
}

module.exports = { setSpeed, goAhead, rotate, stop };
