const rpio = require("rpio");

/*
 * Magic numbers to initialize the i2c display device and write output,
 * cribbed from various python drivers.
 */
const init = Buffer.from([0x03, 0x03, 0x03, 0x02, 0x28, 0x0c, 0x01, 0x06]);
const LCD_LINE1 = 0x80;
const LCD_LINE2 = 0xc0;
const LCD_ENABLE = 0x04;
const LCD_BACKLIGHT = 0x08;

/*
 * Data is written 4 bits at a time with the lower 4 bits containing the mode.
 */
function lcdWrite4(data) {
    rpio.i2cWrite(Buffer.from([(data | LCD_BACKLIGHT)]));
    rpio.i2cWrite(Buffer.from([(data | LCD_ENABLE | LCD_BACKLIGHT)]));
    rpio.i2cWrite(Buffer.from([((data & ~LCD_ENABLE) | LCD_BACKLIGHT)]));
}
function lcdWrite(data, mode) {
    lcdWrite4(mode | (data & 0xF0));
    lcdWrite4(mode | ((data << 4) & 0xF0));
}

/*
 * Write a string to the specified LCD line.
 */
function lcdWriteLine(str, addr) {
    lcdWrite(addr, 0);

    str.split('').forEach(function (c) {
        lcdWrite(c.charCodeAt(0), 1);
    });
}

function lcdInit(address = 0x27) {
    rpio.i2cSetSlaveAddress(address);
    rpio.i2cSetBaudRate(10000);
    for (var i = 0; i < init.length; i++) {
        lcdWrite(init[i], 0);
    }
}

module.exports = { LCD_LINE1, LCD_LINE2, lcdInit, lcdWriteLine };
