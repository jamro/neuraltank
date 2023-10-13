import Simulation from "jsbattle-engine/src/engine/Simulation";
import { distance } from "mathjs";

export default class SimEnv extends Simulation {
  constructor(renderer, debug) {
    super(renderer, debug)
    this.stepCounter = 0
    this.scoreCorrectionQueue = []
    this.bulletDistanceScore = 0
    this.tankDistance = 1000
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

  _updateModel() {
    super._updateModel()
    this.stepCounter++

    // calculate enemy bullet distance
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
    if(bulletDistance === 1000000) {
      this.bulletDistanceScore += (0 - this.bulletDistanceScore)/5
    } else {
      this.bulletDistanceScore += (2/Math.sqrt(bulletDistance) - this.bulletDistanceScore)/5
    }

    // calculate distance to enemy tank
    let neuralTank = null
    for(let tank of this._tankList) {
      if(!tank) continue
      if(tank.name === 'neuraltank') {
        neuralTank = tank
        break;
      }
    }

    let minDistance = 500
    for(let tank of this._tankList) {
      if(!tank || !neuralTank) continue
      if(tank.name === 'neuraltank') {
        continue;
      }
      let dx = tank.x - neuralTank.x
      let dy = tank.y - neuralTank.y
      let distance = Math.sqrt(dx*dx + dy*dy)
      minDistance = Math.min(minDistance, distance)
    }
    this.tankDistance = minDistance
    
  }

}