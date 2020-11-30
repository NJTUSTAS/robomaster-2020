const Motor = require("./motor");
const sleep = require("await-sleep");

const motor = new Motor();
async function stop()
{

    await motor.setSpeed("left_front",0);
    await motor.setSpeed("right_front",0);
    await motor.setSpeed("left_back",0);
    await motor.setSpeed("right_back",0);

}

async function go_ahead(speed,time) 
{
    await motor.setSpeed("left_front",speed);
    await motor.setSpeed("right_front",speed);
    await motor.setSpeed("left_back",speed);
    await motor.setSpeed("right_back",speed);
    await sleep(time);
    await motor.setSpeed("left_front",-speed);
    await motor.setSpeed("right_front",-speed);
    await motor.setSpeed("left_back",-speed);
    await motor.setSpeed("right_back",-speed);
    await sleep(50);
    await stop();

}
async function back(speed,time) 
{
    await motor.setSpeed("left_front",-speed);
    await motor.setSpeed("right_front",-speed);
    await motor.setSpeed("left_back",-speed);
    await motor.setSpeed("right_back",-speed);
    await sleep(time);
    await motor.setSpeed("left_front",speed);
    await motor.setSpeed("right_front",speed);
    await motor.setSpeed("left_back",speed);
    await motor.setSpeed("right_back",speed);
    await sleep(50);
    await stop();


}
async function Leftgo(speed,time)
{
    await motor.setSpeed("left_front",0.25+speed);
    await motor.setSpeed("right_front",0.25-speed);
    await motor.setSpeed("left_back",0.25-speed);
    await motor.setSpeed("right_back",0.25+speed);
    await sleep(time);
    await stop();


}
async function Rightgo(speed,time)
{
    await motor.setSpeed("left_front",0.25-speed);
    await motor.setSpeed("right_front",0.25+speed);
    await motor.setSpeed("left_back",0.25+speed);
    await motor.setSpeed("right_back",0.25-speed);
    await sleep(time);
    await stop();
}


async function Left(speed,time)
{
    await motor.setSpeed("left_front",-speed);
    await motor.setSpeed("right_front",speed);
    await motor.setSpeed("left_back",speed);
    await motor.setSpeed("right_back",-speed);
    await sleep(time);
    await stop();
}

async function Right(speed,time)
{
    await motor.setSpeed("left_front",speed);
    await motor.setSpeed("right_front",-speed);
    await motor.setSpeed("left_back",-speed);
    await motor.setSpeed("right_back",speed);
    await sleep(time);
    await stop();

}
async function Rightturn(speed,time)
{
    await motor.setSpeed("left_front",speed);
    await motor.setSpeed("right_front",-speed);
    await motor.setSpeed("left_back",speed);
    await motor.setSpeed("right_back",-speed);
    await sleep(time);
    await stop();
}
async function Leftturn(speed,time)
{
    await motor.setSpeed("left_front",-speed);
    await motor.setSpeed("right_front",speed);
    await motor.setSpeed("left_back",-speed);
    await motor.setSpeed("right_back",speed);
    await sleep(time);
    await stop();
}

//(async () => {
//
//    await motor.begin();
//    await go_ahead(0.5,1000);
//    await Rightturn(0.5,1000);
//
//})();

module.exports = {
    begin:motor.begin,
    go_ahead,back,Left,Leftgo,Leftturn,Right,Rightgo,Rightturn,stop,sleep
};
