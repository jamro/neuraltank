export default function(jsBattle, sim, tankLogic) {
  const bx = (sim.battlefield.minX + sim.battlefield.maxX)/2
  const by = (sim.battlefield.minY + sim.battlefield.maxY)/2;

  const opponentCode = `importScripts('lib/tank.js');
    tank.init(function(settings, info) {

    })
    tank.loop(function(state, control) {
      if(state.radar.targetingAlarm) {
        control.THROTTLE = 0.5
        control.TURN = (300-(state.radar.wallDistance || 300))/150
      } else {
        control.THROTTLE = 0
        control.TURN = 0
      }

      if(state.collisions.wall || state.collisions.enemy || state.collisions.ally) {
        control.THROTTLE = 0
        control.TURN = 1
      }
    });`
  
  let opponent
  let opponentTank

  opponent = jsBattle.createAiDefinition();
  opponent.fromCode('opponent', opponentCode);
  opponent.disableSandbox()
  opponentTank = sim.addTank(opponent).tank
  opponentTank.moveTo(
    bx -310 + 20 * Math.random(), 
    by - 50 - 50 * Math.random(),
    -15 + 90*Math.random()
  )

  tankLogic.tankModel.moveTo(bx-330+60*Math.random(), by+100, -80+20*Math.random())
}
