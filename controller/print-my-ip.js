#!/usr/bin/node

const { spawn } = require("child_process");
const byline = require("byline");
const LCD = require("./lcd");

byline(
    spawn("hostname", ["-I"]).stdout
).on("data", async data => {
    const filteredIps = [];
    for (const ip of data.toString().split(" ")) {
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
            filteredIps.push(ip);
        }
    }

    const lcd = new LCD();
    await lcd.init();
    if (filteredIps.length >= 1) {
        await lcd.writeLine(0, filteredIps[0]);
    }
    if (filteredIps.length >= 2) {
        await lcd.writeLine(1, filteredIps[1]);
    }
});
