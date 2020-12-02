const Vehicle = require("./motor");
const Motor = require("./motor");
const sleep = require("await-sleep");

const vehicle = new Vehicle();
const motor = new Motor();
motor.begin();

async function go_ahead(speed,duration){
	await motor.setSpeed("left_front",speed);
	await motor.setSpeed("left_back",speed);
	await motor.setSpeed("right_front",speed);
	await motor.setSpeed("right_back",speed);
	await sleep(duration);
	await motor.setSpeed("left_front",-speed);
	await motor.setSpeed("left_back",-speed);
	await motor.setSpeed("right_front",-speed);
	await motor.setSpeed("right_back",-speed);
	await sleep(50);
	await motor.setSpeed("left_front",0);
	await motor.setSpeed("left_back",0);
	await motor.setSpeed("right_front",0);
	await motor.setSpeed("right_back",0);
}

async function rotate(speed,duration){
	await motor.setSpeed("left_front",speed);
	await motor.setSpeed("left_back",speed);
	await motor.setSpeed("right_front",-speed);
	await motor.setSpeed("right_back",-speed);
	await sleep(duration);
	await motor.setSpeed("left_front",speed);
	await motor.setSpeed("left_back",speed);
	await motor.setSpeed("right_front",-speed);
	await motor.setSpeed("right_back",-speed);
	await sleep(10);
	await motor.setSpeed("left_front",0);
	await motor.setSpeed("left_back",0);
	await motor.setSpeed("right_front",0);
	await motor.setSpeed("right_back",0);
}

module.exports = {
	go_ahead,
	rotate
};
