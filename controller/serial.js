const SerialPort = require("serialport");

class Serial {
    constructor(path = "/dev/ttyAMA0") {
        this.path = path;
        this.baudRate = baudRate;
        this._openPort();
    }

    _openPort() {
        this.port = new SerialPort(this.path, {
            autoOpen: true,
            baudRate: 115200,
            dataBits: 8,
            lock: true,
            stopBits: 1,
            parity: "none",
            rtscts: false,
            xon: false,
            xoff: false,
            xany: false
        });
    }

    /**
     * @param {Buffer} buf
     */
    async write(buf) {
        await new Promise((resolve, reject) => {
            const retVal = this.port.write(buf, (error, bytesWritten) => {
                if (error !== null && error !== undefined) {
                    reject(error);
                } else {
                    resolve();
                }
            });
            if (retVal !== true) {
                reject(new Error("write returns " + retVal));
            }
        });
    }

    /**
     * @param {Buffer} buf
     * @returns {number} bytes read
     */
    async read(buf) {
        // TODO
    }
}

module.exports = Serial;
