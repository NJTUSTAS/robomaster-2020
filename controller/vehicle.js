const I2CDevice = require("./i2c");

class Vehicle extends I2CDevice {
    constructor(address = 0x04) {
        super(address);
        this.speedLimit = 1.0;
    }

    /**
     * @param {number} address uint8
     * @param {number} command uint8
     * @param {number} data uint16
     */
    async _sendCommand(address, command, data) {
        await this._i2cWrite(Buffer.from([
            command.charCodeAt(0),
            (data >> 8) & 0xff,
            data & 0xff,
            79
        ]));
        console.debug(`vehicle@${address}: ${command.charAt(0)} ${data}`);
    }

    /**
     * @param {"left"|"right"} wheel The wheel to control
     * @param {number} speed Speed of the wheel, ranging from -1.0 to 1.0
     */
    async setSpeed(wheel, speed) {
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
        const rawSpeed = Math.round(speed * 0xffff);
        await sendCommand(this.address, command, rawSpeed);
    }

    async goAhead(speed) {
        await Promise.all([
            this.setSpeed("left", speed),
            this.setSpeed("right", speed)
        ]);
    }

    /**
     * Start rotating. A positive speed means rotating clockwise.
     */
    async rotate(speed) {
        await Promise.all([
            this.setSpeed("left", speed),
            this.setSpeed("right", -speed)
        ]);
    }

    async stop() {
        await this.goAhead(0);
    }
}

module.exports = Vehicle;
