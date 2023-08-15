import * as tf from '@tensorflow/tfjs';
import ExtendedMath from 'jsbattle-engine/src/tanks/lib/extendedMath'

const Math2 = ExtendedMath()

export default class TankLogic {

  constructor(jsBattle, policy) {
    this.policy = policy
    this.jsBattle = jsBattle
    this.tankModel = null
  }

  installCallbacks(target) {
    if(target.tankInit) {
      throw new Error('tankInit callback already installed on target object')
    }
    if(target.tankLoop) {
      throw new Error('tankLoop callback already installed on target object')
    }

    // escape this context
    const policy = this.policy
    const init = this.init
    const loop = this.loop
    const score = { getScore: () => this.tankModel.score}
    const _this = {}
    target.tankInit = (function (settings, info) { init(settings, info, _this, policy, score) }).bind(target)
    target.tankLoop = (function (state, control) { loop(state, control, _this, policy, score) }).bind(target)
  }

  getScore() {
    this.tankModel.score
  }

  init(settings, info, _this, policy, score) {
    _this.lastEnemyPosBeamAngle = -1
  }
  
  loop(state, control, _this, policy, score) {

    // calculate angular position of the enemy within the radar beam
    if(state.radar.enemy) {
      let enemyPosBeamAngle = Math2.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
      let radarAbsAngle = state.radar.angle + state.angle
      enemyPosBeamAngle = Math2.deg.normalize(radarAbsAngle - enemyPosBeamAngle)/8
      _this.lastEnemyPosBeamAngle = enemyPosBeamAngle
    }
    
    const input = [
      state.radar.enemy ? 1 : -1,
      //_this.lastEnemyPosBeamAngle
    ]

    const action = policy.train(input, score.getScore())
  
    control.SHOOT = 0.1
    control.TURN = action ? 1 : -1
  }

  createAI(simulation) {
    const code = `importScripts('lib/tank.js');
      tank.init(function(settings, info) {
        tankInit(settings, info)
      })
      tank.loop(function(state, control) {
        tankLoop(state, control)
      });`
    this._ai = this.jsBattle.createAiDefinition();
    this._ai.fromCode('neuraltank', code);
    this._ai.disableSandbox()
    this.tankModel = simulation.addTank(this._ai).tank;
  }

}