#include <unistd.h>
#include <stdio.h>
#include <math.h>
#include <time.h>

#include "MotionSensor.h"

#define delay_ms(a) usleep(a*1000)

int main() {
	ms_open();
	do{
		ms_update();
		printf("yaw=%f,pitch=%f,roll=%f,temperature=%f\n",
		 ypr[YAW], ypr[PITCH], ypr[ROLL],temp);
		delay_ms(5);
	}while(1);

	return 0;
}
