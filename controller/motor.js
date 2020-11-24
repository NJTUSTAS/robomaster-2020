const I2CDevice = require("./i2c");
const sleep = require("await-sleep");

const wheel_mapping = {
    left_front: 3,
    right_front: 4,
    left_back: 1,
    right_back: 2
};

class Motor extends I2CDevice {
    constructor(address = 0x40) {
        super(address);
        this.speedLimit = 1.0;
        this._begin();
    }

    async _write8(addr, d) {
        await this._i2cWrite(Buffer.from([
            addr,
            d
        ]));
    }

    async _read8(addr) {
        const { bytesRead, buffer } = await this._i2cRead(1);
        if (bytesRead !== 1) {
            throw new Error(`expect to read 1 byte, actual: ${bytesRead}`);
        }
        return buffer.readUInt8(0);
    }

    async _reset() {
        await this._write8(0x00, 0x80);
        await sleep(10);
    }

    async _setPWMFreq(freq) {
        if (freq < 1) freq = 1;
        if (freq > 3500) freq = 3500;

        const _oscillator_freq = 0;
        let prescalevel = ((_oscillator_freq / (freq * 4096)) + .5) - 1;
        if (prescalevel < 3) prescalevel = 3;
        if (prescalevel > 255) prescalevel = 255;
        let prescale = Math.trunc(prescalevel);

        let oldmode = await this._read8(0x00);
        let newmode = (oldmode & (~0x80)) | 0x10;
        await this._write8(0x00, newmode);
        await this._write8(0xfe, prescale);
        await this._write8(0x00, oldmode);
        await sleep(5);
        await this._write8(0x00, oldmode | 0x80 | 0x20);
    }

    async _begin() {
        await this._reset();
        await this._setPWMFreq(1000);
    }

    async _setPWM(num, on, off) {
        await this._i2cWrite(Buffer.from([
            0x06 + 4 * num,
            on & 0xff,
            (on >> 8) & 0xff,
            off & 0xff,
            (off >> 8) & 0xff
        ]));
    }

    async _setPin(num, val) {
        val = val > 4095 ? 4095 : val;
        if (val === 4095) {
            await this._setPWM(num, 4096, 0);
        } else if (val === 0) {
            await this._setPWM(num, 0, 4096);
        } else {
            await this._setPWM(num, 0, val);
        }
    }

    async _driveOneMotor_IIC(_in1Pin, _in2Pin, _pwmPin, _mspeed, _moffset = 1) {
        _moffset = _moffset >= 0 ? 1 : -1;
        _mspeed = _mspeed * _moffset;
        if (_mspeed > 0) {
            await this._setPin(_in1Pin, 4096, 0);
            await this._setPin(_in2Pin, 0, 0);
            await this._setPin(_pwmPin, _mspeed, 0);
        } else if (_mspeed < 0) {
            await this._setPin(_in1Pin, 0, 0);
            await this._setPin(_in2Pin, 4096, 0);
            await this._setPin(_pwmPin, -_mspeed, 0);
        } else {
            await this._setPin(_in1Pin, 0, 0);
            await this._setPin(_in2Pin, 0, 0);
        }
    }

    async _setSingleMotor(_mNum, _mspeed) {
        if (_mNum === 1) {
            await this._driveOneMotor_IIC(0, 1, 2, _mspeed, 1);
        } else if (_mNum === 2) {
            await this._driveOneMotor_IIC(3, 4, 5, _mspeed, -1);
        } else if (_mNum === 3) {
            await this._driveOneMotor_IIC(8, 9, 10, _mspeed, 1);
        } else if (_mNum === 4) {
            await this._driveOneMotor_IIC(11, 12, 13, _mspeed, -1);
        }
    }

    /**
    * @param {"left_front"|"right_front"|"left_back"|"right_back"} wheel The wheel to control
    * @param {number} speed Speed of the wheel, ranging from -1.0 to 1.0
    */
    async setSpeed(wheel, speed) {
        let wheel_num = wheel_mapping[wheel];
        if (typeof wheel_num !== "number") {
            throw new Error(`illegal wheel ${wheel}`);
        }
        if (speed > this.speedLimit) {
            console.warn(`motor: speeding! trying to set speed to ${speed}`);
            speed = this.speedLimit;
        } else if (speed < -this.speedLimit) {
            console.warn(`motor: speeding! trying to set speed to ${speed}`);
            speed = -this.speedLimit;
        }
        const raw_speed = Math.round(speed * 4096);
        await this._setSingleMotor(wheel_num, raw_speed);
    }
}

module.exports = Motor;
