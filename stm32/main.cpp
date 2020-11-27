#include "mbed.h"
#include "sonar.h"

const PinName PIN_PWM_LEFT = D2;      // ENA
const PinName PIN_PWM_RIGHT = D3;     // ENB
const PinName PIN_FORWARD_LEFT = D5;  // IN2
const PinName PIN_BACK_LEFT = D4;     // IN1
const PinName PIN_FORWARD_RIGHT = D6; // IN3
const PinName PIN_BACK_RIGHT = D7;    // IN4
const PinName PIN_PWM_SERVO_YAW = D8;
const PinName PIN_PWM_SERVO_PITCH = D9;
const PinName PIN_SONAR_FRONT_TRIG = A0;
const PinName PIN_SONAR_FRONT_ECHO = A1;
const PinName PIN_SONAR_LEFT_TRIG = A2;
const PinName PIN_SONAR_LEFT_ECHO = A3;
const PinName PIN_SONAR_RIGHT_TRIG = A4;
const PinName PIN_SONAR_RIGHT_ECHO = A5;
const PinName PIN_GUN_SIG = PD_2;

PwmOut pwm_left(PIN_PWM_LEFT);
PwmOut pwm_right(PIN_PWM_RIGHT);
DigitalOut forward_left(PIN_FORWARD_LEFT);
DigitalOut back_left(PIN_BACK_LEFT);
DigitalOut forward_right(PIN_FORWARD_RIGHT);
DigitalOut back_right(PIN_BACK_RIGHT);
PwmOut pwm_servo_yaw(PIN_PWM_SERVO_YAW);
PwmOut pwm_servo_pitch(PIN_PWM_SERVO_PITCH);
DigitalOut gun_sig(PIN_GUN_SIG);

Sonar sonar_front(PIN_SONAR_FRONT_TRIG, PIN_SONAR_FRONT_ECHO);
Sonar sonar_left(PIN_SONAR_LEFT_TRIG, PIN_SONAR_LEFT_ECHO);
Sonar sonar_right(PIN_SONAR_RIGHT_TRIG, PIN_SONAR_RIGHT_ECHO);

UnbufferedSerial serial(PA_11, PA_12, 115200);
UnbufferedSerial usb_serial(USBTX, USBRX, 115200);
DigitalOut led(LED_RED);

void process_message(const char *buf) {
	led = !led;
	uint16_t data = (((uint16_t)buf[1]) << 8) | ((uint16_t)buf[2]);
	// printf("command: %c %d\n", buf[0], (int)data);

	// lowercase means backwards
	// UPPERCASE means forwad
	switch (buf[0]) {
	case 'l': // left back
		if (data == 0) {
			forward_left = 0;
			back_left = 0;
			pwm_left = 0.0;
		} else {
			forward_left = 0;
			back_left = 1;
			pwm_left = ((float)data) / 0xffff;
		}
		break;

	case 'L': // left forward
		if (data == 0) {
			forward_left = 0;
			back_left = 0;
			pwm_left = 0.0;
		} else {
			back_left = 0;
			forward_left = 1;
			pwm_left = ((float)data) / 0xffff;
		}
		break;

	case 'r': // right back
		if (data == 0) {
			forward_right = 0;
			back_right = 0;
			pwm_right = 0.0;
		} else {
			forward_right = 0;
			back_right = 1;
			pwm_right = ((float)data) / 0xffff;
		}
		break;

	case 'R': // right forward
		if (data == 0) {
			forward_right = 0;
			back_right = 0;
			pwm_right = 0.0;
		} else {
			back_right = 0;
			forward_right = 1;
			pwm_right = ((float)data) / 0xffff;
		}
		break;

	case 'u': // servo yaw
		pwm_servo_yaw = ((float)data) / 0xffff;
		break;

	case 'v': // servo pitch

		// For Wen's: range 3000 (maxinum angle) ~ 6000 (mininum angle)

		// For Xu's: 3800 (mininum angle) ~ 6800 (maxinum angle)
		// (4700: parallel)

		pwm_servo_pitch = ((float)data) / 0xffff;
		break;

	case 's': // gun signal
		if (data == 0) {
			gun_sig = 0;
		} else if (data == 1) {
			gun_sig = 1;
		}
		break;
	}
}

void serial_receive(char data) {
	static char buf[3];
	static int pos = 0;
	static int zero_count = 0;

	if (zero_count == 3) {
		if (data == 0 && pos == 0) {
			// the first byte of msg must not be zero
			// skip to find message head
		} else {
			buf[pos++] = data;
			if (pos == 3) {
				process_message(buf);
				zero_count = 0;
				pos = 0;
			}
		}
	} else {
		if (data == 0) {
			zero_count++;
		} else {
			zero_count = 0;
		}
	}
}

void perform_detection(Sonar &sonar, char command) {
	int16_t distance = sonar.detect_distance();
	const char buf[] = {0x00,
	                    0x00,
	                    0x00,
	                    command,
	                    (char)((distance >> 8) & 0xff),
	                    (char)(distance & 0xff)};
	serial.write(buf, 6);
}

int main() {
	pwm_left = 0.0;
	pwm_right = 0.0;
	forward_left = 0;
	back_left = 0;
	forward_right = 0;
	back_right = 0;
	gun_sig = 0;
	led = 0;

	serial.attach([] {
		char c;
		if (serial.read(&c, 1)) {
			serial_receive(c);
		}
	});

	printf("hello, world\n");

	while (true) {
		ThisThread::sleep_for(100ms);
		perform_detection(sonar_front, 'f');
		ThisThread::sleep_for(100ms);
		perform_detection(sonar_left, 'l');
		ThisThread::sleep_for(100ms);
		perform_detection(sonar_right, 'r');
	}
}
