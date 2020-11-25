#ifndef __SONAR_H__
#define __SONAR_H__

#include "mbed.h"

class Sonar {
  private:
	// 等待回波的最大时间，相应距离为 4m
	static constexpr int MAX_ECHO_US = 23200;

	static constexpr int read_us(Timer &target) {
		return std::chrono::duration<int, micro>(target.elapsed_time()).count();
	}

	DigitalIn echo;
	DigitalOut trigger;
	Timer sonar;
	Timer echo0Timer;
	int correction;

  public:
	Sonar(PinName p_trigger, PinName p_echo)
	    : trigger{DigitalOut(p_trigger)}, echo(DigitalIn(p_echo, PullDown)) {
		echo0Timer.reset();
		echo0Timer.start();
		sonar.reset();
		sonar.start();
		sonar.stop();
		correction = read_us(sonar);
	}

	// 返回测量结果(mm)
	// 特别地：
	// -2 模块未发出 ECHO 信号（可能未连接）
	// -1 距离过远
	int detect_distance() {
		echo0Timer.reset();
		trigger = 1;
		sonar.reset();
		wait_us(10.0);
		trigger = 0;
		while (echo == 0) {
			if (read_us(echo0Timer) > MAX_ECHO_US) {
				return -2;
			}
		}
		sonar.start();
		while (echo == 1) {
			if (read_us(sonar) > MAX_ECHO_US) {
				return -1;
			}
		}
		sonar.stop();
		return (read_us(sonar) - correction) / 5.8;
	}
};

#endif // !__SONAR_H__
