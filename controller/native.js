const Motor = require("./motor");
const sleep = require("await-sleep");


function go_S(speed) //前进,默认为1档
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);

}
/*function back(speed) //后退，默认一档
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);

}
function Left(speed)
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);

}
function Right(speed)
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);

}
function Leftgo()
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);
}
function Rightgo()
{
    Motor.setSpeed(left_front,speed);
    Motor.setSpeed(right_front,speed);
    Motor.setSpeed(left_back,speed);
    Motor.setSpeed(left_back,speed);
}*/

go_S(1000);
await sleep(100);
go_S(0);
