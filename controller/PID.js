class PID {
    constructor(P, I, D) {
        this.Kp = P;
        this.Ki = I;
        this.Kd = D;
        this.clear();
    }
    static clear() {
        this.SetLevel = 0.0;
        this.PTerm = 0.0;
        this.ITerm = 0.0;
        this.DTerm = 0.0;
        this.last_error = 0.0;
        this.windup_guard = 100.0;
        this.output = 0.0;
    }
    static update(feedback_value) {
        error = this.SetLevel - feedback_value;
        this.PTerm = this.Kp * error;
        this.ITerm += error;
        if (this.ITerm < -this.windup_guard) {
            this.ITerm = -this.windup_guard;
        }

        else if (this.ITerm > this.windup_guard) {
            this.ITerm = this.windup_guard;
        }

        const delta_error = error - this.last_error;
        this.DTerm = delta_error;
        this.last_error = error;
        this.output = this.PTerm + (this.Ki * this.ITerm) + (this.Kd * this.DTerm);
    }
}




