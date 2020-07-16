export default class TankAI {

  init(_settings: TankSettings, _info: TankInfo): void {

  }

  loop(_state: TankState, control: TankControl): void {
    control.SHOOT = Math.random();
    control.THROTTLE = Math.random();
    control.TURN = 0.1;
  }

}
