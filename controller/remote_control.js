const express = require("express");
const { EventEmitter } = require("events");
const bodyParser = require("body-parser");

class RemoteControlServer extends EventEmitter {
    constructor(port = 8000) {
        this.app = express();

        /**
         * POST /vehicle/speed
         * - Content-Type: application/json
         * - Payload:
         *     {
         *         "left": <speed of left wheel, from 0.0 to 1.0>,
         *         "right": <speed of right wheel, from 0.0 to 1.0>
         *     }
         * - Response: 204 No Content
         *
         * Only when manual mode is set to true,
         * will this operation take effect.
         */
        this.app.post("/vehicle/speed", bodyParser.json(), (req, res) => {
            const left = req.body.left;
            const right = req.body.right;
            if (!(
                typeof left === "number" &&
                typeof right === "number" &&
                left >= 0.0 && left <= 1.0 &&
                right >= 0.0 && right <= 1.0
            )) {
                res.sendStatus(400);
                return;
            }

            this.emit("speed", {
                left: left,
                right: right
            });

            res.sendStatus(204);
        });

        /**
         * POST /vehicle/mode
         * - Content-Type: application/json
         * - Payload:
         *     {
         *         "manual": <true or false>
         *     }
         * - Response: 204 No Content
         */
        this.app.post("/vehicle/mode", bodyParser.json(), (req, res) => {
            const manual = req.body.manual;
            if (typeof manual !== "boolean") {
                res.sendStatus(400);
                return;
            }

            this.emit("mode", {
                manual: manual
            });

            res.sendStatus(204);
        });

        this.app.listen(8000);
    }
}

module.exports = RemoteControlServer;
