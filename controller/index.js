#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const express = require("express");
const rpio = require("rpio");

const detector = new TagDetector();
detector.on("detect", result => {
    console.log(JSON.stringify(result));
});

const app = express();
app.post("/detector/close", (req, res) => {
    detector.close();
    res.sendStatus(204);
});
app.post("/gpio/digital", (req, res) => {
    rpio.open(req.body.pin, rpio.OUTPUT);
    rpio.write(req.body.pin, req.body.value);
    res.sendStatus(204);
});
app.listen(8000);
