const rpio = require("rpio");

/*
 * Magic numbers to initialize the i2c display device and write output,
 * cribbed from various python drivers.
 */
const INIT_SEQ = Buffer.from([0x03, 0x03, 0x03, 0x02, 0x28, 0x0c, 0x01, 0x06]);
const LINE_IDS = [0x80, 0xc0];
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

function formatText(text) {
    if (text.length >= 16) {
        return text.substring(0, 16);
    } else {
        return text + " ".repeat(16 - text.length);
    }
}

class LCD {
    constructor(address = 0x27) {
        this.address = address;
    }

    /**
     * @param {number} line Line number, possible values: 0 and 1
     * @param {string} text Text to print
     * @param {boolean} format When formatting is enabled,
     *  text will be cut or appended with spaces to ensure it has
     *  a length of 16.
     */
    writeLine(line, text, format = false) {
        if (!(line >= 0 && line < LINE_IDS.length)) {
            throw `illegal line number ${line}`;
        }
        if (format === true) {
            text = formatText(text);
        }
        rpio.i2cSetSlaveAddress(this.address);
        write(LINE_IDS[line], 0);
        for (let i = 0; i < text.length; i++) {
            write(text.charCodeAt(i), 1);
        }
        console.debug(`lcd@${this.address}: write line ${line} '${text}'`);
    }

    init() {
        rpio.i2cSetSlaveAddress(address);
        for (var i = 0; i < INIT_SEQ.length; i++) {
            write(INIT_SEQ[i], 0);
        }
        console.debug(`lcd@${this.address}: init`);
    }
}

module.exports = LCD;
