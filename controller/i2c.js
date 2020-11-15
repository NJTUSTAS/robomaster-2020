const rpio = require("rpio");

class I2CDevice {
    constructor(address) {
        this.address = address;
        rpio.i2cBegin();
    }
}

module.exports = I2CDevice;
