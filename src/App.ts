import SimPlayer from './sim/SimPlayer';

export class App {

  constructor() {

    let sim1: SimPlayer = new SimPlayer('sim1');
    let sim2: SimPlayer = new SimPlayer('sim2');
    let sim3: SimPlayer = new SimPlayer('sim3');
    let sim4: SimPlayer = new SimPlayer('sim4');


    sim1.onFinish(() => sim1.start());
    sim2.onFinish(() => sim2.start());
    sim3.onFinish(() => sim3.start());
    sim4.onFinish(() => sim4.start());

    sim1.start();
    sim2.start();
    sim3.start();
    sim4.start();

  }
}
