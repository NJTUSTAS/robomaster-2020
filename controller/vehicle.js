const I2CDevice = require("./i2c");
const { EventEmitter } = require("events");
const sleep = require("await-sleep");

class Vehicle extends I2CDevice {
    constructor(address = 0x04) {
        super(address);
        this.speedLimit = 1.0;

        this.sensors = new EventEmitter();
        (async () => {
            while (true) {
                try {
                    await this._readMessage();
                } catch (e) {
                    console.warn(`vehicle@${this.address}: read error: ${e}`);
                }
                await sleep(100);
            }
        })();
    }

    async _readMessage() {
        const buf = Buffer.alloc(8);
        const { bytesRead } = await this.bus.i2cRead(this.address, buf.length, buf);
        if (bytesRead !== buf.length) {
            console.warn(`vehicle@${this.address}: read ${bytesRead}, expected ${buf.length}; ${buffer.toString("hex")}`);
            return;
        }

        const sensorData = {
            forward: buf.readUInt16BE(0),
            back: buf.readUInt16BE(2),
            left: buf.readUInt16BE(4),
            right: buf.readUInt16BE(6)
        };
        this.sensors.emit("sensor", sensorData);
    }

    /**
     * @param {string} command char
     * @param {number} data uint16
     */
    async _sendCommand(command, data) {
        await this._i2cWrite(Buffer.from([
            command.charCodeAt(0),
            (data >> 8) & 0xff,
            data & 0xff
        ]));
        console.debug(`vehicle@${this.address}: ${command.charAt(0)} ${data}`);
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
            console.warn(`vehicle@${this.address}: speeding! trying to set speed to ${speed}`);
            speed = this.speedLimit;
        }
        const rawSpeed = Math.round(speed * 0xffff);
        await this._sendCommand(command, rawSpeed);
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
