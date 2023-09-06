import Simulation from "jsbattle-engine/src/engine/Simulation";

export default class SimEnv extends Simulation {
  constructor(renderer, debug) {
    super(renderer, debug)
    this.stepCounter = 0
    this.scoreCorrectionQueue = []
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
  }

}