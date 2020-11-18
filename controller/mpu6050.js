const { spawn } = require("child_process");
const byline = require("byline");
const { EventEmitter } = require("events");

function parseOutputLine(line) {
    if (line.startsWith(";")) {
        line = line.substring(1);
    } else {
        return null;
    }

    const fields = {};
    for (const fieldStr of detectionStr.split(",")) {
        const idxEqual = fieldStr.indexOf("=");
        fields[fieldStr.substring(0, idxEqual)] = parseFloat(fieldStr.substring(idxEqual + 1));
    }
    return fields;
}

class MPU6050 extends EventEmitter {
    constructor() {
        super();

        this.process = spawn("./read_mpu6050");

        byline(this.process.stdout).on("data", line => {
            const result = parseOutputLine(line.toString());
            if (result !== null) {
                this.emit("motion", result);
            } else {
                console.info(`read_mpu6050: ${line}`);
            }
        });

        byline(this.process.stderr).on("data", line => {
            console.error(`read_mpu6050: ${line}`);
        });

        this.process.on("exit", (code, signal) => {
            let msg = "read_mpu6050 exited";
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

module.exports = MPU6050;
