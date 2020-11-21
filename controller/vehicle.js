const I2CDevice = require("./i2c");
const { EventEmitter } = require("events");

const END_OF_MSG = 79;

class Vehicle extends I2CDevice {
    constructor(address = 0x04) {
        super(address);
        this.speedLimit = 1.0;

        this.sensors = new EventEmitter();
        (async () => {
            while (true)
                this._readMessage();
        })();
    }

    async _readMessage() {
        const { bytesRead, buffer } = await this.bus.i2cRead(this.address, 4, Buffer.alloc(4));
        if (bytesRead === 4) {
            const command = String.fromCharCode(buffer.readUInt8(0));
            const data = buffer.readUInt16BE(1);
            if (buffer.readUInt8(3) === END_OF_MSG) {
                switch (command) {
                    case "f":
                        this._fireDistanceEvent("front", data);
                        break;

                    case "l":
                        this._fireDistanceEvent("left", data);
                        break;

                    case "r":
                        this._fireDistanceEvent("right", data);
                        break;

                    default:
                        console.warn(`vehicle@${address}: unknown message type; ${buffer.toString("hex")}`);
                        break;
                }
            } else {
                console.warn(`vehicle@${address}: message with no end; ${buffer.toString("hex")}`);
            }
        } else {
            console.warn(`vehicle@${address}: read ${bytesRead}, expected 4; ${buffer.toString("hex")}`);
        }
    }

    /**
     * @param {"front"|"left"|"right"} direction Sensor name
     * @param {number} distance Distance in mm, -1 if it's too far, -2 if sensor is not connected
     */
    _fireDistanceEvent(direction, distance) {
        if (distance < 0 && distance !== -1 && distance !== -2) {
            console.warn(`vehicle@${address}: illegal distance ${direction}: ${distance}`);
        }
        this.sensors.emit("distance", {
            direction: direction,
            distance: distance
        });
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
            END_OF_MSG
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
