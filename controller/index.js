#!/usr/bin/node

const { TagDetector } = require("./tag_detector");
const sleep = require("await-sleep");

(async () => {
    const detector = new TagDetector();
    detector.on("detect", result => {
        console.log(JSON.stringify(result));
    });
    await sleep(10000);
    detector.close();
})();
