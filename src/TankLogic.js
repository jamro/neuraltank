import * as tf from '@tensorflow/tfjs';

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
    target.tankInit = (function (settings, info) { init(settings, info, policy, score) }).bind(target)
    target.tankLoop = (function (state, control) { loop(state, control, policy, score) }).bind(target)
  }

  getScore() {
    this.tankModel.score
  }

  init(settings, info, policy, score) {

  }
  
  loop(state, control, policy, score) {
    const input = [
      state.radar.enemy ? 1 : -1,
    ]

    const action = policy.train(input, score.getScore())
  
    control.SHOOT = 0.1
    control.TURN = action ? 1 : 0
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