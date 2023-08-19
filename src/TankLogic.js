import * as tf from '@tensorflow/tfjs';
import ExtendedMath from 'jsbattle-engine/src/tanks/lib/extendedMath'

const Math2 = ExtendedMath()

export default class TankLogic {

  constructor(jsBattle, policy) {
    this.policy = policy
    this.jsBattle = jsBattle
    this.tankModel = null
    this.rewardType = null
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
    const _this = { 
      getRewardType: () => this.rewardType,
      getScore: () => this.tankModel.score
    }
    console.log(_this)
    target.tankInit = (function (settings, info) { init(settings, info, _this, policy) }).bind(target)
    target.tankLoop = (function (state, control) { loop(state, control, _this, policy) }).bind(target)
  }

  getScore() {
    this.tankModel.score
  }

  init(settings, info, _this, policy) {
    _this.lastEnemyPosBeamAngle = -1
    _this.totalRadarScore = 0
  }
  
  loop(state, control, _this, policy) {

    // calculate angular position of the enemy within the radar beam
    let enemyDistance = 300
    let radarScore = -0.05
    if(state.radar.enemy) {
      let enemyPosBeamAngle = Math2.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
      let radarAbsAngle = state.radar.angle + state.angle
      enemyPosBeamAngle = Math2.deg.normalize(radarAbsAngle - enemyPosBeamAngle)/8
      _this.lastEnemyPosBeamAngle = enemyPosBeamAngle

      const edx = state.x - state.radar.enemy.x
      const edy = state.y - state.radar.enemy.y
      enemyDistance = Math.sqrt(edx*edx + edy*edy)

      radarScore = Math.max(0, 1 - Math.abs(enemyPosBeamAngle))
    }

    const input = [
      enemyDistance/150 - 1,
      _this.lastEnemyPosBeamAngle
    ]

    // choose reward
    _this.totalRadarScore += radarScore
    let totalReward = 0
    switch(_this.getRewardType()) {
      case 'gameScore':
        totalReward = _this.getScore()
        break;
      case 'radarBeam':
        totalReward = _this.totalRadarScore
        break;
      default:
        throw new Error(`Unknown reward type '${_this.rewardType}'`)
    }

    const action = policy.train(input, totalReward)
  
    control.RADAR_TURN = action ? 1 : -1
  }

  createAI(simulation, rewardType) {
    this.rewardType = rewardType
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