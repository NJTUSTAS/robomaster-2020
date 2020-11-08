#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const express = require("express");

const detector = new TagDetector();
detector.on("detect", result => {
    console.log(JSON.stringify(result));
});

const app = express();
app.post("/detector/close", (req, res) => {
    detector.close();
});
app.listen(8000);
