const SerialPort = require("serialport");

class Serial {
    constructor(path = "/dev/ttyS0", baudRate = 57600) {
        this.path = path;
        this.baudRate = baudRate;
        this._openPort();
    }

    _openPort() {
        this.port = new SerialPort(this.path, {
            baudRate: this.baudRate
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
                } else if (bytesWritten !== buf.length) {
                    reject(new Error(`Only ${bytesWritten} bytes written, expect ${buf.length}`));
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
