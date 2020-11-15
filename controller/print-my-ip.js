#!/usr/bin/node

const { spawn } = require("child_process");
const byline = require("byline");
const rpio = require("rpio");
const LCD = require("./lcd");

byline(
    spawn("hostname", ["-I"]).stdout
).on("data", data => {
    const filteredIps = [];
    for (const ip of data.toString().split(" ")) {
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
            filteredIps.push(ip);
        }
    }
    rpio.i2cBegin();

    const lcd = new LCD();
    lcd.init();
    if (filteredIps.length >= 1) {
        lcd.writeLine(0, filteredIps[0]);
    }
    if (filteredIps.length >= 2) {
        lcd.writeLine(1, filteredIps[1]);
    }

    rpio.i2cEnd();
});
