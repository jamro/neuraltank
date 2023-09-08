import Simulation from "jsbattle-engine/src/engine/Simulation";

export default class SimEnv extends Simulation {
  constructor(renderer, debug) {
    super(renderer, debug)
    this.stepCounter = 0
    this.scoreCorrectionQueue = []
    this.bulletDistanceScore = 0
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
    this.bulletDistanceScore = 500/bulletDistance-0.1
  }

}