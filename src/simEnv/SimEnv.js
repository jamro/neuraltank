import Simulation from "jsbattle-engine/src/engine/Simulation";

const INIT_BULLET_SCORE = -0.01

export default class SimEnv extends Simulation {
  constructor(renderer, debug) {
    super(renderer, debug)
    this.stepCounter = 0
    this.scoreCorrectionQueue = []
    this.bulletDistanceScore = INIT_BULLET_SCORE
  }

  _createBullet(owner, power) {
    const bullet = super._createBullet(owner, power)

    if(bullet.owner.name === 'neuraltank') {
      const onEnemyHitOrig = bullet.onEnemyHit.bind(bullet)
      bullet.onEnemyHit = (enemy) => {
        if(enemy.name !== 'neuraltank') {
          const damage = 10*bullet.power + 3*bullet.power*bullet.power
          this.scoreCorrectionQueue.push({
            sourceTime: this.stepCounter,
            targetTime: bullet.shootTime,
            value: damage
          })
        }
        onEnemyHitOrig(enemy)
      }
      bullet.shootTime = this.stepCounter
    }
    return bullet;
  }

  _simulationStep() {
    super._simulationStep()
    this.stepCounter++

    let bulletDistance = 1000000
    for(let bullet of this._bulletList) {
      if(!bullet) continue
      if(bullet.exploded) continue
      if(bullet.owner.name !== 'neuraltank') continue
      if(!bullet.age) bullet.age = 0
      bullet.age++
      if(bullet.age > 70) continue
      
      let distance = 1000000

      for(let tank of this._tankList) {
        if(!tank) continue
        if(tank.name === 'neuraltank') continue

        const dx = tank.x - bullet.x
        const dy = tank.y - bullet.y
        const tankDistance = (dx*dx + dy*dy)
        distance = Math.min(distance, tankDistance)
      }
      bulletDistance = Math.min(bulletDistance, distance)
    }
    this.bulletDistanceScore += (20/Math.sqrt(bulletDistance) + INIT_BULLET_SCORE - this.bulletDistanceScore)/5
  }

}