import * as tf from '@tensorflow/tfjs';
import ExtendedMath from 'jsbattle-engine/src/tanks/lib/extendedMath.js'

const Math2 = ExtendedMath()

export default class TankLogic {

  constructor(jsBattle, agent) {
    this.agent = agent
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
    const agent = this.agent
    const init = this.init
    const loop = this.loop
    const _this = { 
      getScore: () => this.tankModel.score
    }
    console.log(_this)
    target.tankInit = (function (settings, info) { init(settings, info, _this, agent) }).bind(target)
    target.tankLoop = (function (state, control) { loop(state, control, _this, agent) }).bind(target)
  }

  getScore() {
    this.tankModel.score
  }

  init(settings, info, _this, agent) {
    _this.lastEnemyPosAngle = null
    _this.lastEnemyPosBeamAngle = -1
    _this.lastScore = 0
    _this.lastEnergy = 100
  }
  
  loop(state, control, _this, agent) {


    // calculate angular position of the enemy within the radar beam
    let enemyDistance = 320
    let radarReward = -0.02
    let radarAbsAngle = state.radar.angle + state.angle

    if(state.radar.enemy) {
      let enemyPosAngle = Math2.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
      _this.lastEnemyPosAngle = enemyPosAngle
  
      const edx = state.x - state.radar.enemy.x
      const edy = state.y - state.radar.enemy.y
      enemyDistance = Math.sqrt(edx*edx + edy*edy)

      let enemyPosBeamAngle = _this.lastEnemyPosAngle === null ? -1 : Math2.deg.normalize(radarAbsAngle - _this.lastEnemyPosAngle)/20
      enemyPosBeamAngle = Math.min(1, Math.max(-1, enemyPosBeamAngle))
      _this.lastEnemyPosBeamAngle = enemyPosBeamAngle

    } else {
      if(_this.lastEnemyPosBeamAngle > 0) {
        _this.lastEnemyPosBeamAngle = 1
      } else {
        _this.lastEnemyPosBeamAngle = -1
      }
    }

    if(state.radar.enemy) {
      radarReward = Math.max(0, 1 - Math.abs(_this.lastEnemyPosBeamAngle))/5
    }

    const input = [
      enemyDistance/150 - 1,
      _this.lastEnemyPosBeamAngle,
    ]

    // reward
    const totalScore = _this.getScore()
    const gameScoreReward = totalScore - _this.lastScore
    _this.lastScore = totalScore
    const energyReward = state.energy - _this.lastEnergy
    _this.lastEnergy = state.energy
    const collisionReward = state.collisions.wall ? -1 : 0

    const actions = agent.act(input, [gameScoreReward, radarReward, energyReward, collisionReward])
  
    control.GUN_TURN = actions[0]
    control.RADAR_TURN = Math2.deg.normalize(state.gun.angle - state.radar.angle)/10
    //control.SHOOT = 0.1
  }

  createAI(simulation) { // @TODO remove reward type
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