#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const express = require("express");

const detector = new TagDetector();
detector.on("frame", result => {
    console.log(JSON.stringify(result));
});

const app = express();
app.post("/detector/close", (req, res) => {
    detector.close();
    res.sendStatus(204);
});
app.listen(8000);
