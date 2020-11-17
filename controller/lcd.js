const I2CDevice = require("./i2c");

/*
 * Magic numbers to initialize the i2c display device and write output,
 * cribbed from various python drivers.
 */
const INIT_SEQ = Buffer.from([0x03, 0x03, 0x03, 0x02, 0x28, 0x0c, 0x01, 0x06]);
const LINE_IDS = [0x80, 0xc0];
const ENABLE = 0x04;
const BACKLIGHT = 0x08;

function formatText(text) {
    if (text.length >= 16) {
        return text.substring(0, 16);
    } else {
        return text + " ".repeat(16 - text.length);
    }
}

class LCD extends I2CDevice {
    constructor(address = 0x27) {
        super(address);
    }

    /*
     * Data is written 4 bits at a time with the lower 4 bits containing the mode.
     */
    async _write4(data) {
        await this._i2cWrite(Buffer.from([
            data | BACKLIGHT,
            data | ENABLE | BACKLIGHT,
            (data & ~ENABLE) | BACKLIGHT
        ]));
    }
    async _write(data, mode) {
        await this._write4(mode | (data & 0xF0));
        await this._write4(mode | ((data << 4) & 0xF0));
    }

    /**
     * @param {number} line Line number, possible values: 0 and 1
     * @param {string} text Text to print
     * @param {boolean} format When formatting is enabled,
     *  text will be cut or appended with spaces to ensure it has
     *  a length of 16.
     */
    async writeLine(line, text, format = false) {
        if (!(line >= 0 && line < LINE_IDS.length)) {
            throw `illegal line number ${line}`;
        }
        if (format === true) {
            text = formatText(text);
        }
        await this._write(LINE_IDS[line], 0);
        for (let i = 0; i < text.length; i++) {
            await this._write(text.charCodeAt(i), 1);
        }
        console.debug(`lcd@${this.address}: write line ${line} '${text}'`);
    }

    async init() {
        for (var i = 0; i < INIT_SEQ.length; i++) {
            await this._write(INIT_SEQ[i], 0);
        }
        console.debug(`lcd@${this.address}: init`);
    }
}

module.exports = LCD;
