#include "mbed.h"

// 等待回波的最大时间，相应距离为 4m
const int MAX_ECHO_US = 23200;

class Sonar {
  public:
	DigitalIn echo;
	DigitalOut trigger;
	Timer sonar;
	Timer echo0Timer;
	int correction;
	Sonar(PinName p_trigger, PinName p_echo)
	    : trigger{DigitalOut(p_trigger)}, echo(DigitalIn(p_echo, PullDown)) {
		echo0Timer.reset();
		echo0Timer.start();
		sonar.reset();
		sonar.start();
		sonar.stop();
		correction = sonar.read_us();
	}
	// 返回测量结果(mm)
	// 特别的：
	// -2 模块未发出 ECHO 信号（可能未连接）
	// -1 距离过远
	int detect_distance() {
		echo0Timer.reset();
		trigger = 1;
		sonar.reset();
		wait_us(10.0);
		trigger = 0;
		while (echo == 0) {
			if (echo0Timer.read_us() > MAX_ECHO_US) {
				return -2;
			}
		}
		sonar.start();
		while (echo == 1) {
			if (sonar.read_us() > MAX_ECHO_US) {
				return -1;
			}
		}
		sonar.stop();
		return (sonar.read_us() - correction) / 5.8;
	}
};
