const { openSync } = require("i2c-bus");

class I2CDevice {
    constructor(address) {
        this.address = address;
        this.bus = openSync(1).promisifiedBus();
    }
    /**
     * @param {Buffer} buffer
     * @returns {Promise<import("i2c-bus").BytesWritten>}
     */
    async _i2cWrite(buffer) {
        const len = buffer.byteLength;
        const result = await this.bus.i2cWrite(this.address, len, buffer);
        if (result.bytesWritten !== len) {
            console.warn(`i2c@${this.address}: ${result.bytesWritten} written, expected ${len}`);
        }
        return result;
    }

    /**
     * @param {number} len Number of bytes to read
     * @returns {import("i2c-bus").BytesRead}
     */
    async _i2cRead(len) {
        const result = await this.bus.i2cRead(this.address, len, Buffer.alloc(len));
        if (result.bytesRead !== len) {
            console.warn(`i2c@${this.address}: ${result.bytesRead} read, expected ${len}`);
        }
        return result;
    }
}

module.exports = I2CDevice;
