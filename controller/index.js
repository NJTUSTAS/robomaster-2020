#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const express = require("express");
const bodyParser = require("body-parser");
const rpio = require("rpio");
const lcd = require("./lcd");

const detector = new TagDetector();
rpio.i2cBegin();
lcd.init();

detector.on("detect", result => {
    console.log(JSON.stringify(result));

    let text = "";
    for (const det of result.detections) {
        text += det.id;
        text += " ";
    }
    lcd.writeLine(text, lcd.LINE1, true);
});

const app = express();
app.post("/detector/close", (req, res) => {
    detector.close();
    rpio.i2cEnd();
    res.sendStatus(204);
});
app.post("/gpio/digital", bodyParser.json(), (req, res) => {
    console.log(JSON.stringify(req.body));
    const pin = parseInt(req.body.pin);
    const value = parseInt(req.body.value);
    rpio.open(pin, rpio.OUTPUT);
    rpio.write(pin, value);
    res.sendStatus(204);
});
app.listen(8000);
