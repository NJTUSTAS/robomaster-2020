const rpio = require("rpio");

/*
 * Magic numbers to initialize the i2c display device and write output,
 * cribbed from various python drivers.
 */
const INIT_SEQ = Buffer.from([0x03, 0x03, 0x03, 0x02, 0x28, 0x0c, 0x01, 0x06]);
const LINE1 = 0x80;
const LINE2 = 0xc0;
const ENABLE = 0x04;
const BACKLIGHT = 0x08;

/*
 * Data is written 4 bits at a time with the lower 4 bits containing the mode.
 */
function write4(data) {
    rpio.i2cWrite(Buffer.from([(data | BACKLIGHT)]));
    rpio.i2cWrite(Buffer.from([(data | ENABLE | BACKLIGHT)]));
    rpio.i2cWrite(Buffer.from([((data & ~ENABLE) | BACKLIGHT)]));
}
function write(data, mode) {
    write4(mode | (data & 0xF0));
    write4(mode | ((data << 4) & 0xF0));
}

/*
 * Write a string to the specified LCD line.
 */
function writeLine(str, addr, format = false) {
    write(addr, 0);
    if (format) {
        str = formatText(str);
    }
    for (let i = 0; i < str.length; i++) {
        write(str.charCodeAt(i), 1);
    }
}

function init(address = 0x27) {
    rpio.i2cSetSlaveAddress(address);
    rpio.i2cSetBaudRate(10000);
    for (var i = 0; i < INIT_SEQ.length; i++) {
        write(INIT_SEQ[i], 0);
    }
}

function formatText(text) {
    if (text.length >= 16) {
        return text.substring(0, 16);
    } else {
        return text + " ".repeat(16 - text.length);
    }
}

module.exports = { LINE1, LINE2, init, writeLine };
