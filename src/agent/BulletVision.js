import { i } from "mathjs"

export default class BulletVision {

  constructor() {
    this.bulletMap = {}
    this.nearestAccurateBullet = null
  }

  updateState(tankState) {
    // predict position
    let knownBullets = Object.keys(this.bulletMap)
    for(let bulletId of knownBullets) {
      let bullet = this.bulletMap[bulletId]
      const a = bullet.angle * (Math.PI/180)
      bullet.x += bullet.speed * Math.cos(a)
      bullet.y += bullet.speed * Math.sin(a)
    }

    // update with data from latest scan
    const spottedBullets = tankState.radar.bullets
    for(let bullet of spottedBullets) {
      if(this.bulletMap[bullet.id]) {
        this.bulletMap[bullet.id].angle = bullet.angle
        this.bulletMap[bullet.id].damage = bullet.damage
        this.bulletMap[bullet.id].speed = bullet.speed
        this.bulletMap[bullet.id].x = bullet.x
        this.bulletMap[bullet.id].y = bullet.y
      } else {
        this.bulletMap[bullet.id] = {
          ...bullet
        }
      }
    }

    // augment the data
    knownBullets = Object.keys(this.bulletMap)
    this.nearestAccurateBullet = null
    for(let bulletId of knownBullets) {
      let bullet = this.bulletMap[bulletId]
      let dx = bullet.x - tankState.x
      let dy = bullet.y - tankState.y
      bullet.distance = Math.sqrt(dx*dx + dy*dy)
      if(bullet.distance > 400) {
        delete this.bulletMap[bulletId]
        continue
      }
      const a = bullet.angle * (Math.PI/180)
      const stepX = bullet.speed * Math.cos(a)
      const stepY = bullet.speed * Math.sin(a)
      const stepsToHit = Math.ceil(bullet.distance/bullet.speed)
      const hitX = bullet.x + stepsToHit * stepX
      const hitY = bullet.y + stepsToHit * stepY
      dx = hitX - tankState.x
      dy = hitY - tankState.y
      bullet.hitDistance = Math.sqrt(dx*dx + dy*dy)

      if(bullet.hitDistance > 20) {
        delete this.bulletMap[bulletId]
        continue
      }
      if(this.nearestAccurateBullet == null || bullet.distance < this.nearestAccurateBullet.distance) {
        this.nearestAccurateBullet = bullet
      }
    }
  }
}