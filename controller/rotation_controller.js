const sleep = require("await-sleep");
class RotationController {
    constructor(rotateFn,defaultDuration){
        this.rotateFn=rotateFn;
        this.defaultDuration=defaultDuration;
        this._ver=0;
    }
    async setRotation(speed,duration){
        if(duration===undefined){
            duration=this.defaultDuration;
        }
        const my_ver=++this._ver;
        await this.rotateFn(speed);
        (async()=>{
            await sleep(duration);
            if(this._ver===my_ver){
                await this.rotateFn(0);
            }
        })();
    }
};
module.exports=RotationController;
