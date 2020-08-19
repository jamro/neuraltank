import Brain from '../network/Brain';

const RADAR_RANGE:number = 300;
const RADAR_ANGLE:number = 8;
const BOOST_MAX:number = 400;
const COLLISION_COUNTER_MAX:number = 30;

export default class TankAI {

  private _brain: Brain;
  private _collisionCounter: number = 0;

  init(_settings: TankSettings, info: TankInfo): void {
    // Inputs:
    // - wallDistance
    // - enemyDistance
    // - enemyAngle
    // - collision
    // - boost
    // - targetting alarm
    //
    // Outputs:
    // - THROTTLE
    // - TURN
    // - SHOOT
    // - BOOST
    this._brain = new Brain();
    this._brain.createLayers([6, 7, 6, 4]);

    this._brain.restoreSnapshot(info.initData.braindump);

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
    enemyDistance = enemyDistance/(RADAR_RANGE/2)-1;
    if(state.collisions.ally || state.collisions.enemy || state.collisions.wall) {
      this._collisionCounter = COLLISION_COUNTER_MAX;
    }

    let input: number[];
    input = [
      wallDistance,
      enemyDistance,
      enemyAngle,
      this._collisionCounter > 0 ? 1 : 0,
      state.radar.targetingAlarm ? 1 : 0,
      state.boost/(BOOST_MAX/2)-1
    ];

    let output: number[] = this._brain.process(input);

    control.THROTTLE = output[0];
    control.TURN = output[1];
    control.SHOOT = output[2]/2+0.5;
    control.BOOST = output[3] > 0 ? 1 : 0;

  }

}
