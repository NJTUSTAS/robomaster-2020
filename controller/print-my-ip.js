#!/usr/bin/node

const { spawn } = require("child_process");
const byline = require("byline");
const rpio = require("rpio");
const lcd = require("./lcd");

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
    lcd.init();
    if (filteredIps.length >= 1) {
        console.log(`ip.1=${filteredIps[0]}`);
        lcd.writeLine(filteredIps[0], lcd.LINE1);
    }
    if (filteredIps.length >= 2) {
        console.log(`ip.2=${filteredIps[1]}`);
        lcd.writeLine(filteredIps[1], lcd.LINE2);
    }
    rpio.i2cEnd();
});
