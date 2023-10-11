import ExtendedMath from 'jsbattle-engine/src/tanks/lib/extendedMath.js'
import BulletVision from './BulletVision'

const Math2 = ExtendedMath()

export default class TankLogic {

  constructor(jsBattle, agent) {
    this.agent = agent
    this.jsBattle = jsBattle
    this.tankModel = null
    this.scoreCorrectionQueue = []
    this._simulation = null
    this._noVisionTime = 0
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
    _this.bulletVision = new BulletVision()
    _this.enemyPosBeamAngle = -1
    _this.enemyPosGunAngle = -1
    _this.enemyPosTankAngle = -1
    _this.enemyDistance = 1
    _this.enemyDirection = 0
    _this.noVisionTime = 0
    _this.lastScore = 0
    _this.lastEnergy = 100
    _this.collisionTimer = -1
    _this.enemyFound = -1
  }
  
  loop(state, control, _this, agent) {
    _this.bulletVision.updateState(state)

    let radarReward = 0
    let radarAbsAngle = state.radar.angle + state.angle
    let gunAbsAngle = state.gun.angle + state.angle

    if(state.radar.enemy) {
      _this.enemyFound = 1
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
      let enemyPosGunAngle = Math2.deg.normalize(gunAbsAngle - enemyPosAngle)/45 // keep it in range of -1,1
      enemyPosGunAngle = Math.min(1, Math.max(-1, enemyPosGunAngle))
      _this.enemyPosGunAngle = enemyPosGunAngle
      let enemyPosTankAngle = Math2.deg.normalize(state.angle - enemyPosAngle)/135 // keep it in range of -1,1
      enemyPosTankAngle = Math.min(1, Math.max(-1, enemyPosTankAngle))
      _this.enemyPosTankAngle = enemyPosTankAngle

      // calculate enemy direction angle wrt radar beam
      const enemyAngle = Math2.deg2rad(Math2.deg.normalize(radarAbsAngle - state.radar.enemy.angle))
      const enemyDirection = (Math.sin(enemyAngle) * state.radar.enemy.speed) / 2 // keep it in range of -1,1
      _this.enemyDirection = enemyDirection

    } else {
      // smoothly move the position to the range border when enemy lost
      _this.enemyFound = Math.max(-1, _this.enemyFound - 0.1)
      const awayEnemyPosBeamAngle = _this.enemyPosBeamAngle > 0 ? 1 : -1
      _this.enemyPosBeamAngle = awayEnemyPosBeamAngle * Math.min(1, Math.abs(_this.enemyPosBeamAngle) + 0.1)
      const awayEnemyPosGunAngle = _this.enemyPosGunAngle > 0 ? 1 : -1
      _this.enemyPosGunAngle = awayEnemyPosGunAngle * Math.min(1, Math.abs(_this.enemyPosGunAngle) + 0.1)
      const awayEnemyPosTankAngle = _this.enemyPosTankAngle > 0 ? 1 : -1
      _this.enemyPosTankAngle = awayEnemyPosTankAngle * Math.min(1, Math.abs(_this.enemyPosTankAngle) + 0.1)
      _this.enemyDistance = Math.min(1, _this.enemyDistance + 0.05)
      _this.enemyDirection += (0-_this.enemyDirection)/50
    }

    if(state.radar.enemy) {
      _this.noVisionTime = 0
      radarReward = Math.max(0, 1 - Math.abs(_this.enemyPosBeamAngle))/5
      radarReward *= (1-1.2*Math.max(0, _this.enemyDistance))
      radarReward *= (1-1.2*Math.max(0, -_this.enemyDistance))
    } else {
      _this.noVisionTime ++
      radarReward = -Math.min(200, _this.noVisionTime) * 0.00025
    }

    if(state.collisions.wall || state.collisions.enemy || state.collisions.ally) {
      _this.collisionTimer = 1
    } else {
      _this.collisionTimer += (-1 - _this.collisionTimer)/10
    }

    let bulletDistance = _this.bulletVision.nearestAccurateBullet ? _this.bulletVision.nearestAccurateBullet.distance : 300
    bulletDistance = Math.max(-1, Math.min(1, bulletDistance/150-1))

    const input = [
      _this.enemyDistance,
      _this.enemyPosBeamAngle,
      _this.enemyDirection,
      _this.enemyPosGunAngle,
      (state.radar.wallDistance === null) ? 1 : (state.radar.wallDistance/150 - 1),
      _this.enemyPosTankAngle,
      _this.collisionTimer,
      bulletDistance,
      _this.enemyFound,
    ]

    // reward
    const totalScore = _this.getScore()
    const gameScoreReward = totalScore - _this.lastScore
    _this.lastScore = totalScore
    const energyReward = state.energy - _this.lastEnergy + state.energy * 0.001
    _this.lastEnergy = state.energy
    const collisionReward = (state.collisions.wall || state.collisions.enemy || state.collisions.ally) ? -1 : 0

    const rewards = [gameScoreReward, radarReward, energyReward, collisionReward, _this.getBulletDistanceScore()]
    const actions = agent.act(input, rewards, _this.getScoreCorrections())
    control.TURN = actions[0]
    control.THROTTLE = actions[1]
    control.GUN_TURN = actions[2]
    control.RADAR_TURN = actions[3]
    control.SHOOT = (_this.enemyPosGunAngle > -1 && _this.enemyPosGunAngle < 1) ? 0.1 : 0
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