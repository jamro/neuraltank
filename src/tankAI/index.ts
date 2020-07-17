import Brain from '../network/Brain';

const RADAR_RANGE = 300;
const RADAR_ANGLE = 8;

export default class TankAI {

  private _brain: Brain;
  private _collisionCounter: number = 0;

  init(_settings: TankSettings, _info: TankInfo): void {
    // Inputs:
    // - wallDistance
    // - enemyDistance
    // - enemyAngle
    // - collision
    //
    // Outputs:
    // - THROTTLE
    // - TURN
    // - SHOOT
    this._brain = new Brain();
    this._brain.createLayers([4, 5, 4, 3]);
    this._brain.randomize();
  }

  loop(state: TankState, control: TankControl): void {
    if(this._collisionCounter > 0) {
      this._collisionCounter--;
    }
    let dx: number;
    let dy: number;
    let wallDistance: number = state.radar.wallDistance !== null ? state.radar.wallDistance : RADAR_RANGE;
    wallDistance = wallDistance/(RADAR_RANGE/2)-1;
    let enemyDistance = RADAR_RANGE;
    let enemyAngle = 0;
    if(state.radar.enemy) {
      dx = state.radar.enemy.x - state.x;
      dy = state.radar.enemy.y - state.y;
      enemyDistance = Math.sqrt(dx*dx + dy*dy);
      enemyAngle = (180/Math.PI)*Math.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
      enemyAngle -= state.angle;
      while(enemyAngle > 180) {
        enemyAngle -= 360;
      }
      while(enemyAngle < -180) {
        enemyAngle += 360;
      }
      enemyAngle /= RADAR_ANGLE;
    }
    if(state.collisions.ally || state.collisions.enemy || state.collisions.wall) {
      this._collisionCounter = 30;
    }

    let input: number[];
    input = [
      wallDistance,
      enemyDistance,
      enemyAngle,
      this._collisionCounter > 0 ? 1 : 0
    ];

    let output: number[] = this._brain.process(input);

    control.THROTTLE = output[0];
    control.TURN = output[1];
    control.SHOOT = output[2] > 0 ? 0.1 : 0;

  }

}
