#!/usr/bin/node

const { lcdInit, lcdWriteLine, LCD_LINE1, LCD_LINE2 } = require("./lcd");
rpio.i2cBegin();
lcdInit();
lcdWriteLine("node.js i2c LCD!", LCD_LINE1);
lcdWriteLine("npm install rpio", LCD_LINE2);
rpio.i2cEnd();
