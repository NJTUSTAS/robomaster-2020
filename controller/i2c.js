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
            console.warn(`i2c: ${result.bytesWritten} written to ${this.address}, expected ${len}`);
        }
        return result;
    }
}

module.exports = I2CDevice;
