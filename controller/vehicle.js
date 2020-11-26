const { EventEmitter } = require("events");
const sleep = require("await-sleep");
const Serial = require("./serial");

const recv_sensor_mapping = {
    f: "front",
    l: "left",
    r: "right",
    b: "back"
}

class Vehicle extends EventEmitter {
    constructor() {
        super();
        this.speedLimit = 1.0;
        this.serial = new Serial();

        const recvbuf = Buffer.alloc(6);
        let recvbuf_pos = 0;
        let recvbuf_zeroCount = 0;
        const processMessage = buf => {
            const sensor_id = String.fromCharCode(buf[0]);
            const data = buf.readInt16BE(buf, 1);
            const sonar_direction = recv_sensor_mapping[sensor_id];
            if (typeof sonar_direction !== "string") {
                console.warn(`vehicle: received illegal command ${sensor_id}`);
                return;
            }
            if (data < 0 && data !== -1 && data !== -2) {
                console.warn(`vehicle: received illegal data from sonar ${sonar_direction}: ${data}`);
                return;
            }
            this.emit("sonar", {
                direction: sonar_direction,
                distance: data
            });
        }
        const onSerialReceive = data => {
            if (recvbuf_zeroCount === 3) {
                if (data === 0 && recvbuf_pos == 0) {
                    // the first byte of msg must not be zero
                    // skip to find message head
                } else {
                    recvbuf[recvbuf_pos++] = data;
                    if (recvbuf_pos === 3) {
                        processMessage(recvbuf);
                        recvbuf_zeroCount = 0;
                        recvbuf_pos = 0;
                    }
                }
            } else {
                if (data == 0) {
                    recvbuf_zeroCount++;
                } else {
                    recvbuf_zeroCount = 0;
                }
            }
        }
        this.serial.port.on("data", buf => {
            for (const b of buf) {
                onSerialReceive(b);
            }
        });
    }

    /**
     * @param {string} command char
     * @param {number} data uint16
     */
    async _sendCommand(command, data) {
        await this.serial.write(Buffer.from([
            0x00,
            0x00,
            0x00,
            command.charCodeAt(0),
            (data >> 8) & 0xff,
            data & 0xff
        ]));
        console.debug(`vehicle: ${command.charAt(0)} ${data}`);
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
                throw new Error(`illegal wheel ${wheel}`);
        }
        speed = Math.abs(speed);
        if (speed > this.speedLimit) {
            console.warn(`vehicle: speeding! trying to set speed to ${speed}`);
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
