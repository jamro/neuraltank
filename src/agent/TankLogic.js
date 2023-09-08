import ExtendedMath from 'jsbattle-engine/src/tanks/lib/extendedMath.js'

const Math2 = ExtendedMath()

export default class TankLogic {

  constructor(jsBattle, agent) {
    this.agent = agent
    this.jsBattle = jsBattle
    this.tankModel = null
    this.scoreCorrectionQueue = []
    this._simulation = null
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
      getScore: () => this.tankModel.score,
      getScoreCorrections: () => {
        const corrections = []
        while(this.scoreCorrectionQueue.length) {
          corrections.push(this.scoreCorrectionQueue.pop())
        }
        return corrections
      },
      getBulletDistanceScore: () => {
        return this._simulation.bulletDistanceScore
      }
    }
    console.log(_this)
    target.tankInit = (function (settings, info) { init(settings, info, _this, agent) }).bind(target)
    target.tankLoop = (function (state, control) { loop(state, control, _this, agent) }).bind(target)
  }

  getScore() {
    this.tankModel.score
  }

  init(settings, info, _this, agent) {
    _this.enemyPosBeamAngle = -1
    _this.enemyPosGunAngle = -1
    _this.enemyDistance = 1
    _this.enemyDirection = 0

    _this.lastScore = 0
    _this.lastEnergy = 100
  }
  
  loop(state, control, _this, agent) {

    let radarReward = 0
    let radarAbsAngle = state.radar.angle + state.angle
    let gunAbsAngle = state.gun.angle + state.angle

    if(state.radar.enemy) {
      // calculate enemy angular position wrt. the battlefield
      let enemyPosAngle = Math2.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
  
      // calculate distance to the enemy
      const edx = state.x - state.radar.enemy.x
      const edy = state.y - state.radar.enemy.y
      const enemyDistance = Math.min(1, Math.max(-1, Math.sqrt(edx*edx + edy*edy)/150 - 1)) // keep it in range of -1,1
      _this.enemyDistance = enemyDistance

      // calculate angular position of the enemy wrt. radar beam
      let enemyPosBeamAngle = Math2.deg.normalize(radarAbsAngle - enemyPosAngle)/16 // keep it in range of -1,1
      enemyPosBeamAngle = Math.min(1, Math.max(-1, enemyPosBeamAngle))
      _this.enemyPosBeamAngle = enemyPosBeamAngle
      let enemyPosGunAngle = Math2.deg.normalize(gunAbsAngle - enemyPosAngle)/90 // keep it in range of -1,1
      enemyPosGunAngle = Math.min(1, Math.max(-1, enemyPosGunAngle))
      _this.enemyPosGunAngle = enemyPosGunAngle

      // calculate enemy direction angle wrt radar beam
      const enemyAngle = Math2.deg2rad(Math2.deg.normalize(radarAbsAngle - state.radar.enemy.angle))
      const enemyDirection = (Math.sin(enemyAngle) * state.radar.enemy.speed) / 2 // keep it in range of -1,1
      _this.enemyDirection = enemyDirection

    } else {
      // smoothly move the position to the range border when enemy lost
      const awayEnemyPosBeamAngle = _this.enemyPosBeamAngle > 0 ? 1 : -1
      _this.enemyPosBeamAngle = awayEnemyPosBeamAngle * Math.min(1, Math.abs(_this.enemyPosBeamAngle) + 0.1)
      const awayEnemyPosGunAngle = _this.enemyPosGunAngle > 0 ? 1 : -1
      _this.enemyPosGunAngle = awayEnemyPosGunAngle * Math.min(1, Math.abs(_this.enemyPosGunAngle) + 0.1)
      _this.enemyDistance = Math.min(1, _this.enemyDistance + 0.05)
      _this.enemyDirection += (0-_this.enemyDirection)/50
    }

    if(state.radar.enemy) {
      radarReward = Math.max(0, 1 - Math.abs(_this.enemyPosBeamAngle))/5
    }

    const gunPos = Math.max(-1, Math.min(1, Math2.deg.normalize(state.radar.angle - state.gun.angle)/90))
    const input = [
      _this.enemyDistance,
      _this.enemyPosBeamAngle,
      _this.enemyDirection,
      _this.enemyPosGunAngle
    ]

    // reward
    const totalScore = _this.getScore()
    const gameScoreReward = totalScore - _this.lastScore
    _this.lastScore = totalScore
    const energyReward = state.energy - _this.lastEnergy
    _this.lastEnergy = state.energy
    const collisionReward = state.collisions.wall ? -1 : 0

    const rewards = [gameScoreReward, radarReward, energyReward, collisionReward, _this.getBulletDistanceScore()]
    const actions = agent.act(input, rewards, _this.getScoreCorrections())
    control.GUN_TURN = actions[0]

    // find enemy
    if(state.radar.enemy) {
      control.RADAR_TURN = -_this.enemyPosBeamAngle
    } else {
      control.RADAR_TURN = 1
    }
    control.SHOOT = 0.1

  }

  createAI(simulation) {
    const code = `importScripts('lib/tank.js');
      tank.init(function(settings, info) {
        tankInit(settings, info)
      })
      tank.loop(function(state, control) {
        tankLoop(state, control)
      });`
    
    this._simulation = simulation
    this._ai = this.jsBattle.createAiDefinition();
    this._ai.fromCode('neuraltank', code);
    this._ai.disableSandbox()
    this.tankModel = simulation.addTank(this._ai).tank;
    this.scoreCorrectionQueue = simulation.scoreCorrectionQueue
  }

}