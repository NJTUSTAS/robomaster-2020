const { spawn } = require("child_process");
const byline = require("byline");
const { EventEmitter } = require("events");

function parseOutputLine(line) {
    const idxPlus = line.indexOf("+");
    const epoch = parseFloat(line.substring(0, idxPlus));
    const idxColon = line.indexOf(":");
    const timeElapsed = parseFloat(line.substring(idxPlus + 1, idxColon));
    const detectionsStr = line.substring(idxColon + 1);
    const detections = [];
    for (const detectionStr of detectionsStr.split(";;")) {
        if (detectionStr === "") {
            continue;
        }
        const fields = {};
        for (const fieldStr of detectionStr.split(";")) {
            const idxEqual = fieldStr.indexOf("=");
            fields[fieldStr.substring(0, idxEqual)] = fieldStr.substring(idxEqual + 1);
        }
        const parseCoordinate = coordinateStr => {
            const idxComma = coordinateStr.indexOf(",");
            return [
                parseFloat(coordinateStr.substring(1, idxComma)),
                parseFloat(coordinateStr.substring(idxComma + 1, coordinateStr.length - 1))
            ];
        };
        const parseCoordinatesArray = arrayStr => {
            const elements = [];
            arrayStr = arrayStr.substring(2, arrayStr.length - 2);
            for (const elementStr of arrayStr.split("),(")) {
                const idxComma = elementStr.indexOf(",");
                elements.push([
                    parseFloat(elementStr.substring(0, idxComma)),
                    parseFloat(elementStr.substring(idxComma + 1))
                ]);
            }
            return elements;
        };
        detections.push({
            id: parseInt(fields["id"]),
            corners: parseCoordinatesArray(fields["corners"]),
            center: parseCoordinate(fields["center"]),
            hamming: parseInt(fields["hamming"]),
            margin: parseFloat(fields["margin"])
        });
    }
    return {
        detections: detections,
        captureTime: epoch,
        timeElapsed: timeElapsed
    };
}

class TagDetector extends EventEmitter {
    constructor(executable = "./tag_detector") {
        super();

        this.process = spawn(executable, [
            "--camera-width", "1024",
            "--camera-height", "768",
            "--threads", "4",
            "--decimate", "2.0"
        ]);

        byline(this.process.stdout).on("data", line => {
            this.emit("frame", parseOutputLine(line.toString()));
        });

        byline(this.process.stderr).on("data", line => {
            console.error(`tag_detector: ${line}`);
        });

        this.process.on("exit", (code, signal) => {
            let msg = "tag_detector exited";
            if (code !== null) {
                msg += ` with code ${code}`
            } else if (signal !== null) {
                msg += ` with signal ${signal}`
            }
            console.error(msg);
        });
    }
    close() {
        this.process.kill("SIGINT");
    }
}

module.exports = TagDetector;
