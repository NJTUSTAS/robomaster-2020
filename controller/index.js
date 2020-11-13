#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const express = require("express");
const bodyParser = require("body-parser");
const rpio = require("rpio");

const detector = new TagDetector();
detector.on("frame", result => {
    console.log(JSON.stringify(result));
});

const app = express();
app.post("/detector/close", (req, res) => {
    detector.close();
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
