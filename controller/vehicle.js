const rpio = require("rpio");

function sendCommand(address, command, data) {
    rpio.i2cSetSlaveAddress(address);
    const err = rpio.i2cWrite(Buffer.from([command.charCodeAt(0), data, 79]));
    console.debug(`vehicle@${address}: ${command.charAt(0)} ${data}`);
    if (err !== 0) {
        console.warn(`vehicle@${address}: ${err} while sending`);
    }
}

class Vehicle {
    constructor(address = 0x04) {
        this.address = address;
        this.speedLimit = 1.0;
    }

    /**
     * @param {"left"|"right"} wheel The wheel to control
     * @param {number} speed Speed of the wheel, ranging from -1.0 to 1.0
     */
    setSpeed(wheel, speed) {
        let command;
        switch (wheel) {
            case "left":
                command = speed < 0.0 ? "l" : "L";
                break;
            case "right":
                command = speed < 0.0 ? "r" : "R";
                break;
            default:
                throw `illegal wheel ${wheel}`;
        }
        speed = Math.abs(speed);
        if (speed > this.speedLimit) {
            console.warn(`vehicle@${address}: speeding! trying to set speed to ${speed}`);
            speed = this.speedLimit;
        }
        const rawSpeed = Math.round(speed * 255.0);
        sendCommand(this.address, command, rawSpeed);
    }

    goAhead(speed) {
        this.setSpeed("left", speed);
        this.setSpeed("right", speed);
    }

    /**
     * Start rotating. A positive speed means rotating clockwise.
     */
    rotate(speed) {
        this.setSpeed("left", speed);
        this.setSpeed("right", -speed);
    }

    stop() {
        this.goAhead(0);
    }
}

module.exports = Vehicle;
