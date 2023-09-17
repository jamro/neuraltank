export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const opponentCode = `importScripts('lib/tank.js');
    let speed = 0
    let boost = 0
    tank.init(function(settings, info) {

    })
    tank.loop(function(state, control) {
      if(state.radar.targetingAlarm) {
        speed = Math.min(1, speed + 0.01)
        if(speed === 1) {
          boost = Math.min(1, boost + 0.001)
        } else {
          boost = 0
        }
        control.THROTTLE = speed
        control.TURN = (300-(state.radar.wallDistance || 300))/150
        control.BOOST = Math.random() < boost ? 1 : 0
      } else {
        control.THROTTLE = 0
        control.TURN = 0
        control.BOOST = 0
        speed = 0
        boost = 0
      }

      if(state.collisions.wall || state.collisions.enemy || state.collisions.ally) {
        control.THROTTLE = 0
        control.TURN = 1
        control.BOOST = 0
      }
    });`
  
  let opponent
  let opponentTank

  opponent = jsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = sim.addTank(opponent).tank
  opponentTank.moveTo(
    bx + -300, 
    by - 100,
    -15 + 30*Math.random()
  )

  tankLogic.tankModel.moveTo(bx-300, by, -90)
}
